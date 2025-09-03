import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const avatarVariants = cva(
  "flex-shrink-0 overflow-hidden",
  {
    variants: {
      size: {
        sm: "w-5 h-5",      // 20px - sidebar
        md: "w-8 h-8",      // 32px - messages
        lg: "w-12 h-12",    // 48px - header
        xl: "w-16 h-16"     // 64px - accueil
      },
      variant: {
        default: "rounded-full",
        rounded: "rounded-lg",
        square: "rounded-none"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
);

const iconVariants = cva(
  "text-primary",
  {
    variants: {
      size: {
        sm: "w-3 h-3",
        md: "w-5 h-5", 
        lg: "w-8 h-8",
        xl: "w-10 h-10"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
);

interface AgentAvatarProps extends VariantProps<typeof avatarVariants> {
  agentId?: string;
  agentName?: string;
  avatarUrl?: string;
  fallbackIcon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function AgentAvatar({ 
  agentId,
  agentName,
  avatarUrl,
  fallbackIcon: FallbackIcon = Bot,
  size = "md",
  variant = "default",
  className 
}: AgentAvatarProps) {
  return (
    <Avatar className={cn(avatarVariants({ size, variant }), className)}>
      <AvatarImage 
        src={avatarUrl} 
        alt={agentName || "Agent Avatar"}
      />
      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40">
        <FallbackIcon className={iconVariants({ size })} />
      </AvatarFallback>
    </Avatar>
  );
}