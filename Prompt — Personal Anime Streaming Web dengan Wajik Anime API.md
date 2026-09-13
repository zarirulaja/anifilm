Kamu adalah senior full-stack engineer dan UI/UX engineer. Buat sebuah web application **personal anime streaming dashboard** yang hanya akan saya gunakan sendiri.

## TUJUAN UTAMA

Saya ingin memiliki website anime pribadi dengan UI modern seperti platform streaming anime, tetapi bukan sekadar mockup.

SEMUA fitur utama harus benar-benar berfungsi dan terhubung ke data anime nyata.

### SUMBER DATA WAJIB

Gunakan **Wajik Anime API** sebagai sumber data utama.

Repository/API reference:
https://github.com/wajik45/wajik-anime-api

JANGAN mengganti Wajik Anime API dengan API anime lain.

JANGAN menggunakan data dummy sebagai sumber utama.

Sebelum mengimplementasikan integrasi, pelajari struktur endpoint Wajik Anime API dari repository/documentasinya dan sesuaikan adapter dengan endpoint aktual yang tersedia.

Jika struktur endpoint Wajik berbeda dari asumsi saya, ikuti struktur API yang sebenarnya.

---

# TECH STACK

Gunakan:

- Next.js terbaru dengan App Router
- TypeScript
- Tailwind CSS
- shadcn/ui jika diperlukan
- Lucide React untuk icons
- SQLite untuk data lokal
- Prisma ORM
- Video.js atau player HTML5 modern yang mendukung HLS jika diperlukan

Gunakan arsitektur yang sederhana dan mudah dimodifikasi.

Jangan menambahkan dependency yang tidak diperlukan.

---

# ARSITEKTUR

Gunakan arsitektur:

Frontend
↓
Next.js Server/API Layer
↓
Wajik Anime API
↓
Anime source

Jangan melakukan request langsung dari browser ke Wajik API jika dapat dihindari.

Buat sebuah abstraction/service layer:

src/
├── app/
├── components/
├── lib/
│   ├── anime/
│   │   ├── wajik.ts
│   │   ├── types.ts
│   │   └── adapter.ts
│   ├── db/
│   └── utils/
└── ...

Semua komunikasi dengan Wajik API harus melalui adapter/service layer.

Tujuannya supaya jika API berubah, saya hanya perlu memperbaiki:

lib/anime/wajik.ts

dan tidak perlu mengubah seluruh frontend.

---

# KONFIGURASI API

Jangan hardcode API URL di source code.

Gunakan environment variable:

WAJIK_API_URL=

Jika Wajik API membutuhkan konfigurasi tambahan, simpan di environment variable juga.

Buat:

.env.example

yang menjelaskan konfigurasi yang diperlukan.

---

# HALAMAN UTAMA

Buat homepage modern dengan layout seperti platform streaming anime.

Struktur:

Navbar
↓
Hero section
↓
Continue Watching
↓
Ongoing Anime
↓
Latest Episodes
↓
Popular / Recommended
↓
Footer

Navbar:

- Logo/nama aplikasi
- Home
- Ongoing
- Completed
- Search
- Favorites
- Watch History

Tambahkan search button yang membuka search interface.

---

# DESIGN

Gunakan dark theme sebagai default.

Visual:

- modern
- clean
- cinematic
- immersive
- responsive
- desktop-first tetapi tetap nyaman di mobile

Gunakan:

- rounded cards
- subtle shadows
- smooth transitions
- hover effects
- skeleton loading
- glassmorphism secukupnya

Jangan membuat UI terlalu ramai.

Jangan menggunakan gradient berlebihan.

Gunakan typography yang mudah dibaca.

---

# ANIME CARD

Buat reusable component:

AnimeCard

Setiap card menampilkan:

- poster
- judul anime
- episode terbaru jika tersedia
- status
- badge subtitle Indonesia jika tersedia

Hover:

- scale sedikit
- tampilkan tombol Play
- tampilkan informasi singkat

Klik card → halaman detail anime.

---

# SEARCH

Buat halaman:

/search

