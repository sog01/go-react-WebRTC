import { useState } from 'react';

const VideoPlayer = ({ videoRef, isLocalUser = false, stream = null, onToggleAudio, onToggleVideo, onToggleScreenShare }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const handleMuteToggle = () => {
        if (stream && stream.getAudioTracks().length > 0) {
            const audioTrack = stream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
            if (onToggleAudio) onToggleAudio(!audioTrack.enabled);
        }
    };

    const handleVideoToggle = () => {
        if (stream && stream.getVideoTracks().length > 0) {
            const videoTrack = stream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoOff(!videoTrack.enabled);
            if (onToggleVideo) onToggleVideo(!videoTrack.enabled);
        }
    };

    const handleScreenShareToggle = async () => {
        if (onToggleScreenShare) {
            await onToggleScreenShare(!isScreenSharing);
            setIsScreenSharing(!isScreenSharing);
        }
    };

    return (
        <div style={{
            position: 'relative',
            width: isLocalUser ? '300px' : '100%',
            maxWidth: isLocalUser ? '300px' : '800px',
            height: isLocalUser ? '200px' : '600px',
            backgroundColor: '#202124',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
            {/* Video Element */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocalUser}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: isVideoOff ? 'none' : 'block'
                }}
            />

            {/* Video Off Placeholder */}
            {isVideoOff && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#202124',
                    color: '#fff'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: '#5f6368',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        fontWeight: 'bold'
                    }}>
                        {isLocalUser ? 'You' : 'U'}
                    </div>
                </div>
            )}

            {/* Controls Overlay (only for local user) */}
            {isLocalUser && (
                <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '12px',
                    backgroundColor: 'rgba(32, 33, 36, 0.9)',
                    padding: '12px',
                    borderRadius: '24px',
                    backdropFilter: 'blur(8px)'
                }}>
                    {/* Microphone Button */}
                    <button
                        onClick={handleMuteToggle}
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: isMuted ? '#ea4335' : '#3c4043',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isMuted) e.target.style.backgroundColor = '#5f6368';
                        }}
                        onMouseLeave={(e) => {
                            if (!isMuted) e.target.style.backgroundColor = '#3c4043';
                        }}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? '🔇' : '🎤'}
                    </button>

                    {/* Video Button */}
                    <button
                        onClick={handleVideoToggle}
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: isVideoOff ? '#ea4335' : '#3c4043',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isVideoOff) e.target.style.backgroundColor = '#5f6368';
                        }}
                        onMouseLeave={(e) => {
                            if (!isVideoOff) e.target.style.backgroundColor = '#3c4043';
                        }}
                        title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                    >
                        {isVideoOff ? '📷' : '📹'}
                    </button>

                    {/* Screen Share Button */}
                    {/* <button
                        onClick={handleScreenShareToggle}
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: isScreenSharing ? '#1a73e8' : '#3c4043',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isScreenSharing) e.target.style.backgroundColor = '#5f6368';
                        }}
                        onMouseLeave={(e) => {
                            if (!isScreenSharing) e.target.style.backgroundColor = '#3c4043';
                        }}
                        title={isScreenSharing ? 'Stop presenting' : 'Present now'}
                    >
                        🖥️
                    </button> */}
                </div>
            )}

            {/* User Label */}
            <div style={{
                position: 'absolute',
                bottom: isLocalUser ? '80px' : '16px',
                left: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500'
            }}>
                {isLocalUser ? 'You' : 'Participant'}
            </div>

            {/* Muted Indicator for Remote User */}
            {!isLocalUser && isMuted && (
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    backgroundColor: '#ea4335',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '16px'
                }}>
                    🔇
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;