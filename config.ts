// Configuration for BitChat
export const config = {
    // Signaling server URL - uses environment variable or falls back to localhost
    SIGNALING_SERVER:
        import.meta.env.VITE_SIGNALING_SERVER ||
        (import.meta.env.DEV
            ? 'ws://localhost:8080'
            : 'wss://bitchat-signaling.onrender.com'),

    // WebRTC configuration with multiple free TURN servers for better reliability
    RTC_CONFIG: {
        iceServers: [
            // Free Google STUN servers (for NAT traversal)
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },

            // Twilio STUN (more reliable)
            { urls: 'stun:global.stun.twilio.com:3478' },

            // Free TURN servers - Multiple providers for fallback
            // OpenRelay (Primary)
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },

            // Metered.ca Free TURN (Fallback 1)
            {
                urls: 'turn:a.relay.metered.ca:80',
                username: 'free',
                credential: 'free'
            },
            {
                urls: 'turn:a.relay.metered.ca:443',
                username: 'free',
                credential: 'free'
            },

            // Numb STUN/TURN (Fallback 2)
            {
                urls: 'turn:numb.viagenie.ca',
                username: 'webrtc@live.com',
                credential: 'muazkh'
            },

            // Xirsys Free TURN (Fallback 3)
            {
                urls: 'turn:freestun.net:3478',
                username: 'free',
                credential: 'free'
            }
        ],
        iceCandidatePoolSize: 20, // Increased for faster connection establishment
        iceTransportPolicy: 'all' as RTCIceTransportPolicy, // Use both STUN and TURN
        bundlePolicy: 'max-bundle' as RTCBundlePolicy,
        rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy
    },

    // App settings
    MAX_PEERS: 10,
    RECONNECT_DELAY: 3000,
    HEARTBEAT_INTERVAL: 5000,
    MESSAGE_BATCH_INTERVAL: 100,

    // Production mode
    IS_PRODUCTION: import.meta.env.PROD
};
