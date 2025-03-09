import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <img 
      src="/black-pouches-worldwide.png"
      alt="Pouches Worldwide"
      className={cn("h-12 md:h-14 w-auto", className)}
    />
  );
}