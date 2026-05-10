/** Stable HSL color per driver id for map layers and legend. */
export function colorForDriverId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = id.charCodeAt(i) + ((h << 5) - h);
  }
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 72% 42%)`;
}
