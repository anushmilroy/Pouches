import { motion } from "framer-motion";
import { WholesaleStatus } from "@shared/schema";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle, Ban } from "lucide-react";

interface StatusBadgeProps {
  status: keyof typeof WholesaleStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
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
        repeatType: "reverse",
        duration: 1.5,
      },
    },
  };

  const getStatusConfig = (status: keyof typeof WholesaleStatus) => {
    switch (status) {
      case "PENDING":
        return {
          icon: AlertCircle,
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
      case "REJECTED":
        return {
          icon: XCircle,
          bgColor: "bg-red-100",
          textColor: "text-red-800",
          animation: variants,
        };
      case "BLOCKED":
        return {
          icon: Ban,
          bgColor: "bg-gray-100",
          textColor: "text-gray-800",
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
      <span className="font-medium text-sm">{status}</span>
    </motion.div>
  );
}
