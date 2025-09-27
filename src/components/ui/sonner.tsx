"use client"

import { useTheme } from "@/components/theme-provider"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

type OffsetObject = Exclude<ToasterProps["offset"], string | number>

const SAFE_AREA_OFFSET: OffsetObject = {
  top: "calc(env(safe-area-inset-top, 0px) + 1rem)",
  right: "calc(env(safe-area-inset-right, 0px) + 1rem)",
  bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
  left: "calc(env(safe-area-inset-left, 0px) + 1rem)",
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
