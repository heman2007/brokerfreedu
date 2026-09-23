"use client";

import { useEffect, useRef, useState } from "react";

export default function Dropdown({
  trigger,
  children,
  align = "right",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-2 rounded-sm border border-transparent hover:border-rule transition-colors text-[14.5px] font-medium"
      >
        {trigger}
      </button>
      {open && (
        <div
          className={`dropdown-panel absolute ${align === "right" ? "right-0" : "left-0"} top-[calc(100%+6px)] bg-paper border-[1.5px] border-rule rounded-sm min-w-[180px] flex flex-col py-1 shadow-lg z-50`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
