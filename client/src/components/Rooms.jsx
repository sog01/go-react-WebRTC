import {useEffect, useRef, useState} from 'react'
import {useLocation} from "react-router-dom";
import VideoPlayer from './Videoplayer';

const Room = () => {
    const location = useLocation();
    const userVideo = useRef();
    const userStream = useRef();
    const partnerVideo = useRef();
    const peerRef = useRef();
    const webSocketRef = useRef();
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [currentUserStream, setCurrentUserStream] = useState(null); // State to trigger re-render
    const screenStream = useRef();
    

    const openCamera = async () => {
        const constraints = {
            video: true,
            audio: true,
        };
        return navigator.mediaDevices.getUserMedia(constraints).then((stream) =>{
            userVideo.current.srcObject = stream
            userStream.current = stream
            setCurrentUserStream(stream)
        })
    };

    const handleScreenShare = async (shouldShare) => {
        try {
            if (shouldShare) {
                // Start screen sharing
                const screenStreamData = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });
                
                screenStream.current = screenStreamData;
                
                // Replace video track in peer connection
                if (peerRef.current) {
                    const videoTrack = screenStreamData.getVideoTracks()[0];
                    const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    }
                }
                
                // Update local video
                userVideo.current.srcObject = screenStreamData;
                
                // Handle screen share stop
                screenStreamData.getVideoTracks()[0].onended = () => {
                    handleScreenShare(false);
                };
                
                setIsScreenSharing(true);
            } else {
                // Stop screen sharing and return to camera
                if (screenStream.current) {
                    screenStream.current.getTracks().forEach(track => track.stop());
                }
                
                // Replace with camera track
                if (peerRef.current && userStream.current) {
                    const videoTrack = userStream.current.getVideoTracks()[0];
                    const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    }
                }
                
                // Restore camera video
                userVideo.current.srcObject = userStream.current;
                setIsScreenSharing(false);
            }
        } catch (err) {
            console.error('Screen sharing error:', err);
            setIsScreenSharing(false);
        }
    };

    const hasInitialized = useRef(false);
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        openCamera().then( async() => {
            const roomID = location.pathname.split("/");
            webSocketRef.current = new WebSocket(`wss://meetsmi.com/api/join?roomID=${roomID[2]}`)

            
           webSocketRef.current.addEventListener("open", () => {
                webSocketRef.current.send(JSON.stringify({ join: true }));
            });

           webSocketRef.current.addEventListener("message", async (e) => {
                const message = JSON.parse(e.data);

                if (message.join) {
                    callUser();
                }

				if (message.offer) {
                    handleOffer(message.offer);
                }

                if (message.answer) {
                    console.log("Receiving Answer");
                    peerRef.current.setRemoteDescription(
                        new RTCSessionDescription(message.answer)
                    );
                }

                if (message.iceCandidate) {
                    console.log("Receiving and Adding ICE Candidate");
                   try{
                    await peerRef.current.addIceCandidate(
                        message.iceCandidate
                   );
                   }catch(err) {
                        console.log("error ICE CANDIDADE")
                   }
                }
            })
        })
    }, []);

    const handleOffer = async (offer) => {
        console.log("Handle Offer");
        peerRef.current = createPeer();
        await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(offer)
        );

        if (userStream.current) {
            console.log('send current tracks')
            await userStream.current.getTracks().forEach((track) => {
                peerRef.current.addTrack(track, userStream.current);
            });
        }

        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);

        await webSocketRef.current.send(
            JSON.stringify({ answer: peerRef.current.localDescription })
        );
    };

    const callUser = async () => {
        console.log("Calling Other User");
        peerRef.current = createPeer();

        await userStream.current.getTracks().forEach(async (track) => {
            await peerRef.current.addTrack(track, userStream.current);
        });
    };

    const createPeer = () => {
        console.log("Creating Peer Connection");
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" }, 
                { 
                    urls: 'turn:meetsmi.com:3478',
                    username: 'meetuser',
                    credential: 'b6679d9b-1619-4fb1-af78-8c755c9d8f14'
                }
            ],
        });

        peer.onnegotiationneeded = handleNegotiationNeeded;
        peer.onicecandidate = handleIceCandidateEvent;
        peer.ontrack = handleTrackEvent;

        return peer;
    };

    const handleNegotiationNeeded = async () => {
        console.log("Creating Offer");

        try {
            const myOffer = await peerRef.current.createOffer();
            await peerRef.current.setLocalDescription(myOffer);

            await webSocketRef.current.send(
                JSON.stringify({ offer: peerRef.current.localDescription })
            );
        } catch (err) {}
    };

    const handleIceCandidateEvent = async (e) => {
        console.log("Found Ice Candidate");
        if (e.candidate) {
            const type = e.candidate.type;
        
            if (type === 'host') {
                console.log('🏠 HOST candidate (local IP):', e.candidate.address);
            } else if (type === 'srflx') {
                console.log('🌐 SRFLX candidate (STUN - public IP):', e.candidate.address);
            } else if (type === 'relay') {
                console.log('🔄 RELAY candidate (TURN server) - SUCCESS!:', e.candidate.address);
            } else {
                console.log('❓ Unknown type:', type);
            }
            await webSocketRef.current.send(
                JSON.stringify({ iceCandidate: e.candidate })
            );
        }
    };

    const handleTrackEvent = (e) => {
        console.log("Received Tracks");
        console.log(e.streams)
        partnerVideo.current.srcObject = e.streams[0];
    };

    
  return (
    <div style={{
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        padding: '20px'
    }}>
        {/* Header */}
        <div style={{
             display : "flex",
             justifyContent : "center",
             alignItems : "center",
             color:"whitesmoke",
             marginBottom: '30px'
            }}>
            <h1>
                Meets Me
            </h1>
        </div>

        {/* Video Grid */}
        <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            maxWidth: '1400px',
            margin: '0 auto'
        }}>
            {/* Partner Video (Main) */}
            <VideoPlayer 
                videoRef={partnerVideo}
                isLocalUser={false}
            />

            {/* User Video (Small) */}
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 10
            }}>
                <VideoPlayer 
                    videoRef={userVideo}
                    isLocalUser={true}
                    stream={currentUserStream}
                    onToggleScreenShare={handleScreenShare}
                />
            </div>
        </div>
    </div>
  )
}

export default Room;