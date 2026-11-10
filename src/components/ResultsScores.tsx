"use client";

import { useState } from "react";
import { formatWeightedTotal } from "@/lib/judging-format";

type ScoreRow = {
  companyId: string;
  companyName: string;
  finalScore: number;
  rank: number;
  pitch: number;
};

export function ResultsScores({
  rankings,
  selectedCompanyId,
  onSelectCompany,
}: {
  rankings: ScoreRow[];
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
}) {
  const [hoveredCompanyId, setHoveredCompanyId] = useState<string | null>(null);
  const ordered = [...rankings].sort((a, b) => a.pitch - b.pitch);

  if (rankings.length === 0) {
    return <p className="text-sm text-muted">No results yet.</p>;
  }

  return (
    <section
      aria-label="Company scores"
      style={{
        display: "flex",
        alignItems: "flex-end",
        width: "100%",
        gap: 8,
        overflow: "visible",
      }}
    >
      {ordered.map((row) => {
        const hasSelection = selectedCompanyId !== "";
        const selected = hasSelection && row.companyId === selectedCompanyId;
        const hovered = hoveredCompanyId === row.companyId;
        const enlarged = selected || hovered;
        const dimmed = hasSelection && !enlarged;

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
              justifyContent: "flex-end",
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
              transformOrigin: "bottom center",
              transition: "transform 160ms ease",
              opacity: dimmed ? 0.4 : 1,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
                width: "100%",
                marginBottom: 10,
                lineHeight: 0.85,
              }}
            >
              <span
                style={{
                  color: "#EC3641",
                  fontSize: "clamp(2.4rem, 5vw, 4.75rem)",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatWeightedTotal(row.finalScore)}
              </span>
              <span
                style={{
                  color: "#000000",
                  fontSize: "clamp(0.7rem, 1.25vw, 1.05rem)",
                  fontWeight: 700,
                  marginLeft: 2,
                }}
              >
                /5
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
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
          </button>
        );
      })}
    </section>
  );
}
