import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function WholesaleProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyName: user?.companyName || "",
    companyWebsite: user?.companyWebsite || "",
    contactPhone: user?.contactPhone || "",
    contactEmail: user?.contactEmail || "",
    businessType: user?.businessType || "",
    taxId: user?.taxId || "",
    shippingAddress: {
      street: user?.shippingAddress?.street || "",
      city: user?.shippingAddress?.city || "",
      state: user?.shippingAddress?.state || "",
      zipCode: user?.shippingAddress?.zipCode || "",
      country: user?.shippingAddress?.country || "",
    },
    billingAddress: {
      street: user?.billingAddress?.street || "",
      city: user?.billingAddress?.city || "",
      state: user?.billingAddress?.state || "",
      zipCode: user?.billingAddress?.zipCode || "",
      country: user?.billingAddress?.country || "",
    },
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await apiRequest("PATCH", "/api/users/profile", formData);
      
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Company Name</label>
              <Input
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Company Website</label>
              <Input
                value={formData.companyWebsite}
                onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Business Type</label>
              <Input
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tax ID</label>
              <Input
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Street Address</label>
              <Input
                value={formData.shippingAddress.street}
                onChange={(e) => setFormData({
                  ...formData,
                  shippingAddress: { ...formData.shippingAddress, street: e.target.value }
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  value={formData.shippingAddress.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    shippingAddress: { ...formData.shippingAddress, city: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <Input
                  value={formData.shippingAddress.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    shippingAddress: { ...formData.shippingAddress, state: e.target.value }
                  })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">ZIP Code</label>
                <Input
                  value={formData.shippingAddress.zipCode}
                  onChange={(e) => setFormData({
                    ...formData,
                    shippingAddress: { ...formData.shippingAddress, zipCode: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <Input
                  value={formData.shippingAddress.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    shippingAddress: { ...formData.shippingAddress, country: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Street Address</label>
              <Input
                value={formData.billingAddress.street}
                onChange={(e) => setFormData({
                  ...formData,
                  billingAddress: { ...formData.billingAddress, street: e.target.value }
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  value={formData.billingAddress.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, city: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <Input
                  value={formData.billingAddress.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, state: e.target.value }
                  })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">ZIP Code</label>
                <Input
                  value={formData.billingAddress.zipCode}
                  onChange={(e) => setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, zipCode: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Country</label>
                <Input
                  value={formData.billingAddress.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, country: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </div>
  );
}
