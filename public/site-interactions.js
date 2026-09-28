/* ── NAV scroll ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, {passive:true});

/* ── Mobile menu ── */
function menuOpen(){
  document.getElementById('mobMenu').classList.add('open');
  document.body.style.overflow='hidden';
  document.querySelector('.nav-burger').setAttribute('aria-expanded','true');
}
function menuClose(){
  document.getElementById('mobMenu').classList.remove('open');
  document.body.style.overflow='';
  document.querySelector('.nav-burger').setAttribute('aria-expanded','false');
}
document.addEventListener('keydown', e=>{ if(e.key==='Escape') menuClose(); });

/* ── Hero parallax: nombre gigante + zoom imagen ── */
const heroName = document.getElementById('heroName');
const heroBgImg = document.querySelector('.hero-bg img');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if(heroName) heroName.style.transform = `translateY(${y * 0.25}px)`;
  if(heroBgImg && y < window.innerHeight)
    heroBgImg.style.transform = `scale(${1.04 + y * 0.00008})`;
}, {passive:true});

/* Zoom de imagen al cargar */
setTimeout(() => {
  if(heroBgImg) heroBgImg.style.transform = 'scale(1)';
}, 100);

/* ── Reveal on scroll ── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting){
      e.target.classList.add('on');
      revealObs.unobserve(e.target);
    }
  });
}, {threshold:0.1, rootMargin:'0px 0px -36px 0px'});
document.querySelectorAll('.reveal,.reveal-left,.reveal-scale').forEach(el => revealObs.observe(el));

/* ── Gallery drag scroll ── */
const track = document.getElementById('galleryTrack');
let isDragging=false, startX=0, scrollLeft=0;
if(track){
  track.addEventListener('mousedown', e=>{
    isDragging=true; startX=e.pageX-track.offsetLeft;
    scrollLeft=track.scrollLeft; track.style.userSelect='none';
  });
  track.addEventListener('mousemove', e=>{
    if(!isDragging) return;
    e.preventDefault();
    const x=e.pageX-track.offsetLeft;
    track.scrollLeft=scrollLeft-(x-startX)*1.2;
  });
  ['mouseup','mouseleave'].forEach(ev=>
    track.addEventListener(ev, ()=>{ isDragging=false; track.style.userSelect=''; }));

  /* Dots sync */
  const dots = document.querySelectorAll('#galleryDots .d');
  const cards = track.querySelectorAll('.gcard');
  track.addEventListener('scroll', () => {
    const idx = Math.round(track.scrollLeft / (track.clientWidth * 0.35));
    const clamped = Math.min(idx, dots.length-1);
    dots.forEach((d,i) => d.classList.toggle('active', i===clamped));
  }, {passive:true});
}

