import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import DraggableBlock from "./DraggableBlock";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface BlockEditorProps {
  pageId: string;
  initialBlocks: any[];
}

export default function BlockEditor({ pageId, initialBlocks }: BlockEditorProps) {
  // Initialize blocks once, never resync on prop changes
  const [blocks, setBlocks] = useState(() => initialBlocks);
  const blockRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const createBlockMutation = trpc.blocks.create.useMutation();
  const updateBlockMutation = trpc.blocks.update.useMutation();
  const deleteBlockMutation = trpc.blocks.delete.useMutation();
  const reorderBlocksMutation = trpc.blocks.reorder.useMutation();

  // Reset blocks when pageId changes (page switching)
  useEffect(() => {
    setBlocks(initialBlocks);
    // Clear block refs map when switching pages
    blockRefsMap.current.clear();
  }, [pageId, initialBlocks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddBlock = useCallback(async (index?: number) => {
    const insertIndex = typeof index === 'number' ? index + 1 : blocks.length;
    
    // Create block optimistically
    const newBlockId = `temp-${Date.now()}`;
    const newBlock = {
      id: newBlockId,
      type: "paragraph",
      content: "",
      orderIndex: insertIndex,
      pageId,
    };

    const newBlocks = [...blocks];
    newBlocks.splice(insertIndex, 0, newBlock);
    setBlocks(newBlocks);

    // Persist to server
    try {
      const result = await createBlockMutation.mutateAsync({
        pageId,
        type: "paragraph",
        content: "",
        orderIndex: insertIndex,
      });

      // Replace temp ID with real ID
      setBlocks((prevBlocks) =>
        prevBlocks.map((b) =>
          b.id === newBlockId ? { ...b, id: result.id } : b
        )
      );

      // Auto-focus new block using requestAnimationFrame for reliable DOM timing
      requestAnimationFrame(() => {
        const newBlockRef = blockRefsMap.current.get(result.id);
        if (newBlockRef) {
          newBlockRef.focus();
          // Move cursor to start
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(newBlockRef);
          range.collapse(true); // true means collapse to start
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      });
    } catch (error) {
      console.error("Failed to create block:", error);
      // Remove optimistic block on error
      setBlocks((prevBlocks) => prevBlocks.filter((b) => b.id !== newBlockId));
    }
  }, [pageId, blocks, createBlockMutation]);

  const handleBlockChange = useCallback(
    (blockId: string, updates: any) => {
      // Update local state immediately
      setBlocks((prevBlocks) =>
        prevBlocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
      );

      // Persist to server (debounced in real app)
      updateBlockMutation.mutate({ id: blockId, pageId, ...updates });
    },
    [pageId, updateBlockMutation]
  );

  const handleBlockDelete = useCallback(
    (blockId: string) => {
      const index = blocks.findIndex(b => b.id === blockId);
      
      // Remove from local state
      setBlocks((prevBlocks) => prevBlocks.filter((b) => b.id !== blockId));

      // Persist deletion
      deleteBlockMutation.mutate({ id: blockId, pageId });

      // Focus nearest block
      requestAnimationFrame(() => {
        const nearestBlock = blocks[index + 1] || blocks[index - 1];
        if (nearestBlock) {
          const ref = blockRefsMap.current.get(nearestBlock.id);
          if (ref) {
            ref.focus();
            // Move cursor to end
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(ref);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }
      });
    },
    [pageId, deleteBlockMutation, blocks]
  );

  const handleBlockReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newBlocks = [...blocks];
      const [removed] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, removed);
      setBlocks(newBlocks);

      const blockIds = newBlocks.map((b) => b.id);
      reorderBlocksMutation.mutate({ pageId, blockIds });
    },
    [blocks, pageId, reorderBlocksMutation]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        handleBlockReorder(oldIndex, newIndex);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {blocks.map((block, index) => (
            <DraggableBlock
              key={block.id}
              block={block}
              index={index}
              totalBlocks={blocks.length}
              onChange={(updates) => handleBlockChange(block.id, updates)}
              onDelete={() => handleBlockDelete(block.id)}
              onReorder={(toIndex) => handleBlockReorder(index, toIndex)}
              onAddBlockAfter={() => handleAddBlock(index)}
              blockRef={(el) => {
                if (el) blockRefsMap.current.set(block.id, el);
                else blockRefsMap.current.delete(block.id);
              }}
            />
          ))}
        </div>
      </SortableContext>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleAddBlock}
        className="mt-4 text-muted-foreground hover:text-foreground"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add a block
      </Button>
    </DndContext>
  );
}
