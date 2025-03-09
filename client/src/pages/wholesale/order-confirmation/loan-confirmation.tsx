import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Clock } from "lucide-react";
import WholesaleLayout from "@/components/layout/wholesale-layout";

export default function LoanConfirmation() {
  const [, setLocation] = useLocation();

  return (
    <WholesaleLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Order Pending Approval</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-muted-foreground">
              <p>Your wholesale loan order has been received and is pending admin approval.</p>
              <p className="mt-2">You will receive an email confirmation once your order is approved.</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Next Steps:
              </h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Our admin team will review your loan request</li>
                <li>You'll receive an email notification about the approval status</li>
                <li>Once approved, your order will be processed for shipping</li>
              </ul>
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