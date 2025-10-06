import React, { useEffect, useState, useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // Import calendar styles
import { getAllAttendanceWithStudentInfo } from "../services/attendanceService";
import type { AttendanceWithStudent } from "../types/attendance";
import "./AttendancePage.css"; // Import custom calendar styles
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

// --- EXCEL EXPORT FUNCTION (SINGLE DAY) ---
const exportTableToExcel = async (
  data: AttendanceWithStudent[],
  date: Date
) => {
  const workbook = new ExcelJS.Workbook();
  // Sanitize the date string for the worksheet name
  const safeDateString = date.toLocaleDateString().replace(/\//g, "-");
  const sheet = workbook.addWorksheet(`Attendance - ${safeDateString}`);

  sheet.columns = [
    { header: "Time", key: "time", width: 15 },
    { header: "Name", key: "name", width: 30 },
    { header: "LRN", key: "lrn", width: 20 },
    { header: "Grade", key: "grade", width: 15 },
  ];

  data.forEach((log) => {
    sheet.addRow({
      time: new Date(log.timestamp).toLocaleTimeString(),
      name: `${log.student?.firstName || ""} ${
        log.student?.middleInitial || ""
      } ${log.student?.lastName || ""}`.trim(),
      lrn: log.studentLrn,
      grade: log.student?.grade,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer]),
    `attendance-${date.toISOString().split("T")[0]}.xlsx`
  );
};

// --- EXCEL EXPORT FUNCTION (DATE RANGE) ---
const exportDateRangeToExcel = async (
  data: AttendanceWithStudent[],
  startDate: Date,
  endDate: Date
) => {
  const workbook = new ExcelJS.Workbook();
  // Sanitize the date strings for the worksheet name
  const safeStartDateString = startDate
    .toLocaleDateString()
    .replace(/\//g, "-");
  const safeEndDateString = endDate.toLocaleDateString().replace(/\//g, "-");
  const sheet = workbook.addWorksheet(
    `Attendance - ${safeStartDateString} to ${safeEndDateString}`
  );

  sheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Time", key: "time", width: 15 },
    { header: "Name", key: "name", width: 30 },
    { header: "LRN", key: "lrn", width: 20 },
    { header: "Grade", key: "grade", width: 15 },
  ];

  data.forEach((log) => {
    sheet.addRow({
      date: new Date(log.timestamp).toLocaleDateString(),
      time: new Date(log.timestamp).toLocaleTimeString(),
      name: `${log.student?.firstName || ""} ${
        log.student?.middleInitial || ""
      } ${log.student?.lastName || ""}`.trim(),
      lrn: log.studentLrn,
      grade: log.student?.grade,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];
  saveAs(
    new Blob([buffer]),
    `attendance-range-${startDateStr}-to-${endDateStr}.xlsx`
  );
};

const AttendancePage: React.FC = () => {
  const [allAttendance, setAllAttendance] = useState<AttendanceWithStudent[]>(
    []
  );
  const [selectedDate, setSelectedDate] = useState<Value>(new Date());
  const [dailyLogs, setDailyLogs] = useState<AttendanceWithStudent[]>([]);

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<
    "dateRange" | "alert" | null
  >(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllAttendanceWithStudentInfo();
      const sortedData = data.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setAllAttendance(sortedData);
    };

    fetchData();
  }, []);

  const datesWithData = useMemo(() => {
    const dates = new Set<string>();
    allAttendance.forEach((log) => {
      dates.add(new Date(log.timestamp).toDateString());
    });
    return dates;
  }, [allAttendance]);

  useEffect(() => {
    if (selectedDate && allAttendance.length > 0) {
      const date = selectedDate as Date;
      const filteredLogs = allAttendance.filter((log) => {
        const logDate = new Date(log.timestamp);
        return logDate.toDateString() === date.toDateString();
      });
      setDailyLogs(filteredLogs);
    } else {
      setDailyLogs([]);
    }
  }, [selectedDate, allAttendance]);

  const handleDateChange = (date: Value) => {
    setSelectedDate(date);
  };

  const showModal = (type: "dateRange" | "alert", message?: string) => {
    setModalContent(type);
    if (message) setAlertMessage(message);
    setIsModalOpen(true);
  };

  const handleExportSingleDay = () => {
    if (!dailyLogs.length) {
      showModal("alert", "No data to export for the selected date.");
      return;
    }
    exportTableToExcel(dailyLogs, selectedDate as Date);
  };

  const handleConfirmDateRangeExport = () => {
    if (!startDate || !endDate) {
      showModal("alert", "Please select both a start and end date.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      showModal("alert", "Invalid date format. Please select valid dates.");
      return;
    }

    if (start > end) {
      showModal("alert", "Start date cannot be after the end date.");
      return;
    }

    end.setHours(23, 59, 59, 999); // Include all of the end day

    const filteredData = allAttendance.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= start && logDate <= end;
    });

    if (!filteredData.length) {
      showModal("alert", "No attendance data found in the selected range.");
    } else {
      exportDateRangeToExcel(filteredData, start, end);
      setIsModalOpen(false); // Close modal on successful export initiation
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      if (datesWithData.has(date.toDateString())) {
        return "day-with-data";
      }
    }
    return null;
  };

  // Styles
  const cardStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "1rem",
    padding: "1.5rem",
    margin: "0.5rem",
    boxShadow: "var(--shadow)",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: "var(--green)",
    color: "white",
    border: "none",
    borderRadius: "0.5rem",
    padding: "1rem",
    fontWeight: "600",
    fontFamily: "Poppins, sans-serif",
    cursor: "pointer",
    width: "100%",
    marginBottom: "1rem",
    transition: "background-color 0.2s",
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid var(--border-color)",
    fontSize: "1rem",
    marginBottom: "1rem",
    textAlign: "left",
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        padding: "1.5rem",
        flexDirection: "row",
        backgroundColor: "rgba(58, 140, 75, 0.1)",
      }}
    >
      {/* Left Panel */}
      <div
        style={{
          width: "25%",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Calendar Card */}
        <div style={{ ...cardStyle }}>
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            calendarType="gregory"
            tileClassName={tileClassName}
          />
        </div>
        {/* Controls Card */}
        <div
          style={{
            ...cardStyle,
            flex: 1,
            justifyContent: "center",
          }}
        >
          <button style={buttonStyle} onClick={handleExportSingleDay}>
            Export Active Table to Excel
          </button>
          <button
            style={{ ...buttonStyle, backgroundColor: "var(--light-text)" }}
            onClick={() => showModal("dateRange")}
          >
            Export Selected Date Range
          </button>
        </div>
      </div>

      {/* Right Panel */}
      <div
        style={{
          ...cardStyle,
          width: "75%",
          height: "100%",
          overflow: "hidden",
          flex: 2.5,
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "1rem",
            color: "var(--dark-text)",
            fontFamily: "'Nunito Sans', sans-serif",
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {selectedDate
            ? (selectedDate as Date).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "Attendance"}
        </h2>
        {dailyLogs.length > 0 ? (
          <div style={{ overflowY: "auto", flex: 1 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
              }}
            >
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
                  <th style={{ width: "15%", padding: "1rem" }}>Time</th>
                  <th style={{ width: "45%", padding: "1rem" }}>Name</th>
                  <th style={{ width: "25%", padding: "1rem" }}>LRN</th>
                  <th style={{ width: "15%", padding: "1rem" }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {dailyLogs.map((log, index) => (
                  <tr
                    key={log.id || `${log.studentLrn}-${log.timestamp}`}
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? "white" : "var(--light-gray)",
                    }}
                  >
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {`${log.student?.firstName || ""} ${
                        log.student?.middleInitial || ""
                      } ${log.student?.lastName || ""}`.trim()}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      {log.studentLrn}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      {log.student?.grade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "var(--light-text)",
              fontSize: "1.2rem",
            }}
          >
            No attendance data for this day
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            {modalContent === "dateRange" && (
              <>
                <h3
                  style={{
                    marginTop: 0,
                    color: "var(--dark-text)",
                    textAlign: "left",
                  }}
                >
                  Select Date Range
                </h3>
                <label
                  style={{
                    display: "block",
                    textAlign: "left",
                    marginBottom: "0.5rem",
                  }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  style={inputStyle}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <label
                  style={{
                    display: "block",
                    textAlign: "left",
                    marginBottom: "0.5rem",
                  }}
                >
                  End Date
                </label>
                <input
                  type="date"
                  style={inputStyle}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <button
                  style={buttonStyle}
                  onClick={handleConfirmDateRangeExport}
                >
                  Confirm Export
                </button>
                <button
                  style={{
                    ...buttonStyle,
                    backgroundColor: "var(--light-text)",
                    marginBottom: 0,
                  }}
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </>
            )}
            {modalContent === "alert" && (
              <>
                <p>{alertMessage}</p>
                <button
                  style={{ ...buttonStyle, marginBottom: 0 }}
                  onClick={closeModal}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
