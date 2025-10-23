import React from "react";
import { Link } from "react-router-dom";
import './Home.scss';
// import Gogebashvili from "./pages/Gogebashvili/Gogebashvili";

function Home() {
  return (
    <div className="home-page">
      <h1>ქართული ანბანი</h1>
      <Link to="/letters">
        <button className="letters-btn">ასოების ნახვა</button>
      </Link>
      <Link to="/gogebashvili">
        <button className="gogebashvili-btn">გოგებაშვილის ნახვა</button>
      </Link>
    </div>
  );
}

export default Home;