User dapat mencari anime berdasarkan judul.

Contoh:

/search?q=one+piece

Search harus benar-benar melakukan request ke Wajik API.

Jangan menggunakan data lokal sebagai fallback kecuali memang diperlukan untuk error handling.

Tambahkan:

- search input
- debounce
- loading state
- pagination jika API mendukung
- empty state
- error state

---

# ANIME DETAIL

Buat route:

/anime/[id]

Halaman harus mengambil informasi dari Wajik API.

Tampilkan:

- poster
- backdrop jika tersedia
- title
- alternative titles
- synopsis
- genre
- status
- studio jika tersedia
- release information
- rating jika tersedia
- episode count jika tersedia

Tambahkan tombol:

▶ Watch Now

⭐ Add to Favorites

---

# EPISODE LIST

Di halaman anime detail tampilkan daftar episode.

Contoh:

Episodes

[001] [002] [003] [004] [005] ...

Setiap episode:

- nomor episode
- judul jika tersedia
- tanggal rilis jika tersedia
- watched indicator

Tambahkan search/filter episode jika jumlah episode sangat banyak.

Untuk anime seperti One Piece, jangan render ribuan episode sekaligus jika tidak diperlukan.

Gunakan pagination atau virtualized list jika API mendukung.

---

# VIDEO PLAYER

Buat halaman:

/watch/[animeId]/[episodeId]

Halaman harus mengambil stream dari Wajik API.

Player harus mendukung:

- play/pause
- seek
- volume
- fullscreen
- playback speed
- picture-in-picture jika browser mendukung
- subtitle
- quality selection jika source menyediakan beberapa kualitas
- keyboard shortcuts

Keyboard:

Space = play/pause
Arrow Left = rewind
Arrow Right = forward
F = fullscreen
M = mute

Jika stream berupa HLS (.m3u8), gunakan HLS-compatible playback.

Jika browser tidak mendukung HLS secara native, gunakan hls.js bila diperlukan.

---

# SUBTITLE INDONESIA

Prioritaskan subtitle Indonesia.

Jika Wajik API memberikan subtitle track:

Gunakan subtitle Indonesia sebagai default.

Player harus memiliki subtitle selector:

Subtitles
├── Indonesia
├── English
└── Off

Jika hanya tersedia subtitle Indonesia, cukup tampilkan:

🇮🇩 Indonesia

Jangan mengarang subtitle URL.

Gunakan subtitle URL yang benar-benar diberikan oleh API.

Jika subtitle tidak tersedia:

tampilkan:

"Subtitle tidak tersedia untuk episode ini."

Jangan crash.

---

# WATCH HISTORY

Gunakan SQLite + Prisma.

Buat database lokal untuk menyimpan:

- anime
- episode
- watch progress
- last watched time
- favorites

Minimal schema:

User tidak diperlukan karena aplikasi ini hanya untuk satu pengguna.

Buat model:

Anime
Episode
WatchProgress
Favorite

WatchProgress:

- animeId
- episodeId
- progressSeconds
- durationSeconds
- completed
- updatedAt

---

# CONTINUE WATCHING

Homepage harus memiliki:

Continue Watching

Ambil dari database lokal.

Card menampilkan:

- poster
- anime title
- episode
- progress bar
- persentase progress

Klik card:

langsung lanjut ke episode terakhir.

Jika progress > 90%:

anggap episode selesai dan tawarkan episode berikutnya jika tersedia.

---

# AUTO SAVE PROGRESS

Saat menonton video:

simpan progress secara berkala.

Misalnya setiap 5–10 detik.

Jangan melakukan database write setiap frame.

Gunakan debounce/throttle.

Saat user kembali membuka episode:

player harus melakukan resume dari posisi terakhir.

Contoh:

"Resume from 14:32"

---

# AUTO NEXT EPISODE

Jika episode selesai:

Tampilkan:

Episode selesai

[Replay]
[Next Episode]

Jika episode berikutnya tersedia:

Next Episode

Jika tidak ada:

"Ini adalah episode terakhir."

Jangan membuat URL episode berikutnya secara manual.

