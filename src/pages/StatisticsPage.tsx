import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  getAllDailyStats,
  getAllStudents,
  getAllLogs,
} from "../services/studentService";
import {
  getTopMonthlyVisitors,
  getTodaysSnapshot,
  getRecentVisitors,
} from "../services/attendanceService";
import type { DailyGradeCounter } from "../types/dailyCounter";
import type { AttendanceLog } from "../types/attendance";
import type { Student } from "../types/student";

// Define the type for the chart data
type ChartData = {
  date: string;
  total: number;
};

// Component for the hoverable export functionality with fixed hover and new animation
const ExportDataConcept: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  // The invisible hoverable area. It's larger than the dot,
  // preventing the popup from disappearing when the cursor moves.
  const hoverZoneStyle: React.CSSProperties = {
    position: "absolute",
    top: "0.5rem",
    right: "0.5rem",
    zIndex: 10,
    // Add padding to create a buffer zone for the cursor
    padding: "15px",
    // Use negative margin to ensure the zone doesn't affect layout
    margin: "-15px",
  };

  const dotStyle: React.CSSProperties = {
    position: "absolute",
    top: "15px",
    right: "15px",
    width: "12px",
    height: "12px",
    backgroundColor: "var(--yellow)",
    borderRadius: "50%",
    cursor: "pointer",
  };

  const dialogStyle: React.CSSProperties = {
    position: "absolute",
    top: "30px", // Positioned diagonally below the dot
    right: "30px",
    backgroundColor: "white",
    padding: "0.5rem",
    borderRadius: "8px",
    boxShadow: "var(--shadow)",
    border: "1px solid var(--border-color)",
    whiteSpace: "nowrap", // Prevents button text from wrapping
    // Pop animation properties
    transformOrigin: "top right", // Animation starts from the corner
    transform: isHovered ? "scale(1)" : "scale(0.9)", // Start slightly scaled up for the pop
    opacity: isHovered ? 1 : 0,
    pointerEvents: isHovered ? "auto" : "none",
    // The cubic-bezier creates the "bounce" effect
    transition:
      "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease-out",
  };

  const exportButtonStyle: React.CSSProperties = {
    background: "var(--green)",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "5px",
    fontSize: "0.8rem",
    cursor: "pointer",
  };

  return (
    <div
      style={hoverZoneStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={dotStyle} />
      <div style={dialogStyle}>
        <button style={exportButtonStyle}>Export to Excel</button>
      </div>
    </div>
  );
};

