/* ═══════════════════════════════════════════════════════════
   PRAXIS — Cinematic Landing Page
   State Machine & Video Playback Logic
   ═══════════════════════════════════════════════════════════ */

// CSS loaded via link tag in head

// ─── STATE ───
const State = Object.freeze({
  INTRO_LOADING: 'INTRO_LOADING',
  INTRO_PLAYING: 'INTRO_PLAYING',
  INTRO_COMPLETE: 'INTRO_COMPLETE',
  SPLASH: 'SPLASH',
  EXPLORE: 'EXPLORE',
  VID2_PLAYING: 'VID2_PLAYING',
  EVENTS: 'EVENTS',
});

let currentState = State.INTRO_LOADING;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── DOM REFERENCES ───
const els = {
  video: document.getElementById('hero-video'),
  videoIntro: document.getElementById('video-intro'),
  loader: document.getElementById('intro-loader'),
  soundBtn: document.getElementById('sound-btn'),
  soundLabel: document.getElementById('sound-label'),
  skipBtn: document.getElementById('skip-btn'),
  splash: document.getElementById('intro-splash'),
  explore: document.getElementById('explore-events'),
  exploreCta: document.getElementById('explore-cta'),
  vid2Container: document.getElementById('vid2-container'),
  vid2: document.getElementById('vid2'),
  vid2Flash: document.getElementById('vid2-flash-overlay'),
  vid2OutroFade: document.getElementById('vid2-outro-fade'),
  vid2ProgressBar: document.getElementById('vid2-progress-bar'),
  vid2SoundBtn: document.getElementById('vid2-sound-btn'),
  vid2SoundLabel: document.getElementById('vid2-sound-label'),
  vid2SkipBtn: document.getElementById('vid2-skip-btn'),
  eventsSection: document.getElementById('events-section'),
};

// ─── STATE TRANSITIONS ───

function setState(newState) {
  const oldState = currentState;
  currentState = newState;
  console.log(`[PRAXIS] ${oldState} → ${newState}`);
  onStateChange(newState, oldState);
}

function onStateChange(state) {
  switch (state) {
    case State.INTRO_LOADING:
      handleIntroLoading();
      break;
    case State.INTRO_PLAYING:
      handleIntroPlaying();
      break;
    case State.INTRO_COMPLETE:
      handleIntroComplete();
      break;
    case State.SPLASH:
      handleSplash();
      break;
    case State.EXPLORE:
      handleExplore();
      break;
    case State.EVENTS:
      handleEvents();
      break;
  }
}


// ─── STATE HANDLERS ───

function handleIntroLoading() {
  document.body.classList.add('intro-active');

  // For reduced motion users, skip straight to explore
  if (prefersReducedMotion) {
    skipToExplore();
    return;
  }

  const video = els.video;
  let isReady = false;

  const triggerReady = () => {
    if (isReady) return;
    isReady = true;
    if (video._loadTimeout) {
      clearTimeout(video._loadTimeout);
      video._loadTimeout = null;
    }
    onVideoReady();
  };

  // Handle video source error (missing file)
  video.addEventListener('error', onVideoError, { once: true });
  const source = video.querySelector('source');
  if (source) {
    source.addEventListener('error', onVideoError, { once: true });
  }

  // Listen to multiple events for reliable start across browsers
  video.addEventListener('canplaythrough', triggerReady, { once: true });
  video.addEventListener('canplay', triggerReady, { once: true });
  video.addEventListener('playing', triggerReady, { once: true });
  video.addEventListener('loadeddata', triggerReady, { once: true });

  // If video doesn't load within 8 seconds, fallback
  const loadTimeout = setTimeout(() => {
    if (!isReady) {
      console.log('[PRAXIS] Video load timeout');
      onVideoError();
    }
  }, 8000);

  video._loadTimeout = loadTimeout;

  if (video.readyState >= 2) {
    triggerReady();
  } else {
    video.load();
  }
}