Gunakan data episode dari Wajik API.

---

# FAVORITES

Buat halaman:

/favorites

User dapat:

⭐ Add to Favorites

dan:

Remove from Favorites

Simpan favorite di SQLite.

Homepage juga dapat menampilkan:

My Favorites

---

# WATCH HISTORY

Buat:

/history

Tampilkan anime yang terakhir ditonton.

Sort berdasarkan:

updatedAt DESC

Setiap item:

- poster
- title
- episode
- progress
- last watched

Tambahkan tombol:

Remove from history

Clear history

---

# ONGOING

Buat:

/ongoing

Ambil anime ongoing dari Wajik API.

Tampilkan:

- pagination
- AnimeCard
- latest episode
- loading state
- error state

---

# COMPLETED

Buat:

/completed

Ambil anime completed dari Wajik API jika endpoint tersedia.

Jika API memiliki nama endpoint berbeda, gunakan endpoint aktual Wajik API.

---

# API ROUTES

Buat internal Next.js API routes.

Contoh struktur:

/api/anime/search
/api/anime/ongoing
/api/anime/completed
/api/anime/[id]
/api/anime/[id]/episodes
/api/anime/episode/[episodeId]

Sesuaikan implementasinya dengan endpoint aktual Wajik API.

Jangan membuat endpoint palsu.

---

# CACHING

Karena aplikasi hanya untuk penggunaan pribadi, gunakan caching sederhana untuk mengurangi request ke Wajik API.

Contoh:

Anime metadata:
cache 1–6 jam

Search:
cache singkat

Ongoing:
cache 15–60 menit

Episode list:
cache beberapa jam

Jangan melakukan scraping/API request berulang-ulang ketika user berpindah halaman.

---

# ERROR HANDLING

Jika Wajik API gagal:

Tampilkan UI:

"Anime service sedang tidak tersedia."

Jangan menampilkan stack trace kepada user.

Log error hanya di server.

Jika satu source gagal tetapi API memiliki source alternatif, gunakan source alternatif yang memang tersedia melalui Wajik API.

Jangan membuat source baru di luar Wajik API tanpa alasan.

---

# LOADING STATE

Setiap halaman harus mempunyai skeleton loading.

Jangan membuat halaman kosong ketika request sedang berjalan.

Contoh:

AnimeCardSkeleton
DetailSkeleton
EpisodeSkeleton
PlayerSkeleton

---

# RESPONSIVE

Desktop:

Navbar horizontal
Grid 6–8 anime cards tergantung ukuran layar.

Tablet:

Grid 4–5.

Mobile:

Grid 2.

Video player harus responsive.

Episode selector harus nyaman digunakan di touchscreen.

---

# LOCAL-FIRST

Karena aplikasi ini hanya untuk saya sendiri:

Jangan buat:

- authentication
- user registration
- social features
- comments
- chat
- payment
- subscription

Tidak diperlukan.

Fokus pada pengalaman menonton.

---

# PERFORMANCE

Perhatikan:

- Next.js Server Components jika sesuai
- lazy loading
- image optimization
- API caching
- debounced search
- efficient database queries
- pagination

Jangan mengambil seluruh katalog anime sekaligus.

Jangan melakukan request API berulang dari client dan server untuk data yang sama.

---

# DATA TYPES

Buat TypeScript interfaces yang jelas.

Contoh:

Anime
Episode
EpisodeSource
SubtitleTrack
AnimeSearchResult

Jangan menggunakan:

any

kecuali benar-benar tidak dapat dihindari.

Jika response Wajik API tidak konsisten antar source, normalisasi response ke internal type sebelum dikirim ke frontend.

---

# API ADAPTER

Ini sangat penting.

Buat:

lib/anime/wajik.ts

Tugas file ini:

- request ke Wajik API
- parsing response
- normalisasi data
- error handling

Frontend tidak boleh mengetahui struktur mentah response Wajik.

Contoh abstraction:

searchAnime(query)
getOngoingAnime(page)
getCompletedAnime(page)
getAnime(id)
getEpisodes(id)
getEpisode(id)

