import "./App.css";
import Authentication from "./pages/authPage/authentication";
import LandingPage from "./pages/landing";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import VideoMeetComponent from "./pages/video/videoMeet.jsx";
import '@fortawesome/fontawesome-free/css/all.min.css';
import HomeComponent from "./pages/Home/home.jsx";


function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Authentication />} />
        <Route path="/home" element={<HomeComponent/>} />
        <Route path="/:url" element={<VideoMeetComponent/>} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </>
  );
}

export default App;
