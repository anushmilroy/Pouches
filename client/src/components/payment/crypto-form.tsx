import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const cryptoSchema = z.object({
  cryptoType: z.string().min(1, "Please select a cryptocurrency"),
  transactionId: z.string().min(1, "Transaction ID is required"),
});

interface CryptoFormProps {
  orderId: number;
  amount: number;
  onPaymentComplete: () => void;
}

const CRYPTO_OPTIONS = [
  { value: "BTC", label: "Bitcoin" },
  { value: "ETH", label: "Ethereum" },
  { value: "USDT", label: "Tether" },
];

export default function CryptoForm({ orderId, amount, onPaymentComplete }: CryptoFormProps) {
  const [walletAddress, setWalletAddress] = useState("");
  const { toast } = useToast();
  
  const form = useForm({
    resolver: zodResolver(cryptoSchema),
    defaultValues: {
      cryptoType: "",
      transactionId: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/verify-crypto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cryptoType: data.cryptoType,
          transactionId: data.transactionId,
        }),
      });

      if (!res.ok) throw new Error("Failed to verify payment");

      toast({
        title: "Payment Verification Submitted",
        description: "We will verify your payment and update your order status.",
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

  const handleCryptoSelect = async (value: string) => {
    try {
      const res = await fetch(`/api/crypto-wallet/${value}`);
      if (!res.ok) throw new Error("Failed to get wallet address");
      const data = await res.json();
      setWalletAddress(data.address);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get wallet address",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cryptocurrency Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="cryptoType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Cryptocurrency</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleCryptoSelect(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cryptocurrency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CRYPTO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {walletAddress && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Send {amount} to:</p>
                <p className="font-mono text-sm break-all">{walletAddress}</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="transactionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your transaction ID" />
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
              Verify Payment
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