/* ── Perspectiva 3D en cards ── */
document.querySelectorAll('.gcard').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const dx = (e.clientX - cx) / (rect.width/2);
    const dy = (e.clientY - cy) / (rect.height/2);
    card.style.transform = `translateY(-8px) rotateY(${dx*6}deg) rotateX(${-dy*4}deg) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ── Form helpers ── */
function submitForm(formId, btnId, formEl, successId) {
  const form = document.getElementById(formId);
  const btn  = document.getElementById(btnId);
  const ok   = document.getElementById(successId);
  if(!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid=true;
    form.querySelectorAll('[required]').forEach(f => {
      f.classList.remove('err');
      if(!f.value.trim()){ f.classList.add('err'); valid=false; }
    });
    if(!valid){ form.querySelector('.err').focus(); return; }

    const orig = btn.innerHTML;
    btn.disabled=true;
    btn.textContent='Enviando...';

    fetch('/', {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams(new FormData(form)).toString()
    })
    .then(() => {
      form.style.display='none';
      ok.style.display='block';
      ok.focus();
    })
    .catch(() => {
      btn.disabled=false;
      btn.innerHTML=orig;
      alert('Error al enviar — intenta de nuevo.');
    });
  });
}

function submitDedicationForm() {
  const form = document.getElementById('buzonForm');
  const btn = document.getElementById('buzonBtn');
  const ok = document.getElementById('buzonOk');

  if (!form || !btn || !ok) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();

    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      field.classList.remove('err');
      if (!field.value.trim()) {
        field.classList.add('err');
        valid = false;
      }
    });

    const musicPickerValid = validateMusicPicker(form);

    if (!valid || !musicPickerValid) {
      const invalidField = form.querySelector('.err');
      if (invalidField) invalidField.focus();
      return;
    }

    const formData = new FormData(form);
    const value = name => String(formData.get(name) ?? '');
    const originalButton = btn.innerHTML;

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
      const response = await fetch('/api/dedications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowPublishing: value('allowPublishing') === 'true',
          artist: value('artist'),
          instagram: value('instagram'),
          message: value('message'),
          recipientName: value('recipientName'),
          senderName: value('senderName'),
          song: value('song'),
          spotifyTrackId: value('spotifyTrackId'),
          spotifyUrl: value('spotifyUrl'),
          website: value('bot-field'),
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to submit dedication.');
      }

      form.style.display = 'none';
      ok.style.display = 'block';
      requestAnimationFrame(() => {
        ok.focus({ preventScroll: true });
        ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } catch {
      btn.disabled = false;
      btn.innerHTML = originalButton;
      alert('No pudimos enviar tu historia. Intenta de nuevo.');
    }
  });
}

function resetDedicationForm() {
  const form = document.getElementById('buzonForm');
  const ok = document.getElementById('buzonOk');
  const song = document.getElementById('b-cancion');

  if (!form || !ok) return;

  form.reset();
  form.style.display = '';
  ok.style.display = 'none';

  requestAnimationFrame(() => {
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    song && song.focus({ preventScroll: true });
  });
}

function setMusicPickerHelp(picker, message) {
  const help = picker.querySelector('[data-music-help]');
  if (help) help.textContent = message;
}

function clearMusicPickerResults(picker) {
  const results = picker.querySelector('[data-music-results]');
  const query = picker.querySelector('[data-music-query]');

  if (results) results.replaceChildren();
  if (query) query.setAttribute('aria-expanded', 'false');
}

function clearMusicPickerSelection(picker) {
  picker.querySelector('[data-music-song]').value = '';
  picker.querySelector('[data-music-artist]').value = '';
  picker.querySelector('[data-music-track-id]').value = '';
  picker.querySelector('[data-music-url]').value = '';
  picker.classList.remove('is-selected', 'is-invalid');
  picker.querySelector('[data-music-clear]').hidden = true;
}

function selectMusicTrack(picker, track) {
  const query = picker.querySelector('[data-music-query]');

  picker.querySelector('[data-music-song]').value = track.name;
  picker.querySelector('[data-music-artist]').value = track.artists;
  picker.querySelector('[data-music-track-id]').value = track.id;
  picker.querySelector('[data-music-url]').value = track.url;
  query.value = `${track.name} — ${track.artists}`;
  picker.classList.add('is-selected');
  picker.classList.remove('is-invalid');
  picker.querySelector('[data-music-clear]').hidden = false;
  clearMusicPickerResults(picker);
  setMusicPickerHelp(picker, 'Canción seleccionada de Spotify.');
}

function renderMusicPickerResults(picker, tracks) {
  const results = picker.querySelector('[data-music-results]');
  const query = picker.querySelector('[data-music-query]');

  results.replaceChildren();

  if (!tracks.length) {
    setMusicPickerHelp(picker, 'No encontramos coincidencias. Puedes escribirla manualmente.');
    query.setAttribute('aria-expanded', 'false');
    return;
  }

  tracks.forEach(track => {
    const option = document.createElement('button');
    const song = document.createElement('span');
    const artist = document.createElement('span');
    const source = document.createElement('span');

    option.className = 'music-picker-option';
    option.type = 'button';
    option.setAttribute('role', 'option');
    song.className = 'music-picker-option-song';
    artist.className = 'music-picker-option-artist';
    source.className = 'music-picker-option-source';
    song.textContent = track.name;
    artist.textContent = track.artists;
    source.textContent = 'Spotify';
    option.append(song, artist, source);
    option.addEventListener('click', () => selectMusicTrack(picker, track));
    results.append(option);
  });

  query.setAttribute('aria-expanded', 'true');
  setMusicPickerHelp(picker, 'Elige una canción de los resultados de Spotify.');
}

function setupMusicPicker(picker) {
  const query = picker.querySelector('[data-music-query]');
  const clear = picker.querySelector('[data-music-clear]');
  const manualSong = picker.querySelector('[data-music-manual-song]');
  const manualArtist = picker.querySelector('[data-music-manual-artist]');
  let controller = null;
  let timeoutId = 0;

  const useManualSong = () => {
    const song = manualSong.value.trim();
    const artist = manualArtist.value.trim();

    clearMusicPickerSelection(picker);
    picker.querySelector('[data-music-song]').value = song;
    picker.querySelector('[data-music-artist]').value = artist;
    query.value = song && artist ? `${song} — ${artist}` : '';

    if (song && artist) {
      picker.classList.add('is-selected');
      setMusicPickerHelp(picker, 'Canción escrita manualmente.');
    } else {
      setMusicPickerHelp(picker, 'Escribe el título y el artista para continuar.');
    }
  };

  query.addEventListener('input', () => {
    const value = query.value.trim();

    window.clearTimeout(timeoutId);
    if (controller) controller.abort();
    clearMusicPickerSelection(picker);
    clearMusicPickerResults(picker);

    if (value.length < 2) {
      setMusicPickerHelp(picker, 'Escribe al menos 2 letras para buscar en Spotify.');
      return;
    }

    setMusicPickerHelp(picker, 'Buscando en Spotify…');
    timeoutId = window.setTimeout(async () => {
      controller = new AbortController();

      try {
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok || !Array.isArray(payload.tracks)) {
          setMusicPickerHelp(picker, payload.error || 'No pudimos buscar canciones. Puedes escribirla manualmente.');
          return;
        }

        if (query.value.trim() !== value) return;
        renderMusicPickerResults(picker, payload.tracks);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setMusicPickerHelp(picker, 'No pudimos buscar canciones. Puedes escribirla manualmente.');
        }
      }
    }, 300);
  });

  clear.addEventListener('click', () => {
    clearMusicPickerSelection(picker);
    clearMusicPickerResults(picker);
    query.value = '';
    query.focus();
    setMusicPickerHelp(picker, 'Escribe para buscar en Spotify.');
  });
  manualSong.addEventListener('input', useManualSong);
  manualArtist.addEventListener('input', useManualSong);
  picker.closest('form').addEventListener('reset', () => {
    window.setTimeout(() => {
      clearMusicPickerSelection(picker);
      clearMusicPickerResults(picker);
      setMusicPickerHelp(picker, 'Escribe para buscar en Spotify.');
    });
  });
}

function validateMusicPicker(form) {
  const picker = form.querySelector('[data-music-picker]');
  const song = picker.querySelector('[data-music-song]').value.trim();
  const artist = picker.querySelector('[data-music-artist]').value.trim();

  if (song && artist) {
    picker.classList.remove('is-invalid');
    return true;
  }

  picker.classList.add('is-invalid');
  setMusicPickerHelp(picker, 'Elige una canción de Spotify o escribe título y artista manualmente.');
  picker.querySelector('[data-music-query]').focus();
  return false;
}

document.querySelectorAll('[data-music-picker]').forEach(setupMusicPicker);

submitDedicationForm();
submitForm('nlForm','nlBtn','nlForm','nlOk');

let privateDedicationUrl = '';

function setCopyButtonLabel(label) {
  const button = document.querySelector('#dedicarOk .btn-share-secondary[type="button"]');
  if (!button) return;

  button.textContent = label;
}

async function copyPrivateDedicationLink() {
  if (!privateDedicationUrl) return;

  try {
    await navigator.clipboard.writeText(privateDedicationUrl);
  } catch {
    const input = document.getElementById('dedicarShareUrl');
    input.focus();
    input.select();
    document.execCommand('copy');
  }

  setCopyButtonLabel('Enlace copiado');
  window.setTimeout(() => setCopyButtonLabel('Copiar enlace'), 2200);
}

async function sharePrivateDedication() {
  if (!privateDedicationUrl) return;

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Tienes una canción dedicada',
        text: 'Te hice una dedicatoria musical.',
        url: privateDedicationUrl,
      });
      return;
    } catch {
      return;
    }
  }

  await copyPrivateDedicationLink();
}

function submitPrivateDedicationForm() {
  const form = document.getElementById('dedicarForm');
  const button = document.getElementById('dedicarBtn');
  const success = document.getElementById('dedicarOk');
  const linkInput = document.getElementById('dedicarShareUrl');
  const whatsApp = document.getElementById('dedicarWhatsApp');

  if (!form || !button || !success || !linkInput || !whatsApp) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();

    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      field.classList.remove('err');
      if (!field.value.trim()) {
        field.classList.add('err');
        valid = false;
      }
    });

    const musicPickerValid = validateMusicPicker(form);

    if (!valid || !musicPickerValid) {
      const invalidField = form.querySelector('.err');
      if (invalidField) invalidField.focus();
      return;
    }

    const formData = new FormData(form);
    const value = name => String(formData.get(name) ?? '');
    const originalButton = button.innerHTML;

    button.disabled = true;
    button.textContent = 'Creando...';

    try {
      const response = await fetch('/api/private-dedications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist: value('artist'),
          message: value('message'),
          recipientName: value('recipientName'),
          senderName: value('senderName'),
          song: value('song'),
          spotifyTrackId: value('spotifyTrackId'),
          spotifyUrl: value('spotifyUrl'),
          website: value('bot-field-d'),
        }),
      });
      const payload = await response.json();

      if (!response.ok || typeof payload.sharePath !== 'string') {
        throw new Error('Unable to create private dedication.');
      }

      privateDedicationUrl = new URL(payload.sharePath, window.location.origin).toString();
      linkInput.value = privateDedicationUrl;
      whatsApp.href = `https://wa.me/?text=${encodeURIComponent(`Te hice una dedicatoria musical. ${privateDedicationUrl}`)}`;
      form.style.display = 'none';
      success.style.display = 'block';

      requestAnimationFrame(() => {
        success.focus({ preventScroll: true });
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } catch {
      button.disabled = false;
      button.innerHTML = originalButton;
      alert('No pudimos crear tu dedicatoria. Inténtalo de nuevo.');
    }
  });
}

