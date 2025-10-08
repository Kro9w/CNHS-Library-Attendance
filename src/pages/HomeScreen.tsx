import React, { useState, useEffect, type CSSProperties, useRef } from "react";
import {
  getStudentByLRN,
  logAttendance,
  getTodaysStats,
  incrementDailyStats,
  getAllStudents,
} from "../services/studentService";
import { type Student } from "../types/student";

// Import custom fonts
import "@fontsource/nunito-sans/800.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/600.css";
import { GradientText } from "@/components/ui/shadcn-io/gradient-text";
import { ShimmeringText } from "@/components/ui/shadcn-io/shimmering-text";

interface GradeCounter {
  [grade: string]: number;
}

const AnimatedCard: React.FC<{
  grade: string;
  count: number;
  isUpdated: boolean;
}> = ({ grade, count, isUpdated }) => {
  const [displayCount, setDisplayCount] = useState(count);

  useEffect(() => {
    if (count !== displayCount) {
      setDisplayCount(count);
    }
  }, [count, displayCount]);

  const cardWrapperStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height: "130px",
  };
  const cardBaseStyle: CSSProperties = {
    borderRadius: "1rem",
    width: "100%",
    height: "100%",
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  };
  const cardBackStyle: CSSProperties = {
    ...cardBaseStyle,
    backgroundColor: "var(--green)",
    top: "5px",
    left: 0,
  };
  const cardFrontStyle: CSSProperties = {
    ...cardBaseStyle,
    backgroundColor: "#ffffff",
    boxShadow: "var(--shadow)",
    transform: isUpdated ? "translateY(-8px)" : "translateY(0)",
    transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
    zIndex: 2,
  };
  const numberStyle: CSSProperties = {
    fontSize: "3.5rem",
    fontWeight: 800,
    color: "var(--green)",
    display: "inline-block",
    transform: isUpdated ? "scale(1.2)" : "scale(1)",
    transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
  };

  return (
    <div style={cardWrapperStyle}>
      <div style={cardBackStyle} />
      <div style={cardFrontStyle}>
        <span style={numberStyle}>{displayCount}</span>
        <span
          style={{
            fontSize: "1.1rem",
            display: "block",
            color: "var(--light-text)",
          }}
        >
          Grade {grade}
        </span>
      </div>
    </div>
  );
};

