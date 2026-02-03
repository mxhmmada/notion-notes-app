import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { X, FileText, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Search pages and blocks
  const { data: searchData } = trpc.search.query.useQuery(
    { query },
    { enabled: isOpen && query.length > 0 }
  );
  const searchResults = [
    ...(searchData?.pages || []).map((p: any) => ({ ...p, type: "page" })),
    ...(searchData?.blocks || []).map((b: any) => ({ ...b, type: "block" })),
  ];

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSelectResult = (result: { type: string; id: string; pageId?: string; title: string; content?: string }) => {
    if (result.type === "page") {
      setLocation(`/page/${result.id}`);
    } else if (result.type === "block") {
      setLocation(`/page/${result.pageId}`);
      // TODO: Scroll to block
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <div className="bg-background border border-border rounded-lg shadow-lg w-96 max-h-96 flex flex-col">
        {/* Search Input */}
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Input
            ref={inputRef}
            placeholder="Search pages and blocks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border-0 focus:ring-0 p-0"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {query.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Type to search pages and blocks
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No results found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {searchResults.map((result: any) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelectResult(result)}
                  className="w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors flex items-start gap-3"
                >
                  {result.pageId ? (
                    <Type className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {result.title}
                    </p>
                    {result.type === "block" && result.content && (
                      <p className="text-xs text-muted-foreground truncate">
                        {result.content}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
