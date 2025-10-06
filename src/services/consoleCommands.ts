import { db } from './db';

/**
 * FOR TESTING/ADMIN: Deletes all student records from the database.
 */
export const deleteAllStudents = async () => {
  const confirmation = window.confirm(
    "Are you sure you want to delete ALL student records? This action is irreversible."
  );

  if (confirmation) {
    try {
      console.warn("Starting deletion of all student records...");
      await db.students.clear();
      console.log("All student records have been successfully deleted.");
      alert("All student records have been successfully deleted.");
      // Reload the page to reflect the changes in the UI
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete all students:", error);
      alert("An error occurred while deleting students. Check the console for details.");
    }
  } else {
    console.log("Deletion of all students was cancelled.");
  }
};

// Expose the function to the window
(window as any).appCommands = {
  deleteAllStudents,
};
