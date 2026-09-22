"use client";

type PodiumRow = {
  companyId: string;
  companyName: string;
  finalScore: number;
  rank: number;
};

const HEIGHT_PX: Record<number, number> = {
  1: 208,
  2: 160,
  3: 128,
  4: 96,
  5: 80,
};

const FACE: Record<number, { background: string; color: string }> = {
  1: { background: "#EE2524", color: "#ffffff" },
  2: { background: "#ED3742", color: "#ffffff" },
  3: { background: "#e45d65", color: "#ffffff" },
  4: { background: "#939597", color: "#ffffff" },
  5: { background: "#D1D2D4", color: "#323232" },
};

const VISUAL_ORDER = [4, 2, 1, 3, 5];

export function ResultsPodiums({ rankings }: { rankings: PodiumRow[] }) {
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
        minHeight: 352,
        gap: 8,
        overflow: "visible",
      }}
    >
      {rankings.map((row) => {
        const rank = Number(row.rank);
        const visual = VISUAL_ORDER.indexOf(rank);
        const face = FACE[rank] ?? FACE[5];

        return (
          <div
            key={row.companyId}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: "1 1 0%",
              minWidth: 0,
              order: visual === -1 ? rank + 10 : visual,
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
              {rank === 1 ? (
                <img src="/images/goldmedal.png" alt="First Place Medal" className="goldmedal" style={{ marginTop: 4 }} />
              ) : null}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: HEIGHT_PX[rank] ?? 64,
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
                background: face.background,
                color: face.color,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {Number(row.finalScore).toFixed(1)}
            </div>
          </div>
        );
      })}
    </section>
  );
}
