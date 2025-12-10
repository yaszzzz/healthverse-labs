# HealthVerse Labs

HealthVerse Labs is a comprehensive decentralized healthcare platform integrating blockchain technology for secure data management. This repository contains the backend, blockchain, and frontend components of the HealthVerse ecosystem.

## Project Structure

This monorepo consists of three main applications:

- **[healthverse-backend](./healthverse-backend)**: The server-side application built with Node.js, Express, and TypeScript. Handles API requests and off-chain data.
- **[healthverse-blockchain](./healthverse-blockchain)**: Contains Smart Contracts and deployment scripts using Hardhat. Manages on-chain logic and interactions.
- **[healthverse-frontend](./healthverse-frontend)**: The user interface built with Next.js 16, React 19, and Tailwind CSS v4.

## Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## Getting Started

Clone the repository:

```bash
git clone https://github.com/yaszzzz/healthverse-labs.git
cd healthverse-labs
```

### 1. Setup Backend

Navigate to the backend directory:

```bash
cd healthverse-backend
npm install
```

**Environment Variables:**
Copy the example environment file and configure your secrets:
```bash
cp .env.example .env
```
Update `.env` with your database credentials and API keys.

**Run locally:**
```bash
npm run dev
```

### 2. Setup Blockchain

Navigate to the blockchain directory:

```bash
cd ../healthverse-blockchain
npm install
```

**Environment Variables:**
Create a `.env` file with your wallet private key and RPC URLs (see `.env.example` if available).

**Compile & Test:**
```bash
npm run test
```

**Deploy:**
```bash
npm run deploy
```

### 3. Setup Frontend

Navigate to the frontend directory:

```bash
cd ../healthverse-frontend
npm install
```

**Environment Variables:**
Copy the example environment file:
```bash
cp .env.example .env.local
```
Update it with your API endpoints and contract addresses.

**Run Development Server:**
```bash
npm run dev
```
The frontend will start at `http://localhost:3001`.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## License

[MIT](LICENSE)
