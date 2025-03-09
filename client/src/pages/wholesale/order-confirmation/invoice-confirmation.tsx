import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Clock, CreditCard } from "lucide-react";
import WholesaleLayout from "@/components/layout/wholesale-layout";

export default function InvoiceConfirmation() {
  const [, setLocation] = useLocation();

  return (
    <WholesaleLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Thank You for Your Order!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-muted-foreground">
              <p>Your order has been successfully placed.</p>
              <p className="mt-2">Within the next 24 hours, you will receive an email with a Stripe payment link to complete your purchase.</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                What to Expect:
              </h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Email with Stripe payment link (within 24 hours)</li>
                <li>Complete your payment securely through Stripe</li>
                <li>Receive order confirmation and tracking details</li>
              </ul>
            </div>

            <div className="bg-primary/5 rounded-lg p-4 flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Payment Instructions:</p>
                <p className="text-muted-foreground mt-1">
                  Once you receive the Stripe payment link via email, click it to complete your payment securely. The link will be valid for 48 hours.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={() => setLocation("/wholesale/orders")}
                className="w-full"
              >
                View My Orders
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/wholesale")}
              >
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </WholesaleLayout>
  );
}