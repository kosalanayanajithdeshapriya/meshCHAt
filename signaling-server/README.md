# BitChat Signaling Server

WebSocket signaling server for WebRTC peer-to-peer connections.

## Quick Start

```bash
cd signaling-server
npm install
npm start
```

Server runs on port 8080 (or PORT environment variable).

## Deployment

### Free Tier Options

**Render.com** (Recommended):
1. Create account at render.com
2. New Web Service
3. Connect this repo
4. Root directory: `signaling-server`
5. Build command: `npm install`
6. Start command: `npm start`
7. Get WebSocket URL: `wss://your-app.onrender.com`

**Railway.app**:
```bash
railway login
railway init
railway up
```

**Fly.io**:
```bash
fly launch
fly deploy
```

### Self-Hosted

Any VPS with Node.js:
```bash
npm install
PORT=8080 npm start
```

## Testing Locally

```bash
# Terminal 1: Start server
npm start

# Terminal 2: Test with wscat
npm install -g wscat
wscat -c ws://localhost:8080

# Send test message
{"type":"join-room","roomId":"test","peerId":"peer1","userId":"Alice"}
```

## Environment Variables

- `PORT` - Server port (default: 8080)

## API

### Client → Server

**Join Room**:
```json
{
  "type": "join-room",
  "roomId": "MESH-ABC123",
  "peerId": "unique-peer-id",
  "userId": "Alice"
}
```

**Leave Room**:
```json
{
  "type": "leave-room"
}
```

**Signal** (WebRTC signaling):
```json
{
  "type": "signal",
  "targetPeerId": "peer-id",
  "fromPeerId": "my-peer-id",
  "signal": { "type": "offer", "sdp": "..." }
}
```

### Server → Client

**Room Joined**:
```json
{
  "type": "room-joined",
  "roomId": "MESH-ABC123",
  "peerId": "your-peer-id",
  "peers": [
    { "peerId": "peer1", "userId": "Alice" },
    { "peerId": "peer2", "userId": "Bob" }
  ]
}
```

**Peer Joined**:
```json
{
  "type": "peer-joined",
  "peerId": "new-peer-id",
  "userId": "Charlie"
}
```

**Peer Left**:
```json
{
  "type": "peer-left",
  "peerId": "peer-id"
}
```

**Signal**:
```json
{
  "type": "signal",
  "fromPeerId": "peer-id",
  "signal": { "type": "answer", "sdp": "..." }
}
```

## Security

- No message storage (privacy)
- Only relays WebRTC signaling
- Actual messages go P2P (not through server)
- Room codes can be private
- No authentication (add if needed)

## Monitoring

Server logs:
- New connections
- Room creation/deletion
- Peer join/leave
- Stats every 60 seconds
