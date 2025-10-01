import React, { useState, useEffect, useRef } from "react";
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
import "@fontsource/nunito-sans/800.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/600.css";

const AdminPage: React.FC = () => {
  const [lrn, setLrn] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("Male");
  const [grade, setGrade] = useState("7");
  const [students, setStudents] = useState<Student[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  // Refs for file inputs to trigger them from styled buttons
  const importJsonRef = useRef<HTMLInputElement>(null);
  const importStudentExcelRef = useRef<HTMLInputElement>(null);
  const importStatsExcelRef = useRef<HTMLInputElement>(null);

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
      middleInitial: middleInitial || "N/A",
      lastName,
      sex: sex as "Male" | "Female",
      grade: grade as "7" | "8" | "9" | "10",
      attendance: 0,
    };
    try {
      await addStudent(student);
      alert(`Added ${firstName} ${lastName} successfully!`);
      // Reset form
      setLrn("");
      setFirstName("");
      setMiddleInitial("");
      setLastName("");
      setSex("Male");
      setGrade("7");
      fetchStudents();
    } catch (err) {
      console.error("Failed to add student:", err);
      alert("Error adding student. LRN might already exist.");
    }
  };

  // --- STUDENT DATA HANDLERS ---
  const handleExportJSON = async () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(students, null, 2)
    )}`;
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "students.json");
    dlAnchorElem.click();
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const importedStudents: Student[] = JSON.parse(text);
      for (const s of importedStudents) {
        if (s.lrn) await addStudent(s);
      }
      alert(`Imported ${importedStudents.length} students successfully!`);
      fetchStudents();
    } catch (err) {
      alert("Invalid JSON file.");
      console.error(err);
    }
  };

  const handleExportStudentExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");
    sheet.columns = [
      { header: "LRN", key: "lrn", width: 15 },
      { header: "First Name", key: "firstName", width: 25 },
      { header: "Last Name", key: "lastName", width: 25 },
      { header: "M.I.", key: "middleInitial", width: 10 },
      { header: "Sex", key: "sex", width: 10 },
      { header: "Grade", key: "grade", width: 10 },
      { header: "Attendance", key: "attendance", width: 15 },
    ];
    students.forEach((s) => sheet.addRow(s));
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "students.xlsx");
  };

  const handleImportStudentExcel = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.worksheets[0];
    let importedCount = 0;
    sheet.eachRow(async (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      const [
        ,
        lrn,
        firstName,
        lastName,
        middleInitial,
        sex,
        grade,
        attendance,
      ] = row.values as any[];
      if (lrn) {
        await addStudent({
          lrn: String(lrn),
          firstName: String(firstName || ""),
          lastName: String(lastName || ""),
          middleInitial: String(middleInitial || "N/A"),
          sex: String(sex) as "Male" | "Female",
          grade: String(grade) as "7" | "8" | "9" | "10",
          attendance: Number(attendance) || 0,
        });
        importedCount++;
      }
    });
    alert(`Imported ${importedCount} students!`);
    fetchStudents();
  };

  // --- DAILY STATS HANDLERS ---
  const handleExportStatsExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Daily Stats");
    sheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Grade 7", key: "grade7", width: 10 },
      { header: "Grade 8", key: "grade8", width: 10 },
      { header: "Grade 9", key: "grade9", width: 10 },
      { header: "Grade 10", key: "grade10", width: 10 },
    ];
    dailyStats.forEach((stat) => sheet.addRow(stat));
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "daily_stats.xlsx");
  };

  const handleImportStatsExcel = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.worksheets[0];
    const statsToImport: DailyStats[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      const [, date, grade7, grade8, grade9, grade10] = row.values as any[];
      if (date) {
        statsToImport.push({
          date: String(date),
          grade7: Number(grade7) || 0,
          grade8: Number(grade8) || 0,
          grade9: Number(grade9) || 0,
          grade10: Number(grade10) || 0,
        });
      }
    });
    for (const stat of statsToImport) {
      await db.dailyStats.put(stat);
    }
    const allStats = await db.dailyStats.toArray();
    setDailyStats(allStats);
    alert(`Imported ${statsToImport.length} daily stat records!`);
  };

  // --- STYLES ---
  const pageStyle: React.CSSProperties = {
    display: "flex",
    gap: "1.5rem",
    width: "100vw",
    minHeight: "100vh",
    padding: "1.5rem",
    backgroundColor: "rgba(58, 140, 75, 0.05)",
    fontFamily: "'Poppins', sans-serif",
  };
  const cardStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    borderRadius: "1rem",
    padding: "2rem",
    boxShadow: "var(--shadow)",
    display: "flex",
    flexDirection: "column",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    fontSize: "1rem",
    marginTop: "0.25rem",
  };
  const buttonStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "var(--green)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "1rem",
  };
  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "var(--light-gray)",
    color: "var(--dark-text)",
    border: "1px solid var(--border-color)",
  };
  const tableContainerStyle: React.CSSProperties = {
    flexGrow: 1,
    overflowY: "auto",
    marginTop: "1rem",
  };

  return (
    <div style={pageStyle}>
      {/* Left Column: Add Student */}
      <div style={{ width: "35%" }}>
        <div style={cardStyle}>
          <h3
            style={{
              textAlign: "center",
              fontFamily: "'Nunito Sans', sans-serif",
              fontWeight: 800,
            }}
          >
            Add New Student
          </h3>
          <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
            {/* Form Fields */}
            <div>
              <label>LRN</label>
              <input
                type="text"
                style={inputStyle}
                value={lrn}
                onChange={(e) => setLrn(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label>First Name</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div style={{ width: "80px" }}>
                <label>M.I.</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={middleInitial}
                  onChange={(e) => setMiddleInitial(e.target.value)}
                  maxLength={3}
                />
              </div>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <label>Last Name</label>
              <input
                type="text"
                style={inputStyle}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label>Sex</label>
                <select
                  style={inputStyle}
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label>Grade</label>
                <select
                  style={inputStyle}
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
            <button type="submit" style={buttonStyle}>
              Add Student
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Data Tables */}
      <div
        style={{
          width: "65%",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Current Students Table */}
        <div style={{ ...cardStyle, flex: 1 }}>
          <h4
            style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800 }}
          >
            Student Roster
          </h4>
          {/* Data Management */}
          <div
            style={{
              borderTop: "1px solid var(--border-color)",
              marginTop: "1rem",
              paddingTop: "1rem",
            }}
          >
            <h5 style={{ fontSize: "1rem", color: "var(--light-text)" }}>
              Data Management
            </h5>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: "1rem",
                marginTop: "0.5rem",
              }}
            >
              <button
                style={secondaryButtonStyle}
                onClick={() => importJsonRef.current?.click()}
              >
                Import JSON
              </button>
              <button
                style={secondaryButtonStyle}
                onClick={() => importStudentExcelRef.current?.click()}
              >
                Import Excel
              </button>
              <button style={buttonStyle} onClick={handleExportJSON}>
                Export JSON
              </button>
              <button style={buttonStyle} onClick={handleExportStudentExcel}>
                Export Excel
              </button>
            </div>
          </div>
          {/* Table */}
          <div style={tableContainerStyle}>
            <table className="table table-striped">
              <thead
                style={{
                  backgroundColor: "var(--green)",
                  color: "white",
                  position: "sticky",
                  top: 0,
                }}
              >
                <tr>
                  <th>LRN</th>
                  <th>Name</th>
                  <th>Sex</th>
                  <th>Grade</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.lrn}>
                    <td>{s.lrn}</td>
                    <td>{`${s.lastName}, ${s.firstName} ${s.middleInitial}`}</td>
                    <td>{s.sex}</td>
                    <td>{s.grade}</td>
                    <td>{s.attendance || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Stats Table */}
        <div style={{ ...cardStyle, flex: 1 }}>
          <h4
            style={{ fontFamily: "'Nunito Sans', sans-serif", fontWeight: 800 }}
          >
            Daily Attendance Stats
          </h4>
          <div
            style={{
              borderTop: "1px solid var(--border-color)",
              marginTop: "1rem",
              paddingTop: "1rem",
            }}
          >
            <h5 style={{ fontSize: "1rem", color: "var(--light-text)" }}>
              Data Management
            </h5>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginTop: "0.5rem",
              }}
            >
              <button
                style={secondaryButtonStyle}
                onClick={() => importStatsExcelRef.current?.click()}
              >
                Import from Excel
              </button>
              <button style={buttonStyle} onClick={handleExportStatsExcel}>
                Export to Excel
              </button>
            </div>
          </div>
          <div style={tableContainerStyle}>
            <table className="table table-striped">
              <thead
                style={{
                  backgroundColor: "var(--green)",
                  color: "white",
                  position: "sticky",
                  top: 0,
                }}
              >
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

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={importJsonRef}
          onChange={handleImportJSON}
          style={{ display: "none" }}
          accept=".json"
        />
        <input
          type="file"
          ref={importStudentExcelRef}
          onChange={handleImportStudentExcel}
          style={{ display: "none" }}
          accept=".xlsx"
        />
        <input
          type="file"
          ref={importStatsExcelRef}
          onChange={handleImportStatsExcel}
          style={{ display: "none" }}
          accept=".xlsx"
        />
      </div>
    </div>
  );
};

export default AdminPage;
