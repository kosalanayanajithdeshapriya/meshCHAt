import { config } from '../config';

export interface PeerConnection {
    peerId: string;
    userId: string;
    connection: RTCPeerConnection;
    dataChannel: RTCDataChannel | null;
    connected: boolean;
}

export interface WebRTCMessage {
    type: 'MESSAGE' | 'PRESENCE' | 'TYPING' | 'SYNC';
    channelId?: string;
    data: any;
    timestamp: number;
    senderId: string;
}

type MessageHandler = (message: WebRTCMessage) => void;
type ConnectionHandler = (peerId: string, connected: boolean) => void;

export class WebRTCMesh {
    private signalingWs: WebSocket | null = null;
    private peers: Map<string, PeerConnection> = new Map();
    private roomId: string | null = null;
    private peerId: string;
    private userId: string;
    private messageHandlers: MessageHandler[] = [];
    private connectionHandlers: ConnectionHandler[] = [];
    private chunkBuffers: Map<string, { chunks: Map<number, string>, totalChunks: number, receivedCount: number }> = new Map();
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private isConnecting: boolean = false;

    constructor(userId: string, peerId: string) {
        this.userId = userId;
        this.peerId = peerId;
    }

    // Connect to signaling server and join room
    async connect(roomId: string): Promise<void> {
        if (this.isConnecting) {
            console.log('Already connecting...');
            return;
        }

        this.isConnecting = true;
        this.roomId = roomId;

        return new Promise((resolve, reject) => {
            try {
                console.log(`🔌 Connecting to signaling server: ${config.SIGNALING_SERVER}`);
                this.signalingWs = new WebSocket(config.SIGNALING_SERVER);

                this.signalingWs.onopen = () => {
                    console.log('✅ Connected to signaling server');

                    // Join room
                    this.signalingWs!.send(JSON.stringify({
                        type: 'join-room',
                        roomId: this.roomId,
                        peerId: this.peerId,
                        userId: this.userId
                    }));
                };

                this.signalingWs.onmessage = async (event) => {
                    const data = JSON.parse(event.data);
                    await this.handleSignalingMessage(data);

                    if (data.type === 'room-joined') {
                        this.isConnecting = false;
                        resolve();
                    }
                };

                this.signalingWs.onerror = (error) => {
                    console.error('❌ Signaling server error:', error);
                    this.isConnecting = false;
                    reject(error);
                };

                this.signalingWs.onclose = () => {
                    console.log('📴 Disconnected from signaling server');
                    this.handleSignalingDisconnect();
                };

            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    // Handle messages from signaling server
    private async handleSignalingMessage(data: any): Promise<void> {
        switch (data.type) {
            case 'room-joined':
                console.log(`🏠 Joined room ${data.roomId} as ${data.peerId}`);
                console.log(`👥 Existing peers:`, data.peers);

                // Connect to all existing peers
                for (const peer of data.peers) {
                    await this.connectToPeer(peer.peerId, peer.userId, true);
                }
                break;

            case 'peer-joined':
                console.log(`👋 New peer joined: ${data.userId} (${data.peerId})`);
                // Don't initiate connection - wait for them to connect to us
                break;

            case 'peer-left':
                console.log(`👋 Peer left: ${data.peerId}`);
                this.removePeer(data.peerId);
                break;

            case 'signal':
                await this.handleWebRTCSignal(data.fromPeerId, data.signal);
                break;

            case 'pong':
                // Heartbeat response
                break;
        }
    }

    // Create WebRTC connection to peer
    private async connectToPeer(peerId: string, userId: string, initiator: boolean): Promise<void> {
        if (this.peers.has(peerId)) {
            console.log(`Already connected to ${peerId}`);
            return;
        }

        console.log(`🔗 ${initiator ? 'Initiating' : 'Accepting'} connection to ${userId} (${peerId})`);

        const pc = new RTCPeerConnection(config.RTC_CONFIG);

        const peerConnection: PeerConnection = {
            peerId,
            userId,
            connection: pc,
            dataChannel: null,
            connected: false
        };

        this.peers.set(peerId, peerConnection);

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && this.signalingWs) {
                this.signalingWs.send(JSON.stringify({
                    type: 'signal',
                    targetPeerId: peerId,
                    fromPeerId: this.peerId,
                    signal: {
                        type: 'ice-candidate',
                        candidate: event.candidate
                    }
                }));
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${peerId}: ${pc.connectionState}`);

            if (pc.connectionState === 'connected') {
                peerConnection.connected = true;
                this.notifyConnectionHandlers(peerId, true);
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                peerConnection.connected = false;
                this.notifyConnectionHandlers(peerId, false);

                // Try to reconnect
                setTimeout(() => {
                    if (this.peers.has(peerId)) {
                        this.removePeer(peerId);
                        this.connectToPeer(peerId, userId, true);
                    }
                }, config.RECONNECT_DELAY);
            }
        };

        if (initiator) {
            // Create data channel
            const dataChannel = pc.createDataChannel('enchat', {
                ordered: false,
                maxRetransmits: 3
            });

            this.setupDataChannel(peerId, dataChannel);
            peerConnection.dataChannel = dataChannel;

            // Create offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Send offer via signaling server
            if (this.signalingWs) {
                this.signalingWs.send(JSON.stringify({
                    type: 'signal',
                    targetPeerId: peerId,
                    fromPeerId: this.peerId,
                    signal: {
                        type: 'offer',
                        sdp: offer
                    }
                }));
            }
        } else {
            // Wait for data channel from remote peer
            pc.ondatachannel = (event) => {
                const dataChannel = event.channel;
                this.setupDataChannel(peerId, dataChannel);
                peerConnection.dataChannel = dataChannel;
            };
        }
    }

    // Setup data channel event handlers
    private setupDataChannel(peerId: string, dataChannel: RTCDataChannel): void {
        dataChannel.onopen = () => {
            console.log(`📡 Data channel opened with ${peerId}`);
            const peer = this.peers.get(peerId);
            if (peer) {
                peer.connected = true;
                this.notifyConnectionHandlers(peerId, true);
            }
        };

        dataChannel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Check if this is a chunked message
                if (data.type === 'CHUNK') {
                    console.log(`📦 Received chunk ${data.chunkIndex + 1}/${data.totalChunks} for message ${data.messageId}`);

                    // Defensive check
                    if (!this.chunkBuffers) {
                        console.error('❌ chunkBuffers is undefined! Reinitializing...');
                        this.chunkBuffers = new Map();
                    }

                    // Initialize buffer for this message if it doesn't exist
                    if (!this.chunkBuffers.has(data.messageId)) {
                        this.chunkBuffers.set(data.messageId, {
                            chunks: new Map(),
                            totalChunks: data.totalChunks,
                            receivedCount: 0
                        });
                    }

                    const buffer = this.chunkBuffers.get(data.messageId)!;

                    // Store this chunk
                    if (!buffer.chunks.has(data.chunkIndex)) {
                        buffer.chunks.set(data.chunkIndex, data.data);
                        buffer.receivedCount++;
                    }

                    // Check if we have all chunks
                    if (buffer.receivedCount === buffer.totalChunks) {
                        console.log(`✅ All chunks received for message ${data.messageId}, reassembling...`);

                        // Reassemble the message
                        let fullMessage = '';
                        for (let i = 0; i < buffer.totalChunks; i++) {
                            fullMessage += buffer.chunks.get(i) || '';
                        }

                        // Parse and process the complete message
                        try {
                            const message = JSON.parse(fullMessage);
                            this.notifyMessageHandlers(message);
                        } catch (e) {
                            console.error('Error parsing reassembled message:', e);
                        }

                        // Clean up buffer
                        this.chunkBuffers.delete(data.messageId);
                    }
                } else {
                    // Regular non-chunked message
                    this.notifyMessageHandlers(data);
                }
            } catch (error) {
                console.error('Error processing data channel message:', error);
            }
        };

        dataChannel.onerror = (error) => {
            console.error(`Data channel error with ${peerId}:`, error);
        };

        dataChannel.onclose = () => {
            console.log(`📡 Data channel closed with ${peerId}`);
            const peer = this.peers.get(peerId);
            if (peer) {
                peer.connected = false;
                this.notifyConnectionHandlers(peerId, false);
            }
        };
    }

    // Handle WebRTC signaling messages
    private async handleWebRTCSignal(fromPeerId: string, signal: any): Promise<void> {
        let peer = this.peers.get(fromPeerId);

        if (!peer && signal.type === 'offer') {
            // New peer connecting to us
            await this.connectToPeer(fromPeerId, 'Unknown', false);
            peer = this.peers.get(fromPeerId);
        }

        if (!peer) {
            console.error(`Received signal from unknown peer: ${fromPeerId}`);
            return;
        }

        const pc = peer.connection;

        try {
            if (signal.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                if (this.signalingWs) {
                    this.signalingWs.send(JSON.stringify({
                        type: 'signal',
                        targetPeerId: fromPeerId,
                        fromPeerId: this.peerId,
                        signal: {
                            type: 'answer',
                            sdp: answer
                        }
                    }));
                }
            } else if (signal.type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            } else if (signal.type === 'ice-candidate') {
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
        } catch (error) {
            console.error('Error handling WebRTC signal:', error);
        }
    }

    /**
     * Broadcast a message to all connected peers
     */
    broadcast(message: Omit<WebRTCMessage, 'timestamp' | 'senderId'>): void {
        const fullMessage: WebRTCMessage = {
            ...message,
            timestamp: Date.now(),
            senderId: this.userId
        };

        const messageStr = JSON.stringify(fullMessage);
        const MAX_CHUNK_SIZE = 64000; // 64KB chunks for safety (WebRTC limit is ~256KB but varies)

        let sentCount = 0;

        this.peers.forEach((peer, peerId) => {
            if (peer.dataChannel && peer.dataChannel.readyState === 'open') {
                try {
                    // If message is small enough, send directly
                    if (messageStr.length <= MAX_CHUNK_SIZE) {
                        peer.dataChannel.send(messageStr);
                        sentCount++;
                    } else {
                        // Split large messages into chunks
                        console.log(`📦 Chunking large message (${Math.round(messageStr.length / 1024)}KB) for peer ${peerId}`);

                        const chunks = Math.ceil(messageStr.length / MAX_CHUNK_SIZE);
                        const messageId = Math.random().toString(36).substr(2, 12);

                        for (let i = 0; i < chunks; i++) {
                            const start = i * MAX_CHUNK_SIZE;
                            const end = Math.min(start + MAX_CHUNK_SIZE, messageStr.length);
                            const chunk = messageStr.substring(start, end);

                            const chunkMessage = {
                                type: 'CHUNK',
                                messageId,
                                chunkIndex: i,
                                totalChunks: chunks,
                                data: chunk
                            };

                            peer.dataChannel.send(JSON.stringify(chunkMessage));
                        }

                        sentCount++;
                        console.log(`✅ Sent ${chunks} chunks to peer ${peerId}`);
                    }
                } catch (error) {
                    console.error(`❌ Error sending to peer ${peerId}:`, error);
                }
            }
        });

        console.log(`📤 Broadcast message to ${sentCount}/${this.peers.size} peers`);
    }

    // Remove peer connection
    private removePeer(peerId: string): void {
        const peer = this.peers.get(peerId);
        if (peer) {
            if (peer.dataChannel) {
                peer.dataChannel.close();
            }
            peer.connection.close();
            this.peers.delete(peerId);
            this.notifyConnectionHandlers(peerId, false);
            console.log(`🗑️  Removed peer: ${peerId}`);
        }
    }

    // Handle signaling server disconnect
    private handleSignalingDisconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        // Try to reconnect after delay
        this.reconnectTimeout = setTimeout(() => {
            if (this.roomId) {
                console.log('🔄 Attempting to reconnect...');
                this.connect(this.roomId).catch(console.error);
            }
        }, config.RECONNECT_DELAY);
    }

    // Event handlers
    onMessage(handler: MessageHandler): void {
        this.messageHandlers.push(handler);
    }

    onConnection(handler: ConnectionHandler): void {
        this.connectionHandlers.push(handler);
    }

    private notifyMessageHandlers(message: WebRTCMessage): void {
        this.messageHandlers.forEach(handler => handler(message));
    }

    private notifyConnectionHandlers(peerId: string, connected: boolean): void {
        this.connectionHandlers.forEach(handler => handler(peerId, connected));
    }

    // Get connection status
    getConnectedPeers(): PeerConnection[] {
        return Array.from(this.peers.values()).filter(p => p.connected);
    }

    getPeerCount(): number {
        return this.getConnectedPeers().length;
    }

    isConnected(): boolean {
        return this.getPeerCount() > 0;
    }

    // Disconnect from all peers
    disconnect(): void {
        console.log('🔌 Disconnecting from all peers...');

        // Leave room
        if (this.signalingWs && this.signalingWs.readyState === WebSocket.OPEN) {
            this.signalingWs.send(JSON.stringify({ type: 'leave-room' }));
            this.signalingWs.close();
        }

        // Close all peer connections
        this.peers.forEach((peer, peerId) => {
            this.removePeer(peerId);
        });

        this.peers.clear();
        this.roomId = null;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }
}
