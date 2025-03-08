import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StoreLayout from "@/components/layout/store-layout";
import { NicotineStrength, PouchFlavor } from "@shared/schema";
import { ArrowLeft, Mail, Phone } from "lucide-react";

interface OrderDetails {
  orderNumber: string;
  paymentMethod: "bank_transfer" | "manual";
  items: Array<{
    flavor: string;
    strength: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  customerDetails: {
    name: string;
    email: string;
    address: string;
    city: string;
    zipCode: string;
    country: string;
    phone: string;
  };
}

export default function OrderConfirmationPage() {
  const [, setLocation] = useLocation();
  const orderDetails = JSON.parse(localStorage.getItem('lastOrder') || '{}') as OrderDetails;

  if (!orderDetails.orderNumber) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
          <Button onClick={() => setLocation("/shop")}>Return to Shop</Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Order Confirmation</h1>
            <Button variant="outline" onClick={() => setLocation("/shop")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Shop
            </Button>
          </div>

          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order #{orderDetails.orderNumber}</CardTitle>
                <CardDescription>Thank you for your order!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderDetails.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <div className="font-medium">
                          {PouchFlavor[item.flavor as keyof typeof PouchFlavor]}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {NicotineStrength[item.strength as keyof typeof NicotineStrength]} • {item.quantity} cans
                        </div>
                      </div>
                      <div className="font-medium">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 font-bold">
                    <div>Total</div>
                    <div>${orderDetails.total.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                {orderDetails.paymentMethod === "bank_transfer" ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Please complete your bank transfer using the following details:
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Bank Details</h4>
                      <div className="space-y-2 text-sm">
                        <p>Account Name: Pouches Worldwide Ltd</p>
                        <p>Account Number: 1234567890</p>
                        <p>Bank Name: International Bank</p>
                        <p>SWIFT Code: IBANKXX</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      You will receive a payment invoice via email within the next 24 hours.
                      The invoice will include a secure payment link valid for 48 hours.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Important Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Order processing begins after payment confirmation</li>
                  <li>You will receive order status updates via email</li>
                  <li>Standard delivery time is 5-7 business days</li>
                  <li>For wholesale orders, our team will contact you to arrange delivery</li>
                </ul>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>support@pouchesworldwide.com</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
