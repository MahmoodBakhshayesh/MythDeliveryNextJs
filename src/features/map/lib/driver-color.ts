/** Stable HSL color per driver id for map layers and legend. */
export function colorForDriverId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = id.charCodeAt(i) + ((h << 5) - h);
  }
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 72% 42%)`;
}

/** Distinct hues for route/vehicle polygons (golden-angle spacing + stable tie-break). */
export function colorForMapRoute(routeId: string, index: number, total: number): string {
  const goldenAngle = 137.508;
  let tie = 0;
  for (let i = 0; i < routeId.length; i++) {
    tie = routeId.charCodeAt(i) + ((tie << 5) - tie);
  }
  const spread = total > 1 ? 360 / total : 0;
  const hue =
    (index * goldenAngle + spread * 0.35 + (Math.abs(tie) % 17)) % 360;
  return `hsl(${hue.toFixed(0)} 78% 46%)`;
}
