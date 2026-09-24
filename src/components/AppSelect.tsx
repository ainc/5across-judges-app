import type { CSSProperties, SelectHTMLAttributes } from "react";

type AppSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const wrapStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  verticalAlign: "middle",
  backgroundColor: "#fff",
  boxSizing: "border-box",
};

const fieldStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  backgroundImage: "none",
  backgroundColor: "transparent",
  border: "none",
  padding: 0,
  margin: 0,
  height: "100%",
  font: "inherit",
  color: "inherit",
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

export function AppSelect({ className = "", style, ...props }: AppSelectProps) {
  const fullWidth = className.split(/\s+/).includes("w-full");
  return (
    <span
      className={className}
      style={{
        ...wrapStyle,
        ...(fullWidth ? { display: "flex", width: "100%" } : {}),
      }}
    >
      <select
        {...props}
        style={{
          ...fieldStyle,
          ...(fullWidth
            ? { flex: "1 1 auto", minWidth: 0, width: "100%" }
            : { flex: "0 1 auto", minWidth: "auto", width: "auto" }),
          ...style,
        }}
      />
      <span aria-hidden="true" style={caretStyle} />
    </span>
  );
}
