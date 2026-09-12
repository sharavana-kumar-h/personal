import { z } from "zod";

const requiredNumber = (max: number) => z.preprocess(
  (value) => value === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().min(0).max(max),
);
const optionalNumber = (max: number) => z.preprocess(
  (value) => value === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().min(0).max(max).optional(),
);

export const mealSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date."),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "CUSTOM"]),
  customName: z.string().max(100).optional().or(z.literal("")),
});

export const foodEntrySchema = z.object({
  mealId: z.string().min(1),
  name: z.string().min(1).max(200),
  quantityGrams: z.coerce.number().positive().max(100000),
  calories: z.coerce.number().min(0).max(100000),
  protein: requiredNumber(10000),
  carbohydrates: requiredNumber(10000),
  fat: requiredNumber(10000),
  fiber: requiredNumber(10000),
  isAiEstimate: z.coerce.boolean().optional().default(false),
  sourceNote: z.string().max(500).optional().or(z.literal("")),
});

export const nutritionGoalSchema = z.object({
  calorieTarget: z.coerce.number().int().min(0).max(100000),
  proteinTarget: z.coerce.number().min(0).max(10000),
  carbTarget: optionalNumber(10000),
  fatTarget: optionalNumber(10000),
  fiberTarget: optionalNumber(10000),
});
