# PawGuard

### *No animal should wait in silence for help.*

PawGuard is an AI-powered stray animal rescue coordination system that enables citizens to report injured or distressed animals in seconds and automatically connects them to nearby NGOs using an autonomous multi-agent AI system.

---

## Problem Statement

In India, stray animals often suffer due to delayed or uncoordinated rescue efforts:

- People don’t know whom to contact when they see an injured animal
- NGOs operate in isolation without centralized coordination
- Many cases go unreported or duplicated
- Delays in response reduce survival chances of animals

There is no fast, unified system that converts a report into immediate rescue action.

---

##  Solution

PawGuard allows users to:

- Upload a photo of an injured animal
- Share location and description
- Instantly trigger an AI-powered rescue pipeline

The system then:
- Analyzes the animal’s condition using AI
- Detects urgency and duplicates
- Finds the most suitable nearby NGO
- Notifies them with full case details
- Displays the case on a live map

---

## Key Features

### Instant Reporting
Report injured animals using image + GPS in seconds.

### AI Triage System
Analyzes injury severity and urgency using vision AI.

### Duplicate Detection
Prevents repeated reporting of the same animal.

### Automated NGO Routing
Finds and notifies the nearest suitable NGO.

### Live Map Tracking
Displays all reported cases in real time.

### SOS Mode
Guides users in dog bite emergency situations with actionable steps.

---

## Agentic AI System

PawGuard uses a multi-agent architecture where each AI agent has a specific role:

### Triage Agent
- Uses Gemini Vision
- Detects injury, urgency, and condition

### Deduplication Agent
- Checks if report already exists nearby
- Prevents duplicate rescue requests

### Rescue Coordinator Agent
- Finds and selects NGOs using DB + web search
- Sends rescue request via email

### Follow-up Agent
- Ensures rescue completion
- Escalates if no response is received

Each agent reasons, uses tools, and passes outputs to the next — enabling autonomous decision-making.

---

## Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- React Leaflet (Maps)

### Backend
- FastAPI (Python)
- Supabase (Database + Storage)

### AI / Agents
- CrewAI (Multi-agent orchestration)
- Groq (LLM reasoning)
- Gemini 1.5 Flash (Vision AI)
- Tavily (Web Search)

### Infrastructure
- Supabase
- Resend (Email notifications)
- Vercel (Frontend hosting)

---

## System Workflow

1. User reports injured animal with image + location  
2. Backend stores report in database  
3. AI Triage Agent analyzes condition  
4. Deduplication Agent checks for existing reports  
5. Rescue Agent finds and contacts nearest NGO  
6. Case is shown on live map  
7. Follow-up Agent ensures response and escalation if needed  

---

## Environment Variables

```env
GROQ_API_KEY=
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_KEY=
RESEND_API_KEY=
TAVILY_API_KEY=
```

---

## ❤️ Vision

We believe no living being should suffer simply because help didn’t arrive in time.

PawGuard turns compassion into action.
