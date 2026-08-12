"use client";

import { useState, type CSSProperties } from "react";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";

type HoverDeleteButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  "aria-label": string;
  title?: string;
  className?: string;
  /** Extra class on the inner overlay container (e.g. pr-6). */
  containerClassName?: string;
};

const iconStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "100%",
  height: "100%",
  display: "block",
};

/**
 * Filled → outlined delete icon on hover.
 * Uses inline position/opacity so Emotion cannot leave both layers visible
 * in production (Netlify), which was breaking stacked-SVG CSS overlays.
 */
export function HoverDeleteButton({
  onClick,
  disabled = false,
  "aria-label": ariaLabel,
  title,
  className = "modaldelete",
  containerClassName = "modaldelete-container",
}: HoverDeleteButtonProps) {
  const [hovered, setHovered] = useState(false);
  const showOutline = hovered && !disabled;

  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className={containerClassName} aria-hidden style={{ position: "relative", display: "block", height: "100%", width: "100%" }}>
        <DeleteForeverIcon
          fontSize="inherit"
          style={{ ...iconStyle, opacity: showOutline ? 0 : 1 }}
        />
        <DeleteForeverOutlinedIcon
          fontSize="inherit"
          style={{ ...iconStyle, opacity: showOutline ? 1 : 0, color: "#6b7280" }}
        />
      </span>
    </button>
  );
}
