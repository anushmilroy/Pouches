import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StoreLayout from "@/components/layout/store-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { PaymentMethod, NicotineStrength, PouchFlavor } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import PaymentForm from "@/components/payment/payment-form";

// Initialize Stripe
const stripePromise = loadStripe('pk_test_51OXRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxY');

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
  createAccount: z.boolean().default(false),
  password: z.string().optional().refine((val) => {
    if (!val) return true;
    return val.length >= 6;
  }, "Password must be at least 6 characters"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cart, setCart] = useState<Record<string, { quantity: number, strength: keyof typeof NicotineStrength }>>({});
  const [createAccount, setCreateAccount] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      createAccount: false,
    },
  });

  // Calculate cart total
  const cartTotal = Object.entries(cart).reduce((total, [key, item]) => {
    const [flavor] = key.split('-');
    return total + (item.quantity * 15); // Using fixed price for now
  }, 0);

  // Create payment intent when cart total changes
  useEffect(() => {
    if (cartTotal > 0) {
      apiRequest("POST", "/api/create-payment-intent", { amount: cartTotal })
        .then((res) => res.json())
        .then((data) => setClientSecret(data.clientSecret))
        .catch((error) => {
          toast({
            title: "Error",
            description: "Failed to initialize payment. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [cartTotal, toast]);

  const onSubmit = async (data: CheckoutFormData) => {
    try {
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

      // Create order
      const orderItems = Object.entries(cart).map(([key, item]) => {
        const [flavor, strength] = key.split('-');
        return {
          productId: 1, // We'll need to get this from the actual product data
          quantity: item.quantity,
          price: "15.00" // This should come from the product data
        };
      });

      const orderResponse = await apiRequest("POST", "/api/orders", {
        userId: userId || null,
        status: "PENDING",
        total: cartTotal.toString(),
        paymentMethod: "CARD",
        items: orderItems
      });

      // Clear cart after successful order
      localStorage.removeItem('cart');
      setCart({});

      toast({
        title: "Order placed successfully!",
        description: "Thank you for your order.",
      });

      setLocation("/");
    } catch (error) {
      toast({
        title: "Error placing order",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    }
  };

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    <div key={key} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <div className="font-medium">
                          {PouchFlavor[flavor as keyof typeof PouchFlavor]}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {NicotineStrength[strength as keyof typeof NicotineStrength]} • {item.quantity} cans
                        </div>
                      </div>
                      <div className="font-medium">${(15 * item.quantity).toFixed(2)}</div>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center pt-4 font-bold">
                  <div>Total</div>
                  <div>${cartTotal.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                    <div className="border-t pt-4">
                      <FormField
                        control={form.control}
                        name="createAccount"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
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
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Payment Section */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                {clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm />
                  </Elements>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}