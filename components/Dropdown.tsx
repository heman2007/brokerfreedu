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
        className="eyebrow py-2 border-b border-transparent hover:border-ink transition-colors"
        style={{ letterSpacing: "0.08em" }}
      >
        {trigger}
      </button>
      {open && (
        <div
          className={`dropdown-panel absolute ${align === "right" ? "right-0" : "left-0"} top-[calc(100%+10px)] bg-notice border border-rule min-w-[190px] flex flex-col py-2 z-50`}
          style={{ boxShadow: "0 8px 24px -8px rgba(20,18,14,0.15)" }}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
