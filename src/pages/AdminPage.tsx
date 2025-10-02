import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  type CSSProperties,
} from "react";
import { addStudent, getAllStudents } from "../services/studentService";
import type { Student } from "../types/student";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>(""); // For the grade filter dropdown

  const importJsonRef = useRef<HTMLInputElement>(null);
  const importStudentExcelRef = useRef<HTMLInputElement>(null);

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

  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (selectedGrade) {
      filtered = filtered.filter((student) => student.grade === selectedGrade);
    }

    if (searchTerm) {
      const lowercasedValue = searchTerm.toLowerCase();
      filtered = filtered.filter((student) => {
        const fullName =
          `${student.firstName} ${student.lastName}`.toLowerCase();
        return (
          student.lrn.startsWith(searchTerm) ||
          fullName.includes(lowercasedValue)
        );
      });
    }

    // If a grade is selected, we don't need to check for search term to show results
    if (selectedGrade && !searchTerm) {
      return filtered;
    }

    // If no grade is selected, only show results if a search term is present
    if (!selectedGrade && searchTerm) {
      return filtered;
    }

    // If a grade is selected and there's a search term, return the combined filter
    if (selectedGrade && searchTerm) {
      return filtered;
    }

    // Default to an empty array if no filters are active
    return [];
  }, [students, searchTerm, selectedGrade]);

  const pageStyle: CSSProperties = {
    display: "flex",
    gap: "1.5rem",
    width: "100vw",
    height: "100vh",
    padding: "1.5rem",
    backgroundColor: "rgba(58, 140, 75, 0.05)",
    fontFamily: "'Poppins', sans-serif",
    boxSizing: "border-box",
  };
  const cardStyle: CSSProperties = {
    backgroundColor: "#ffffff",
    borderRadius: "1rem",
    padding: "2rem",
    boxShadow: "var(--shadow)",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  };
  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    fontSize: "1rem",
    marginTop: "0.25rem",
  };
  const buttonStyle: CSSProperties = {
    padding: "0.5rem 1rem",
    backgroundColor: "var(--green)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  };
  const secondaryButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundColor: "var(--light-gray)",
    color: "var(--dark-text)",
    border: "1px solid var(--border-color)",
  };

  return (
    <div style={pageStyle}>
      {/* Left Column: Add Student */}
      <div style={{ width: "35%", height: "100%" }}>
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
          <form
            onSubmit={handleSubmit}
            style={{
              marginTop: "1.5rem",
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
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
            <button
              type="submit"
              style={{ ...buttonStyle, width: "100%", marginTop: "2rem" }}
            >
              Add Student
            </button>
            <div
              style={{
                marginTop: "auto",
                paddingTop: "2rem",
                textAlign: "center",
                color: "var(--light-text)",
                fontSize: "0.7rem",
              }}
            >
              <h4
                style={{
                  fontFamily: "'Nunito Sans', sans-serif",
                  fontWeight: 800,
                  color: "var(--green)",
                  marginBottom: "0.3rem",
                }}
              >
                SOLARI
              </h4>
              <p style={{ margin: 0 }}>Version 1.0.0-beta</p>
              <p style={{ margin: 0 }}>Developed by CSU BLIS - BATCH SOLARI</p>
              <p style={{ margin: "8px 0 0 0" }}>
                © 2024. All Rights Reserved.
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column: Student Roster */}
      <div
        style={{
          width: "65%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ ...cardStyle, flex: 1, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h4
              style={{
                fontFamily: "'Nunito Sans', sans-serif",
                fontWeight: 800,
                margin: 0,
              }}
            >
              Student Roster
            </h4>
            <div style={{ display: "flex", gap: "0.5rem" }}>
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
          <div
            style={{
              marginTop: "1rem",
              borderTop: "1px solid var(--border-color)",
              paddingTop: "1rem",
              display: "flex",
              gap: "1rem",
            }}
          >
            <input
              type="text"
              placeholder="Search by LRN or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, width: "100%", marginTop: 0 }}
            />
            <select
              style={{ ...inputStyle, width: "200px", marginTop: 0 }}
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="">All Grades</option>
              <option value="7">Grade 7</option>
              <option value="8">Grade 8</option>
              <option value="9">Grade 9</option>
              <option value="10">Grade 10</option>
            </select>
          </div>
          <div style={{ flex: "1 1 0", overflowY: "auto", marginTop: "1rem" }}>
            <table className="table table-striped">
              <thead
                style={{
                  backgroundColor: "var(--green)",
                  color: "white",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
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
                {!searchTerm && !selectedGrade ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: "2rem",
                        color: "var(--light-text)",
                      }}
                    >
                      Search or select a grade level to view students.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.lrn}>
                      <td>{s.lrn}</td>
                      <td>{`${s.lastName}, ${s.firstName} ${s.middleInitial}`}</td>
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
      </div>
    </div>
  );
};

export default AdminPage;
