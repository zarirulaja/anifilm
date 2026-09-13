UPDATE INSTRUKSI PROJECT:

Saya sudah menjalankan Wajik Anime API secara lokal.

BASE URL:

http://localhost:3001

Saya sudah melakukan pengecekan terhadap API dan berikut adalah endpoint AKTUAL yang tersedia untuk source Otakudesu.

JANGAN menebak endpoint lain.

Gunakan endpoint berikut:

GET /otakudesu/home
GET /otakudesu/schedule
GET /otakudesu/anime
GET /otakudesu/genre

GET /otakudesu/ongoing?page=1
GET /otakudesu/completed?page=1
GET /otakudesu/search?q={query}

GET /otakudesu/genre/{genreId}?page=1

GET /otakudesu/batch/{batchId}

GET /otakudesu/anime/{animeId}

GET /otakudesu/episode/{episodeId}

GET /otakudesu/server/{serverId}

Endpoint server mendukung GET dan POST.

---

## ENVIRONMENT

Gunakan:

WAJIK_API_URL=http://localhost:3001

Jangan hardcode URL tersebut di frontend.

Semua request harus melewati server-side/service layer.

---

# WAJIK SERVICE

Buat:

src/lib/anime/wajik.ts

Expose function:

getHome()

getSchedule()

getAllAnime()

getGenres()

getOngoing(page)

getCompleted(page)

searchAnime(query)

getAnimeById(animeId)

getEpisodeById(episodeId)

getServerById(serverId)

getAnimeByGenre(genreId, page)

getBatch(batchId)

Frontend tidak boleh langsung mengetahui endpoint mentah Wajik API.

---

# DATA FLOW

Implementasikan flow berikut:

SEARCH:

User mengetik:

One Piece

↓

GET /otakudesu/search?q=One%20Piece

↓

Tampilkan hasil pencarian

↓

User memilih anime

↓

GET /otakudesu/anime/{animeId}

↓

Tampilkan detail anime + episode list

↓

User memilih episode

↓

GET /otakudesu/episode/{episodeId}

↓

Ambil server/video information

↓

GET atau POST /otakudesu/server/{serverId}

↓

Ambil video stream

↓

Putar video menggunakan player.

---

# VERY IMPORTANT: INSPECT RESPONSE

Sebelum membuat UI final, panggil endpoint Wajik yang tersedia dan periksa response JSON aktual.

Minimal periksa:

1. /otakudesu/home
2. /otakudesu/ongoing?page=1
3. /otakudesu/search?q=one%20piece
4. /otakudesu/anime/{animeId} menggunakan ID nyata dari hasil search
5. /otakudesu/episode/{episodeId} menggunakan ID nyata
6. /otakudesu/server/{serverId} menggunakan server ID nyata

JANGAN mengasumsikan nama field response.

Misalnya jangan mengasumsikan field:

title
poster
episodes
streamUrl
subtitle

sebelum melihat response API aktual.

Buat adapter berdasarkan response aktual.

---

# NORMALIZED TYPES

Setelah memeriksa response Wajik, normalisasikan menjadi internal types:

Anime:

- id
- title
- poster
- description
- genres
- status
- type
- release
- rating
- episodes
- source

Episode:

- id
- number
- title
- animeId
- releaseDate
- servers

Video:

- serverId
- serverName
- url
- type
- quality

Subtitle:

- language
- url
- label

Field boleh berbeda jika data aktual Wajik tidak menyediakan informasi tersebut.

Gunakan null/undefined untuk data yang memang tidak tersedia.

JANGAN mengarang data.

---

# SOURCE STRATEGY

Untuk versi pertama, prioritaskan:

OTAKUDESU

Gunakan:

/otakudesu/*

sebagai source utama.

Jangan mencampur data Otakudesu, Kuramanime dan Oploverz dalam satu anime result terlebih dahulu.

Buat architecture yang nantinya memungkinkan source lain ditambahkan:

AnimeProvider
├── WajikOtakudesuProvider
├── WajikKuramanimeProvider
└── WajikOploverzProvider

Tetapi implementasi pertama fokus pada Otakudesu.

---

# VIDEO PLAYER

Setelah mendapatkan response dari:

/otakudesu/episode/{episodeId}

periksa struktur server yang diberikan.

Kemudian ambil server ID.

Request:

/otakudesu/server/{serverId}

Gunakan URL video yang benar-benar diberikan API.

Jangan membuat URL video sendiri.

Jika response menyediakan beberapa server:

tampilkan selector:

Server

Server 1
Server 2
Server 3

Jika response menyediakan quality:

Quality

360p
480p
720p
1080p

Tampilkan sesuai data aktual.

---

# SUBTITLE

Periksa response server/episode untuk melihat apakah Wajik memberikan subtitle track.

Jika tersedia:

gunakan subtitle track tersebut.

Jika format subtitle adalah:

.vtt

gunakan langsung.

Jika format berbeda, implementasikan sesuai format yang diberikan.

Jangan membuat subtitle dummy.

Jika API tidak memberikan subtitle track secara eksplisit tetapi video source sudah memiliki embedded subtitle, biarkan video player menggunakan subtitle embedded tersebut.

Jika tidak tersedia:

tampilkan "Subtitle tidak tersedia."

---

# CORS

Jangan membuat frontend memanggil:

http://localhost:3001

secara langsung jika bisa dihindari.

Gunakan:

Browser
↓
Next.js /api
↓
Wajik localhost:3001

Tujuannya menghindari masalah CORS dan menjaga architecture tetap rapi.

---

# ERROR DEBUGGING

Saat pertama kali mengintegrasikan API, tampilkan error server yang cukup informatif di terminal.

Contoh:

[Wajik API]
GET /otakudesu/search?q=one-piece
Status: 200

atau:

[Wajik API ERROR]
GET /otakudesu/episode/xxx
Status: 500

Tetapi jangan menampilkan stack trace kepada user.

---

# TEST API FIRST

Sebelum menyelesaikan UI, lakukan test terhadap API secara berurutan.

TEST 1:

GET http://localhost:3001/otakudesu/home

TEST 2:

GET http://localhost:3001/otakudesu/ongoing?page=1

TEST 3:

GET http://localhost:3001/otakudesu/search?q=one%20piece

Kemudian ambil salah satu anime ID dari response.

TEST 4:

GET http://localhost:3001/otakudesu/anime/{REAL_ANIME_ID}

Kemudian ambil salah satu episode ID.

TEST 5:

GET http://localhost:3001/otakudesu/episode/{REAL_EPISODE_ID}

Kemudian ambil server ID.

TEST 6:

GET http://localhost:3001/otakudesu/server/{REAL_SERVER_ID}

Gunakan hasil aktual tersebut untuk mengimplementasikan video player.

---

# IMPORTANT

Jika endpoint /server/{serverId} membutuhkan POST body tertentu, jangan mengasumsikan body.

Periksa implementasi Wajik API atau dokumentasinya dan gunakan format request yang benar.

Jika GET berhasil, gunakan GET.

Jika POST diperlukan, gunakan POST.

---

# ACCEPTANCE CRITERIA

Saya menganggap integrasi berhasil jika:

1. Website bisa mengambil anime dari Wajik.
2. Search One Piece menampilkan hasil nyata.
3. Klik anime membuka detail nyata.
4. Episode nyata muncul.
5. Klik episode mengambil server nyata.
6. Server nyata menghasilkan stream URL.
7. Video dapat dimainkan.
8. Subtitle digunakan jika API menyediakannya.
9. Tidak ada fake data.
10. Tidak ada endpoint Wajik yang dibuat-buat.
11. URL Wajik hanya dikonfigurasi melalui WAJIK_API_URL.
12. Frontend tidak langsung bergantung pada struktur JSON mentah Wajik.
13. npm run build berhasil.

Jika menemukan masalah pada Wajik API, jangan mengganti API.

Debug integrasinya dan jelaskan error yang ditemukan.