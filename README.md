# NEXUS — Personal Intelligence Operating System

v7: Complete Personal Intelligence OS with AI-powered task ranking, habits tracking, memory/knowledge graph, AI agents, and analytics.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and API keys

# Generate Prisma client and push schema
pnpm db:generate
pnpm db:push

# Start development
pnpm dev
```

## Structure

```
apps/
  web/              # Next.js 14 app (the UI)
packages/
  types/            # Shared Zod schemas & TypeScript types
  ai/               # Thin AI gateway (OpenAI + Gemini providers, ranking prompt)
  database/         # Prisma client + repositories (15+ tables)
  api-client/       # Typed fetch wrappers for the web app
  ui/               # React components (Button, Input, Card, Modal, Badge, Tabs, etc.)
  auth/             # JWT + bcrypt authentication
  validation/       # Zod validation helpers
  config/           # Environment validation
  shared/           # Tiny utilities (slugify, debounce, etc.)
```

## Features by Version

### v0.1 — Core Loop (Goals + Tasks + AI Ranking)
- Create goals with priority and target dates
- Create tasks with due dates, estimates, and priority
- AI-powered task ranking using OpenAI/Gemini
- Task status management (pending/in_progress/done/skipped)
- Event logging for all task changes

### v1 — Real Authentication
- User registration with email/password
- JWT-based authentication (30-day tokens)
- Protected API routes with ownership verification
- User settings (timezone, theme, AI provider)

### v2 — Task Enhancements
- Subtasks (hierarchical task structure)
- Task comments/notes
- Task tags/labels with colors
- Drag-and-drop task reordering
- Bulk task operations

### v3 — Calendar & Daily Planner
- Monthly calendar view with task visualization
- Daily planner with time blocks
- Time block types (Task, Break, Meeting, Focus, Personal)
- Schedule tasks by dragging to calendar
- Weekly/monthly view toggle

### v4 — Habits Tracking
- Create habits with frequency (daily/weekly/monthly)
- Log habit completions with notes
- Current streak and longest streak tracking
- Completion rate statistics
- Habit history and analytics

### v5 — Memory & Knowledge Graph
- Create memories (Notes, Journals, Ideas, Bookmarks, Snippets)
- Full-text search across memories
- Knowledge graph with nodes and edges
- Connect memories to concepts, people, projects
- Visual graph exploration

### v6 — AI Agents
- Create custom AI agents (Assistant, Scheduler, Analyzer, Suggester)
- Daily briefing with priorities and suggestions
- Auto-schedule tasks using AI
- Agent run history and output tracking
- Smart suggestions based on patterns

### v7 — Analytics & Insights
- Productivity statistics dashboard
- Tasks completed over time (30-day chart)
- Tasks by priority distribution
- Goal progress tracking
- Weekly productivity reports
- AI-generated insights and suggestions

## Database (15+ tables)

| Table | Purpose |
|-------|---------|
| `users` | User accounts with auth |
| `sessions` | Active JWT sessions |
| `goals` | Active/completed/archived goals |
| `tasks` | Hierarchical tasks with scheduling |
| `task_events` | Immutable event log |
| `task_comments` | Task notes and comments |
| `tags` | User-defined labels |
| `task_tags` | Task-tag associations |
| `daily_plans` | Daily planning entries |
| `time_blocks` | Calendar time blocks |
| `habits` | Habit definitions |
| `habit_logs` | Habit completion records |
| `memories` | Notes, journals, ideas |
| `knowledge_nodes` | Graph nodes |
| `knowledge_edges` | Graph relationships |
| `agents` | AI agent configurations |
| `agent_runs` | Agent execution history |
| `insights` | AI-generated insights |
| `user_settings` | User preferences |

## API Routes (40+ endpoints)

### Authentication
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Sign in
- `GET /api/auth/me` — Current user

### Goals
- `GET /api/users/:userId/goals` — List goals
- `POST /api/users/:userId/goals` — Create goal
- `GET /api/goals/:id` — Get goal
- `PATCH /api/goals/:id` — Update goal
- `DELETE /api/goals/:id` — Delete goal

### Tasks
- `GET /api/users/:userId/tasks` — List tasks
- `POST /api/users/:userId/tasks` — Create task
- `GET /api/tasks/:id` — Get task
- `PATCH /api/tasks/:id` — Update task
- `DELETE /api/tasks/:id` — Delete task
- `PATCH /api/tasks/:id/status` — Update status
- `POST /api/users/:userId/tasks/rank` — AI ranking
- `GET /api/tasks/:id/subtasks` — List subtasks
- `POST /api/tasks/:id/subtasks` — Create subtask
- `GET /api/tasks/:id/comments` — List comments
- `POST /api/tasks/:id/comments` — Add comment
- `POST /api/tasks/:id/tags` — Add tag
- `DELETE /api/tasks/:id/tags` — Remove tag
- `POST /api/tasks/:id/reorder` — Reorder subtasks

### Tags
- `GET /api/users/:userId/tags` — List tags
- `POST /api/users/:userId/tags` — Create tag
- `DELETE /api/tags/:id` — Delete tag

### Calendar
- `GET /api/users/:userId/calendar` — Get calendar data
- `POST /api/users/:userId/plans` — Create/update plan
- `GET /api/users/:userId/timeblocks` — List time blocks
- `POST /api/users/:userId/timeblocks` — Create time block
- `PATCH /api/timeblocks/:id` — Update time block
- `DELETE /api/timeblocks/:id` — Delete time block

### Habits
- `GET /api/users/:userId/habits` — List habits
- `POST /api/users/:userId/habits` — Create habit
- `GET /api/habits/:id` — Get habit
- `PATCH /api/habits/:id` — Update habit
- `DELETE /api/habits/:id` — Delete habit
- `POST /api/habits/:id/log` — Log completion
- `GET /api/habits/:id/stats` — Get statistics

### Memory & Knowledge
- `GET /api/users/:userId/memories` — List memories
- `POST /api/users/:userId/memories` — Create memory
- `GET /api/users/:userId/memories/search` — Search
- `PATCH /api/memories/:id` — Update memory
- `DELETE /api/memories/:id` — Delete memory
- `GET /api/users/:userId/knowledge` — Get graph
- `POST /api/users/:userId/knowledge/nodes` — Add node
- `POST /api/users/:userId/knowledge/edges` — Add edge
- `DELETE /api/knowledge/nodes/:id` — Delete node
- `DELETE /api/knowledge/edges/:id` — Delete edge

### AI Agents
- `GET /api/users/:userId/agents` — List agents
- `POST /api/users/:userId/agents` — Create agent
- `PATCH /api/agents/:id` — Update agent
- `DELETE /api/agents/:id` — Delete agent
- `POST /api/agents/:id/run` — Run agent
- `GET /api/agents/:id/runs` — Run history
- `POST /api/agents/briefing` — Daily briefing
- `POST /api/agents/auto-schedule` — Auto-schedule

### Analytics
- `GET /api/users/:userId/analytics` — Productivity stats
- `GET /api/users/:userId/analytics/weekly` — Weekly report
- `GET /api/users/:userId/insights` — List insights
- `PATCH /api/insights/:id/read` — Mark as read

### Settings
- `GET /api/users/:userId/settings` — Get settings
- `PATCH /api/users/:userId/settings` — Update settings

## Scripts

```bash
pnpm dev              # Start all apps (web on :3000)
pnpm build            # Build all packages
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio
```

## Environment Variables

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="at-least-32-characters"
OPENAI_API_KEY="sk-..."      # Optional
GEMINI_API_KEY="..."          # Optional
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Auth:** JWT (jose), bcryptjs
- **AI:** OpenAI, Google Gemini
- **Validation:** Zod
- **Build:** Turborepo, pnpm workspaces
