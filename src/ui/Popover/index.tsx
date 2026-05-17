import { useCallback, useRef, useState, type ReactNode } from "react";

export type PopoverProps = {
  content: ReactNode;
  placement?: "top" | "right" | "bottom" | "left";
  trigger?: "hover" | "click";
  children: ReactNode;
};

const placementClass: Record<NonNullable<PopoverProps["placement"]>, string> = {
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
};

export function Popover({
  content,
  placement = "right",
  trigger = "hover",
  children,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLeave = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  };

  const show = useCallback(() => {
    clearLeave();
    setOpen(true);
  }, []);

  const scheduleHide = useCallback(() => {
    clearLeave();
    leaveTimer.current = setTimeout(() => setOpen(false), 80);
  }, []);

  const toggleClick = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  const hoverHandlers =
    trigger === "hover"
      ? {
          onMouseEnter: show,
          onMouseLeave: scheduleHide,
        }
      : {};

  const clickHandlers =
    trigger === "click"
      ? {
          onClick: toggleClick,
        }
      : {};

  return (
    <span className="relative inline-flex" {...hoverHandlers} {...clickHandlers}>
      {children}
      {open ? (
        <span
          className={[
            "absolute z-50 rounded-lg shadow-lg ring-1 ring-zinc-800",
            placementClass[placement],
          ].join(" ")}
          onMouseEnter={trigger === "hover" ? show : undefined}
          onMouseLeave={trigger === "hover" ? scheduleHide : undefined}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}

export default Popover;
