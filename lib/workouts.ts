export type WorkoutSetInput = {
  setNumber: number;
  weightKg: number;
  reps: number;
};

export type WorkoutHistoryEntry = {
  exerciseName: string;
  weightKg: number;
  reps: number;
  date?: string;
};

export function calculateWorkoutVolume(sets: WorkoutSetInput[]) {
  return sets.reduce((total, set) => {
    return total + set.weightKg * set.reps;
  }, 0);
}

export type WorkoutRecord = {
  exerciseName: string;
  weightKg: number;
  reps: number;
};

export function detectPersonalRecord(exerciseName: string, records: WorkoutRecord[]) {
  const matches = records.filter((record) => record.exerciseName === exerciseName);

  if (matches.length === 0) {
    return null;
  }

  return matches.reduce((best, record) => {
    if (!best || record.weightKg > best.weightKg) {
      return record;
    }

    return best;
  }, null as WorkoutRecord | null);
}

export function calculateWeeklyFrequency(sessions: number) {
  return sessions;
}

export function getExerciseKey(name: string) {
  return name.trim().toLowerCase();
}

export function findExerciseProgression(exerciseName: string, history: WorkoutHistoryEntry[]) {
  const entries = history.filter((entry) => getExerciseKey(entry.exerciseName) === getExerciseKey(exerciseName));

  if (entries.length === 0) {
    return null;
  }

  const first = entries[0];
  const latest = entries[entries.length - 1];

  return {
    exerciseName,
    firstWeightKg: first.weightKg,
    latestWeightKg: latest.weightKg,
    weightDeltaKg: Number((latest.weightKg - first.weightKg).toFixed(2)),
    firstReps: first.reps,
    latestReps: latest.reps,
    repDelta: latest.reps - first.reps,
  };
}

export function summarizePersonalRecords(records: WorkoutRecord[]) {
  return records.reduce<Record<string, WorkoutRecord>>((accumulator, record) => {
    const existing = accumulator[record.exerciseName];

    if (!existing || record.weightKg > existing.weightKg) {
      accumulator[record.exerciseName] = record;
    }

    return accumulator;
  }, {});
}
