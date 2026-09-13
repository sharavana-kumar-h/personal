"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { bodyCompositionSnapshotSchema } from "@/lib/validation-body";
import { calculateBmi, calculateBmr } from "@/lib/body-composition";
import { measurePerformance } from "@/lib/perf";

export type BodyCompositionFormState = {
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function bodyFieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return error.issues.reduce<Record<string, string[]>>((errors, issue) => {
    const key = issue.path.join(".");
    errors[key] = [...(errors[key] ?? []), issue.message];
    return errors;
  }, {});
}

export async function createBodyCompositionSnapshot(previousState: BodyCompositionFormState, formData: FormData): Promise<BodyCompositionFormState> {
  const requestId = crypto.randomUUID();
  const user = await requireUser({ requestId, operation: "body-create-action" });

  const raw = {
    date: String(formData.get("date") ?? ""),
    weightKg: formData.get("weightKg") ?? undefined,
    heightCm: formData.get("heightCm") ?? undefined,
    bmi: formData.get("bmi") ?? undefined,
    smm: formData.get("smm") ?? undefined,
    bfm: formData.get("bfm") ?? undefined,
    pbf: formData.get("pbf") ?? undefined,
    waistHipRatio: formData.get("waistHipRatio") ?? undefined,
    visceralFatLevel: formData.get("visceralFatLevel") ?? undefined,
    fatFreeMass: formData.get("fatFreeMass") ?? undefined,
    bmr: formData.get("bmr") ?? undefined,
    obesityDegree: formData.get("obesityDegree") ?? undefined,
    smi: formData.get("smi") ?? undefined,
    notes: String(formData.get("notes") ?? ""),
    measurementSource: String(formData.get("measurementSource") ?? ""),
    gender: (String(formData.get("gender") ?? "") || undefined) as "male" | "female" | "other" | undefined,
    age: formData.get("age") ?? undefined,
    segmentLean: {
      leftArm: formData.get("segmentLean.leftArm") ?? undefined,
      rightArm: formData.get("segmentLean.rightArm") ?? undefined,
      leftLeg: formData.get("segmentLean.leftLeg") ?? undefined,
      rightLeg: formData.get("segmentLean.rightLeg") ?? undefined,
      trunk: formData.get("segmentLean.trunk") ?? undefined,
    },
    segmentFat: {
      leftArm: formData.get("segmentFat.leftArm") ?? undefined,
      rightArm: formData.get("segmentFat.rightArm") ?? undefined,
      leftLeg: formData.get("segmentFat.leftLeg") ?? undefined,
      rightLeg: formData.get("segmentFat.rightLeg") ?? undefined,
      trunk: formData.get("segmentFat.trunk") ?? undefined,
    },
  };

  const parsed = bodyCompositionSnapshotSchema.safeParse(raw);

  if (!parsed.success) {
    return { message: "Please correct the highlighted fields.", fieldErrors: bodyFieldErrors(parsed.error) };
  }

  const data = parsed.data;

  const weightKg = Number(data.weightKg ?? 0);
  const heightCm = Number(data.heightCm ?? 0);
  const age = Number(data.age ?? 0);
  const gender = data.gender ?? "other";

  const finalBmi = data.bmi ?? (heightCm > 0 ? calculateBmi(weightKg, heightCm) : null);
  const finalBmr = data.bmr ?? (heightCm > 0 && age > 0 ? calculateBmr({ weightKg, heightCm, age, gender }) : null);

  const snapshot = await measurePerformance("body.createSnapshot", { requestId }, () => prisma.bodyCompositionSnapshot.create({
    data: {
      userId: user.id,
      date: new Date(data.date),
      weightKg,
      heightCm: data.heightCm ?? null,
      bmi: finalBmi,
      smm: data.smm ?? null,
      bfm: data.bfm ?? null,
      pbf: data.pbf ?? null,
      waistHipRatio: data.waistHipRatio ?? null,
      visceralFatLevel: data.visceralFatLevel ?? null,
      fatFreeMass: data.fatFreeMass ?? null,
      bmr: finalBmr,
      obesityDegree: data.obesityDegree ?? null,
      smi: data.smi ?? null,
      notes: data.notes ?? "",
      measurementSource: data.measurementSource ?? "manual",
      leanSegments: {
        create: Object.entries(data.segmentLean ?? {}).filter(([, value]) => value !== undefined).map(([key, value]) => ({
          segment: key,
          value: Number(value ?? 0),
        })),
      },
      fatSegments: {
        create: Object.entries(data.segmentFat ?? {}).filter(([, value]) => value !== undefined).map(([key, value]) => ({
          segment: key,
          value: Number(value ?? 0),
        })),
      },
    },
  }));

  revalidatePath("/body");
  revalidatePath("/dashboard");
  revalidatePath("/body/compare");
  revalidatePath("/body/trends");
  redirect(`/body/${snapshot.id}`);
}

