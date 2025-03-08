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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <h1 className="text-lg font-semibold text-sidebar-foreground">Pouches Worldwide</h1>
        </div>
        <nav className="p-4 space-y-2">
          {links.map((link) => (
            <Button
              key={link.href}
              variant={location === link.href ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setLocation(link.href)}
            >
              {link.icon}
              <span className="ml-2">{link.label}</span>
            </Button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-background">
        <div className="h-16 border-b border-border flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold">
            {links.find((link) => link.href === location)?.label || "Dashboard"}
          </h2>
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
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}