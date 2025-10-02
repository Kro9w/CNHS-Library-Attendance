import { db } from "./db";
import type { AttendanceLog } from "../types/attendance";
import type { Student } from "../types/student";
import { getAllStudents, getTodaysLogs, getAllLogs } from "./studentService";

// This helper function is now imported from studentService,
// but it's good practice to have it available if needed.
const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


// Automatically log attendance by LRN
// Note: This function's primary logic is now in studentService.ts, 
// this is kept for compatibility if called elsewhere.
export const logAttendance = async (lrn: string) => {
  const student: Student | undefined = await db.students.get(lrn);

  if (!student) {
    console.warn(`Student with LRN ${lrn} not found`);
    return;
  }
  
  const now = new Date();

  // The attendance object's timeIn should be a Date object to be compatible with original logic.
  // The filtering in `getTodaysLogs` will handle the date string comparison.
  const attendance: AttendanceLog = {
    studentLrn: lrn,
    timestamp: now.toISOString(),
    timeIn: now, 
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
  const allStudents = await getAllStudents();
  // This function from studentService.ts now correctly gets logs for the local "today"
  const todaysLogs = await getTodaysLogs(); 

  const studentMap = new Map<string, Student>();
  allStudents.forEach((student) => {
    studentMap.set(student.lrn, student);
  });

  const breakdown: Record<number, { Male: number; Female: number }> = {
    7: { Male: 0, Female: 0 },
    8: { Male: 0, Female: 0 },
    9: { Male: 0, Female: 0 },
    10: { Male: 0, Female: 0 },
  };

  todaysLogs.forEach((log) => {
    const student = studentMap.get(log.studentLrn);
    if (student) {
      const grade = parseInt(student.grade, 10); // Ensure grade is a number for the key
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

  console.log("Computed gender breakdown:", breakdown);

  return breakdown;
}

export async function getTopMonthlyVisitors() {
  const allStudents = await getAllStudents();
  const allLogs = await getAllLogs();

  const studentMap = new Map<string, Student>();
  allStudents.forEach((student) => {
    studentMap.set(student.lrn, student);
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filter logs for the current month
  const monthlyLogs = allLogs.filter((log) => {
    // Reverted to using the original `log.timestamp` which is a string
    const logDate = new Date(log.timestamp);
    return (
      logDate.getMonth() === currentMonth &&
      logDate.getFullYear() === currentYear
    );
  });

  // Count visits for each student
  const visitorCounts = new Map<string, number>();
  monthlyLogs.forEach((log) => {
    const count = visitorCounts.get(log.studentLrn) || 0;
    visitorCounts.set(log.studentLrn, count + 1);
  });

  // Sort and get top 3 visitors
  const topVisitors = Array.from(visitorCounts.entries())
    .map(([lrn, count]) => {
      const student = studentMap.get(lrn);
      return {
        name: student ? `${student.firstName} ${student.lastName}` : "Unknown",
        grade: student ? student.grade : "N/A",
        visits: count,
      };
    })
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 3);

  return topVisitors;
}

// Get today's snapshot
export async function getTodaysSnapshot() {
  const todaysLogs = await getTodaysLogs();
  const totalVisitors = todaysLogs.length;

  const uniqueStudentLrns = new Set(todaysLogs.map(log => log.studentLrn));
  const uniqueStudents = uniqueStudentLrns.size;

  return {
    totalVisitors,
    uniqueStudents,
  };
}

// Get recent visitors (last 5)
export async function getRecentVisitors() {
  const allStudents = await getAllStudents();
  const todaysLogs = await getTodaysLogs();

  const studentMap = new Map<string, Student>();
  allStudents.forEach((student) => {
    studentMap.set(student.lrn, student);
  });

  // Sort logs by timestamp in descending order and take the last 5
  // Reverted to using `log.timestamp` which is a string
  const recentLogs = todaysLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const recentVisitors = recentLogs.map((log) => {
    const student = studentMap.get(log.studentLrn);
    const time = new Date(log.timestamp).toLocaleTimeString("en-US", {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return {
      name: student ? `${student.firstName} ${student.lastName}` : "Unknown",
      grade: student ? student.grade : "N/A",
      time,
    };
  });

  return recentVisitors;
}

