export interface AttendanceLog {
    id?: number; // auto-increment
    studentLrn: string;
    timestamp: string; // ISO string
    timeIn: Date;
    // timeOut?: Date;
    grade: "7" | "8" | "9" | "10";
    sex: "Male" | "Female";
}