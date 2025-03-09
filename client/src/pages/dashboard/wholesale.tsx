import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Package, ShoppingCart, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { EarningsSection } from "@/components/earnings-section";
import { BankDetailsForm } from "@/components/bank-details-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Separator } from "@/components/ui/separator";

// Function to calculate wholesale price based on quantity
function calculateWholesalePrice(quantity: number): number | null {
  if (quantity < 100) return null; // Minimum order quantity
  if (quantity >= 25000) return 5.00; // TIER_7
  if (quantity >= 10000) return 5.50; // TIER_6
  if (quantity >= 5000) return 6.00;  // TIER_5
  if (quantity >= 1000) return 6.50;  // TIER_4
  if (quantity >= 500) return 7.00;   // TIER_3
  if (quantity >= 250) return 7.50;   // TIER_2
  return 8.00; // TIER_1 (100-249)
}

interface CartItem {
  quantity: number;
  unitPrice: number;
}

export default function WholesaleDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [isOrdering, setIsOrdering] = useState(false);
  const [cartItems, setCartItems] = useState<Record<string, CartItem>>({});
  const [, setLocation] = useLocation();

  // Check if user has bank details
  const needsBankDetails = !user?.bankDetails;

  // Update the useQuery to filter wholesale products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/wholesale"],
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('wholesale_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const handleQuantityChange = (productId: number, value: string) => {
    const quantity = parseInt(value) || 0;
    setQuantities({ ...quantities, [productId]: quantity });
  };

  const addToCart = (productId: number) => {
    const quantity = quantities[productId] || 0;
    if (quantity < 100) {
      toast({
        title: "Invalid Quantity",
        description: "Minimum order quantity is 100 units",
        variant: "destructive",
      });
      return;
    }

    const wholesalePrice = calculateWholesalePrice(quantity);
    if (!wholesalePrice) {
      toast({
        title: "Price Calculation Error",
        description: "Could not calculate wholesale price for this quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      const newCart = {
        ...cartItems,
        [productId]: {
          quantity,
          unitPrice: wholesalePrice,
        }
      };

      setCartItems(newCart);
      localStorage.setItem('wholesale_cart', JSON.stringify(newCart));

      toast({
        title: "Added to Cart",
        description: `${quantity} units added at $${wholesalePrice.toFixed(2)} per unit`,
      });

      // Reset quantity input
      setQuantities({ ...quantities, [productId]: 100 });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const cartTotal = Object.entries(cartItems).reduce((total, [productId, item]) => {
    return total + (item.quantity * item.unitPrice);
  }, 0);

  const cartItemCount = Object.values(cartItems).reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  if (needsBankDetails) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-8">
          <h2 className="text-2xl font-bold mb-6">Welcome to Your Wholesale Account</h2>
          <p className="text-muted-foreground mb-8">
            To start earning commissions from referrals, please set up your bank account details first.
          </p>
          <BankDetailsForm />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Tabs defaultValue="shop" className="space-y-8">
        <TabsList>
          <TabsTrigger value="shop">Shop</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="earnings">Earnings & Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="shop">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Wholesale Products</CardTitle>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products?.map((product) => (
                        <Card key={product.id} className="flex flex-col">
                          <CardHeader>
                            <CardTitle className="flex items-center">
                              <Package className="h-5 w-5 mr-2" />
                              {product.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex-1">
                            <p className="text-sm text-muted-foreground mb-4">
                              {product.description}
                            </p>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Starting Price (100 units)</label>
                                <p className="text-lg font-bold">${calculateWholesalePrice(100)?.toFixed(2)}/unit</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Quantity (min. 100)</label>
                                <Input
                                  type="number"
                                  min="100"
                                  value={quantities[product.id] || 100}
                                  onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Current Unit Price</p>
                                <p className="text-lg font-bold">
                                  ${calculateWholesalePrice(quantities[product.id] || 0)?.toFixed(2) || 'N/A'}
                                </p>
                              </div>
                              <Button
                                className="w-full"
                                onClick={() => addToCart(product.id)}
                                disabled={!calculateWholesalePrice(quantities[product.id] || 0)}
                              >
                                Add to Cart
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Cart Section */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Cart ({cartItemCount} items)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(cartItems).map(([productId, item]) => {
                      const product = products?.find(p => p.id === parseInt(productId));
                      return (
                        <div key={productId} className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{product?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} units @ ${item.unitPrice.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-medium">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </p>
                        </div>
                      );
                    })}

                    {cartItemCount > 0 ? (
                      <>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <p className="font-medium">Total</p>
                          <p className="text-lg font-bold">${cartTotal.toFixed(2)}</p>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => setLocation("/wholesale/checkout")}
                        >
                          Checkout
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </>
                    ) : (
                      <p className="text-center text-muted-foreground">Your cart is empty</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          {/* Placeholder for dashboard content */}
        </TabsContent>

        <TabsContent value="earnings">
          <EarningsSection />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}