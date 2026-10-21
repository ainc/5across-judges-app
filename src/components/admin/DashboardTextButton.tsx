"use client";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Children, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";

const buttonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  width: "100%",
  margin: 0,
  padding: "0.7rem 1rem",
  border: "none",
  borderRadius: 0,
  color: "inherit",
  font: "inherit",
  textAlign: "left",
};

export function DashboardTextActions({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  return (
    <div
      className="dash-text-action-list"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "calc(100% + 2rem)",
        maxWidth: "none",
        marginLeft: "-1rem",
        marginRight: "-1rem",
      }}
    >
      {items.map((child, index) => (
        <div key={index} style={{ width: "100%" }}>
          {child}
          {index < items.length - 1 ? (
            <div
              style={{
                height: 1,
                backgroundColor: "#d1d5db",
                marginLeft: "1rem",
                marginRight: "1rem",
              }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function DashboardTextButton({
  children,
  className = "",
  type = "button",
  disabled,
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...buttonStyle,
        backgroundColor: !disabled && hovered ? "#e5e7eb" : "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
    >
      <span>{children}</span>
      <ChevronRightIcon sx={{ fontSize: 18, flexShrink: 0 }} />
    </button>
  );
}