export async function updateBodyCompositionSnapshot(id: string, formData: FormData) {
  const requestId = crypto.randomUUID();
  const user = await requireUser();

  const existing = await prisma.bodyCompositionSnapshot.findUnique({ where: { id } });

  if (!existing || existing.userId !== user.id) {
    throw new Error("Not authorized to update this record.");
  }

  const raw = {
    date: String(formData.get("date") ?? existing.date.toISOString()),
    weightKg: formData.get("weightKg") ?? existing.weightKg,
    heightCm: formData.get("heightCm") ?? existing.heightCm,
    bmi: formData.get("bmi") ?? existing.bmi,
    smm: formData.get("smm") ?? existing.smm,
    bfm: formData.get("bfm") ?? existing.bfm,
    pbf: formData.get("pbf") ?? existing.pbf,
    waistHipRatio: formData.get("waistHipRatio") ?? existing.waistHipRatio,
    visceralFatLevel: formData.get("visceralFatLevel") ?? existing.visceralFatLevel,
    fatFreeMass: formData.get("fatFreeMass") ?? existing.fatFreeMass,
    bmr: formData.get("bmr") ?? existing.bmr,
    obesityDegree: formData.get("obesityDegree") ?? existing.obesityDegree,
    smi: formData.get("smi") ?? existing.smi,
    notes: String(formData.get("notes") ?? existing.notes ?? ""),
    measurementSource: String(formData.get("measurementSource") ?? existing.measurementSource ?? ""),
    gender: (String(formData.get("gender") ?? "") || undefined) as "male" | "female" | "other" | undefined,
    age: formData.get("age") ?? undefined,
    segmentLean: {
      leftArm: formData.get("segmentLean.leftArm") ?? undefined,
      rightArm: formData.get("segmentLean.rightArm") ?? undefined,
      leftLeg: formData.get("segmentLean.leftLeg") ?? undefined,
      rightLeg: formData.get("segmentLean.rightLeg") ?? undefined,
      trunk: formData.get("segmentLean.trunk") ?? undefined,
    },
    segmentFat: {
      leftArm: formData.get("segmentFat.leftArm") ?? undefined,
      rightArm: formData.get("segmentFat.rightArm") ?? undefined,
      leftLeg: formData.get("segmentFat.leftLeg") ?? undefined,
      rightLeg: formData.get("segmentFat.rightLeg") ?? undefined,
      trunk: formData.get("segmentFat.trunk") ?? undefined,
    },
  };

  const parsed = bodyCompositionSnapshotSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid body composition data.");
  }

  const data = parsed.data;
  const weightKg = Number(data.weightKg ?? existing.weightKg);
  const heightCm = Number(data.heightCm ?? (formData.has("heightCm") ? 0 : existing.heightCm ?? 0));
  const age = Number(data.age ?? 0);
  const gender = (data.gender ?? "other") as "male" | "female" | "other";

  const finalBmi = data.bmi ?? (heightCm > 0 ? calculateBmi(weightKg, heightCm) : null);
  const finalBmr = data.bmr ?? (heightCm > 0 && age > 0 ? calculateBmr({ weightKg, heightCm, age, gender }) : null);

  const optionalValue = (value: number | undefined, key: string, existingValue: number | null) => {
    if (value !== undefined) return value;
    return formData.has(key) ? null : existingValue;
  };

  await measurePerformance("body.updateSnapshot", { requestId }, () => prisma.bodyCompositionSnapshot.update({
    where: { id },
    data: {
      date: new Date(data.date),
      weightKg,
      heightCm: formData.has("heightCm") ? data.heightCm ?? null : existing.heightCm,
      bmi: finalBmi,
      smm: optionalValue(data.smm, "smm", existing.smm),
      bfm: optionalValue(data.bfm, "bfm", existing.bfm),
      pbf: optionalValue(data.pbf, "pbf", existing.pbf),
      waistHipRatio: optionalValue(data.waistHipRatio, "waistHipRatio", existing.waistHipRatio),
      visceralFatLevel: optionalValue(data.visceralFatLevel, "visceralFatLevel", existing.visceralFatLevel),
      fatFreeMass: optionalValue(data.fatFreeMass, "fatFreeMass", existing.fatFreeMass),
      bmr: finalBmr,
      obesityDegree: optionalValue(data.obesityDegree, "obesityDegree", existing.obesityDegree),
      smi: optionalValue(data.smi, "smi", existing.smi),
      notes: data.notes ?? existing.notes ?? "",
      measurementSource: data.measurementSource ?? existing.measurementSource ?? "manual",
      leanSegments: {
        deleteMany: {},
        create: Object.entries(data.segmentLean ?? {}).filter(([, value]) => value !== undefined).map(([key, value]) => ({
          segment: key,
          value: Number(value),
        })),
      },
      fatSegments: {
        deleteMany: {},
        create: Object.entries(data.segmentFat ?? {}).filter(([, value]) => value !== undefined).map(([key, value]) => ({
          segment: key,
          value: Number(value),
        })),
      },
    },
  }));

  revalidatePath("/body");
  revalidatePath("/dashboard");
  revalidatePath("/body/compare");
  revalidatePath("/body/trends");
  redirect(`/body/${id}`);
}
