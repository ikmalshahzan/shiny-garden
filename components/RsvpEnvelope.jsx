'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { assetPath } from '../lib/assets';
import { saveRsvp, rsvpEndpoint, previewRsvp } from '../lib/rsvp-client';

const storageKey = 'adani-ikmal-rsvp';
const paperEase = 'cubic-bezier(.22, 1, .36, 1)';

function canAnimate(element) {
  return typeof element.animate === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function RsvpEnvelope({ eventId }) {
  const [step, setStep] = useState('choices');
  const [attendance, setAttendance] = useState('yes');
  const [name, setName] = useState('');
  const [guests, setGuests] = useState('1');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const section = useRef(null);
  const form = useRef(null);
  const letter = useRef(null);
  const nameField = useRef(null);
  const receipt = useRef(null);
  const acceptButton = useRef(null);
  const declineButton = useRef(null);
  const focusFieldOnOpen = useRef(false);
  const focusChoiceOnReturn = useRef(false);
  const submission = useRef(null);
  const previousPaper = useRef(null);
  const detailsVisible = step === 'details' || step === 'sealing';
  const accepted = attendance === 'yes';
  const complete = step === 'complete';

  useEffect(() => {
    setReady(true);
    if (previewRsvp) {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (typeof saved?.name === 'string') setName(saved.name);
        if (Number.isSafeInteger(Number(saved?.guests)) && Number(saved.guests) > 0) setGuests(String(saved.guests));
      } catch {
        // The form remains usable when a local preview has no saved reply.
      }
    }

    let entrance;
    const observer = typeof IntersectionObserver === 'function' && new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (canAnimate(form.current)) entrance = form.current.animate(
        [{ opacity: .48, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 640, easing: paperEase }
      );
    }, { threshold: .18 });
    observer?.observe?.(section.current);
    return () => {
      observer?.disconnect?.();
      entrance?.cancel();
      submission.current?.abort();
    };
  }, []);

  useLayoutEffect(() => {
    if (step === 'choices' && focusChoiceOnReturn.current) {
      (accepted ? acceptButton : declineButton).current?.focus({ preventScroll: true });
      focusChoiceOnReturn.current = false;
    }
    if (!detailsVisible) return;
    const paper = letter.current;
    const opening = step === 'details';
    if (opening) {
      const focusTarget = focusFieldOnOpen.current ? nameField.current : paper;
      focusTarget.focus({ preventScroll: true });
    }
    if (!canAnimate(paper)) {
      if (!opening) setStep('complete');
      return;
    }

    const tucked = { opacity: .85, transform: `translateY(${paper.offsetHeight}px) scale(.92)` };
    const exposed = { opacity: 1, transform: 'translateY(0) scale(1)' };
    const animation = paper.animate(opening ? [tucked, exposed] : [previousPaper.current ?? exposed, tucked], {
      duration: opening ? 610 : 480,
      delay: opening ? 175 : 0,
      fill: 'both',
      easing: opening ? paperEase : 'cubic-bezier(.45, 0, .65, 1)',
    });
    if (!opening) animation.finished.then(() => setStep('complete'), () => {});
    return () => animation.cancel();
  }, [step, accepted, detailsVisible]);

  useEffect(() => {
    if (!complete) return;
    const message = receipt.current;
    message.focus({ preventScroll: true });
    if (!canAnimate(message)) return;
    const animation = message.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 360, delay: 240, fill: 'backwards', easing: paperEase,
    });
    return () => animation.cancel();
  }, [complete]);

  function choose(event, response) {
    setAttendance(response);
    setError('');
    focusFieldOnOpen.current = event.detail === 0 || !matchMedia('(pointer: coarse)').matches;
    setStep('details');
  }

  async function confirm(event) {
    event.preventDefault();
    if (step !== 'details' || submission.current) return;
    const replyName = name.trim();
    if (!replyName) {
      setError('Please enter your name.');
      nameField.current.focus();
      return;
    }

    const reply = { eventId, attendance, name: replyName, guests: accepted ? Number(guests) : 0 };
    const controller = new AbortController();
    submission.current = controller;
    setSaving(true);
    setError('');
    try {
      if (rsvpEndpoint) await saveRsvp(reply, controller.signal);
      else if (previewRsvp) localStorage.setItem(storageKey, JSON.stringify(reply));
      else throw new Error('Online RSVP is not open yet.');
      if (controller.signal.aborted) return;
      const appearance = getComputedStyle(letter.current);
      previousPaper.current = { opacity: Number(appearance.opacity), transform: appearance.transform };
      setStep('sealing');
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message || 'Your reply could not be saved. Please try again.');
    } finally {
      if (!controller.signal.aborted) setSaving(false);
      submission.current = null;
    }
  }

  return (
    <section ref={section} className="rsvp" id="rsvp" aria-labelledby="rsvp-title">
      <form ref={form} className="rsvp-form" onSubmit={confirm} data-step={step}>
        <h2 className="rsvp-heading" id="rsvp-title" tabIndex={-1}>
          {complete ? <>Thank <em>you!</em></> : <>Will you <em>join us?</em></>}
        </h2>
        <div className="envelope-stage">
          <div className="rsvp-envelope">
            <div className="envelope-pocket" aria-hidden="true" />
            <div className="envelope-flap" aria-hidden="true" />
            <span className="envelope-seal" aria-hidden="true">
              <img src={assetPath('monogram.svg')} alt="" width="39" height="43" loading="lazy" />
            </span>
            <div className="rsvp-choices" hidden={step !== 'choices'} role="group" aria-label="Will you be attending?">
              <button ref={acceptButton} type="button" disabled={!ready || !(rsvpEndpoint || previewRsvp)} onClick={event => choose(event, 'yes')}>Accept</button>
              <button ref={declineButton} type="button" disabled={!ready || !(rsvpEndpoint || previewRsvp)} className="rsvp-decline" onClick={event => choose(event, 'no')}>Decline</button>
            </div>
          </div>
          <div className="envelope-letter-sleeve" hidden={!detailsVisible}>
            <fieldset ref={letter} className="rsvp-letter" aria-labelledby="rsvp-reply-label" aria-busy={saving} tabIndex={-1} disabled={step !== 'details' || saving}>
              <p className="eyebrow" id="rsvp-reply-label">{accepted ? 'Accept RSVP' : 'Decline RSVP'}</p>
              <div className="field-row">
                <label>Name
                  <input ref={nameField} name="name" autoComplete="name" required maxLength={120} placeholder="Your full name"
                    value={name} onChange={event => { setName(event.target.value); setError(''); }} />
                </label>
                <label className="pax-field" hidden={!accepted}>How many pax?
                  <input name="guests" type="number" inputMode="numeric" min={1} max={99} step={1} required={accepted} disabled={!accepted}
                    value={guests} onChange={event => { setGuests(event.target.value); setError(''); }} />
                </label>
              </div>
              <div className="rsvp-actions">
                <button type="submit">{saving ? 'Saving…' : 'Confirm RSVP'}</button>
                <button type="button" className="rsvp-text-action" onClick={() => {
                  focusChoiceOnReturn.current = true;
                  setError('');
                  setStep('choices');
                }}>Back</button>
              </div>
            </fieldset>
          </div>
        </div>
        <div className="rsvp-footer">
          <p ref={receipt} className="rsvp-receipt" role="status" tabIndex={-1}>
            {complete && (accepted ? 'We’re so excited to celebrate with you!' : 'We appreciate your reply.')}
          </p>
          <p className="form-status" role="status">{error}</p>
          {!rsvpEndpoint && step !== 'sealing' && !complete && <p className="form-help">
            {previewRsvp ? 'Preview only. Responses stay on this device.' : 'Online RSVP is not open yet.'}
          </p>}
        </div>
      </form>
    </section>
  );
}
