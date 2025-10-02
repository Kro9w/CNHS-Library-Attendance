# CNHS-JHS Library Attendance System

An efficient, offline-first desktop application designed to streamline student attendance tracking for the Cagayan National High School - Junior High School Library.

Built with React, TypeScript, and Tauri, this application provides a fast, reliable, and easy-to-use interface for managing library attendance, ensuring that data is always available, even without an internet connection.

---

## Table of Contents

- [Features](#features)
- [Installation Guide (For Users)](#installation-guide-for-users)
- [User Manual](#user-manual)
  - [1. First-Time Setup: Importing Students](#1-first-time-setup-importing-students)
  - [2. Daily Usage: Tracking Attendance](#2-daily-usage-tracking-attendance)
  - [3. Admin Functions](#3-admin-functions)
  - [4. Viewing Statistics](#4-viewing-statistics)
  - [4.5. Exporting Statistics](#4.5-exporting-statistics)
- [For Developers](#for-developers)
  - [Technology Stack](#technology-stack)
  - [Prerequisites](#prerequisites)
  - [Setup and Running in Development](#setup-and-running-in-development)
  - [Building the Application](#building-the-application)
- [Project Structure](#project-structure)

## Features

- **Real-time Attendance Tracking:** Instantly log student entry by their LRN (Learner Reference Number).
- **Offline-First Capability:** Powered by IndexedDB, the app works perfectly without an internet connection. All data is stored securely on the local machine.
- **Comprehensive Admin Dashboard:** A dedicated panel to manage student data, view attendance logs, and perform administrative tasks.
- **Direct Excel Import:** Easily set up the system by directly importing a student list from an `.xlsx` file.
- **Detailed Statistics:** Visualize library traffic with daily, weekly, and monthly attendance counts broken down by grade level.
- **Automated Grade Level Updates:** A dedicated feature to advance all students to the next grade level at the end of the school year.
- **Cross-Platform:** Built with Tauri to run as a native desktop application on Windows, macOS, and Linux.

## Installation Guide (For Users)

To install the application on your computer, follow these simple steps:

1.  Navigate to the [**Releases Page**](https://github.com/kro9w/cnhs-library-attendance/releases) of this GitHub repository.
2.  Under the latest release, find the "Assets" section.
3.  Download the appropriate installer for your operating system:
    _Coming Soon..._
    - For **Windows**: Download the `.msi` file (e.g., `library-attendance_0.0.0_x64_en-US.msi`).
    - For **macOS**: Download the `.dmg` file.
4.  Once downloaded, double-click the installer and follow the on-screen instructions to complete the setup.

## User Manual

### 1. First-Time Setup: Importing Students

Before you can track attendance, you must load the student list into the application. This is done by importing a standard Excel (`.xlsx`) file.

#### **Step 1: Prepare Your Student Excel File**

Create an Excel sheet with the following columns. The **column headers must exactly match** the names below:

- `LRN`
- `First Name`
- `Last Name`
- `M.I.`
- `Sex`
- `Grade`
- `Attendance`

**Formatting Rules and Conventions:**

- **LRN:** Must be a 12-digit number.
- **Name Fields:** Should be in sentence case (e.g., "John", not "JOHN").
- **M.I.:** Include a dot after the middle initial (e.g., "A."). If a student has no middle initial, leave the cell blank.
- **Attendance:** Set this column to `0` for all students during the first import.

**Example Spreadsheet:**
| LRN | First Name | Last Name | M.I. | Sex | Grade | Attendance |
|--------------|------------|-----------|------|-----|-------|------------|
| 123456789012 | John | Doe | A. | M | 7 | 0 |
| 210987654321 | Jane | Smith | | F | 8 | 0 |
| 345678901234 | Peter | Cruz | B. | M | 7 | 0 |

#### **Step 2: Import the File into the App**

1.  Launch the application.
2.  Navigate to the **Admin** page using the navigation bar.
3.  Click the **"Import Students"** button.
4.  Select the `.xlsx` file you prepared.
5.  The application will process the file, automatically combine the name fields, and load all students into the local database. You will then see the complete student list on the admin page.

### 2. Daily Usage: Tracking Attendance

This is the main screen you will use for daily operations.

- **Go to the Home Screen:** The application opens to this screen by default.
- **Enter Student LRN:** Use the input field to type or scan a student's 12-digit LRN.
- **Log Attendance:** The system will automatically detect when a valid LRN has been entered and log the attendance.
- **Feedback:**
  - A **success message** with the student's name, grade, and section will appear.
  - If the LRN is not found, an **error message** will be displayed.
  - The input field will automatically clear after each entry, ready for the next student.

### 3. Admin Functions

The **Admin** page provides tools for managing the system's data.

- **View Student List:** A complete, searchable list of all students currently in the database is displayed.
- **View Attendance Log:** See a detailed, real-time log of all attendance records, including student names and the time they entered.
- **Update Grade Levels:**
  - **Purpose:** This is an end-of-school-year function to promote students.
  - **Action:** This is an automatic process, to promote current students to the next grade level. It fires up upon hitting 12:00 AM of June 01. However there is a callable function that forces this in the rare instance the automation fails.
  - **Warning:** This action is irreversible. Use with caution. Students in Grade 10 will be archived or handled according to the system's logic.

### 4. Viewing Statistics

The **Statistics** page gives you insights into library usage.

- Navigate to the **Statistics** page from the navigation bar.
- View key metrics:
  - **Today's Attendance:** A live count of students who have entered today.
  - **Weekly & Monthly Attendance:** Total attendance for the current week and month.
  - **Attendance by Grade Level:** See a breakdown of attendance for each grade level, helping you understand which groups use the library most.
  - **Gender Breakdown per Grade Level** See a breakdown of male and female students for each grade level.
  - **Top Monthly Library Visitors** See the top 3 patrons that frequently visit the library with their grade level and total number of visits for the month.
  - **Recent Visitors** See the last 5 logged visitors to check for accuracy.

### 4.5. Exporting Statistics

In the **Statistics** page, you can observe yellow dots situted on the top right corner of the graph cards. When hovered, a dialog box will popup offering two options:

- Option A: Export the data to a `.xlsx` file.
- Option B: Export the graph to a '.png' file

_Be sure that you are currently selecting the right view option to get the expert in the desired timeframe._

## For Developers

This section provides instructions for developers who want to contribute to the project or build it from the source code.

### Technology Stack

- **Frontend:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Desktop Framework:** [Tauri](https://tauri.app/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Client-Side Database:** [Dexie.js](https://dexie.org/) (a wrapper for IndexedDB)
- **Routing:** [React Router](https://reactrouter.com/)

### Prerequisites

You must have the following installed on your system:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Rust and Cargo](https://www.rust-lang.org/tools/install)
- System dependencies required by Tauri. Please follow the [official Tauri guide](https://tauri.app/v1/guides/getting-started/prerequisites) for your specific OS.

### Setup and Running in Development

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/kro9w/cnhs-library-attendance.git](https://github.com/kro9w/cnhs-library-attendance.git)
    cd cnhs-library-attendance
    ```
2.  **Install NPM dependencies:**
    ```bash
    npm install
    ```
3.  **Run the application in development mode:**
    This command will start the Vite dev server and the Tauri desktop window with hot-reloading.
    ```bash
    npm run tauri:dev
    ```

### Building the Application

To build the final, production-ready executable for your platform:

1.  **Run the build command:**
    ```bash
    npm run tauri:build
    ```
2.  **Find the executable:**
    The installer/executable will be located in the `src-tauri/target/release/bundle/` directory.

## Project Structure

```
├── dist/               # Production build output from Vite
├── public/             # Static assets
├── src/                # React frontend source code
│   ├── components/     # Reusable UI components
│   ├── pages/          # Main page components (HomeScreen, AdminPage, etc.)
│   ├── services/       # Core application logic (database, attendance)
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main application component with routing
│   └── main.tsx        # Application entry point
└── src-tauri/          # Tauri Rust backend source code
├── capabilities/   # Tauri capabilities configuration
├── icons/          # Application icons
├── target/         # Rust build output (contains the final executable)
├── Cargo.toml      # Rust project manifest
└── tauri.conf.json # Tauri configuration file
```

### Notes:

- Data Integrity: The application uses the computer's system time for all attendance records. To ensure data accuracy, please make sure your computer's date and time are always correct.

- Data Backup: All application data is stored locally on a single computer and is not backed up automatically. It is highly recommended to have a regular backup plan for the computer to prevent permanent data loss in case of hardware failure.

- Student Import: The "Import Students" function will completely replace the existing student list with the data from the new .xlsx file. It does not merge lists.

- Irreversible Actions: The "Update Grade Levels" function is a permanent action that cannot be undone. Please use this feature with caution and only at the end of a school year.

- Single Machine Use: This is a standalone application. The attendance data is not shared or synced between different computers.
