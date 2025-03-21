import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import StoreLayout from "@/components/layout/store-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentMethod, NicotineStrength, PouchFlavor, ShippingMethod, UserRole } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import BankTransferForm from "@/components/payment/bank-transfer-form";
import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {Loader2} from "lucide-react";

// Form schema
const checkoutSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(1, "Phone number is required"),
  shippingMethod: z.enum(['STANDARD', 'EXPRESS', 'WHOLESALE'] as const),
  referralCode: z.string().optional(),
  createAccount: z.boolean().default(false),
  password: z.string().optional().refine((val) => {
    if (!val) return true;
    return val.length >= 6;
  }, "Password must be at least 6 characters"),
  discountCode: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

function ManualPaymentInfo() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        After placing your order, our team will review it and send you a Stripe invoice via email.
        You can then complete the payment securely through the invoice link.
      </p>
      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2">Important Notes:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>Invoice will be sent within 24 hours</li>
          <li>Order processing begins after payment confirmation</li>
          <li>Payment link will be valid for 48 hours</li>
        </ul>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [cart, setCart] = useState<Record<string, { quantity: number; strength: keyof typeof NicotineStrength }>>({});
  const [createAccount, setCreateAccount] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"bank_transfer" | "manual">("manual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<keyof typeof ShippingMethod>('STANDARD');

  const isWholesale = user?.role === UserRole.WHOLESALE;

  // Get available shipping methods based on user role
  const availableShippingMethods = Object.entries(ShippingMethod).filter(([key]) => {
    if (key === 'WHOLESALE') {
      return isWholesale;
    }
    return true;
  });

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      createAccount: false,
      shippingMethod: 'STANDARD'
    },
  });

  // Calculate totals including shipping
  const subtotal = Object.entries(cart).reduce((total, [key, item]) => {
    const [flavor] = key.split('-');
    return total + (item.quantity * 15);
  }, 0);

  const shippingCost = ShippingMethod[selectedShippingMethod].price;
  const cartTotal = subtotal + shippingCost;

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    // Pre-fill form with user's saved shipping address if available
    if (user?.shippingAddress) {
      form.setValue("address", user.shippingAddress.street);
      form.setValue("city", user.shippingAddress.city);
      form.setValue("zipCode", user.shippingAddress.zipCode);
      form.setValue("country", user.shippingAddress.country);
      form.setValue("phone", user.shippingAddress.phone || "");
      if (user.firstName && user.lastName) {
        form.setValue("firstName", user.firstName);
        form.setValue("lastName", user.lastName);
      }
      if (user.email) {
        form.setValue("email", user.email);
      }
    }
  }, [user, form]);

  // Update the onSubmit function to properly handle shipping method
  const onSubmit = async (data: CheckoutFormData) => {
    try {
      const totalCans = Object.values(cart).reduce((total, item) => total + item.quantity, 0);
      if (totalCans < 5) {
        toast({
          title: "Minimum Order Required",
          description: "Please add at least 5 cans to your cart before checkout",
          variant: "destructive"
        });
        return;
      }

      setIsSubmitting(true);

      if (data.createAccount && !data.password) {
        form.setError("password", {
          type: "manual",
          message: "Password is required when creating an account",
        });
        return;
      }

      // Create user account if requested
      let userId: number | undefined;
      if (data.createAccount) {
        const userResponse = await apiRequest("POST", "/api/register", {
          username: data.email,
          password: data.password,
          role: "RETAIL"
        });
        const user = await userResponse.json();
        userId = user.id;
      }

      // Prepare order data
      const orderData = {
        userId: userId || user?.id || null,
        status: "PENDING",
        total: cartTotal.toString(),
        subtotal: subtotal.toString(),
        shippingMethod: data.shippingMethod as 'STANDARD' | 'EXPRESS' | 'WHOLESALE',
        shippingCost: shippingCost.toString(),
        paymentMethod: selectedPaymentMethod as 'BANK_TRANSFER' | 'MANUAL',
        referralCode: data.referralCode,
        discountCode: data.discountCode,
        items: Object.entries(cart).map(([key, item]) => {
          const [flavor] = key.split('-');
          return {
            productId: 1,
            quantity: item.quantity,
            price: "15.00"
          };
        }),
        customerDetails: {
          email: data.email,
          name: `${data.firstName} ${data.lastName}`,
          address: data.address,
          city: data.city,
          zipCode: data.zipCode,
          country: data.country,
          phone: data.phone
        }
      };

      console.log('Submitting order with data:', orderData);

      const orderResponse = await apiRequest("POST", "/api/orders", orderData);

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const order = await orderResponse.json();

      // Store order details for confirmation page
      localStorage.setItem('lastOrder', JSON.stringify({
        orderNumber: order.id,
        paymentMethod: selectedPaymentMethod,
        shippingMethod: data.shippingMethod,
        items: Object.entries(cart).map(([key, item]) => {
          const [flavor, strength] = key.split('-');
          return {
            flavor,
            strength,
            quantity: item.quantity,
            price: 15.00
          };
        }),
        total: cartTotal,
        customerDetails: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          address: data.address,
          city: data.city,
          zipCode: data.zipCode,
          country: data.country,
          phone: data.phone
        }
      }));

      // Clear cart after successful order
      localStorage.removeItem('cart');
      setCart({});

      toast({
        title: "Order placed successfully!",
        description: selectedPaymentMethod === "manual"
          ? "You will receive a payment invoice via email shortly."
          : "Thank you for your order.",
      });

      setLocation("/order-confirmation");
    } catch (error) {
      console.error('Order creation error:', error);
      toast({
        title: "Error placing order",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (Object.keys(cart).length === 0) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <Button onClick={() => setLocation("/shop")}>Continue Shopping</Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cart Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(cart).map(([key, item]) => {
                    const [flavor, strength] = key.split('-');
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {PouchFlavor[flavor as keyof typeof PouchFlavor]}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {NicotineStrength[strength as keyof typeof NicotineStrength]}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newCart = { ...cart };
                              delete newCart[key];
                              setCart(newCart);
                              localStorage.setItem('cart', JSON.stringify(newCart));
                              toast({
                                title: "Item Removed",
                                description: "Item has been removed from your cart",
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newCart = { ...cart };
                              if (item.quantity > 1) {
                                newCart[key] = {
                                  ...item,
                                  quantity: item.quantity - 1
                                };
                                setCart(newCart);
                                localStorage.setItem('cart', JSON.stringify(newCart));
                              }
                            }}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQuantity = parseInt(e.target.value) || 1;
                              if (newQuantity >= 1) {
                                const newCart = { ...cart };
                                newCart[key] = {
                                  ...item,
                                  quantity: newQuantity
                                };
                                setCart(newCart);
                                localStorage.setItem('cart', JSON.stringify(newCart));
                              }
                            }}
                            className="w-20 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const newCart = { ...cart };
                              newCart[key] = {
                                ...item,
                                quantity: item.quantity + 1
                              };
                              setCart(newCart);
                              localStorage.setItem('cart', JSON.stringify(newCart));
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <p className="font-medium ml-2">
                            ${(15 * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>Subtotal</div>
                      <div>${subtotal.toFixed(2)}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>Shipping</div>
                      <div>${shippingCost.toFixed(2)}</div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t font-bold">
                      <div>Total</div>
                      <div>${cartTotal.toFixed(2)}</div>
                    </div>
                  </div>
                  {/* Add minimum order notice */}
                  <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Minimum order: 5 cans total. Current order: {Object.values(cart).reduce((total, item) => total + item.quantity, 0)} cans
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Checkout Form */}
            <div className="space-y-6">
              {user && (
                <div className="bg-muted/30 p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="font-medium">Using your saved shipping address</p>
                      <p className="text-muted-foreground">You can modify it for this order if needed</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Method Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Method</CardTitle>
                  <CardDescription>Choose your preferred shipping method</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="shippingMethod"
                    render={({ field }) => (
                      <FormItem>
                        <div className="space-y-4">
                          {availableShippingMethods.map(([key, method]) => (
                            <div
                              key={key}
                              className={cn(
                                "flex items-center justify-between p-4 rounded-lg border cursor-pointer",
                                field.value === key
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                              onClick={() => {
                                field.onChange(key);
                                setSelectedShippingMethod(key as keyof typeof ShippingMethod);
                              }}
                            >
                              <div className="space-y-1">
                                <div className="font-medium">{method.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {method.description}
                                </div>
                              </div>
                              <div className="font-medium">${method.price.toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Referral Code */}
              <Card>
                <CardHeader>
                  <CardTitle>Referral Code</CardTitle>
                  <CardDescription>If you have a referral code, enter it here</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="referralCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referral Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter referral code (optional)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Promotional Code */}
              <Card>
                <CardHeader>
                  <CardTitle>Promotional Code</CardTitle>
                  <CardDescription>Enter a promotional code to get a discount</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="discountCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Promotional Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter promotional code (optional)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                  <CardDescription>Choose your preferred payment method</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Select
                      value={selectedPaymentMethod}
                      onValueChange={(value: "bank_transfer" | "manual") => setSelectedPaymentMethod(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Invoice Payment</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="mt-6">
                      {selectedPaymentMethod === "bank_transfer" && (
                        <BankTransferForm
                          orderId={1}
                          amount={cartTotal}
                          onPaymentComplete={() => {
                            toast({
                              title: "Bank Transfer Details Submitted",
                              description: "We will verify your transfer and update your order status.",
                            });
                          }}
                        />
                      )}

                      {selectedPaymentMethod === "manual" && <ManualPaymentInfo />}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!user && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="createAccount"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    setCreateAccount(checked as boolean);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Create an account for faster checkout</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />

                        {createAccount && (
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting || Object.values(cart).reduce((total, item) => total + item.quantity, 0) < 5}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Place Order"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </Form>
      </div>
    </StoreLayout>
  );
}