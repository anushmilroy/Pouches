import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, Truck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Product, ShippingMethod } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface CartItem {
  quantity: number;
  unitPrice: number;
}

export default function WholesaleCheckout() {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<Record<string, CartItem>>({});
  const [, setLocation] = useLocation();

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('wholesale_cart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      // Calculate total quantity
      const totalQuantity = Object.values(cart).reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
      if (totalQuantity < 100) {
        toast({
          title: "Minimum Order Quantity",
          description: "Total order quantity must be at least 100 units",
          variant: "destructive",
        });
        setLocation("/wholesale");
        return;
      }
      setCartItems(cart);
    } else {
      setLocation("/wholesale");
    }
  }, []);

  const subtotal = Object.entries(cartItems).reduce((total, [productId, item]) => {
    return total + (item.quantity * item.unitPrice);
  }, 0);

  const shippingCost = ShippingMethod.WHOLESALE.price;
  const total = subtotal + shippingCost;

  const totalQuantity = Object.values(cartItems).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Wholesale Checkout</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(cartItems).map(([productId, item]) => {
                  const product = products?.find(p => p.id === parseInt(productId));
                  return (
                    <div key={productId} className="flex justify-between items-start">
                      <div className="flex items-start">
                        <Package className="h-5 w-5 mr-2 mt-1" />
                        <div>
                          <p className="font-medium">{product?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} units @ ${item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </p>
                    </div>
                  );
                })}

                <Separator />

                {/* Total Quantity */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Total Quantity</p>
                    <p className="text-sm text-muted-foreground">
                      Minimum order: 100 units
                    </p>
                  </div>
                  <p className="font-medium">{totalQuantity} units</p>
                </div>

                <Separator />

                {/* Shipping */}
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <Truck className="h-5 w-5 mr-2 mt-1" />
                    <div>
                      <p className="font-medium">{ShippingMethod.WHOLESALE.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {ShippingMethod.WHOLESALE.description}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">${shippingCost.toFixed(2)}</p>
                </div>

                <Separator />

                {/* Total */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="text-sm">${subtotal.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-muted-foreground">Shipping</p>
                    <p className="text-sm">${shippingCost.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between font-bold">
                    <p>Total</p>
                    <p>${total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle>Wholesale Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    toast({
                      title: "Wholesale Loan Request",
                      description: "Request a wholesale loan to complete this order",
                    });
                  }}
                >
                  Request Wholesale Loan
                </Button>
                <Separator />
                <p className="text-sm text-muted-foreground">
                  Contact your account manager for more information about wholesale loans and payment options.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}