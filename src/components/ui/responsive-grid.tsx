import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: number | string
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = "",
  cols = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = 4
}) => {
  const gridClasses = [
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`,
    `gap-${gap}`
  ].filter(Boolean).join(' ')

  return (
    <div className={cn("grid", gridClasses, className)}>
      {children}
    </div>
  )
}

// Composant pour optimiser l'affichage des cards sur mobile
interface ResponsiveCardContainerProps {
  children: React.ReactNode
  className?: string
}

export const ResponsiveCardContainer: React.FC<ResponsiveCardContainerProps> = ({
  children,
  className = ""
}) => {
  return (
    <ResponsiveGrid
      cols={{ default: 1, sm: 2, lg: 3, xl: 4 }}
      gap={3}
      className={cn("sm:gap-4", className)}
    >
      {children}
    </ResponsiveGrid>
  )
}