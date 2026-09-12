import { prisma } from "@/lib/db";

export async function getUserSnapshots(userId: string) {
  return prisma.bodyCompositionSnapshot.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    include: {
      leanSegments: true,
      fatSegments: true,
    },
  });
}

export async function getCurrentSnapshot(userId: string) {
  return prisma.bodyCompositionSnapshot.findFirst({
    where: { userId },
    orderBy: { date: "desc" },
    include: {
      leanSegments: true,
      fatSegments: true,
    },
  });
}

export async function getSnapshotById(userId: string, snapshotId: string) {
  return prisma.bodyCompositionSnapshot.findFirst({
    where: {
      id: snapshotId,
      userId,
    },
    include: {
      leanSegments: true,
      fatSegments: true,
    },
  });
}

export function buildSegmentMap(items: { segment: string; value: number }[]) {
  const map = {
    leftArm: 0,
    rightArm: 0,
    leftLeg: 0,
    rightLeg: 0,
    trunk: 0,
  } as Record<string, number>;

  for (const item of items) {
    map[item.segment] = Number(item.value ?? 0);
  }

  return map;
}

export function compareSnapshots(snapshotA: { weightKg: number; bmi?: number | null; pbf?: number | null; bmr?: number | null }, snapshotB: { weightKg: number; bmi?: number | null; pbf?: number | null; bmr?: number | null }) {
  return {
    weightDelta: Number((snapshotB.weightKg - snapshotA.weightKg).toFixed(2)),
    bmiDelta: snapshotA.bmi != null && snapshotB.bmi != null ? Number((snapshotB.bmi - snapshotA.bmi).toFixed(2)) : null,
    pbfDelta: snapshotA.pbf != null && snapshotB.pbf != null ? Number((snapshotB.pbf - snapshotA.pbf).toFixed(2)) : null,
    bmrDelta: snapshotA.bmr != null && snapshotB.bmr != null ? Number((snapshotB.bmr - snapshotA.bmr).toFixed(2)) : null,
  };
}
