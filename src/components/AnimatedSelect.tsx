import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface AnimatedSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** "bar" = borderless pill inside a search bar, "filter" = bordered standalone select */
  variant?: "bar" | "filter";
}

export function AnimatedSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  disabled = false,
  className = "",
  variant = "filter",
}: AnimatedSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected ? selected.label : placeholder;

  const isBar = variant === "bar";

  const triggerCls = isBar
    ? `h-12 bg-white px-4 text-sm font-body text-gray-700 flex items-center justify-between w-full cursor-pointer select-none focus:outline-none ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`
    : `h-9 rounded border border-border bg-card px-3 text-xs font-body text-foreground flex items-center justify-between w-full cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-primary ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        className={triggerCls}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${!selected ? "text-gray-400" : ""}`}>
          {displayLabel}
        </span>
        <ChevronDown
          className={`flex-shrink-0 ml-2 w-4 h-4 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* Dropdown panel */}
      <div
        className={`absolute z-50 left-0 right-0 bg-white rounded-lg border border-gray-200 overflow-hidden
          transition-all duration-200 origin-top
          ${open ? "opacity-100 scale-y-100 translate-y-1 pointer-events-auto" : "opacity-0 scale-y-95 translate-y-0 pointer-events-none"}
        `}
        style={{
          boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
          minWidth: "100%",
          maxHeight: "260px",
          overflowY: "auto",
          transformOrigin: "top center",
        }}
        role="listbox"
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            role="option"
            aria-selected={opt.value === value}
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 text-sm font-body transition-colors duration-100 cursor-pointer
              ${opt.value === value
                ? "bg-primary/10 text-primary font-semibold"
                : "text-gray-700 hover:bg-gray-50"
              }
              ${opt.disabled ? "opacity-40 cursor-not-allowed" : ""}
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
