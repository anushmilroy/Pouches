import { motion } from "framer-motion";
import { OrderStatus } from "@shared/schema";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Ban, 
  Truck, 
  PackageCheck, 
  UserCheck,
  Clock,
  RefreshCw
} from "lucide-react";

interface OrderStatusBadgeProps {
  status: keyof typeof OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const variants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
  };

  const pulseVariants = {
    initial: { scale: 0.95 },
    animate: {
      scale: 1,
      transition: {
        repeat: Infinity,
        repeatType: "reverse" as const,
        duration: 1.5,
      },
    },
  };

  const getStatusConfig = (status: keyof typeof OrderStatus) => {
    switch (status) {
      case "PENDING":
        return {
          icon: Clock,
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800",
          animation: pulseVariants,
        };
      case "APPROVED":
        return {
          icon: CheckCircle,
          bgColor: "bg-green-100",
          textColor: "text-green-800",
          animation: variants,
        };
      case "DISTRIBUTOR_ASSIGNED":
        return {
          icon: UserCheck,
          bgColor: "bg-blue-100",
          textColor: "text-blue-800",
          animation: variants,
        };
      case "PROCESSING":
        return {
          icon: RefreshCw,
          bgColor: "bg-indigo-100",
          textColor: "text-indigo-800",
          animation: pulseVariants,
        };
      case "SHIPPED":
        return {
          icon: Truck,
          bgColor: "bg-purple-100",
          textColor: "text-purple-800",
          animation: variants,
        };
      case "DELIVERED":
        return {
          icon: PackageCheck,
          bgColor: "bg-emerald-100",
          textColor: "text-emerald-800",
          animation: variants,
        };
      case "CANCELLED":
        return {
          icon: XCircle,
          bgColor: "bg-red-100",
          textColor: "text-red-800",
          animation: variants,
        };
      default:
        return {
          icon: AlertCircle,
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
          animation: variants,
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={config.animation}
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full space-x-1",
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium text-sm">{status.replace(/_/g, " ")}</span>
    </motion.div>
  );
}
