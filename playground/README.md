# Mini ORPC Playground

This playground demonstrates the Mini ORPC library with React 19 and Vite.

## Development

The application consists of two parts:

1. **Frontend (Vite + React)** - Runs on `http://localhost:3000`
2. **API Server (Node.js)** - Runs on `http://localhost:3001`

### Running the application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start both servers simultaneously:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

### Alternative: Run servers separately

If you prefer to run the servers in separate terminals:

1. Start the API server:
   ```bash
   npm run server
   ```

2. In another terminal, start the frontend:
   ```bash
   npm run frontend
   ```

### Scripts

- `npm run dev` - Start both API server and frontend simultaneously
- `npm run server` - Start only the API server with hot reloading
- `npm run frontend` - Start only the Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run clean` - Clean build artifacts

## Architecture

- **Frontend**: React 19 with TypeScript, bundled by Vite
- **Backend**: Node.js with native TypeScript support
- **RPC**: Mini ORPC for type-safe client-server communication
- **State Management**: TanStack Query for server state