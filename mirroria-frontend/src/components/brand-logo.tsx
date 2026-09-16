import { Sparkles } from "lucide-react"
import { cn } from "cn"

export interface BrandLogoProps {
  className?: string
  iconSize?: number
  size?: "sm" | "default" | "lg" | "xl"
  variant?: "default" | "subtle" | "light"
  withText?: boolean
  subtitle?: string
}

export function BrandLogo({
  className,
  iconSize,
  size = "default",
  variant = "default",
  withText = true,
  subtitle,
}: BrandLogoProps) {
  const isLight = variant === "light"
  const isSubtle = variant === "subtle"

  const sizeConfig = {
    sm: {
      box: "size-7 rounded-lg",
      icon: 14,
      text: "text-base",
    },
    default: {
      box: "size-8 rounded-lg",
      icon: 16,
      text: "text-lg",
    },
    lg: {
      box: "size-9 rounded-xl",
      icon: 18,
      text: "text-xl",
    },
    xl: {
      box: "size-12 rounded-2xl",
      icon: 24,
      text: "text-2xl",
    },
  }[size]

  const calculatedIconSize = iconSize ?? sizeConfig.icon

  const badgeStyles = isLight
    ? "bg-white/15 text-white backdrop-blur-sm border border-white/20"
    : isSubtle
      ? "bg-primary/10 text-primary border border-primary/20"
      : "bg-primary text-primary-foreground shadow-sm shadow-primary/25"

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center transition-transform",
          sizeConfig.box,
          badgeStyles
        )}
      >
        <Sparkles size={calculatedIconSize} className="shrink-0" />
      </div>

      {withText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-bold tracking-tight",
              sizeConfig.text,
              isLight ? "text-white" : "text-foreground"
            )}
          >
            Mirror<span className={isLight ? "text-primary-foreground font-extrabold" : "text-primary"}>IA</span>
          </span>
          {subtitle && (
            <span
              className={cn(
                "text-[11px] tracking-normal mt-0.5",
                isLight ? "text-white/75" : "text-muted-foreground"
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
