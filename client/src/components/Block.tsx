import { useRef, useState, useCallback, useEffect } from "react";
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const blockIdRef = useRef(block.id);

  // Track if this is a new block (different ID)
  useEffect(() => {
    if (block.id !== blockIdRef.current) {
      blockIdRef.current = block.id;
      // New block - initialize content
      if (contentRef.current) {
        contentRef.current.textContent = block.content;
      }
    }
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
          onChange({ type: `heading${level}`, content: "" });
          e.preventDefault();
          return;
        }
      }

      // Bullet list shortcut
      if (trimmed === "-") {
        onChange({ type: "bulletList", content: "" });
        e.preventDefault();
        return;
      }

      // Numbered list shortcut
      if (trimmed === "1.") {
        onChange({ type: "numberedList", content: "" });
        e.preventDefault();
        return;
      }

      // Todo shortcut
      if (trimmed === "[]") {
        onChange({ type: "todo", content: "" });
        e.preventDefault();
        return;
      }

      // Quote shortcut
      if (trimmed === ">") {
        onChange({ type: "quote", content: "" });
        e.preventDefault();
        return;
      }

      // Code block shortcut
      if (trimmed === "```") {
        onChange({ type: "code", content: "" });
        e.preventDefault();
        return;
      }
    }
  }, [isComposing, saveToParent, onChange, index, onDelete, onAddBlockAfter]);

  // Handle input - update server debounced, but DON'T update React state
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (!isComposing && contentRef.current) {
      const text = contentRef.current.textContent || "";
      // Save to parent debounced - but don't update React state
      // This prevents React from re-rendering and resetting the DOM
      saveToParent(text);
    }
  }, [isComposing, saveToParent]);

  // Handle composition events (IME input)
  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => {
    setIsComposing(false);
    if (contentRef.current) {
      const text = contentRef.current.textContent || "";
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
      className: "",
      "data-placeholder": "",
    };

    switch (block.type) {
      case "heading1":
        return (
          <div
            key={`block-${block.id}`}
            {...commonProps}
            className={`${baseClasses} text-2xl font-bold`}
            data-placeholder="Heading 1"
          />
        );
      case "heading2":
        return (
          <div
            key={`block-${block.id}`}
            {...commonProps}
            className={`${baseClasses} text-xl font-bold`}
            data-placeholder="Heading 2"
          />
        );
      case "heading3":
        return (
          <div
            key={`block-${block.id}`}
            {...commonProps}
            className={`${baseClasses} text-lg font-bold`}
            data-placeholder="Heading 3"
          />
        );
      case "bulletList":
        return (
          <div key={`block-${block.id}`} className="flex gap-2">
            <span className="text-muted-foreground flex-shrink-0">•</span>
            <div
              {...commonProps}
              className={baseClasses}
              data-placeholder="List item"
            />
          </div>
        );
      case "numberedList":
        return (
          <div key={`block-${block.id}`} className="flex gap-2">
            <span className="text-muted-foreground flex-shrink-0">{index + 1}.</span>
            <div
              {...commonProps}
              className={baseClasses}
              data-placeholder="List item"
            />
          </div>
        );
      case "todo":
        return (
          <div key={`block-${block.id}`} className="flex gap-2 items-start">
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
            />
          </div>
        );
      case "quote":
        return (
          <div key={`block-${block.id}`} className="flex gap-2 border-l-4 border-muted pl-4">
            <div
              {...commonProps}
              className={`${baseClasses} italic text-muted-foreground`}
              data-placeholder="Quote"
            />
          </div>
        );
      case "code":
        return (
          <pre key={`block-${block.id}`} className="bg-muted p-3 rounded overflow-x-auto">
            <code
              {...commonProps}
              className={`${baseClasses} font-mono text-sm`}
              data-placeholder="Code"
            />
          </pre>
        );
      case "divider":
        return (
          <hr
            key={`block-${block.id}`}
            className="my-4 border-border"
          />
        );
      default:
        return (
          <div
            key={`block-${block.id}`}
            {...commonProps}
            className={baseClasses}
            data-placeholder="Type '/' for commands"
          />
        );
    }
  };

  return (
    <div className="group relative flex items-start gap-2 py-1">
      {/* Drag handle */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-1">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
      </div>

      {/* Block content */}
      <div className="flex-1 min-w-0">
        {renderBlockContent()}
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
