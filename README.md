# FeedMe AI
*An Autonomous Multi-Agent Meal Ordering System*

FeedMe AI is a next-generation autonomous multi-agent system that plans, verifies, and executes your daily meals across three distinct modalities: **Food Delivery**, **Instamart (Cook at Home)**, and **Dineout Reservations**. 

Powered by **Google Gemini 2.5 Flash**, **LangGraph**, and the **Model Context Protocol (MCP)**, the system completely automates your daily eating routine while keeping a human-in-the-loop for final approvals.

---

## ✨ Features

- **🧠 Multi-Agent Orchestration**: A sophisticated 2-layer agent architecture featuring a state-machine coordinator and parallel LangGraph scout nodes.
- **🔄 Parallel Modality Scouting**: Simultaneously scouts restaurant delivery menus, grocery ingredient prices, and dineout table availability to find the best options.
- **🛡️ Human-in-the-Loop (HITL)**: Agents prepare a complete cart/reservation but pause for your explicit approval before checkout.
- **📍 Location & Dietary Aware**: Automatically filters Swiggy options based on your GPS coordinates, allergies, and dietary preferences.
- **🔌 Model Context Protocol (MCP)**: Utilizes a dedicated MCP Server to expose secure, standardized mock Swiggy Tools to the LLM.
- **⚡ Real-time SSE UI**: A sleek React 19 + Tailwind v4 dashboard that streams the agents' internal thoughts and tool calls in real-time.

---

## 🏗️ System Architecture

The project is structured as a modern JavaScript/TypeScript monorepo with three independent workspaces:

### 1. `/mcp-server` (Swiggy Mock APIs)
A standalone Node.js server implementing the Model Context Protocol (MCP). It exposes 11 standard tools across 3 namespaces (`food`, `instamart`, `dineout`) mocking Swiggy's internal semantic search and checkout APIs.

### 2. `/backend` (Agent Engine)
A Next.js (App Router) + Drizzle ORM backend powered by TypeScript. 
- Houses the LangGraph agent swarm which runs concurrent scouting tasks.
- Manages the SQLite-backed state machine for the meal lifecycle (`PLANNING` → `VERIFYING` → `EXECUTING`).
- Streams real-time Server-Sent Events (SSE) to the frontend.

### 3. `/frontend` (User Dashboard)
A React 19 + Vite frontend dashboard for tracking the agents.
- Allows users to manage distinct personas with specific allergies and schedules.
- Renders rich UI cards for meal choices and order confirmations.
- Displays a real-time event stream of the LLM's tool calls and reasoning.

---

## 🚀 Getting Started

To run the full stack locally, you need three terminal windows:

### 1. Start the Swiggy MCP Server
```bash
cd mcp-server
npm install
npm run dev
# Runs on http://localhost:3001
```

### 2. Start the Agent Backend
Create a `.env` in the `backend/` folder with `GEMINI_API_KEY=your_key`.
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:3000
```

### 3. Start the Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

Navigate to `http://localhost:5173` in your browser to start your first autonomous meal planning session!
