# NontonAnime — Personal Anime Streaming Dashboard

A modern, cinematic, private personal anime streaming web application powered by **Wajik Anime API** (Otakudesu source), Next.js App Router, TypeScript, Tailwind CSS, Lucide Icons, and SQLite + Prisma ORM.

---

## Features

- 🎬 **Real Anime Streaming Data**: Powered by Wajik Anime API (`http://localhost:3001` - Otakudesu source) with 0 fake/dummy data.
- ⚡ **Next.js App Router & Server API Proxy Layer**: Clean separation of frontend and backend proxy services preventing CORS issues.
- 📺 **Custom Video Player**:
  - Embedded streaming player support.
  - Server & Quality selection controls (360p, 480p, 720p, 1080p).
  - Indonesian Subtitle badge indicator.
  - Keyboard shortcuts (`Space`: Play/Pause, `Left`/`Right`: Seek, `F`: Fullscreen, `M`: Mute).
  - Automatic watch progress saver (every 5 seconds) to local SQLite DB.
  - "Resume Playback" notification prompt.
  - Automatic next episode completion navigation.
- 🔍 **Real-Time Anime Search**: Debounced search input syncing query params.
- ⭐ **Favorites System**: Add/remove anime to local SQLite database with instant toast notifications.
- 🕒 **Watch History & Continue Watching**: Track progress, resume where you left off, remove individual history items, or clear history with confirmation modal.
- 📱 **Cinematic Dark Theme**: Responsive glassmorphism UI with custom skeleton loaders.

---

## Requirements

- Node.js 18.x or later (Tested on Node v24)
- npm or yarn
- Wajik Anime API running locally at `http://localhost:3001`

---

## Environment Variables

Create `.env` file in the root directory:

```env
# Wajik Anime API Local Base Endpoint
WAJIK_API_URL=http://localhost:3001

# SQLite Local Database Connection String
DATABASE_URL="file:./dev.db"
```

A template file `.env.example` is also included.

---

## Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Database Setup (Prisma + SQLite)**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Running the Application (Single Terminal)**:
   You only need **1 command** in a single terminal. It will automatically start both Wajik Anime API (port 3001) and Next.js Web App (port 3000):

   - **For local PC access**:
     ```bash
     npm run dev
     ```

   - **For Mobile / Wi-Fi Network access**:
     ```bash
     npm run dev:network
     ```
     *(Open `http://<YOUR_IP>:3000` from your mobile browser).*

   - **For Instant Mobile Access Anywhere (With Cloudflare Public Link)**:
     ```bash
     npm run dev:tunnel
     ```
     *(Runs Wajik API, Next.js, and Cloudflare Tunnel simultaneously in 1 terminal window!)*


5. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

---

## API Proxy Architecture & Endpoints

All frontend requests route through Next.js API routes (`src/app/api/...`) to communicate with Wajik API:

- `GET /api/anime/home` → Proxies `GET /otakudesu/home`
- `GET /api/anime/ongoing?page=1` → Proxies `GET /otakudesu/ongoing?page=1`
- `GET /api/anime/completed?page=1` → Proxies `GET /otakudesu/completed?page=1`
- `GET /api/anime/search?q=query` → Proxies `GET /otakudesu/search?q=query`
- `GET /api/anime/[id]` → Proxies `GET /otakudesu/anime/[id]`
- `GET /api/anime/episode/[episodeId]` → Proxies `GET /otakudesu/episode/[episodeId]`
- `GET /api/anime/server/[serverId]` → Proxies `GET /otakudesu/server/[serverId]`
- `GET/POST/DELETE /api/favorites` → SQLite Prisma Favorites model
- `GET/DELETE /api/history` → SQLite Prisma WatchProgress model
- `GET/POST /api/history/progress` → Save & retrieve progress per episode

---

## Project Structure

```
nonton_anime/
├── .env                        # Local Environment Variables
├── .env.example                # Environment Variable Template
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── prisma/
│   └── schema.prisma           # SQLite Database Schema
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root Layout & Toast Provider
│   │   ├── page.tsx            # Homepage (Hero, Continue Watching, Ongoing)
│   │   ├── ongoing/page.tsx    # Ongoing Anime Page with Pagination
│   │   ├── completed/page.tsx  # Completed Anime Page
│   │   ├── search/page.tsx     # Search Page
│   │   ├── anime/[id]/page.tsx # Anime Details & Episode Selector
│   │   ├── watch/[animeId]/[episodeId]/page.tsx # Video Player Page
│   │   ├── favorites/page.tsx  # Favorites Page
│   │   ├── history/page.tsx    # Watch History Page
│   │   └── api/                # Next.js API Proxy Routes
│   ├── components/
│   │   ├── ui/Toast.tsx        # Toast Notification System
│   │   ├── Navbar.tsx          # Navigation Header
│   │   ├── Footer.tsx          # Page Footer
│   │   ├── AnimeCard.tsx       # Reusable Anime Card
│   │   ├── AnimeCardSkeleton.tsx # Shimmer Loader
│   │   ├── HeroBanner.tsx      # Homepage Hero Section
│   │   ├── ContinueWatchingCard.tsx # Watch Progress Card
│   │   ├── VideoPlayer.tsx     # Player & Keyboard Shortcut Handler
│   │   ├── ServerSelector.tsx  # Server & Quality Switcher
│   │   └── EpisodeList.tsx     # Episode Grid & Filter
│   └── lib/
│       ├── anime/
│       │   ├── types.ts        # Normalized Domain Models
│       │   ├── wajik.ts        # Fetcher for Wajik API
│       │   └── adapter.ts      # Response Normalizer
│       ├── db/prisma.ts        # Prisma Client Instance
│       └── utils/time.ts       # Formatting Utilities
└── README.md
```

---

## Troubleshooting

- **Error: "Layanan Wajik Anime API sedang tidak tersedia"**:
  Make sure Wajik API is running on port 3001 (`http://localhost:3001/otakudesu/home`).
- **Prisma Client initialization error**:
  Run `npx prisma generate && npx prisma db push` to synchronize the SQLite database.
