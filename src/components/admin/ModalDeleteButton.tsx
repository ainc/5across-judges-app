"use client";

import { useState } from "react";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";

type ModalDeleteButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  "aria-label"?: string;
};

/** Match previous modal delete hit box (25×30). */
const WIDTH = 25;
const HEIGHT = 30;

/**
 * MUI-only modal delete. One icon at a time + fixed px size via `sx`
 * (no PNGs, no stacked opacity CSS for Emotion to break on Netlify).
 */
export function ModalDeleteButton({
  onClick,
  disabled = false,
  "aria-label": ariaLabel = "Delete",
}: ModalDeleteButtonProps) {
  const [hovered, setHovered] = useState(false);
  const showOutline = hovered && !disabled;
  const Icon = showOutline ? DeleteForeverOutlinedIcon : DeleteForeverIcon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        width: WIDTH,
        height: HEIGHT,
        minWidth: WIDTH,
        minHeight: HEIGHT,
        maxWidth: WIDTH,
        maxHeight: HEIGHT,
        margin: 0,
        padding: 0,
        border: "none",
        background: "transparent",
        flexShrink: 0,
        alignSelf: "center",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        pointerEvents: disabled ? "none" : "auto",
        color: showOutline ? "#6b7280" : "#111827",
        overflow: "hidden",
      }}
    >
      <Icon
        sx={{
          fontSize: HEIGHT,
          width: HEIGHT,
          height: HEIGHT,
          maxWidth: HEIGHT,
          maxHeight: HEIGHT,
          display: "block",
          color: "inherit",
        }}
      />
    </button>
  );
}
