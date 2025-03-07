import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import StoreLayout from "@/components/layout/store-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { PaymentMethod } from "@shared/schema";
import CryptoForm from "@/components/payment/crypto-form";
import BankTransferForm from "@/components/payment/bank-transfer-form";

export default function CheckoutPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [paymentMethod, setPaymentMethod] = useState<keyof typeof PaymentMethod | null>(null);

  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={paymentMethod || ""}
                onValueChange={(value) => setPaymentMethod(value as keyof typeof PaymentMethod)}
              >
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={PaymentMethod.CRYPTO} id="crypto" />
                    <Label htmlFor="crypto">Cryptocurrency</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={PaymentMethod.BANK_TRANSFER} id="bank" />
                    <Label htmlFor="bank">Bank Transfer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={PaymentMethod.COD} id="cod" />
                    <Label htmlFor="cod">Cash on Delivery</Label>
                  </div>
                </div>
              </RadioGroup>

              {paymentMethod === PaymentMethod.CRYPTO && (
                <CryptoForm
                  orderId={1} // Replace with actual order ID
                  amount={100} // Replace with actual amount
                  onPaymentComplete={() => setLocation("/orders")}
                />
              )}
              {paymentMethod === PaymentMethod.BANK_TRANSFER && (
                <BankTransferForm
                  orderId={1} // Replace with actual order ID
                  amount={100} // Replace with actual amount
                  onPaymentComplete={() => setLocation("/orders")}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </StoreLayout>
  );
}
