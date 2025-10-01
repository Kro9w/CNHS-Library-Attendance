import { db } from "./db";
import type { AttendanceLog } from "../types/attendance";
import type { Student } from "../types/student";

// Automatically log attendance by LRN
export const logAttendance = async (lrn: string) => {
  const student: Student | undefined = await db.students.get(lrn);

  if (!student) {
    console.warn(`Student with LRN ${lrn} not found`);
    return;
  }

  const attendance: AttendanceLog = {
    studentLrn: lrn,
    timeIn: new Date(),
    grade: student.grade,
    sex: student.sex,
  };

  await db.attendance.add(attendance);
  console.log(
    `Attendance logged for ${student.firstName} (Grade ${student.grade}) at ${attendance.timeIn}`
  );
};

export const getVisitsPerGrade = async () => {
  const attendance = await db.attendance.toArray();
  const students = await db.students.toArray();

  const visits: Record<string, number> = {
    "7": 0,
    "8": 0,
    "9": 0,
    "10": 0,
  };

  attendance.forEach((log) => {
    const student = students.find((s) => s.lrn === log.studentLrn);
    if (student) {
      visits[student.grade]++;
    }
  });

  return visits;
};

export async function getTodaysGenderBreakdown() {
  const today = new Date().toISOString().split("T")[0];

  const students = await db.students.toArray();
  const logs = await db.attendance.toArray();

  console.log("All attendance logs:", logs);

  const todaysLogs = logs.filter((log) => {
    const time = log.timeIn instanceof Date ? log.timeIn : new Date(log.timeIn);
    const timeStr = time.toISOString().slice(0, 10);
    return timeStr === today;
  });

  console.log("Filtered today's logs:", todaysLogs);

  const studentMap = new Map<string, Student>();
  students.forEach((student) => {
    studentMap.set(student.lrn, student);
  });

  console.log("Student mapping:", studentMap);

  const breakdown: Record<number, { Male: number; Female: number }> = {
    7: { Male: 0, Female: 0 },
    8: { Male: 0, Female: 0 },
    9: { Male: 0, Female: 0 },
    10: { Male: 0, Female: 0 },
  };

  todaysLogs.forEach((log) => {
    const student = studentMap.get(log.studentLrn);
    if (student) {
      const grade = student.grade;
      const sex = student.sex;
      if (breakdown[grade]) {
        if (sex === "Male") {
          breakdown[grade].Male++;
        } else if (sex === "Female") {
          breakdown[grade].Female++;
        }
      }
    }
  });

  console.log("Computed breakdown:", breakdown);

  return breakdown;
}