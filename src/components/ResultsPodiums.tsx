"use client";

import { useState } from "react";
import { formatWeightedTotal } from "@/lib/judging-format";

type PodiumRow = {
  companyId: string;
  companyName: string;
  finalScore: number | null;
  rank: number;
  pitch: number;
};

const MIN_BAR_PERCENT = 28;

function barWidth(score: number | null, topScore: number): string {
  if (score == null || topScore <= 0) return `${MIN_BAR_PERCENT}%`;
  const fraction = Math.min(1, Math.max(0, score / topScore));
  return `${Math.max(MIN_BAR_PERCENT, Math.round(fraction * 100))}%`;
}

const LEADER_RED = "#EC3641";
const PODIUM_GRAY = "#e5e7eb";
const PODIUM_GRAY_DARK = "#5f6264";
const PODIUM_GRAY_LIGHT = "#f3f4f6";
const TEXT_ON_DARK = "#ffffff";
const TEXT_ON_LIGHT = "#323232";

function lighten(hex: string, amount: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `rgb(${mix((value >> 16) & 255)}, ${mix((value >> 8) & 255)}, ${mix(value & 255)})`;
}

function podiumFace(isLeader: boolean, selected: boolean, leaderSelected: boolean, hasSelection: boolean) {
  if (isLeader && (!hasSelection || leaderSelected)) {
    return { background: LEADER_RED, color: TEXT_ON_DARK };
  }
  if (selected) {
    return { background: PODIUM_GRAY_DARK, color: TEXT_ON_DARK };
  }
  if (!hasSelection) {
    return { background: PODIUM_GRAY, color: TEXT_ON_LIGHT };
  }
  if (isLeader) {
    return { background: lighten(LEADER_RED, 0.55), color: TEXT_ON_LIGHT };
  }
  return { background: PODIUM_GRAY_LIGHT, color: TEXT_ON_LIGHT };
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
  const ordered = [...rankings].sort((a, b) => a.pitch - b.pitch);
  const topScore = Math.max(0, ...rankings.flatMap((row) => (row.finalScore == null ? [] : [row.finalScore])));

  if (rankings.length === 0) {
    return <p className="text-sm text-muted">No results yet.</p>;
  }

  return (
    <section
      aria-label="Competition podiums"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "stretch",
        width: "100%",
        height: "100%",
        gap: 20,
        overflow: "visible",
      }}
    >
      {ordered.map((row) => {
        const rank = Number(row.rank);
        const isLeader = rank === 1;
        const hasSelection = selectedCompanyId !== "";
        const selected = hasSelection && row.companyId === selectedCompanyId;
        const leaderSelected = hasSelection && ordered.some((item) => item.rank === 1 && item.companyId === selectedCompanyId);
        const face = podiumFace(isLeader, selected, leaderSelected, hasSelection);
        const hovered = hoveredCompanyId === row.companyId;
        const enlarged = selected || hovered;

        return (
          <button
            key={row.companyId}
            type="button"
            aria-pressed={selected}
            aria-label={`Pitch ${row.pitch}, ${row.companyName}, rank ${rank}`}
            onClick={() => onSelectCompany(row.companyId)}
            onMouseEnter={() => setHoveredCompanyId(row.companyId)}
            onMouseLeave={() => setHoveredCompanyId((current) => (current === row.companyId ? null : current))}
            onFocus={() => setHoveredCompanyId(row.companyId)}
            onBlur={() => setHoveredCompanyId((current) => (current === row.companyId ? null : current))}
            style={{
              display: "flex",
              flex: "1 1 0%",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              minHeight: 0,
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
              transform: enlarged ? "scale(1.03)" : "scale(1)",
              transformOrigin: "left center",
              transition: "transform 160ms ease",
            }}
          >
            <div style={{ position: "relative", flex: "1 1 auto", alignSelf: "stretch", minWidth: 0 }}>
              <div
                className="podium-bar-clip"
                style={{
                  width: barWidth(row.finalScore, topScore),
                  height: "100%",
                  minHeight: 36,
                  minWidth: "max-content",
                  borderRadius: 6,
                  transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
              <div
                className="podium-bar"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  width: "100%",
                  height: "100%",
                  paddingLeft: 10,
                  paddingRight: 10,
                  background: face.background,
                  color: face.color,
                  transition: "background 180ms ease, color 180ms ease",
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontWeight: 800 }}>{row.companyName}</span>
                {` · Pitch ${row.pitch}${row.finalScore == null ? "" : ` · ${formatWeightedTotal(row.finalScore)}`}`}
              </div>
            </div>
            </div>
          </button>
        );
      })}
    </section>
  );
}
