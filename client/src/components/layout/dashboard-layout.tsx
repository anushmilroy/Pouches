import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Wallet,
  TrendingUp,
} from "lucide-react";
import Logo from "@/components/logo";

interface SidebarLink {
  label: string;
  href: string;
  icon: ReactNode;
}

const roleLinks: Record<string, SidebarLink[]> = {
  admin: [
    { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Users", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
    { label: "Products", href: "/admin/products", icon: <Package className="h-5 w-5" /> },
    { label: "Orders", href: "/admin/orders", icon: <ShoppingCart className="h-5 w-5" /> },
  ],
  retail: [
    { label: "Dashboard", href: "/retail", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Products", href: "/retail/products", icon: <Package className="h-5 w-5" /> },
    { label: "Orders", href: "/retail/orders", icon: <ShoppingCart className="h-5 w-5" /> },
  ],
  wholesale: [
    { label: "Dashboard", href: "/wholesale", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Products", href: "/wholesale/products", icon: <Package className="h-5 w-5" /> },
    { label: "Orders", href: "/wholesale/orders", icon: <ShoppingCart className="h-5 w-5" /> },
    { label: "Commissions", href: "/wholesale/commissions", icon: <Wallet className="h-5 w-5" /> },
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

  if (!user) return null;

  const links = roleLinks[user.role] || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with navigation */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Logo className="h-8" />
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-2">
              {links.map((link) => (
                <Button
                  key={link.href}
                  variant={location === link.href ? "secondary" : "ghost"}
                  onClick={() => setLocation(link.href)}
                  className="flex items-center"
                >
                  {link.icon}
                  <span className="ml-2">{link.label}</span>
                </Button>
              ))}
            </nav>

            {/* Logout button */}
            <Button
              variant="ghost"
              className="flex items-center text-destructive hover:text-destructive"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">
            {links.find((link) => link.href === location)?.label || "Dashboard"}
          </h2>
        </div>
        {children}
      </main>
    </div>
  );
}