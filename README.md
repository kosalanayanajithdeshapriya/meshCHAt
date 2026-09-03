# MeshCHAT

A real-time, peer-to-peer chat application designed for direct communication between users. MeshCHAT uses WebRTC for peer connections and a signaling server to help peers discover and establish connections.

> Communicate directly between browsers with a lightweight, modern TypeScript frontend.

## Features

- Real-time peer-to-peer messaging
- WebRTC-based direct browser communication
- Signaling server for connection negotiation
- Modern responsive user interface
- TypeScript support for safer and maintainable code
- Vite-powered frontend development environment
- Environment-based configuration for development and production
- Deployment configuration included for Vercel

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | React, TypeScript |
| Build Tool | Vite |
| Styling | CSS |
| Real-Time Communication | WebRTC |
| Signaling | Node.js signaling server |
| Deployment | Vercel |
| Configuration | Environment variables |

## Project Structure

```text
meshCHAt/
├── components/              # Reusable React UI components
├── hooks/                   # Custom React hooks
├── services/                # Application and communication services
├── signaling-server/        # Server used for WebRTC signaling
├── public/                  # Static assets
├── utils/                   # Utility functions
├── App.tsx                  # Main application component
├── config.ts                # Application configuration
├── types.ts                 # TypeScript type definitions
├── index.tsx                # React application entry point
├── styles.css               # Global styles
├── .env.development         # Development environment variables
├── .env.production          # Production environment variables
├── vite.config.ts           # Vite configuration
├── vercel.json              # Vercel deployment configuration
└── DEPLOYMENT.md            # Deployment guide
```

## Prerequisites

Before running the project locally, make sure you have installed:

- [Node.js](https://nodejs.org/) — version 18 or later recommended
- npm — included with Node.js
- Git

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/kosalanayanajithdeshapriya/meshCHAt.git
cd meshCHAt
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Configure environment variables

Create or update the environment files as needed.

For local development:

```env
VITE_SIGNALING_SERVER_URL=http://localhost:3001
```

For production, set the signaling server URL to your deployed backend:

```env
VITE_SIGNALING_SERVER_URL=https://your-signaling-server-url.com
```

> Do not expose private API keys, passwords, tokens, or credentials in frontend environment variables. Variables prefixed with `VITE_` are available in the browser.

## Run Locally

### Start the frontend

```bash
npm run dev
```

The application will usually be available at:

```text
http://localhost:5173
```

### Start the signaling server

Open a second terminal window:

```bash
cd signaling-server
npm install
npm start
```

Make sure the signaling server runs on the same URL and port configured in your frontend environment file.

## Build for Production

To create an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## How It Works

MeshCHAT uses WebRTC to create a direct connection between two browser clients.

1. A user opens the application and joins or creates a chat session.
2. The browser connects to the signaling server.
3. The signaling server exchanges WebRTC offer, answer, and ICE candidate messages between peers.
4. After negotiation is complete, the browsers establish a peer-to-peer WebRTC connection.
5. Chat messages travel directly between connected peers through the WebRTC data channel.

The signaling server helps establish the connection, but it is not intended to handle the actual chat messages after a peer-to-peer connection is active.

## Deployment

The frontend includes Vercel deployment configuration through `vercel.json`.

### Deploy the frontend to Vercel

1. Push the project to GitHub.
2. Import the repository into [Vercel](https://vercel.com/).
3. Add the required production environment variables in the Vercel project settings.
4. Set `VITE_SIGNALING_SERVER_URL` to the public URL of the deployed signaling server.
5. Deploy the application.

### Deploy the signaling server

The signaling server should be deployed separately on a platform that supports persistent Node.js or WebSocket connections, such as:

- Render
- Railway
- Fly.io
- AWS EC2
- DigitalOcean
- A VPS with Node.js and Nginx

For additional deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Important WebRTC Notes

- WebRTC peer connections usually require HTTPS in production.
- Local development works with `localhost`.
- Some users behind strict NATs or firewalls may need a TURN server for reliable connectivity.
- STUN servers help peers discover their public network addresses.
- For a production-grade application, configure reliable STUN/TURN infrastructure and secure signaling communication.

## Future Improvements

- Add video and audio calling
- Add file sharing through WebRTC data channels
- Add group chat and multi-peer rooms
- Add user authentication
- Add chat history with optional encrypted storage
- Add typing indicators and read receipts
- Add end-to-end encryption enhancements
- Add TURN server support for improved connectivity
- Add automated testing and CI/CD workflows

## Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/your-feature-name
```

3. Commit your changes.

```bash
git commit -m "Add: your feature description"
```

4. Push your branch.

```bash
git push origin feature/your-feature-name
```

5. Open a Pull Request.

## License

This project is currently intended for educational and personal development purposes.

If you plan to distribute or open-source the project publicly, consider adding a license file such as the [MIT License](https://choosealicense.com/licenses/mit/).

## Author

**Kosala Deshapriya**

- GitHub: [@kosalanayanajithdeshapriya](https://github.com/kosalanayanajithdeshapriya)

---

If you find this project useful, consider giving it a star on GitHub.