function resetPrivateDedicationForm() {
  const form = document.getElementById('dedicarForm');
  const success = document.getElementById('dedicarOk');
  const song = document.getElementById('d-cancion');
  const linkInput = document.getElementById('dedicarShareUrl');

  if (!form || !success) return;

  privateDedicationUrl = '';
  form.reset();
  form.style.display = '';
  success.style.display = 'none';
  if (linkInput) linkInput.value = '';
  setCopyButtonLabel('Copiar enlace');

  requestAnimationFrame(() => {
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    song && song.focus({ preventScroll: true });
  });
}

/* ── Carrusel about ── */
let carouselIdx = 0;
const slides = document.getElementById('aboutSlides');
const cDots  = document.querySelectorAll('.carousel-dots .cd');
function carouselGo(n) {
  carouselIdx = (n + 3) % 3;
  if(slides) slides.style.transform = `translateX(-${carouselIdx * 100}%)`;
  cDots.forEach((d,i) => d.classList.toggle('active', i === carouselIdx));
}
function carouselPrev(){ carouselGo(carouselIdx - 1); }
function carouselNext(){ carouselGo(carouselIdx + 1); }

// Auto-advance cada 5s
setInterval(() => carouselGo(carouselIdx + 1), 5000);

// Touch swipe en carrusel
if(slides) {
  let ts = 0;
  slides.addEventListener('touchstart', e => { ts = e.touches[0].clientX; }, {passive:true});
  slides.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - ts;
    if(Math.abs(dx) > 40) dx < 0 ? carouselNext() : carouselPrev();
  }, {passive:true});
}

