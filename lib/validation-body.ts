import { z } from "zod";

const optionalNumber = (max: number) => z.preprocess(
  (value) => value === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().min(0).max(max).optional(),
);

export const segmentSchema = z.object({
  leftArm: optionalNumber(200),
  rightArm: optionalNumber(200),
  leftLeg: optionalNumber(200),
  rightLeg: optionalNumber(200),
  trunk: optionalNumber(300),
});

export const bodyCompositionSnapshotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date."),
  weightKg: z.coerce.number().min(0).max(500),
  heightCm: optionalNumber(250),
  bmi: optionalNumber(100),
  smm: optionalNumber(200),
  bfm: optionalNumber(300),
  pbf: optionalNumber(100),
  waistHipRatio: optionalNumber(5),
  visceralFatLevel: optionalNumber(50),
  fatFreeMass: optionalNumber(400),
  bmr: optionalNumber(5000),
  obesityDegree: optionalNumber(100),
  smi: optionalNumber(100),
  segmentLean: segmentSchema.optional(),
  segmentFat: segmentSchema.optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
  measurementSource: z.string().max(200).optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other"]).optional(),
  age: z.coerce.number().int().min(10).max(120).optional(),
});
