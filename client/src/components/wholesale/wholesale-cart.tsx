import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { Product } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface CartItem {
  quantity: number;
  unitPrice: number;
}

export function WholesaleCart() {
  const [cartItems, setCartItems] = useState<Record<string, CartItem>>({});
  const [, setLocation] = useLocation();

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('wholesale_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const cartTotal = Object.entries(cartItems).reduce((total, [productId, item]) => {
    return total + (item.quantity * item.unitPrice);
  }, 0);

  const cartItemCount = Object.values(cartItems).reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  return (
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
  );
}
