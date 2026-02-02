import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import Block from "./Block";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface BlockEditorProps {
  pageId: string;
  initialBlocks: any[];
}

export default function BlockEditor({ pageId, initialBlocks }: BlockEditorProps) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const createBlockMutation = trpc.blocks.create.useMutation();
  const updateBlockMutation = trpc.blocks.update.useMutation();
  const deleteBlockMutation = trpc.blocks.delete.useMutation();
  const reorderBlocksMutation = trpc.blocks.reorder.useMutation();

  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  const handleAddBlock = useCallback(async () => {
    const newBlockId = await createBlockMutation.mutateAsync({
      pageId,
      type: "paragraph",
      content: "",
      orderIndex: blocks.length,
    });

    setBlocks([...blocks, { id: newBlockId, type: "paragraph", content: "", orderIndex: blocks.length }]);
  }, [pageId, blocks, createBlockMutation]);

  const handleBlockChange = useCallback(
    (blockId: string, updates: any) => {
      setBlocks(blocks.map(b => b.id === blockId ? { ...b, ...updates } : b));
      updateBlockMutation.mutate({ id: blockId, pageId, ...updates });
    },
    [blocks, pageId, updateBlockMutation]
  );

  const handleBlockDelete = useCallback(
    (blockId: string) => {
      setBlocks(blocks.filter(b => b.id !== blockId));
      deleteBlockMutation.mutate({ id: blockId, pageId });
    },
    [blocks, pageId, deleteBlockMutation]
  );

  const handleBlockReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newBlocks = [...blocks];
      const [removed] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, removed);
      setBlocks(newBlocks);

      const blockIds = newBlocks.map(b => b.id);
      reorderBlocksMutation.mutate({ pageId, blockIds });
    },
    [blocks, pageId, reorderBlocksMutation]
  );

  return (
    <div className="space-y-1">
      {blocks.map((block, index) => (
        <Block
          key={block.id}
          block={block}
          index={index}
          totalBlocks={blocks.length}
          onChange={(updates) => handleBlockChange(block.id, updates)}
          onDelete={() => handleBlockDelete(block.id)}
          onReorder={(toIndex) => handleBlockReorder(index, toIndex)}
          onAddBlockAfter={() => {
            handleAddBlock();
          }}
        />
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={handleAddBlock}
        className="mt-4 text-muted-foreground hover:text-foreground"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add a block
      </Button>
    </div>
  );
}
