# Aplikasi Input Lembur Online Realtime - PT Hop Lun Indonesia

Paket ini adalah versi online realtime dari aplikasi input lembur. Data bisa diinput dari HP/laptop mana pun, tersimpan di Supabase, dan perubahan akan muncul otomatis di perangkat lain yang sedang membuka aplikasi.

## Isi Folder

- `index.html` - halaman utama aplikasi.
- `app.js` - kode aplikasi.
- `config.js` - konfigurasi Supabase yang perlu diisi.
- `config.example.js` - contoh konfigurasi.
- `database.xlsx` - contoh/template database karyawan yang akan auto-load jika tabel masih kosong.
- `assets/logo-hoplun.jpg` - logo aplikasi.
- `assets/favicon.png` - icon tab browser.
- `supabase/schema.sql` - script database Supabase.
- `vercel.json` - konfigurasi deploy Vercel sederhana.

## 1. Buat Database Supabase

1. Buka https://supabase.com dan buat project baru.
2. Masuk ke project > SQL Editor.
3. Buka file `supabase/schema.sql`.
4. Copy seluruh isi file tersebut ke SQL Editor.
5. Klik Run.

Script ini membuat tabel:

- `karyawan`
- `lembur`

Script juga mengaktifkan Row Level Security dan Realtime publication.

## 2. Ambil Supabase URL dan Anon Key

1. Buka Supabase Dashboard.
2. Masuk ke Project Settings > API.
3. Copy `Project URL`.
4. Copy key `anon` / `publishable`.
5. Buka file `config.js`.
6. Isi seperti ini:

```js
window.HOPLUN_CONFIG = {
  SUPABASE_URL: "https://xxxxxxxxxxxxxxxxxxxx.supabase.co",
  SUPABASE_ANON_KEY: "paste-anon-key-di-sini",
  USE_SUPABASE: true,
  APP_NAME: "Aplikasi Input Lembur",
  COMPANY_NAME: "PT Hop Lun Indonesia"
};
```

Catatan: key anon/publishable memang boleh dipakai di aplikasi browser. Keamanan data dikontrol oleh RLS policy di Supabase.

## 3. Test di Komputer

Karena browser sering membatasi file lokal, jalankan lewat local server.

Jika punya Python:

```bash
python -m http.server 8000
```

Lalu buka:

```text
http://localhost:8000
```

Jika status di header tertulis `Online Realtime`, koneksi Supabase berhasil.

## 4. Import Database Karyawan

Ada dua cara:

### Cara A - tombol Update DB

1. Buka aplikasi.
2. Klik `Update DB`.
3. Pilih file Excel database karyawan.
4. Header harus berisi: `ID`, `Nama`, `Section`, `Status`.

### Cara B - auto-load database.xlsx

Ganti file `database.xlsx` di folder ini dengan database asli Anda, lalu deploy. Jika tabel karyawan masih kosong, aplikasi akan mencoba memuat file tersebut otomatis.

## 5. Deploy ke GitHub Pages

1. Buat repository GitHub.
2. Upload semua isi folder ini ke root repository. Pastikan `index.html` ada di root, bukan di dalam folder tambahan.
3. Masuk Settings > Pages.
4. Source: Deploy from branch.
5. Branch: `main`, folder: `/root`.
6. Simpan, lalu tunggu URL GitHub Pages aktif.

## 6. Deploy ke Vercel

1. Push folder ini ke GitHub.
2. Buka Vercel > Add New Project.
3. Import repository.
4. Framework Preset pilih `Other` atau biarkan auto-detect static.
5. Build Command kosongkan.
6. Output Directory kosongkan atau isi `.`.
7. Deploy.

## 7. Migrasi Data Lama dari Cache Browser

Kalau sebelumnya data ada di aplikasi lama/localStorage:

1. Buka aplikasi lama.
2. Download Excel atau Backup Cache.
3. Buka aplikasi online ini.
4. Klik `Import Data`, pilih file Excel hasil backup/export.

Atau jika Anda membuka versi online ini di browser yang sama dan cache lama masih ada, klik `Upload Cache ke Online`.

## 8. Catatan Keamanan Penting

File `schema.sql` menggunakan policy public agar aplikasi bisa langsung dipakai tanpa login. Artinya siapa pun yang punya link aplikasi dan key public bisa membaca/menambah/mengubah/menghapus data.

Untuk pemakaian internal yang lebih aman, langkah berikutnya adalah menambahkan Supabase Auth/login dan mengubah policy dari `anon, authenticated` menjadi `authenticated` saja.

## 9. Troubleshooting

### Status tetap Offline Local

- Cek `config.js` sudah terisi.
- Cek URL Supabase dan anon key benar.
- Pastikan file `config.js` ikut terupload ke GitHub/Vercel.
- Refresh browser dengan Ctrl+F5.

### Error saat simpan data

- Pastikan `supabase/schema.sql` sudah dijalankan sampai selesai.
- Pastikan tabel `lembur` dan `karyawan` ada.
- Pastikan RLS policies sudah dibuat.

### Realtime tidak jalan

- Jalankan ulang bagian `alter publication supabase_realtime add table ...` di `schema.sql`.
- Cek Supabase Dashboard > Database > Replication/Realtimes, tabel `lembur` dan `karyawan` harus aktif.
