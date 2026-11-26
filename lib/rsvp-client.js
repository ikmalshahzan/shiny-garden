export const rsvpEndpoint = process.env.NEXT_PUBLIC_RSVP_ENDPOINT;
export const previewRsvp = !process.env.NEXT_PUBLIC_BASE_PATH && !rsvpEndpoint;

export async function saveRsvp(reply, signal) {
  const inviteCode = new URLSearchParams(window.location.search).get('invite');
  if (!inviteCode || !/^[a-f0-9]{32}$/i.test(inviteCode)) {
    throw new Error('Please open the personal invitation link sent to you to reply.');
  }

  const request = new AbortController();
  const cancel = () => request.abort();
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) cancel();
  const timeout = setTimeout(cancel, 15000);
  try {
    const response = await fetch(rsvpEndpoint, {
      method: 'POST',
      credentials: 'omit',
      body: new URLSearchParams({ ...reply, inviteCode }),
      signal: request.signal,
    });
    if (!response.ok) throw new Error('RSVP request failed');
    const result = await response.json();
    if (result.ok === true) return;
    if (result.code === 'INVITE') throw new Error('INVITE');
    if (result.code === 'PARTY_SIZE') throw new Error('PARTY_SIZE');
  } catch (failure) {
    if (failure.message === 'INVITE') throw new Error('This invitation link did not match an invitation for this event.');
    if (failure.message === 'PARTY_SIZE') throw new Error('That guest count exceeds the places reserved for your invitation.');
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', cancel);
  }
  throw new Error('Your reply could not be confirmed. Please try again.');
}