Jika nama endpoint Wajik berbeda, tetap expose function internal dengan interface seperti di atas.

---

# SECURITY

Walaupun aplikasi private:

- jangan expose API credentials
- jangan menaruh secret di client bundle
- validasi query parameter
- sanitasi input
- jangan menggunakan dangerouslySetInnerHTML kecuali benar-benar diperlukan

---

# README

Buat README.md lengkap.

Harus menjelaskan:

1. Requirements
2. Installation
3. Environment variables
4. Database setup
5. Development
6. Production build
7. Cara menjalankan Wajik API
8. Cara menghubungkan Wajik API dengan aplikasi
9. Struktur project
10. Troubleshooting

Contoh:

npm install

npx prisma generate

npx prisma migrate dev

npm run dev

---

# IMPORTANT: API VERIFICATION

Sebelum menulis integrasi Wajik:

1. Periksa repository Wajik Anime API.
2. Identifikasi endpoint yang benar-benar tersedia.
3. Identifikasi format response.
4. Identifikasi bagaimana mencari anime.
5. Identifikasi bagaimana mendapatkan detail anime.
6. Identifikasi bagaimana mendapatkan episode.
7. Identifikasi bagaimana mendapatkan streaming URL.
8. Identifikasi bagaimana mendapatkan subtitle.
9. Implementasikan adapter berdasarkan data aktual tersebut.

Jangan mengasumsikan endpoint hanya karena saya memberikan contoh.

Jika ada perbedaan antara dokumentasi dan implementation repository, prioritaskan implementation yang benar-benar berjalan.

---

# IMPORTANT: NO MOCK IMPLEMENTATION

Jangan berhenti setelah membuat:

- homepage dummy
- anime cards dummy
- fake episode data
- fake video player
- fake API response

Saya membutuhkan aplikasi yang benar-benar bekerja.

Jika ada bagian API yang belum dapat dipastikan, implementasikan abstraction yang jelas dan dokumentasikan bagian tersebut daripada membuat data palsu.

---

# UX DETAIL

Tambahkan toast notification untuk:

- Added to favorites
- Removed from favorites
- Progress saved
- Error loading anime

Tambahkan confirmation hanya untuk:

Clear history
Remove all favorites

Jangan menggunakan browser alert biasa jika bisa menggunakan UI yang lebih bagus.

---

# FINAL QUALITY CHECK

Sebelum menyelesaikan project, test minimal:

1. Homepage dapat dibuka.
2. Ongoing anime muncul dari Wajik API.
3. Search bekerja.
4. Search result dapat dibuka.
5. Anime detail bekerja.
6. Episode list muncul.
7. Episode dapat dibuka.
8. Video stream dapat dimainkan.
9. Subtitle Indonesia dapat dipilih jika tersedia.
10. Watch progress tersimpan.
11. Continue Watching bekerja.
12. Resume playback bekerja.
13. Favorite bekerja.
14. History bekerja.
15. Next episode bekerja.
16. Error state bekerja.
17. Mobile layout tidak rusak.
18. Tidak ada TypeScript error.
19. Tidak ada console error yang tidak perlu.
20. Production build berhasil.

Jalankan:

npm run build

dan perbaiki semua error sebelum menyatakan project selesai.

---

# OUTPUT YANG SAYA INGINKAN

Jangan hanya memberikan tutorial kepada saya.

Bangun project-nya secara langsung di workspace.

Buat semua file yang diperlukan.

Setelah selesai, berikan:

1. Ringkasan arsitektur.
2. File penting yang dibuat.
3. Cara menjalankan project.
4. Environment variables yang diperlukan.
5. Cara menjalankan Wajik API.
6. Masalah/keterbatasan API yang ditemukan.
7. Hasil testing.

Prioritas utama:

**FUNCTIONALITY > API INTEGRATION > VIDEO PLAYBACK > WATCH HISTORY > UI POLISH**

Dan sekali lagi:

**Wajib menggunakan Wajik Anime API sebagai sumber anime/streaming utama. Jangan menggantinya dengan API lain.**