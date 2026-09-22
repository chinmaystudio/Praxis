/** Restore event films without preloading hidden videos or blocking the landing page. */
export function initEventIntro() {
  const dialog = document.querySelector('[data-event-intro]');
  if (!(dialog instanceof HTMLDialogElement)) return;
  const video = dialog.querySelector('video');
  const playButton = dialog.querySelector('[data-intro-play]');
  const soundButton = dialog.querySelector('[data-intro-sound]');
  const skipButton = dialog.querySelector('[data-intro-skip]');
  const title = dialog.querySelector('[data-intro-title]');
  const status = dialog.querySelector('[data-intro-status]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let loadTimer;
  let session = 0;
  let resumeWhenVisible = false;
  let savedOverflow;

  function clearLoadTimer() {
    window.clearTimeout(loadTimer);
  }

  function closeFilm() {
    if (dialog.open) dialog.close();
  }

  function setSoundLabel() {
    soundButton.textContent = video.muted ? 'Sound off — enable' : 'Sound on — mute';
    soundButton.setAttribute('aria-pressed', String(!video.muted));
  }

  function armLoadTimer() {
    clearLoadTimer();
    loadTimer = window.setTimeout(() => {
      if (dialog.open && video.readyState < 3 && !document.hidden) closeFilm();
    }, 15000);
  }

  async function playFilm() {
    if (!dialog.open || document.hidden) return;
    const attempt = session;
    playButton.hidden = true;
    status.textContent = 'Loading film… You can skip at any time.';
    armLoadTimer();
    try {
      await video.play();
      if (attempt !== session || !dialog.open) return;
      clearLoadTimer();
      status.textContent = '';
    } catch (error) {
      if (attempt !== session || !dialog.open || error.name === 'AbortError') return;
      clearLoadTimer();
      playButton.hidden = false;
      status.textContent = 'Tap Play film to start, or continue to the event.';
    }
  }

  function openFilm(kind = 'intro') {
    if (dialog.open) return;
    const briefing = kind === 'briefing';
    const mobile = window.matchMedia('(max-width: 820px), (pointer: coarse)').matches;
    const source = briefing
      ? (mobile ? dialog.dataset.briefingMobile : dialog.dataset.briefing)
      : (mobile ? dialog.dataset.introMobile : dialog.dataset.intro);
    if (!source) return;
    session += 1;
    savedOverflow = [document.documentElement.style.overflow, document.body.style.overflow];
    title.textContent = briefing ? dialog.dataset.briefingTitle : dialog.dataset.introTitle;
    video.setAttribute('aria-label', title.textContent);
    video.defaultMuted = true;
    video.muted = true;
    video.preload = 'auto';
    video.src = source;
    setSoundLabel();
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    playFilm();
  }

  playButton.addEventListener('click', playFilm);
  soundButton.addEventListener('click', () => {
    video.muted = !video.muted;
    setSoundLabel();
    if (video.paused) playFilm();
  });
  skipButton.addEventListener('click', closeFilm);
  video.addEventListener('ended', closeFilm);
  video.addEventListener('error', closeFilm);
  video.addEventListener('playing', () => {
    clearLoadTimer();
    playButton.hidden = true;
    status.textContent = '';
  });
  video.addEventListener('waiting', () => {
    status.textContent = 'Buffering film… You can skip at any time.';
    armLoadTimer();
  });
  dialog.addEventListener('close', () => {
    session += 1;
    clearLoadTimer();
    resumeWhenVisible = false;
    video.pause();
    video.removeAttribute('src');
    video.preload = 'none';
    video.load();
    if (savedOverflow) {
      [document.documentElement.style.overflow, document.body.style.overflow] = savedOverflow;
      savedOverflow = null;
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (!dialog.open) return;
    if (document.hidden) {
      resumeWhenVisible = !video.paused;
      video.pause();
      clearLoadTimer();
    } else if (resumeWhenVisible || video.currentTime === 0) {
      resumeWhenVisible = false;
      playFilm();
    }
  });
  document.querySelectorAll('[data-event-film]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => openFilm(button.dataset.eventFilm));
  });
  // Respect reduced motion and direct section links; films remain available on demand.
  if (!reducedMotion && !window.location.hash) openFilm();
}
