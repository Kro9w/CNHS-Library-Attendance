export interface Student {
  lrn: string;
  firstName: string;
  middleInitial?: string;
  lastName: string;
  sex: "Male" | "Female";
  grade: "7" | "8" | "9" | "10";
  attendance?: number;
}