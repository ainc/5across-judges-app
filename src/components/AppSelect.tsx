"use client";

import {
  Children,
  isValidElement,
  useMemo,
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

const headerFieldStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
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
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [headerHovered, setHeaderHovered] = useState(false);
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

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={anchor !== null}
        onClick={(event) => setAnchor(event.currentTarget)}
        onMouseEnter={header ? () => setHeaderHovered(true) : undefined}
        onMouseLeave={header ? () => setHeaderHovered(false) : undefined}
        style={{
          ...(header ? headerButtonStyle : wrapStyle),
          ...style,
          ...(!header && fullWidth ? { display: "flex", width: "100%" } : {}),
          ...(header ? { backgroundColor: headerHovered ? "#e5e7eb" : "#fff" } : {}),
          cursor: disabled ? "default" : "pointer",
        }}
      >
        <span
          style={
            header
              ? headerFieldStyle
              : {
                  ...fieldStyle,
                  ...(fullWidth
                    ? { flex: "1 1 auto", width: "100%" }
                    : { flex: "0 1 auto", width: "auto" }),
                }
          }
        >
          {selected?.label}
        </span>
        <span aria-hidden="true" style={caretStyle} />
      </button>
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