function onVideoReady() {
  const video = els.video;
  if (video._loadTimeout) {
    clearTimeout(video._loadTimeout);
    video._loadTimeout = null;
  }

  // Hide loader
  els.loader.classList.add('hidden');

  // Attempt unmuted playback
  video.defaultMuted = false;
  video.muted = false;
  video.volume = 1.0;
  updateSoundUI(true);

  const playPromise = video.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log('[PRAXIS] Hero video started with audio');
        video.classList.add('visible');
        setState(State.INTRO_PLAYING);
      })
      .catch((err) => {
        console.warn('[PRAXIS] Browser blocked unmuted autoplay, starting muted:', err);
        video.muted = true;
        updateSoundUI(false);
        video.play().then(() => {
          video.classList.add('visible');
          setState(State.INTRO_PLAYING);

          // Auto-unmute on ANY first user interaction anywhere on the page
          const autoUnmute = () => {
            if (video && video.muted) {
              video.muted = false;
              video.volume = 1.0;
              video.play().catch(() => {});
              updateSoundUI(true);
            }
          };
          ['click', 'touchstart', 'keydown', 'pointerdown'].forEach((evt) => {
            window.addEventListener(evt, autoUnmute, { capture: true, once: true });
          });
        }).catch(() => {
          video.classList.add('visible');
          setState(State.INTRO_PLAYING);
        });
      });
  } else {
    video.classList.add('visible');
    setState(State.INTRO_PLAYING);
  }
}


function onVideoError() {
  const video = els.video;
  if (video._loadTimeout) {
    clearTimeout(video._loadTimeout);
    video._loadTimeout = null;
  }
  console.log('[PRAXIS] Video error or missing, falling back to static hero');

  // Skip to explore directly with branded fallback
  skipToExplore();
}

function updateSoundUI(unmuted) {
  if (!els.soundBtn) return;
  if (unmuted) {
    els.soundBtn.classList.remove('is-muted');
    if (els.soundLabel) els.soundLabel.textContent = 'AUDIO ON';
    els.soundBtn.setAttribute('aria-label', 'Mute audio');
  } else {
    els.soundBtn.classList.add('is-muted');
    if (els.soundLabel) els.soundLabel.textContent = 'AUDIO OFF';
    els.soundBtn.setAttribute('aria-label', 'Unmute audio');
  }
}

function toggleSound(e) {
  if (e) e.stopPropagation();
  const video = els.video;
  video.muted = !video.muted;
  if (!video.muted && video.paused) {
    video.play();
  }
  updateSoundUI(!video.muted);
}

function handleIntroPlaying() {
  // Show controls
  els.skipBtn.hidden = false;
  if (els.soundBtn) els.soundBtn.hidden = false;

  // Listen for video end
  els.video.addEventListener('ended', () => {
    setState(State.INTRO_COMPLETE);
  }, { once: true });
}

function handleIntroComplete() {
  // Transition from video to splash
  transitionToSplash();
}

function handleSplash() {
  // Splash auto-transitions to Explore after its animations play out
  const splashDuration = prefersReducedMotion ? 500 : 3200;
  setTimeout(() => {
    transitionToExplore();
  }, splashDuration);
}

function handleExplore() {
  // Remove intro-active (allow scrolling)
  document.body.classList.remove('intro-active');
  revealShowdownElements();
}

function handleEvents() {
  // Reveal events section
  if (els.eventsSection) {
    els.eventsSection.classList.add('visible');
  }
  revealShowdownElements();
}


// ─── TRANSITIONS ───

function transitionToSplash() {
  // Unhide splash underneath so transition is a seamless crossfade
  els.splash.hidden = false;
  setState(State.SPLASH);

  // Fade out video intro
  els.videoIntro.classList.add('hidden');

  setTimeout(() => {
    els.videoIntro.style.display = 'none';
  }, prefersReducedMotion ? 50 : 1000);
}

function transitionToExplore() {
  // Unhide explore layer underneath
  els.explore.hidden = false;
  els.splash.classList.add('fade-out');

  // Pre-buffer vid2 into GPU memory in advance for 100% smooth, instant playback
  if (els.vid2) {
    els.vid2.preload = 'auto';
    els.vid2.load();
  }

  setTimeout(() => {
    els.splash.hidden = true;
    els.splash.style.display = 'none';
    setState(State.EXPLORE);
  }, prefersReducedMotion ? 50 : 1200);
}

