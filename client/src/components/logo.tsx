import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <img 
      src="/black-pouches-worldwide.png"
      alt="Pouches Worldwide"
      className={cn("h-8 md:h-10 w-auto", className)}
    />
  );
}