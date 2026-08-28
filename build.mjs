#!/usr/bin/env node
/**
 * Inline the frame's scripts into its HTML.
 *
 * The frames used to pull engine.js, the four characters and the director as
 * separate <script src> requests. Same-origin requests to TREK's own
 * /plugin-frame/koffi/ path, so they looked harmless — but the frame is
 * sandboxed at an opaque origin, which makes every one of those a cross-site
 * request that carries no cookies. Behind a forward-auth proxy (Authelia,
 * Authentik, Cloudflare Access and friends) the proxy sees an unauthenticated
 * request and answers 302 to its login portal, the browser follows it, and the
 * frame's own CSP then refuses to run a script from that portal's origin.
 * Result: TrekMascots undefined, blank UI, and nothing the plugin can catch.
 *
 * Reported as liketrek/TREK#2121, with the redirect visible in the blocked URL:
 *   https://portal.example/?rd=https%3A%2F%2Ftrek.example%2Fplugin-frame%2Fkoffi%2Fengine.js
 *
 * There is no fix on the plugin's side of that exchange, because there is no
 * exchange to fix: the answer is to stop making the request. TREK's frame CSP
 * allows 'unsafe-inline' by design (plugin-frame.controller.ts — the sandbox is
 * the isolation boundary, not script-src), so the scripts go straight into the
 * document and the frame becomes a single file that cannot be intercepted.
 *
 * Sources stay where they are and stay editable. This script rewrites only what
 * sits between the two markers, so it is safe to run repeatedly:
 *
 *   node build.mjs          rebuild both frames
 *   node build.mjs --check  fail if the committed HTML is stale (CI/pre-release)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const BEGIN = '<!-- build:inline-scripts:begin -->';
const END = '<!-- build:inline-scripts:end -->';

/** Kept in load order: the engine defines TrekMascots, characters register into it. */
const CHARACTERS = ['koffi', 'chiki', 'passi', 'puffi'].map((n) => `characters/${n}.js`);

const FRAMES = [
  { html: 'client/index.html', scripts: ['engine.js', ...CHARACTERS, 'director.js'] },
  // The picker renders previews but never animates a scene, so it needs no director.
  { html: 'client/settings.html', scripts: ['engine.js', ...CHARACTERS] },
];

/**
 * `</script>` inside a string literal would close the surrounding tag and drop
 * the rest of the file into the document as markup. The parser only recognises
 * the literal sequence, so breaking it is enough and the value is unchanged.
 */
function safeForInlineScript(code) {
  return code.replace(/<\/script/gi, '<\\/script');
}

function render(frame) {
  const parts = frame.scripts.map((rel) => {
    const code = readFileSync(join(root, 'client', rel), 'utf8').trimEnd();
    return `<!-- ${rel} -->\n<script>\n${safeForInlineScript(code)}\n</script>`;
  });
  return `${BEGIN}\n${parts.join('\n')}\n${END}`;
}

let stale = 0;
for (const frame of FRAMES) {
  const path = join(root, frame.html);
  const html = readFileSync(path, 'utf8');
  const from = html.indexOf(BEGIN);
  const to = html.indexOf(END);
  if (from === -1 || to === -1 || to < from) {
    throw new Error(`${frame.html}: missing or malformed ${BEGIN} … ${END} markers`);
  }
  const next = html.slice(0, from) + render(frame) + html.slice(to + END.length);
  if (next === html) {
    console.log(`  ${frame.html} — up to date`);
    continue;
  }
  stale++;
  if (process.argv.includes('--check')) {
    console.error(`  ${frame.html} — STALE, run: node build.mjs`);
    continue;
  }
  writeFileSync(path, next);
  console.log(`  ${frame.html} — rebuilt (${frame.scripts.length} scripts inlined)`);
}

if (process.argv.includes('--check') && stale > 0) {
  console.error(`\n${stale} frame(s) out of date with their sources.`);
  process.exit(1);
}
