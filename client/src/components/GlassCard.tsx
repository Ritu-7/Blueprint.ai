import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass relative overflow-hidden rounded-xl p-6 transition-all duration-300",
        hover && "hover:border-cyan-500/30 hover:shadow-cyan-500/10 hover:shadow-2xl",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    </div>
  );
}

