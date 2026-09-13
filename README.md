# NontonStreaming — Personal Anime & Movie Hub

A modern, cinematic, private personal streaming web application supporting **Dual Mode**:
1. 🍿 **Mode Anime**: Powered by **Wajik Anime API** (Otakudesu source).
2. 🎬 **Mode Film & Series**: Powered by **TMDB Engine API** (Bahasa Indonesia metadata) & **Multi-Server HD Player Engine** (Sub Indo).

Built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **Lucide Icons**, **Prisma ORM**, and **SQLite**.

---

## ✨ Fitur Utama

- 🔄 **Dual Mode Toggle (Anime & Film/Series)**:
  - Saklar mode interaktif `[ 🍿 Anime ] [ 🎬 Film & Series ]` di Navbar.
  - Skema warna, logo, dan navigasi menyesuaikan mode aktif secara otomatis.
- 🍿 **Mode Anime (Otakudesu)**:
  - Streaming Anime Ongoing & Completed lengkap dengan daftar episode, server streaming, dan indikator Subtitle Indonesia.
- 🎬 **Mode Film & Series (TMDB + Multi-Server HD Sub Indo)**:
  - Ribuan film bioskop & serial TV populer dengan judul, sinopsis, genre, poster HD, rating, sutradara, dan daftar pemain dalam **Bahasa Indonesia**.
  - **4 Server Player HD Bebas Blokir Frame**:
    - 🍿 **Server VidLink HD**
    - 🎬 **Server AutoEmbed HD**
    - 📺 **Server 2Embed HD**
    - ⚡ **Server VidSrc HD**
- 📺 **Custom Video Player & Watch Progress**:
  - Pemutar video interaktif dengan dukungan *Keyboard Shortcuts* (`Space`: Play/Pause, `F`: Fullscreen, `M`: Mute, `Arrow`: Seek).
  - Menyimpan posisi waktu tontonan secara otomatis ke SQLite lokal.
  - Prompt *"Resume Playback"* saat melanjutkan tayangan dari posisi terakhir.
- 🔍 **Pencarian Dinamis**: Pencarian anime atau film/series sesuai mode aktif.
- ⭐ **Favorit & Riwayat Tontonan**: Tersimpan di database SQLite lokal (`dev.db`) dan terfilter otomatis berdasarkan mode aktif.
- ⚡ **1 Perintah Untuk Semua Layanan (`npm run dev:tunnel`)**:
  - Menjalankan Wajik Anime API (port 3001), LK21/Movie Service (port 3002), Next.js Frontend (port 3000), dan Cloudflare Public HTTPS Tunnel sekaligus.

---

## 🛠️ Prasyarat & Instalasi

### 1. Prasyarat
- Node.js v18 atau lebih baru (Disarankan Node v20/v24).
- npm atau yarn.

### 2. File `.env`
Buat file `.env` di folder root:

```env
# Wajik Anime API Endpoint
WAJIK_API_URL=http://localhost:3001

# Movie API Endpoint (Port 3002)
LK21_API_URL=http://localhost:3002

# SQLite Database Connection
DATABASE_URL="file:./dev.db"

# TMDB API Key (Optional Override)
TMDB_API_KEY=4e44d9029b1270a757cddc766a1bcb63
```

### 3. Instalasi Dependencies & Database Setup
```bash
npm install
npx prisma db push
npx prisma generate
```

---

## 🚀 Cara Menjalankan Aplikasi

Cukup **1 perintah di 1 terminal**:

```bash
npm run dev:tunnel
```

Perintah ini akan menjalankan 4 layanan sekaligus:
1. **Wajik Anime API**: `http://localhost:3001`
2. **LK21/Movie API**: `http://localhost:3002`
3. **Next.js Web Frontend**: `http://localhost:3000`
4. **Cloudflare Tunnel**: Link publik HTTPS (untuk diakses langsung dari HP).

---

## 📁 Struktur Projek

```
nonton_anime/
├── .env                        # Local Environment Variables
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── prisma/
│   └── schema.prisma           # Database Schema (WatchProgress & Favorite)
├── wajik-anime-api/            # Server Backend Wajik Anime API (Port 3001)
├── lk21-api/                   # Server Backend LK21 Movie API (Port 3002)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root Layout, MediaMode Context, & Toast Provider
│   │   ├── page.tsx            # Dynamic Homepage (Anime vs Movie)
│   │   ├── ongoing/page.tsx    # Halaman Ongoing Anime
│   │   ├── completed/page.tsx  # Halaman Completed Anime
│   │   ├── movies/page.tsx     # Halaman Popular Film (TMDB / LK21)
│   │   ├── series/page.tsx     # Halaman Popular Series (TMDB / NontonDrama)
│   │   ├── movie/[id]/page.tsx # Halaman Detail Film & Pemutar Video Stream
│   │   ├── anime/[id]/page.tsx # Halaman Detail Anime
│   │   ├── watch/[animeId]/[episodeId]/page.tsx # Pemutar Video Anime
│   │   ├── search/page.tsx     # Pencarian Dinamis Mode
│   │   ├── favorites/page.tsx  # Halaman Favorit
│   │   ├── history/page.tsx    # Halaman Riwayat Tontonan
│   │   └── api/                # Next.js API Proxy Routes (/api/anime/* & /api/movie/*)
│   ├── components/
│   │   ├── ModeSwitcher.tsx    # Tombol Saklar Mode UI
│   │   ├── Navbar.tsx          # Navigation Header
│   │   ├── MovieCard.tsx       # Card Film dengan Rating & Quality Badge
│   │   ├── AnimeCard.tsx       # Card Anime
│   │   └── VideoPlayer.tsx     # Custom Pemutar Video & Keyboard Handler
│   └── lib/
│       ├── anime/              # Service Layer Wajik Anime API
│       └── movie/              # Service Layer TMDB & LK21 API
└── README.md
```

---

## 📝 Lisensi

Projek pribadi untuk tujuan pembelajaran dan hiburan.
