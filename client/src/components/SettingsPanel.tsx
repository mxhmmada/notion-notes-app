import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun, X } from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <div className="bg-background border border-border rounded-lg shadow-lg w-96 max-h-96 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Theme Toggle */}
          {switchable && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Appearance</p>
                <p className="text-xs text-muted-foreground">
                  {theme === "light" ? "Light mode" : "Dark mode"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="gap-2"
              >
                {theme === "light" ? (
                  <>
                    <Moon className="w-4 h-4" />
                    Dark
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4" />
                    Light
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Placeholder sections */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-medium mb-2">Account</p>
            <p className="text-xs text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm font-medium mb-2">Notifications</p>
            <p className="text-xs text-muted-foreground">
              Control notification preferences
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
