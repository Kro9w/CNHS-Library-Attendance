import Dexie, { type Table } from "dexie";
import type { Student } from "../types/student";
import type { AttendanceLog } from "../types/attendance";

export interface DailyStats {
  date: string;  // "2025-09-02"
  grade7: number;
  grade8: number;
  grade9: number;
  grade10: number;
}

export class LibraryDB extends Dexie {
  students!: Table<Student, string>;
  attendance!: Table<AttendanceLog, number>;
  dailyStats!: Table<DailyStats, string>;

  constructor() {
    super("LibraryAttendanceDB");
    this.version(1).stores({
      students: "lrn, name, grade",
      attendance: "++id, studentLrn, timeIn, timeOut",
      dailyStats: "date",
    });
  }
}

export const db = new LibraryDB();