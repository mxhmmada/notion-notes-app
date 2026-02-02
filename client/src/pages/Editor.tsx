import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Copy } from "lucide-react";
import EmojiPicker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import BlockEditor from "@/components/BlockEditor";
import PageBanner from "@/components/PageBanner";

export default function Editor() {
  const { pageId } = useParams();
  const { user } = useAuth();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Get current page
  const { data: page, isLoading: pageLoading } = trpc.pages.get.useQuery(
    { id: pageId || "" },
    { enabled: !!pageId }
  );

  // Get blocks for current page
  const { data: blocks = [] } = trpc.blocks.list.useQuery(
    { pageId: pageId || "" },
    { enabled: !!pageId }
  );

  const updatePageMutation = trpc.pages.update.useMutation();
  const deletePageMutation = trpc.pages.delete.useMutation();
  const createPageMutation = trpc.pages.create.useMutation();

  const handleTitleChange = useCallback((newTitle: string) => {
    if (pageId) {
      // Update local state immediately
      // updatePageMutation.mutate({ id: pageId, title: newTitle });
    }
  }, [pageId]);

  const handleIconChange = (emoji: string) => {
    if (pageId) {
      updatePageMutation.mutate({ id: pageId, icon: emoji });
    }
    setShowEmojiPicker(false);
  };

  const handleDeletePage = () => {
    if (pageId && confirm("Move this page to trash?")) {
      deletePageMutation.mutate({ id: pageId });
    }
  };

  const handleDuplicatePage = async () => {
    if (pageId && page) {
      const newPageId = await createPageMutation.mutateAsync({
        title: `${page.title} (Copy)`,
      });
      // In a real app, we'd also duplicate all blocks
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Select or create a page to start</p>
        <Button onClick={() => createPageMutation.mutate({})}>
          <Plus className="w-4 h-4 mr-2" />
          New Page
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="flex-1 overflow-y-auto">
          {/* Banner */}
          {page.bannerUrl && pageId && (
            <PageBanner url={page.bannerUrl} pageId={pageId} />
          )}

        {/* Page Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-8">
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-5xl hover:opacity-70 transition-all duration-150"
              >
                {page.icon || "📄"}
              </button>
              {showEmojiPicker && (
                <div className="absolute top-full left-0 z-50 mt-2">
                  <EmojiPicker
                    data={data}
                    onEmojiSelect={(emoji: any) => handleIconChange(emoji.native)}
                  />
                </div>
              )}
            </div>

            <div className="flex-1">
              <input
                type="text"
                value={page.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  handleTitleChange(newTitle);
                  if (pageId) {
                    updatePageMutation.mutate({ id: pageId, title: newTitle });
                  }
                }}
                className="page-title border-0 bg-transparent p-0 text-4xl font-bold placeholder-muted-foreground focus:outline-none w-full"
                placeholder="Untitled"
              />
            </div>

            {/* Page Actions */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDuplicatePage}
                title="Duplicate page"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeletePage}
                title="Delete page"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>

          {/* Block Editor */}
          {pageId && (
            <BlockEditor pageId={pageId} initialBlocks={blocks} />
          )}
        </div>
      </div>
    </div>
  );
}
