import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { WholesalePricingTier, PouchFlavor, NicotineStrength } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CustomPricingDialogProps {
  user: {
    id: number;
    username: string;
    customPricing?: Record<string, number>;
  };
}

export function CustomPricingDialog({ user }: CustomPricingDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customPricing, setCustomPricing] = useState<Record<string, number>>(
    user.customPricing || {}
  );

  const getTierKey = (flavor: string, strength: string, tier: string) => 
    `${flavor}_${strength}_${tier}`;

  const handlePriceChange = (flavor: string, strength: string, tier: string, price: string) => {
    const key = getTierKey(flavor, strength, tier);
    setCustomPricing(prev => ({
      ...prev,
      [key]: parseFloat(price) || 0
    }));
  };

  const getPriceForTier = (flavor: string, strength: string, tier: string) => {
    const key = getTierKey(flavor, strength, tier);
    return customPricing[key] || WholesalePricingTier[tier as keyof typeof WholesalePricingTier].price;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await apiRequest("PATCH", `/api/users/${user.id}/pricing`, {
        customPricing,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/wholesale"] });
      toast({
        title: "Custom Pricing Updated",
        description: "The wholesale pricing has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update custom pricing",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Set Custom Prices</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Set Custom Wholesale Prices for {user.username}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <Tabs defaultValue={Object.keys(PouchFlavor)[0]}>
            <TabsList className="mb-4">
              {Object.values(PouchFlavor).map((flavor) => (
                <TabsTrigger key={flavor} value={flavor}>{flavor}</TabsTrigger>
              ))}
            </TabsList>
            {Object.values(PouchFlavor).map((flavor) => (
              <TabsContent key={flavor} value={flavor}>
                <div className="space-y-4">
                  {Object.values(NicotineStrength).map((strength) => (
                    <Card key={strength}>
                      <CardHeader>
                        <CardTitle>{strength}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(WholesalePricingTier).map(([tier, { min, max, price }]) => (
                            <div key={tier} className="space-y-2">
                              <label className="text-sm font-medium">
                                {min}-{max || '∞'} units (Default: ${price.toFixed(2)})
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={getPriceForTier(flavor, strength, tier)}
                                onChange={(e) => handlePriceChange(flavor, strength, tier, e.target.value)}
                                placeholder={`Enter custom price for ${min}-${max || '∞'} units`}
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </ScrollArea>
        <Button
          className="w-full mt-4"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Pricing"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
