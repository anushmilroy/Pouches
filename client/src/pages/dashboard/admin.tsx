import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AdminReferralStats } from "@/components/admin/referral-stats";
import { Order, OrderStatus, Promotion, UserRole, WholesaleStatus, ConsignmentStatus } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState as useStateOriginal } from "react";
import { Loader2, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CustomPricingDialog } from "@/components/admin/custom-pricing-dialog";
import { StatusBadge } from "@/components/ui/status-badge";

function CreatePromotionDialog() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useStateOriginal(false);
  const [code, setCode] = useStateOriginal("");
  const [description, setDescription] = useStateOriginal("");
  const [discountType, setDiscountType] = useStateOriginal<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useStateOriginal("");
  const [minOrderAmount, setMinOrderAmount] = useStateOriginal("");
  const [maxDiscount, setMaxDiscount] = useStateOriginal("");
  const [startDate, setStartDate] = useStateOriginal("");
  const [endDate, setEndDate] = useStateOriginal("");

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await apiRequest("POST", "/api/promotions", {
        code,
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        isActive: true,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      toast({
        title: "Promotion Created",
        description: "The promotional code has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create promotional code",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Promotion
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Promotional Code</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Code</label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Discount Type</label>
            <Select value={discountType} onValueChange={(value: "PERCENTAGE" | "FIXED") => setDiscountType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                <SelectItem value="FIXED">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">
              {discountType === "PERCENTAGE" ? "Discount Percentage" : "Discount Amount"}
            </label>
            <Input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === "PERCENTAGE" ? "e.g., 10 for 10%" : "e.g., 50 for $50"}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Minimum Order Amount (Optional)</label>
            <Input
              type="number"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              placeholder="Minimum order amount to apply discount"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Maximum Discount Amount (Optional)</label>
            <Input
              type="number"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              placeholder="Maximum discount amount allowed"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Promotion"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WholesalerDetailsDialog({
  user,
  onApprove,
  onReject,
  onBlock,
  onUnblock,
}: {
  user: any;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
  onBlock: (id: number) => Promise<void>;
  onUnblock: (id: number) => Promise<void>;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">View Details</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wholesaler Account Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Username</h4>
                <p className="text-lg">{user.username}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                <p className="text-lg">{user.email}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Registration Date</h4>
                <p className="text-lg">{format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Account Status</h4>
                <StatusBadge status={user.wholesaleStatus} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Company Name</h4>
                <p className="text-lg">{user.companyName || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Business Type</h4>
                <p className="text-lg">{user.businessType || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Tax ID</h4>
                <p className="text-lg">{user.taxId || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Company Website</h4>
                <p className="text-lg">{user.companyWebsite || 'Not provided'}</p>
              </div>
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-muted-foreground">Company Address</h4>
                <p className="text-lg">{user.companyAddress || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Contact Phone</h4>
                <p className="text-lg">{user.contactPhone || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Contact Email</h4>
                <p className="text-lg">{user.contactEmail || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Address Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Shipping Address</h4>
                <p className="text-lg whitespace-pre-wrap">{user.shippingAddress || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Billing Address</h4>
                <p className="text-lg whitespace-pre-wrap">{user.billingAddress || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Bank Information</h3>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Bank Details</h4>
              <p className="text-lg whitespace-pre-wrap">{user.bankDetails || 'Not provided'}</p>
            </div>
          </div>

          {/* Onboarding Status */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Onboarding Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Onboarding Status</h4>
                <p className="text-lg">{user.onboardingStatus || 'Not Started'}</p>
              </div>
              {user.onboardingCompletedAt && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Onboarding Completed</h4>
                  <p className="text-lg">{format(new Date(user.onboardingCompletedAt), 'MMM d, yyyy')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {user.wholesaleStatus === WholesaleStatus.PENDING && (
            <div className="space-y-4">
              <h4 className="font-medium">Approve or Reject Application</h4>
              <div className="flex space-x-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button>Approve Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Approve Wholesale Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will grant the user access to wholesale prices and features. Are you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onApprove(user.id)}>
                        Approve Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Reject Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Wholesale Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reject the wholesale application. The user will need to contact support for reconsideration. Are you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onReject(user.id)}>
                        Reject Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          {user.wholesaleStatus === WholesaleStatus.APPROVED && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Custom Pricing Settings</h4>
                <CustomPricingDialog user={user} />
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Block Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Block Wholesale Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will block the wholesale account from accessing the platform. Are you sure?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onBlock(user.id)}>
                      Block Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {user.wholesaleStatus === WholesaleStatus.BLOCKED && (
            <div className="space-y-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">Unblock Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unblock Wholesale Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will restore the account's access to wholesale features. Are you sure?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onUnblock(user.id)}>
                      Unblock Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateDistributorDialog() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useStateOriginal(false);
  const [username, setUsername] = useStateOriginal("");
  const [password, setPassword] = useStateOriginal("");
  const [email, setEmail] = useStateOriginal("");

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await apiRequest("POST", "/api/users/distributor", {
        username,
        password,
        email,
        role: "DISTRIBUTOR"
      });

      queryClient.invalidateQueries({ queryKey: ["/api/users/distributors"] });
      toast({
        title: "Distributor Created",
        description: "The distributor account has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create distributor account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Distributor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Distributor Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Distributor"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AllocateInventoryDialog({ distributor }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useStateOriginal(false);
  const [selectedProduct, setSelectedProduct] = useStateOriginal("");
  const [quantity, setQuantity] = useStateOriginal("");

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await apiRequest("POST", `/api/distributors/${distributor.id}/inventory`, {
        productId: parseInt(selectedProduct),
        quantity: parseInt(quantity)
      });

      queryClient.invalidateQueries({ queryKey: ["/api/distributors"] });
      toast({
        title: "Inventory Allocated",
        description: "Successfully allocated inventory to distributor.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to allocate inventory",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Allocate Inventory</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Allocate Inventory to {distributor.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Product</label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Quantity</label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedProduct || !quantity}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Allocating...
              </>
            ) : (
              "Allocate Inventory"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssignOrderDialog({ distributor }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useStateOriginal(false);
  const [selectedOrder, setSelectedOrder] = useStateOriginal("");

  const { data: unassignedOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders/unassigned"],
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await apiRequest("POST", `/api/orders/${selectedOrder}/assign`, {
        distributorId: distributor.id
      });

      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/unassigned"] });
      toast({
        title: "Order Assigned",
        description: "Successfully assigned order to distributor.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Assign Order</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Order to {distributor.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Order</label>
            <Select value={selectedOrder} onValueChange={setSelectedOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Select an order" />
              </SelectTrigger>
              <SelectContent>
                {unassignedOrders?.map((order) => (
                  <SelectItem key={order.id} value={order.id.toString()}>
                    Order #{order.id} - ${order.total}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedOrder}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Order"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdminDashboard() {
  const { toast } = useToast();
  const [processingOrder, setProcessingOrder] = useStateOriginal<number | null>(null);
  const [activeTab, setActiveTab] = useStateOriginal(() => {
    return window.location.hash.replace("#", "") || "overview";
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") || "overview";
      setActiveTab(hash);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: promotions, isLoading: promotionsLoading } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions"],
  });

  const { data: wholesaleUsers, isLoading: wholesaleLoading, error: wholesaleError } = useQuery({
    queryKey: ["/api/users/wholesale"],
    onSuccess: (data) => {
      console.log("Admin dashboard - Fetched wholesale users:", data);
    },
    onError: (error) => {
      console.error("Admin dashboard - Error fetching wholesale users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch wholesale users",
        variant: "destructive",
      });
    }
  });

  const { data: distributors, isLoading: distributorsLoading, error: distributorsError } = useQuery({
    queryKey: ["/api/users/distributors"],
    onError: (error) => {
      console.error("Admin dashboard - Error fetching distributors:", error);
      toast({
        title: "Error",
        description: "Failed to fetch distributors",
        variant: "destructive",
      });
    }
  });


  const { data: consignmentOrders, isLoading: consignmentOrdersLoading, error: consignmentOrdersError } = useQuery<Order[]>({
    queryKey: ["/api/orders/consignment"],
    onError: (error) => {
      console.error("Admin dashboard - Error fetching consignment orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch consignment orders",
        variant: "destructive",
      });
    }
  });

  const handleApproveWholesale = async (userId: number) => {
    try {
      await apiRequest("PATCH", `/api/users/${userId}/wholesale-status`, {
        status: WholesaleStatus.APPROVED,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/wholesale"] });
      toast({
        title: "Account Approved",
        description: "The wholesale account has been approved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve account",
        variant: "destructive",
      });
    }
  };

  const handleRejectWholesale = async (userId: number) => {
    try {
      await apiRequest("PATCH", `/api/users/${userId}/wholesale-status`, {
        status: WholesaleStatus.REJECTED,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/wholesale"] });
      toast({
        title: "Account Rejected",
        description: "The wholesale account has been rejected.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject account",
        variant: "destructive",
      });
    }
  };

  const handleBlockWholesale = async (userId: number) => {
    try {
      await apiRequest("POST", `/api/users/${userId}/block`);
      queryClient.invalidateQueries({ queryKey: ["/api/users/wholesale"] });
      toast({
        title: "Account Blocked",
        description: "The wholesale account has been blocked.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block account",
        variant: "destructive",
      });
    }
  };

  const handleUnblockWholesale = async (userId: number) => {
    try {
      await apiRequest("POST", `/api/users/${userId}/unblock`);
      queryClient.invalidateQueries({ queryKey: ["/api/users/wholesale"] });
      toast({
        title: "Account Unblocked",
        description: "The wholesale account has been unblocked.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unblock account",
        variant: "destructive",
      });
    }
  };

  const handleTogglePromotion = async (id: number, isActive: boolean) => {
    try {
      await apiRequest("PATCH", `/api/promotions/${id}`, { isActive });
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      toast({
        title: `Promotion ${isActive ? 'Activated' : 'Deactivated'}`,
        description: `The promotional code has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${isActive ? 'activate' : 'deactivate'} promotion`,
        variant: "destructive",
      });
    }
  };

  const handleVerifyPayment = async (orderId: number) => {
    try {
      setProcessingOrder(orderId);
      await apiRequest("POST", `/api/orders/${orderId}/verify`);
      toast({
        title: "Payment Verified",
        description: "Order has been marked as paid",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive",
      });
    } finally {
      setProcessingOrder(null);
    }
  };

  const { data: referralStats, isLoading: referralStatsLoading, error: referralStatsError } = useQuery({
    queryKey: ["/api/admin/referral-stats"],
    onError: (error) => {
      console.error("Admin dashboard - Error fetching referral stats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch referral stats",
        variant: "destructive",
      });
    }
  });

  const {
    data: {
      totalCommissionPaid,
      totalCommissionPending,
      activeReferrers
    } = {},
    isLoading: summaryLoading,
    error: summaryError
  } = useQuery({
    queryKey: ["/api/admin/referral-summary"],
    onError: (error) => {
      console.error("Admin dashboard - Error fetching referral summary:", error);
      toast({
        title: "Error",
        description: "Failed to fetch referral summary",
        variant: "destructive",
      });
    }
  });


  return (
    <DashboardLayout onTabChange={setActiveTab}>
      <Tabs value={activeTab} className="space-y-8">

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Promotions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {promotions?.filter(p => p.isActive).length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pending Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {orders?.filter(o => o.status === OrderStatus.PENDING).length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pending Consignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {consignmentOrders?.filter(o => o.isConsignment && o.consignmentStatus === ConsignmentStatus.PENDING_APPROVAL).length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wholesale">
          <Card>
            <CardHeader>
              <CardTitle>Wholesale Account Management</CardTitle>
            </CardHeader>
            <CardContent>
              {wholesaleLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : wholesaleError ? (
                <div className="text-center text-red-500 py-4">Error fetching wholesale users</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Custom Pricing</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wholesaleUsers?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <StatusBadge status={user.wholesaleStatus} />
                        </TableCell>
                        <TableCell>
                          {user.wholesaleStatus === WholesaleStatus.APPROVED && (
                            <CustomPricingDialog user={user} />
                          )}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <WholesalerDetailsDialog
                            user={user}
                            onApprove={handleApproveWholesale}
                            onReject={handleRejectWholesale}
                            onBlock={handleBlockWholesale}
                            onUnblock={handleUnblockWholesale}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distributors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Distributor Management</CardTitle>
              <CreateDistributorDialog />
            </CardHeader>
            <CardContent>
              {distributorsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : distributorsError ? (
                <div className="text-center text-red-500 py-4">Error fetching distributors</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Orders Assigned</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributors?.map((distributor) => (
                      <TableRow key={distributor.id}>
                        <TableCell>{distributor.username}</TableCell>
                        <TableCell>{distributor.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {distributor.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{distributor.assignedOrders || 0}</TableCell>
                        <TableCell className="space-x-2">
                          <AllocateInventoryDialog distributor={distributor} />
                          <AssignOrderDialog distributor={distributor} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!distributors || distributors.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No distributors found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Promotional Codes</CardTitle>
              <CreatePromotionDialog />
            </CardHeader>
            <CardContent>
              {promotionsLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotions?.map((promotion) => (
                      <TableRow key={promotion.id}>
                        <TableCell>{promotion.code}</TableCell>
                        <TableCell>{promotion.discountType}</TableCell>
                        <TableCell>
                          {promotion.discountType === "PERCENTAGE"
                            ? `${promotion.discountValue}%`
                            : `$${promotion.discountValue}`}
                        </TableCell>
                        <TableCell>{format(new Date(promotion.endDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            promotion.isActive ?                            'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {promotion.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePromotion(promotion.id, !promotion.isActive)}
                          >
                            {promotion.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : orders?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders?.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>{order.userId}</TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>${order.total}</TableCell>
                        <TableCell>{order.paymentMethod}</TableCell>
                        <TableCell>{format(new Date(order.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          {order.status === OrderStatus.PENDING && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyPayment(order.id)}
                              disabled={processingOrder === order.id}
                            >
                              {processingOrder === order.id && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Verify Payment
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consignments">
          <Card>
            <CardHeader>
              <CardTitle>Consignment Orders Management</CardTitle>
            </CardHeader>
            <CardContent>
              {consignmentOrdersLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : consignmentOrdersError ? (
                <div className="text-center text-red-500 py-4">Error fetching consignment orders</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Wholesaler</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consignmentOrders?.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>{order.userId}</TableCell>
                        <TableCell>${order.total}</TableCell>
                        <TableCell>
                          <Badge variant={
                            order.consignmentStatus === ConsignmentStatus.APPROVED ? "success" :
                            order.consignmentStatus === ConsignmentStatus.REJECTED ? "destructive" :
                            "secondary"
                          }>
                            {order.consignmentStatus || ConsignmentStatus.PENDING_APPROVAL}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="space-x-2">
                          {order.consignmentStatus === ConsignmentStatus.PENDING_APPROVAL && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-50 hover:bggreen-100 text-green-700"
                                onClick={async () => {
                                  try {
                                    await apiRequest("PATCH", `/api/orders/${order.id}/consignment-status`, {
                                      status:ConsignmentStatus.APPROVED
                                    });
                                    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                                    toast({
                                      title: "Consignment Approved",
                                      description: `Order #${order.id} has been approved.`
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to approve consignment order",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-50 hover:bg-red-100 text-red-700"
                                onClick={async () => {
                                  try {
                                    await apiRequest("PATCH", `/api/orders/${order.id}/consignment-status`, {
                                      status: ConsignmentStatus.REJECTED
                                    });
                                    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                                    toast({
                                      title: "Consignment Rejected",
                                      description: `Order #${order.id} has been rejected.`
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to reject consignment order",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!consignmentOrders || consignmentOrders.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No consignment orders found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals">
          <AdminReferralStats />
        </TabsContent>

      </Tabs>
    </DashboardLayout>
  );
}

export default AdminDashboard;

const WholesalePricingTier = {
  TIER_1: { min: 1, max: 10, price: 10 },
  TIER_2: { min: 11, max: 100, price: 9 },
  TIER_3: { min: 101, price: 8 },
};