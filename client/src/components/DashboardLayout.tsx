import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LogOut, ChevronLeft, Plus, Trash2, Settings, Search } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SearchModal from "./SearchModal";
import SettingsPanel from "./SettingsPanel";

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [location, setLocation] = useLocation();

  // Get pages from tRPC
  const { data: pages = [] } = trpc.pages.list.useQuery();
  const createPageMutation = trpc.pages.create.useMutation({
    onSuccess: (newPage) => {
      setLocation(`/page/${newPage.id}`);
    },
  });

  const { toggleSidebar } = useSidebar();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Handle sidebar resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;

      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Button onClick={() => (window.location.href = getLoginUrl())}>
          Sign in with Manus
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0">
          {/* Account Section - Top Fixed */}
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border shrink-0">
                <AvatarFallback className="text-xs font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed ? (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="px-2 py-2 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettingsPanel(true)}
              className={cn("w-full", isCollapsed ? "justify-center px-0" : "justify-start")}
              title="Settings"
            >
              <Settings className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Settings"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearchModal(true)}
              className={cn("w-full", isCollapsed ? "justify-center px-0" : "justify-start")}
              title="Search"
            >
              <Search className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Search"}
            </Button>
          </div>

          {/* Pages List - Scrollable Middle */}
          <SidebarContent className="gap-0 flex-1 overflow-y-auto px-2 py-1">
            <SidebarMenu className="space-y-1">
              {pages.map((page) => {
                const isActive = location === `/page/${page.id}`;
                return (
                  <SidebarMenuItem key={page.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(`/page/${page.id}`)}
                      tooltip={page.title}
                      className={cn("h-10 transition-all font-normal", isCollapsed && "justify-center px-0")}
                    >
                      <span className="text-lg">{page.icon || "📄"}</span>
                      {!isCollapsed && (
                        <span className="truncate">{page.title}</span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          {/* Bottom Controls - Fixed */}
          <div className="px-2 py-3 border-t border-border space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => createPageMutation.mutate({})}
              className={cn("w-full", isCollapsed ? "justify-center px-0" : "justify-start")}
              title={isCollapsed ? "New Page" : undefined}
            >
              <Plus className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "New Page"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/trash")}
              className={cn("w-full", isCollapsed ? "justify-center px-0" : "justify-start")}
              title={isCollapsed ? "Trash" : undefined}
            >
              <Trash2 className={cn("w-4 h-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && "Trash"}
            </Button>
          </div>

          {/* Collapse Button - Bottom Right */}
          <SidebarFooter className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
            onClick={() => {
              setIsCollapsed(!isCollapsed);
              toggleSidebar();
            }}
            className="w-full justify-center"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
            </Button>
          </SidebarFooter>
        </Sidebar>
      </div>

      {/* Main Content */}
      <SidebarInset>{children}</SidebarInset>

      {/* Modals */}
      <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
      <SettingsPanel isOpen={showSettingsPanel} onClose={() => setShowSettingsPanel(false)} />
    </>
  );
}
