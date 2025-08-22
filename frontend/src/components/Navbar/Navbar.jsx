import React from "react";
import { Link } from "react-router-dom";
import './Navbar.scss';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-link">მთავარი</Link>
      <Link to="/letters" className="nav-link">ასოები</Link>
    </nav>
  );
}

export default Navbar;
