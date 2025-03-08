import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function NavHeader() {
  const { logoutMutation } = useAuth();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">Pouches Worldwide</h1>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="flex items-center"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
