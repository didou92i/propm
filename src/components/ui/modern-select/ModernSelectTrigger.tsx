import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ModernSelectTriggerProps 
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  category?: 'training' | 'level' | 'domain'
  icon?: React.ReactNode
}

const ModernSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  ModernSelectTriggerProps
>(({ className, children, category, icon, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      "select-trigger-modern",
      category && `select-category-${category}`,
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-3">
      {icon && (
        <div className="select-icon-container">
          {icon}
        </div>
      )}
      <span className="font-medium">{children}</span>
    </div>
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 data-[state=open]:rotate-180" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))

ModernSelectTrigger.displayName = "ModernSelectTrigger"

export { ModernSelectTrigger }