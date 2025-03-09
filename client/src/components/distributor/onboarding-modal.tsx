import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";

const ONBOARDING_STEPS = [
  {
    title: "Welcome to Your Distribution Platform",
    description: "We're excited to have you as a distributor. Let's get you set up quickly and efficiently.",
  },
  {
    title: "Inventory Management",
    description: "Learn how to manage your product inventory, track stock levels, and set up automatic reorder notifications.",
  },
  {
    title: "Order Processing",
    description: "Understand how to receive, process, and fulfill orders efficiently through our platform.",
  },
  {
    title: "Commission Structure",
    description: "Learn about our commission system, payment schedules, and how to maximize your earnings.",
  },
  {
    title: "Support and Resources",
    description: "Access our support tools, training materials, and connect with our distributor success team.",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = async () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      await apiRequest("POST", "/api/distributor/onboarding/progress", {
        step: currentStep + 1,
      });
    } else {
      await apiRequest("POST", "/api/distributor/onboarding/complete");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {ONBOARDING_STEPS[currentStep].title}
          </DialogTitle>
          <DialogDescription className="text-lg mt-4">
            {ONBOARDING_STEPS[currentStep].description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <div className="flex space-x-2 mb-4">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full ${
                  index <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="mr-2"
            >
              Skip for now
            </Button>
            <Button onClick={handleNext}>
              {currentStep === ONBOARDING_STEPS.length - 1 ? "Finish" : "Next"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
