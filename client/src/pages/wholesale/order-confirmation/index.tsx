import { useLocation } from "wouter";
import { useEffect } from "react";
import LoanConfirmation from "./loan-confirmation";
import InvoiceConfirmation from "./invoice-confirmation";

export default function OrderConfirmation() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const paymentMethod = searchParams.get("payment_method");

  useEffect(() => {
    // If no payment method is specified, redirect to orders page
    if (!paymentMethod) {
      window.location.href = "/wholesale/orders";
    }
  }, [paymentMethod]);

  if (paymentMethod === "loan") {
    return <LoanConfirmation />;
  }

  if (paymentMethod === "invoice") {
    return <InvoiceConfirmation />;
  }

  // Default confirmation page for other payment methods
  return <InvoiceConfirmation />;
}
