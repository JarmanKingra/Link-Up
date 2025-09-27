import React from "react";
import "../App.css";

export default function LandingPage() {
  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <h2>Link-Up</h2>
        </div>
        <div className="navList">
          <p>Join as Guest</p>
          <p>Register</p>
          <div role="button">Login</div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1> <span style={{color: "rgb(251, 50, 126)"}}>Connect</span> with anyone</h1>
          <p style={{fontFamily: "sans-serif"}}>Turning distance into togetherness by  Link-Up</p>
          <div role="button">
           <a href="/home">Get Started</a>
          </div>
        </div> 

        <div>
          <img src="3708508.jpg" alt="" />
        </div>
      </div>
    </div>
  );
}
