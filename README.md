# Blueprint.ai — AI Application Architecture & Development Workspace

Blueprint.ai is a full-stack developer platform and AI workspace that transforms software application prompts into complete 12-section architecture blueprints, PostgreSQL migration schemas, REST API contracts, RAG codebase intelligence, automated test suites, and GitHub repository integrations.

---

## 🏗 System Architecture

The Blueprint.ai containerized deployment architecture consists of:
- **Next.js Web Application (`web`)**: Next.js 14 App Router standalone production server (Port 3000).
- **Background Queue Worker (`worker`)**: Asynchronous worker process executing repository analysis, vector embeddings, and background AI reviews.
- **Redis Cache & Queue Broker (`redis`)**: High-performance Redis container (Port 6379) backing job queues.
- **Managed External Services**:
  - **Supabase**: PostgreSQL database with Row Level Security (RLS) & pgvector embeddings.
  - **Clerk**: Authentication & Session Management.
  - **GitHub API**: Repository tree sync, commits, diffs, and pull requests.
  - **Google Gemini 1.5**: AI Blueprint & Code Intelligence synthesis.

---

## 🚀 Deployment Instructions

### 1. Local Development (Without Docker)

```bash
# 1. Navigate to client directory
cd client

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp ../.env.example .env.local

# 4. Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note**: The entire application lives in `/client` (Next.js 14 + Supabase). There is no separate Express server — all API routes are Next.js App Router route handlers inside `client/src/app/api/`.

---

### 2. Docker Development & Testing

```bash
# 1. Copy environment variables template
cp .env.example .env

# 2. Fill in API keys in .env
# (Clerk keys, Supabase URL, GitHub Token, Gemini API Key)

# 3. Build and launch containers
docker-compose up --build -d

# 4. Check container health status
docker-compose ps
```

Health check logs can be verified via:
```bash
docker-compose logs -f web
```

---

### 3. Production Deployment

To deploy Blueprint.ai to production (AWS ECS, GCP Cloud Run, DigitalOcean, or Docker Swarm):

1. **Build Production Image**:
   ```bash
   docker build -t blueprint-ai:latest -f client/Dockerfile ./client
   ```

2. **Inject Secrets via Secret Manager / Environment**:
   - `CLERK_SECRET_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GITHUB_TOKEN`
   - `GOOGLE_GENERATIVE_AI_API_KEY`
   - `REDIS_URL`

3. **Run Production Container Stack**:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

---

## 🔐 Security & Non-Destructive Advisory Rules

- **Server-Side Token Isolation**: GitHub Personal Access Tokens and Supabase Service Role keys remain strictly server-side in Node.js route handlers and are never sent to client browsers.
- **Project Ownership Isolation**: Every API endpoint enforces `requireProjectAccess(projectId)` boundaries (Clerk session check + Supabase RLS ownership verification).
- **Advisory AI Execution Rule**: AI-generated code (SQL DDL migrations, UI files, test suites) is strictly advisory and is **never executed automatically** without explicit user button actions.
