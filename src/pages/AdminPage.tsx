import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  type CSSProperties,
} from "react";
import {
  addStudent,
  getAllStudents,
  updateStudent,
  deleteStudent,
} from "../services/studentService";
import type { Student } from "../types/student";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import "@fontsource/nunito-sans/800.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/600.css";

const AdminPage: React.FC = () => {
  // State for the "Add Student" form
  const [lrn, setLrn] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("Male");
  const [grade, setGrade] = useState("7");

  // State for the main student list and filters
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");

  // State for UI interactions
  const [hoveredRowLrn, setHoveredRowLrn] = useState<string | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const importJsonRef = useRef<HTMLInputElement>(null);
  const importStudentExcelRef = useRef<HTMLInputElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  // Click away listener for the action menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        activeActionMenu &&
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setActiveActionMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeActionMenu]);

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
      const success = await addStudent(student);
      if (!success) {
        alert(`Error: A student with LRN ${lrn} already exists.`);
        return;
      }
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
      alert("Error adding student.");
    }
  };

  const handleDelete = async (lrn: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${name}? This action cannot be undone.`
      )
    ) {
      try {
        await deleteStudent(lrn);
        alert(`${name} has been deleted successfully.`);
        fetchStudents();
      } catch (err) {
        console.error("Failed to delete student:", err);
        alert("Error deleting student.");
      }
    }
    setActiveActionMenu(null);
  };

  const handleUpdateClick = (student: Student) => {
    setEditingStudent(student);
    setActiveActionMenu(null);
  };

  // --- Import/Export Handlers ---
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
      let count = 0;
      for (const s of importedStudents) {
        if (s.lrn && (await addStudent(s))) {
          count++;
        }
      }
      alert(`Imported ${count} new students successfully!`);
      fetchStudents();
    } catch (err) {
      alert("Invalid JSON file.");
      console.error(err);
    }
    e.target.value = ""; // Reset file input
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
      if (rowNumber === 1) return;
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
      if (
        lrn &&
        (await addStudent({
          lrn: String(lrn),
          firstName: String(firstName || ""),
          lastName: String(lastName || ""),
          middleInitial: String(middleInitial || "N/A"),
          sex: String(sex) as "Male" | "Female",
          grade: String(grade) as "7" | "8" | "9" | "10",
          attendance: Number(attendance) || 0,
        }))
      ) {
        importedCount++;
      }
    });
    alert(`Imported ${importedCount} new students!`);
    fetchStudents();
    e.target.value = ""; // Reset file input
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
    if (
      (selectedGrade && !searchTerm) ||
      (!selectedGrade && searchTerm) ||
      (selectedGrade && searchTerm)
    ) {
      return filtered;
    }
    return [];
  }, [students, searchTerm, selectedGrade]);

  // --- STYLES ---
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
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={fetchStudents}
        />
      )}
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
                fontSize: "0.9rem",
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
              <p style={{ margin: 0 }}>Version 0.0.2-beta</p>
              <p style={{ margin: 0 }}>Developed by CSU BLIS - BATCH SOLARI</p>
              <p style={{ margin: "8px 0 0 0" }}>
                © 2024. All Rights Reserved.
              </p>
            </div>
          </form>
        </div>
      </div>
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
              <option value="">Filter by Grade</option>
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
                  <th style={{ width: "60px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!searchTerm && !selectedGrade ? (
                  <tr>
                    <td
                      colSpan={6}
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
                    <tr
                      key={s.lrn}
                      onMouseEnter={() => setHoveredRowLrn(s.lrn)}
                      onMouseLeave={() => setHoveredRowLrn(null)}
                    >
                      <td>{s.lrn}</td>
                      <td>{`${s.lastName}, ${s.firstName} ${s.middleInitial}`}</td>
                      <td>{s.sex}</td>
                      <td>{s.grade}</td>
                      <td>{s.attendance || 0}</td>
                      <td style={{ textAlign: "center", position: "relative" }}>
                        <div
                          style={{
                            opacity:
                              hoveredRowLrn === s.lrn ||
                              activeActionMenu === s.lrn
                                ? 1
                                : 0,
                            transition: "opacity 0.2s ease",
                            cursor: "pointer",
                            fontWeight: "bold",
                            display: "inline-block",
                          }}
                          onClick={() =>
                            setActiveActionMenu(
                              activeActionMenu === s.lrn ? null : s.lrn
                            )
                          }
                        >
                          ...
                        </div>
                        {activeActionMenu === s.lrn && (
                          <div
                            ref={actionMenuRef}
                            style={{
                              position: "absolute",
                              top: "50%",
                              right: "calc(100% + 5px)",
                              transform: "translateY(-50%)",
                              backgroundColor: "white",
                              borderRadius: "8px",
                              boxShadow: "var(--shadow)",
                              zIndex: 20,
                              border: "1px solid var(--border-color)",
                              overflow: "hidden",
                            }}
                          >
                            <button
                              style={{
                                ...secondaryButtonStyle,
                                display: "block",
                                width: "100px",
                                textAlign: "left",
                                border: "none",
                                margin: 0,
                                borderRadius: 0,
                                backgroundColor: "var(--green)",
                                color: "white",
                              }}
                              onClick={() => handleUpdateClick(s)}
                            >
                              Update
                            </button>
                            <button
                              style={{
                                ...secondaryButtonStyle,
                                display: "block",
                                width: "100px",
                                textAlign: "left",
                                border: "none",
                                margin: 0,
                                borderRadius: 0,
                                backgroundColor: "#dc3545",
                                color: "white",
                              }}
                              onClick={() =>
                                handleDelete(
                                  s.lrn,
                                  `${s.firstName} ${s.lastName}`
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
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

// --- Edit Student Modal Component ---
const EditStudentModal: React.FC<{
  student: Student;
  onClose: () => void;
  onSave: () => void;
}> = ({ student, onClose, onSave }) => {
  const [formData, setFormData] = useState(student);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStudent(formData);
      alert("Student updated successfully!");
      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to update student:", err);
      alert("Error updating student.");
    }
  };

  const modalOverlayStyle: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };
  const modalContentStyle: CSSProperties = {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "1rem",
    boxShadow: "var(--shadow)",
    width: "400px",
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
    padding: "0.75rem 1rem",
    backgroundColor: "var(--green)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h3
          style={{
            textAlign: "center",
            fontFamily: "'Nunito Sans', sans-serif",
            fontWeight: 800,
          }}
        >
          Edit Student
        </h3>
        <form onSubmit={handleUpdate} style={{ marginTop: "1.5rem" }}>
          <div>
            <label>LRN (Cannot be changed)</label>
            <input
              type="text"
              style={{ ...inputStyle, backgroundColor: "#e9ecef" }}
              value={formData.lrn}
              readOnly
            />
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                style={inputStyle}
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div style={{ width: "80px" }}>
              <label>M.I.</label>
              <input
                type="text"
                name="middleInitial"
                style={inputStyle}
                value={formData.middleInitial}
                onChange={handleChange}
                maxLength={3}
              />
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              style={inputStyle}
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label>Sex</label>
              <select
                name="sex"
                style={inputStyle}
                value={formData.sex}
                onChange={handleChange}
              >
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Grade</label>
              <select
                name="grade"
                style={inputStyle}
                value={formData.grade}
                onChange={handleChange}
              >
                <option>7</option>
                <option>8</option>
                <option>9</option>
                <option>10</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <button
              type="button"
              style={{
                ...buttonStyle,
                backgroundColor: "var(--light-gray)",
                color: "var(--dark-text)",
              }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" style={buttonStyle}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPage;
