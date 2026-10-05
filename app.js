/* app.js — logika bersama semua halaman LumaWave.
   Pemutar ini simulasi (belum ada file audio); status disimpan agar tidak reset saat pindah halaman. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var GRAD = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23ec4fc8'/><stop offset='1' stop-color='%238f5cff'/></linearGradient></defs><rect width='400' height='400' fill='url(%23g)'/></svg>";
  var PX = 'https://images.pexels.com/photos/';
  var Q = '?auto=compress&cs=tinysrgb&w=400';
  var SONGS = [
    { t: 'Midnight Echoes', a: 'Nara Vale', d: 228, img: PX + '3075993/pexels-photo-3075993.jpeg' + Q },
    { t: 'Neon Drift', a: 'Nara Vale', d: 228, img: GRAD },
    { t: 'Velvet Signals', a: 'Eka Rumi', d: 245, img: PX + '1629236/pexels-photo-1629236.jpeg' + Q },
    { t: 'Orbiting You', a: 'Aira Sol', d: 211, img: PX + '956981/milky-way-starry-sky-night-sky-star-956981.jpeg' + Q },
    { t: 'Prism Hours', a: 'Mika Aster', d: 262, img: PX + '1191710/pexels-photo-1191710.jpeg' + Q }
  ];

  var S = { cur: 1, t: 0, vol: 72, muted: false, likes: [], playing: false };
  try { Object.assign(S, JSON.parse(localStorage.getItem('lumawave') || '{}')); } catch (e) {}
  if (!SONGS[S.cur]) S.cur = 1;
  function save() { try { localStorage.setItem('lumawave', JSON.stringify(S)); } catch (e) {} }

  var timer, noticeTimer;
  var el = { song: $('playerSong'), artist: $('playerArtist'), art: $('playerArtwork'), fill: $('progressFill'),
    elapsed: $('elapsed'), total: $('total'), track: $('progressTrack'), vol: $('volume'), notice: $('notice') };

  function fmt(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function notify(msg) {
    el.notice.textContent = msg; el.notice.classList.add('show');
    clearTimeout(noticeTimer); noticeTimer = setTimeout(function () { el.notice.classList.remove('show'); }, 2400);
  }
  function icon(btn, name, cls) { btn.innerHTML = '<i data-lucide="' + name + '" class="' + cls + '"></i>'; lucide.createIcons(); }

  function updateBar() {
    var d = SONGS[S.cur].d, p = Math.min(100, S.t / d * 100);
    el.fill.style.width = p + '%';
    el.track.setAttribute('aria-valuenow', Math.round(p));
    el.elapsed.textContent = fmt(S.t);
  }

  function render() {
    var s = SONGS[S.cur], liked = S.likes.indexOf(S.cur) > -1;
    el.song.textContent = s.t; el.artist.textContent = s.a; el.art.src = s.img; el.art.alt = 'Sampul ' + s.t;
    el.total.textContent = fmt(s.d); updateBar();
    $$('.album-card').forEach(function (c) { c.classList.toggle('active', c.dataset.song === s.t); });
    $$('.heart-icon').forEach(function (i) { i.classList.toggle('fill-current', liked); i.classList.toggle('text-fuchsia-300', liked); });
    ['heroLike', 'playerLike'].forEach(function (id) { if ($(id)) $(id).setAttribute('aria-pressed', liked); });
    $$('.play-icon').forEach(function (i) { i.classList.toggle('hidden', S.playing); });
    $$('.pause-icon').forEach(function (i) { i.classList.toggle('hidden', !S.playing); });
    var label = S.playing ? 'Jeda musik' : 'Putar musik';
    if ($('heroPlay')) $('heroPlay').setAttribute('aria-label', label);
    $('mainPlay').setAttribute('aria-label', label);
    if ($('visualizer')) $('visualizer').classList.toggle('is-playing', S.playing);
    document.body.classList.toggle('is-playing', S.playing);
    if (!$('queue').hidden) renderQueue();
  }

  function tick() {
    S.t += 1;
    if (S.t >= SONGS[S.cur].d) return next();
    updateBar(); save();
  }
  function setPlaying(on) {
    S.playing = on; clearInterval(timer);
    if (on) timer = setInterval(tick, 1000);
    render(); save();
  }
  function playSong(i, announce) {
    S.cur = (i + SONGS.length) % SONGS.length; S.t = 0;
    setPlaying(true);
    if (announce) notify(SONGS[S.cur].t + ' sedang diputar');
  }
  function next() { playSong(S.cur + 1, true); }
  function prev() {
    if (S.t > 3) { S.t = 0; updateBar(); save(); notify('Kembali ke awal lagu'); } else playSong(S.cur - 1, true);
  }
  function seekTo(pct) { S.t = Math.max(0, Math.min(100, pct)) / 100 * SONGS[S.cur].d; updateBar(); save(); }
  function toggleLike() {
    var i = S.likes.indexOf(S.cur);
    if (i > -1) S.likes.splice(i, 1); else S.likes.push(S.cur);
    render(); save();
    notify(i > -1 ? 'Dihapus dari lagu favorit' : 'Ditambahkan ke lagu favorit');
  }

  /* Kontrol pemutar */
  $('mainPlay').addEventListener('click', function () { setPlaying(!S.playing); });
  $('previousButton').addEventListener('click', prev);
  $('nextButton').addEventListener('click', next);
  $('playerLike').addEventListener('click', toggleLike);
  el.track.addEventListener('click', function (e) {
    var r = el.track.getBoundingClientRect(); seekTo((e.clientX - r.left) / r.width * 100);
  });
  el.track.addEventListener('keydown', function (e) {
    var p = S.t / SONGS[S.cur].d * 100;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { seekTo(p + 5); e.preventDefault(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { seekTo(p - 5); e.preventDefault(); }
  });

  /* Tombol di hero */
  if ($('heroPlay')) $('heroPlay').addEventListener('click', function () {
    if (S.cur !== 0) playSong(0, true); else setPlaying(!S.playing);
  });
  if ($('heroLike')) $('heroLike').addEventListener('click', toggleLike);
  if ($('shareButton')) $('shareButton').addEventListener('click', function () {
    var text = SONGS[S.cur].t + ' — ' + SONGS[S.cur].a + ' | LumaWave';
    navigator.clipboard.writeText(text).then(function () { notify('Judul lagu disalin ke clipboard'); },
      function () { notify('Siap dibagikan: ' + text); });
  });

  /* Volume dan bisu */
  var muteBtn = $('muteBtn');
  function renderVolume() {
    var off = S.muted || +S.vol === 0;
    icon(muteBtn, off ? 'volume-x' : 'volume-2', 'h-4 w-4 text-violet-200/75');
    muteBtn.setAttribute('aria-label', off ? 'Aktifkan suara' : 'Bisukan suara');
    el.vol.value = S.muted ? 0 : S.vol;
  }
  el.vol.addEventListener('input', function () { S.vol = +el.vol.value; S.muted = false; renderVolume(); save(); });
  muteBtn.addEventListener('click', function () {
    S.muted = !S.muted; if (!S.muted && +S.vol === 0) S.vol = 50;
    renderVolume(); save(); notify(S.muted ? 'Suara dibisukan' : 'Suara diaktifkan');
  });

  /* Antrean */
  var queue = document.createElement('div');
  queue.id = 'queue'; queue.className = 'queue-panel'; queue.hidden = true;
  queue.setAttribute('role', 'dialog'); queue.setAttribute('aria-label', 'Antrean lagu');
  document.body.appendChild(queue);
  var queueBtn = $('queueBtn');
  function renderQueue() {
    queue.innerHTML = '<h2 class="page-title q-title">Antrean</h2>' + SONGS.map(function (s, i) {
      return '<button type="button" class="q-item' + (i === S.cur ? ' on' : '') + '" data-i="' + i + '"><img src="' + s.img + '" alt=""><span><b>' + s.t + '</b><small>' + s.a + '</small></span><span class="dur">' + fmt(s.d) + '</span></button>';
    }).join('');
  }
  function toggleQueue(open) {
    queue.hidden = !open; queueBtn.setAttribute('aria-expanded', open);
    if (open) renderQueue();
  }
  queueBtn.setAttribute('aria-expanded', 'false');
  queueBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleQueue(queue.hidden); });
  queue.addEventListener('click', function (e) {
    var b = e.target.closest('.q-item'); if (b) playSong(+b.dataset.i, true);
  });
  document.addEventListener('click', function (e) {
    if (!queue.hidden && !queue.contains(e.target)) toggleQueue(false);
  });

  /* Kartu album */
  $$('.album-card').forEach(function (c) {
    c.addEventListener('click', function () {
      var i = SONGS.findIndex(function (s) { return s.t === c.dataset.song; });
      if (i > -1) playSong(i, true);
    });
  });

  /* Modal video (simulasi) */
  var modal = document.createElement('div');
  modal.className = 'modal'; modal.hidden = true;
  modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'vm-title');
  modal.innerHTML = '<div class="modal-box"><img id="vm-img" alt=""><div class="modal-bar">' +
    '<button type="button" id="vm-play" class="vm-btn" aria-label="Putar video">&#9654;</button>' +
    '<div class="vm-track"><div id="vm-fill"></div></div><span id="vm-time" class="dur"></span>' +
    '<button type="button" id="vm-close" class="vm-btn ghost" aria-label="Tutup video">&#10005;</button></div>' +
    '<div class="modal-text"><h3 id="vm-title" class="page-title"></h3><p id="vm-info" class="page-sub"></p></div></div>';
  document.body.appendChild(modal);
  var vt, vs = 0, vd = 1, vplay = false, lastFocus;
  function vRender() {
    $('vm-fill').style.width = (vs / vd * 100) + '%';
    $('vm-time').textContent = fmt(vs) + ' / ' + fmt(vd);
    $('vm-play').innerHTML = vplay ? '&#10074;&#10074;' : '&#9654;';
    $('vm-play').setAttribute('aria-label', vplay ? 'Jeda video' : 'Putar video');
  }
  function vSet(on) {
    vplay = on; clearInterval(vt);
    if (on) { if (S.playing) setPlaying(false); vt = setInterval(function () { vs += 1; if (vs >= vd) { vs = vd; vSet(false); } vRender(); }, 1000); }
    vRender();
  }
  function openVideo(card) {
    var m = card.querySelector('p').textContent.match(/(\d+):(\d+)/);
    vd = m ? (+m[1]) * 60 + (+m[2]) : 240; vs = 0; lastFocus = document.activeElement;
    $('vm-img').src = card.querySelector('img').src; $('vm-img').alt = card.querySelector('img').alt;
    $('vm-title').textContent = card.querySelector('h3').textContent;
    $('vm-info').textContent = card.querySelector('p').textContent;
    modal.hidden = false; vSet(true); $('vm-close').focus();
  }
  function closeVideo() { vSet(false); modal.hidden = true; if (lastFocus) lastFocus.focus(); }
  $('vm-play').addEventListener('click', function () { if (vs >= vd) vs = 0; vSet(!vplay); });
  $('vm-close').addEventListener('click', closeVideo);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeVideo(); });
  $$('.video-card').forEach(function (c) {
    c.setAttribute('tabindex', '0'); c.setAttribute('role', 'button');
    c.setAttribute('aria-label', 'Putar video ' + c.querySelector('h3').textContent);
    c.addEventListener('click', function () { openVideo(c); });
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openVideo(c); } });
  });

  /* Pencarian */
  var search = $('search');
  if (search) search.addEventListener('input', function () {
    var q = search.value.trim().toLowerCase(), n = 0;
    $$('.album-card,.video-card,.row-track,.tile').forEach(function (x) {
      var ok = !q || x.textContent.toLowerCase().indexOf(q) > -1; x.hidden = !ok; if (ok) n++;
    });
    if (q) notify(n ? n + ' hasil untuk “' + search.value.trim() + '”' : 'Tidak ada hasil untuk “' + search.value.trim() + '”');
  });

  /* Pintasan keyboard */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (!modal.hidden) closeVideo(); else if (!queue.hidden) toggleQueue(false); }
    if (e.key === ' ' && e.target === document.body) { e.preventDefault(); setPlaying(!S.playing); }
  });

  /* Tandai halaman aktif */
  var page = location.pathname.split('/').pop() || 'index.html', hash = location.hash;
  $$('.nav-item,.tab-link,.mnav').forEach(function (a) {
    var u = a.getAttribute('href').split('#');
    if (u[0] === page && (!u[1] || '#' + u[1] === hash)) a.setAttribute('aria-current', 'page');
  });

  /* Mulai */
  lucide.createIcons();
  renderVolume();
  render();
  if (S.playing) { S.playing = false; setPlaying(true); }
  window.addEventListener('pagehide', save);
})();
