Everything is implemented and verified. Here's the full summary:
✅ What Was Changed
🔴 Critical fixes
1. Player route bug fixed — GET /api/players now returns all players (with soldTo populated), unsold moved to GET /api/players/unsold. Sold players no longer vanish from the Players page and homepage stats are correct.
2. .env.local repaired — was UTF-16 (unparseable, silently hitting your Render URL); now clean UTF-8 pointing to localhost. config.js dead fallback to the production URL removed.
3. Leaked credentials — I left the Atlas URI in server/.env since it's your working DB, but rotate that password now — it's in git history. HOST_TOKEN and CLIENT_URL added to .env.
🏗️ Server-authoritative auction engine (auctionSocket.js — full rewrite)
- Timer now runs on the server (timer-tick every 500ms); the server itself decides sold/unsold at 0 — multi-tab finalize races are gone.
- All bids validated server-side: must beat highest bid + correct increment, ≤ team purse, ≥ base price. Rejections emit bid-rejected with a reason (shown as a toast).
- Atomic purse deduction (findOneAndUpdate with $gte guard + $addToSet) — no double-spend.
- State persistence — the previously-unused Auction model now records every live auction (bids, end time, result) and live state is restored after a server restart.
- Host authentication — start-auction, force-sold, force-unsold, stop require HOST_TOKEN (currently auction2026; set it to empty to disable).
- ~150 lines of dead commented code and the phantom express/io instance deleted.
🆕 New API
- GET /api/teams/stats/summary — aggregated homepage stats (no more downloading every player)
- POST /api/teams/undo-last-sale — reverts the most recent sale (refunds purse, player back to pool) with a soldAt timestamp added to the Player model
- DELETE /api/teams/:id (releases owned players) and DELETE /api/players/:id (sold players protected)
- Server-side validation on all creates (name, rating 1–99, purse > 0, duplicate team names rejected), position enum on the Player schema, 404/error handlers, configurable CORS via CLIENT_URL
🎨 Auction page — live-feel upgrades (UI kept, just enhanced)
- Animated countdown ring — green → amber → red, pulses + card glow in the final 5 seconds
- "Currently Winning" card with the leading team's logo, winning team highlighted in the sidebar (• marker + green border), teams that can't afford the next bid grayed out with "can't bid"
- Voice toggle 🔊/🔇 and human-friendly speech ("5.5 million", correct team names on bids)
- Host lock 🔒 dialog — enter code to unlock Force Sold/Unsold controls
- Confirmation dialogs on Force Sold / Force Unsold (no more one-misclick sales)
- Undo button ↩️ for the last sale; toast notifications (sonner) for every event/error; aria-live region for screen readers; waiting-room state between players; team logos in the sidebar
🔧 Other pages
- Team detail: fixed the remaining-budget double-subtract bug (purse is already decremented); squad now grouped by GK / DEF / MID / FWD with counts
- Teams page: "Remaining purse" labeling, delete button, toasts + validation
- Players page: shows owning team name, position select (matches new enum), delete for unsold players, toasts + validation
- Nav: fixed-position with blur background instead of transparent absolute
- Cleanup: unused Next.js mock API routes, duplicate styles/globals.css, mongodb/fake-faker deps removed from package.json