function skipToExplore() {
  // Quick skip — hide everything and go to explore
  els.loader.classList.add('hidden');
  els.videoIntro.classList.add('hidden');

  // Pre-buffer vid2 into GPU memory in advance
  if (els.vid2) {
    els.vid2.preload = 'auto';
    els.vid2.load();
  }

  setTimeout(() => {
    els.videoIntro.style.display = 'none';
    els.splash.hidden = true;
    els.splash.style.display = 'none';
    els.explore.hidden = false;

    document.body.classList.remove('intro-active');
    revealShowdownElements();
    currentState = State.EXPLORE;
    console.log('[PRAXIS] Skipped to EXPLORE');
  }, prefersReducedMotion ? 50 : 600);
}

// ─── SKIP / PLAY BUTTON HANDLERS ───

function onSkipClick(e) {
  if (e) e.stopPropagation();
  els.video.pause();
  transitionToSplash();
}


// ─── VID2 CINEMATIC BRIEFING LOGIC ───
let isVid2Transitioning = false;

function onExploreCTAClick(e) {
  if (e) e.preventDefault();

  if (currentState !== State.EXPLORE) return;

  console.log('[PRAXIS] EXPLORE CTA CLICKED — Launching vid2 cinematic sequence');

  // 1. Trigger high-impact launch animation on button & explore screen
  if (els.exploreCta) {
    els.exploreCta.classList.add('is-launching');
  }
  if (els.explore) {
    els.explore.classList.add('vid2-launching');
  }

  // 2. Transition into vid2 briefing with cinematic animation
  setTimeout(() => {
    playVid2Briefing();
  }, prefersReducedMotion ? 50 : 350);
}

function playVid2Briefing() {
  if (!els.vid2Container || !els.vid2) {
    transitionToEvents();
    return;
  }

  setState(State.VID2_PLAYING);
  isVid2Transitioning = false;

  // Reset outro fade veil and audio volume
  if (els.vid2OutroFade) {
    els.vid2OutroFade.classList.remove('is-active');
  }
  if (els.vid2) {
    els.vid2.volume = 1.0;
  }

  // Unhide vid2 container and trigger entrance animation
  els.vid2Container.hidden = false;
  els.vid2Container.style.display = 'flex';
  els.vid2Container.classList.remove('vid2-exit');
  els.vid2Container.classList.add('vid2-enter');

  // Trigger decoupled optical flash overlay (GPU friendly)
  if (els.vid2Flash) {
    els.vid2Flash.classList.remove('is-active');
    void els.vid2Flash.offsetWidth;
    els.vid2Flash.classList.add('is-active');
  }

  // Reset video position
  els.vid2.currentTime = 0;
  if (els.vid2ProgressBar) {
    els.vid2ProgressBar.style.width = '0%';
  }

  // Play with unmuted sound (allowed because user clicked EXPLORE EVENT CTA)
  els.vid2.muted = false;
  updateVid2SoundUI(true);

  const playPromise = els.vid2.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log('[PRAXIS] vid2 started playing successfully');
      })
      .catch((err) => {
        console.warn('[PRAXIS] Direct unmuted play for vid2 blocked, falling back to muted:', err);
        els.vid2.muted = true;
        updateVid2SoundUI(false);
        els.vid2.play().catch((err2) => {
          console.error('[PRAXIS] vid2 playback failed entirely:', err2);
          transitionFromVid2ToEvents();
        });
      });
  }

  // After cinematic entrance completes, hide explore layer
  setTimeout(() => {
    if (els.explore) {
      els.explore.hidden = true;
      els.explore.style.display = 'none';
      els.explore.classList.remove('vid2-launching');
    }
    if (els.exploreCta) {
      els.exploreCta.classList.remove('is-launching');
    }
  }, prefersReducedMotion ? 50 : 750);
}

function updateVid2SoundUI(isUnmuted) {
  if (!els.vid2SoundBtn || !els.vid2SoundLabel) return;
  if (isUnmuted) {
    els.vid2SoundBtn.classList.remove('is-muted');
    els.vid2SoundBtn.classList.add('is-unmuted');
    els.vid2SoundLabel.textContent = 'AUDIO ON';
  } else {
    els.vid2SoundBtn.classList.remove('is-unmuted');
    els.vid2SoundBtn.classList.add('is-muted');
    els.vid2SoundLabel.textContent = 'MUTED';
  }
}

function toggleVid2Sound(e) {
  if (e) e.stopPropagation();
  if (!els.vid2) return;
  els.vid2.muted = !els.vid2.muted;
  updateVid2SoundUI(!els.vid2.muted);
}

