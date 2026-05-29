-- Jalankan perintah ini di SQL Editor Supabase untuk mengaktifkan Realtime

-- Aktifkan realtime untuk tabel pesan (chat)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Aktifkan realtime untuk tabel jadwal bimbingan
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
