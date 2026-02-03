import { useRef, useEffect, useState, useCallback } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlockProps {
  block: any;
  index: number;
  totalBlocks: number;
  onChange: (updates: any) => void;
  onDelete: () => void;
  onReorder: (toIndex: number) => void;
  onAddBlockAfter: () => void;
}

export default function Block({
  block,
  index,
  totalBlocks,
  onChange,
  onDelete,
  onReorder,
  onAddBlockAfter,
}: BlockProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  // Block-local state to prevent re-renders from parent
  const [localContent, setLocalContent] = useState(block.content);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Only update local content when block.id changes (new block), not on every parent render
  useEffect(() => {
    setLocalContent(block.content);
  }, [block.id]);

  // Debounced save to parent
  const saveToParent = useCallback((content: string, updates?: any) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      onChange({ content, ...updates });
    }, 300);
  }, [onChange]);

  // Handle markdown shortcuts and special keys
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isComposing) return;

    const target = e.currentTarget;
    const text = target.textContent || "";
    const selection = window.getSelection();

    // Enter key - create new block
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      
      // Save current content
      const content = target.textContent || "";
      setLocalContent(content);
      saveToParent(content);
      
      // Create new block
      onAddBlockAfter();
      return;
    }

    // Shift+Enter - soft line break
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertHTML", false, "<br>");
      return;
    }

    // Backspace on empty block - merge with previous
    if (e.key === "Backspace" && text === "" && index > 0) {
      e.preventDefault();
      onDelete();
      return;
    }

    // Tab - indent (placeholder)
    if (e.key === "Tab") {
      e.preventDefault();
      // TODO: Implement indentation
    }

    // Markdown shortcuts detection (on space after typing)
    if (e.key === " " && text.trim()) {
      const trimmed = text.trim();

      // Heading shortcuts
      if (trimmed.match(/^#+$/)) {
        const level = trimmed.length;
        if (level <= 3) {
          setLocalContent("");
          onChange({ type: `heading${level}`, content: "" });
          e.preventDefault();
          return;
        }
      }

      // Bullet list
      if (trimmed === "-" || trimmed === "*") {
        setLocalContent("");
        onChange({ type: "bulletList", content: "" });
        e.preventDefault();
        return;
      }

      // Numbered list
      if (trimmed === "1.") {
        setLocalContent("");
        onChange({ type: "numberedList", content: "" });
        e.preventDefault();
        return;
      }

      // Todo checkbox
      if (trimmed === "[]") {
        setLocalContent("");
        onChange({ type: "todo", content: "", isCompleted: false });
        e.preventDefault();
        return;
      }

      // Quote
      if (trimmed === ">") {
        setLocalContent("");
        onChange({ type: "quote", content: "" });
        e.preventDefault();
        return;
      }

      // Code block
      if (trimmed === "```") {
        setLocalContent("");
        onChange({ type: "code", content: "" });
        e.preventDefault();
        return;
      }

      // Divider
      if (trimmed === "---" || trimmed === "***") {
        setLocalContent("");
        onChange({ type: "divider", content: "" });
        e.preventDefault();
        return;
      }
    }
  }, [isComposing, index, onChange, onDelete, onAddBlockAfter, saveToParent]);

  // Handle input - update local state immediately, save to parent debounced
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (!isComposing && contentRef.current) {
      const text = contentRef.current.textContent || "";
      // Update local state immediately for instant feedback
      setLocalContent(text);
      // Save to parent debounced
      saveToParent(text);
    }
  }, [isComposing, saveToParent]);

  // Handle composition events (IME input)
  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => {
    setIsComposing(false);
    if (contentRef.current) {
      const text = contentRef.current.textContent || "";
      setLocalContent(text);
      saveToParent(text);
    }
  };

  const renderBlockContent = () => {
    const baseClasses = "block-content w-full outline-none";

    const commonProps = {
      ref: contentRef,
      contentEditable: true,
      suppressContentEditableWarning: true,
      onKeyDown: handleKeyDown,
      onInput: handleInput,
      onCompositionStart: handleCompositionStart,
      onCompositionEnd: handleCompositionEnd,
      spellCheck: "true" as const,
      // Prevent re-renders from affecting focus
      key: `block-${block.id}`,
    };

    switch (block.type) {
      case "heading1":
        return (
          <div
            {...commonProps}
            className={`${baseClasses} text-2xl font-bold`}
            data-placeholder="Heading 1"
          >
            {localContent}
          </div>
        );
      case "heading2":
        return (
          <div
            {...commonProps}
            className={`${baseClasses} text-xl font-bold`}
            data-placeholder="Heading 2"
          >
            {localContent}
          </div>
        );
      case "heading3":
        return (
          <div
            {...commonProps}
            className={`${baseClasses} text-lg font-bold`}
            data-placeholder="Heading 3"
          >
            {localContent}
          </div>
        );
      case "bulletList":
        return (
          <div className="flex gap-2">
            <span className="text-muted-foreground flex-shrink-0">•</span>
            <div
              {...commonProps}
              className={baseClasses}
              data-placeholder="List item"
            >
              {localContent}
            </div>
          </div>
        );
      case "numberedList":
        return (
          <div className="flex gap-2">
            <span className="text-muted-foreground flex-shrink-0">{index + 1}.</span>
            <div
              {...commonProps}
              className={baseClasses}
              data-placeholder="List item"
            >
              {localContent}
            </div>
          </div>
        );
      case "todo":
        return (
          <div className="flex gap-2 items-start">
            <input
              type="checkbox"
              checked={block.isCompleted}
              onChange={(e) => onChange({ isCompleted: e.target.checked })}
              className="mt-1 flex-shrink-0"
            />
            <div
              {...commonProps}
              className={`${baseClasses} ${
                block.isCompleted ? "line-through text-muted-foreground" : ""
              }`}
              data-placeholder="To-do"
            >
              {localContent}
            </div>
          </div>
        );
      case "quote":
        return (
          <div className="flex gap-2 border-l-4 border-muted pl-4">
            <div
              {...commonProps}
              className={`${baseClasses} italic text-muted-foreground`}
              data-placeholder="Quote"
            >
              {localContent}
            </div>
          </div>
        );
      case "code":
        return (
          <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
            <code
              {...commonProps}
              className={`${baseClasses} font-mono text-sm`}
              data-placeholder="Code"
            >
              {localContent}
            </code>
          </pre>
        );
      case "divider":
        return <div className="h-px bg-border my-2" />;
      default:
        return (
          <div
            {...commonProps}
            className={baseClasses}
            data-placeholder="Type '/' for commands..."
          >
            {localContent}
          </div>
        );
    }
  };

  return (
    <div className="group flex items-start gap-2 py-1 hover:bg-muted/50 rounded px-2 transition-all duration-150">
      {/* Drag Handle */}
      <div className="opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-grab active:cursor-grabbing pt-1">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Block Content */}
      <div className="flex-1 min-w-0">{renderBlockContent()}</div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-all duration-150"
      >
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  );
}