// Smooth user skip action with audio ramp-down and fade veil
function onVid2SkipClick(e) {
  if (e) e.stopPropagation();
  if (isVid2Transitioning) return;

  console.log('[PRAXIS] vid2 skipped by user — triggering smooth outro dissolve');

  if (els.vid2OutroFade) {
    els.vid2OutroFade.classList.add('is-active');
  }

  if (els.vid2 && !els.vid2.muted) {
    let vol = els.vid2.volume;
    const fadeTimer = setInterval(() => {
      vol = Math.max(0, vol - 0.25);
      if (els.vid2) els.vid2.volume = vol;
      if (vol <= 0) clearInterval(fadeTimer);
    }, 35);
  }

  setTimeout(() => {
    transitionFromVid2ToEvents();
  }, prefersReducedMotion ? 50 : 250);
}

function transitionFromVid2ToEvents() {
  if (isVid2Transitioning) return;
  isVid2Transitioning = true;

  console.log('[PRAXIS] Transitioning from vid2 to showdown events section');

  // Trigger outro fade veil to prevent any visual frame freeze
  if (els.vid2OutroFade) {
    els.vid2OutroFade.classList.add('is-active');
  }

  // Trigger cinematic exit animation on container
  if (els.vid2Container) {
    els.vid2Container.classList.remove('vid2-enter');
    els.vid2Container.classList.add('vid2-exit');
  }

  // Display showdown section
  els.eventsSection.classList.add('visible');
  revealShowdownElements();

  setTimeout(() => {
    if (els.vid2) {
      els.vid2.pause();
    }
    if (els.vid2Container) {
      els.vid2Container.hidden = true;
      els.vid2Container.style.display = 'none';
      els.vid2Container.classList.remove('vid2-exit');
    }

    setState(State.EVENTS);
    els.eventsSection.scrollIntoView({ behavior: 'smooth' });
    isVid2Transitioning = false;
  }, prefersReducedMotion ? 50 : 750);
}

function transitionToEvents() {
  // Direct transition fallback
  els.explore.classList.add('fade-out');
  els.eventsSection.classList.add('visible');

  setTimeout(() => {
    els.explore.hidden = true;
    els.explore.style.display = 'none';

    setState(State.EVENTS);
    revealShowdownElements();
    els.eventsSection.scrollIntoView({ behavior: 'smooth' });
  }, prefersReducedMotion ? 50 : 800);
}

// ─── REVEAL SHOWDOWN OVERVIEW ───

function revealShowdownElements() {
  const cards = document.querySelectorAll(
    '.spec-card, .prize-card, .round-card, .rule-card, .points-block, .contact-card, .final-cta-box'
  );
  cards.forEach((card, i) => {
    setTimeout(() => {
      card.classList.add('visible');
    }, i * 40);
  });
}

// ─── INTERACTIVE STAGE SELECTION TABS ───

function initStageTabs() {
  const stageButtons = document.querySelectorAll('.stage-tab-btn');
  const roundCards = document.querySelectorAll('.round-card[data-stage-card]');
  if (!stageButtons.length || !roundCards.length) return;

  stageButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      stageButtons.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const selectedStage = btn.getAttribute('data-stage');

      roundCards.forEach((card) => {
        const cardStage = card.getAttribute('data-stage-card');
        if (selectedStage === 'all') {
          card.classList.remove('is-filtered-out', 'is-focused-stage');
        } else if (selectedStage === cardStage) {
          card.classList.remove('is-filtered-out');
          card.classList.add('is-focused-stage');
        } else {
          card.classList.add('is-filtered-out');
          card.classList.remove('is-focused-stage');
        }
      });
    });
  });
}

// ─── STICKY NAVIGATION TABS & SCROLL-SPY ───

function initStickyNav() {
  const navTabs = document.querySelectorAll('.sticky-nav-tab');
  if (!navTabs.length) return;

  navTabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      const targetId = tab.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
        navTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
      }
    });
  });

  const sectionIds = ['overview-hero', 'prizes-section', 'rules-breakdown', 'points-system', 'general-rules', 'contact-support'];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const currentId = entry.target.id;
            navTabs.forEach((tab) => {
              if (tab.getAttribute('data-target') === currentId) {
                tab.classList.add('active');
              } else {
                tab.classList.remove('active');
              }
            });
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -50% 0px',
        threshold: 0.1,
      }
    );

    sections.forEach((sec) => observer.observe(sec));
  }
}

