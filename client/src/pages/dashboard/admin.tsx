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
import { Order, OrderStatus, Promotion } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

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

export default function AdminDashboard() {
  const { toast } = useToast();
  const [processingOrder, setProcessingOrder] = useState<number | null>(null);

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: promotions, isLoading: promotionsLoading } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions"],
  });

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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        {/* Promotions Section */}
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

        {/* Orders Section */}
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
      </div>
    </DashboardLayout>
  );
}