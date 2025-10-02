import { getAllStudents, updateStudent, deleteStudent } from './studentService';
import type { Student } from '../types/student';

const LAST_UPDATE_YEAR_KEY = 'lastGradeUpdateYear';

/**
 * The core logic for promoting students and graduating Grade 10.
 */
const performGradeUpdate = async () => {
  const currentYear = new Date().getFullYear();
  console.log(`Starting annual grade update for ${currentYear}.`);

  try {
    const allStudents = await getAllStudents();
    const studentsToUpdate: Student[] = [];
    const studentsToDelete: string[] = [];

    allStudents.forEach(student => {
      const currentGrade = parseInt(student.grade, 10);
      if (currentGrade === 10) {
        studentsToDelete.push(student.lrn);
      } else if (currentGrade >= 7 && currentGrade <= 9) {
        const newGrade = String(currentGrade + 1) as "8" | "9" | "10";
        studentsToUpdate.push({ ...student, grade: newGrade });
      }
    });

    // Use the functions from studentService for database operations
    if (studentsToDelete.length > 0) {
      for (const lrn of studentsToDelete) {
        await deleteStudent(lrn);
      }
      console.log(`Successfully graduated and removed ${studentsToDelete.length} Grade 10 students.`);
    }

    if (studentsToUpdate.length > 0) {
      for (const student of studentsToUpdate) {
        await updateStudent(student);
      }
      console.log(`Successfully promoted ${studentsToUpdate.length} students.`);
    }

    localStorage.setItem(LAST_UPDATE_YEAR_KEY, String(currentYear));
    alert(`Annual student promotion and graduation process for ${currentYear} has been completed successfully.`);

  } catch (error) {
    console.error("Failed to complete the annual grade update process:", error);
    alert("An error occurred during the annual student update. Please check the console for details.");
  }
};

const runGradeUpdateCheck = async () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  const lastUpdateYear = localStorage.getItem(LAST_UPDATE_YEAR_KEY);

  if (currentMonth === 5 && currentDate === 1 && lastUpdateYear !== String(currentYear)) {
    await performGradeUpdate();
  } else {
    console.log("Annual grade update check: Not June 1st or update already performed for this year.");
  }
};

// Manual Trigger Update
export const forceGradeUpdate = async () => {
  console.warn("Manual grade update process initiated.");
  await performGradeUpdate();
  console.warn("Manual grade update process finished.");
};

export const startGradeUpdateTimer = () => {
  console.log("Starting grade update service timer.");
  runGradeUpdateCheck(); // Check immediately on startup
  setInterval(runGradeUpdateCheck, 1000 * 60 * 60); // Check every hour
};

// Expose the force function to the window for easy console access
(window as any).forceGradeUpdate = forceGradeUpdate;