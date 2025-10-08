# CNHS-JHS Library Attendance System

An efficient, offline-first desktop application designed to streamline student attendance tracking for the Cagayan National High School - Junior High School Library.

Built with React, TypeScript, and Tauri, providing a fast, reliable, and easy-to-use interface for managing library attendance, ensuring that data is always available, even without an internet connection.

---

## Table of Contents

- [Features](#features)
- [Installation Guide](#installation-guide)
- [User Manual](#user-manual)
  - [1. First-Time Setup: Importing Students](#1-first-time-setup-importing-students)
  - [2. Daily Usage: Tracking Attendance](#2-daily-usage-tracking-attendance)
  - [2.5 Attendance Page](#25-attendance-page)
  - [3. Admin Functions](#3-admin-functions)
  - [4. Viewing Statistics](#4-viewing-statistics)
  - [4.5. Exporting Statistics](#45-exporting-statistics)
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

## Installation Guide

Currently, the only way to install this application is by building it from the source code. This requires a few technical steps:

1.  **Download the Repository:**
    You can either clone the repository using Git or download it as a ZIP file from the [main GitHub page](https://github.com/kro9w/cnhs-library-attendance).

    ```bash
    git clone [https://github.com/kro9w/cnhs-library-attendance.git](https://github.com/kro9w/cnhs-library-attendance.git)
    cd cnhs-library-attendance
    ```

2.  **Install Dependencies:**
    This project relies on several technologies that you'll need to install first:

    - **Node.js:** Required to manage the project's JavaScript dependencies. You can download it from the [official Node.js website](https://nodejs.org/).
    - **Rust and Cargo:** The backend of the application is built with Rust. You can install it by following the instructions on the [official Rust website](https://www.rust-lang.org/tools/install).
    - **Tauri Prerequisites:** Tauri has some additional system dependencies. Please follow the [official Tauri guide](https://tauri.app/v1/guides/getting-started/prerequisites) for your operating system to ensure everything is set up correctly.

3.  **Install Project Dependencies:**
    Once you have the main dependencies installed, open a terminal in the project's root directory and run:

    ```bash
    npm install
    ```

4.  **Build the Application:**
    After the installation is complete, you can build the application by running:

    ```bash
    npm run tauri:build
    ```

5.  **Run the Installer:**
    The installer for your operating system will be located in the `src-tauri/target/release/bundle/` directory. Find the appropriate file (e.g., `.msi` for Windows) and run it to install the application.

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
- **M.I.:** If a student has no middle initial, leave the cell blank.
- **Attendance:** Set this column to `0` for all students during the first import.

**Example Spreadsheet:**
| LRN | First Name | Last Name | M.I. | Sex | Grade | Attendance |
|--------------|------------|-----------|------|-----|-------|------------|
| 123456789012 | John | Doe | A | M | 7 | 0 |
| 210987654321 | Jane | Smith | | F | 8 | 0 |
| 345678901234 | Peter | Cruz | B | M | 7 | 0 |

#### **Step 2: Import the File into the App**

1.  Launch the application.
2.  Navigate to the **Admin** page using the navigation bar.
3.  Click the **"Import Excel"** button.
4.  Select the `.xlsx` file you prepared.
5.  The application will process the file, and you will see the complete student list on the admin page.

### 2. Daily Usage: Tracking Attendance

This is the main screen you will use for daily operations.

- **Go to the Home Screen:** The application opens to this screen by default.
- **Enter Student LRN:** Use the input field to type or scan a student's 12-digit LRN.
- **Log Attendance:** The system will automatically detect when a valid LRN has been entered and log the attendance.
- **Feedback:**
  - A **success message** with the student's name and grade will appear.
  - If the LRN is not found, an **error message** will be displayed.
  - The input field will automatically clear after each entry, ready for the next student.

### 2.5 Attendance Page

This page allows you to view and export detailed attendance records.

- **Chronological Log:** The main table displays a list of all student attendance, sorted by time.
- **Calendar Navigation:** On the left, you'll find a calendar to easily navigate through different dates.
  - Dates with a **faded green background** have attendance data.
  - Dates with a **white background** have no attendance data.
- **Exporting Data:** You have two options for exporting attendance records to an Excel file:
  - **Export Active Table to Excel:** This will export the attendance data for the single day you are currently viewing.
  - **Export Selected Date Range:** This will open a dialog window where you can select a start and end date to export all attendance data within that range.

### 3. Admin Functions

The **Admin** page provides tools for managing the system's data.

- **View Student List:** A complete, searchable list of all students currently in the database is displayed.
- **Add, Update, and Delete Students:** You can manually manage student records directly from this page.
- **Update Grade Levels:**
  - **Purpose:** This is an end-of-school-year function to promote students.
  - **Action:** This is an automatic process that promotes students to the next grade level. It is scheduled to run at 12:00 AM on June 1st. A manual trigger is also available in case the automation fails.
  - **Warning:** This action is irreversible. Use with caution. Students in Grade 10 will be handled according to the system's logic (e.g., archived or removed).

### 4. Viewing Statistics

The **Statistics** page gives you insights into library usage.

- Navigate to the **Statistics** page from the navigation bar.
- View key metrics:
  - **Today's Attendance:** A live count of students who have entered today.
  - **Weekly & Monthly Attendance:** Total attendance for the current week and month.
  - **Attendance by Grade Level:** A breakdown of attendance for each grade level.
  - **Gender Breakdown per Grade Level:** A breakdown of male and female students for each grade level.
  - **Top Monthly Library Visitors:** The top 3 patrons who visit the library most frequently.
  - **Recent Visitors:** The last 5 logged visitors.

### 4.5. Exporting Statistics

On the **Statistics** page, you can hover over the yellow dots in the top-right corner of the graph cards to open an export dialog with two options:

- Export the data to an `.xlsx` file.
- Export the graph as a `.png` file.

_Be sure to select the correct view option (daily, weekly, etc.) to get the desired timeframe for your export._

## For Developers

This section provides instructions for developers who want to contribute to the project or build it from the source code.

### Technology Stack

- **Frontend:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Desktop Framework:** [Tauri](https://tauri.app/)
- **Styling:** CSS
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

├── dist/ # Production build output from Vite
├── public/ # Static assets
├── src/ # React frontend source code
│ ├── components/ # Reusable UI components
│ ├── pages/ # Main page components (HomeScreen, AdminPage, etc.)
│ ├── services/ # Core application logic (database, attendance)
│ ├── types/ # TypeScript type definitions
│ ├── App.tsx # Main application component with routing
│ └── main.tsx # Application entry point
└── src-tauri/ # Tauri Rust backend source code
├── capabilities/ # Tauri capabilities configuration
├── icons/ # Application icons
├── target/ # Rust build output (contains the final executable)
├── Cargo.toml # Rust project manifest
└── tauri.conf.json # Tauri configuration file

### Notes:

- **Data Integrity:** The application uses the computer's system time for all attendance records. To ensure data accuracy, please make sure your computer's date and time are always correct.

- **Data Backup:** All application data is stored locally on a single computer and is not backed up automatically. It is highly recommended to have a regular backup plan for the computer to prevent permanent data loss in case of hardware failure.

- **Student Import:** The "Import Excel" function will add new students to the existing list. It does not replace or merge records.

- **Excel Formatting for Import:** This is a crucial step to import data of students accurately. The `.xlsx` file MUST be cleaned prior to importing, it should strictly be in _Calibri_ font with a font size of 11. There should **NEVER** be any blank rows and the file must also be free from styling such as borders or backgrounds.

- **Irreversible Actions:** The "Update Grade Levels" function is a permanent action that cannot be undone. Please use this feature with caution and only at the end of a school year.

- **Single Machine Use:** This is a standalone application. The attendance data is not shared or synced between different computers.

- **Manual Date and Time Setting Provision:** In the instance of leveraging on the offline-first feature of the app, to ensure accurate data across records, if the PC is currently not connected to the internet, manual setting of date and time may be needed.
