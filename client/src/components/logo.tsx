import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <img 
      src="/black-pouches-worldwide.png"
      alt="Pouches Worldwide"
      className={cn("h-16 md:h-20 w-auto", className)}
    />
  );
}