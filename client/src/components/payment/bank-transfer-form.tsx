import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const bankTransferSchema = z.object({
  transferReference: z.string().min(1, "Transfer reference is required"),
  bankName: z.string().min(1, "Bank name is required"),
  accountHolder: z.string().min(1, "Account holder name is required"),
});

interface BankTransferFormProps {
  orderId: number;
  amount: number;
  onPaymentComplete: () => void;
}

const BANK_DETAILS = {
  accountName: "Pouches Worldwide Ltd",
  accountNumber: "1234567890",
  bankName: "International Bank",
  swiftCode: "IBANKXX",
};

export default function BankTransferForm({ orderId, amount, onPaymentComplete }: BankTransferFormProps) {
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(bankTransferSchema),
    defaultValues: {
      transferReference: "",
      bankName: "",
      accountHolder: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/verify-transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to verify payment");

      toast({
        title: "Payment Verification Submitted",
        description: "We will verify your transfer and update your order status.",
      });

      onPaymentComplete();
    } catch (error) {
      toast({
        title: "Payment Verification Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Transfer Payment</CardTitle>
        <CardDescription>
          Please transfer {amount} to our bank account and provide the transfer details below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Our Bank Details</h3>
          <div className="space-y-2 text-sm">
            <p>Account Name: {BANK_DETAILS.accountName}</p>
            <p>Account Number: {BANK_DETAILS.accountNumber}</p>
            <p>Bank Name: {BANK_DETAILS.bankName}</p>
            <p>SWIFT Code: {BANK_DETAILS.swiftCode}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
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
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verify Transfer
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
