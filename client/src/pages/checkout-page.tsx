import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StoreLayout from "@/components/layout/store-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentMethod, NicotineStrength, PouchFlavor } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import CardPaymentForm from "@/components/payment/card-payment-form";
import BankTransferForm from "@/components/payment/bank-transfer-form";
import { Loader2 } from "lucide-react";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51OXRxBHWQqHBjacDXgbxPWBfPzwp8GDvE9E8VDY1234567890');

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
  const [cart, setCart] = useState<Record<string, { quantity: number, strength: keyof typeof NicotineStrength }>>({});
  const [createAccount, setCreateAccount] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"card" | "bank_transfer" | "manual">("card");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      createAccount: false,
    },
  });

  // Calculate cart total
  const cartTotal = Object.entries(cart).reduce((total, [key, item]) => {
    const [flavor] = key.split('-');
    return total + (item.quantity * 15);
  }, 0);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Create payment intent when cart total changes
  useEffect(() => {
    if (cartTotal > 0 && selectedPaymentMethod === "card") {
      setClientSecret(""); // Reset client secret before creating new intent
      console.log("Creating payment intent for amount:", cartTotal);

      apiRequest("POST", "/api/create-payment-intent", {
        amount: cartTotal
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to create payment intent');
          }
          return res.json();
        })
        .then((data) => {
          console.log("Payment intent created successfully");
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          console.error("Payment intent error:", error);
          toast({
            title: "Payment Setup Failed",
            description: "Unable to initialize payment. Please try again or choose a different payment method.",
            variant: "destructive",
          });
        });
    }
  }, [cartTotal, selectedPaymentMethod, toast]);

  const onSubmit = async (data: CheckoutFormData) => {
    try {
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

      // Create order
      const orderItems = Object.entries(cart).map(([key, item]) => {
        const [flavor] = key.split('-');
        return {
          productId: 1,
          quantity: item.quantity,
          price: "15.00"
        };
      });

      const orderResponse = await apiRequest("POST", "/api/orders", {
        userId: userId || null,
        status: "PENDING",
        total: cartTotal.toString(),
        paymentMethod: selectedPaymentMethod,
        items: orderItems,
        customerDetails: {
          email: data.email,
          name: `${data.firstName} ${data.lastName}`,
          address: data.address,
          city: data.city,
          zipCode: data.zipCode,
          country: data.country,
          phone: data.phone
        }
      });

      // Clear cart after successful order
      localStorage.removeItem('cart');
      setCart({});

      toast({
        title: "Order placed successfully!",
        description: selectedPaymentMethod === "manual"
          ? "You will receive a payment invoice via email shortly."
          : "Thank you for your order.",
      });

      setLocation("/");
    } catch (error) {
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
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>Choose your preferred payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Select
                    value={selectedPaymentMethod}
                    onValueChange={(value: "card" | "bank_transfer" | "manual") => setSelectedPaymentMethod(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Card Payment</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="manual">Invoice Payment</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedPaymentMethod === "card" && (
                    clientSecret ? (
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CardPaymentForm />
                      </Elements>
                    ) : (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )
                  )}

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
              </CardContent>
            </Card>

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

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
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
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}