const HomeScreen: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scannedLRN, setScannedLRN] = useState("");
  const [greeting] = useState("Welcome to the Library!");
  const [lastScannedName, setLastScannedName] = useState("");
  const [warning, setWarning] = useState("");
  const [gradeCounters, setGradeCounters] = useState<GradeCounter>({
    "7": 0,
    "8": 0,
    "9": 0,
    "10": 0,
  });
  const [lastUpdatedGrade, setLastUpdatedGrade] = useState<string | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [hoveredSuggestionIndex, setHoveredSuggestionIndex] = useState<
    number | null
  >(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAllStudents = async () => {
      const students = await getAllStudents();
      setAllStudents(students);
    };
    const fetchStats = async () => {
      const stats = await getTodaysStats();
      setGradeCounters({
        "7": stats.grade7,
        "8": stats.grade8,
        "9": stats.grade9,
        "10": stats.grade10,
      });
    };
    fetchAllStudents();
    fetchStats();
  }, []);

  const handleScan = async (lrnToScan?: string) => {
    const lrn = (lrnToScan || scannedLRN).trim();
    if (!lrn) return;
    try {
      const student = await getStudentByLRN(lrn);
      if (!student) {
        setWarning(`Student with LRN ${lrn} not found!`);
        setTimeout(() => setWarning(""), 2000);
        return;
      }
      setLastScannedName(`Hello, ${student.firstName}!`);
      await logAttendance(student);
      const stats = await incrementDailyStats(student.grade);
      setLastUpdatedGrade(String(student.grade));
      setTimeout(() => {
        setGradeCounters({
          "7": stats.grade7,
          "8": stats.grade8,
          "9": stats.grade9,
          "10": stats.grade10,
        });
      }, 100);
      setTimeout(() => setLastUpdatedGrade(null), 700);
      setTimeout(() => setLastScannedName(""), 1750);
    } catch (error) {
      console.error("Scan failed:", error);
      setWarning("An error occurred. Please try again.");
      setTimeout(() => setWarning(""), 3000);
    } finally {
      setScannedLRN("");
      setSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setScannedLRN(value);

    if (value.length > 1) {
      const lowercasedValue = value.toLowerCase();
      const filteredSuggestions = allStudents
        .filter((student) => {
          const fullName =
            `${student.firstName} ${student.lastName}`.toLowerCase();
          // Search by LRN (starts with) OR by Name (includes)
          return (
            student.lrn.startsWith(value) || fullName.includes(lowercasedValue)
          );
        })
        .slice(0, 3);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (student: Student) => {
    setScannedLRN(student.lrn);
    setSuggestions([]);
    handleScan(student.lrn);
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const containerStyle: CSSProperties = {
    display: "flex",
    width: "100vw",
    height: "100vh",
    fontFamily: "'Poppins', sans-serif",
  };
  const leftPanelStyle: CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "var(--light-gray)",
    padding: "2rem",
    textAlign: "center",
  };
  const rightPanelStyle: CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(58, 140, 75, 0.1)",
    padding: "2rem",
    textAlign: "center",
  };
  const greetingContainerStyle: CSSProperties = {
    minHeight: "3rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: "100%",
  };
  const baseGreetingStyle: CSSProperties = {
    position: "absolute",
    transition: "opacity 0.4s ease, transform 0.4s ease",
  };
  const suggestionItemHeight = 60;

  return (
    <div style={containerStyle}>
      <div style={leftPanelStyle}>
        <GradientText
          className="tw:text-6xl tw:font-[1000] tw:mb-3"
          text={getTimeBasedGreeting()}
          gradient="linear-gradient(70deg, #3a8c4b 0%, #fdcb6e 50%, #3a8c4b 100%)"
        />
        <div style={greetingContainerStyle}>
          <h3
            className="tw:text-2xl tw:font-semibold tw:text-slate-700"
            style={{
              ...baseGreetingStyle,
              opacity: lastScannedName ? 0 : 1,
              transform: lastScannedName ? "translateX(20px)" : "translateX(0)",
            }}
          >
            {greeting}
          </h3>
          <div
            style={{
              ...baseGreetingStyle,
              opacity: lastScannedName ? 1 : 0,
              transform: lastScannedName
                ? "translateX(0)"
                : "translateX(-20px)",
            }}
          >
            {lastScannedName && (
              <ShimmeringText
                className="tw:text-2xl tw:font-semibold"
                text={lastScannedName}
                duration={1}
                wave={true}
              />
            )}
          </div>
        </div>
        {warning && (
          <div
            style={{
              backgroundColor: "var(--yellow)",
              color: "var(--dark-text)",
              padding: "1rem",
              borderRadius: "0.5rem",
              width: "80%",
              fontWeight: 600,
              boxShadow: "var(--shadow)",
              marginBottom: "1rem",
              marginTop: "1rem",
            }}
          >
            {warning}
          </div>
        )}
        <div
          ref={searchContainerRef}
          style={{ width: "80%", marginTop: "1rem", position: "relative" }}
        >
          <input
            type="text"
            placeholder="Search by LRN or Name..."
            value={scannedLRN}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            style={{
              width: "100%",
              padding: "1.2rem",
              borderRadius: "25px",
              border: "2px solid var(--border-color)",
              fontSize: "1.2rem",
              textAlign: "center",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              left: 0,
              right: 0,
              zIndex: 10,
              display: "grid",
              gridTemplateRows: suggestions.length > 0 ? "1fr" : "0fr",
              transition:
                "grid-template-rows 0.3s ease-out, opacity 0.3s ease-out, transform 0.3s ease-out",
              transformOrigin: "top center",
              opacity: suggestions.length > 0 ? 1 : 0,
              transform: suggestions.length > 0 ? "scaleY(1)" : "scaleY(0.95)",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "1rem",
                boxShadow: "var(--shadow)",
                overflow: "hidden",
              }}
            >
              {suggestions.map((student, index) => {
                const isHovered = hoveredSuggestionIndex === index;
                const suggestionStyle: CSSProperties = {
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  height: `${suggestionItemHeight}px`,
                  cursor: "pointer",
                  borderBottom:
                    index < suggestions.length - 1
                      ? "1px solid var(--border-color)"
                      : "none",
                  transition: "background-color 0.2s ease, color 0.2s ease",
                  backgroundColor: isHovered ? "var(--green)" : "white",
                  color: isHovered ? "white" : "var(--dark-text)",
                };
                const lrnStyle: CSSProperties = {
                  transition: "color 0.2s ease",
                  color: isHovered ? "white" : "var(--light-text)",
                };
                return (
                  <div
                    key={student.lrn}
                    onClick={() => handleSuggestionClick(student)}
                    onMouseEnter={() => setHoveredSuggestionIndex(index)}
                    onMouseLeave={() => setHoveredSuggestionIndex(null)}
                    style={suggestionStyle}
                  >
                    <span
                      style={{ fontWeight: 600 }}
                    >{`${student.lastName}, ${student.firstName}`}</span>
                    <span style={lrnStyle}>{student.lrn}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <p
          style={{
            marginTop: "2rem",
            color: "var(--light-text)",
            fontSize: "1rem",
          }}
        >
          {currentTime.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          {" | "}
          {currentTime.toLocaleTimeString()}
        </p>
      </div>
      <div style={rightPanelStyle}>
        <h2
          style={{
            fontFamily: "'Nunito Sans', sans-serif",
            marginBottom: "2rem",
            color: "var(--dark-text)",
            fontWeight: 800,
          }}
        >
          Today's Visitors
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            width: "100%",
            maxWidth: "500px",
          }}
        >
          {["7", "8", "9", "10"].map((grade) => (
            <AnimatedCard
              key={grade}
              grade={grade}
              count={gradeCounters[grade] || 0}
              isUpdated={lastUpdatedGrade === grade}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
