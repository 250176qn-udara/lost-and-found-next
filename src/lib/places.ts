// Place names like "Bldg A · Lab 2F": building, floor and room. Shared by the floor plan and the alerts (no server-only).

export const NO_FLOOR = '';

/** "Lab 2F" / "B1F" / "2階" / "地下1階" -> "2F" / "B1F"; NO_FLOOR when the name has none. */
function floorOf(s: string): string {
  let m = s.match(/\b(B?\d{1,2})\s*F\b/i);
  if (m) return `${m[1].toUpperCase()}F`;
  m = s.match(/(地下)?(\d{1,2})\s*階/);
  return m ? `${m[1] ? 'B' : ''}${m[2]}F` : NO_FLOOR;
}

export function parsePlace(name: string, label: string): { building: string; floor: string; label: string } {
  const b = name.match(/^(?:Bldg\s*([A-Z0-9]+)|([A-Z0-9]+)\s*号館)\s*[·・\-]?\s*(.*)$/i);
  const floor = floorOf(name);
  // Room label from the (translated) name: drop the building and the floor.
  const clean = label
    .replace(/^(Bldg\s*[A-Z0-9]+|[A-Z0-9]+\s*号館)\s*[·・\-]?\s*/i, '')
    .replace(/\s*(B?\d{1,2}\s*F|(地下)?\d{1,2}\s*階)\s*$/i, '')
    .trim();
  return { building: b ? (b[1] ?? b[2]).toUpperCase() : '', floor, label: clean || label };
}

/** Floors top to bottom: 5F … 1F, B1F, then rooms without a floor. */
export function floorRank(f: string) {
  if (f === NO_FLOOR) return -100;
  const m = f.match(/^(B?)(\d+)F$/);
  return m ? (m[1] ? -Number(m[2]) : Number(m[2])) : -50;
}

/** The building a place belongs to ("A", "B" …), or "Other" for places outside the buildings. */
export function buildingOf(place: string): string {
  return parsePlace(place, place).building || 'Other';
}
