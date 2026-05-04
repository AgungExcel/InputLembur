(() => {
  'use strict';

  const APP_VERSION = 'online-realtime-1.0.0';
  const root = document.getElementById('root');
  const modalRoot = document.getElementById('modal-root');
  const toastRoot = document.getElementById('toast-root');

  const DEFAULT_DATABASE = [
    { id: '210626', nama: 'Budi Santoso', section: 'Produksi A', status: 'Worker' },
    { id: '210627', nama: 'Siti Aminah', section: 'Quality Control', status: 'Staff' },
    { id: '210628', nama: 'Andi Pratama', section: 'Warehouse', status: 'Worker' },
    { id: '210629', nama: 'Dewi Lestari', section: 'HRD', status: 'Staff' },
    { id: '210630', nama: 'Eko Kurniawan', section: 'Maintenance', status: 'Worker' }
  ];

  const LS = {
    karyawan: 'hoplun_karyawan_online_cache_v1',
    lembur: 'hoplun_lembur_online_cache_v1',
    nama: 'hoplun_nama_penginput_v1',
    lastMode: 'hoplun_last_mode_v1',
    oldKaryawan: 'dbKaryawan_v2',
    oldLembur: 'dataLembur_temp'
  };

  const cfg = window.HOPLUN_CONFIG || {};

  const state = {
    config: cfg,
    supabase: null,
    onlineMode: false,
    onlineReady: false,
    onlineError: '',
    channelLembur: null,
    channelKaryawan: null,
    loading: true,
    syncing: false,
    karyawan: [],
    lembur: [],
    queue: [],
    selectedIds: new Set(),
    viewSelectedOnly: false,
    inputDate: todayISO(),
    isHoliday: isWeekend(todayISO()),
    namaPenginput: getLS(LS.nama, ''),
    searchDb: '',
    filterSection: 'All',
    searchReport: '',
    filterReportSection: 'All',
    batchJam: '',
    batchPinjam: '',
    batchShift: 'Pagi',
    modalDbOpen: false
  };

  const icons = {
    save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    square: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>',
    checkSquare: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
    database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'
  };

  function icon(name, cls = 'w-4 h-4') {
    return `<span class="inline-flex ${cls}">${icons[name] || ''}</span>`;
  }

  function safe(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }

  function getLS(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      try { return JSON.parse(raw); } catch { return raw; }
    } catch { return fallback; }
  }

  function setLS(key, value) {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (err) {
      console.warn('localStorage gagal:', err);
    }
  }

  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function todayISO() {
    const d = new Date();
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 10);
  }

  function isWeekend(dateStr) {
    const d = new Date(`${dateStr}T12:00:00`);
    return d.getDay() === 0 || d.getDay() === 6;
  }

  function formatDateId(dateStr) {
    try {
      return new Date(`${dateStr}T12:00:00`).toLocaleDateString('id-ID', { dateStyle: 'long' });
    } catch { return dateStr; }
  }

  function normalizeStatus(value) {
    const v = String(value || '').trim();
    if (!v) return 'Worker';
    return v.toLowerCase() === 'staff' ? 'Staff' : 'Worker';
  }

  function normalizeJam(value) {
    const str = String(value ?? '').replace(',', '.').trim();
    const num = Number(str);
    if (!Number.isFinite(num) || num <= 0) return '';
    return String(num).replace(/\.0$/, '');
  }

  function getOvertimeCode(jam, status, holiday) {
    const n = Number(String(jam || '').replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return '';
    return normalizeStatus(status) === 'Worker' && holiday ? `L${n}` : `K${n}`;
  }

  function appToDbLembur(item) {
    return {
      id: item.id && /^[0-9a-f-]{20,}$/i.test(String(item.id)) ? item.id : undefined,
      tanggal: item.tanggal || state.inputDate,
      penginput: item.penginput || '-',
      karyawan_id: String(item.karyawanId || item.karyawan_id || '').trim(),
      nama: item.nama || '',
      section: item.section || '',
      status: normalizeStatus(item.status),
      jam: Number(String(item.jam || '0').replace(',', '.')) || 0,
      kode: item.kode || getOvertimeCode(item.jam, item.status, state.isHoliday),
      pinjam: item.pinjam || '-',
      shift: item.shift || '',
      updated_at: new Date().toISOString()
    };
  }

  function dbToAppLembur(row) {
    return {
      id: row.id || uuid(),
      tanggal: row.tanggal,
      penginput: row.penginput || '-',
      karyawanId: row.karyawan_id || row.karyawanId || row.ID || row.Id || '',
      nama: row.nama || row.Nama || '',
      section: row.section || row.Section || '',
      status: normalizeStatus(row.status || row.Status),
      jam: String(row.jam ?? row.Jam ?? ''),
      kode: row.kode || row.Kode || '',
      pinjam: row.pinjam || row.Pinjam || '-',
      shift: row.shift || row.Shift || ''
    };
  }

  function dbToAppKaryawan(row) {
    return {
      id: String(row.id ?? row.ID ?? row.Id ?? '').trim(),
      nama: String(row.nama ?? row.Nama ?? row.NAMA ?? '').trim(),
      section: String(row.section ?? row.Section ?? row.SECTION ?? '').trim(),
      status: normalizeStatus(row.status ?? row.Status ?? row.STATUS)
    };
  }

  function hasSupabaseConfig() {
    const url = String(cfg.SUPABASE_URL || '').trim();
    const key = String(cfg.SUPABASE_ANON_KEY || '').trim();
    return Boolean(cfg.USE_SUPABASE !== false && url && key && !url.includes('xxxxx') && !key.includes('xxxxx'));
  }

  function migrateOldCache() {
    const oldDb = getLS(LS.oldKaryawan, null);
    const oldLembur = getLS(LS.oldLembur, null);
    if (!getLS(LS.karyawan, null) && Array.isArray(oldDb) && oldDb.length) setLS(LS.karyawan, oldDb.map(dbToAppKaryawan).filter(k => k.id && k.nama));
    if (!getLS(LS.lembur, null) && Array.isArray(oldLembur) && oldLembur.length) setLS(LS.lembur, oldLembur.map(dbToAppLembur));
  }

  function loadLocalData() {
    migrateOldCache();
    const karyawan = getLS(LS.karyawan, null);
    const lembur = getLS(LS.lembur, null);
    state.karyawan = Array.isArray(karyawan) && karyawan.length ? karyawan.map(dbToAppKaryawan).filter(k => k.id && k.nama) : DEFAULT_DATABASE;
    state.lembur = Array.isArray(lembur) ? lembur.map(dbToAppLembur).filter(x => x.tanggal === state.inputDate) : [];
  }

  function saveLocalData() {
    const allLocal = getLS(LS.lembur, []);
    const otherDates = Array.isArray(allLocal) ? allLocal.filter(x => x.tanggal !== state.inputDate) : [];
    setLS(LS.karyawan, state.karyawan);
    setLS(LS.lembur, [...state.lembur, ...otherDates]);
    setLS(LS.nama, state.namaPenginput || '');
  }

  async function init() {
    if (!window.XLSX) {
      root.innerHTML = errorScreen('Library XLSX gagal dimuat. Pastikan koneksi internet aktif.');
      return;
    }
    migrateOldCache();
    if (hasSupabaseConfig() && window.supabase) {
      try {
        state.supabase = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
          realtime: { params: { eventsPerSecond: 10 } }
        });
        state.onlineMode = true;
        state.onlineReady = true;
        setLS(LS.lastMode, 'online');
        await Promise.all([loadKaryawan(), loadLembur()]);
        if (!state.karyawan.length) await autoLoadDatabaseXlsx(true);
        setupRealtime();
      } catch (err) {
        console.error(err);
        state.onlineError = err.message || String(err);
        state.onlineMode = false;
        state.onlineReady = false;
        loadLocalData();
      }
    } else {
      state.onlineMode = false;
      state.onlineReady = false;
      loadLocalData();
      await autoLoadDatabaseXlsx(false, true);
    }
    state.loading = false;
    render();
    if (state.onlineMode) toast('success', 'Mode Online Aktif', 'Data tersimpan di Supabase dan realtime.');
    else toast('warning', 'Mode Offline/Local', 'Isi config.js agar data menjadi online realtime.');
  }

  async function loadKaryawan() {
    if (!state.onlineMode || !state.supabase) return;
    const { data, error } = await state.supabase.from('karyawan').select('*').order('nama', { ascending: true });
    if (error) throw error;
    state.karyawan = (data || []).map(dbToAppKaryawan).filter(k => k.id && k.nama);
    setLS(LS.karyawan, state.karyawan);
  }

  async function loadLembur(silent = false) {
    if (!state.onlineMode || !state.supabase) return;
    if (!silent) state.syncing = true;
    const { data, error } = await state.supabase
      .from('lembur')
      .select('*')
      .eq('tanggal', state.inputDate)
      .order('created_at', { ascending: false });
    if (!silent) state.syncing = false;
    if (error) throw error;
    state.lembur = (data || []).map(dbToAppLembur);
    const allLocal = getLS(LS.lembur, []);
    const otherDates = Array.isArray(allLocal) ? allLocal.filter(x => x.tanggal !== state.inputDate) : [];
    setLS(LS.lembur, [...state.lembur, ...otherDates]);
    render();
  }

  function setupRealtime() {
    if (!state.onlineMode || !state.supabase) return;
    if (state.channelLembur) state.supabase.removeChannel(state.channelLembur);
    if (state.channelKaryawan) state.supabase.removeChannel(state.channelKaryawan);

    state.channelLembur = state.supabase
      .channel('lembur-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lembur' }, (payload) => {
        const dateChanged = payload.new?.tanggal || payload.old?.tanggal;
        if (!dateChanged || dateChanged === state.inputDate) loadLembur(true).catch(console.error);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') toast('success', 'Realtime Tersambung', 'Perubahan data akan muncul otomatis.', 2200);
      });

    state.channelKaryawan = state.supabase
      .channel('karyawan-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'karyawan' }, () => loadKaryawan().then(render).catch(console.error))
      .subscribe();
  }

  async function changeDate(date) {
    state.inputDate = date;
    state.isHoliday = isWeekend(date);
    state.filterReportSection = 'All';
    state.searchReport = '';
    if (state.onlineMode) await loadLembur();
    else loadLocalData();
    render();
  }

  function getFilteredDb() {
    const q = state.searchDb.toLowerCase().trim();
    return state.karyawan.filter(k => {
      const matchQ = !q || k.nama.toLowerCase().includes(q) || String(k.id).toLowerCase().includes(q) || String(k.section).toLowerCase().includes(q);
      const matchS = state.filterSection === 'All' || k.section === state.filterSection;
      return matchQ && matchS;
    });
  }

  function getDisplayDb() {
    return state.viewSelectedOnly ? state.karyawan.filter(k => state.selectedIds.has(k.id)) : getFilteredDb();
  }

  function getFilteredReport() {
    const q = state.searchReport.toLowerCase().trim();
    return state.lembur.filter(i => {
      const matchQ = !q || String(i.nama).toLowerCase().includes(q) || String(i.karyawanId).toLowerCase().includes(q) || String(i.section).toLowerCase().includes(q);
      const matchS = state.filterReportSection === 'All' || i.section === state.filterReportSection;
      return i.tanggal === state.inputDate && matchQ && matchS;
    });
  }

  function getSections(source) {
    const arr = source.map(k => k.section).filter(Boolean);
    return ['All', ...Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b))];
  }

  function checkDuplicate(karyawanId) {
    const id = String(karyawanId);
    return state.lembur.some(i => String(i.karyawanId) === id && i.tanggal === state.inputDate) || state.queue.some(i => String(i.karyawanId) === id);
  }

  function addQueue() {
    if (!state.selectedIds.size) return showInfo('Pilih karyawan dulu', 'Centang minimal 1 karyawan sebelum menambahkan ke antrian.', 'warning');
    const jam = normalizeJam(state.batchJam);
    if (!jam) return showInfo('Jam belum valid', 'Isi jam lembur dengan angka lebih dari 0. Contoh: 2 atau 2.5', 'warning');

    const selected = state.karyawan.filter(k => state.selectedIds.has(k.id));
    const newItems = [];
    let skipped = 0;
    selected.forEach(k => {
      if (checkDuplicate(k.id)) {
        skipped++;
        return;
      }
      newItems.push({
        tempId: uuid(),
        tanggal: state.inputDate,
        penginput: state.namaPenginput || '-',
        karyawanId: k.id,
        nama: k.nama,
        section: k.section,
        status: normalizeStatus(k.status),
        jam,
        kode: getOvertimeCode(jam, k.status, state.isHoliday),
        pinjam: state.batchPinjam || '-',
        shift: state.isHoliday ? state.batchShift : ''
      });
    });

    if (newItems.length) {
      state.queue = [...newItems, ...state.queue];
      toast('success', 'Masuk Antrian', `${newItems.length} data ditambahkan.`);
    }
    if (skipped) toast('warning', 'Data Dilewati', `${skipped} karyawan sudah ada di laporan/antrian.`);
    state.selectedIds.clear();
    state.searchDb = '';
    state.viewSelectedOnly = false;
    render({ focus: 'searchDb' });
  }

  async function saveQueue() {
    if (!state.queue.length) return;
    if (!state.namaPenginput.trim()) return showInfo('Nama penginput kosong', 'Isi nama penginput terlebih dahulu.', 'warning');

    const rows = state.queue.map(q => ({ ...q, id: uuid(), tanggal: state.inputDate, penginput: state.namaPenginput || '-' }));
    try {
      state.syncing = true;
      render();
      if (state.onlineMode) {
        const dbRows = rows.map(appToDbLembur).map(r => { delete r.id; return r; });
        const { error } = await state.supabase.from('lembur').upsert(dbRows, { onConflict: 'tanggal,karyawan_id' });
        if (error) throw error;
        state.queue = [];
        await loadLembur(true);
      } else {
        state.lembur = [...rows, ...state.lembur];
        state.queue = [];
        saveLocalData();
      }
      toast('success', 'Tersimpan', `${rows.length} data berhasil disimpan.`);
    } catch (err) {
      console.error(err);
      showInfo('Gagal menyimpan', err.message || String(err), 'error');
    } finally {
      state.syncing = false;
      render();
    }
  }

  async function deleteLembur(id) {
    const ok = await confirmDialog('Hapus data?', 'Data lembur yang dihapus akan hilang dari laporan online.', 'Hapus', 'Batal', 'danger');
    if (!ok) return;
    try {
      if (state.onlineMode) {
        const { error } = await state.supabase.from('lembur').delete().eq('id', id);
        if (error) throw error;
        await loadLembur(true);
      } else {
        state.lembur = state.lembur.filter(x => x.id !== id);
        saveLocalData();
      }
      toast('success', 'Terhapus', 'Data berhasil dihapus.');
      render();
    } catch (err) {
      showInfo('Gagal menghapus', err.message || String(err), 'error');
    }
  }

  async function editLembur(id) {
    const item = state.lembur.find(x => x.id === id);
    if (!item) return;
    const result = await editDialog(item);
    if (!result) return;
    const updated = {
      ...item,
      jam: result.jam,
      pinjam: result.pinjam || '-',
      shift: result.holiday ? result.shift : '',
      kode: getOvertimeCode(result.jam, item.status, result.holiday)
    };
    try {
      if (state.onlineMode) {
        const { error } = await state.supabase.from('lembur').update(appToDbLembur(updated)).eq('id', id);
        if (error) throw error;
        await loadLembur(true);
      } else {
        state.lembur = state.lembur.map(x => x.id === id ? updated : x);
        saveLocalData();
      }
      toast('success', 'Diupdate', 'Data lembur berhasil diperbarui.');
      render();
    } catch (err) {
      showInfo('Gagal update', err.message || String(err), 'error');
    }
  }

  async function resetCurrentReport() {
    const ok = await confirmDialog('Reset laporan tanggal ini?', `Semua data lembur tanggal ${formatDateId(state.inputDate)} akan dihapus.`, 'Reset', 'Batal', 'danger');
    if (!ok) return;
    try {
      if (state.onlineMode) {
        const { error } = await state.supabase.from('lembur').delete().eq('tanggal', state.inputDate);
        if (error) throw error;
        await loadLembur(true);
      } else {
        state.lembur = [];
        saveLocalData();
      }
      state.queue = [];
      toast('success', 'Reset berhasil', 'Laporan tanggal ini kosong.');
      render();
    } catch (err) {
      showInfo('Gagal reset', err.message || String(err), 'error');
    }
  }

  async function clearQueue() {
    const ok = await confirmDialog('Kosongkan antrian?', 'Data yang belum disimpan ke laporan akan dihapus dari antrian.', 'Kosongkan', 'Batal', 'warning');
    if (!ok) return;
    state.queue = [];
    render();
  }

  function exportReport() {
    const data = getFilteredReport();
    if (!data.length) return showInfo('Tidak ada data', 'Tidak ada data laporan untuk diexport.', 'warning');
    const rows = data.map(r => ({
      Tanggal: r.tanggal,
      Inputter: r.penginput,
      ID: r.karyawanId,
      Nama: r.nama,
      Section: r.section,
      Status: r.status,
      Jam: Number(r.jam || 0),
      Kode: r.kode,
      Pinjam: r.pinjam,
      Shift: r.shift || ''
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Laporan');
    XLSX.writeFile(wb, `Lembur_${state.inputDate}.xlsx`);
  }

  async function exportAllBackup() {
    try {
      const wb = XLSX.utils.book_new();
      let karyawanAll = state.karyawan;
      let lemburAll = state.lembur;

      if (state.onlineMode && state.supabase) {
        const { data: dbKaryawan, error: errK } = await state.supabase.from('karyawan').select('*').order('nama', { ascending: true });
        if (errK) throw errK;
        const { data: dbLembur, error: errL } = await state.supabase.from('lembur').select('*').order('tanggal', { ascending: false });
        if (errL) throw errL;
        karyawanAll = (dbKaryawan || []).map(dbToAppKaryawan);
        lemburAll = (dbLembur || []).map(dbToAppLembur);
      } else {
        const allLocal = getLS(LS.lembur, []);
        lemburAll = Array.isArray(allLocal) ? allLocal : state.lembur;
      }

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(karyawanAll.map(k => ({ ID: k.id, Nama: k.nama, Section: k.section, Status: k.status }))), 'Karyawan');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lemburAll.map(r => ({
        Tanggal: r.tanggal,
        Inputter: r.penginput,
        ID: r.karyawanId,
        Nama: r.nama,
        Section: r.section,
        Status: r.status,
        Jam: Number(r.jam || 0),
        Kode: r.kode,
        Pinjam: r.pinjam,
        Shift: r.shift || ''
      }))), 'Lembur');
      XLSX.writeFile(wb, `Backup_Lembur_${todayISO()}.xlsx`);
    } catch (err) {
      showInfo('Backup gagal', err.message || String(err), 'error');
    }
  }

  function downloadTemplate() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['ID', 'Nama', 'Section', 'Status'],
      ['210626', 'Budi Santoso', 'Produksi A', 'Worker'],
      ['210627', 'Siti Aminah', 'Quality Control', 'Staff']
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Karyawan');
    XLSX.writeFile(wb, 'Template_Database_Karyawan.xlsx');
  }

  function parseSheet(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const wb = XLSX.read(evt.target.result, { type: 'array', cellDates: true });
          resolve(wb);
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  function sheetRows(wb, preferredNames = []) {
    let sheetName = preferredNames.find(n => wb.SheetNames.includes(n)) || wb.SheetNames[0];
    if (!sheetName) return [];
    return XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '', raw: false });
  }

  function parseKaryawanRows(rows) {
    const map = new Map();
    rows.forEach(row => {
      const k = dbToAppKaryawan(row);
      if (k.id && k.nama) map.set(k.id, k);
    });
    return Array.from(map.values());
  }

  function parseLemburRows(rows) {
    const map = new Map();
    rows.forEach(row => {
      const tanggalRaw = row.Tanggal || row.tanggal || row.Date || row.DATE || state.inputDate;
      let tanggal = String(tanggalRaw).trim();
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(tanggal)) {
        const parts = tanggal.split('/');
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        tanggal = `${y}-${m}-${d}`;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) tanggal = state.inputDate;
      const jam = normalizeJam(row.Jam || row.jam || row.Hours || row.hours);
      const id = String(row.ID || row.Id || row.id || row.karyawan_id || row.karyawanId || '').trim();
      const nama = String(row.Nama || row.nama || '').trim();
      if (!id || !nama || !jam) return;
      const status = normalizeStatus(row.Status || row.status);
      const holiday = isWeekend(tanggal) || String(row.Kode || row.kode || '').toUpperCase().startsWith('L');
      const item = {
        id: uuid(),
        tanggal,
        penginput: row.Inputter || row.Penginput || row.penginput || state.namaPenginput || '-',
        karyawanId: id,
        nama,
        section: row.Section || row.section || '',
        status,
        jam,
        kode: row.Kode || row.kode || getOvertimeCode(jam, status, holiday),
        pinjam: row.Pinjam || row.pinjam || '-',
        shift: row.Shift || row.shift || ''
      };
      map.set(`${item.tanggal}|${item.karyawanId}`, item);
    });
    return Array.from(map.values());
  }

  async function importDatabaseFile(file) {
    if (!file) return;
    try {
      const wb = await parseSheet(file);
      const rows = sheetRows(wb, ['Karyawan', 'DB', 'Database']);
      const parsed = parseKaryawanRows(rows);
      if (!parsed.length) return showInfo('Import database gagal', 'Tidak ada data karyawan valid. Header harus berisi ID, Nama, Section, Status.', 'error');
      if (state.onlineMode) {
        const { error } = await state.supabase.from('karyawan').upsert(parsed.map(k => ({ id: k.id, nama: k.nama, section: k.section, status: k.status })), { onConflict: 'id' });
        if (error) throw error;
        await loadKaryawan();
      } else {
        const map = new Map(state.karyawan.map(k => [k.id, k]));
        parsed.forEach(k => map.set(k.id, k));
        state.karyawan = Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama));
        saveLocalData();
      }
      toast('success', 'Database diimport', `${parsed.length} karyawan berhasil disimpan.`);
      render();
    } catch (err) {
      console.error(err);
      showInfo('Import database gagal', err.message || String(err), 'error');
    }
  }

  async function importLaporanFile(file) {
    if (!file) return;
    try {
      const wb = await parseSheet(file);
      const rows = sheetRows(wb, ['Laporan', 'Lembur']);
      const parsed = parseLemburRows(rows);
      if (!parsed.length) return showInfo('Import data gagal', 'Tidak ada data lembur valid. Gunakan file hasil Download Excel/Backup.', 'error');
      if (state.onlineMode) {
        const dbRows = parsed.map(appToDbLembur).map(r => { delete r.id; return r; });
        const { error } = await state.supabase.from('lembur').upsert(dbRows, { onConflict: 'tanggal,karyawan_id' });
        if (error) throw error;
        await loadLembur(true);
      } else {
        const all = getLS(LS.lembur, []);
        const map = new Map((Array.isArray(all) ? all : []).map(x => [`${x.tanggal}|${x.karyawanId}`, x]));
        parsed.forEach(x => map.set(`${x.tanggal}|${x.karyawanId}`, x));
        const merged = Array.from(map.values());
        setLS(LS.lembur, merged);
        state.lembur = merged.filter(x => x.tanggal === state.inputDate);
      }
      toast('success', 'Data diimport', `${parsed.length} data lembur berhasil disimpan.`);
      render();
    } catch (err) {
      console.error(err);
      showInfo('Import data gagal', err.message || String(err), 'error');
    }
  }

  async function autoLoadDatabaseXlsx(uploadOnline = false, silent = false) {
    try {
      if (state.karyawan.length > DEFAULT_DATABASE.length) return;
      const res = await fetch('database.xlsx', { cache: 'no-store' });
      if (!res.ok) return;
      const buf = await res.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const rows = sheetRows(wb, ['Karyawan', 'DB', 'Database']);
      const parsed = parseKaryawanRows(rows);
      if (!parsed.length) return;
      state.karyawan = parsed;
      setLS(LS.karyawan, parsed);
      if (uploadOnline && state.onlineMode) {
        const { error } = await state.supabase.from('karyawan').upsert(parsed.map(k => ({ id: k.id, nama: k.nama, section: k.section, status: k.status })), { onConflict: 'id' });
        if (error) throw error;
      }
      if (!silent) toast('success', 'Database otomatis dimuat', `${parsed.length} karyawan dari database.xlsx.`);
    } catch (err) {
      if (!silent) console.warn('Auto load database.xlsx gagal:', err);
    }
  }

  async function uploadCacheToOnline() {
    if (!state.onlineMode) return showInfo('Belum online', 'Isi config.js dan deploy ulang dahulu.', 'warning');
    const ok = await confirmDialog('Upload cache lokal ke online?', 'Data karyawan dan lembur dari cache browser akan dikirim ke Supabase. Data dengan tanggal+ID sama akan diperbarui.', 'Upload', 'Batal', 'warning');
    if (!ok) return;
    try {
      const karyawan = getLS(LS.karyawan, []);
      const lembur = getLS(LS.lembur, []);
      if (Array.isArray(karyawan) && karyawan.length) {
        const { error } = await state.supabase.from('karyawan').upsert(karyawan.map(k => ({ id: k.id, nama: k.nama, section: k.section, status: normalizeStatus(k.status) })), { onConflict: 'id' });
        if (error) throw error;
      }
      if (Array.isArray(lembur) && lembur.length) {
        const rows = lembur.map(appToDbLembur).map(r => { delete r.id; return r; });
        const { error } = await state.supabase.from('lembur').upsert(rows, { onConflict: 'tanggal,karyawan_id' });
        if (error) throw error;
      }
      await Promise.all([loadKaryawan(), loadLembur(true)]);
      toast('success', 'Cache berhasil diupload', 'Data lokal sudah masuk ke Supabase.');
      render();
    } catch (err) {
      showInfo('Upload cache gagal', err.message || String(err), 'error');
    }
  }

  function statusBadge() {
    if (state.loading) return `<span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Memuat</span>`;
    if (state.onlineMode) return `<span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">${icon('cloud', 'w-4 h-4')} Online Realtime</span>`;
    return `<span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">${icon('warning', 'w-4 h-4')} Offline Local</span>`;
  }

  function render(options = {}) {
    const activeId = options.focus || document.activeElement?.id;
    const selStart = document.activeElement?.selectionStart;
    const selEnd = document.activeElement?.selectionEnd;

    if (state.loading) {
      root.innerHTML = loadingScreen();
      return;
    }

    const filteredReport = getFilteredReport();
    const reportStats = {
      worker: filteredReport.filter(i => normalizeStatus(i.status) === 'Worker').length,
      staff: filteredReport.filter(i => normalizeStatus(i.status) === 'Staff').length,
      jam: filteredReport.reduce((acc, x) => acc + (Number(String(x.jam).replace(',', '.')) || 0), 0)
    };
    const dbStats = {
      total: state.karyawan.length,
      worker: state.karyawan.filter(i => normalizeStatus(i.status) === 'Worker').length,
      staff: state.karyawan.filter(i => normalizeStatus(i.status) === 'Staff').length
    };

    root.innerHTML = `
      <div class="min-h-screen p-3 md:p-6">
        <div class="max-w-[1500px] mx-auto space-y-5">
          <header class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div class="p-4 md:p-5 border-b border-slate-100 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div class="flex items-center gap-4">
                <img src="assets/logo-hoplun.jpg" alt="Logo" class="w-16 h-16 rounded-2xl object-contain bg-white border border-slate-200 shadow-sm" />
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-1">${statusBadge()} ${state.syncing ? '<span class="text-xs text-blue-600 font-bold">Sync...</span>' : ''}</div>
                  <h1 class="text-2xl md:text-3xl font-black text-slate-900">${safe(cfg.COMPANY_NAME || 'PT Hop Lun Indonesia')}</h1>
                  <p class="text-sm text-slate-500">Input Lembur Karyawan - ${safe(cfg.APP_NAME || 'Aplikasi Online')}</p>
                </div>
              </div>
              <div class="flex flex-col sm:flex-row gap-3 sm:items-end">
                <button id="btnUploadCache" class="${state.onlineMode ? '' : 'hidden'} px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold hover:bg-indigo-100">Upload Cache ke Online</button>
                <button id="btnResetReport" class="px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100">${icon('refresh')} Reset Laporan</button>
                <div>
                  <label class="block text-[10px] uppercase font-black text-slate-400 text-right">Penginput</label>
                  <input id="inputNama" class="w-full sm:w-56 mt-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" value="${safe(state.namaPenginput)}" placeholder="Nama Anda" />
                </div>
              </div>
            </div>
            <div class="p-4 md:p-5 flex flex-col xl:flex-row gap-4 xl:items-end xl:justify-between">
              <div class="flex flex-wrap gap-3 items-center bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <div>
                  <label class="block text-[10px] uppercase font-black text-slate-400">Tanggal</label>
                  <div class="mt-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">${icon('calendar', 'w-4 h-4 text-blue-600')}<input id="inputDate" type="date" value="${safe(state.inputDate)}" class="outline-none text-sm bg-transparent" /></div>
                </div>
                <label class="flex items-center gap-2 mt-5 select-none cursor-pointer">
                  <input id="inputHoliday" type="checkbox" ${state.isHoliday ? 'checked' : ''} class="w-4 h-4 accent-red-500" />
                  <span class="font-bold text-sm ${state.isHoliday ? 'text-red-600' : 'text-slate-600'}">Libur/Sabtu</span>
                </label>
                <div class="h-10 w-px bg-slate-200 hidden sm:block"></div>
                <div class="flex gap-4 text-xs">
                  <div><div class="font-black text-[10px] uppercase text-slate-400">Total DB</div><b>${dbStats.total}</b></div>
                  <div><div class="font-black text-[10px] uppercase text-slate-400">Worker</div><b class="text-orange-600">${dbStats.worker}</b></div>
                  <div><div class="font-black text-[10px] uppercase text-slate-400">Staff</div><b class="text-purple-600">${dbStats.staff}</b></div>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button id="btnTemplate" class="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50">Template DB</button>
                <label class="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 cursor-pointer inline-flex items-center gap-2">${icon('upload')} Update DB<input id="fileDb" type="file" accept=".xlsx,.xls,.csv" class="hidden" /></label>
                <label class="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer inline-flex items-center gap-2">${icon('upload')} Import Data<input id="fileLaporan" type="file" accept=".xlsx,.xls,.csv" class="hidden" /></label>
                <button id="btnBackup" class="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50">Backup</button>
              </div>
            </div>
          </header>

          ${!state.onlineMode ? offlineBanner() : ''}

          <main class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <section class="space-y-5">
              <button id="btnOpenDb" class="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-3xl shadow-lg p-5 flex items-center gap-4 text-left relative overflow-hidden">
                <div class="absolute -right-8 -top-8 opacity-10 w-32 h-32">${icons.search}</div>
                <div class="bg-white/20 rounded-2xl p-3">${icon('search', 'w-7 h-7')}</div>
                <div><div class="text-xs uppercase text-blue-100 font-bold">Cari Data Karyawan</div><div class="text-lg font-black">Klik untuk input lembur</div></div>
              </button>

              <div class="bg-orange-50 border border-orange-200 rounded-3xl shadow-sm p-5 flex flex-col min-h-[480px]">
                <div class="flex items-center justify-between border-b border-orange-200 pb-3 mb-3">
                  <h2 class="font-black text-orange-800 flex items-center gap-2">${icon('list')} Antrian (${state.queue.length})</h2>
                  ${state.queue.length ? '<button id="btnClearQueue" class="text-xs text-orange-700 underline font-bold">Reset Semua</button>' : ''}
                </div>
                <div class="flex-1 overflow-auto">
                  ${renderQueue()}
                </div>
                <button id="btnSaveQueue" ${state.queue.length ? '' : 'disabled'} class="mt-4 w-full rounded-2xl py-3 font-black text-sm flex items-center justify-center gap-2 ${state.queue.length ? 'bg-orange-600 hover:bg-orange-700 text-white shadow' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}">${icon('save')} SIMPAN KE LAPORAN</button>
              </div>
            </section>

            <section class="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm p-4 md:p-6 flex flex-col min-h-[720px]">
              <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4">
                <div>
                  <h2 class="font-black text-xl text-slate-800">Data Lembur Karyawan</h2>
                  <p class="text-sm text-slate-500">${formatDateId(state.inputDate)}</p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <div class="flex gap-3 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <span>Worker: <b>${reportStats.worker}</b></span><span class="w-px bg-slate-200"></span><span>Staff: <b>${reportStats.staff}</b></span><span class="w-px bg-slate-200"></span><span>Total Jam: <b>${reportStats.jam}</b></span>
                  </div>
                  <button id="btnExport" class="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 flex items-center gap-2">${icon('download')} Download Excel</button>
                </div>
              </div>
              <div class="flex flex-col md:flex-row gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-3 mb-4">
                <div class="relative flex-1"><span class="absolute left-3 top-2.5 text-slate-400">${icon('search')}</span><input id="searchReport" class="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500" placeholder="Cari nama/ID/section..." value="${safe(state.searchReport)}" /></div>
                <select id="filterReportSection" class="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-green-500">${getSections(state.lembur).map(s => `<option value="${safe(s)}" ${state.filterReportSection === s ? 'selected' : ''}>${safe(s)}</option>`).join('')}</select>
              </div>
              <div class="overflow-auto flex-1 border border-slate-200 rounded-2xl">
                ${renderReportTable(filteredReport)}
              </div>
              <div class="mt-4 flex flex-wrap justify-between gap-2 text-xs text-slate-500 font-semibold">
                <span>Menampilkan ${filteredReport.length} data</span>
                <span>Versi aplikasi: ${APP_VERSION}</span>
              </div>
            </section>
          </main>
        </div>
      </div>
      ${state.modalDbOpen ? renderDbModal() : ''}
    `;

    bindEvents();
    if (activeId) {
      const el = document.getElementById(activeId);
      if (el) {
        el.focus();
        if (typeof selStart === 'number' && typeof el.setSelectionRange === 'function') {
          try { el.setSelectionRange(selStart, selEnd); } catch {}
        }
      }
    }
  }

  function offlineBanner() {
    return `<div class="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex gap-3 items-start text-amber-800">
      <div class="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">${icon('warning', 'w-5 h-5')}</div>
      <div class="text-sm leading-6"><b>Mode offline/local aktif.</b> Data hanya tersimpan di browser ini. Agar online realtime, isi <code class="bg-amber-100 px-1 rounded">config.js</code> dengan Supabase URL dan anon key, lalu deploy ulang.</div>
    </div>`;
  }

  function renderQueue() {
    if (!state.queue.length) {
      return `<div class="h-full min-h-[310px] flex flex-col items-center justify-center text-center text-slate-400 gap-2">
        <div class="w-12 h-12">${icons.list}</div><p class="text-sm italic">Belum ada data di antrian.</p><p class="text-xs">Klik tombol biru untuk memilih karyawan.</p>
      </div>`;
    }
    return `<table class="w-full text-xs text-left"><thead class="text-orange-900 border-b border-orange-200"><tr><th class="py-2">Nama</th><th class="py-2 text-center">Jam</th><th class="py-2 text-center">Kode</th>${state.isHoliday ? '<th class="py-2 text-center">Shift</th>' : ''}<th class="py-2 text-right">#</th></tr></thead><tbody class="divide-y divide-orange-200/60">${state.queue.map(q => `<tr class="hover:bg-orange-100/60"><td class="py-2"><div class="font-bold text-slate-800">${safe(q.nama)}</div><div class="text-[10px] text-slate-500">${safe(q.section)}</div>${q.pinjam && q.pinjam !== '-' ? `<div class="text-[10px] text-orange-700 italic">P: ${safe(q.pinjam)}</div>` : ''}</td><td class="py-2 text-center font-black">${safe(q.jam)}</td><td class="py-2 text-center">${codePill(q.kode)}</td>${state.isHoliday ? `<td class="py-2 text-center"><span class="text-[10px] bg-white border border-orange-200 rounded px-1">${safe(q.shift || '-')}</span></td>` : ''}<td class="py-2 text-right"><button class="btnRemoveQueue text-slate-400 hover:text-red-600 p-1" data-id="${safe(q.tempId)}">${icon('x')}</button></td></tr>`).join('')}</tbody></table>`;
  }

  function renderReportTable(items) {
    if (!items.length) return `<div class="p-10 text-center text-slate-400 italic">Data tidak ditemukan.</div>`;
    return `<table class="w-full text-sm text-left"><thead class="bg-slate-50 text-slate-600 border-b sticky top-0 z-10"><tr><th class="p-3">Nama & ID</th><th class="p-3">Info</th><th class="p-3 text-center">Jam</th>${state.isHoliday ? '<th class="p-3 text-center bg-yellow-50 text-yellow-800">Shift</th>' : ''}<th class="p-3 text-center">Kode</th><th class="p-3">Pinjam</th><th class="p-3 text-center">User</th><th class="p-3 text-center">#</th></tr></thead><tbody class="divide-y">${items.map(i => `<tr class="hover:bg-slate-50"><td class="p-3"><div class="font-bold text-slate-800">${safe(i.nama)}</div><div class="text-xs text-slate-400 font-mono">${safe(i.karyawanId)}</div></td><td class="p-3 text-xs text-slate-500"><div class="font-semibold">${safe(i.section)}</div><div class="text-[10px] uppercase tracking-wide">${safe(i.status)}</div></td><td class="p-3 text-center font-black text-lg">${safe(i.jam)}</td>${state.isHoliday ? `<td class="p-3 text-center bg-yellow-50/40"><span class="text-[10px] uppercase font-bold text-yellow-700 border border-yellow-200 bg-white px-2 py-0.5 rounded">${safe(i.shift || '-')}</span></td>` : ''}<td class="p-3 text-center">${codePill(i.kode)}</td><td class="p-3 text-xs max-w-[140px] truncate" title="${safe(i.pinjam)}">${safe(i.pinjam)}</td><td class="p-3 text-center text-[10px] text-slate-400 italic">${safe(i.penginput)}</td><td class="p-3 text-center"><div class="flex items-center justify-center gap-1"><button class="btnEdit text-blue-600 hover:bg-blue-50 rounded-lg p-1.5" data-id="${safe(i.id)}">${icon('pencil')}</button><button class="btnDelete text-red-600 hover:bg-red-50 rounded-lg p-1.5" data-id="${safe(i.id)}">${icon('trash')}</button></div></td></tr>`).join('')}</tbody></table>`;
  }

  function renderDbModal() {
    const display = getDisplayDb();
    const sections = getSections(state.karyawan);
    return `<div class="fixed inset-0 z-50 bg-black/50 p-3 md:p-6 flex items-center justify-center fade-in">
      <div class="bg-white w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden pop-in">
        <div class="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div><h3 class="font-black text-slate-800 text-lg flex items-center gap-2">${icon('list')} Cari Karyawan</h3><p class="text-xs text-slate-500">Pilih satu atau banyak karyawan, isi jam, lalu tambahkan ke antrian.</p></div>
          <button id="btnCloseDb" class="p-2 rounded-xl hover:bg-slate-200 text-slate-500">${icon('x', 'w-6 h-6')}</button>
        </div>
        <div class="p-4 border-b border-slate-100 space-y-3">
          <div class="flex flex-col md:flex-row gap-3">
            <div class="relative flex-1"><span class="absolute left-3 top-2.5 text-slate-400">${icon('search')}</span><input id="searchDb" value="${safe(state.searchDb)}" class="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Cari Nama/ID/Section... Tekan Enter untuk pilih paling atas" /></div>
            <select id="filterSection" class="border border-slate-200 rounded-xl px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500">${sections.map(s => `<option value="${safe(s)}" ${state.filterSection === s ? 'selected' : ''}>${safe(s)}</option>`).join('')}</select>
          </div>
          <div class="flex justify-between items-center gap-2">
            <button id="btnToggleSelectedView" class="px-3 py-1.5 rounded-full border text-xs font-bold ${state.viewSelectedOnly ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}">${state.viewSelectedOnly ? 'Tampilkan Semua' : `Lihat Terpilih (${state.selectedIds.size})`}</button>
            <span class="text-xs text-slate-500">Menampilkan ${display.length} dari ${state.karyawan.length} karyawan</span>
          </div>
        </div>
        <div class="overflow-auto flex-1">
          <table class="w-full text-sm text-left"><thead class="bg-slate-100 sticky top-0 z-10"><tr><th class="p-3 w-12 text-center"><button id="btnToggleAll" class="text-slate-600">${icon('checkSquare')}</button></th><th class="p-3">ID</th><th class="p-3">Nama</th><th class="p-3">Section</th><th class="p-3">Status</th></tr></thead><tbody class="divide-y">${display.map(k => `<tr class="rowKaryawan cursor-pointer ${state.selectedIds.has(k.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}" data-id="${safe(k.id)}"><td class="p-3 text-center">${state.selectedIds.has(k.id) ? `<span class="text-blue-600">${icon('checkSquare')}</span>` : `<span class="text-slate-300">${icon('square')}</span>`}</td><td class="p-3 font-mono">${safe(k.id)}</td><td class="p-3 font-semibold">${safe(k.nama)}</td><td class="p-3">${safe(k.section)}</td><td class="p-3"><span class="px-2 py-1 rounded-lg border bg-slate-50 text-xs">${safe(k.status)}</span></td></tr>`).join('') || '<tr><td colspan="5" class="p-8 text-center text-slate-400 italic">Tidak ada data.</td></tr>'}</tbody></table>
        </div>
        <div class="p-4 border-t border-slate-100 bg-slate-50 flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
          <span class="text-xs font-black text-slate-500">${state.selectedIds.size} karyawan terpilih</span>
          <div class="flex flex-wrap items-center gap-2">
            <div class="flex items-center bg-white border border-slate-200 rounded-xl px-2 focus-within:ring-2 focus-within:ring-blue-500"><span class="text-xs font-black text-slate-400">Jam</span><input id="batchJam" value="${safe(state.batchJam)}" class="w-20 p-2 text-center font-black outline-none" inputmode="decimal" placeholder="2.5" /></div>
            ${state.isHoliday ? `<div class="flex items-center bg-white border border-slate-200 rounded-xl px-2"><span class="text-xs font-black text-slate-400">Shift</span><select id="batchShift" class="p-2 text-sm outline-none bg-white"><option ${state.batchShift === 'Pagi' ? 'selected' : ''}>Pagi</option><option ${state.batchShift === 'Siang' ? 'selected' : ''}>Siang</option><option ${state.batchShift === 'Normal' ? 'selected' : ''}>Normal</option></select></div>` : ''}
            <input id="batchPinjam" value="${safe(state.batchPinjam)}" class="w-36 p-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Pinjam..." />
            <button id="btnAddQueue" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2">${icon('plus')} Tambahkan</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function codePill(code) {
    const c = String(code || '');
    const cls = c.startsWith('L') || state.isHoliday ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200';
    return `<span class="px-2 py-1 rounded-lg border text-xs font-black ${cls}">${safe(c || '-')}</span>`;
  }

  function bindEvents() {
    byId('inputNama')?.addEventListener('input', e => { state.namaPenginput = e.target.value; setLS(LS.nama, state.namaPenginput); });
    byId('inputDate')?.addEventListener('change', e => changeDate(e.target.value));
    byId('inputHoliday')?.addEventListener('change', e => { state.isHoliday = e.target.checked; render(); });
    byId('btnOpenDb')?.addEventListener('click', () => {
      if (!state.namaPenginput.trim()) return showInfo('Isi nama penginput', 'Nama penginput wajib diisi sebelum input lembur.', 'warning', () => byId('inputNama')?.focus());
      state.modalDbOpen = true; render({ focus: 'searchDb' });
    });
    byId('btnCloseDb')?.addEventListener('click', () => { state.modalDbOpen = false; render(); });
    byId('btnTemplate')?.addEventListener('click', downloadTemplate);
    byId('btnBackup')?.addEventListener('click', exportAllBackup);
    byId('btnExport')?.addEventListener('click', exportReport);
    byId('btnSaveQueue')?.addEventListener('click', saveQueue);
    byId('btnClearQueue')?.addEventListener('click', clearQueue);
    byId('btnResetReport')?.addEventListener('click', resetCurrentReport);
    byId('btnUploadCache')?.addEventListener('click', uploadCacheToOnline);
    byId('fileDb')?.addEventListener('change', e => { importDatabaseFile(e.target.files[0]); e.target.value = ''; });
    byId('fileLaporan')?.addEventListener('change', e => { importLaporanFile(e.target.files[0]); e.target.value = ''; });
    byId('searchReport')?.addEventListener('input', e => { state.searchReport = e.target.value; render({ focus: 'searchReport' }); });
    byId('filterReportSection')?.addEventListener('change', e => { state.filterReportSection = e.target.value; render(); });

    if (state.modalDbOpen) {
      byId('searchDb')?.addEventListener('input', e => { state.searchDb = e.target.value; state.viewSelectedOnly = false; render({ focus: 'searchDb' }); });
      byId('searchDb')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const first = getDisplayDb()[0];
          if (first) state.selectedIds.add(first.id);
          state.searchDb = '';
          render({ focus: 'searchDb' });
        }
      });
      byId('filterSection')?.addEventListener('change', e => { state.filterSection = e.target.value; render(); });
      byId('btnToggleSelectedView')?.addEventListener('click', () => { state.viewSelectedOnly = !state.viewSelectedOnly; render(); });
      byId('btnToggleAll')?.addEventListener('click', () => {
        const display = getDisplayDb();
        const allSelected = display.length && display.every(k => state.selectedIds.has(k.id));
        if (allSelected) display.forEach(k => state.selectedIds.delete(k.id));
        else display.forEach(k => state.selectedIds.add(k.id));
        render();
      });
      document.querySelectorAll('.rowKaryawan').forEach(row => row.addEventListener('click', () => {
        const id = row.dataset.id;
        if (state.selectedIds.has(id)) state.selectedIds.delete(id); else state.selectedIds.add(id);
        render();
      }));
      byId('batchJam')?.addEventListener('input', e => { state.batchJam = e.target.value; });
      byId('batchJam')?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addQueue(); } });
      byId('batchPinjam')?.addEventListener('input', e => { state.batchPinjam = e.target.value; });
      byId('batchShift')?.addEventListener('change', e => { state.batchShift = e.target.value; });
      byId('btnAddQueue')?.addEventListener('click', addQueue);
    }

    document.querySelectorAll('.btnRemoveQueue').forEach(btn => btn.addEventListener('click', () => {
      state.queue = state.queue.filter(q => q.tempId !== btn.dataset.id);
      render();
    }));
    document.querySelectorAll('.btnDelete').forEach(btn => btn.addEventListener('click', () => deleteLembur(btn.dataset.id)));
    document.querySelectorAll('.btnEdit').forEach(btn => btn.addEventListener('click', () => editLembur(btn.dataset.id)));
  }

  function byId(id) { return document.getElementById(id); }

  function loadingScreen() {
    return `<div class="min-h-screen flex items-center justify-center p-6"><div class="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 max-w-lg text-center"><img src="assets/logo-hoplun.jpg" alt="Logo" class="w-20 h-20 object-contain mx-auto rounded-2xl mb-4" /><h1 class="font-black text-xl text-slate-900">Memuat Aplikasi...</h1><p class="text-sm text-slate-500 mt-2">Menyiapkan database dan sinkronisasi.</p></div></div>`;
  }

  function errorScreen(message) {
    return `<div class="min-h-screen flex items-center justify-center p-6"><div class="bg-white rounded-3xl border border-red-200 shadow-xl p-8 max-w-lg"><h1 class="font-black text-xl text-red-700">Aplikasi gagal dimuat</h1><p class="text-sm text-slate-600 mt-2">${safe(message)}</p></div></div>`;
  }

  function toast(type, title, message, timeout = 3600) {
    const cls = type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800';
    const el = document.createElement('div');
    el.className = `slide-in max-w-sm rounded-2xl border ${cls} shadow-xl p-4 flex gap-3`;
    el.innerHTML = `<div class="w-5 h-5 mt-0.5">${type === 'success' ? icons.check : icons.warning}</div><div><div class="font-black text-sm">${safe(title)}</div><div class="text-xs leading-5 mt-1">${safe(message)}</div></div>`;
    toastRoot.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; el.style.transition = '.2s'; setTimeout(() => el.remove(), 220); }, timeout);
  }

  function showInfo(title, message, type = 'warning', afterClose) {
    const cls = type === 'error' ? 'text-red-700 bg-red-50 border-red-200' : type === 'success' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200';
    modalRoot.innerHTML = `<div class="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4 fade-in"><div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden pop-in"><div class="p-6"><div class="w-14 h-14 rounded-2xl border ${cls} flex items-center justify-center mb-4">${type === 'success' ? icon('check', 'w-7 h-7') : icon('warning', 'w-7 h-7')}</div><h3 class="text-xl font-black text-slate-900">${safe(title)}</h3><p class="text-sm text-slate-600 leading-6 mt-2">${safe(message)}</p></div><div class="p-4 bg-slate-50 border-t flex justify-end"><button id="infoOk" class="px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900">OK</button></div></div></div>`;
    byId('infoOk').addEventListener('click', () => { modalRoot.innerHTML = ''; if (afterClose) afterClose(); });
  }

  function confirmDialog(title, message, confirmText = 'OK', cancelText = 'Batal', type = 'warning') {
    return new Promise(resolve => {
      const confirmCls = type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';
      modalRoot.innerHTML = `<div class="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4 fade-in"><div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden pop-in"><div class="p-6"><div class="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mb-4">${icon('warning', 'w-7 h-7')}</div><h3 class="text-xl font-black text-slate-900">${safe(title)}</h3><p class="text-sm text-slate-600 leading-6 mt-2">${safe(message)}</p></div><div class="p-4 bg-slate-50 border-t flex justify-end gap-2"><button id="confirmCancel" class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-100">${safe(cancelText)}</button><button id="confirmOk" class="px-4 py-2 rounded-xl text-white text-sm font-bold ${confirmCls}">${safe(confirmText)}</button></div></div></div>`;
      byId('confirmCancel').addEventListener('click', () => { modalRoot.innerHTML = ''; resolve(false); });
      byId('confirmOk').addEventListener('click', () => { modalRoot.innerHTML = ''; resolve(true); });
    });
  }

  function editDialog(item) {
    return new Promise(resolve => {
      const holiday = item.kode?.startsWith('L') || isWeekend(item.tanggal) || state.isHoliday;
      modalRoot.innerHTML = `<div class="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4 fade-in"><div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden pop-in"><div class="p-4 bg-slate-50 border-b flex justify-between items-center"><h3 class="font-black text-slate-800">Edit Data Lembur</h3><button id="editClose" class="p-2 rounded-xl hover:bg-slate-200">${icon('x')}</button></div><div class="p-5 space-y-4"><div class="bg-slate-50 rounded-2xl p-3 text-sm"><div class="font-black text-slate-800">${safe(item.nama)}</div><div class="text-xs text-slate-500">${safe(item.karyawanId)} - ${safe(item.section)}</div></div><div class="grid grid-cols-2 gap-3"><div><label class="text-xs font-black text-slate-400 uppercase">Jam</label><input id="editJam" value="${safe(item.jam)}" class="w-full mt-1 border rounded-xl px-3 py-2 font-black text-center outline-none focus:ring-2 focus:ring-blue-500" inputmode="decimal" /></div><div><label class="text-xs font-black text-slate-400 uppercase">Shift</label><select id="editShift" class="w-full mt-1 border rounded-xl px-3 py-2 bg-white outline-none"><option ${item.shift === 'Pagi' ? 'selected' : ''}>Pagi</option><option ${item.shift === 'Siang' ? 'selected' : ''}>Siang</option><option ${item.shift === 'Normal' ? 'selected' : ''}>Normal</option><option ${!item.shift ? 'selected' : ''} value="">-</option></select></div></div><label class="flex items-center gap-2 text-sm"><input id="editHoliday" type="checkbox" ${holiday ? 'checked' : ''} class="w-4 h-4 accent-red-500" /> Hitung sebagai libur / kode L</label><div><label class="text-xs font-black text-slate-400 uppercase">Pinjam</label><input id="editPinjam" value="${safe(item.pinjam)}" class="w-full mt-1 border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" /></div></div><div class="p-4 bg-slate-50 border-t flex justify-end gap-2"><button id="editCancel" class="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-100">Batal</button><button id="editSave" class="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">Simpan</button></div></div></div>`;
      const close = () => { modalRoot.innerHTML = ''; resolve(null); };
      byId('editClose').addEventListener('click', close);
      byId('editCancel').addEventListener('click', close);
      byId('editSave').addEventListener('click', () => {
        const jam = normalizeJam(byId('editJam').value);
        if (!jam) { toast('warning', 'Jam tidak valid', 'Jam harus angka lebih dari 0.'); byId('editJam')?.focus(); return; }
        const result = { jam, pinjam: byId('editPinjam').value, shift: byId('editShift').value, holiday: byId('editHoliday').checked };
        modalRoot.innerHTML = '';
        resolve(result);
      });
    });
  }

  init().catch(err => {
    console.error(err);
    root.innerHTML = errorScreen(err.message || String(err));
  });
})();