const StatisticsPage: React.FC = () => {
  const [stats, setStats] = useState<DailyGradeCounter[]>([]);
  const [allLogs, setAllLogs] = useState<AttendanceLog[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [lineChartTimeRange, setLineChartTimeRange] = useState<
    "Last 7 Days" | "This Month" | "This Year"
  >("This Month");
  const [genderTimeRange, setGenderTimeRange] = useState<
    "Today" | "This Week" | "This Month"
  >("Today");

  const [topVisitors, setTopVisitors] = useState<
    { name: string; grade: number | string; visits: number }[]
  >([]);
  const [snapshot, setSnapshot] = useState<{
    totalVisitors: number;
    uniqueStudents: number;
  }>({ totalVisitors: 0, uniqueStudents: 0 });
  const [recentVisitors, setRecentVisitors] = useState<
    { name: string; grade: string | number; time: string }[]
  >([]);

  useEffect(() => {
    const fetchAllData = async () => {
      const dailyStatsData = await getAllDailyStats();
      const logsData = await getAllLogs();
      const studentsData = await getAllStudents();
      const topVisitorsData = await getTopMonthlyVisitors();
      const snapshotData = await getTodaysSnapshot();
      const recentVisitorsData = await getRecentVisitors();

      setStats(dailyStatsData);
      setAllLogs(logsData);
      setAllStudents(studentsData);
      setTopVisitors(topVisitorsData);
      setSnapshot(snapshotData);
      setRecentVisitors(recentVisitorsData);
    };
    fetchAllData();
  }, []);

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--light-gray)",
    borderRadius: "1rem",
    padding: "1rem",
    margin: "0.5rem",
    boxShadow: "var(--shadow)",
    position: "relative", // Needed for positioning the dot
  };
  const genderColors = {
    Male: "var(--green)",
    Female: "var(--yellow)",
  };

  // Memoized calculation for line chart data
  const processedLineChartData = useMemo(() => {
    const now = new Date();
    if (lineChartTimeRange === "Last 7 Days") {
      const sevenDaysAgo = new Date(new Date().setDate(now.getDate() - 7));
      return stats
        .filter((stat) => new Date(stat.date) >= sevenDaysAgo)
        .map((stat) => ({
          date: new Date(stat.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          total: stat.grade7 + stat.grade8 + stat.grade9 + stat.grade10,
        }));
    }
    if (lineChartTimeRange === "This Month") {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      return stats
        .filter((stat) => {
          const statDate = new Date(stat.date);
          return (
            statDate.getMonth() === currentMonth &&
            statDate.getFullYear() === currentYear
          );
        })
        .map((stat) => ({
          date: new Date(stat.date).toLocaleDateString("en-US", {
            day: "numeric",
          }),
          total: stat.grade7 + stat.grade8 + stat.grade9 + stat.grade10,
        }));
    }
    if (lineChartTimeRange === "This Year") {
      const currentYear = now.getFullYear();
      const yearlyData = stats.filter(
        (stat) => new Date(stat.date).getFullYear() === currentYear
      );
      const monthlyTotals = Array.from({ length: 12 }, () => 0);
      yearlyData.forEach((stat) => {
        const month = new Date(stat.date).getMonth();
        monthlyTotals[month] +=
          stat.grade7 + stat.grade8 + stat.grade9 + stat.grade10;
      });
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return monthlyTotals.map((total, index) => ({
        date: monthNames[index],
        total,
      }));
    }
    return [];
  }, [stats, lineChartTimeRange]);

  // Memoized calculation for gender breakdown pie charts
  const processedGenderBreakdown = useMemo(() => {
    const studentMap = new Map<string, Student>();
    allStudents.forEach((student) => studentMap.set(student.lrn, student));

    const breakdown: Record<number, { Male: number; Female: number }> = {
      7: { Male: 0, Female: 0 },
      8: { Male: 0, Female: 0 },
      9: { Male: 0, Female: 0 },
      10: { Male: 0, Female: 0 },
    };

    let logsToProcess: AttendanceLog[] = [];
    const now = new Date();

    if (genderTimeRange === "Today") {
      const todayString = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      logsToProcess = allLogs.filter((log) =>
        log.timestamp.startsWith(todayString)
      );
    } else if (genderTimeRange === "This Week") {
      const sevenDaysAgo = new Date(new Date().setDate(now.getDate() - 7));
      logsToProcess = allLogs.filter(
        (log) => new Date(log.timestamp) >= sevenDaysAgo
      );
    } else if (genderTimeRange === "This Month") {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      logsToProcess = allLogs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return (
          logDate.getMonth() === currentMonth &&
          logDate.getFullYear() === currentYear
        );
      });
    }

    logsToProcess.forEach((log) => {
      const student = studentMap.get(log.studentLrn);
      if (student) {
        const grade = parseInt(student.grade, 10);
        if (breakdown[grade]) {
          if (student.sex === "Male") breakdown[grade].Male++;
          else if (student.sex === "Female") breakdown[grade].Female++;
        }
      }
    });

    return breakdown;
  }, [allLogs, allStudents, genderTimeRange]);

  const timeRangeButtonStyle: React.CSSProperties = {
    background: "none",
    border: "1px solid var(--border-color)",
    padding: "0.25rem 0.75rem",
    borderRadius: "15px",
    cursor: "pointer",
    color: "var(--light-text)",
    fontSize: "0.8rem",
  };

  const activeTimeRangeButtonStyle: React.CSSProperties = {
    ...timeRangeButtonStyle,
    backgroundColor: "var(--green)",
    color: "white",
    border: "1px solid var(--green)",
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "auto",
        minHeight: "100vh",
        display: "flex",
        padding: "1.5rem",
        flexDirection: "row",
        backgroundColor: "rgba(58, 140, 75, 0.1)",
      }}
    >
      {/* Left Side */}
      <div style={{ width: "75%", display: "flex", flexDirection: "column" }}>
        {/* A: Daily visitors trend */}
        <div
          style={{
            ...cardStyle,
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ExportDataConcept />
          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                marginBottom: "8px",
                color: "var(--green)",
              }}
            >
              Library Visitor Trend
            </h2>
            <p
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 400,
                fontSize: "0.9rem",
                color: "var(--light-text)",
                marginBottom: "16px",
              }}
            >
              This chart shows the total number of visitors for the selected
              period.
            </p>
          </div>
          {/* Chart Container */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedLineChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-color)"
                />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Visitors"
                  stroke="var(--green)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Time Range Selector */}
          <div
            style={{
              textAlign: "center",
              paddingTop: "10px",
              flexShrink: 0,
              display: "flex",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {(["Last 7 Days", "This Month", "This Year"] as const).map(
              (range) => (
                <button
                  key={range}
                  onClick={() => setLineChartTimeRange(range)}
                  style={
                    lineChartTimeRange === range
                      ? activeTimeRangeButtonStyle
                      : timeRangeButtonStyle
                  }
                >
                  {range}
                </button>
              )
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex" }}>
          <div
            style={{
              ...cardStyle,
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <ExportDataConcept />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div>
                <h5
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 700,
                    color: "var(--dark-text)",
                    margin: 0,
                  }}
                >
                  Grade Level Breakdown
                </h5>
                <p
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "0.9rem",
                    color: "var(--light-text)",
                    margin: "4px 0 0 0",
                  }}
                >
                  An overview of visitors by gender.
                </p>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "1rem",
                border: "1px solid var(--border-color)",
                borderRadius: "0.5rem",
                backgroundColor: "var(--light-gray)",
                padding: "1rem",
              }}
            >
              {[7, 8, 9, 10].map((grade) => {
                const gradeLabel = `Grade ${grade}`;
                const maleCount = processedGenderBreakdown[grade]?.Male || 0;
                const femaleCount =
                  processedGenderBreakdown[grade]?.Female || 0;
                const total = maleCount + femaleCount;

                const data =
                  total === 0
                    ? [{ name: "No Data", value: 1 }]
                    : [
                        { name: "Male", value: maleCount },
                        { name: "Female", value: femaleCount },
                      ];

                return (
                  <div
                    key={grade}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <h6
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 600,
                        marginBottom: "0.5rem",
                        color: "var(--dark-text)",
                      }}
                    >
                      {gradeLabel}
                    </h6>
                    <PieChart width={100} height={100}>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={40}
                        paddingAngle={total > 0 ? 2 : 0}
                        dataKey="value"
                        nameKey="name"
                      >
                        {data.map((entry, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={
                              total === 0
                                ? "#E0E0E0"
                                : genderColors[entry.name as "Male" | "Female"]
                            }
                          />
                        ))}
                      </Pie>
                      {total > 0 && <Tooltip />}
                    </PieChart>
                  </div>
                );
              })}
            </div>
            {/* NEW FOOTER LAYOUT */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "1rem",
              }}
            >
              {/* Color Labels on the left */}
              <div style={{ display: "flex", gap: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: genderColors.Male,
                    }}
                  />
                  <span
                    style={{ color: "var(--dark-text)", fontSize: "0.9rem" }}
                  >
                    Male
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: genderColors.Female,
                    }}
                  />
                  <span
                    style={{ color: "var(--dark-text)", fontSize: "0.9rem" }}
                  >
                    Female
                  </span>
                </div>
              </div>

              {/* View Buttons on the right */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["Today", "This Week", "This Month"] as const).map(
                  (range) => (
                    <button
                      key={range}
                      onClick={() => setGenderTimeRange(range)}
                      style={
                        genderTimeRange === range
                          ? activeTimeRangeButtonStyle
                          : timeRangeButtonStyle
                      }
                    >
                      {range}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
          {/* C: Top Monthly Visitors Leaderboard */}
          <div
            style={{
              ...cardStyle,
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <ExportDataConcept />
            <h5
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                color: "var(--dark-text)",
                marginBottom: "16px",
              }}
            >
              Top Monthly Visitors
            </h5>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-around",
              }}
            >
              {topVisitors.map((visitor, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0.5rem",
                    backgroundColor: "rgba(58, 140, 75, 0.1)",
                    borderRadius: "8px",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      marginRight: "1rem",
                      color: "var(--green)",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p
                      style={{
                        fontWeight: "bold",
                        margin: 0,
                        color: "var(--dark-text)",
                      }}
                    >
                      {visitor.name}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: "var(--light-text)",
                        fontSize: "0.9rem",
                      }}
                    >
                      Grade {visitor.grade} - {visitor.visits} visits
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div style={{ width: "25%", display: "flex", flexDirection: "column" }}>
        {/* D: Today's Snapshot */}
        <div
          style={{
            ...cardStyle,
            flex: 1,
            backgroundColor: "var(--green)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h4
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            Today's Snapshot
          </h4>
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: "5.5rem",
                fontWeight: "bold",
                margin: 0,
              }}
            >
              {snapshot.totalVisitors}
            </p>
            <p style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>
              Visitors Today
            </p>
            <p
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                margin: 0,
              }}
            >
              {snapshot.uniqueStudents}
            </p>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>Unique Students</p>
          </div>
        </div>
        <div
          style={{
            ...cardStyle,
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h5
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              color: "var(--dark-text)",
              marginBottom: "16px",
            }}
          >
            Recent Visitors
          </h5>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {recentVisitors.map((visitor, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <div>
                  <p
                    style={{
                      fontWeight: "bold",
                      margin: 0,
                      fontSize: "0.9rem",
                      color: "var(--dark-text)",
                    }}
                  >
                    {visitor.name}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "var(--light-text)",
                    }}
                  >
                    Grade {visitor.grade}
                  </p>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.9rem",
                    color: "var(--light-text)",
                  }}
                >
                  {visitor.time}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
