import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export function mountGardenMotion(scope) {
  const root = scope;
  const garden = scope.querySelector('.garden');
  const backdrop = scope.querySelector('.garden-backdrop');
  const panels = [...garden.querySelectorAll('.walk-panel')];
  const rsvp = scope.querySelector('#rsvp');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const compactViewport = matchMedia('(max-height: 480px)');
  const touchInput = matchMedia('(any-pointer: coarse)');
  const journey = scope.querySelector('.garden-journey');
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
      const outsideScene = progress <= (stage.in?.[0] ?? -1) ||
        (!stage.remainingOpacity && progress >= stage.out[1]);
      stage.panel.classList.toggle('is-outside-scene', outsideScene);
      if (visible) activeStage = stage;
      if (visible && pendingFocus === stage) {
        stage.panel.querySelector('h1, h2').focus({ preventScroll: true });
        pendingFocus = undefined;
      }
    }
    garden.classList.toggle('is-past-foliage', progress >= .31);
    garden.classList.toggle('is-past-gate', progress >= .375);
  }

  function walkDistance(journey) {
    return Math.max(1, journey.offsetHeight - garden.offsetHeight);
  }

  function arrivalPosition() {
    return window.scrollY + rsvp.getBoundingClientRect().top;
  }

  function startGsap() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    // Native touch already supplies momentum. A second scrub tween makes the garden trail it.
    const nativeTouch = touchInput.matches || ScrollTrigger.isTouch === 1;
    const lenis = !nativeTouch ? new Lenis({ autoRaf: false, lerp: .12 }) : null;
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
        scrub: nativeTouch ? true : .32,
        fastScrollEnd: !nativeTouch
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
      }
      const { start, end } = trigger;
      const position = chapter
        ? start + (end - start) * chapter.arrive
        : arrivalPosition() + arrivalOffset;
      if (lenis) {
        // A resize or restoring a fragment can change the native scroll position between clicks.
        lenis.resize();
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
    const previousView = motionConfigured
      ? (wasAnimated ? captureView() : staticView)
      : (!location.hash && window.scrollY > 0 ? captureView() : null);
    motionConfigured = true;
    stopMotion?.();
    stopMotion = undefined;
    scrollToStage = undefined;
    pendingFocus = undefined;
    const animated = !motionPreference.matches && !compactViewport.matches;
    root.classList.toggle('has-motion', animated);
    if (!animated) {
      for (const panel of panels) panel.inert = false;
      garden.classList.remove('is-past-gate', 'is-past-foliage');
      if (previousView) {
        const top = window.scrollY + previousView.element.getBoundingClientRect().top + previousView.offset;
        window.scrollTo({ top, behavior: 'auto' });
      }
      staticView = previousView ?? captureView();
      return;
    }

    syncStages(0);
    stopMotion = startGsap();
    if (previousView) {
      const stage = stages.find(item => item.panel === previousView.element);
      scrollToStage(stage, true, previousView.offset);
    }
  }


  function followLink(event) {
    const link = event.target.closest('.walk-forward');
    if (!link || !scrollToStage || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    const chapter = chapterById.get(link.hash.slice(1));
    pendingFocus = event.detail === 0 ? chapter : undefined;
    if (event.detail !== 0 && document.activeElement === link) link.blur();
    scrollToStage(chapter);
    if (!chapter && event.detail === 0) rsvp.querySelector('#rsvp-title').focus({ preventScroll: true });
  }

  function rememberStaticView() {
    if (!root.classList.contains('has-motion')) staticView = captureView();
  }

  garden.addEventListener('click', followLink);
  configureMotion();
  const initialFragment = requestAnimationFrame(followFragment);
  motionPreference.addEventListener('change', configureMotion);
  compactViewport.addEventListener('change', configureMotion);
  touchInput.addEventListener('change', configureMotion);
  window.addEventListener('hashchange', followFragment);
  window.addEventListener('scroll', rememberStaticView, { passive: true });

  return () => {
    cancelAnimationFrame(initialFragment);
    stopMotion?.();
    garden.removeEventListener('click', followLink);
    motionPreference.removeEventListener('change', configureMotion);
    compactViewport.removeEventListener('change', configureMotion);
    touchInput.removeEventListener('change', configureMotion);
    window.removeEventListener('hashchange', followFragment);
    window.removeEventListener('scroll', rememberStaticView);
    root.classList.remove('has-motion');
    garden.classList.remove('is-past-gate', 'is-past-foliage');
    for (const panel of panels) {
      panel.inert = false;
      panel.classList.remove('is-outside-scene');
    }
  };
}
