import { z } from "zod";

const nonEmptyText = z.string().min(1).max(2000);
const adviceList = z.array(z.string().min(1).max(500)).max(12);

export const foodParsingSchema = z.object({
  foods: z.array(z.object({
    name: nonEmptyText,
    quantityGrams: z.number().positive().max(100000),
    calories: z.number().min(0).max(100000),
    protein: z.number().min(0).max(10000),
    carbohydrates: z.number().min(0).max(10000),
    fat: z.number().min(0).max(10000),
    fiber: z.number().min(0).max(10000),
    isAiEstimate: z.literal(true),
    confidence: z.number().min(0).max(1),
  })).max(20),
  notes: z.string().max(1000),
});

export const nutritionAnalysisSchema = z.object({
  summary: nonEmptyText,
  strengths: adviceList,
  considerations: adviceList,
  suggestions: adviceList,
  estimateDisclaimer: z.literal("These are AI-generated suggestions, not verified nutrition facts."),
});

export const workoutAnalysisSchema = z.object({
  summary: nonEmptyText,
  strengths: adviceList,
  recommendations: adviceList,
  cautions: adviceList,
});

export const progressAnalysisSchema = z.object({
  summary: nonEmptyText,
  observedTrends: adviceList,
  possibleExplanations: adviceList,
  nextSteps: adviceList,
  limitations: adviceList,
});

export const goalAnalysisSchema = z.object({
  summary: nonEmptyText,
  alignedBehaviors: adviceList,
  gaps: adviceList,
  suggestedActions: adviceList,
  cautions: adviceList,
});

export const dailySummarySchema = z.object({
  summary: nonEmptyText,
  nutrition: nonEmptyText,
  training: nonEmptyText,
  recovery: nonEmptyText,
  nextAction: nonEmptyText,
});

export const aiSchemas = {
  foodParsing: foodParsingSchema,
  nutritionAnalysis: nutritionAnalysisSchema,
  workoutAnalysis: workoutAnalysisSchema,
  progressAnalysis: progressAnalysisSchema,
  goalAnalysis: goalAnalysisSchema,
  dailySummary: dailySummarySchema,
} as const;

export type FoodParsingResult = z.infer<typeof foodParsingSchema>;
export type NutritionAnalysisResult = z.infer<typeof nutritionAnalysisSchema>;
export type WorkoutAnalysisResult = z.infer<typeof workoutAnalysisSchema>;
export type ProgressAnalysisResult = z.infer<typeof progressAnalysisSchema>;
export type GoalAnalysisResult = z.infer<typeof goalAnalysisSchema>;
export type DailySummaryResult = z.infer<typeof dailySummarySchema>;

export type JsonSchema = {
  type: "object";
  additionalProperties: false;
  properties: Record<string, unknown>;
  required: string[];
};

const textArray = { type: "array", items: { type: "string" }, maxItems: 12 };
const textField = { type: "string", minLength: 1, maxLength: 2000 };

export const aiJsonSchemas: Record<keyof typeof aiSchemas, JsonSchema> = {
  foodParsing: {
    type: "object",
    additionalProperties: false,
    required: ["foods", "notes"],
    properties: {
      foods: {
        type: "array",
        maxItems: 20,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "quantityGrams", "calories", "protein", "carbohydrates", "fat", "fiber", "isAiEstimate", "confidence"],
          properties: {
            name: textField,
            quantityGrams: { type: "number", exclusiveMinimum: 0, maximum: 100000 },
            calories: { type: "number", minimum: 0, maximum: 100000 },
            protein: { type: "number", minimum: 0, maximum: 10000 },
            carbohydrates: { type: "number", minimum: 0, maximum: 10000 },
            fat: { type: "number", minimum: 0, maximum: 10000 },
            fiber: { type: "number", minimum: 0, maximum: 10000 },
            isAiEstimate: { type: "boolean", const: true },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
        },
      },
      notes: { type: "string", maxLength: 1000 },
    },
  },
  nutritionAnalysis: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "strengths", "considerations", "suggestions", "estimateDisclaimer"],
    properties: { summary: textField, strengths: textArray, considerations: textArray, suggestions: textArray, estimateDisclaimer: { type: "string", const: "These are AI-generated suggestions, not verified nutrition facts." } },
  },
  workoutAnalysis: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "strengths", "recommendations", "cautions"],
    properties: { summary: textField, strengths: textArray, recommendations: textArray, cautions: textArray },
  },
  progressAnalysis: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "observedTrends", "possibleExplanations", "nextSteps", "limitations"],
    properties: { summary: textField, observedTrends: textArray, possibleExplanations: textArray, nextSteps: textArray, limitations: textArray },
  },
  goalAnalysis: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "alignedBehaviors", "gaps", "suggestedActions", "cautions"],
    properties: { summary: textField, alignedBehaviors: textArray, gaps: textArray, suggestedActions: textArray, cautions: textArray },
  },
  dailySummary: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "nutrition", "training", "recovery", "nextAction"],
    properties: { summary: textField, nutrition: textField, training: textField, recovery: textField, nextAction: textField },
  },
};
