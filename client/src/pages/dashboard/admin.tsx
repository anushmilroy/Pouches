import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AdminReferralStats } from "@/components/admin/referral-stats";
import { Order, OrderStatus, Promotion, UserRole, WholesaleStatus, ConsignmentStatus } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Wholesaler Account Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Username</h4>
              <p className="text-lg">{user.username}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Registration Date</h4>
              <p className="text-lg">{format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Company Name</h4>
              <p className="text-lg">{user.companyName || 'Not provided'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Company Website</h4>
              <p className="text-lg">{user.companyWebsite || 'Not provided'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Company Address</h4>
              <p className="text-lg">{user.companyAddress || 'Not provided'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Referral Code</h4>
              <p className="text-lg">{user.referralCode || 'None'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Account Status</h4>
              <span className={`inline-block px-2 py-1 mt-1 rounded-full text-xs ${
                user.wholesaleStatus === WholesaleStatus.APPROVED
                  ? 'bg-green-100 text-green-800'
                  : user.wholesaleStatus === WholesaleStatus.REJECTED
                  ? 'bg-red-100 text-red-800'
                  : user.wholesaleStatus === WholesaleStatus.BLOCKED
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user.wholesaleStatus || 'PENDING'}
              </span>
            </div>
          </div>

          {user.wholesaleStatus === WholesaleStatus.PENDING && (
            <div className="space-y-4 mt-6">
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
            <div className="space-y-4 mt-6">
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
            <div className="space-y-4 mt-6">
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

function AdminDashboard() {
  const { toast } = useToast();
  const [processingOrder, setProcessingOrder] = useState<number | null>(null);

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

  const { data: distributors, isLoading: distributorsLoading } = useQuery({
    queryKey: ["/api/users/distributors"],
  });


  const { data: consignmentOrders, isLoading: consignmentOrdersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/consignment"],
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

  // Add these queries in the AdminDashboard component
  const { data: referralStats, isLoading: referralStatsLoading } = useQuery({
    queryKey: ["/api/admin/referral-stats"],
  });

  const {
    data: {
      totalCommissionPaid,
      totalCommissionPending,
      activeReferrers
    } = {},
    isLoading: summaryLoading
  } = useQuery({
    queryKey: ["/api/admin/referral-summary"],
  });

  return (
    <DashboardLayout>
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wholesale">Wholesale Accounts</TabsTrigger>
          <TabsTrigger value="distributors">Distributors</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="consignments">Consignments</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

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
                  {orders?.filter(o => o.isConsignment && o.consignmentStatus === ConsignmentStatus.PENDING_APPROVAL).length || 0}
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
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.wholesaleStatus === WholesaleStatus.APPROVED
                              ? 'bg-green-100 text-green-800'
                              : user.wholesaleStatus === WholesaleStatus.REJECTED
                              ? 'bg-red-100 text-red-800'
                              : user.wholesaleStatus === WholesaleStatus.BLOCKED
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.wholesaleStatus || 'PENDING'}
                          </span>
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
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Handle distributor management
                            }}
                          >
                            Manage
                          </Button>
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
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotions?.map((promotion) => (
                      <TableRow key={promotion.id}>
                        <TableCell className="font-medium">{promotion.code}</TableCell>
                        <TableCell>{promotion.discountType}</TableCell>
                        <TableCell>
                          {promotion.discountType === 'PERCENTAGE'
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
                            variant="outline"
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
              <CardTitle>Recent Orders</CardTitle>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders?.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>{order.status}</TableCell>
                        <TableCell>${order.total}</TableCell>
                        <TableCell>{order.paymentMethod}</TableCell>
                        <TableCell>
                          {order.status === OrderStatus.PENDING && (
                            <Button
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
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consignments">
          <Card>
            <CardHeader>
              <CardTitle>Consignment Orders Management</CardTitle>
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
                      <TableHead>Wholesaler</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders?.filter(order => order.isConsignment).map((order) => (
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
                                    await apiRequest("PATCH", `/api/api/orders/${order.id}/consignment-status`, {
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
                    {(!orders|| orders.filter(o => o.isConsignment).length === 0) && (
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

// Assuming WholesalePricingTier is defined elsewhere,  replace with your actual definition.
const WholesalePricingTier = {
  TIER_1: { min: 1, max: 10, price: 10 },
  TIER_2: { min: 11, max: 100, price: 9 },
  TIER_3: { min: 101, price: 8 },
};

export default AdminDashboard;