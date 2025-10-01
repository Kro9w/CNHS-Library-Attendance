import { openDB } from "idb";
import type { Student } from "../types/student";
import type { DailyGradeCounter } from "../types/dailyCounter";
import { db } from "./db";
import type { DailyStats } from "./db";


// Open or create IndexedDB
const DB_NAME = "LibraryDB";
const DB_VERSION = 1;
const STORE_NAME = "students";

export interface AttendanceLog {
  studentLrn: string;
  grade: "7" | "8" | "9" | "10";
  timestamp: string; // ISO string
}

// Add a new store for logs in getDB upgrade:
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "lrn" });
        store.createIndex("grade", "grade", { unique: false });
      }
      if (!db.objectStoreNames.contains("attendanceLogs")) {
        db.createObjectStore("attendanceLogs", { autoIncrement: true });
      }
    },
  });
}

// Log a student visit
export async function logAttendance(student: Student) {
  const db = await getDB();
  const tx = db.transaction(["attendanceLogs", "students"], "readwrite");
  
  const timestamp = new Date().toISOString();
  console.log(`Logging attendance for LRN: ${student.lrn}, Grade: ${student.grade}, Timestamp: ${timestamp}`);

  // Add log entry
  tx.objectStore("attendanceLogs").add({
    studentLrn: student.lrn,
    grade: student.grade,
    timestamp,
  });

  // Update student attendance field
  const studentStore = tx.objectStore("students");
  const existing = await studentStore.get(student.lrn);
  if (existing) {
    existing.attendance = (existing.attendance || 0) + 1;
    await studentStore.put(existing);
  }

  await tx.done;
}

// Get today's logs
export async function getTodaysLogs(): Promise<AttendanceLog[]> {
  const db = await getDB();
  const store = db.transaction("attendanceLogs").objectStore("attendanceLogs");
  const allLogs = await store.getAll();
  const today = new Date().toISOString().split("T")[0];
  return allLogs.filter(log => log.timestamp.startsWith(today));
}

// Optional: clear all logs (useful for testing)
export async function clearAllLogs(): Promise<void> {
  const db = await getDB();
  const store = db.transaction("attendanceLogs", "readwrite").objectStore("attendanceLogs");
  await store.clear();
}

// Add a new student
export async function addStudent(student: Student): Promise<boolean> {
  const db = await getDB();
  const existing = await db.get(STORE_NAME, student.lrn);
  if (existing) {
    // Return false to indicate student already exists
    return false;
  }

  await db.add(STORE_NAME, { ...student, attendance: 0 });
  return true;
}

// Get all students
export async function getAllStudents(): Promise<Student[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

// Get student by LRN
export async function getStudentByLRN(lrn: string): Promise<Student | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, lrn);
}

// Increment attendance
export async function incrementAttendance(lrn: string): Promise<void> {
  const db = await getDB();
  const student = await db.get(STORE_NAME, lrn);
  if (student) {
    student.attendance = (student.attendance || 0) + 1;
    console.log(`Incrementing attendance for LRN: ${lrn}, New attendance: ${student.attendance}`);
    await db.put(STORE_NAME, student);
  }
}

// Delete Student
export async function deleteStudent(lrn: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, lrn);
}

// Update student details
export async function updateStudent(student: Student): Promise<void> {
  const db = await getDB();
  const existing = await db.get(STORE_NAME, student.lrn);
  if (existing) {
    await db.put(STORE_NAME, { ...student, attendance: existing.attendance || 0 });
  }
}

// Get today's counters
export async function getTodaysCounters(): Promise<DailyGradeCounter> {
  const today = new Date().toISOString().split("T")[0];
  let counters = await db.table("dailyCounters").get(today);
  if (!counters) {
    counters = { date: today, grade7: 0, grade8: 0, grade9: 0, grade10: 0 };
    await db.table("dailyCounters").put(counters);
  }
  return counters;
}

// Increment a grade
export async function incrementGradeCounter(grade: "7"|"8"|"9"|"10") {
  const today = new Date().toISOString().split("T")[0];
  const table = db.table<DailyGradeCounter>("dailyCounters");
  let counters = await table.get(today);
  if (!counters) {
    counters = { date: today, grade7: 0, grade8: 0, grade9: 0, grade10: 0 };
  }
  counters[`grade${grade}` as keyof DailyGradeCounter]++;
  console.log(`Incremented grade${grade} counter to ${counters[`grade${grade}` as keyof DailyGradeCounter]}`);
  await table.put(counters);
}

// Get today's stats (or create if not exist)
export async function getTodaysStats(): Promise<DailyStats> {
  const today = new Date().toISOString().split("T")[0];
  let stats = await db.dailyStats.get(today);
  if (!stats) {
    stats = { date: today, grade7: 0, grade8: 0, grade9: 0, grade10: 0 };
    await db.dailyStats.put(stats);
  }
  return stats;
}

// Increment grade counter
export async function incrementDailyStats(grade: string) {
  let stats = await getTodaysStats();

  switch (grade) {
    case "7":
      stats.grade7++;
      break;
    case "8":
      stats.grade8++;
      break;
    case "9":
      stats.grade9++;
      break;
    case "10":
      stats.grade10++;
      break;
  }

  await db.dailyStats.put(stats);
  return stats;
}

// Log an increment for the grade on today’s date
export const logDailyStat = async (grade: "7" | "8" | "9" | "10") => {
  const today = new Date().toISOString().split("T")[0];
  const existing = await db.dailyStats.get(today);

  if (existing) {
    await db.dailyStats.update(today, {
      ...existing,
      [`grade${grade}`]: (existing[`grade${grade}`] || 0) + 1,
    });
  } else {
    await db.dailyStats.add({
      date: today,
      grade7: grade === "7" ? 1 : 0,
      grade8: grade === "8" ? 1 : 0,
      grade9: grade === "9" ? 1 : 0,
      grade10: grade === "10" ? 1 : 0,
    });
  }
};

export const getAllDailyStats = async (): Promise<DailyStats[]> => {
  return await db.dailyStats.toArray();
};

// Subscribe to changes in daily stats
export const subscribeToDailyStats = (callback: (stats: DailyStats[]) => void) => {
  const listener = async () => {
    const stats = await getAllDailyStats();
    callback(stats);
  };

  // Attach hooks properly
  db.dailyStats.hook("creating", listener as any);
  db.dailyStats.hook("updating", listener as any);

  // fetch once initially
  listener();

  return () => {
    db.dailyStats.hook("creating").unsubscribe(listener as any);
    db.dailyStats.hook("updating").unsubscribe(listener as any);
  };
};