// ─── PAGE VISIBILITY API (SMOOTH TAB SWITCHING) ───

let wasHeroPlayingBeforeBlur = false;
let wasVid2PlayingBeforeBlur = false;

function initPageVisibility() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // User shifted away to another browser tab
      if (currentState === State.INTRO_PLAYING && els.video && !els.video.paused) {
        wasHeroPlayingBeforeBlur = true;
        els.video.pause();
      }
      if (currentState === State.VID2_PLAYING && els.vid2 && !els.vid2.paused) {
        wasVid2PlayingBeforeBlur = true;
        els.vid2.pause();
      }
    } else {
      // User switched back to this tab
      if (currentState === State.INTRO_PLAYING && wasHeroPlayingBeforeBlur && els.video) {
        wasHeroPlayingBeforeBlur = false;
        els.video.play().catch(() => {});
      }
      if (currentState === State.VID2_PLAYING && wasVid2PlayingBeforeBlur && els.vid2) {
        wasVid2PlayingBeforeBlur = false;
        els.vid2.play().catch(() => {});
      }
    }
  });
}

// ─── INIT ───

function init() {
  // Bind event listeners
  els.skipBtn.addEventListener('click', onSkipClick);
  els.exploreCta.addEventListener('click', onExploreCTAClick);
  if (els.soundBtn) {
    els.soundBtn.addEventListener('click', toggleSound);
  }

  // Bind vid2 event listeners with smooth outro dissolution
  if (els.vid2) {
    els.vid2.addEventListener('timeupdate', () => {
      if (els.vid2.duration && els.vid2ProgressBar) {
        const pct = (els.vid2.currentTime / els.vid2.duration) * 100;
        els.vid2ProgressBar.style.width = `${pct}%`;
      }

      if (els.vid2.duration && !isVid2Transitioning) {
        const timeLeft = els.vid2.duration - els.vid2.currentTime;
        // Dissolve / fade ending smoothly in final 1.8 seconds
        if (timeLeft <= 1.8 && timeLeft > 0) {
          if (els.vid2OutroFade && !els.vid2OutroFade.classList.contains('is-active')) {
            els.vid2OutroFade.classList.add('is-active');
          }
          if (!els.vid2.muted) {
            els.vid2.volume = Math.max(0, Math.min(1, timeLeft / 1.8));
          }
        }

        // Transition gracefully right before the very last frame freezes
        if (timeLeft <= 0.25) {
          transitionFromVid2ToEvents();
        }
      }
    });

    els.vid2.addEventListener('ended', () => {
      console.log('[PRAXIS] vid2 ended naturally');
      transitionFromVid2ToEvents();
    });
  }

  if (els.vid2SkipBtn) {
    els.vid2SkipBtn.addEventListener('click', onVid2SkipClick);
  }

  if (els.vid2SoundBtn) {
    els.vid2SoundBtn.addEventListener('click', toggleVid2Sound);
  }

  // Click anywhere on vid2 to unmute if muted
  if (els.vid2Container) {
    els.vid2Container.addEventListener('click', (e) => {
      if (e.target.closest('#vid2-skip-btn') || e.target.closest('#vid2-sound-btn')) return;
      if (currentState === State.VID2_PLAYING && els.vid2 && els.vid2.muted) {
        els.vid2.muted = false;
        updateVid2SoundUI(true);
      }
    });
  }

  // Click anywhere on video to unmute if playing muted
  els.videoIntro.addEventListener('click', (e) => {
    if (e.target.closest('#skip-btn') || e.target.closest('#sound-btn') || e.target.closest('#play-prompt')) return;
    if (currentState === State.INTRO_PLAYING && els.video.muted) {
      els.video.muted = false;
      updateSoundUI(true);
    }
  });

  // Keyboard support: Esc for Skip, M for Mute/Unmute
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (currentState === State.INTRO_PLAYING || currentState === State.INTRO_LOADING) {
        onSkipClick();
      } else if (currentState === State.VID2_PLAYING) {
        onVid2SkipClick();
      }
    }
    if (e.key === 'm' || e.key === 'M') {
      if (currentState === State.INTRO_PLAYING) {
        toggleSound();
      } else if (currentState === State.VID2_PLAYING) {
        toggleVid2Sound();
      }
    }
  });

  // Initialize interactive tab systems
  initStageTabs();
  initStickyNav();
  initPageVisibility();
  initPaymentGateway();
  initSquadRegistrationWizard();

  // Start the experience & pre-warm vid2 buffer
  if (els.vid2) {
    els.vid2.preload = 'auto';
    els.vid2.load();
  }
  setState(State.INTRO_LOADING);
}

