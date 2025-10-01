import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getAllDailyStats } from "../services/studentService";
import { getTodaysGenderBreakdown } from "../services/attendanceService";
import type { DailyGradeCounter } from "../types/dailyCounter";

const StatisticsPage: React.FC = () => {
  const [stats, setStats] = useState<DailyGradeCounter[]>([]);
  const [genderBreakdown, setGenderBreakdown] = useState<{
    [grade: number]: { Male: number; Female: number };
  }>({
    7: { Male: 0, Female: 0 },
    8: { Male: 0, Female: 0 },
    9: { Male: 0, Female: 0 },
    10: { Male: 0, Female: 0 },
  });

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getAllDailyStats();
      setStats(data);
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchGenderData = async () => {
      const breakdown = await getTodaysGenderBreakdown();
      console.log("Fetched gender breakdown:", breakdown);
      setGenderBreakdown(breakdown);
    };
    fetchGenderData();
  }, []);

  const cardStyle = {
    backgroundColor: "var(--light-gray)",
    borderRadius: "1rem",
    padding: "1rem",
    margin: "0.5rem",
    boxShadow: "var(--shadow)",
  };
  const genderColors = {
    Male: "var(--green)",
    Female: "var(--yellow)",
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
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
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <h2
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              marginBottom: "8px",
              color: "var(--green)",
            }}
          >
            Daily Library Visitors
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
            This chart shows the total number of visitors per day across all
            grade levels.
          </p>
          <LineChart width={700} height={300} data={stats}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" stroke="var(--dark-text)" />
            <YAxis stroke="var(--dark-text)" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={(d) => d.grade7 + d.grade8 + d.grade9 + d.grade10}
              name="Total Visitors"
              stroke="var(--green)"
            />
          </LineChart>
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
            <h5
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                color: "var(--dark-text)",
                marginBottom: "8px",
              }}
            >
              Grade Level Breakdown
            </h5>
            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "1rem",
                border: "1px solid var(--border-color)",
                borderRadius: "0.5rem",
                boxShadow: "var(--shadow)",
                backgroundColor: "var(--light-gray)",
                padding: "1rem",
              }}
            >
              {[7, 8, 9, 10].map((grade) => {
                const gradeLabel = `Grade ${grade}`;
                const data = [
                  { name: "Male", value: genderBreakdown[grade]?.Male || 0 },
                  {
                    name: "Female",
                    value: genderBreakdown[grade]?.Female || 0,
                  },
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
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {data.map((entry, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={genderColors[entry.name as "Male" | "Female"]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ ...cardStyle, flex: 1 }}>C</div>
        </div>
      </div>

      {/* Right Side */}
      <div style={{ width: "25%", display: "flex", flexDirection: "column" }}>
        <div style={{ ...cardStyle, flex: 1 }}>D</div>
        <div style={{ ...cardStyle, flex: 1 }}>E</div>
      </div>
    </div>
  );
};

export default StatisticsPage;
