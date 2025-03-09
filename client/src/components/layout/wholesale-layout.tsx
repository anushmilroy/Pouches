import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { LogOut, ShoppingCart, Settings, Store, BookCheck, TrendingUp, Coins } from "lucide-react";

interface WholesaleLayoutProps {
  children: ReactNode;
}

export default function WholesaleLayout({ children }: WholesaleLayoutProps) {
  const { logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-50">
        <div className="container mx-auto px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div 
                className="cursor-pointer"
                onClick={() => setLocation("/wholesale")}
              >
                <img 
                  src="/attached_assets/BLACK POUCHES WORLDWIDE.png" 
                  alt="Pouches Worldwide" 
                  className="h-8 w-auto"
                />
              </div>
              <nav className="hidden md:flex items-center space-x-4">
                <Button
                  variant={location === "/wholesale/dashboard" ? "secondary" : "ghost"}
                  className="flex items-center"
                  onClick={() => setLocation("/wholesale/dashboard")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant={location === "/wholesale" ? "secondary" : "ghost"}
                  className="flex items-center"
                  onClick={() => setLocation("/wholesale")}
                >
                  <Store className="h-4 w-4 mr-2" />
                  Shop
                </Button>
                <Button
                  variant={location === "/wholesale/orders" ? "secondary" : "ghost"}
                  className="flex items-center"
                  onClick={() => setLocation("/wholesale/orders")}
                >
                  <BookCheck className="h-4 w-4 mr-2" />
                  Orders
                </Button>
                <Button
                  variant={location === "/wholesale/earnings" ? "secondary" : "ghost"}
                  className="flex items-center"
                  onClick={() => setLocation("/wholesale/earnings")}
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Earnings
                </Button>
                <Button
                  variant={location === "/wholesale/profile" ? "secondary" : "ghost"}
                  className="flex items-center"
                  onClick={() => setLocation("/wholesale/profile")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button
                  variant={location.startsWith("/wholesale/checkout") ? "secondary" : "ghost"}
                  className="flex items-center"
                  onClick={() => setLocation("/wholesale/checkout")}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart
                </Button>
              </nav>
            </div>
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

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}