// ─── SQUAD REGISTRATION MULTI-STEP WIZARD ───
function initSquadRegistrationWizard() {
  const form = document.getElementById('squad-reg-form');
  if (!form) return;

  let currentStep = 1;
  let paymentVerified = false;

  const panels = {
    1: document.getElementById('panel-step-1'),
    2: document.getElementById('panel-step-2'),
    3: document.getElementById('panel-step-3'),
  };

  const stepTabs = {
    1: document.getElementById('step-tab-1'),
    2: document.getElementById('step-tab-2'),
    3: document.getElementById('step-tab-3'),
  };

  const connectorBars = {
    1: document.getElementById('stepper-bar-1'),
    2: document.getElementById('stepper-bar-2'),
  };

  // Nav buttons
  const btnNext1 = document.getElementById('btn-next-step-1');
  const btnPrev2 = document.getElementById('btn-prev-step-2');
  const btnNext2 = document.getElementById('btn-next-step-2');
  const btnPrev3 = document.getElementById('btn-prev-step-3');

  // Payment controls
  const wizardPayBtn = document.getElementById('wizard-payment-btn');
  const paymentStatusBox = document.getElementById('payment-status-box');
  const paymentStatusText = document.getElementById('payment-status-text');
  const btnVerifyPayment = document.getElementById('btn-verify-payment');

  // Success screen
  const successPanel = document.getElementById('reg-success-panel');
  const confirmedRegId = document.getElementById('confirmed-reg-id');
  const btnRegisterAnother = document.getElementById('btn-register-another');

  function updateStepperUI(step) {
    for (let i = 1; i <= 3; i++) {
      const tab = stepTabs[i];
      if (!tab) continue;

      if (i < step) {
        tab.classList.remove('active');
        tab.classList.add('completed');
      } else if (i === step) {
        tab.classList.remove('completed');
        tab.classList.add('active');
      } else {
        tab.classList.remove('active', 'completed');
      }
    }

    // Connectors
    if (connectorBars[1] && connectorBars[1].parentElement) {
      connectorBars[1].parentElement.classList.toggle('is-filled', step >= 2);
    }
    if (connectorBars[2] && connectorBars[2].parentElement) {
      connectorBars[2].parentElement.classList.toggle('is-filled', step >= 3);
    }
  }

  function showStep(step, scroll = true) {
    currentStep = step;

    // Toggle panels
    Object.keys(panels).forEach((k) => {
      const panel = panels[k];
      if (panel) {
        panel.classList.toggle('is-active', parseInt(k, 10) === step);
      }
    });

    updateStepperUI(step);

    if (scroll) {
      const section = document.getElementById('register-now');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    if (step === 3) {
      populateSummary();
    }
  }

  // Field validation helper
  function validateStep(stepNum) {
    const panel = panels[stepNum];
    if (!panel) return true;

    const requiredInputs = panel.querySelectorAll('input[required], select[required]');
    let isValid = true;
    let firstInvalid = null;

    requiredInputs.forEach((input) => {
      const group = input.closest('.form-group') || input.closest('.declaration-card');
      const val = input.value.trim();

      let fieldValid = val !== '';
      if (input.type === 'email' && fieldValid) {
        fieldValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      }
      if (input.type === 'tel' && fieldValid) {
        fieldValid = val.replace(/\D/g, '').length >= 10;
      }
      if (input.name === 'rulesAgree') {
        fieldValid = input.checked;
      }

      if (!fieldValid) {
        isValid = false;
        input.classList.add('is-invalid');
        if (group) group.classList.add('has-error');
        if (!firstInvalid) firstInvalid = input;
      } else {
        input.classList.remove('is-invalid');
        if (group) group.classList.remove('has-error');
      }
    });

    if (!isValid && firstInvalid) {
      firstInvalid.focus();
    }

    return isValid;
  }

  // Clear errors on input
  form.querySelectorAll('input, select').forEach((field) => {
    field.addEventListener('input', () => {
      field.classList.remove('is-invalid');
      const group = field.closest('.form-group') || field.closest('.declaration-card');
      if (group) group.classList.remove('has-error');
    });
    field.addEventListener('change', () => {
      field.classList.remove('is-invalid');
      const group = field.closest('.form-group') || field.closest('.declaration-card');
      if (group) group.classList.remove('has-error');
    });
  });

  // Populate Step 3 summary from inputs
  function populateSummary() {
    const teamName = document.getElementById('team-name')?.value || '—';
    const instName = document.getElementById('inst-name')?.value || '—';
    const leaderName = document.getElementById('leader-name')?.value || '—';
    const leaderIgn = document.getElementById('leader-ign')?.value || '—';

    const sumTeam = document.getElementById('sum-team-name');
    const sumInst = document.getElementById('sum-inst-name');
    const sumLeader = document.getElementById('sum-leader-name');
    const sumLeaderIgn = document.getElementById('sum-leader-ign');
    const rosterList = document.getElementById('sum-roster-list');

    if (sumTeam) sumTeam.textContent = teamName;
    if (sumInst) sumInst.textContent = instName;
    if (sumLeader) sumLeader.textContent = leaderName;
    if (sumLeaderIgn) sumLeaderIgn.textContent = leaderIgn;

    if (rosterList) {
      const p2Name = document.getElementById('p2-name')?.value || 'Player 2';
      const p2Ign = document.getElementById('p2-ign')?.value || '—';
      const p3Name = document.getElementById('p3-name')?.value || 'Player 3';
      const p3Ign = document.getElementById('p3-ign')?.value || '—';
      const p4Name = document.getElementById('p4-name')?.value || 'Player 4';
      const p4Ign = document.getElementById('p4-ign')?.value || '—';
      const p5Name = document.getElementById('p5-name')?.value;
      const p5Ign = document.getElementById('p5-ign')?.value;

      let html = `
        <div class="roster-preview-chip">
          <span class="chip-role">LEADER</span>
          <span class="chip-name">${leaderName}</span>
          <span class="chip-ign">${leaderIgn}</span>
        </div>
        <div class="roster-preview-chip">
          <span class="chip-role">P2</span>
          <span class="chip-name">${p2Name}</span>
          <span class="chip-ign">${p2Ign}</span>
        </div>
        <div class="roster-preview-chip">
          <span class="chip-role">P3</span>
          <span class="chip-name">${p3Name}</span>
          <span class="chip-ign">${p3Ign}</span>
        </div>
        <div class="roster-preview-chip">
          <span class="chip-role">P4</span>
          <span class="chip-name">${p4Name}</span>
          <span class="chip-ign">${p4Ign}</span>
        </div>
      `;

      if (p5Name && p5Name.trim() !== '') {
        html += `
          <div class="roster-preview-chip">
            <span class="chip-role">SUB</span>
            <span class="chip-name">${p5Name}</span>
            <span class="chip-ign">${p5Ign || '—'}</span>
          </div>
        `;
      }

      rosterList.innerHTML = html;
    }
  }

  // Step 1 -> Step 2
  if (btnNext1) {
    btnNext1.addEventListener('click', () => {
      if (validateStep(1)) {
        showStep(2);
      }
    });
  }

  // Step 2 -> Step 1
  if (btnPrev2) {
    btnPrev2.addEventListener('click', () => {
      showStep(1);
    });
  }

  // Step 2 -> Step 3
  if (btnNext2) {
    btnNext2.addEventListener('click', () => {
      if (validateStep(2)) {
        showStep(3);
      }
    });
  }

  // Step 3 -> Step 2
  if (btnPrev3) {
    btnPrev3.addEventListener('click', () => {
      showStep(2);
    });
  }

  // Stepper Header direct click navigation
  Object.keys(stepTabs).forEach((k) => {
    const tab = stepTabs[k];
    const stepNum = parseInt(k, 10);
    tab.addEventListener('click', () => {
      if (stepNum < currentStep) {
        showStep(stepNum);
      } else if (stepNum > currentStep) {
        if (currentStep === 1 && validateStep(1)) {
          if (stepNum === 2 || (stepNum === 3 && validateStep(2))) {
            showStep(stepNum);
          }
        } else if (currentStep === 2 && validateStep(2)) {
          showStep(3);
        }
      }
    });
  });

  // Payment button handling in Step 3
  function setPaymentVerified(verified) {
    paymentVerified = verified;
    if (paymentStatusBox) {
      paymentStatusBox.setAttribute('data-verified', verified ? 'true' : 'false');
    }
    if (paymentStatusText) {
      paymentStatusText.textContent = verified ? 'STATUS: PAYMENT VERIFIED ✓' : 'STATUS: PAYMENT PENDING';
    }
  }

  if (wizardPayBtn) {
    wizardPayBtn.addEventListener('click', () => {
      const paymentUrl = wizardPayBtn.getAttribute('data-payment-url');
      if (paymentUrl && paymentUrl !== '#' && paymentUrl.trim() !== '') {
        // Open payment portal in new tab
        window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        // Prompt verification
        setTimeout(() => {
          setPaymentVerified(true);
        }, 1500);
      } else {
        // If payment URL is not provided yet by user, open modal or simulate verification
        const modal = document.getElementById('payment-modal');
        if (modal) {
          modal.removeAttribute('hidden');
          modal.setAttribute('aria-hidden', 'false');
          void modal.offsetWidth;
          modal.classList.add('is-active');
        }
        // Also enable verify option
        setPaymentVerified(true);
      }
    });
  }

  if (btnVerifyPayment) {
    btnVerifyPayment.addEventListener('click', () => {
      setPaymentVerified(true);
    });
  }

  // Form submission handling
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateStep(3)) {
      return;
    }

    if (!paymentVerified) {
      alert('Please complete payment via "PROCEED TO PAYMENT PORTAL" or verify payment before submitting.');
      if (wizardPayBtn) wizardPayBtn.focus();
      return;
    }

    // Generate Confirmation Code
    const regId = 'BGMI-PRX-' + Math.floor(1000 + Math.random() * 9000);
    if (confirmedRegId) {
      confirmedRegId.textContent = regId;
    }

    // Hide form, display success confirmation
    form.style.display = 'none';
    if (successPanel) {
      successPanel.removeAttribute('hidden');
      successPanel.setAttribute('aria-hidden', 'false');
      successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // Register another squad reset
  if (btnRegisterAnother) {
    btnRegisterAnother.addEventListener('click', () => {
      form.reset();
      setPaymentVerified(false);
      form.style.display = 'block';
      if (successPanel) {
        successPanel.setAttribute('hidden', '');
        successPanel.setAttribute('aria-hidden', 'true');
      }
      showStep(1);
    });
  }
}

// ─── PAYMENT GATEWAY INTEGRATION & REDIRECT HANDLER ───
function initPaymentGateway() {
  const paymentBtn = document.getElementById('payment-btn');
  const modal = document.getElementById('payment-modal');
  const closeBtn = document.getElementById('payment-modal-close');
  const dismissBtn = document.getElementById('payment-modal-dismiss');
  const backdrop = document.getElementById('payment-modal-backdrop');

  if (!paymentBtn || !modal) return;

  function openPaymentModal() {
    modal.removeAttribute('hidden');
    modal.setAttribute('aria-hidden', 'false');
    // Force reflow for smooth CSS transition
    void modal.offsetWidth;
    modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function closePaymentModal() {
    modal.classList.remove('is-active');
    setTimeout(() => {
      if (!modal.classList.contains('is-active')) {
        modal.setAttribute('hidden', '');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    }, 250);
  }

  paymentBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const paymentUrl = paymentBtn.getAttribute('data-payment-url');
    // If a payment gateway platform URL is configured, redirect directly
    if (paymentUrl && paymentUrl !== '#' && paymentUrl.trim() !== '') {
      window.location.href = paymentUrl;
      return;
    }
    // Otherwise show the gateway integration modal
    openPaymentModal();
  });

  if (closeBtn) closeBtn.addEventListener('click', closePaymentModal);
  if (dismissBtn) dismissBtn.addEventListener('click', closePaymentModal);
  if (backdrop) backdrop.addEventListener('click', closePaymentModal);

  // Close on Escape if modal is active
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-active')) {
      closePaymentModal();
    }
  });
}

// Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
