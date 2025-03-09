import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <img 
      src="/BLACK POUCHES WORLDWIDE.png"
      alt="Pouches Worldwide"
      className={cn("h-8 w-auto", className)}
    />
  );
}
