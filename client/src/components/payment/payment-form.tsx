import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const BANK_DETAILS = {
  accountName: "Pouches Worldwide Ltd",
  accountNumber: "1234567890",
  bankName: "International Bank",
  swiftCode: "IBANKXX",
};

const bankTransferSchema = z.object({
  transferReference: z.string().min(1, "Transfer reference is required"),
  bankName: z.string().min(1, "Bank name is required"),
  accountHolder: z.string().min(1, "Account holder name is required"),
});

type BankTransferFormData = z.infer<typeof bankTransferSchema>;

// Separate component for Stripe Card Payment
function CardPaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      },
    });

    if (error) {
      setPaymentError(error.message ?? "An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleCardPayment}>
      <PaymentElement />
      {paymentError && (
        <div className="text-destructive text-sm mt-2">{paymentError}</div>
      )}
      <Button
        type="submit"
        className="w-full mt-4"
        disabled={isProcessing || !stripe || !elements}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay Now"
        )}
      </Button>
    </form>
  );
}

export default function PaymentForm({ paymentMethod = "card" }: { paymentMethod?: "card" | "bank_transfer" }) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<BankTransferFormData>({
    resolver: zodResolver(bankTransferSchema),
    defaultValues: {
      transferReference: "",
      bankName: "",
      accountHolder: "",
    },
  });

  const handleBankTransfer = async (data: BankTransferFormData) => {
    try {
      setIsProcessing(true);
      // Here you would typically send the bank transfer details to your backend
      // for verification and processing
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating API call

      toast({
        title: "Bank Transfer Details Submitted",
        description: "We will verify your transfer and process your order status.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit bank transfer details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentMethod === "bank_transfer") {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Our Bank Details</h3>
          <div className="space-y-2 text-sm">
            <p>Account Name: {BANK_DETAILS.accountName}</p>
            <p>Account Number: {BANK_DETAILS.accountNumber}</p>
            <p>Bank Name: {BANK_DETAILS.bankName}</p>
            <p>SWIFT Code: {BANK_DETAILS.swiftCode}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleBankTransfer)} className="space-y-4">
            <FormField
              control={form.control}
              name="transferReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer Reference</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter transfer reference number" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Bank Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your bank name" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountHolder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Holder Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter account holder name" />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit Transfer Details"
              )}
            </Button>
          </form>
        </Form>
      </div>
    );
  }

  return <CardPaymentForm />;
}