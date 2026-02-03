import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Block from "./Block";

interface DraggableBlockProps {
  block: any;
  index: number;
  totalBlocks: number;
  onChange: (updates: any) => void;
  onDelete: () => void;
  onReorder: (toIndex: number) => void;
  onAddBlockAfter: () => void;
}

export default function DraggableBlock({
  block,
  index,
  totalBlocks,
  onChange,
  onDelete,
  onReorder,
  onAddBlockAfter,
}: DraggableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Block
        block={block}
        index={index}
        totalBlocks={totalBlocks}
        onChange={onChange}
        onDelete={onDelete}
        onReorder={onReorder}
        onAddBlockAfter={onAddBlockAfter}
        dragHandleRef={setActivatorNodeRef}
        dragListeners={listeners}
      />
    </div>
  );
}
