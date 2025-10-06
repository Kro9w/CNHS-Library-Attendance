import type { Student } from "./student";

export interface AttendanceLog {
  id?: number;
  studentLrn: string;
  timestamp: string;
  timeIn: Date;
  grade: string;
  sex: "Male" | "Female";
}

export interface AttendanceWithStudent extends AttendanceLog {
  student?: Student;
}