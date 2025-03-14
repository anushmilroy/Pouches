import { useState, useEffect } from "react";
import WholesaleLayout from "@/components/layout/wholesale-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, Truck, ChevronLeft, Minus, Plus, Trash2, FileText, Banknote, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Product, ShippingMethod, PaymentMethod } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { WholesaleProfileSettings } from "@/components/wholesale/profile-settings";

interface CartItem {
  quantity: number;
  unitPrice: number;
  strength: string;
  flavor: string;
}

// Function to calculate wholesale price based on total cart quantity
function calculateWholesalePrice(totalCartQuantity: number): number {
  if (totalCartQuantity >= 25000) return 5.00; // TIER_7
  if (totalCartQuantity >= 10000) return 5.50; // TIER_6
  if (totalCartQuantity >= 5000) return 6.00;  // TIER_5
  if (totalCartQuantity >= 1000) return 6.50;  // TIER_4
  if (totalCartQuantity >= 500) return 7.00;   // TIER_3
  if (totalCartQuantity >= 250) return 7.50;   // TIER_2
  return 8.00; // TIER_1
}

export default function WholesaleCheckout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<Record<string, CartItem>>({});
  const [paymentMethod, setPaymentMethod] = useState<"INVOICE" | "LOAN">("INVOICE");
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [, setLocation] = useLocation();

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Check if shipping details are missing
  const hasShippingDetails = user?.shippingAddress && 
    Object.keys(user.shippingAddress).length > 0 &&
    user.contactPhone &&
    user.contactEmail;

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

  // If shipping details are missing, show profile settings
  useEffect(() => {
    if (!hasShippingDetails) {
      toast({
        title: "Shipping Details Required",
        description: "Please provide your shipping details to continue with checkout",
      });
      setShowProfileSettings(true);
    }
  }, [hasShippingDetails]);

  const getTotalCartQuantity = (newCartItems?: Record<string, CartItem>): number => {
    const items = newCartItems || cartItems;
    return Object.values(items).reduce((total, item) => total + item.quantity, 0);
  };

  const updateCartItem = (itemKey: string, newQuantity: number) => {
    const newCart = { ...cartItems };

    if (newQuantity <= 0) {
      delete newCart[itemKey];
    } else {
      const [productId, strength, flavor] = itemKey.split('-');
      newCart[itemKey] = {
        quantity: newQuantity,
        unitPrice: calculateWholesalePrice(getTotalCartQuantity(newCart)),
        strength,
        flavor
      };
    }

    // Update all items' prices based on new total quantity
    const totalQuantity = getTotalCartQuantity(newCart);
    const newPrice = calculateWholesalePrice(totalQuantity);
    Object.keys(newCart).forEach(id => {
      newCart[id].unitPrice = newPrice;
    });

    setCartItems(newCart);
    localStorage.setItem('wholesale_cart', JSON.stringify(newCart));
  };

  const removeFromCart = (itemKey: string) => {
    const newCart = { ...cartItems };
    delete newCart[itemKey];

    if (getTotalCartQuantity(newCart) < 100) {
      toast({
        title: "Minimum Order Quantity",
        description: "Cannot remove item as total quantity would be below 100 units",
        variant: "destructive",
      });
      return;
    }

    // Update prices for remaining items
    const totalQuantity = getTotalCartQuantity(newCart);
    const newPrice = calculateWholesalePrice(totalQuantity);
    Object.keys(newCart).forEach(id => {
      newCart[id].unitPrice = newPrice;
    });

    setCartItems(newCart);
    localStorage.setItem('wholesale_cart', JSON.stringify(newCart));

    toast({
      title: "Item Removed",
      description: "Item has been removed from your cart",
    });
  };

  const subtotal = Object.entries(cartItems).reduce((total, [, item]) => {
    return total + (item.quantity * item.unitPrice);
  }, 0);

  const shippingCost = ShippingMethod.WHOLESALE.price;
  const total = subtotal + shippingCost;

  const totalQuantity = getTotalCartQuantity();

  const handlePayment = () => {
    if (!hasShippingDetails) {
      toast({
        title: "Shipping Details Required",
        description: "Please provide your shipping details before proceeding",
        variant: "destructive",
      });
      setShowProfileSettings(true);
      return;
    }

    // Create the order first (this would be handled by your API)
    // For now, we'll just redirect to the confirmation page
    if (paymentMethod === "INVOICE") {
      setLocation("/wholesale/order-confirmation?payment_method=invoice");
    } else {
      setLocation("/wholesale/order-confirmation?payment_method=loan");
    }
  };

  if (showProfileSettings) {
    return (
      <WholesaleLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <Button 
              variant="outline"
              onClick={() => setShowProfileSettings(false)}
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Checkout
            </Button>
          </div>
          <WholesaleProfileSettings />
        </div>
      </WholesaleLayout>
    );
  }

  return (
    <WholesaleLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Wholesale Checkout</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowProfileSettings(true)}
              className="flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Profile Settings
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation("/wholesale")}
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Shop
            </Button>
          </div>
        </div>

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
                {Object.entries(cartItems).map(([itemKey, item]) => {
                  const [productId] = itemKey.split('-');
                  const product = products?.find(p => p.id === parseInt(productId));
                  return (
                    <div key={itemKey} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <Package className="h-5 w-5 mr-2 mt-1" />
                          <div>
                            <p className="font-medium">{product?.name}</p>
                            <p className="text-sm">Strength: {item.strength}</p>
                            <p className="text-sm">Flavor: {item.flavor}</p>
                            <p className="text-sm text-muted-foreground">
                              ${item.unitPrice.toFixed(2)}/unit
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(itemKey)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateCartItem(itemKey, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateCartItem(itemKey, parseInt(e.target.value) || 0)}
                          className="w-20 text-center"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateCartItem(itemKey, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <p className="font-medium ml-2">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </p>
                      </div>
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
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={(value: "INVOICE" | "LOAN") => setPaymentMethod(value)}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="INVOICE" id="invoice" />
                    <Label htmlFor="invoice" className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Manual Invoice Payment
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="LOAN" id="loan" />
                    <Label htmlFor="loan" className="flex items-center">
                      <Banknote className="h-4 w-4 mr-2" />
                      Request Wholesale Loan
                    </Label>
                  </div>
                </RadioGroup>

                <div className="text-sm text-muted-foreground">
                  {paymentMethod === "INVOICE" ? (
                    <p>You will receive an invoice via email for manual payment processing.</p>
                  ) : (
                    <p>Apply for a wholesale loan to finance your purchase.</p>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={handlePayment}
                  disabled={!hasShippingDetails}
                >
                  {paymentMethod === "INVOICE" ? "Request Invoice" : "Apply for Loan"}
                </Button>

                {!hasShippingDetails && (
                  <p className="text-sm text-destructive">
                    Please provide your shipping details in Profile Settings before proceeding.
                  </p>
                )}

                <Separator />

                <p className="text-sm text-muted-foreground">
                  Contact your account manager for more information about wholesale loans and payment options.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </WholesaleLayout>
  );
}