import React, { useEffect, useRef, useState } from "react";
import styles from "./videomeet.module.css";
import { io } from "socket.io-client";


const serverUrl = "http://localhost:3001";

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  var socketRef = useRef();

  let sockectIdRef = useRef();

  let localVideoRef = useRef();

  let [videoAvailable, setVideoAvialable] = useState(true);

  let [audioAvailable, setAudioAvialable] = useState(true);

  let [video, setVideo] = useState([]);

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

      if(navigator.mediaDevices.getDisplayMedia){ // if browser support Screen Sharing
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

  // todo 
  let gotMessageFromServer = () => {

  }

  // todo 
  let addMessage = () => {
    
  }

  let connectToSocketServer = () => {

    socketRef.current = io.connect(serverUrl, {secure: false})

    socketRef.current.on("signal", gotMessageFromServer );
    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      sockectIdRef.current = socketRef.current.id;
      socketRef.current.on("chat-message", addMessage );

      socketRef.current.on("user-left", (id) => {
        setVideo((videos) => videos.filter((video) => video.socketId !== id))
      })

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {

        connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

        connections[socketListId].onicecandidate = (event) => {
          if(event.candidate !== null){
            socketRef.current.emit("signal", socketListId, JSON.stringify({"ice": event.candidate}))
          }
        }

        connections[socketListId].onaddstrean = (event) => {
          let videoExists = videoRef.current.find(video => video.socketId == socketListId);

          if(videoExists){
            setVideo(video => {
              const updatedvideos = videos.map(video => 
                video.socketId == socketListId ? {...video, stream: event.stream} : video
              )
              videoRef.current = updatedvideos;
              return updatedvideos;
            })
          } else {
            let newVideo = {
              socketId: socketListId,
              stream: event.stream,
              autoPlay: true,
              playsinline: true
            }

            setVideo(videos => {
              const updatedVideos = [...videos, newVideo];
              videoRef.current = updatedVideos;
              return updatedVideos;
            })
          }
        };

        if(window.localStream !== undefined && window.localStream !== null){
          connections[socketListId].addStream(window.localStream);
        } else {
          // TODO BLACKSILENCE
        }

        })

        if(id == sockectIdRef.current){
          for( let id2 in connections){
            if(id2 == sockectIdRef.current)continue

            try {
              connections[id2].addStream(window.localStream)
            } catch (error) {}

            connections[id2].createOffer().then((discription) => {
              connections[id2].setLocalDiscription(discription)
              .then(() => {
                socketRef.current.emit("signal", id2, JSON.stringify({"sdp": connections[id2].localDescription}))
              })
              .catch(e => console.log(e));
            })
          }
        }
      })
    })
  }

 




  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
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
