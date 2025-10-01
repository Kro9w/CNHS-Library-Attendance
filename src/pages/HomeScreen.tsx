import React, { useState, useEffect } from "react";
import {
  getStudentByLRN,
  logAttendance,
  getTodaysStats,
  incrementDailyStats,
} from "../services/studentService";
import "bootstrap/dist/css/bootstrap.min.css";

// Font
import "@fontsource/nunito-sans/700.css";
import "@fontsource/poppins/400.css";

interface GradeCounter {
  [grade: string]: number;
}

const HomeScreen: React.FC = () => {
  const [currentTime] = useState(new Date());
  const [scannedLRN, setScannedLRN] = useState("");
  const [greeting, setGreeting] = useState("Welcome!");
  const [warning, setWarning] = useState("");
  const [gradeCounters, setGradeCounters] = useState<GradeCounter>({
    "7": 0,
    "8": 0,
    "9": 0,
    "10": 0,
  });

  // Initialize counters based on today's attendance from persisted counters
  useEffect(() => {
    const fetchStats = async () => {
      const stats = await getTodaysStats();
      setGradeCounters({
        "7": stats.grade7,
        "8": stats.grade8,
        "9": stats.grade9,
        "10": stats.grade10,
      });
    };
    fetchStats();
  }, []);

  const handleScan = async () => {
    if (!scannedLRN) return;
    const student = await getStudentByLRN(scannedLRN);
    if (!student) {
      setWarning(`Student with LRN ${scannedLRN} not found!`);
      setTimeout(() => setWarning(""), 3000);
      return;
    }

    setGreeting(`Hello, ${student.firstName}!`);
    await logAttendance(student);

    const stats = await incrementDailyStats(student.grade);
    setGradeCounters({
      "7": stats.grade7,
      "8": stats.grade8,
      "9": stats.grade9,
      "10": stats.grade10,
    });

    setScannedLRN("");
  };
  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="d-flex vh-100 vw-100">
      {/* Left side: Greeting */}
      <div className="w-50 d-flex flex-column justify-content-center align-items-center bg-light">
        <h1 className="mb-3" style={{ fontFamily: "Nunito Sans, sans-serif" }}>
          {getTimeBasedGreeting()}!
        </h1>
        <h3 style={{ fontFamily: "Poppins, sans-serif" }}>{greeting}</h3>

        {warning && (
          <div className="alert alert-warning w-75 text-center" role="alert">
            {warning}
          </div>
        )}

        <div className="mt-4" style={{ width: "75%" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Scan or enter LRN"
            value={scannedLRN}
            onChange={(e) => setScannedLRN(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
          />
          <button className="btn btn-primary mt-2 w-100" onClick={handleScan}>
            Time In
          </button>
        </div>
        <p className="mt-3">{currentTime.toLocaleString()}</p>
      </div>

      {/* Right side: Grade counters */}
      <div className="w-50 d-flex flex-column justify-content-center align-items-center">
        <div className="container w-100" style={{ padding: "50px" }}>
          <div className="row g-4">
            {["7", "8", "9", "10"].map((grade, idx) => {
              const colors = ["#ff4d4d", "#ff944d", "#ffea4d", "#4dff88"];
              return (
                <div key={grade} className="col-6 d-flex">
                  <div
                    className="card shadow flex-fill d-flex flex-column justify-content-center align-items-center"
                    style={{
                      width: "95%",
                      height: "150px",
                      backgroundColor: colors[idx],
                      color: "white",
                      borderRadius: "15px",
                    }}
                  >
                    <span style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
                      {gradeCounters[grade] || 0}
                    </span>
                    <span style={{ fontSize: "1.2rem", marginTop: "8px" }}>
                      Grade {grade}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
