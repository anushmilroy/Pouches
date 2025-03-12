import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AdminReferralStats } from "@/components/admin/referral-stats";
import { Order, OrderStatus, Promotion, UserRole, WholesaleStatus } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CustomPricingDialog } from "@/components/admin/custom-pricing-dialog";

function CreatePromotionDialog() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
  onDelete,
}: {
  user: any;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
  onBlock: (id: number) => Promise<void>;
  onUnblock: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
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
                <h4 className="text-sm font-medium text-muted-foreground">Registration Email</h4>
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
                <h4 className="text-sm font-medium text-muted-foreground">Business Email</h4>
                <p className="text-lg">{user.contactEmail || 'Same as registration email'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Registration Email</h4>
                <p className="text-lg">{user.email}</p>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Bank Name</h4>
                <p className="text-lg">{user.bankDetails?.bankName || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Swift Code</h4>
                <p className="text-lg">{user.bankDetails?.swiftCode || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Account Name</h4>
                <p className="text-lg">{user.bankDetails?.accountName || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Account Number</h4>
                <p className="text-lg">{user.bankDetails?.accountNumber || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Routing Number</h4>
                <p className="text-lg">{user.bankDetails?.routingNumber || 'Not provided'}</p>
              </div>
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
                <h4 className="font-medium">Account Management</h4>
                <CustomPricingDialog user={user} />
              </div>
              <div className="flex space-x-2">
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

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Wholesale Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this wholesaler buyer? This action cannot be undone.
                        The account will be permanently deleted and they will no longer be able to log in.
                        Order history will be preserved.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => onDelete(user.id)}
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
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

          {user.wholesaleStatus === WholesaleStatus.REJECTED && (
            <div className="space-y-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Wholesale Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this rejected wholesaler account? This action cannot be undone.
                      The account will be permanently deleted and they will no longer be able to log in.
                      Order history will be preserved.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => onDelete(user.id)}
                    >
                      Delete Account
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState("");

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

function OrderDetailsDialog({ order }: { order: Order }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">View Details</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order #{order.id} Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Order Status and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Order Status</h4>
              <StatusBadge status={order.status} className="mt-1" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Order Date</h4>
              <p className="text-lg">{order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy HH:mm') : 'N/A'}</p>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                <p className="text-lg">{order.customerDetails?.name || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                <p className="text-lg">{order.customerDetails?.email || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                <p className="text-lg">{order.customerDetails?.phone || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Account Type</h4>
                <p className="text-lg">{order.userId ? 'Registered User' : 'Guest Checkout'}</p>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-muted-foreground">Shipping Address</h4>
                <p className="text-lg whitespace-pre-wrap">{order.customerDetails?.address || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">City</h4>
                <p className="text-lg">{order.customerDetails?.city || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">ZIP Code</h4>
                <p className="text-lg">{order.customerDetails?.zipCode || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Country</h4>
                <p className="text-lg">{order.customerDetails?.country || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Order Items</h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">{item.product?.name || `Product ${item.productId}`}</span>
                    {item.strength && (
                      <span className="text-muted-foreground ml-2">({item.strength})</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span>{item.quantity} units</span>
                    <span className="text-muted-foreground ml-2">@ ${item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Payment Method</h4>
                <p className="text-lg">{order.paymentMethod || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Payment Status</h4>
                <StatusBadge status={order.status} className="mt-1" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Subtotal</h4>
                <p className="text-lg">${order.subtotal?.toFixed(2) || order.total?.toFixed(2)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Total</h4>
                <p className="text-lg font-bold">${order.total?.toFixed(2)}</p>
              </div>
            </div>
          </div>
          {/* Additional Information */}
          {order.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Additional Notes</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [processingOrder, setProcessingOrder] = useState<number | null>(null);

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  const { data: promotions, isLoading: promotionsLoading } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions"],
  });

  const { data: wholesaleUsers, isLoading: wholesaleLoading, error: wholesaleError } = useQuery({
    queryKey: ["/api/users/wholesale"],
  });

  const { data: distributors, isLoading: distributorsLoading, error: distributorsError } = useQuery({
    queryKey: ["/api/users/distributors"],
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
      await apiRequest("POST", `/api/users/${userId}/reject`, {});
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
  });

  const handleDeleteWholesale = async (userId: number) => {
    try {
      await apiRequest("DELETE",`/api/users/${userId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/users/wholesale"] });
      toast({
        title: "Account Deleted",
        description: "The wholesale account has been permanently deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant={activeTab === "overview" ? "default" : "ghost"}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </Button>
          <Button 
            variant={activeTab === "orders" ? "default" : "ghost"}
            onClick={() => setActiveTab("orders")}
          >
            Orders
          </Button>
          <Button 
            variant={activeTab === "wholesale" ? "default" : "ghost"}
            onClick={() => setActiveTab("wholesale")}
          >
            Wholesale
          </Button>
          <Button 
            variant={activeTab === "distributors" ? "default" : "ghost"}
            onClick={() => setActiveTab("distributors")}
          >
            Distributors
          </Button>
          <Button 
            variant={activeTab === "promotions" ? "default" : "ghost"}
            onClick={() => setActiveTab("promotions")}
          >
            Promotions
          </Button>
        </div>

        {/* Overview Tab Content */}
        {activeTab === "overview" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <CardTitle>Pending Wholesalers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {wholesaleUsers?.filter(u => u.wholesaleStatus === WholesaleStatus.PENDING).length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active Distributors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {distributors?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders Tab Content */}
        {activeTab === "orders" && (
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders?.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>
                          {order.customerDetails?.name || (order.userId ? 'User ' + order.userId : 'Guest Order')}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell>${order.total?.toFixed(2)}</TableCell>
                        <TableCell>
                          {order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <OrderDetailsDialog order={order} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!orders || orders.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No orders found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Wholesale Tab Content */}
        {activeTab === "wholesale" && (
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
                            onDelete={handleDeleteWholesale}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Distributors Tab Content */}
        {activeTab === "distributors" && (
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
        )}

        {/* Promotions Tab Content */}
        {activeTab === "promotions" && (
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
                            promotion.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
        )}
      </div>
    </DashboardLayout>
  );
}

const WholesalePricingTier = {
  TIER_1: { min: 1, max: 10, price: 10 },
  TIER_2: { min: 11, max: 100, price: 9 },
  TIER_3: { min: 101, price: 8 },
};