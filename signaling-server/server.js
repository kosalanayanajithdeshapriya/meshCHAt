const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const http = require('http');

const PORT = process.env.PORT || 8080;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            rooms: rooms.size,
            peers: peers.size,
            uptime: process.uptime()
        }));
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('BitChat Signaling Server');
    }
});

const wss = new WebSocket.Server({ server });

// Store rooms and their peers
const rooms = new Map();
const peers = new Map();

console.log(`🚀 BitChat Signaling Server`);
console.log(`   Environment: ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`   Port: ${PORT}`);

wss.on('connection', (ws, req) => {
    let currentPeerId = null;
    let currentRoomId = null;

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`📱 New connection from ${clientIp}`);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            switch (data.type) {
                case 'join-room':
                    handleJoinRoom(ws, data);
                    break;

                case 'leave-room':
                    handleLeaveRoom(currentPeerId);
                    break;

                case 'signal':
                    handleSignal(data);
                    break;

                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    break;

                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`📴 Connection closed from ${clientIp}`);
        if (currentPeerId) {
            handleLeaveRoom(currentPeerId);
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    function handleJoinRoom(ws, data) {
        const { roomId, peerId, userId } = data;

        currentPeerId = peerId;
        currentRoomId = roomId;

        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
            console.log(`🏠 Created room: ${roomId}`);
        }

        const room = rooms.get(roomId);
        room.set(peerId, { ws, userId });
        peers.set(peerId, { roomId, ws, userId });

        console.log(`✅ Peer ${peerId} (${userId}) joined room ${roomId}`);
        console.log(`   Room now has ${room.size} peer(s)`);

        const existingPeers = Array.from(room.entries())
            .filter(([id]) => id !== peerId)
            .map(([id, info]) => ({ peerId: id, userId: info.userId }));

        ws.send(JSON.stringify({
            type: 'room-joined',
            roomId,
            peerId,
            peers: existingPeers
        }));

        broadcastToRoom(roomId, {
            type: 'peer-joined',
            peerId,
            userId
        }, peerId);
    }

    function handleLeaveRoom(peerId) {
        const peerInfo = peers.get(peerId);
        if (!peerInfo) return;

        const { roomId, userId } = peerInfo;
        const room = rooms.get(roomId);

        if (room) {
            room.delete(peerId);
            console.log(`👋 Peer ${peerId} (${userId}) left room ${roomId}`);
            console.log(`   Room now has ${room.size} peer(s)`);

            broadcastToRoom(roomId, {
                type: 'peer-left',
                peerId
            });

            if (room.size === 0) {
                rooms.delete(roomId);
                console.log(`🗑️  Deleted empty room: ${roomId}`);
            }
        }

        peers.delete(peerId);
    }

    function handleSignal(data) {
        const { targetPeerId, signal, fromPeerId } = data;

        const targetPeer = peers.get(targetPeerId);
        if (targetPeer && targetPeer.ws.readyState === WebSocket.OPEN) {
            targetPeer.ws.send(JSON.stringify({
                type: 'signal',
                fromPeerId,
                signal
            }));
        } else {
            console.log(`⚠️  Target peer ${targetPeerId} not found or not connected`);
        }
    }

    function broadcastToRoom(roomId, message, excludePeerId = null) {
        const room = rooms.get(roomId);
        if (!room) return;

        const messageStr = JSON.stringify(message);
        room.forEach((peerInfo, peerId) => {
            if (peerId !== excludePeerId && peerInfo.ws.readyState === WebSocket.OPEN) {
                peerInfo.ws.send(messageStr);
            }
        });
    }
});

// Heartbeat to keep connections alive
setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        }
    });
}, 30000);

// Stats logging
setInterval(() => {
    console.log(`📊 Stats: ${rooms.size} rooms, ${peers.size} peers`);
}, IS_PRODUCTION ? 300000 : 60000); // 5 min in prod, 1 min in dev

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    wss.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

server.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
});
