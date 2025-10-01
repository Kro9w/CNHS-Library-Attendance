import React, { useState, useEffect } from "react";
import type { DailyStats } from "../services/db";
import {
  addStudent,
  getAllStudents,
  subscribeToDailyStats,
} from "../services/studentService";
import type { Student } from "../types/student";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { db } from "../services/db";

const AdminPage: React.FC = () => {
  const [lrn, setLrn] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("Male");
  const [grade, setGrade] = useState("7");
  const [students, setStudents] = useState<Student[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  useEffect(() => {
    const unsubscribe = subscribeToDailyStats((stats: DailyStats[]) => {
      setDailyStats(stats);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const allStudents = await getAllStudents();
    setStudents(allStudents);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lrn || !firstName || !lastName) {
      alert("Please fill out LRN, First Name, and Last Name.");
      return;
    }

    const student: Student = {
      lrn,
      firstName,
      middleInitial: middleInitial || "None",
      lastName,
      sex: sex as "Male" | "Female",
      grade: grade as "7" | "8" | "9" | "10",
      attendance: 0,
    };

    try {
      await addStudent(student);
      alert(`Added ${firstName} ${lastName} successfully!`);

      // reset form
      setLrn("");
      setFirstName("");
      setMiddleInitial("");
      setLastName("");
      setSex("Male");
      setGrade("7");

      // refresh list
      fetchStudents();
    } catch (err) {
      console.error("Failed to add student:", err);
      alert("Error adding student.");
    }
  };

  const handleExportJSON = async () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(students, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "students.json");
    dlAnchorElem.click();
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const importedStudents: Student[] = JSON.parse(text);
      for (const s of importedStudents) {
        if (s.lrn) await addStudent(s);
      }
      alert(`Imported ${importedStudents.length} students successfully!`);
      fetchStudents();
    } catch (err) {
      alert("Invalid JSON file");
      console.error(err);
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");

    sheet.columns = [
      { header: "LRN", key: "lrn", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Middle Initial", key: "middleInitial", width: 10 },
      { header: "Sex", key: "sex", width: 10 },
      { header: "Grade", key: "grade", width: 10 },
      { header: "Attendance", key: "attendance", width: 10 },
    ];

    students.forEach((s) => {
      sheet.addRow({
        lrn: s.lrn,
        name: s.firstName,
        middleInitial: s.middleInitial || "None",
        sex: s.sex,
        grade: s.grade,
        attendance: s.attendance || 0,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, "students.xlsx");
  };

  const exportDailyStatsToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Daily Stats");

    sheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Grade 7", key: "grade7", width: 10 },
      { header: "Grade 8", key: "grade8", width: 10 },
      { header: "Grade 9", key: "grade9", width: 10 },
      { header: "Grade 10", key: "grade10", width: 10 },
    ];

    dailyStats.forEach((stat) => {
      sheet.addRow({
        date: stat.date,
        grade7: stat.grade7,
        grade8: stat.grade8,
        grade9: stat.grade9,
        grade10: stat.grade10,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, "daily_stats.xlsx");
  };

  // Import Daily Stats from Excel
  const handleImportDailyStatsExcel = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.worksheets[0];

    let importedCount = 0;
    // Assume headers: Date, Grade 7, Grade 8, Grade 9, Grade 10
    const rowsToInsert: DailyStats[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const rowValues = row.values as Array<any> | undefined;
      if (!rowValues) return;
      // row.values[0] is usually empty, so slice from index 1
      const [dateCell, grade7Cell, grade8Cell, grade9Cell, grade10Cell] =
        rowValues.slice(1);
      if (!dateCell) return;
      const stat: DailyStats = {
        date: String(dateCell),
        grade7: Number(grade7Cell) || 0,
        grade8: Number(grade8Cell) || 0,
        grade9: Number(grade9Cell) || 0,
        grade10: Number(grade10Cell) || 0,
      };
      rowsToInsert.push(stat);
      importedCount++;
    });
    // Insert all rows
    for (const stat of rowsToInsert) {
      await db.dailyStats.put(stat);
    }
    // Refresh state by re-fetching from DB
    const allStats = await db.dailyStats.toArray();
    setDailyStats(allStats);
    alert(`Imported ${importedCount} daily stats successfully!`);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.worksheets[0];

    let importedCount = 0;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header row

      const rowValues = row.values as Array<any> | undefined;
      if (!rowValues) return;

      // row.values[0] is usually empty, so slice from index 1
      const [
        lrnCell,
        nameCell,
        middleCell,
        sexCell,
        gradeCell,
        attendanceCell,
      ] = rowValues.slice(1);

      if (!lrnCell) return; // skip if no LRN

      const student: Student = {
        lrn: String(lrnCell),
        firstName: String(nameCell || ""),
        middleInitial: String(middleCell || "None"),
        lastName: String(nameCell || ""),
        sex: String(sexCell) as "Male" | "Female",
        grade: String(gradeCell) as "7" | "8" | "9" | "10",
        attendance: Number(attendanceCell) || 0,
      };

      addStudent(student);
      importedCount++;
    });

    alert(`Imported ${importedCount} students successfully!`);
    fetchStudents();
  };

  return (
    <div
      className="d-flex"
      style={{ width: "100vw", height: "100vh", padding: "15px" }}
    >
      <div
        className="w-50"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          className="card shadow p-4 mb-4"
          style={{ width: "70%", height: "auto" }}
        >
          <h3 className="text-center mb-4">Add New Student</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">LRN</label>
              <input
                type="text"
                className="form-control"
                value={lrn}
                onChange={(e) => setLrn(e.target.value)}
              />
            </div>

            <div
              className="mb-3"
              style={{ width: "100%", display: "flex", gap: "10px" }}
            >
              <div style={{ flex: 1 }}>
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ width: "80px" }}>
                <label className="form-label">M.I.</label>
                <input
                  type="text"
                  className="form-control"
                  value={middleInitial}
                  onChange={(e) => setMiddleInitial(e.target.value)}
                  maxLength={3}
                />
              </div>
            </div>

            <div className="mb-3"></div>

            <div className="mb-3">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-control"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div
              className="mb-3"
              style={{ display: "flex", gap: "10px", width: "100%" }}
            >
              <div style={{ flex: 1 }}>
                <label className="form-label">Sex</label>
                <select
                  className="form-select"
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Grade</label>
                <select
                  className="form-select"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                >
                  <option>7</option>
                  <option>8</option>
                  <option>9</option>
                  <option>10</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Add Student
            </button>
          </form>
        </div>
      </div>

      <div className="w-50 d-flex flex-column" style={{ height: "100%" }}>
        <div
          className="card shadow p-3 mb-4"
          style={{
            maxWidth: "100%",
            width: "100%",
            height: "50%",
            position: "relative",
          }}
        >
          <h4 className="text-center mb-3">Daily Grade Stats</h4>
          <button
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#dailyStatsCollapse"
            aria-expanded="false"
            aria-controls="dailyStatsCollapse"
            style={{
              position: "absolute",
              top: "1rem",
              left: "1rem",
              border: "none",
              background: "none",
              padding: 0,
              margin: 0,
              fontSize: "1.5rem",
              color: "black",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ☰
          </button>
          <div
            className="collapse mb-3"
            id="dailyStatsCollapse"
            style={{ height: "100%" }}
          >
            <div className="d-flex gap-2 mt-3">
              <button
                type="button"
                onClick={exportDailyStatsToExcel}
                className="btn btn-success w-100"
              >
                Export Daily Stats to Excel
              </button>
            </div>
            <div className="mt-3">
              <label htmlFor="importDailyStatsExcel" className="form-label">
                Import Daily Stats from Excel
              </label>
              <input
                type="file"
                id="importDailyStatsExcel"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="form-control"
                onChange={handleImportDailyStatsExcel}
              />
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table table-striped table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>Date</th>
                  <th>Grade 7</th>
                  <th>Grade 8</th>
                  <th>Grade 9</th>
                  <th>Grade 10</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.map((stat) => (
                  <tr key={stat.date}>
                    <td>{stat.date}</td>
                    <td>{stat.grade7}</td>
                    <td>{stat.grade8}</td>
                    <td>{stat.grade9}</td>
                    <td>{stat.grade10}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className="card shadow p-3"
          style={{
            maxWidth: "100%",
            width: "100%",
            height: "50%",
            flexGrow: 1,
            overflowY: "auto",
            position: "relative",
          }}
        >
          <h4 className="text-center mb-3">Current Students</h4>
          <button
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#importCollapse"
            aria-expanded="false"
            aria-controls="importCollapse"
            style={{
              position: "absolute",
              top: "1rem",
              left: "1rem",
              border: "none",
              background: "none",
              padding: 0,
              margin: 0,
              fontSize: "1.5rem",
              color: "black",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ☰
          </button>

          <div
            className="collapse mb-3"
            id="importCollapse"
            style={{ height: "100%" }}
          >
            <div className="mt-3">
              <label htmlFor="importJSON" className="form-label">
                Import JSON
              </label>
              <input
                type="file"
                id="importJSON"
                accept=".json,application/json"
                className="form-control"
                onChange={handleImportJSON}
              />
            </div>
            <div className="mt-3">
              <label htmlFor="importExcel" className="form-label">
                Import Excel
              </label>
              <input
                type="file"
                id="importExcel"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="form-control"
                onChange={handleImportExcel}
              />
            </div>
            <div className="d-flex gap-2 mt-3">
              <button
                type="button"
                onClick={handleExportJSON}
                className="btn btn-secondary w-50"
              >
                Export to JSON
              </button>
              <button
                type="button"
                onClick={exportToExcel}
                className="btn btn-success w-50"
              >
                Export to Excel
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="table table-striped table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>LRN</th>
                  <th>First Name</th>
                  <th>MI</th>
                  <th>Last Name</th>
                  <th>Sex</th>
                  <th>Grade</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center">
                      No students yet
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr key={s.lrn}>
                      <td>{s.lrn}</td>
                      <td>{s.firstName}</td>
                      <td>{s.middleInitial || "None"}</td>
                      <td>{s.lastName}</td>
                      <td>{s.sex}</td>
                      <td>{s.grade}</td>
                      <td>{s.attendance || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
