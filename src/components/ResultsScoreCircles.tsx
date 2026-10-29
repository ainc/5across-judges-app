"use client";

import { useState } from "react";
import { formatWeightedTotal } from "@/lib/judging-format";

type CircleRow = {
  companyId: string;
  companyName: string;
  finalScore: number;
  rank: number;
  pitch: number;
};

const MAX_SCORE = 5;

const RING_COLORS = ["#E62F37", "#EB595F", "#F08287", "#939597", "#D1D2D4"] as const;

function shadeForScore(score: number, scoresHighToLow: number[]): string {
  const place = scoresHighToLow.indexOf(score);
  const index = place < 0 ? RING_COLORS.length - 1 : Math.min(place, RING_COLORS.length - 1);
  return RING_COLORS[index];
}

function selectedShade(color: string): string {
  const index = RING_COLORS.indexOf(color as (typeof RING_COLORS)[number]);
  if (index === 2) return RING_COLORS[1];
  if (index === 4) return RING_COLORS[3];
  return color;
}

function lighten(hex: string, amount: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${mix((value >> 16) & 255)}, ${mix((value >> 8) & 255)}, ${mix(value & 255)})`;
}

const SIZE = 100;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ScoreRing({ score, color }: { score: number; color: string }) {
  const fraction = Math.min(1, Math.max(0, score / MAX_SCORE));
  const filled = CIRCUMFERENCE * fraction;
  const full = fraction >= 0.999;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 220,
        containerType: "inline-size",
      }}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden="true"
        style={{ display: "block", width: "100%", height: "auto" }}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#F2F2F3"
          strokeWidth={STROKE}
        />
        {filled > 0 ? (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeDasharray={full ? undefined : `${filled} ${CIRCUMFERENCE}`}
            strokeLinecap="butt"
            style={{ transition: "stroke 180ms ease" }}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        ) : null}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          color: "var(--foreground)",
        }}
      >
        <span
          style={{
            fontSize: "24cqi",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatWeightedTotal(score)}
        </span>
        <span style={{ marginTop: "0.35em", fontSize: "8cqi", fontWeight: 600 }}>out of 5</span>
      </div>
    </div>
  );
}

export function ResultsScoreCircles({
  rankings,
  selectedCompanyId,
  onSelectCompany,
}: {
  rankings: CircleRow[];
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
}) {
  const [hoveredCompanyId, setHoveredCompanyId] = useState<string | null>(null);
  const ordered = [...rankings].sort((a, b) => a.pitch - b.pitch);
  const scoresHighToLow = [...new Set(rankings.map((row) => row.finalScore))].sort((a, b) => b - a);

  if (rankings.length === 0) {
    return <p className="text-sm text-muted">No results yet.</p>;
  }

  return (
    <section
      aria-label="Company score circles"
      style={{
        display: "flex",
        alignItems: "flex-start",
        width: "100%",
        gap: 8,
        overflow: "visible",
      }}
    >
      {ordered.map((row) => {
        const baseColor = shadeForScore(row.finalScore, scoresHighToLow);
        const hasSelection = selectedCompanyId !== "";
        const selected = hasSelection && row.companyId === selectedCompanyId;
        const hovered = hoveredCompanyId === row.companyId;
        const enlarged = selected || hovered;
        const color =
          hasSelection && !enlarged ? lighten(baseColor, 0.55) : selected ? selectedShade(baseColor) : baseColor;

        return (
          <button
            key={row.companyId}
            type="button"
            aria-pressed={selected}
            aria-label={`Pitch ${row.pitch}: ${row.companyName}, score ${formatWeightedTotal(row.finalScore)} out of 5`}
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
              transformOrigin: "center center",
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
              <span>Pitch {row.pitch}:</span>
              <span
                title={row.companyName}
                style={{
                  width: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.companyName}
              </span>
            </div>
            <ScoreRing score={row.finalScore} color={color} />
          </button>
        );
      })}
    </section>
  );
}
