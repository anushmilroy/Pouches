import { ReactNode, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  CircleDollarSign,
  TrendingUp,
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

interface SidebarLink {
  label: string;
  href: string;
  icon: ReactNode;
}

const roleLinks: Record<string, SidebarLink[]> = {
  admin: [
    { label: "Overview", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Wholesale Accounts", href: "/admin/wholesale", icon: <Users className="h-5 w-5" /> },
    { label: "Distributors", href: "/admin/distributors", icon: <Boxes className="h-5 w-5" /> },
    { label: "Promotions", href: "/admin/promotions", icon: <Gift className="h-5 w-5" /> },
    { label: "Orders", href: "/admin/orders", icon: <ClipboardList className="h-5 w-5" /> },
    { label: "Consignments", href: "/admin/consignments", icon: <Package className="h-5 w-5" /> },
    { label: "Referrals", href: "/admin/referrals", icon: <Share2 className="h-5 w-5" /> },
  ],
  distributor: [
    { label: "Dashboard", href: "/distributor", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Orders", href: "/distributor/orders", icon: <ShoppingCart className="h-5 w-5" /> },
    { label: "Performance", href: "/distributor/performance", icon: <TrendingUp className="h-5 w-5" /> },
  ],
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const links = roleLinks[user.role] || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with navigation */}
      <header className="border-b border-border py-4">
        <div className="container mx-auto px-4">
          {/* Logo and desktop navigation */}
          <div className="flex items-center justify-between">
            <Logo className="h-8" />

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-2">
              {links.map((link) => (
                <Button
                  key={link.href}
                  variant={location === link.href ? "secondary" : "ghost"}
                  onClick={() => setLocation(link.href)}
                  size="sm"
                >
                  {link.icon}
                  <span className="ml-2">{link.label}</span>
                </Button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              {/* Desktop Logout */}
              <Button
                variant="ghost"
                className="hidden md:flex items-center text-destructive hover:text-destructive"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
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
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col space-y-2 mt-6">
                    {links.map((link) => (
                      <Button
                        key={link.href}
                        variant={location === link.href ? "secondary" : "ghost"}
                        onClick={() => {
                          setLocation(link.href);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full justify-start"
                      >
                        {link.icon}
                        <span className="ml-2">{link.label}</span>
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