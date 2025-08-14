"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--success)",
          "--success-text": "var(--success-foreground)",
          "--success-border": "var(--success-border)",
          "--error-bg": "var(--error)",
          "--error-text": "var(--error-foreground)",
          "--error-border": "var(--error-border)",
          "--warning-bg": "var(--warning)",
          "--warning-text": "var(--warning-foreground)",
          "--warning-border": "var(--warning-border)",
          "--info-bg": "var(--info)",
          "--info-text": "var(--info-foreground)",
          "--info-border": "var(--info-border)",
          "fontFamily": "inherit"
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
