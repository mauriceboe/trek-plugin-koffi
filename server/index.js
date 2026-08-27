// Koffi & Friends — the TREK mascot troupe (hero-slot widget).
//
// GET  /state?tripId=  → { days, ongoing, title, mascots } — trip mood + the
//                        acting user's picked cast, one call for the widget boot.
// GET  /mascots        → { mascots }
// POST /mascots        → { mascots } — save up to two picks (settings tiles).
//
// The host membership-checks every trip read against the acting user; picks live
// in the plugin's own db, keyed by user id, so each traveler casts their own duo.

const DAY_MS = 86400000;
const ROSTER = ['koffi', 'chiki', 'passi', 'puffi'];
const json = { 'content-type': 'application/json' };

function midnight(iso) {
  const d = new Date(iso + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function sanitizePicks(input) {
  if (!Array.isArray(input)) return null;
  const picks = [];
  for (const raw of input) {
    if (typeof raw !== 'string' || !ROSTER.includes(raw)) return null;
    if (!picks.includes(raw)) picks.push(raw);
  }
  if (picks.length < 1 || picks.length > 2) return null;
  return picks;
}

async function loadPicks(ctx, userId) {
  await ctx.db.migrate('001-user-mascots',
    'CREATE TABLE IF NOT EXISTS user_mascots (user_id INTEGER PRIMARY KEY, mascots TEXT NOT NULL, updated_at TEXT NOT NULL)');
  const rows = await ctx.db.query('SELECT mascots FROM user_mascots WHERE user_id = ?', userId);
  if (!rows.length) return ['koffi'];
  try {
    return sanitizePicks(JSON.parse(rows[0].mascots)) || ['koffi'];
  } catch {
    return ['koffi'];
  }
}

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/state',
      auth: true,
      async handler(req, ctx) {
        const mascots = await loadPicks(ctx, req.user.id);
        const tripId = Number(req.query.tripId);
        if (!tripId) return { status: 200, headers: json, body: JSON.stringify({ days: null, ongoing: false, title: null, mascots }) };

        const t = await ctx.trips.getById(tripId, req.user.id);
        if (!t) return { status: 200, headers: json, body: JSON.stringify({ days: null, ongoing: false, title: null, mascots }) };

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const start = t.start_date ? midnight(t.start_date) : null;
        const end = t.end_date ? midnight(t.end_date) : null;

        const ongoing = start !== null && start <= now.getTime() && (end === null || now.getTime() <= end);
        const days = !ongoing && start !== null && start >= now.getTime()
          ? Math.round((start - now.getTime()) / DAY_MS)
          : null;

        return { status: 200, headers: json, body: JSON.stringify({ days, ongoing, title: t.title ?? null, mascots }) };
      },
    },
    {
      method: 'GET',
      path: '/mascots',
      auth: true,
      async handler(req, ctx) {
        const mascots = await loadPicks(ctx, req.user.id);
        return { status: 200, headers: json, body: JSON.stringify({ mascots, roster: ROSTER }) };
      },
    },
    {
      method: 'POST',
      path: '/mascots',
      auth: true,
      async handler(req, ctx) {
        let body = null;
        try {
          body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } catch {
          /* fall through to the 400 below */
        }
        const picks = body && sanitizePicks(body.mascots);
        if (!picks) return { status: 400, headers: json, body: JSON.stringify({ error: 'mascots must be 1-2 of ' + ROSTER.join(', ') }) };

        await ctx.db.migrate('001-user-mascots',
          'CREATE TABLE IF NOT EXISTS user_mascots (user_id INTEGER PRIMARY KEY, mascots TEXT NOT NULL, updated_at TEXT NOT NULL)');
        await ctx.db.exec(
          'INSERT INTO user_mascots (user_id, mascots, updated_at) VALUES (?, ?, ?) ' +
          'ON CONFLICT(user_id) DO UPDATE SET mascots = excluded.mascots, updated_at = excluded.updated_at',
          req.user.id, JSON.stringify(picks), new Date().toISOString());
        return { status: 200, headers: json, body: JSON.stringify({ mascots: picks }) };
      },
    },
  ],
};
