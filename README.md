# 💠 CORION Ecosystem (Lackdoktor & Hub)

**The Digital Operating System for Automotive Craftsmanship.**
*Part of the Bikutoru.ai Vision.*

## 🚀 Project Overview

Corion is a comprehensive platform integrating **Service**, **Education**, and **Business Management** for the automotive repair industry. It merges physical craftsmanship with digital automation using Multi-Agent AI.

### 🌟 Key Pillars implemented:

1.  **Corion Gutachter (`/gutachter`)**
    *   Professional landing page for damage assessment (Kfz-Sachverständiger).
    *   Integrated AI Assistant for preliminary crash analysis.
    *   Lead generation directly into CRM.

2.  **Corion Academy (`/academy`)**
    *   Multimedia learning platform (Video, PDF, Audio).
    *   **AI Search:** Ask questions like "How to fix a B-Class door?" and get precise answers from the content.
    *   Digital Courses (e.g., *Mercedes B-Klasse Türerneuerung*).

3.  **Partner Portal Gamified (`/partner/dashboard`)**
    *   **XP & Levels:** Partners earn experience for completed jobs.
    *   **Financial Engine:** Automatic deduction for Onboarding (20%) and Security Deposit (5%).
    *   **Resource Calendar:** Drag-and-drop scheduling for workshops.

4.  **CORA Orchestrator**
    *   Central AI Router (`/api/ai/chat`) that directs user queries to specialized agents (Sales, Tech, HR, Finance).

---

## 🛠️ Tech Stack

- **Frontend:** React (TypeScript), Tailwind CSS, Shadcn UI, Framer Motion.
- **Backend:** Node.js (Express), Drizzle ORM (PostgreSQL).
- **AI:** OpenAI (GPT-4o), Google Gemini (Multimodal), Vector Search.
- **Auth:** Passport.js (Session based).

---

## 📂 Project Structure

```bash
client/src/
  ├── pages/
  │   ├── Gutachter.tsx       # Expert Landing Page
  │   ├── Academy.tsx         # Learning Platform
  │   └── partner/            # Partner Portal
  │       ├── GamifiedDashboard.tsx
  │       └── Onboarding.tsx
  └── components/
      └── calendar/           # Resource Scheduler

server/
  ├── ai-skills/              # Specialized AI Agents
  │   ├── orchestrator.ts     # Master Router (CORA)
  │   ├── sales.ts            # Sales Pitch Generator
  │   └── extractor.ts        # WhatsApp Event Parser
  ├── financial-engine.ts     # Payout & Debt Logic
  └── routes.ts               # API Endpoints
```

## 🚀 Getting Started (Replit / Local)

1.  **Clone & Install:**
    ```bash
    git clone https://github.com/Adrianlackdokotor/Corion-Lackdoktor.git
    cd Corion-Lackdoktor
    npm install
    ```

2.  **Environment Variables (`.env`):**
    ```env
    DATABASE_URL=postgres://...
    OPENAI_API_KEY=sk-...
    SESSION_SECRET=...
    ```

3.  **Run Development:**
    ```bash
    npm run dev
    ```

4.  **Access:**
    *   Main Site: `http://localhost:5000`
    *   Gutachter: `http://localhost:5000/gutachter`
    *   Partner: `http://localhost:5000/partner/dashboard`

---

## 🤖 AI Agents

The system uses a **Multi-Agent Architecture**:
*   **Sales Agent:** Handles client inquiries and estimations.
*   **Meister AI:** Provides technical support and training.
*   **Orchestrator (CORA):** Routes intent to the correct agent.

---

*© 2026 Corion GmbH. Built with ❤️ and AI.*
