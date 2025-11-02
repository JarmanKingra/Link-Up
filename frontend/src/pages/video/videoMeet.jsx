import React, { useEffect, useRef, useState } from "react";
import styles from "./videomeet.module.css";
import { io } from "socket.io-client";
import { Badge, Button, IconButton, prerelease } from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import TextField from "@mui/material/TextField";
import server from "../../../environment";

const serverUrl = server.prod;

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

  let [showModal, setModal] = useState(true);

  let [screenAvailable, setScreenAvailable] = useState();

  let [messages, setMessages] = useState([]);

  let [message, setMessage] = useState("");

  let [newMessages, setNewMessages] = useState(12);

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);

  const getPermission = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      if (videoPermission) {
        setVideoAvialable(true);
      } else {
        setVideoAvialable(false);
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      if (audioPermission) {
        setAudioAvialable(true);
      } else {
        setAudioAvialable(false);
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        // if browser support Screen Sharing ... as i am new to webrtc so i worte this.
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });

        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getPermission();
  }, []);

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.log(error);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id == sockectIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }
          // todo blackSilence
          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoRef.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        })
    );
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();

    let dst = oscillator.connect(ctx.createMediaStreamDestination());

    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });

    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ audio: audio, video: video })

        .then(getUserMediaSuccess)
        .then((stream) => {})

        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (error) {}
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [audio, video]);

  // todo
  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);
    if (fromId !== sockectIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type == "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }
      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  // todo
  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);

    if (socketIdSender !== sockectIdRef.current) {
      setNewMessages((prevMessages) => prevMessages + 1);
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(serverUrl, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      sockectIdRef.current = socketRef.current.id;
      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          if (socketListId === sockectIdRef.current) return; 

          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );

          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate !== null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          connections[socketListId].onaddstream = (event) => {
            let videoExists = videoRef.current.find(
              (video) => video.socketId == socketListId
            );

            if (videoExists) {
              setVideos((videos) => {
                const updatedvideos = videos.map((video) =>
                  video.socketId == socketListId
                    ? { ...video, stream: event.stream }
                    : video
                );
                videoRef.current = updatedvideos;
                return updatedvideos;
              });
            } else {
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoPlay: true,
                playsinline: true,
              };

              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            // TODO BLACKSILENCE

            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id == sockectIdRef.current) {
          for (let id2 in connections) {
            if (id2 == sockectIdRef.current) continue;

            try {
              connections[id2].addStream(window.localStream);
            } catch (error) {}

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  let handleVideo = () => {
    setVideo(!video);
  };

  let handleAudio = () => {
    setAudio(!audio);
  };

  let getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks.forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id == sockectIdRef.current) continue;
      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }
    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoRef.current.srcObject = window.localStream;

          getUserMedia();
        })
    );
  };

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen]);

  let handleScreen = () => {
    setScreen(!screen);
  };

  let sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (error) {}

    window.location.href = "/home";
  };

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
        <div className={styles.meetVideoContainer}>
          {showModal ? (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1>Chat</h1>

                <div className={styles.chattingDisplay}>
                  {messages.length > 0 ? (
                    messages.map((item, index) => {
                      return (
                        <div style={{ marginBottom: "20px" }} key={index}>
                          <p
                            style={{ fontFamily: "cursive", fontWeight: "900" }}
                          >
                            {item.sender}:</p>

                            <p
                            style={{
                              fontWeight: "normal",
                              fontFamily: "monospace",
                            }}
                          >
                            {item.data}
                          </p>
                          
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <p>No Messages yet!</p>
                    </>
                  )}
                </div>

                <div className={styles.chattingArea}>
                  <TextField
                    style={{width: "70%"}}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    id="outlined-basic"
                    label="Enter your chat"
                    variant="outlined"
                  />
                  <Button variant="contained" onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}

          <div className={styles.buttonContainers}>
            <div role="button" onClick={handleVideo}>
              {video == true ? (
                <i
                  className="fa-solid fa-video-slash"
                  style={{ color: "white", fontSize: "2rem" }}
                ></i>
              ) : (
                <i
                  className="fa-solid fa-video"
                  style={{ color: "white", fontSize: "2rem" }}
                ></i>
              )}
            </div>

            <div role="button" onClick={handleEndCall}>
              <i
                className="fa-solid fa-square-phone"
                style={{ color: "red", fontSize: "2rem" }}
              ></i>
            </div>

            <div role="button" onClick={handleAudio}>
              {audio == true ? (
                <i
                  className="fa-solid fa-microphone"
                  style={{ color: "white", fontSize: "2rem" }}
                ></i>
              ) : (
                <i
                  className="fa-solid fa-microphone-slash"
                  style={{ color: "white", fontSize: "2rem" }}
                ></i>
              )}
            </div>

            {screenAvailable == true ? (
              <div role="button" onClick={handleScreen}>
                {screen == true ? (
                  <i
                    className="fa-solid fa-laptop"
                    style={{ color: "white", fontSize: "2rem" }}
                  ></i>
                ) : (
                  <i
                    className="fa-solid fa-stop"
                    style={{ color: "white", fontSize: "2rem" }}
                  ></i>
                )}
              </div>
            ) : (
              <></>
            )}

            <Badge badgeContent={newMessages} max={999} color="primary">
              <IconButton
                onClick={() => setModal(!showModal)}
                style={{ color: "white" }}
              >
                <ChatIcon />{" "}
              </IconButton>
            </Badge>
          </div>

          <video
            className={styles.meetUserVideo}
            ref={localVideoRef}
            autoPlay
            muted
          ></video>
          <div className={styles.conferenceView}>
            {videos.map((video) => (
              <div key={video.socketId}>
                <video
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                ></video>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
