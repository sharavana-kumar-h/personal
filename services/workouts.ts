import { prisma } from "@/lib/db";

export async function getWorkoutData(userId: string) {
  const [programs, sessions, standaloneCardio] = await Promise.all([
    prisma.workoutProgram.findMany({
      where: { userId },
      include: { days: { include: { exercises: { orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "asc" } } },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.workoutSession.findMany({
      where: { userId },
      include: { sets: { orderBy: { setNumber: "asc" } }, cardioSessions: true, program: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 50,
    }),
    prisma.cardioSession.findMany({ where: { userId, sessionId: null }, orderBy: { date: "desc" }, take: 50 }),
  ]);

  const allSets = sessions.flatMap((session) => session.sets);
  const records = new Map<string, { exerciseName: string; weightKg: number; reps: number; date: Date }>();
  for (const set of allSets) {
    const key = set.exerciseName.trim().toLowerCase();
    const current = records.get(key);
    if (!current || set.weightKg > current.weightKg || (set.weightKg === current.weightKg && set.reps > current.reps)) {
      const session = sessions.find((item) => item.id === set.sessionId);
      records.set(key, { exerciseName: set.exerciseName, weightKg: set.weightKg, reps: set.reps, date: session?.date ?? new Date(0) });
    }
  }

  return {
    programs,
    sessions,
    standaloneCardio,
    personalRecords: [...records.values()].sort((a, b) => b.weightKg - a.weightKg),
    totals: {
      sessions: sessions.length,
      sets: allSets.length,
      volumeKg: allSets.reduce((total, set) => total + set.weightKg * set.reps, 0),
      cardioMinutes: [...sessions.flatMap((session) => session.cardioSessions), ...standaloneCardio].reduce((total, item) => total + item.durationMin, 0),
    },
  };
}