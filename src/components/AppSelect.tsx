"use client";

import {
  Children,
  isValidElement,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

type AppSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  header?: boolean;
};

type Option = {
  value: string;
  label: ReactNode;
};

const menuFont: CSSProperties = {
  fontFamily: "var(--font-open-sans), \"Open Sans\", sans-serif",
  fontWeight: 300,
  fontSize: "10pt",
  letterSpacing: "normal",
  textTransform: "none",
};

const wrapStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  verticalAlign: "middle",
  backgroundColor: "#fff",
  boxSizing: "border-box",
  appearance: "none",
  cursor: "pointer",
  ...menuFont,
};

const fieldStyle: CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  margin: 0,
  minWidth: 0,
  color: "inherit",
  textAlign: "left",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  ...menuFont,
};

const headerButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.4rem",
  width: "calc(100% - 0.7rem)",
  margin: "0.35rem",
  padding: "0.5rem",
  border: "1px solid #323232",
  borderRadius: "4px",
  background: "#fff",
  boxSizing: "border-box",
  cursor: "pointer",
  color: "inherit",
  font: "inherit",
  textAlign: "left",
};

const caretStyle: CSSProperties = {
  flex: "0 0 0.75rem",
  width: "0.75rem",
  height: "0.75rem",
  pointerEvents: "none",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
  backgroundSize: "contain",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%23323232' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M4 6.5 L8 10.5 L12 6.5'/%3E%3C/svg%3E\")",
};

const menuItemSx = {
  fontFamily: "var(--font-open-sans), \"Open Sans\", sans-serif",
  fontWeight: 300,
  fontSize: "10pt",
  letterSpacing: "normal",
  textTransform: "none",
  whiteSpace: "normal",
  overflowWrap: "anywhere",
} as const;

function PitchChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path
        d={direction === "left" ? "M13.25 8 L9.25 12 L13.25 16" : "M10.75 8 L14.75 12 L10.75 16"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function readOptions(children: ReactNode): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode }>(child)) {
      return [];
    }
    return [{ value: String(child.props.value ?? ""), label: child.props.children }];
  });
}

export function AppSelect({
  className = "",
  style,
  value,
  onChange,
  children,
  disabled,
  header = false,
  "aria-label": ariaLabel,
}: AppSelectProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [boxHovered, setBoxHovered] = useState(false);
  const options = useMemo(() => readOptions(children), [children]);
  const selectedValue = String(value ?? "");
  const selected = options.find((option) => option.value === selectedValue) ?? options[0];
  const fullWidth = className.split(/\s+/).includes("w-full");

  function choose(next: string) {
    setAnchor(null);
    onChange?.({
      target: { value: next },
    } as ChangeEvent<HTMLSelectElement>);
  }

  function step(direction: -1 | 1) {
    if (disabled || options.length === 0) return;
    const index = options.findIndex((option) => option.value === selectedValue);
    const current = index >= 0 ? index : 0;
    const nextIndex = (current + direction + options.length) % options.length;
    choose(options[nextIndex].value);
  }

  const pitchButtonClass =
    "inline-flex shrink-0 items-center justify-center border-0 bg-transparent p-0 text-[#323232] disabled:cursor-default disabled:opacity-40";

  return (
    <>
      {header ? (
        <div
          ref={headerRef}
          className={className}
          onMouseEnter={() => setBoxHovered(true)}
          onMouseLeave={() => setBoxHovered(false)}
          style={{
            ...headerButtonStyle,
            ...style,
            cursor: "default",
            backgroundColor: boxHovered ? "#e5e7eb" : "#fff",
          }}
        >
          <button
            type="button"
            aria-label="Previous pitch"
            disabled={disabled || options.length === 0}
            onClick={() => step(-1)}
            className={pitchButtonClass}
          >
            <PitchChevron direction="left" />
          </button>
          <button
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            aria-haspopup="listbox"
            aria-expanded={anchor !== null}
            onClick={() => {
              if (headerRef.current) setAnchor(headerRef.current);
            }}
            className="flex min-w-0 flex-1 cursor-pointer items-center self-stretch border-0 bg-transparent p-0 text-left disabled:cursor-default"
            style={{ font: "inherit", color: "inherit" }}
          >
            <span className="min-w-0 truncate">{selected?.label}</span>
          </button>
          <button
            type="button"
            aria-label="Next pitch"
            disabled={disabled || options.length === 0}
            onClick={() => step(1)}
            className={pitchButtonClass}
          >
            <PitchChevron direction="right" />
          </button>
        </div>
      ) : (
      <button
        type="button"
        className={className}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={anchor !== null}
        onClick={(event) => setAnchor(event.currentTarget)}
        style={{
          ...wrapStyle,
          ...style,
          ...(fullWidth ? { display: "flex", width: "100%" } : {}),
          cursor: disabled ? "default" : "pointer",
        }}
      >
        <span
          style={{
            ...fieldStyle,
            ...(fullWidth
              ? { flex: "1 1 auto", width: "100%" }
              : { flex: "0 1 auto", width: "auto" }),
          }}
        >
          {selected?.label}
        </span>
        <span aria-hidden="true" style={caretStyle} />
      </button>
      )}
      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              width: anchor?.offsetWidth,
              minWidth: anchor?.offsetWidth,
              maxWidth: anchor?.offsetWidth,
              boxSizing: "border-box",
            },
          },
          list: {
            sx: { width: "100%", boxSizing: "border-box", paddingTop: 0, paddingBottom: 0 },
          },
        }}
        sx={{
          "& .MuiMenuItem-root": menuItemSx,
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === selectedValue}
            onClick={() => choose(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
