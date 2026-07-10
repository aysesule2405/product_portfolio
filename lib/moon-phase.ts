const J2000_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
export const SYNODIC_MONTH = 29.53058867;
const DAY_MS = 86_400_000;

export interface MoonPhaseData {
  age: number;
  illumination: number;
  phaseName: string;
  exactPhase: number;
  phaseIndex: number;
  daysToFull: number;
  nextFullDate: Date;
  isWaxing: boolean;
}

export const MOON_PHASE_NAMES = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent",
];

export function calculateMoonPhase(date: Date): MoonPhaseData {
  const elapsed = (date.getTime() - J2000_NEW_MOON) / DAY_MS;
  const age = ((elapsed % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const theta = (age / SYNODIC_MONTH) * 2 * Math.PI;
  const illumination = (1 - Math.cos(theta)) / 2;
  const isWaxing = age < SYNODIC_MONTH / 2;
  const daysToFull = isWaxing ? SYNODIC_MONTH / 2 - age : SYNODIC_MONTH - age + SYNODIC_MONTH / 2;

  let phaseName: string;
  if (age < 1.85) phaseName = "New Moon";
  else if (age < 7.38) phaseName = "Waxing Crescent";
  else if (age < 9.22) phaseName = "First Quarter";
  else if (age < 14.77) phaseName = "Waxing Gibbous";
  else if (age < 16.61) phaseName = "Full Moon";
  else if (age < 22.15) phaseName = "Waning Gibbous";
  else if (age < 23.99) phaseName = "Last Quarter";
  else phaseName = "Waning Crescent";

  return {
    age,
    illumination,
    phaseName,
    exactPhase: (age / SYNODIC_MONTH) * 8,
    phaseIndex: Math.round((age / SYNODIC_MONTH) * 8) % 8,
    daysToFull,
    nextFullDate: new Date(date.getTime() + daysToFull * DAY_MS),
    isWaxing,
  };
}

export function moonDiscPath(exactPhase: number, r: number, cx: number, cy: number): string {
  const a = (exactPhase / 8) * 2 * Math.PI;
  const lit = (1 - Math.cos(a)) / 2;
  if (lit < 0.01) return "";
  if (lit > 0.99) {
    return `M${cx},${cy - r} A${r},${r} 0 1,1 ${cx},${cy + r} A${r},${r} 0 1,1 ${cx},${cy - r}Z`;
  }

  const waxing = exactPhase < 4;
  const terminatorX = Math.abs(Math.cos(a)) * r;
  const moonSweep = waxing ? 1 : 0;
  if (terminatorX < 0.5) {
    return `M${cx},${cy - r} A${r},${r} 0 0,${moonSweep} ${cx},${cy + r}L${cx},${cy - r}`;
  }

  const terminatorSweep = waxing ? (lit >= 0.5 ? 1 : 0) : lit < 0.5 ? 1 : 0;
  return `M${cx},${cy - r} A${r},${r} 0 0,${moonSweep} ${cx},${cy + r} A${terminatorX},${r} 0 0,${terminatorSweep} ${cx},${cy - r}Z`;
}
