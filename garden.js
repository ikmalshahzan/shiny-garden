(() => {
  'use strict';

  const root = document.documentElement;
  const garden = document.querySelector('.garden');
  const backdrop = document.querySelector('.garden-backdrop');
  const panels = [...garden.querySelectorAll('.walk-panel')];
  const rsvp = document.getElementById('rsvp');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const compactViewport = matchMedia('(max-height: 480px)');
  const walkScreens = 6.25;
  const threshold = { panel: panels[0], out: [.055, .18], active: [0, .13], arrive: 0 };
  const chapters = [
    { panel: panels[1], in: [.32, .40], out: [.465, .525], active: [.365, .497], arrive: .419 },
    { panel: panels[2], in: [.50, .575], out: [.633, .69], active: [.542, .663], arrive: .595 },
    { panel: panels[3], in: [.665, .735], out: [.788, .844], active: [.705, .818], arrive: .750 },
    { panel: panels[4], in: [.818, .89], out: [.951, 1], active: [.859, .977], arrive: .907, remainingOpacity: .3 }
  ];
  const stages = [threshold, ...chapters];
  const chapterById = new Map(chapters.map(chapter => [chapter.panel.id, chapter]));
  const foliage = [...garden.querySelectorAll('.foreground')];
  const gate = garden.querySelector('.gate-camera');
  const shade = garden.querySelector('.threshold-shade');
  const forest = gate.querySelector('.forest-layer');
  const arch = gate.querySelector('.arch-layer');
  const landscape = backdrop.querySelector('.landscape');
  const flowers = backdrop.querySelector('.aisle-flowers');
  const frame = garden.querySelector('.garden-frame');
  const progressLine = garden.querySelector('.journey-progress span');

  // The doorway and its cutout advance together. Near plants pass faster than the clearing.
  const phases = [];
  const initial = new Map();

  function motion(targets, property, from, to, start, end, ease = 'sine.inOut') {
    const elements = [targets].flat();
    phases.push({ elements, property, from, to, start, end, ease });
    for (const element of elements) {
      if (!initial.has(element)) initial.set(element, {});
      initial.get(element)[property] ??= from;
    }
  }

  motion(foliage[0], 'xPercent', 0, -82, .06, .31);
  motion(foliage[1], 'xPercent', 0, 82, .06, .31);
  motion(foliage, 'scale', 1, 1.8, .06, .31);
  motion(foliage, 'yPercent', 0, -5, .06, .31);
  motion(foliage, 'opacity', 1, 0, .20, .31);
  motion(gate, 'scale', 1, 2.5, .065, .365);
  motion(gate, 'yPercent', 0, -3, .065, .365);
  motion(forest, 'opacity', 1, 0, .245, .36);
  motion(arch, 'opacity', 1, 0, .295, .375);
  motion(shade, 'opacity', 1, 0, .17, .375);
  motion(landscape, 'scale', 1, 1.25, 0, 1, 'none');
  motion(flowers, 'scale', 1, 1.58, .19, 1, 'none');
  motion(flowers, 'yPercent', 0, 9, .19, 1, 'none');
  motion(frame, 'opacity', 1, 0, .90, 1);
  motion(progressLine, 'scaleX', 0, 1, 0, 1, 'none');

  for (const stage of stages) {
    const copy = stage.panel.querySelector('.walk-copy');
    const cue = stage.panel.querySelector('.walk-forward');
    if (stage.in) {
      motion([copy, cue], 'opacity', 0, 1, ...stage.in);
      motion(copy, 'scale', .90, 1, ...stage.in);
      motion(copy, 'yPercent', 8, 0, ...stage.in);
    }
    motion(copy, 'opacity', 1, stage.remainingOpacity ?? 0, ...stage.out);
    motion(cue, 'opacity', 1, 0, ...stage.out);
    motion(copy, 'scale', 1, stage === threshold ? 1.22 : 1.10, ...stage.out);
    motion(copy, 'yPercent', 0, -7, ...stage.out);
  }

  let scrollToStage;
  let stopMotion;
  let pendingFocus;
  let activeStage = threshold;
  let motionConfigured = false;
  let staticView;

  function syncStages(progress) {
    for (const stage of stages) {
      const [open, close] = stage.active;
      const visible = progress >= open && progress <= close;
      const inactive = !visible;
      if (stage.panel.inert !== inactive) stage.panel.inert = inactive;
      if (visible) activeStage = stage;
      if (visible && pendingFocus === stage) {
        stage.panel.querySelector('h1, h2').focus({ preventScroll: true });
        pendingFocus = undefined;
      }
    }
    garden.classList.toggle('is-past-gate', progress >= .375);
  }

  function walkDistance(journey) {
    return Math.max(1, journey.offsetHeight - garden.offsetHeight);
  }

  function arrivalPosition() {
    return window.scrollY + rsvp.getBoundingClientRect().top;
  }

  function startGsap(gsap, ScrollTrigger, journey) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    // Lenis softens the wheel. Native touch already has momentum.
    const lenis = window.Lenis ? new window.Lenis({ autoRaf: false, lerp: .12 }) : null;
    const updateLenis = (seconds) => lenis.raf(seconds * 1000);
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(updateLenis);
      gsap.ticker.lagSmoothing(0);
    }

    const enterLabel = threshold.panel.querySelector('.enter-cue-label');
    const enterPulse = gsap.to(enterLabel, {
      opacity: .7,
      duration: 1.6,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      paused: threshold.panel.inert
    });
    for (const [element, values] of initial) gsap.set(element, values);
    const walk = gsap.timeline({
      onUpdate() {
        syncStages(this.progress());
        const inactive = threshold.panel.inert;
        if (enterPulse.paused() !== inactive) enterPulse.paused(inactive);
      },
      scrollTrigger: {
        id: 'garden-walk',
        trigger: journey,
        start: 'top top',
        end: () => '+=' + walkDistance(journey),
        scrub: ScrollTrigger.isTouch === 1 ? .45 : .32,
        fastScrollEnd: true
      }
    });

    for (const { elements, property, from, to, start, end, ease } of phases) {
      walk.fromTo(elements, { [property]: from }, {
        [property]: to,
        duration: end - start,
        ease,
        immediateRender: false
      }, start);
    }

    ScrollTrigger.refresh();
    scrollToStage = (chapter, instant = false, arrivalOffset = 0) => {
      const trigger = walk.scrollTrigger;
      if (Math.abs(trigger.end - trigger.start - walkDistance(journey)) > 2) {
        ScrollTrigger.refresh();
        lenis?.resize();
      }
      const { start, end } = trigger;
      const position = chapter
        ? start + (end - start) * chapter.arrive
        : arrivalPosition() + arrivalOffset;
      if (lenis) {
        lenis.scrollTo(position, {
          duration: chapter === chapters[0] ? 1.85 : 1.15,
          easing: (time) => (1 - Math.cos(Math.PI * time)) / 2,
          immediate: instant
        });
      } else {
        window.scrollTo({ top: position, behavior: instant ? 'auto' : 'smooth' });
      }
      if (instant) {
        ScrollTrigger.update();
        trigger.getTween()?.progress(1);
      }
    };

    return () => {
      walk.scrollTrigger.kill(true);
      walk.kill();
      enterPulse.kill();
      gsap.set(enterLabel, { clearProps: 'opacity' });
      gsap.set([...initial.keys()], { clearProps: 'transform,opacity' });
      if (lenis) {
        gsap.ticker.remove(updateLenis);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
      }
    };
  }

  // Both renderers use the same sticky stage and scroll distance.
  function startNativeWalk(journey) {
    let frame = 0;
    let start = 0;
    let distance = 1;
    let previousProgress = -1;
    const values = new Map([...initial].map(([element, state]) => [element, { ...state }]));

    function render() {
      frame = 0;
      const progress = Math.max(0, Math.min(1, (window.scrollY - start) / distance));
      if (progress === previousProgress) return;
      previousProgress = progress;
      for (const [element, state] of initial) Object.assign(values.get(element), state);
      for (const { elements, property, from, to, start, end, ease } of phases) {
        if (progress < start) continue;
        const part = Math.min(1, (progress - start) / (end - start));
        const eased = ease === 'none' ? part : (1 - Math.cos(Math.PI * part)) / 2;
        for (const element of elements) values.get(element)[property] = from + (to - from) * eased;
      }
      for (const [element, { opacity, xPercent = 0, yPercent = 0, scale = 1, scaleX = 1 }] of values) {
        if (opacity !== undefined && element.style.opacity !== String(opacity)) element.style.opacity = opacity;
        const transform = 'translate(' + xPercent + '%, ' + yPercent + '%) scale(' + scale + ') scaleX(' + scaleX + ')';
        if (element.style.transform !== transform) element.style.transform = transform;
      }
      syncStages(progress);
    }

    function requestRender() {
      if (!frame) frame = requestAnimationFrame(render);
    }

    function measure() {
      start = window.scrollY + journey.getBoundingClientRect().top;
      distance = walkDistance(journey);
      requestRender();
    }

    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', measure);
    measure();
    scrollToStage = (chapter, instant = false, arrivalOffset = 0) => {
      const position = chapter
        ? start + distance * chapter.arrive
        : arrivalPosition() + arrivalOffset;
      window.scrollTo({ top: position, behavior: instant ? 'auto' : 'smooth' });
    };

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestRender);
      window.removeEventListener('resize', measure);
      for (const element of initial.keys()) {
        element.style.removeProperty('opacity');
        element.style.removeProperty('transform');
      }
    };
  }

  function followFragment() {
    const chapter = chapterById.get(location.hash.slice(1));
    if (chapter || location.hash === '#rsvp') scrollToStage?.(chapter, true);
  }

  function captureView() {
    const arrivalTop = rsvp.getBoundingClientRect().top;
    if (arrivalTop < window.innerHeight / 3) return { element: rsvp, offset: Math.max(0, -arrivalTop) };
    if (root.classList.contains('has-motion')) return { element: activeStage.panel, offset: 0 };
    const chapter = panels.find(panel => panel.getBoundingClientRect().bottom > window.innerHeight / 2);
    return { element: chapter ?? rsvp, offset: 0 };
  }

  function configureMotion() {
    const wasAnimated = root.classList.contains('has-motion');
    const previousView = motionConfigured ? (wasAnimated ? captureView() : staticView) : null;
    motionConfigured = true;
    stopMotion?.();
    stopMotion = undefined;
    scrollToStage = undefined;
    pendingFocus = undefined;
    const animated = !motionPreference.matches && !compactViewport.matches;
    root.classList.toggle('has-motion', animated);
    if (!animated) {
      for (const panel of panels) panel.inert = false;
      garden.classList.remove('is-past-gate');
      if (previousView) {
        const top = window.scrollY + previousView.element.getBoundingClientRect().top + previousView.offset;
        window.scrollTo({ top, behavior: 'auto' });
      }
      staticView = previousView ?? captureView();
      return;
    }

    syncStages(0);
    const journey = document.createElement('div');
    journey.className = 'garden-journey';
    journey.style.setProperty('--walk-screens', walkScreens);
    garden.before(journey);
    journey.append(garden);
    const stop = window.gsap && window.ScrollTrigger
      ? startGsap(window.gsap, window.ScrollTrigger, journey)
      : startNativeWalk(journey);
    stopMotion = () => {
      stop();
      journey.replaceWith(garden);
    };
    if (previousView) {
      const stage = stages.find(item => item.panel === previousView.element);
      scrollToStage(stage, true, previousView.offset);
    }
  }

  const pollen = backdrop.querySelector('.pollen');
  for (let index = 0; index < 18; index += 1) {
    const particle = document.createElement('i');
    particle.style.setProperty('--x', (8 + (index * 17.7) % 85) + '%');
    particle.style.setProperty('--y', (18 + (index * 13.1) % 67) + '%');
    particle.style.setProperty('--size', (2 + index % 4) + 'px');
    particle.style.setProperty('--period', (8 + index % 7) + 's');
    particle.style.setProperty('--delay', (-index * .73) + 's');
    particle.style.setProperty('--drift', ((index % 2 ? -1 : 1) * (14 + index % 6 * 5)) + 'px');
    pollen.append(particle);
  }

  garden.addEventListener('click', (event) => {
    const link = event.target.closest('.walk-forward');
    if (!link || !scrollToStage || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    const chapter = chapterById.get(link.hash.slice(1));
    pendingFocus = event.detail === 0 ? chapter : undefined;
    scrollToStage(chapter);
    if (!chapter && event.detail === 0) document.getElementById('rsvp-title').focus({ preventScroll: true });
  });
  configureMotion();
  if (location.hash) requestAnimationFrame(followFragment);
  motionPreference.addEventListener('change', configureMotion);
  compactViewport.addEventListener('change', configureMotion);
  window.addEventListener('hashchange', followFragment);
  window.addEventListener('scroll', () => {
    if (!root.classList.contains('has-motion') && (motionPreference.matches || compactViewport.matches)) {
      staticView = captureView();
    }
  }, { passive: true });

  const form = rsvp.querySelector('.rsvp-form');
  const canAnimateRsvp = () => !motionPreference.matches && typeof form.animate === 'function';

  if ('IntersectionObserver' in window) {
    const arrival = new IntersectionObserver(([entry], observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (!canAnimateRsvp()) return;
      const keyframes = [{ opacity: .48, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }];
      form.animate(keyframes, { duration: 640, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    }, { threshold: .18 });
    arrival.observe(rsvp);
  }

  const choices = form.querySelector('.rsvp-choices');
  const sleeve = form.querySelector('.envelope-letter-sleeve');
  const letter = form.querySelector('.rsvp-letter');
  const replyLabel = letter.querySelector('#rsvp-reply-label');
  const receipt = form.querySelector('.rsvp-receipt');
  const accept = choices.querySelector('[data-attendance="yes"]');
  const decline = choices.querySelector('[data-attendance="no"]');
  const nameField = form.elements.namedItem('name');
  const guestsField = form.elements.namedItem('guests');
  const paxField = letter.querySelector('.pax-field');
  const invitationTitle = rsvp.querySelector('.rsvp-invitation-title');
  const confirmationTitle = rsvp.querySelector('.rsvp-confirmation-title');
  const status = form.querySelector('.form-status');
  const help = form.querySelector('.form-help');
  const storageKey = 'adani-ikmal-rsvp';
  const paperEase = 'cubic-bezier(.22, 1, .36, 1)';
  let attendance;
  let paperMotion;

  function showRsvpStep(step) {
    form.dataset.step = step;
    choices.hidden = step !== 'choices';
    sleeve.hidden = step !== 'details' && step !== 'sealing';
    letter.disabled = step !== 'details';
    const complete = step === 'complete';
    invitationTitle.hidden = complete;
    confirmationTitle.hidden = !complete;
    help.hidden = step === 'sealing' || complete;
    status.textContent = '';
  }

  function animateLetter(open) {
    const style = getComputedStyle(letter);
    const current = { opacity: Number(style.opacity), transform: style.transform };
    const inside = { opacity: .85, transform: `translateY(${letter.offsetHeight}px) scale(.92)` };
    const outside = { opacity: 1, transform: 'translateY(0) scale(1)' };
    paperMotion?.cancel();
    paperMotion = letter.animate(open ? [inside, outside] : [current, inside], {
      duration: open ? 610 : 480,
      delay: open ? 175 : 0,
      fill: 'both',
      easing: open ? paperEase : 'cubic-bezier(.45, 0, .65, 1)'
    });
    return paperMotion;
  }

  async function sealResponse(response) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(response));
    } catch {
      status.textContent = 'This browser couldn’t save your reply. Please try again.';
      return;
    }

    showRsvpStep('sealing');
    if (canAnimateRsvp()) await animateLetter(false).finished.catch(() => {});
    showRsvpStep('complete');
    paperMotion?.cancel();
    receipt.textContent = response.attendance === 'yes' ? 'We’re so excited to celebrate with you!' : 'We appreciate your reply.';
    if (canAnimateRsvp()) receipt.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, delay: 240, fill: 'backwards', easing: paperEase });
    receipt.focus({ preventScroll: true });
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (typeof saved?.name === 'string' && saved.name.trim() && ['yes', 'no'].includes(saved.attendance)) {
      nameField.value = saved.name;
      const guests = Number(saved.guests);
      if (Number.isSafeInteger(guests) && guests > 0) guestsField.value = String(guests);
    }
  } catch {
    // Start at the choices when a saved response cannot be read.
  }

  for (const button of [accept, decline]) {
    button.disabled = false;
    button.addEventListener('click', (event) => {
      attendance = button.dataset.attendance;
      const accepted = attendance === 'yes';
      replyLabel.textContent = accepted ? 'Accept RSVP' : 'Decline RSVP';
      paxField.hidden = !accepted;
      guestsField.disabled = !accepted;
      showRsvpStep('details');
      if (canAnimateRsvp()) animateLetter(true);
      const focusTarget = event.detail !== 0 && matchMedia('(pointer: coarse)').matches ? letter : nameField;
      focusTarget.focus({ preventScroll: true });
    });
  }

  form.querySelector('[data-rsvp-back]').addEventListener('click', () => {
    showRsvpStep('choices');
    paperMotion?.cancel();
    const previousChoice = attendance === 'yes' ? accept : decline;
    previousChoice.focus({ preventScroll: true });
  });

  form.addEventListener('input', () => { status.textContent = ''; });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (form.dataset.step !== 'details') return;
    nameField.value = nameField.value.trim();
    if (!form.reportValidity()) return;
    const response = { attendance, name: nameField.value };
    if (attendance === 'yes') response.guests = guestsField.value;
    sealResponse(response);
  });
})();
