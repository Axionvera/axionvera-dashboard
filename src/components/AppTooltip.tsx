import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

interface AppTooltipProps {
  children: React.ReactElement;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

export const AppTooltip = React.memo(function AppTooltip({
  children,
  content,
  side = "top",
  align = "center",
  sideOffset = 6,
}: AppTooltipProps) {
  const [open, setOpen] = React.useState(false);

  const child = React.Children.only(children);

  return (
    <TooltipPrimitive.Provider delayDuration={100}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <TooltipPrimitive.Trigger asChild>
          {React.cloneElement(child, {
            tabIndex: 0,
          })}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={sideOffset}
            avoidCollisions
            collisionPadding={8}
            className="z-50 overflow-hidden rounded-lg border border-border-primary bg-background-primary px-3 py-2 shadow-lg shadow-black/30 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            style={{
              maxWidth: "320px",
            }}
          >
            <div className="text-xs font-normal leading-relaxed text-text-primary">
              {content}
            </div>
            <TooltipPrimitive.Arrow className="fill-border-primary" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
});

AppTooltip.displayName = "AppTooltip";
