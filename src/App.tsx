import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomeScreen from "./pages/HomeScreen";
import AdminPage from "./pages/AdminPage";
import StatisticsPage from "./pages/StatisticsPage";
import NavBar from "./components/NavBar";
import { startGradeUpdateTimer } from "./services/gradeUpdateService";
import "./services/consoleCommands";

const App: React.FC = () => {
  useEffect(() => {
    startGradeUpdateTimer();
  }, []);

  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
      </Routes>
    </Router>
  );
};

export default App;
