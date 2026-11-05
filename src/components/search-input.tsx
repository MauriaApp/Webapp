import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

/**
 * The page-level search field (Palantir, associations, internships): a
 * magnifier inside a standard Input. One component so the three never drift.
 * `className` styles the wrapper (e.g. `flex-1`); everything else goes to the
 * input.
 */
export const SearchInput = React.forwardRef<
    HTMLInputElement,
    React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
    <div className={cn("relative w-full", className)}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
            ref={ref}
            className="h-10 border-input bg-card pl-10 text-foreground placeholder:text-muted-foreground"
            {...props}
        />
    </div>
));
SearchInput.displayName = "SearchInput";
