import { ReactNode, useState } from "react";
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

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const handleTabChange = (href: string, tab: string) => {
    setLocation(href);
    // Set the default tab in the URL hash
    window.location.hash = tab;
  };

  const menuItems = [
    { label: "Overview", href: "/admin", tab: "overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Wholesale Accounts", href: "/admin", tab: "wholesale", icon: <Users className="h-4 w-4" /> },
    { label: "Distributors", href: "/admin", tab: "distributors", icon: <Boxes className="h-4 w-4" /> },
    { label: "Promotions", href: "/admin", tab: "promotions", icon: <Gift className="h-4 w-4" /> },
    { label: "Orders", href: "/admin", tab: "orders", icon: <ClipboardList className="h-4 w-4" /> },
    { label: "Consignments", href: "/admin", tab: "consignments", icon: <Package className="h-4 w-4" /> },
    { label: "Referrals", href: "/admin", tab: "referrals", icon: <Share2 className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with navigation */}
      <header className="border-b border-border py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <Logo className="h-8 flex-shrink-0" />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 overflow-x-auto">
              {menuItems.map((item) => (
                <Button
                  key={item.tab}
                  variant={window.location.hash === `#${item.tab}` ? "secondary" : "ghost"}
                  onClick={() => handleTabChange(item.href, item.tab)}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {item.icon}
                  <span className="ml-1.5 text-sm">{item.label}</span>
                </Button>
              ))}
            </nav>

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
                        variant={window.location.hash === `#${item.tab}` ? "secondary" : "ghost"}
                        onClick={() => {
                          handleTabChange(item.href, item.tab);
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