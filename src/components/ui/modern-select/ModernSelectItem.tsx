import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ModernSelectItemProps 
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  icon?: React.ReactNode
}

const ModernSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  ModernSelectItemProps
>(({ className, children, icon, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-lg py-3 pl-10 pr-3 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "select-item-modern",
      className
    )}
    {...props}
  >
    <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-primary" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <div className="flex items-center gap-3">
      {icon && (
        <div className="select-icon-container !w-6 !h-6 !border-0 !bg-transparent">
          {icon}
        </div>
      )}
      <SelectPrimitive.ItemText className="font-medium">
        {children}
      </SelectPrimitive.ItemText>
    </div>
  </SelectPrimitive.Item>
))

ModernSelectItem.displayName = "ModernSelectItem"

export { ModernSelectItem }