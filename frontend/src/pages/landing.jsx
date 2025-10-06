import React, { useEffect, useState } from "react";
import "../App.css";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {

  const router = useNavigate();

  const[loggedIn, setLoggedIn] = useState(true);

   useEffect(() => {
      console.log('Runs when count changes');
    }, [loggedIn]);

  const hangleLogout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
  }

  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <h2>Link-Up</h2>
        </div>
        {!(localStorage.getItem('token')) && 
        <div className="navList">
          <p>Join as Guest</p>
          <p onClick={() => router("/auth")}>Register</p>
          <div role="button"  onClick={() => router("/auth")}>Login</div>
        </div>
        }
        {localStorage.getItem('token') && 
        <div className="navList">
          <div onClick={hangleLogout}>Logout</div>
        </div>
        }
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
