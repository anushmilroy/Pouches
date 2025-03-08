import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck } from "lucide-react";

export default function RegistrationSuccess() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <ClipboardCheck className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">Registration Successful!</CardTitle>
          <CardDescription className="text-lg mt-2">
            Your wholesale account application has been submitted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg text-blue-800">
            <h3 className="font-semibold mb-2">What happens next?</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Our admin team will review your application</li>
              <li>You'll receive notification once your account is approved</li>
              <li>After approval, you can access wholesale prices and place bulk orders</li>
            </ul>
          </div>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => setLocation("/auth")}
          >
            Return to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
