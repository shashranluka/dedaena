import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home/Home.jsx";
import LettersPage from "./pages/LettersPage/LettersPage.jsx";
import Navbar from "./components/Navbar/Navbar.jsx";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/letters" element={<LettersPage />} />
      </Routes>
    </Router>
  );
}

export default App;
