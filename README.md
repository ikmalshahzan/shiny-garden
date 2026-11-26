# 'Adani & Ikmal

The invitation uses the Next.js App Router and a static export for GitHub Pages. The scene uses CSS transforms with GSAP ScrollTrigger, existing WebP and SVG assets, and Lenis for wheel input. React renders the scene and RSVP markup. The garden timeline controls per-frame transforms through a scoped ref and removes its listeners and animations on cleanup.

## Run locally

```sh
npm ci
npm run dev
npm test
```

Run `npm run build` followed by `npm run preview` to check the exported site. The existing static invitation is in `dist/`. The Next.js export is in `out/`.

## Collect RSVP replies

1. Open the private RSVP Tracker in Google Drive. Each row in **Invitations** represents one household for one event. Enter the event, household name, and invited party size in the highlighted columns B–D. Use a separate row if the same household is invited to both ceremonies.
2. Open **Extensions → Apps Script** from the sheet. Replace the starter code with [backend/Code.gs](backend/Code.gs). Run `setupRsvpDatabase` once, then add the page URL for each active event under **Project Settings → Script properties**. Use `ENGAGEMENT_INVITATION_URL` or `WEDDING_INVITATION_URL`. The current invitation sends the Engagement event ID. A future wedding invitation can use the same tracker by passing `eventId="wedding"` to the envelope.
3. Deploy the script as a web app, executing as the owner. Guests need anonymous access to submit using their personal invite link. The endpoint verifies the invite code, event, and reserved party size and returns only whether the write succeeded.
4. Copy [.env.example](.env.example) to `.env.local` and set `NEXT_PUBLIC_RSVP_ENDPOINT` to the deployed URL ending in `/exec`. Set `NEXT_PUBLIC_BASE_PATH=/shiny-garden` for the GitHub project site. Build and publish `out/` with its `.nojekyll` file.
5. Reload the sheet and use **RSVP → Generate invite links**. Each saved link stays tied to its row when a guest changes their reply. Open a test link in a signed-out browser and verify both a stored reply and an on-page confirmation before sending links to guests.

For a GitHub Actions deployment, set `RSVP_ENDPOINT` in the repository's Actions variables and run **Publish Next.js invitation**. With an empty endpoint, a local build uses device storage for preview and the public build displays that online RSVP is closed. Previously collected device-only replies need to be entered in the tracker or submitted again via a personal link.

## View replies in AppSheet

Create an app from the RSVP Tracker sheet and add **Invitations** and **Summary** as read-only tables. Use **InviteCode** as the Invitations key and **Event** as the Summary key. Use Text for the key, Number for party counts, and DateTime for RespondedAt. Create a table view grouped by Event and Status, or create three slices with the row filters `[Status] = "Accepted"`, `[Status] = "Declined"`, and `[Status] = "Pending"`. Add the Summary view to the dashboard for headcounts.

Enable **Personal use only** and require Google sign-in. Keep the app for the organisers. Guests submit through the invitation site. AppSheet personal use supports up to three app users.

**GuestsComing** sums confirmed pax. **GuestsDeclined** sums the reserved party sizes of declined households. **PendingPax** sums reserved party sizes of pending households. **PlannedPax** is the planning target. **UnallocatedPax** subtracts invited places from that target.
