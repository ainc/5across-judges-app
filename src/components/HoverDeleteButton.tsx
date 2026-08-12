"use client";

import { useState, type CSSProperties } from "react";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";

type HoverDeleteButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  "aria-label": string;
  title?: string;
};

/** Original modal delete hit box (same as prior PNG buttons). */
const BUTTON_WIDTH = 25;
const BUTTON_HEIGHT = 30;

const iconStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: BUTTON_HEIGHT,
  height: BUTTON_HEIGHT,
  fontSize: BUTTON_HEIGHT,
  display: "block",
};

/**
 * Modal row delete (judges / categories).
 * Keeps the original 25×30 size. Inline position/opacity so Netlify/Emotion
 * cannot show both filled + outline icons at once.
 */
export function HoverDeleteButton({
  onClick,
  disabled = false,
  "aria-label": ariaLabel,
  title,
}: HoverDeleteButtonProps) {
  const [hovered, setHovered] = useState(false);
  const showOutline = hovered && !disabled;

  return (
    <button
      type="button"
      className="deletebutton shrink-0 self-center"
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        width: BUTTON_WIDTH,
        height: BUTTON_HEIGHT,
        padding: 0,
        border: "none",
        background: "transparent",
        lineHeight: 0,
        color: "inherit",
        flexShrink: 0,
        alignSelf: "center",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "relative",
          display: "block",
          width: "100%",
          height: "100%",
        }}
      >
        <DeleteForeverIcon style={{ ...iconStyle, opacity: showOutline ? 0 : 1 }} />
        <DeleteForeverOutlinedIcon
          style={{ ...iconStyle, opacity: showOutline ? 1 : 0, color: "#6b7280" }}
        />
      </span>
    </button>
  );
}
