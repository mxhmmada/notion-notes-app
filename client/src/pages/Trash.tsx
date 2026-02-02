import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw } from "lucide-react";
import { format } from "date-fns";

export default function Trash() {
  const { data: trashItems = [], refetch } = trpc.trash.list.useQuery();
  const restoreMutation = trpc.trash.restore.useMutation({
    onSuccess: () => refetch(),
  });
  const deleteMutation = trpc.trash.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleRestore = (id: string) => {
    restoreMutation.mutate({ id });
  };

  const handlePermanentlyDelete = (id: string) => {
    if (confirm("Permanently delete this item? This cannot be undone.")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="page-title mb-8">Trash</h1>

          {trashItems.length === 0 ? (
            <p className="text-muted-foreground">Your trash is empty</p>
          ) : (
            <div className="space-y-2">
              {trashItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-all duration-150"
                >
                  <div className="flex-1">
                    <p className="font-medium">{(item.pageData as any)?.title || "Untitled"}</p>
                    <p className="text-sm text-muted-foreground">
                      Deleted {format(new Date(item.deletedAt), "MMM d, yyyy")}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(item.id)}
                      disabled={restoreMutation.isPending}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePermanentlyDelete(item.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
