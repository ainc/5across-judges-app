"use client";

import { useState } from "react";
import { formatWeightedTotal } from "@/lib/judging-format";

type PodiumRow = {
  companyId: string;
  companyName: string;
  finalScore: number;
  rank: number;
};

const HEIGHT_PX: Record<number, number> = {
  1: 248,
  2: 192,
  3: 152,
  4: 116,
  5: 96,
};

const FACE: Record<number, { background: string; color: string }> = {
  1: { background: "#EC3641", color: "#ffffff" },
  2: { background: "#EF5E66", color: "#ffffff" },
  3: { background: "#F4868D", color: "#ffffff" },
  4: { background: "#939597", color: "#ffffff" },
  5: { background: "#D1D2D4", color: "#323232" },
};

const VISUAL_ORDER = [4, 2, 1, 3, 5];

function lighten(hex: string, amount: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${mix((value >> 16) & 255)}, ${mix((value >> 8) & 255)}, ${mix(value & 255)})`;
}

export function ResultsPodiums({
  rankings,
  selectedCompanyId,
  onSelectCompany,
}: {
  rankings: PodiumRow[];
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
}) {
  const [hoveredCompanyId, setHoveredCompanyId] = useState<string | null>(null);

  if (rankings.length === 0) {
    return <p className="text-sm text-gray-600">No results yet.</p>;
  }

  return (
    <section
      aria-label="Competition podiums"
      style={{
        display: "flex",
        alignItems: "flex-end",
        width: "100%",
        gap: 8,
        overflow: "visible",
      }}
    >
      {rankings.map((row) => {
        const rank = Number(row.rank);
        const visual = VISUAL_ORDER.indexOf(rank);
        const face = FACE[rank] ?? FACE[5];

        const hasSelection = selectedCompanyId !== "";
        const selected = hasSelection && row.companyId === selectedCompanyId;
        const displayFace =
          selected && rank === 3 ? FACE[2] : selected && rank === 5 ? FACE[4] : face;
        const hovered = hoveredCompanyId === row.companyId;
        const enlarged = selected || hovered;
        const dimmed = hasSelection && !enlarged;

        return (
          <button
            key={row.companyId}
            type="button"
            aria-pressed={selected}
            aria-label={`${row.companyName}, rank ${rank}`}
            onClick={() => onSelectCompany(row.companyId)}
            onMouseEnter={() => setHoveredCompanyId(row.companyId)}
            onMouseLeave={() => setHoveredCompanyId((current) => (current === row.companyId ? null : current))}
            onFocus={() => setHoveredCompanyId(row.companyId)}
            onBlur={() => setHoveredCompanyId((current) => (current === row.companyId ? null : current))}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: "1 1 0%",
              minWidth: 0,
              order: visual === -1 ? rank + 10 : visual,
              margin: 0,
              padding: 0,
              border: "none",
              background: "transparent",
              color: "inherit",
              font: "inherit",
              cursor: "pointer",
              position: "relative",
              zIndex: enlarged ? 1 : 0,
              transform: enlarged ? "scale(1.06)" : "scale(1)",
              transformOrigin: "bottom center",
              transition: "transform 160ms ease",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                minHeight: 48,
                marginBottom: 8,
                textAlign: "center",
                fontSize: 14,
                fontWeight: 600,
                width: "100%",
              }}
            >
              <span style={{ width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.companyName}
              </span>
            </div>
            <div
              className="podium-bar-clip"
              style={{
                width: "100%",
                height: HEIGHT_PX[rank] ?? 64,
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
              }}
            >
              <div
                className="podium-bar"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  width: "100%",
                  height: "100%",
                  paddingBottom: 10,
                  background: dimmed ? lighten(face.background, 0.55) : displayFace.background,
                  color: dimmed ? "#323232" : displayFace.color,
                  transition: "background 180ms ease, color 180ms ease",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Score: {formatWeightedTotal(row.finalScore)}
              </div>
            </div>
          </button>
        );
      })}
    </section>
  );
}
