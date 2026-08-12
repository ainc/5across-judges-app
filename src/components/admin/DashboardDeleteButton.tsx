"use client";

import { useState } from "react";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";

type DashboardDeleteButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  "aria-label": string;
  title?: string;
  variant: "message" | "archive";
};

/**
 * Non-modal deletes. Exact same DOM + CSS size classes as before.
 * Only change for Netlify: render ONE icon (swap on hover) so Emotion
 * cannot show both layers. No sx size overrides.
 */
export function DashboardDeleteButton({
  onClick,
  disabled = false,
  "aria-label": ariaLabel,
  title,
  variant,
}: DashboardDeleteButtonProps) {
  const [hovered, setHovered] = useState(false);
  const showOutline = hovered && !disabled;

  if (variant === "archive") {
    return (
      <button
        type="button"
        className="archivedeletebutton"
        aria-label={ariaLabel}
        title={title}
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="archivedelete-container" aria-hidden>
          {showOutline ? (
            <DeleteForeverOutlinedIcon
              className="archivedeletebutton"
              fontSize="inherit"
              style={{ color: "#6b7280" }}
            />
          ) : (
            <DeleteForeverIcon className="archivedeletebutton" fontSize="inherit" />
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="messagedelete"
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="messagedelete-container pr-6" aria-hidden>
        {showOutline ? (
          <DeleteForeverOutlinedIcon
            className="messagedelete"
            fontSize="inherit"
            style={{ color: "#6b7280" }}
          />
        ) : (
          <DeleteForeverIcon className="messagedelete" fontSize="inherit" />
        )}
      </div>
    </button>
  );
}
