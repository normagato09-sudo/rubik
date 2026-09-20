/**
 * Shared glyph for every generated app icon (PWA icons, apple-icon):
 * the same 3x3 face grid as `components/cube-mark.tsx`, redrawn with
 * plain inline styles because `ImageResponse` (Satori) can't read
 * Tailwind classes or CSS custom properties.
 */
const FACE_COLORS = [
  "#f4f4f4",
  "#e8402c",
  "#1054d6",
  "#ffd500",
  "#ff8c1a",
  "#009b48",
  "#ffd500",
  "#f4f4f4",
  "#e8402c",
];

export function RubikoIcon({ size }: { size: number }) {
  const padding = Math.round(size * 0.2);
  const gap = Math.max(2, Math.round(size * 0.035));
  const gridSize = size - padding * 2;
  const cell = (gridSize - gap * 4) / 3;
  const rows = [FACE_COLORS.slice(0, 3), FACE_COLORS.slice(3, 6), FACE_COLORS.slice(6, 9)];

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#12141c",
        borderRadius: Math.round(size * 0.22),
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap,
          width: gridSize,
          height: gridSize,
          padding: gap,
          background: "#2f3340",
          borderRadius: Math.round(size * 0.1),
        }}
      >
        {rows.map((row, r) => (
          <div key={r} style={{ display: "flex", flexDirection: "row", gap, flex: 1 }}>
            {row.map((color, c) => (
              <div
                key={c}
                style={{ background: color, borderRadius: Math.round(size * 0.02), width: cell, height: cell }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
