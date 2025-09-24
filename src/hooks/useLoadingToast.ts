import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Shows a loading toast if `active` stays true longer than `delayMs`.
 * Clears any pending timer and dismisses the toast when `active` becomes false
 * or when the component unmounts.
 */
export function useLoadingToast(
  active: boolean,
  message: string,
  id: string,
  delayMs = 250
) {
  const timeoutRef = useRef<number | null>(null);
  const shownRef = useRef(false);

  useEffect(() => {
    if (active) {
      if (timeoutRef.current == null) {
        timeoutRef.current = window.setTimeout(() => {
          toast.loading(message, { id });
          shownRef.current = true;
          timeoutRef.current = null;
        }, delayMs);
      }
    } else {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (shownRef.current) {
        toast.dismiss(id);
        shownRef.current = false;
      }
    }

    return () => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (shownRef.current) {
        toast.dismiss(id);
        shownRef.current = false;
      }
    };
  }, [active, id, message, delayMs]);
}

