"use client"

import { useTheme } from "@/components/theme-provider"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

type OffsetObject = Exclude<ToasterProps["offset"], string | number>

const SAFE_AREA_OFFSET: OffsetObject = {
  top: "calc(var(--safe-area-top, 50px) + 1rem)",
  right: "calc(var(--safe-area-right, 0px) + 1rem)",
  bottom: "calc(var(--safe-area-bottom, 30px) + 1rem)",
  left: "calc(var(--safe-area-left, 0px) + 1rem)",
}

const mergeClassName = (base: string, extra?: string) =>
  [base, extra].filter(Boolean).join(" ")

const resolveOffset = (value?: ToasterProps["offset"]): ToasterProps["offset"] => {
  if (!value) return { ...SAFE_AREA_OFFSET }
  if (typeof value === "number" || typeof value === "string") return value
  return {
    ...SAFE_AREA_OFFSET,
    ...value,
  }
}

const Toaster = ({ toastOptions, offset, mobileOffset, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  const mergedToastOptions: ToasterProps["toastOptions"] = {
    ...toastOptions,
    classNames: {
      ...toastOptions?.classNames,
      toast: mergeClassName(
        "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
        toastOptions?.classNames?.toast
      ),
      description: mergeClassName(
        "group-[.toast]:text-muted-foreground",
        toastOptions?.classNames?.description
      ),
      actionButton: mergeClassName(
        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
        toastOptions?.classNames?.actionButton
      ),
      cancelButton: mergeClassName(
        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        toastOptions?.classNames?.cancelButton
      ),
    },
  }

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={mergedToastOptions}
      offset={resolveOffset(offset)}
      mobileOffset={resolveOffset(mobileOffset)}
      {...props}
    />
  )
}

export { Toaster }
