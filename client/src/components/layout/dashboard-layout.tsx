import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  Users,
  LogOut,
  Menu,
  Boxes,
  Gift,
  ClipboardList,
  Share2,
} from "lucide-react";
import Logo from "@/components/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
  onTabChange?: (tab: string) => void;
}

export default function DashboardLayout({ children, onTabChange }: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from URL hash or default to overview
    return window.location.hash.replace("#", "") || "overview";
  });

  if (!user) return null;

  const menuItems = [
    { label: "Overview", tab: "overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Wholesale Accounts", tab: "wholesale", icon: <Users className="h-4 w-4" /> },
    { label: "Distributors", tab: "distributors", icon: <Boxes className="h-4 w-4" /> },
    { label: "Promotions", tab: "promotions", icon: <Gift className="h-4 w-4" /> },
    { label: "Orders", tab: "orders", icon: <ClipboardList className="h-4 w-4" /> },
    { label: "Consignments", tab: "consignments", icon: <Package className="h-4 w-4" /> },
    { label: "Referrals", tab: "referrals", icon: <Share2 className="h-4 w-4" /> },
  ];

  // Update active tab when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") || "overview";
      setActiveTab(hash);
      onTabChange?.(hash);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [onTabChange]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
    onTabChange?.(tab);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with navigation */}
      <header className="border-b py-2">
        <div className="container mx-auto px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <div className="cursor-pointer">
                <Logo />
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1 overflow-x-auto">
                {menuItems.map((item) => (
                  <Button
                    key={item.tab}
                    variant={activeTab === item.tab ? "secondary" : "ghost"}
                    onClick={() => handleTabChange(item.tab)}
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    {item.icon}
                    <span className="ml-1.5 text-sm">{item.label}</span>
                  </Button>
                ))}
              </nav>
            </div>

            {/* Right side with logout and mobile menu */}
            <div className="flex items-center space-x-4 ml-auto flex-shrink-0">
              {/* Desktop Logout */}
              <Button
                variant="ghost"
                className="hidden md:flex items-center text-destructive hover:text-destructive"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Logout
              </Button>

              {/* Mobile Menu Button */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader className="text-left">
                    <SheetTitle>Dashboard Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-1 mt-6">
                    {menuItems.map((item) => (
                      <Button
                        key={item.tab}
                        variant={activeTab === item.tab ? "secondary" : "ghost"}
                        onClick={() => {
                          handleTabChange(item.tab);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full justify-start"
                        size="sm"
                      >
                        {item.icon}
                        <span className="ml-2">{item.label}</span>
                      </Button>
                    ))}
                    <div className="pt-4 mt-4 border-t">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive"
                        onClick={() => {
                          logoutMutation.mutate();
                          setIsMobileMenuOpen(false);
                        }}
                        disabled={logoutMutation.isPending}
                        size="sm"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}