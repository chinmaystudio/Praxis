/* ============================================================
   RESEARCHX — PRAXIS '26 INTERACTIVE CONTROLLER
   State Machine & Cinematic Timeline
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Master Audio Controls
  const masterAudioBtn = document.getElementById('master-audio-control');
  const audioLabel = document.getElementById('audio-label');
  
  // Phase 1: Thor Montage Elements (Starts Immediately on Load)
  const phaseMontage = document.getElementById('phase-montage');
  const montageVideo = document.getElementById('montage-video');
  const btnSkipMontage = document.getElementById('btn-skip-montage');

  // Phase 2: PRAXIS Logo Splash Elements (Shown for 1-2s after Montage)
  const praxisSplash = document.getElementById('phase-praxis-splash');
  const btnEnterSite = document.getElementById('btn-enter-site');
  const splashTimerSpan = document.getElementById('splash-timer');

  // Hero & Navigation Elements
  const heroSection = document.getElementById('hero');
  const heroLightningLayer = document.querySelector('.hero-lightning-layer');
  const btnExploreEvent = document.getElementById('btn-explore-event');
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const btnHeaderRegister = document.getElementById('btn-header-register');

  // Modal & CTAs
  const modal = document.getElementById('registration-modal');
  const modalClose = document.getElementById('modal-close');
  const regForm = document.getElementById('reg-form');
  const btnFooterRegister = document.getElementById('btn-footer-register');
  const btnOpenRulebook = document.getElementById('btn-open-rulebook');

  // Audio State: Default is always ON
  let isAudioMuted = false;

  function setAudioState(muted) {
    isAudioMuted = muted;
    if (montageVideo) {
      montageVideo.muted = muted;
      if (!muted) {
        montageVideo.volume = 1.0;
      }
    }
    
    if (muted) {
      masterAudioBtn.classList.add('muted');
      audioLabel.textContent = 'SOUND: OFF';
    } else {
      masterAudioBtn.classList.remove('muted');
      audioLabel.textContent = 'SOUND: ON';
    }
  }

  // Master Audio Button Click: toggle sound globally
  masterAudioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isAudioMuted || (montageVideo && montageVideo.muted)) {
      if (montageVideo) {
        montageVideo.muted = false;
        montageVideo.volume = 1.0;
      }
      setAudioState(false);
    } else {
      if (montageVideo) montageVideo.muted = true;
      setAudioState(true);
    }
  });

  /* ============================================================
     PHASE 1: THOR MONTAGE SEQUENCE (AUTOPLAYS FIRST)
     ============================================================ */
  let montageFinished = false;

  function startInitialThorMontage() {
    if (!phaseMontage || !montageVideo) return;
    phaseMontage.classList.add('active');
    montageVideo.currentTime = 0;
    
    // Default audio: ALWAYS ON
    isAudioMuted = false;
    montageVideo.defaultMuted = false;
    montageVideo.muted = false;
    montageVideo.volume = 1.0;
    masterAudioBtn.classList.remove('muted');
    audioLabel.textContent = 'SOUND: ON';
    montageFinished = false;

    // Fast-unlock listener on real user gesture (click, tap, keypress)
    const unlockAudioOnGesture = () => {
      if (montageFinished) return;
      if (montageVideo) {
        montageVideo.muted = false;
        montageVideo.volume = 1.0;
        if (montageVideo.paused) {
          montageVideo.play().catch(() => {});
        }
      }
      setAudioState(false);
      removeGestureListeners();
    };

    const gestureEvents = ['click', 'pointerdown', 'touchstart', 'keydown'];
    function addGestureListeners() {
      gestureEvents.forEach(evt => {
        window.addEventListener(evt, unlockAudioOnGesture, { once: true, capture: true, passive: true });
        document.addEventListener(evt, unlockAudioOnGesture, { once: true, capture: true, passive: true });
      });
    }
    function removeGestureListeners() {
      gestureEvents.forEach(evt => {
        window.removeEventListener(evt, unlockAudioOnGesture, { capture: true });
        document.removeEventListener(evt, unlockAudioOnGesture, { capture: true });
      });
    }

    // Attempt direct autoplay with sound
    const playPromise = montageVideo.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Direct unmuted playback succeeded!
          montageVideo.muted = false;
          montageVideo.volume = 1.0;
          setAudioState(false);
        })
        .catch(() => {
          // Browser requires gesture before unmuting; start video playing and unlock sound on first tap/click
          montageVideo.muted = true;
          montageVideo.play().catch(() => {});
          addGestureListeners();
        });
    }

    // Clicking anywhere on video / montage overlay to unmute
    phaseMontage.addEventListener('click', (e) => {
      if (e.target === btnSkipMontage) return;
      if (montageVideo) {
        montageVideo.muted = false;
        montageVideo.volume = 1.0;
        if (montageVideo.paused) {
          montageVideo.play().catch(() => {});
        }
      }
      setAudioState(false);
    });

    montageVideo.addEventListener('ended', () => {
      removeGestureListeners();
      endMontageToPraxis();
    }, { once: true });
  }

  /* ============================================================
     PHASE 2: TRANSITION TO PRAXIS LOGO SPLASH (1 - 2 SECONDS)
     ============================================================ */
  let praxisSplashDismissed = false;

  function endMontageToPraxis() {
    if (montageFinished) return;
    montageFinished = true;

    if (montageVideo) {
      montageVideo.pause();
    }

    // Make sure praxisSplash is ready and active before hiding montage
    if (praxisSplash) {
      praxisSplash.style.display = 'flex';
      praxisSplash.classList.add('active');
    }

    // Immediately remove montage without leaving a gap
    if (phaseMontage) {
      phaseMontage.classList.remove('active');
      phaseMontage.style.display = 'none';
    }

    startPraxisCountdown();
  }

  btnSkipMontage.addEventListener('click', (e) => {
    e.stopPropagation();
    endMontageToPraxis();
  });

  function startPraxisCountdown() {
    if (!praxisSplash) {
      revealHomePage();
      return;
    }

    let timeLeft = 2;
    if (splashTimerSpan) splashTimerSpan.textContent = `${timeLeft}s`;

    const countdownInterval = setInterval(() => {
      timeLeft--;
      if (splashTimerSpan) splashTimerSpan.textContent = `${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        dismissPraxisSplash();
      }
    }, 900);

    function handleManualDismiss(e) {
      if (e) e.stopPropagation();
      clearInterval(countdownInterval);
      dismissPraxisSplash();
    }

    if (btnEnterSite) {
      btnEnterSite.addEventListener('click', handleManualDismiss, { once: true });
    }

    praxisSplash.addEventListener('click', handleManualDismiss, { once: true });
  }

  function dismissPraxisSplash() {
    if (praxisSplashDismissed) return;
    praxisSplashDismissed = true;

    if (praxisSplash) {
      praxisSplash.classList.add('exiting');
      setTimeout(() => {
        praxisSplash.classList.remove('active');
        praxisSplash.style.display = 'none';
        revealHomePage();
      }, 450);
    } else {
      revealHomePage();
    }
  }

  /* ============================================================
     PHASE 3: HOME PAGE (HERO SECTION & EXPLORE EVENT ACTION)
     ============================================================ */
  function revealHomePage() {
    const mainPortal = document.getElementById('main-portal');
    if (mainPortal) {
      mainPortal.classList.add('portal-ready');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (heroSection) {
      heroSection.classList.add('hero-revealed');
    }
  }

  // When user clicks "EXPLORE EVENT", smoothly scroll to information sections in sequence
  btnExploreEvent.addEventListener('click', () => {
    // Trigger thunder surge flash on hero background
    if (heroLightningLayer) {
      heroLightningLayer.classList.remove('surge');
      void heroLightningLayer.offsetWidth; // Force reflow
      heroLightningLayer.classList.add('surge');
    }

    // Reveal navbar register CTA
    if (btnHeaderRegister) {
      btnHeaderRegister.classList.remove('hidden');
    }

    // Smoothly scroll down to the overview and information dossier
    const target = document.getElementById('overview') || document.getElementById('prizes');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Launch initial sequence on load
  startInitialThorMontage();

  /* ============================================================
     PHASE 5: DOSSIER & NAVIGATION
     ============================================================ */
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Once user scrolls past the hero section, reveal the Register button
    if (scrollY > 400 && btnHeaderRegister) {
      btnHeaderRegister.classList.remove('hidden');
    }

    // Scroll spy for active nav link & in-page event tabs
    const sections = document.querySelectorAll('section[id]');
    let current = 'hero';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 150;
      if (scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });


  // Registration Modal Handling
  function openModal() {
    modal.classList.add('open');
  }

  function closeModal() {
    modal.classList.remove('open');
  }

  if (btnHeaderRegister) btnHeaderRegister.addEventListener('click', openModal);
  if (btnFooterRegister) btnFooterRegister.addEventListener('click', openModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // --- Leader College & Registration Elements ---
  const leaderCollegeType = document.getElementById('leaderCollegeType');
  const leaderPccoeFields = document.getElementById('leader-pccoe-fields');
  const leaderOtherFields = document.getElementById('leader-other-fields');
  const leaderPRN = document.getElementById('leaderPRN');
  const leaderPCCOEEmail = document.getElementById('leaderPCCOEEmail');
  const leaderOtherCollegeName = document.getElementById('leaderOtherCollegeName');
  const leaderOtherEmail = document.getElementById('leaderOtherEmail');

  const teamSizeSelect = document.getElementById('teamSize');
  const blockMember1 = document.getElementById('block-member-1');
  const blockMember2 = document.getElementById('block-member-2');
  const blockMember3 = document.getElementById('block-member-3');
  const paymentFreeBox = document.getElementById('payment-free-box');
  const paymentPaidBox = document.getElementById('payment-paid-box');
  const paymentUTR = document.getElementById('paymentUTR');

  function updateLeaderCollegeView() {
    const isPccoe = leaderCollegeType.value === 'pccoe';
    if (isPccoe) {
      leaderPccoeFields.style.display = 'block';
      leaderOtherFields.style.display = 'none';
      if (leaderPRN) leaderPRN.required = true;
      if (leaderPCCOEEmail) leaderPCCOEEmail.required = true;
      if (leaderOtherCollegeName) leaderOtherCollegeName.required = false;
      if (leaderOtherEmail) leaderOtherEmail.required = false;
    } else {
      leaderPccoeFields.style.display = 'none';
      leaderOtherFields.style.display = 'block';
      if (leaderPRN) leaderPRN.required = false;
      if (leaderPCCOEEmail) leaderPCCOEEmail.required = false;
      if (leaderOtherCollegeName) leaderOtherCollegeName.required = true;
      if (leaderOtherEmail) leaderOtherEmail.required = true;
    }
    calculatePaymentStatus();
  }

  if (leaderCollegeType) {
    leaderCollegeType.addEventListener('change', updateLeaderCollegeView);
    updateLeaderCollegeView();
  }

  // --- OTP Verification Logic for PCCOE ---
  let generatedOTP = '4829';
  let isOtpVerified = false;
  const btnSendOtp = document.getElementById('btn-send-otp');
  const btnVerifyOtp = document.getElementById('btn-verify-otp');
  const otpInput = document.getElementById('otpInput');
  const otpStatus = document.getElementById('otpStatus');

  if (btnSendOtp) {
    btnSendOtp.addEventListener('click', () => {
      const emailVal = leaderPCCOEEmail.value.trim();
      if (!emailVal) {
        alert('Please enter your PCCOE Email ID first.');
        leaderPCCOEEmail.focus();
        return;
      }
      generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
      otpStatus.textContent = `📩 OTP sent to ${emailVal}! (For testing, use: ${generatedOTP})`;
      otpStatus.classList.remove('verified');
      alert(`🔐 ITSA OTP DISPATCHED!\n\nA 4-digit verification code has been generated for ${emailVal}.\n\nYour OTP is: ${generatedOTP}`);
      otpInput.value = generatedOTP; // auto-populate for effortless testing
    });
  }

  if (btnVerifyOtp) {
    btnVerifyOtp.addEventListener('click', () => {
      if (otpInput.value.trim() === generatedOTP) {
        isOtpVerified = true;
        otpStatus.textContent = '✅ PCCOE Email Verified Successfully!';
        otpStatus.classList.add('verified');
        alert('✅ SUCCESS: Your PCCOE email has been verified!');
      } else {
        alert('❌ Invalid OTP. Please check the code and try again.');
      }
    });
  }

  // --- Dynamic Member Blocks based on Team Size (2 to 4) ---
  function updateMemberFields() {
    if (!teamSizeSelect) return;
    const size = parseInt(teamSizeSelect.value, 10);
    // Member 1 is always required
    if (blockMember1) blockMember1.style.display = 'block';

    // Member 2 is shown for 3 or 4 members
    if (blockMember2) {
      blockMember2.style.display = size >= 3 ? 'block' : 'none';
      const m2Name = document.getElementById('m2Name');
      const m2Email = document.getElementById('m2Email');
      if (m2Name) m2Name.required = size >= 3;
      if (m2Email) m2Email.required = size >= 3;
    }

    // Member 3 is shown for 4 members
    if (blockMember3) {
      blockMember3.style.display = size >= 4 ? 'block' : 'none';
      const m3Name = document.getElementById('m3Name');
      const m3Email = document.getElementById('m3Email');
      if (m3Name) m3Name.required = size >= 4;
      if (m3Email) m3Email.required = size >= 4;
    }

    calculatePaymentStatus();
  }

  if (teamSizeSelect) {
    teamSizeSelect.addEventListener('change', updateMemberFields);
    updateMemberFields();
  }

  // --- Member College Selectors (PRN vs College Name) ---
  const memberCollegeSelects = document.querySelectorAll('.member-college-select');
  memberCollegeSelects.forEach(select => {
    select.addEventListener('change', () => {
      const memberIdx = select.dataset.member;
      const isPccoe = select.value === 'pccoe';
      const prnGroup = document.getElementById(`m${memberIdx}-prn-group`);
      const collegeGroup = document.getElementById(`m${memberIdx}-college-group`);
      const prnInput = document.getElementById(`m${memberIdx}PRN`);
      const collegeInput = document.getElementById(`m${memberIdx}CollegeName`);

      if (isPccoe) {
        if (prnGroup) prnGroup.style.display = 'flex';
        if (collegeGroup) collegeGroup.style.display = 'none';
        if (prnInput) prnInput.required = true;
        if (collegeInput) collegeInput.required = false;
      } else {
        if (prnGroup) prnGroup.style.display = 'none';
        if (collegeGroup) collegeGroup.style.display = 'flex';
        if (prnInput) prnInput.required = false;
        if (collegeInput) collegeInput.required = true;
      }
      calculatePaymentStatus();
    });
  });

  // --- Dynamic Payment Rules (PCCOE = ₹0, Non-PCCOE = ₹200) ---
  function calculatePaymentStatus() {
    if (!leaderCollegeType || !paymentFreeBox || !paymentPaidBox) return;

    let hasNonPccoe = leaderCollegeType.value === 'other';
    const size = parseInt(teamSizeSelect.value, 10);

    // Check member 1
    const m1College = document.getElementById('m1CollegeType');
    if (m1College && m1College.value === 'other') hasNonPccoe = true;

    // Check member 2 if active
    if (size >= 3) {
      const m2College = document.getElementById('m2CollegeType');
      if (m2College && m2College.value === 'other') hasNonPccoe = true;
    }

    // Check member 3 if active
    if (size >= 4) {
      const m3College = document.getElementById('m3CollegeType');
      if (m3College && m3College.value === 'other') hasNonPccoe = true;
    }

    if (hasNonPccoe) {
      paymentFreeBox.style.display = 'none';
      paymentPaidBox.style.display = 'block';
      if (paymentUTR) paymentUTR.required = true;
    } else {
      paymentFreeBox.style.display = 'block';
      paymentPaidBox.style.display = 'none';
      if (paymentUTR) paymentUTR.required = false;
    }
  }

  // --- Form Submission & Confirmation ---
  regForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Check PCCOE OTP verification
    if (leaderCollegeType.value === 'pccoe' && !isOtpVerified) {
      alert('⚠️ Verification Required: Please verify your PCCOE Email via OTP before submitting.');
      otpInput.focus();
      return;
    }

    const teamName = document.getElementById('teamName').value;
    const leaderName = document.getElementById('leaderName').value;
    const teamSize = document.getElementById('teamSize').value;
    const leaderEmail = leaderCollegeType.value === 'pccoe' 
      ? document.getElementById('leaderPCCOEEmail').value 
      : document.getElementById('leaderOtherEmail').value;
    const isFree = paymentPaidBox.style.display === 'none';
    const refId = 'RX26-' + Math.floor(100000 + Math.random() * 900000);

    alert(`⚡ SQUAD ENLISTED FOR RESEARCHX — PRAXIS '26!\n\nReference ID: ${refId}\nTeam: ${teamName} (${teamSize} Members)\nLeader: ${leaderName}\nStatus: ${isFree ? 'FREE (PCCOE Squad)' : 'PAID (₹200 Confirmed)'}\n\n📧 A confirmation email has been dispatched to ${leaderEmail} containing full squad details, reference ID, guidelines, and the official WhatsApp Community link!`);
    regForm.reset();
    isOtpVerified = false;
    if (otpStatus) {
      otpStatus.textContent = '⚡ Email verification required for PCCOE leaders';
      otpStatus.classList.remove('verified');
    }
    updateLeaderCollegeView();
    updateMemberFields();
    closeModal();
  });

  // Open Rulebook PDF
  if (btnOpenRulebook) {
    btnOpenRulebook.addEventListener('click', () => {
      window.open('/PRAXIS_ResearchX_Enhanced_Creative_Rulebook.pdf', '_blank');
    });
  }
});
