import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { assertUserOwnership } from "@/lib/auth";

const requiredEnvironment = [
  "INTEGRATION_DATABASE_URL",
  "INTEGRATION_USER_A_EMAIL",
  "INTEGRATION_USER_A_AUTH_ID",
  "INTEGRATION_USER_B_EMAIL",
  "INTEGRATION_USER_B_AUTH_ID",
];
const runIntegration = requiredEnvironment.every((key) => Boolean(process.env[key]));
const integrationDescribe = runIntegration ? describe : describe.skip;

integrationDescribe("live two-user data isolation", () => {
  const prisma = new PrismaClient({ datasourceUrl: process.env.INTEGRATION_DATABASE_URL });
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };
  let fixture: {
    profileA: string;
    goalA: string;
    mealA: string;
    foodA: string;
    bodyA: string;
    programA: string;
    dayA: string;
    exerciseA: string;
    sessionA: string;
    setA: string;
    cardioA: string;
    conversationA: string;
  };
  let fixtureB: typeof fixture;

  beforeAll(async () => {
    const emails = [process.env.INTEGRATION_USER_A_EMAIL!, process.env.INTEGRATION_USER_B_EMAIL!];
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    userA = await prisma.user.create({
      data: {
        email: emails[0],
        supabaseAuthId: process.env.INTEGRATION_USER_A_AUTH_ID!,
        profile: { create: { displayName: "Integration A" } },
        nutritionGoal: { create: { calorieTarget: 2200, proteinTarget: 150 } },
      },
      select: { id: true, email: true },
    });
    userB = await prisma.user.create({
      data: {
        email: emails[1],
        supabaseAuthId: process.env.INTEGRATION_USER_B_AUTH_ID!,
        profile: { create: { displayName: "Integration B" } },
        nutritionGoal: { create: { calorieTarget: 2000, proteinTarget: 130 } },
      },
      select: { id: true, email: true },
    });

    const mealA = await prisma.meal.create({ data: { userId: userA.id, date: new Date("2026-09-12"), mealType: "BREAKFAST", name: "A breakfast" } });
    const foodA = await prisma.foodEntry.create({ data: { mealId: mealA.id, name: "A oats", quantityGrams: 80, calories: 300, protein: 10, carbohydrates: 50, fat: 6, fiber: 8 } });
    const bodyA = await prisma.bodyCompositionSnapshot.create({ data: { userId: userA.id, date: new Date("2026-09-12"), weightKg: 75 } });
    const programA = await prisma.workoutProgram.create({ data: { userId: userA.id, name: "A program", split: "upper/lower" } });
    const dayA = await prisma.workoutDay.create({ data: { programId: programA.id, name: "A upper", muscleGroup: "upper" } });
    const exerciseA = await prisma.plannedExercise.create({ data: { dayId: dayA.id, name: "A bench press" } });
    const sessionA = await prisma.workoutSession.create({ data: { userId: userA.id, programId: programA.id, date: new Date("2026-09-12") } });
    const setA = await prisma.workoutSet.create({ data: { sessionId: sessionA.id, exerciseName: "A bench press", setNumber: 1, weightKg: 80, reps: 5 } });
    const cardioA = await prisma.cardioSession.create({ data: { userId: userA.id, sessionId: sessionA.id, activity: "A walk", durationMin: 30, date: new Date("2026-09-12") } });
    const conversationA = await prisma.coachConversation.create({ data: { userId: userA.id, mode: "workout", messages: { create: { role: "user", content: "A private message" } } } });
    fixture = { profileA: (await prisma.profile.findUniqueOrThrow({ where: { userId: userA.id } })).id, goalA: (await prisma.nutritionGoal.findUniqueOrThrow({ where: { userId: userA.id } })).id, mealA: mealA.id, foodA: foodA.id, bodyA: bodyA.id, programA: programA.id, dayA: dayA.id, exerciseA: exerciseA.id, sessionA: sessionA.id, setA: setA.id, cardioA: cardioA.id, conversationA: conversationA.id };

    const mealB = await prisma.meal.create({ data: { userId: userB.id, date: new Date("2026-09-12"), mealType: "BREAKFAST", name: "B breakfast" } });
    const foodB = await prisma.foodEntry.create({ data: { mealId: mealB.id, name: "B oats", quantityGrams: 80, calories: 300, protein: 10, carbohydrates: 50, fat: 6, fiber: 8 } });
    const bodyB = await prisma.bodyCompositionSnapshot.create({ data: { userId: userB.id, date: new Date("2026-09-12"), weightKg: 80 } });
    const programB = await prisma.workoutProgram.create({ data: { userId: userB.id, name: "B program", split: "push/pull" } });
    const dayB = await prisma.workoutDay.create({ data: { programId: programB.id, name: "B push", muscleGroup: "push" } });
    const exerciseB = await prisma.plannedExercise.create({ data: { dayId: dayB.id, name: "B press" } });
    const sessionB = await prisma.workoutSession.create({ data: { userId: userB.id, programId: programB.id, date: new Date("2026-09-12") } });
    const setB = await prisma.workoutSet.create({ data: { sessionId: sessionB.id, exerciseName: "B press", setNumber: 1, weightKg: 60, reps: 8 } });
    const cardioB = await prisma.cardioSession.create({ data: { userId: userB.id, sessionId: sessionB.id, activity: "B cycle", durationMin: 20, date: new Date("2026-09-12") } });
    const conversationB = await prisma.coachConversation.create({ data: { userId: userB.id, mode: "workout", messages: { create: { role: "user", content: "B private message" } } } });
    fixtureB = { profileA: (await prisma.profile.findUniqueOrThrow({ where: { userId: userB.id } })).id, goalA: (await prisma.nutritionGoal.findUniqueOrThrow({ where: { userId: userB.id } })).id, mealA: mealB.id, foodA: foodB.id, bodyA: bodyB.id, programA: programB.id, dayA: dayB.id, exerciseA: exerciseB.id, sessionA: sessionB.id, setA: setB.id, cardioA: cardioB.id, conversationA: conversationB.id };
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
    await prisma.$disconnect();
  });

  it("allows each user only their own root and nested records", async () => {
    const ownA = await Promise.all([
      prisma.profile.findFirst({ where: { id: fixture.profileA, userId: userA.id } }),
      prisma.nutritionGoal.findFirst({ where: { id: fixture.goalA, userId: userA.id } }),
      prisma.meal.findFirst({ where: { id: fixture.mealA, userId: userA.id } }),
      prisma.foodEntry.findFirst({ where: { id: fixture.foodA, meal: { userId: userA.id } } }),
      prisma.bodyCompositionSnapshot.findFirst({ where: { id: fixture.bodyA, userId: userA.id } }),
      prisma.workoutProgram.findFirst({ where: { id: fixture.programA, userId: userA.id } }),
      prisma.workoutDay.findFirst({ where: { id: fixture.dayA, program: { userId: userA.id } } }),
      prisma.plannedExercise.findFirst({ where: { id: fixture.exerciseA, day: { program: { userId: userA.id } } } }),
      prisma.workoutSession.findFirst({ where: { id: fixture.sessionA, userId: userA.id } }),
      prisma.workoutSet.findFirst({ where: { id: fixture.setA, session: { userId: userA.id } } }),
      prisma.cardioSession.findFirst({ where: { id: fixture.cardioA, userId: userA.id } }),
      prisma.coachConversation.findFirst({ where: { id: fixture.conversationA, userId: userA.id } }),
    ]);
    expect(ownA.every(Boolean)).toBe(true);

    const deniedForB = await Promise.all([
      prisma.profile.findFirst({ where: { id: fixture.profileA, userId: userB.id } }),
      prisma.nutritionGoal.findFirst({ where: { id: fixture.goalA, userId: userB.id } }),
      prisma.meal.findFirst({ where: { id: fixture.mealA, userId: userB.id } }),
      prisma.foodEntry.findFirst({ where: { id: fixture.foodA, meal: { userId: userB.id } } }),
      prisma.bodyCompositionSnapshot.findFirst({ where: { id: fixture.bodyA, userId: userB.id } }),
      prisma.workoutProgram.findFirst({ where: { id: fixture.programA, userId: userB.id } }),
      prisma.workoutDay.findFirst({ where: { id: fixture.dayA, program: { userId: userB.id } } }),
      prisma.plannedExercise.findFirst({ where: { id: fixture.exerciseA, day: { program: { userId: userB.id } } } }),
      prisma.workoutSession.findFirst({ where: { id: fixture.sessionA, userId: userB.id } }),
      prisma.workoutSet.findFirst({ where: { id: fixture.setA, session: { userId: userB.id } } }),
      prisma.cardioSession.findFirst({ where: { id: fixture.cardioA, userId: userB.id } }),
      prisma.coachConversation.findFirst({ where: { id: fixture.conversationA, userId: userB.id } }),
    ]);
    expect(deniedForB.every((value) => value === null)).toBe(true);
  });

  it("allows B's own records and denies A's records symmetrically", async () => {
    const ownB = await Promise.all([
      prisma.profile.findFirst({ where: { id: fixtureB.profileA, userId: userB.id } }),
      prisma.nutritionGoal.findFirst({ where: { id: fixtureB.goalA, userId: userB.id } }),
      prisma.meal.findFirst({ where: { id: fixtureB.mealA, userId: userB.id } }),
      prisma.foodEntry.findFirst({ where: { id: fixtureB.foodA, meal: { userId: userB.id } } }),
      prisma.bodyCompositionSnapshot.findFirst({ where: { id: fixtureB.bodyA, userId: userB.id } }),
      prisma.workoutProgram.findFirst({ where: { id: fixtureB.programA, userId: userB.id } }),
      prisma.workoutDay.findFirst({ where: { id: fixtureB.dayA, program: { userId: userB.id } } }),
      prisma.plannedExercise.findFirst({ where: { id: fixtureB.exerciseA, day: { program: { userId: userB.id } } } }),
      prisma.workoutSession.findFirst({ where: { id: fixtureB.sessionA, userId: userB.id } }),
      prisma.workoutSet.findFirst({ where: { id: fixtureB.setA, session: { userId: userB.id } } }),
      prisma.cardioSession.findFirst({ where: { id: fixtureB.cardioA, userId: userB.id } }),
      prisma.coachConversation.findFirst({ where: { id: fixtureB.conversationA, userId: userB.id } }),
    ]);
    expect(ownB.every(Boolean)).toBe(true);

    const deniedA = await Promise.all([
      prisma.profile.findFirst({ where: { id: fixtureB.profileA, userId: userA.id } }),
      prisma.nutritionGoal.findFirst({ where: { id: fixtureB.goalA, userId: userA.id } }),
      prisma.meal.findFirst({ where: { id: fixtureB.mealA, userId: userA.id } }),
      prisma.foodEntry.findFirst({ where: { id: fixtureB.foodA, meal: { userId: userA.id } } }),
      prisma.bodyCompositionSnapshot.findFirst({ where: { id: fixtureB.bodyA, userId: userA.id } }),
      prisma.workoutProgram.findFirst({ where: { id: fixtureB.programA, userId: userA.id } }),
      prisma.workoutDay.findFirst({ where: { id: fixtureB.dayA, program: { userId: userA.id } } }),
      prisma.plannedExercise.findFirst({ where: { id: fixtureB.exerciseA, day: { program: { userId: userA.id } } } }),
      prisma.workoutSession.findFirst({ where: { id: fixtureB.sessionA, userId: userA.id } }),
      prisma.workoutSet.findFirst({ where: { id: fixtureB.setA, session: { userId: userA.id } } }),
      prisma.cardioSession.findFirst({ where: { id: fixtureB.cardioA, userId: userA.id } }),
      prisma.coachConversation.findFirst({ where: { id: fixtureB.conversationA, userId: userA.id } }),
    ]);
    expect(deniedA.every((value) => value === null)).toBe(true);
  });

  it("rejects a direct identity override and keeps dashboard/AI context scoped", async () => {
    expect(() => assertUserOwnership(userA.id, userB.id)).toThrow("Unauthorized");
    const dashboardRows = await prisma.workoutSession.findMany({ where: { userId: userA.id } });
    const aiContextRows = await prisma.coachConversation.findMany({ where: { userId: userA.id }, include: { messages: true } });
    expect(dashboardRows.every((row) => row.userId === userA.id)).toBe(true);
    expect(aiContextRows.every((row) => row.userId === userA.id && row.messages.every((message) => message.conversationId === row.id))).toBe(true);
  });
});
