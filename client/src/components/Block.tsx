import { useRef, useEffect, useState } from "react";
import { GripVertical, Trash2, ChevronDown, ChevronRight } from "lucide-react";
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
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Handle markdown shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const content = contentRef.current?.textContent || "";

    // Enter key - create new block
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onAddBlockAfter();
      return;
    }

    // Shift+Enter - soft line break
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertHTML", false, "<br>");
      return;
    }

    // Tab - indent
    if (e.key === "Tab") {
      e.preventDefault();
      // TODO: Implement indentation
    }

    // Markdown shortcuts
    if (e.key === " " && content.trim()) {
      const trimmed = content.trim();

      // Heading shortcuts
      if (trimmed.startsWith("#")) {
        const level = trimmed.match(/^#+/)?.[0].length || 1;
        if (level <= 3) {
          onChange({ type: `heading${level}`, content: trimmed.slice(level + 1).trim() });
          e.preventDefault();
          return;
        }
      }

      // Bullet list
      if (trimmed === "-") {
        onChange({ type: "bulletList", content: "" });
        e.preventDefault();
        return;
      }

      // Numbered list
      if (trimmed === "1.") {
        onChange({ type: "numberedList", content: "" });
        e.preventDefault();
        return;
      }

      // Todo checkbox
      if (trimmed === "[]") {
        onChange({ type: "todo", content: "", isCompleted: false });
        e.preventDefault();
        return;
      }

      // Divider
      if (trimmed === "---") {
        onChange({ type: "divider", content: "" });
        e.preventDefault();
        return;
      }
    }
  };

  const handleInput = () => {
    const text = contentRef.current?.textContent || "";
    onChange({ content: text });
  };

  const renderBlockContent = () => {
    const baseClasses = "block-content w-full";

    switch (block.type) {
      case "heading1":
        return (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            className={`${baseClasses} text-2xl font-bold`}
            data-placeholder="Heading 1"
          >
            {block.content}
          </div>
        );
      case "heading2":
        return (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            className={`${baseClasses} text-xl font-bold`}
            data-placeholder="Heading 2"
          >
            {block.content}
          </div>
        );
      case "heading3":
        return (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            className={`${baseClasses} text-lg font-bold`}
            data-placeholder="Heading 3"
          >
            {block.content}
          </div>
        );
      case "bulletList":
        return (
          <div className="flex gap-2">
            <span className="text-muted-foreground">•</span>
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              className={baseClasses}
              data-placeholder="List item"
            >
              {block.content}
            </div>
          </div>
        );
      case "numberedList":
        return (
          <div className="flex gap-2">
            <span className="text-muted-foreground">{index + 1}.</span>
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              className={baseClasses}
              data-placeholder="List item"
            >
              {block.content}
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
              className="mt-1"
            />
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              className={`${baseClasses} ${block.isCompleted ? "line-through text-muted-foreground" : ""}`}
              data-placeholder="To-do"
            >
              {block.content}
            </div>
          </div>
        );
      case "quote":
        return (
          <div className="flex gap-2 border-l-4 border-muted pl-4">
            <div
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              className={`${baseClasses} italic text-muted-foreground`}
              data-placeholder="Quote"
            >
              {block.content}
            </div>
          </div>
        );
      case "code":
        return (
          <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
            <code
              ref={contentRef}
              contentEditable
              suppressContentEditableWarning
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              className={`${baseClasses} font-mono text-sm`}
              data-placeholder="Code"
            >
              {block.content}
            </code>
          </pre>
        );
      case "divider":
        return <div className="block-divider" />;
      default:
        return (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            className={baseClasses}
            data-placeholder="Type '/' for commands..."
          >
            {block.content}
          </div>
        );
    }
  };

  return (
    <div className="group flex items-start gap-2 py-1 hover:bg-muted/50 rounded px-2 transition-all duration-150">
      {/* Drag Handle */}
      <div className="block-drag-handle pt-1">
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
