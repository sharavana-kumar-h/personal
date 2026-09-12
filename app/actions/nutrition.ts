"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { foodEntrySchema, mealSchema, nutritionGoalSchema } from "@/lib/validation-nutrition";

function formValue(formData: FormData, key: string) {
  return formData.get(key) ?? undefined;
}

function parseOrThrow<T>(result: { success: boolean; data?: T; error?: { issues: { message: string }[] } }) {
  if (!result.success) {
    throw new Error(result.error?.issues[0]?.message ?? "Invalid nutrition data.");
  }

  return result.data as T;
}

export async function saveNutritionGoal(formData: FormData) {
  const user = await requireUser();
  const data = parseOrThrow(nutritionGoalSchema.safeParse({
    calorieTarget: formValue(formData, "calorieTarget"),
    proteinTarget: formValue(formData, "proteinTarget"),
    carbTarget: formValue(formData, "carbTarget"),
    fatTarget: formValue(formData, "fatTarget"),
    fiberTarget: formValue(formData, "fiberTarget"),
  }));

  await prisma.nutritionGoal.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  revalidatePath("/nutrition");
}

export async function createMeal(formData: FormData) {
  const user = await requireUser();
  const data = parseOrThrow(mealSchema.safeParse({
    date: String(formData.get("date") ?? ""),
    mealType: String(formData.get("mealType") ?? ""),
    customName: String(formData.get("customName") ?? ""),
  }));
  const name = data.mealType === "CUSTOM" ? data.customName : data.mealType;

  if (!name) {
    throw new Error("A custom meal name is required.");
  }

  await prisma.meal.create({
    data: {
      userId: user.id,
      date: new Date(`${data.date}T00:00:00.000Z`),
      mealType: data.mealType,
      name,
    },
  });

  revalidatePath("/nutrition");
  redirect(`/nutrition?date=${data.date}`);
}

export async function addFoodEntry(formData: FormData) {
  const user = await requireUser();
  const data = parseOrThrow(foodEntrySchema.safeParse({
    mealId: formValue(formData, "mealId"),
    name: formValue(formData, "name"),
    quantityGrams: formValue(formData, "quantityGrams"),
    calories: formValue(formData, "calories"),
    protein: formValue(formData, "protein"),
    carbohydrates: formValue(formData, "carbohydrates"),
    fat: formValue(formData, "fat"),
    fiber: formValue(formData, "fiber"),
    isAiEstimate: formData.get("isAiEstimate") === "on",
    sourceNote: formValue(formData, "sourceNote"),
  }));

  const meal = await prisma.meal.findFirst({ where: { id: data.mealId, userId: user.id } });
  if (!meal) {
    throw new Error("Meal not found.");
  }

  await prisma.foodEntry.create({ data });
  revalidatePath("/nutrition");
  redirect(`/nutrition?date=${meal.date.toISOString().slice(0, 10)}`);
}

export async function updateFoodEntry(id: string, formData: FormData) {
  const user = await requireUser();
  const data = parseOrThrow(foodEntrySchema.omit({ mealId: true }).safeParse({
    name: formValue(formData, "name"),
    quantityGrams: formValue(formData, "quantityGrams"),
    calories: formValue(formData, "calories"),
    protein: formValue(formData, "protein"),
    carbohydrates: formValue(formData, "carbohydrates"),
    fat: formValue(formData, "fat"),
    fiber: formValue(formData, "fiber"),
    isAiEstimate: formData.get("isAiEstimate") === "on",
    sourceNote: formValue(formData, "sourceNote"),
  }));

  const existing = await prisma.foodEntry.findFirst({
    where: { id, meal: { userId: user.id } },
    include: { meal: true },
  });
  if (!existing) {
    throw new Error("Food entry not found.");
  }

  await prisma.foodEntry.update({ where: { id }, data });
  revalidatePath("/nutrition");
  redirect(`/nutrition?date=${existing.meal.date.toISOString().slice(0, 10)}`);
}

export async function deleteFoodEntry(id: string) {
  const user = await requireUser();
  const existing = await prisma.foodEntry.findFirst({
    where: { id, meal: { userId: user.id } },
    include: { meal: true },
  });
  if (!existing) {
    throw new Error("Food entry not found.");
  }

  await prisma.foodEntry.delete({ where: { id } });
  revalidatePath("/nutrition");
  redirect(`/nutrition?date=${existing.meal.date.toISOString().slice(0, 10)}`);
}
