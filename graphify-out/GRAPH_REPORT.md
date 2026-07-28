# Graph Report - gymtracker  (2026-07-16)

## Corpus Check
- 41 files · ~83,998 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 273 nodes · 381 edges · 17 communities (12 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6ce31e26`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `useProfile()` - 19 edges
2. `useToast()` - 13 edges
3. `supabase` - 8 edges
4. `🏋️ GymTracker Pro — Elite AI Fitness System` - 8 edges
5. `Architecture` - 6 edges
6. `Installation` - 6 edges
7. `_nextId` - 5 edges
8. `scripts` - 5 edges
9. `useAuth()` - 5 edges
10. `mealsAPI` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Sidebar()` --calls--> `useProfile()`  [EXTRACTED]
  frontend/src/components/Sidebar.jsx → frontend/src/context/ProfileContext.js
- `Dashboard()` --calls--> `useProfile()`  [EXTRACTED]
  frontend/src/pages/Dashboard.jsx → frontend/src/context/ProfileContext.js
- `InBodyScan()` --calls--> `useProfile()`  [EXTRACTED]
  frontend/src/pages/InBodyScan.jsx → frontend/src/context/ProfileContext.js
- `Progress()` --calls--> `useProfile()`  [EXTRACTED]
  frontend/src/pages/Progress.jsx → frontend/src/context/ProfileContext.js
- `WeightTracker()` --calls--> `useProfile()`  [EXTRACTED]
  frontend/src/pages/WeightTracker.jsx → frontend/src/context/ProfileContext.js

## Communities (17 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (44): app, authSupabase, bodyParser, calByDate, calHistory, calMap, caloriesToday, carbsToday (+36 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (14): useToast(), InBodyScan(), METRIC_GROUPS, chartOptions, WeightTracker(), DAYS_MAP, WorkoutLog(), COMMUNITY_PLANS (+6 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (41): app, authSupabase, bodyParser, calByDate, calHistory, calMap, caloriesToday, carbsToday (+33 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (24): browserslist, development, production, dependencies, axios, chart.js, cross-env, date-fns (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (15): navItems, Sidebar(), AuthContext, AuthProvider(), useAuth(), ProfileContext, ProfileProvider(), useProfile() (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (20): dependencies, body-parser, cors, date-fns, dotenv, express, @google/generative-ai, groq-sdk (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (16): 🔌 API Endpoints, code:bash (git clone https://github.com/MohamedMamdouh808/gym-tracker.g), code:bash (cd backend), code:env (PORT=5000), code:bash (cd ../frontend), code:env (VITE_SUPABASE_URL=your_supabase_url), 🤝 Contributing, ☁️ Deployment (+8 more)

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (10): meals, _nextId, meals, weight_logs, workout_logs, workout_plans, users, weight_logs (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (7): Architecture, Backend (`backend/server.js`), Database, Deployment, Development Commands, Frontend, Monorepo Layout

### Community 9 - "Community 9"
Cohesion: 0.39
Nodes (7): Achievement(), ActivityItem(), chartDefaults, Dashboard(), EmptyChart(), StatCard(), dashboardAPI

### Community 16 - "Community 16"
Cohesion: 0.16
Nodes (16): COMMON_FOODS, MEAL_TYPES, MealTracker(), chartBase, Progress(), aiAPI, API, inbodyAPI (+8 more)

## Knowledge Gaps
- **167 isolated node(s):** `users`, `weight_logs`, `meals`, `workout_plans`, `workout_logs` (+162 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useProfile()` connect `Community 4` to `Community 16`, `Community 9`, `Community 1`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `useToast()` connect `Community 1` to `Community 16`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `users`, `weight_logs`, `meals` to the rest of the system?**
  _167 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14333333333333334 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._