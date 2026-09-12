export type BodyCompositionInput = {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: "male" | "female" | "other";
};

export function calculateBmi(weightKg: number, heightCm: number) {
  if (!weightKg || !heightCm) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(2));
}

export function calculateBmr({ weightKg, heightCm, age, gender }: BodyCompositionInput) {
  if (!weightKg || !heightCm || !age) return 0;

  if (gender === "male") {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
  }

  if (gender === "female") {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
  }

  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age);
}

export function calculateWaistHipRatio(waistCm: number, hipCm: number) {
  if (!waistCm || !hipCm) return 0;
  return Number((waistCm / hipCm).toFixed(2));
}

export function calculateBodyFatMass(weightKg: number, bodyFatPercent: number) {
  if (!weightKg || bodyFatPercent < 0) return 0;
  return Number(((weightKg * bodyFatPercent) / 100).toFixed(2));
}

export function calculateLeanMass(weightKg: number, bodyFatPercent: number) {
  if (!weightKg || bodyFatPercent < 0) return 0;
  return Number((weightKg - (weightKg * bodyFatPercent) / 100).toFixed(2));
}

export function getSegmentKeys() {
  return ["leftArm", "rightArm", "leftLeg", "rightLeg", "trunk"] as const;
}

export type SegmentKey =
  | "leftArm"
  | "rightArm"
  | "leftLeg"
  | "rightLeg"
  | "trunk";

export function emptySegmentMap() {
  return {
    leftArm: 0,
    rightArm: 0,
    leftLeg: 0,
    rightLeg: 0,
    trunk: 0,
  } as Record<SegmentKey, number>;
}

export function getBodyCompositionStatus({
  weightKg,
  targetWeightKg,
}: {
  weightKg: number;
  targetWeightKg?: number | null;
}) {
  if (!targetWeightKg) return "no target";
  const delta = weightKg - targetWeightKg;

  if (Math.abs(delta) < 1) return "on target";
  if (delta > 0) return "above target";
  return "below target";
}
