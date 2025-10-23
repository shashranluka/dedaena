import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home/Home.jsx";
import LettersPage from "./pages/LettersPage/LettersPage.jsx";
import Gogebashvili from "./pages/Gogebashvili/Gogebashvili";
import GameDedaena from "./pages/GameDedaena/GameDedaena";
import Navbar from "./components/Navbar/Navbar.jsx";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/letters" element={<LettersPage />} />
        <Route path="/gogebashvili" element={<Gogebashvili />} />
        <Route path="/gamededaena" element={<GameDedaena />} />
      </Routes>
    </Router>
  );
}

export default App;
