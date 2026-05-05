# Hop Lun Input Lembur Online - v10

Versi ini menambahkan proteksi input ganda untuk data lembur pada tanggal yang sama.

## Perubahan v10

- Tombol **Simpan Laporan** diganti menjadi **Simpan Lembur**.
- **Simpan Lembur** tidak lagi menimpa data lama.
- Jika karyawan yang sama sudah pernah diinput pada tanggal yang sama, data tersebut ditolak.
- Warning/msgbox akan menampilkan nama karyawan, ID, tanggal, dan nama penginput yang sudah lebih dulu menginput.
- Jika dalam satu antrian ada sebagian data baru dan sebagian data duplikat, data baru tetap disimpan, data duplikat dilewati.
- Proses simpan memakai `insert`, bukan `upsert`, supaya data lama tidak otomatis tertimpa oleh user lain.

## Cara update

1. Replace file `app.js` lama dengan file `app.js` dari folder ini.
2. Deploy ulang ke Vercel/GitHub.
3. Buka aplikasi lalu tekan **Ctrl + F5**.

## Penting untuk keamanan duplikat realtime

Schema awal aplikasi sudah punya unique constraint untuk mencegah duplikat:

```sql
constraint lembur_tanggal_karyawan_unique unique (tanggal, karyawan_id)
```

Jika database Supabase Anda pernah dibuat manual dan belum punya constraint tersebut, jalankan file:

`supabase/ensure_unique_overtime.sql`

Jalankan di Supabase Dashboard > SQL Editor.
