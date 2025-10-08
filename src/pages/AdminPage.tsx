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

// Helper function to format student name
const getStudentName = (student: Student): string => {
  const { firstName, middleInitial, lastName } = student;
  const middle =
    middleInitial && middleInitial !== "N/A" ? `${middleInitial}` : "";
  return `${lastName}, ${firstName} ${middle}`.trim();
};

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<
    "alert" | "confirmDelete" | null
  >(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<{
    lrn: string;
    name: string;
  } | null>(null);

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

  // Modal Functions
  const showModal = (type: "alert" | "confirmDelete", message: string) => {
    setModalContent(type);
    setAlertMessage(message);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Reset states after modal closes for clean next use
    setTimeout(() => {
      setAlertMessage("");
      setStudentToDelete(null);
      setModalContent(null);
    }, 300); // Delay to allow for closing animation
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lrn || !firstName || !lastName) {
      showModal("alert", "Please fill out LRN, First Name, and Last Name.");
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
        showModal("alert", `Error: A student with LRN ${lrn} already exists.`);
        return;
      }
      showModal("alert", `Added ${firstName} ${lastName} successfully!`);
      setLrn("");
      setFirstName("");
      setMiddleInitial("");
      setLastName("");
      setSex("Male");
      setGrade("7");
      fetchStudents();
    } catch (err) {
      console.error("Failed to add student:", err);
      showModal("alert", "Error adding student.");
    }
  };

  const handleDelete = (lrn: string, name: string) => {
    setStudentToDelete({ lrn, name });
    showModal(
      "confirmDelete",
      `Are you sure you want to delete ${name}? This action cannot be undone.`
    );
    setActiveActionMenu(null);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await deleteStudent(studentToDelete.lrn);
      showModal(
        "alert",
        `${studentToDelete.name} has been deleted successfully.`
      );
      fetchStudents();
    } catch (err) {
      console.error("Failed to delete student:", err);
      showModal("alert", "Error deleting student.");
    } finally {
      closeModal();
    }
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
      showModal("alert", `Imported ${count} new students successfully!`);
      fetchStudents();
    } catch (err) {
      showModal("alert", "Invalid JSON file.");
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

    // Use a standard for-loop to handle async operations correctly
    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
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
        const success = await addStudent({
          lrn: String(lrn).trim(),
          firstName: String(firstName || "").trim(),
          lastName: String(lastName || "").trim(),
          middleInitial: String(middleInitial || "N/A").trim(),
          sex: String(sex).trim() as "Male" | "Female",
          grade: String(grade).trim() as "7" | "8" | "9" | "10",
          attendance: Number(attendance) || 0,
        });
        if (success) {
          importedCount++;
        }
      }
    }

    showModal("alert", `Imported ${importedCount} new students!`);
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
  const modalOverlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };
  const modalStyle: React.CSSProperties = {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "1rem",
    width: "90%",
    maxWidth: "500px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
    textAlign: "center",
  };

  return (
    <div style={pageStyle}>
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={(message) => {
            fetchStudents();
            showModal("alert", message);
          }}
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
                  <th style={{ textAlign: "center" }}>Grade</th>
                  <th style={{ textAlign: "center" }}>Attendance</th>
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
                      {`Currently managing ${students.length} students. Search or select a grade level to view records.`}
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
                      <td>{getStudentName(s)}</td>
                      <td>{s.sex}</td>
                      <td style={{ textAlign: "center" }}>{s.grade}</td>
                      <td style={{ textAlign: "center" }}>
                        {s.attendance || 0}
                      </td>
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

      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <p>{alertMessage}</p>
            {modalContent === "alert" && (
              <button
                style={{
                  ...buttonStyle,
                  marginBottom: 0,
                  width: "auto",
                  padding: "0.75rem 2rem",
                }}
                onClick={closeModal}
              >
                Close
              </button>
            )}
            {modalContent === "confirmDelete" && (
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginTop: "2rem",
                  justifyContent: "center",
                }}
              >
                <button
                  style={{
                    ...buttonStyle,
                    backgroundColor: "var(--light-gray)",
                    color: "var(--dark-text)",
                    flex: 1,
                    maxWidth: "150px",
                  }}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  style={{
                    ...buttonStyle,
                    backgroundColor: "#dc3545",
                    flex: 1,
                    maxWidth: "150px",
                  }}
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Edit Student Modal Component ---
const EditStudentModal: React.FC<{
  student: Student;
  onClose: () => void;
  onSave: (message: string) => void;
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
      onSave("Student updated successfully!");
      onClose();
    } catch (err) {
      console.error("Failed to update student:", err);
      onSave("Error updating student.");
      onClose();
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
    width: "100%",
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
