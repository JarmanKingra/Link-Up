import React, { useEffect, useRef, useState } from "react";
import styles from "./videomeet.module.css";

const serverUrl = "http://localhost:3001";

var connections = {};

const peerConfitConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  var socketRef = useRef();

  let sockectIdRef = useRef();

  let localVideoRef = useRef();

  let [videoAvailable, setVideoAvialable] = useState(true);

  let [audioAvailable, setAudioAvialable] = useState(true);

  let [video, setVideo] = useState();

  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState();

  let [showModal, setModal] = useState();

  let [screenAvailable, setScreenAvailable] = useState();

  let [messages, setMessages] = useState([]);

  let [message, setMessage] = useState();

  let [newMmessages, setNewMessages] = useState(0);

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([])

  const getPermission = async() => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({video:true});

      if(videoPermission){
        setVideoAvialable(true);
      }else{
        setVideoAvialable(false);
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({audio:true});

      if(audioPermission){
        setAudioAvialable(true);
      }else{
        setAudioAvialable(false);
      }

      if(navigator.mediaDevices.getDisplayMedia){
        setScreenAvailable(true)
      }else{
        setScreenAvailable(false)
      }

      if(videoAvailable || audioAvailable){
        const userMediaStream = await navigator.mediaDevices.getUserMedia({video: videoAvailable})

        if(userMediaStream){
          window.localStream = userMediaStream;
          if(localVideoRef.current){
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getPermission();
  }, []);

  let getUserMediaSuccess = (stream) => {

  }

  let getUserMedia = () => {
    if((video && videoAvailable) || (audio && audioAvailable)){
      navigator.mediaDevices.getUserMedia({audio: audio, video: video})
      .then(getUserMediaSuccess) 
      .then((stream) => {})
      .catch((e) => console.log(e))
    }else{
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      } catch (error) {
        
      }
    }

  }

  useEffect(() => {
    if(video !== undefined && audio !== undefined){
      getUserMedia();
    }
  },[audio, video])

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    // connectToSocketServer();
  }

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  }

  return (
    <div>
      {askForUsername ? (
        <div>
          <h2>Enter into Lobby</h2>
          <input
            className={styles.inputs}
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <div className={styles.button} role="button" onClick={connect}>
            Connect
          </div>

          <div>
            <video ref={localVideoRef} autoPlay muted></video>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
