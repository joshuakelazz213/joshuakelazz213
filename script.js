// ─── Falling Petals ─────────────────────────────────────────────────────────
const petalsCt = document.getElementById('petals');

for (let i = 0; i < 18; i++) {
  const p = document.createElement('div');
  p.className = 'petal';
  p.style.left            = Math.random() * 100 + 'vw';
  // Mulai pada posisi acak di lintasan agar kelopak langsung terlihat jatuh saat halaman dibuka.
  const duration = 8 + Math.random() * 8;
  p.style.animationDuration = duration + 's';
  p.style.animationDelay    = -(Math.random() * duration) + 's';
  p.style.width           = (6 + Math.random() * 6) + 'px';
  p.style.height          = (10 + Math.random() * 8) + 'px';
  p.style.opacity         = (0.3 + Math.random() * 0.5).toString();

  const hue = 340 + Math.random() * 20;
  p.style.background = `hsl(${hue}, 60%, 60%)`;

  petalsCt.appendChild(p);
}

// ─── Photo Upload ────────────────────────────────────────────────────────────
function loadPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const area = document.getElementById('photoArea');
    area.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;display:block;">`;
  };
  reader.readAsDataURL(file);
}

// ─── Scroll Reveal ───────────────────────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reason-card, .letter-body').forEach(el => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(24px)';
  el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  observer.observe(el);
});

/* ─── Moments With You: seamless infinite coverflow carousel ─────────────── */
const momentsTrack = document.getElementById('momentsTrack');
const dotsContainer = document.getElementById('carouselDots');
const prevButton = document.querySelector('.carousel-btn.prev');
const nextButton = document.querySelector('.carousel-btn.next');

if (momentsTrack && momentsTrack.querySelectorAll('.moment-card').length) {
  const originalCards = [...momentsTrack.querySelectorAll('.moment-card')];
  const total = originalCards.length;
  const copies = 5;
  const middleCopy = Math.floor(copies / 2);
  let activeIndex = 0;
  let physicalIndex = middleCopy * total;
  let settleTimer;
  let isRepositioning = false;
  const dots = [];

  // Build repeated copies. Re-centering happens only after a swipe settles,
  // so moving from photo 9 to photo 1 continues in the same direction.
  momentsTrack.innerHTML = '';
  const allCards = [];
  for (let copy = 0; copy < copies; copy++) {
    originalCards.forEach((original, index) => {
      const card = original.cloneNode(true);
      card.dataset.realIndex = String(index);
      if (copy !== middleCopy) {
        card.setAttribute('aria-hidden', 'true');
        card.classList.add('is-clone');
      }
      momentsTrack.appendChild(card);
      allCards.push(card);
    });
  }

  function centerCard(card, smooth = true) {
    if (!card) return;
    const left = card.offsetLeft - (momentsTrack.clientWidth - card.offsetWidth) / 2;
    momentsTrack.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
  }

  function paintActive(index) {
    physicalIndex = Math.max(0, Math.min(allCards.length - 1, index));
    activeIndex = Number(allCards[physicalIndex].dataset.realIndex);
    allCards.forEach((card, i) => {
      card.classList.toggle('is-active', i === physicalIndex);
      card.setAttribute('aria-current', i === physicalIndex ? 'true' : 'false');
    });
    dots.forEach((dot, i) => dot.classList.toggle('active', i === activeIndex));
  }

  function goToPhysical(index, smooth = true) {
    const safeIndex = Math.max(0, Math.min(allCards.length - 1, index));
    paintActive(safeIndex);
    centerCard(allCards[safeIndex], smooth);
  }

  function goToMoment(index, smooth = true) {
    const wrappedIndex = (index + total) % total;
    // Dot/card selection goes to the matching image in the middle copy.
    goToPhysical(middleCopy * total + wrappedIndex, smooth);
  }

  function settlePosition() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      const center = momentsTrack.scrollLeft + momentsTrack.clientWidth / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;
      allCards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(cardCenter - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      });
      paintActive(closestIndex);

      // If the user approaches either end of the repeated track, move to the
      // same photo in the middle copy without animation. The image stays put.
      if (closestIndex < total || closestIndex >= (copies - 1) * total) {
        const samePhotoInMiddle = middleCopy * total + Number(allCards[closestIndex].dataset.realIndex);
        isRepositioning = true;
        centerCard(allCards[samePhotoInMiddle], false);
        paintActive(samePhotoInMiddle);
        requestAnimationFrame(() => { isRepositioning = false; });
      }
    }, 110);
  }

  allCards.forEach((card, index) => {
    card.addEventListener('click', () => {
      const realIndex = Number(card.dataset.realIndex);
      // Clicking a side image moves in the shortest direction where possible.
      const delta = index - physicalIndex;
      if (Math.abs(delta) <= total / 2) goToPhysical(index);
      else goToMoment(realIndex);
    });
  });

  originalCards.forEach((card, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot' + (index === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Tampilkan foto ${index + 1}`);
    dot.addEventListener('click', () => goToMoment(index));
    dotsContainer.appendChild(dot);
    dots.push(dot);
  });

  prevButton?.addEventListener('click', () => goToPhysical(physicalIndex - 1));
  nextButton?.addEventListener('click', () => goToPhysical(physicalIndex + 1));
  momentsTrack.addEventListener('scroll', () => {
    if (!isRepositioning) settlePosition();
  }, { passive: true });
  window.addEventListener('resize', () => goToPhysical(physicalIndex, false));
  goToMoment(0, false);
}


// ─── Background music: autoplay + loop, without visible controls ────────────
const backgroundMusic = document.getElementById('backgroundMusic');

if (backgroundMusic) {
  backgroundMusic.volume = 0.65;

  const tryPlayMusic = () => {
    const playAttempt = backgroundMusic.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        // Some browsers block autoplay with sound until the visitor interacts.
      });
    }
  };

  // Try immediately, then retry after the visitor's first interaction if needed.
  tryPlayMusic();
  ['pointerdown', 'touchstart', 'keydown'].forEach(eventName => {
    window.addEventListener(eventName, tryPlayMusic, { once: true, passive: true });
  });
}
