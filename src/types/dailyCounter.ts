import { db } from "../services/db";

export interface DailyGradeCounter {
  date: string;
  grade7: number;
  grade8: number;
  grade9: number;
  grade10: number;
}

export async function resetDailyCounters() {
  const today = new Date().toISOString().split("T")[0];
  const table = db.table<DailyGradeCounter>("dailyCounters");

  const counters: DailyGradeCounter = {
    date: today,
    grade7: 0,
    grade8: 0,
    grade9: 0,
    grade10: 0,
  };

  await table.put(counters);
  return counters;
}