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


initStageTabs();
initStickyNav();