/* ── Tab switch buzón ── */
function switchTab(tab) {
  const historia = document.getElementById('buzonForm');
  const dedicar  = document.getElementById('dedicarForm');
  const tH = document.getElementById('tab-historia');
  const tD = document.getElementById('tab-dedicar');
  const okH = document.getElementById('buzonOk');
  const okD = document.getElementById('dedicarOk');
  const title = document.getElementById('buzonTitle');
  const intro = document.getElementById('buzonIntro');

  if(tab === 'historia') {
    historia && (historia.style.display = '');
    dedicar  && (dedicar.style.display = 'none');
    okH && (okH.style.display = 'none');
    okD && (okD.style.display = 'none');
    tH.classList.add('active'); tH.setAttribute('aria-selected','true');
    tD.classList.remove('active'); tD.setAttribute('aria-selected','false');
    if(title) title.innerHTML = '¿Tienes una canción<br>que <em>contar?</em>';
    if(intro) intro.textContent = 'Cuéntame la historia que tuviste con una canción. Las leo todas personalmente.';
  } else {
    historia && (historia.style.display = 'none');
    dedicar  && (dedicar.style.display = '');
    okH && (okH.style.display = 'none');
    okD && (okD.style.display = 'none');
    tH.classList.remove('active'); tH.setAttribute('aria-selected','false');
    tD.classList.add('active'); tD.setAttribute('aria-selected','true');
    if(title) title.innerHTML = 'Dedica una canción<br>a <em>alguien especial.</em>';
    if(intro) intro.textContent = 'Crea una dedicatoria privada y compártela por el medio que prefieras.';
  }
}

/* ── Form dedicar ── */
submitPrivateDedicationForm();

Object.assign(window, {
  menuOpen,
  menuClose,
  carouselGo,
  carouselPrev,
  carouselNext,
  copyPrivateDedicationLink,
  resetDedicationForm,
  resetPrivateDedicationForm,
  sharePrivateDedication,
  switchTab,
});
