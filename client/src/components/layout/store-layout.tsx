import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingBag, UserCircle, Settings, Package, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NicotineStrength, UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Logo from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StoreLayoutProps {
  children: ReactNode;
}

export default function StoreLayout({ children }: StoreLayoutProps) {
  const [location, setLocation] = useLocation();
  const [cartItemCount, setCartItemCount] = useState(0);
  const { user, logoutMutation } = useAuth();

  // Update cart count whenever localStorage changes
  useEffect(() => {
    const updateCartCount = () => {
      const cartKey = user?.role === UserRole.WHOLESALE ? 'wholesale_cart' : 'cart';
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        const cart = JSON.parse(savedCart) as Record<string, { quantity: number, strength: keyof typeof NicotineStrength }>;
        const total = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
        setCartItemCount(total);
      } else {
        setCartItemCount(0);
      }
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, [user?.role]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            {/* Logo and main navigation */}
            <div className="flex items-center space-x-8">
              <div className="cursor-pointer" onClick={() => setLocation("/")}>
                <Logo />
              </div>
              <nav className="hidden md:flex items-center space-x-4">
                {user?.role !== UserRole.WHOLESALE && (
                  <>
                    <Button variant="ghost" onClick={() => setLocation("/")}>
                      Home
                    </Button>
                    <Button variant="ghost" onClick={() => setLocation("/shop")}>
                      Shop
                    </Button>
                  </>
                )}
              </nav>
            </div>

            {/* Auth and cart */}
            <div className="flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <UserCircle className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLocation("/retail/settings")}>
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/retail/orders")}>
                      <Package className="h-4 w-4 mr-2" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/retail/earnings")}>
                      <Wallet className="h-4 w-4 mr-2" />
                      My Earnings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => logoutMutation.mutate()}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation("/auth")}
                >
                  <UserCircle className="h-5 w-5" />
                </Button>
              )}

              {user?.role !== UserRole.WHOLESALE && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLocation("/checkout")}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <Badge 
                        variant="default" 
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {cartItemCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 bg-background">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">About Us</h3>
              <p className="text-muted-foreground">
                Your one-stop destination for quality pouches. We provide wholesale and retail solutions worldwide.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                {user?.role !== UserRole.WHOLESALE && (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-muted-foreground"
                    onClick={() => setLocation("/shop")}
                  >
                    Shop
                  </Button>
                )}
                <br />
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-muted-foreground"
                  onClick={() => setLocation("/auth")}
                >
                  Wholesale Account
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <p className="text-muted-foreground">
                Have questions? Get in touch with our team.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}