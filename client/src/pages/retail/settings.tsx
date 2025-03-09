import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import StoreLayout from "@/components/layout/store-layout";

export default function RetailSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sameAsShipping, setSameAsShipping] = useState(false);

  // Shipping Address State
  const [shippingAddress, setShippingAddress] = useState({
    street: user?.shippingAddress?.street || "",
    city: user?.shippingAddress?.city || "",
    state: user?.shippingAddress?.state || "",
    zipCode: user?.shippingAddress?.zipCode || "",
    country: user?.shippingAddress?.country || "",
  });

  // Billing Address State
  const [billingAddress, setBillingAddress] = useState({
    street: user?.billingAddress?.street || "",
    city: user?.billingAddress?.city || "",
    state: user?.billingAddress?.state || "",
    zipCode: user?.billingAddress?.zipCode || "",
    country: user?.billingAddress?.country || "",
  });

  const updateAddressMutation = useMutation({
    mutationFn: async (data: { shippingAddress: any; billingAddress: any }) => {
      const response = await apiRequest("POST", "/api/user/update-addresses", data);
      if (!response.ok) throw new Error("Failed to update addresses");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Addresses Updated",
        description: "Your shipping and billing addresses have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (passwords: { newPassword: string }) => {
      const response = await apiRequest("POST", "/api/user/update-password", passwords);
      if (!response.ok) throw new Error("Failed to update password");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdatePassword = () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    updatePasswordMutation.mutate({ newPassword });
  };

  const handleUpdateAddresses = () => {
    const finalBillingAddress = sameAsShipping ? shippingAddress : billingAddress;
    updateAddressMutation.mutate({
      shippingAddress,
      billingAddress: finalBillingAddress,
    });
  };

  // Handle shipping address changes
  const handleShippingChange = (field: string, value: string) => {
    const newShippingAddress = { ...shippingAddress, [field]: value };
    setShippingAddress(newShippingAddress);
    if (sameAsShipping) {
      setBillingAddress(newShippingAddress);
    }
  };

  // Handle billing address changes
  const handleBillingChange = (field: string, value: string) => {
    setBillingAddress({ ...billingAddress, [field]: value });
  };

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label>Username</Label>
                  <Input value={user?.username} disabled />
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Input value="Retail Customer" disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="shipping-street">Street Address</Label>
                  <Input
                    id="shipping-street"
                    value={shippingAddress.street}
                    onChange={(e) => handleShippingChange("street", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shipping-city">City</Label>
                    <Input
                      id="shipping-city"
                      value={shippingAddress.city}
                      onChange={(e) => handleShippingChange("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping-state">State</Label>
                    <Input
                      id="shipping-state"
                      value={shippingAddress.state}
                      onChange={(e) => handleShippingChange("state", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shipping-zipcode">ZIP Code</Label>
                    <Input
                      id="shipping-zipcode"
                      value={shippingAddress.zipCode}
                      onChange={(e) => handleShippingChange("zipCode", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipping-country">Country</Label>
                    <Input
                      id="shipping-country"
                      value={shippingAddress.country}
                      onChange={(e) => handleShippingChange("country", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Billing Address</span>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="same-as-shipping"
                    checked={sameAsShipping}
                    onCheckedChange={(checked) => {
                      setSameAsShipping(!!checked);
                      if (checked) {
                        setBillingAddress(shippingAddress);
                      }
                    }}
                  />
                  <Label htmlFor="same-as-shipping" className="text-sm font-normal">
                    Same as shipping address
                  </Label>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-4 ${sameAsShipping ? "opacity-50 pointer-events-none" : ""}`}>
                <div>
                  <Label htmlFor="billing-street">Street Address</Label>
                  <Input
                    id="billing-street"
                    value={sameAsShipping ? shippingAddress.street : billingAddress.street}
                    onChange={(e) => handleBillingChange("street", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billing-city">City</Label>
                    <Input
                      id="billing-city"
                      value={sameAsShipping ? shippingAddress.city : billingAddress.city}
                      onChange={(e) => handleBillingChange("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing-state">State</Label>
                    <Input
                      id="billing-state"
                      value={sameAsShipping ? shippingAddress.state : billingAddress.state}
                      onChange={(e) => handleBillingChange("state", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billing-zipcode">ZIP Code</Label>
                    <Input
                      id="billing-zipcode"
                      value={sameAsShipping ? shippingAddress.zipCode : billingAddress.zipCode}
                      onChange={(e) => handleBillingChange("zipCode", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing-country">Country</Label>
                    <Input
                      id="billing-country"
                      value={sameAsShipping ? shippingAddress.country : billingAddress.country}
                      onChange={(e) => handleBillingChange("country", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleUpdateAddresses}
            disabled={updateAddressMutation.isPending}
            className="w-full"
          >
            {updateAddressMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Update Addresses
          </Button>

          <Separator className="my-4" />

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleUpdatePassword}
                  disabled={updatePasswordMutation.isPending}
                  className="w-full"
                >
                  {updatePasswordMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StoreLayout>
  );
}