// Puffi -- a chronically sleepy mint-teal neck pillow. The U stands on its own
// two ends, the sleep mask lives on his forehead until nap time, and the deep
// breathing never stops -- a pillow is soft full-time.
(function () {
  'use strict';

  var CSS = "" +
    "\n/* ---- moving root: JS drives translate3d(x) ---- */\n" +
    "#m-puffi .jumper, #m-puffi .flip { position: absolute; inset: 0; }\n" +
    "#m-puffi .jumper { transform-origin: 50% 100%; }\n" +
    "#m-puffi .flip { transition: transform .3s ease; transform-origin: 50% 50%; }\n" +
    "#m-puffi .char { display: block; position: absolute; left: 0; bottom: 0; overflow: visible; filter: drop-shadow(0 1px 1px rgba(2,6,23,.35)) drop-shadow(0 0 1px rgba(248,250,252,.3)); }\n" +
    "\n/* ---- ground shadow ---- */\n" +
    "#m-puffi .shadow { position: absolute; left: 50%; bottom: 0; margin-left: -32px; opacity: .17; filter: blur(1.1px); transform-origin: 50% 100%; transition: transform .4s ease, opacity .4s ease; }\n" +
    "#m-puffi.pose-sit .shadow { transform: scaleX(1.14); opacity: .21; }\n" +
    "\n/* ---- SVG group plumbing: CSS transforms in viewBox units ---- */\n" +
    "#pf-root, #pf-jitter, #pf-breathe, #pf-body, #pf-legL, #pf-legR, #pf-face, #pf-pupils, #pf-lids, #pf-squint, #pf-brows, #pf-mouth, #pf-yawnO, #pf-cheeks, #pf-maskCup, #pf-strap, #pf-umb, #pf-blushDeep, #pf-bags { transform-box: view-box; }\n" +
    "#pf-root { transform-origin: 35px 60px; transition: transform .55s cubic-bezier(.4,0,.3,1); }\n" +
    "#pf-breathe { transform-origin: 35px 60px; animation: pfBreathe 4.8s ease-in-out infinite; }\n" +
    "#pf-body { transform-origin: 35px 60px; }\n" +
    "#pf-legL { transform-origin: 18px 60px; transition: transform .5s cubic-bezier(.34,1.4,.64,1); }\n" +
    "#pf-legR { transform-origin: 52px 60px; transition: transform .5s cubic-bezier(.34,1.4,.64,1); }\n" +
    "/* heavy lids: never fully open, blink just finishes the job */\n" +
    "#pf-lids { transform-origin: 35px 13.2px; transform: scaleY(.28); transition: transform .13s ease-out; }\n" +
    "#pf-pupils { transition: transform .35s ease, opacity .12s ease; animation: pfDrift 13s ease-in-out infinite; }\n" +
    "#pf-strap { transform-origin: 58.6px 25.5px; animation: pfStrapIdle 4.6s ease-in-out infinite; }\n" +
    "#m-puffi.mood-uneasy #pf-strap { animation-duration: 2.7s; }\n" +
    "#pf-maskCup { transform-origin: 35px 12px; transform: rotate(-7deg); transition: transform .6s cubic-bezier(.34,1.45,.64,1); }\n" +
    "#m-puffi.mask-down #pf-maskCup { transform: translateY(7.4px) rotate(-1deg); }\n" +
    "#pf-umb { transform: translateY(15px); opacity: 0; transition: transform .65s cubic-bezier(.34,1.56,.64,1) .1s, opacity .3s ease .1s; }\n" +
    "#m-puffi.umb-on #pf-umb { transform: translateY(0); opacity: 1; }\n" +
    "#pf-brows { opacity: 0; transition: opacity .2s ease; }\n" +
    "#pf-browL, #pf-browR { transform-box: fill-box; transform-origin: center; transition: transform .25s ease; }\n" +
    "#m-puffi.brows-knit #pf-brows { opacity: 1; }\n" +
    "#m-puffi.brows-knit #pf-browL { transform: rotate(16deg) translateY(.6px); }\n" +
    "#m-puffi.brows-knit #pf-browR { transform: rotate(-16deg) translateY(.6px); }\n" +
    "#pf-bags { opacity: 0; transition: opacity .6s ease; }\n" +
    "#m-puffi.mood-stressed #pf-bags { opacity: .55; }\n" +
    "#pf-blushDeep { opacity: 0; transition: opacity .25s ease; }\n" +
    "#m-puffi.blush-deep #pf-blushDeep { opacity: .8; }\n" +
    "#pf-yawnO { transform-origin: 35px 23.6px; transform: scale(0); }\n" +
    "#pf-squint { opacity: 0; transition: opacity .12s ease; }\n" +
    "#pf-cheeks .chk { transform-box: fill-box; transform-origin: center; transform: scale(0); }\n" +
    "#m-puffi .streak, #m-puffi .fl, #m-puffi .fy { opacity: 0; }\n" +
    "#m-puffi .streak { transform-box: view-box; }\n" +
    "#m-puffi .fl, #m-puffi .fy { transform-box: fill-box; transform-origin: center; }\n" +
    "\n/* ---- eyes ---- */\n" +
    "#m-puffi.blink #pf-lids, #m-puffi.st-sleep #pf-lids, #m-puffi.eyes-closed #pf-lids { transform: scaleY(1); }\n" +
    "#m-puffi.look-down #pf-pupils { animation: none; transform: translate(.7px, 1.9px); }\n" +
    "#m-puffi.look-up #pf-pupils { animation: none; transform: translate(.5px, -2px); }\n" +
    "#m-puffi.look-l #pf-pupils { animation: none; transform: translate(-1.4px, .2px); }\n" +
    "#m-puffi.look-r #pf-pupils { animation: none; transform: translate(1.4px, .2px); }\n" +
    "#m-puffi.squint #pf-pupils { opacity: 0; }\n" +
    "#m-puffi.squint #pf-squint { opacity: 1; }\n" +
    "#m-puffi.squint #pf-lids { transform: scaleY(0); }\n" +
    "\n/* ---- strap twitch (idle micro-motion) ---- */\n" +
    "#m-puffi.twitch #pf-strap { animation: pfStrapTwitch .6s ease-in-out; }\n" +
    "\n/* ---- walk: floppy shuffle, the U-ends squash in turn ---- */\n" +
    "#m-puffi.st-walk #pf-legL { animation: pfShuffle var(--step) ease-in-out infinite; }\n" +
    "#m-puffi.st-walk #pf-legR { animation: pfShuffle var(--step) ease-in-out infinite; animation-delay: calc(var(--step) / -2); }\n" +
    "#m-puffi.st-walk #pf-body { animation: pfSway var(--step) ease-in-out infinite; }\n" +
    "#m-puffi.mood-stressed.st-walk #pf-body { animation-name: pfSwayStumble; }\n" +
    "#m-puffi.st-walk #pf-root { animation: pfBobP calc(var(--step) / 2) ease-in-out infinite; }\n" +
    "#m-puffi.st-walk #pf-face { animation: pfCounterP calc(var(--step) / 2) ease-in-out infinite; animation-delay: calc(var(--step) / -8); }\n" +
    "#m-puffi.st-walk #pf-strap { animation: pfStrapWalk var(--step) ease-in-out infinite; animation-delay: calc(var(--step) / -6); }\n" +
    "\n/* strap flutter on turn-around (after walk rules so it wins for its .65s) */\n" +
    "#m-puffi.flutter #pf-strap { animation: pfStrapFlutter .65s ease-in-out; }\n" +
    "\n/* ---- sit / sleep ---- */\n" +
    "#m-puffi.pose-sit #pf-root { transform: translateY(3px); }\n" +
    "#m-puffi.pose-sit #pf-legL, #m-puffi.pose-sit #pf-legR { transform: scale(1.1, .86); }\n" +
    "#m-puffi.st-sleep #pf-root { transform: translateY(4.5px) rotate(-2.5deg); }\n" +
    "#m-puffi.st-sleep #pf-breathe { animation: pfSnore 6s ease-in-out infinite; }\n" +
    "\n/* ---- fx layer (outside .flip: glyphs never mirror) ---- */\n" +
    "#m-puffi .fx { position: absolute; inset: 0; pointer-events: none; }\n" +
    "#m-puffi .zz { position: absolute; top: -2px; opacity: 0; font: italic 700 11px/1 \"Trebuchet MS\", \"Segoe UI\", sans-serif; color: #F0FDFA; text-shadow: 0 1px 2px rgba(19,78,74,.7); }\n" +
    "#m-puffi .z1 { left: 40px; }\n" +
    "#m-puffi .z2 { left: 32px; font-size: 15px; }\n" +
    "#m-puffi .z3 { left: 48px; }\n" +
    "#m-puffi.st-sleep .z1 { animation: pfZ 2.9s ease-in-out infinite; }\n" +
    "#m-puffi.st-sleep .z2 { animation: pfZ 2.9s ease-in-out .95s infinite; }\n" +
    "#m-puffi.st-sleep .z3 { animation: pfZ 2.9s ease-in-out 1.9s infinite; }\n" +
    "#m-puffi .cloud { position: absolute; top: -24px; left: 12px; padding: 2px 6px; border-radius: 8px; background: #F0FDFA; border: 1px solid rgba(15,118,110,.4); color: #0F766E; font: 700 10px/1.3 \"Trebuchet MS\", \"Segoe UI\", sans-serif; opacity: 0; }\n" +
    "#m-puffi .cloud::after { content: \"\"; position: absolute; left: 5px; bottom: -6px; width: 4px; height: 4px; border-radius: 50%; background: #F0FDFA; border: 1px solid rgba(15,118,110,.4); }\n" +
    "#m-puffi.st-cloudgaze .cloud { animation: pfCloud 4s ease-in-out; }\n" +
    "#m-puffi .hx { position: absolute; top: 2px; opacity: 0; color: #FB7185; font: 700 10px/1 \"Trebuchet MS\", \"Segoe UI\", sans-serif; text-shadow: 0 1px 2px rgba(19,78,74,.5); }\n" +
    "#m-puffi .h1 { left: 30px; }\n" +
    "#m-puffi .h2 { left: 22px; font-size: 8px; }\n" +
    "#m-puffi .h3 { left: 40px; font-size: 8px; }\n" +
    "#m-puffi.st-snuggle .h1 { animation: pfHeart 2.2s ease-in-out infinite; }\n" +
    "#m-puffi.st-snuggle .h2 { animation: pfHeart 2.2s ease-in-out .7s infinite; }\n" +
    "#m-puffi.st-snuggle .h3 { animation: pfHeart 2.2s ease-in-out 1.4s infinite; }\n" +
    "\n/* ---- state one-shots ---- */\n" +
    "/* no arms: a wave is one lifted U-end and a lot of goodwill */\n" +
    "#m-puffi.st-wave #pf-legR { transform-origin: 52px 32px; animation: pfWaveEnd 2.1s ease-in-out; }\n" +
    "#m-puffi.st-wave #pf-root { transform: rotate(-6deg) translateX(-1px); }\n" +
    "#m-puffi.st-jump .jumper { animation: pfJump 1.25s cubic-bezier(.4,0,.4,1); }\n" +
    "#m-puffi.st-jump .shadow { animation: pfShadowJump 1.25s cubic-bezier(.4,0,.4,1); }\n" +
    "/* stressed jump: low arc, oof landing */\n" +
    "#m-puffi.mood-stressed.st-jump .jumper { animation-name: pfJumpLow; }\n" +
    "#m-puffi.mood-stressed.st-jump .shadow { animation-name: pfShadowJumpLow; }\n" +
    "#m-puffi.hop .jumper { animation: pfHop .55s ease-in-out; }\n" +
    "#m-puffi.hop .shadow { animation: pfShadowHop .55s ease-in-out; }\n" +
    "#m-puffi.st-stretch #pf-root { animation: pfStretchP 1.9s ease-in-out; }\n" +
    "#m-puffi.st-stretch #pf-legL, #m-puffi.st-stretch #pf-legR { animation: pfStretchLeg 1.9s ease-in-out; }\n" +
    "#m-puffi.st-stretch #pf-maskCup { animation: pfMaskJig 1.9s ease-in-out; }\n" +
    "#m-puffi.st-inflate #pf-breathe { animation: pfInflate 3.5s ease-in-out; }\n" +
    "#m-puffi.st-inflate .jumper { animation: pfPfft 3.5s ease-in-out; }\n" +
    "#m-puffi.st-inflate .shadow { animation: pfShadowInflate 3.5s ease-in-out; }\n" +
    "#m-puffi.st-inflate #pf-legL { animation: pfLegInL 3.5s ease-in-out; }\n" +
    "#m-puffi.st-inflate #pf-legR { animation: pfLegInR 3.5s ease-in-out; }\n" +
    "#m-puffi.st-inflate .chk { animation: pfCheeks 3.5s ease-in-out; }\n" +
    "#m-puffi.st-yawn #pf-root { animation: pfYawnP 2.4s ease-in-out; }\n" +
    "#m-puffi.st-yawn #pf-yawnO { animation: pfYawnMouth 2.4s ease-in-out; }\n" +
    "#m-puffi.st-yawn #pf-mouthS { opacity: 0; }\n" +
    "#m-puffi.st-rollover #pf-root { animation: pfRoll 4.6s ease-in-out; }\n" +
    "#m-puffi.st-rollover .shadow { animation: pfShadowRoll 4.6s ease-in-out; }\n" +
    "#m-puffi.st-cloudgaze #pf-root { transform: rotate(-3.5deg) translateY(.5px); }\n" +
    "#m-puffi.st-grumble #pf-body { animation: pfGrumble 2.8s ease-in-out; }\n" +
    "#m-puffi.st-snuggle #pf-legL { transform: translate(4.5px, -.5px) rotate(12deg); }\n" +
    "#m-puffi.st-snuggle #pf-legR { transform: translate(-4.5px, -.5px) rotate(-12deg); }\n" +
    "#m-puffi.st-snuggle #pf-body { animation: pfSnug 1.6s ease-in-out infinite; }\n" +
    "#m-puffi.mood-bliss.st-idle #pf-body, #m-puffi.mood-bliss.st-sit #pf-body { animation: pfSwayBliss 3.8s ease-in-out infinite; }\n" +
    "/* one U-end briefly loses tension, snaps back */\n" +
    "#m-puffi.flopL #pf-legL { transform-origin: 18px 30px; animation: pfFlopL .95s ease-in-out; }\n" +
    "#m-puffi.flopR #pf-legR { transform-origin: 52px 30px; animation: pfFlopR .95s ease-in-out; }\n" +
    "/* stressed micro-shake, never while asleep */\n" +
    "#m-puffi.mood-stressed #pf-jitter { animation: pfJitter .38s linear infinite; }\n" +
    "#m-puffi.mood-stressed.st-sleep #pf-jitter { animation: none; }\n" +
    "\n/* ---- fabric sheen sweeps ---- */\n" +
    "#m-puffi.sh1 #pf-shineA { animation: pfSheen 1.05s ease-in-out; }\n" +
    "#m-puffi.sh2 #pf-shineL { animation: pfSheen 1.05s ease-in-out; }\n" +
    "\n/* ---- fluff puffs ---- */\n" +
    "#m-puffi.fluff .fl { animation: pfFluff 1.7s ease-out; }\n" +
    "#m-puffi.fluffY .fy { animation: pfFluffY 1.6s ease-out; }\n" +
    "\n/* ---- keyframes ---- */\n" +
    "@keyframes pfBreathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.035, 1.06); } }\n" +
    "@keyframes pfSnore { 0%,100% { transform: scale(1); } 32% { transform: scale(1.05, 1.09); } 55% { transform: scale(1.008, 1.015); } 66% { transform: scale(1.012, 1.02); } 70% { transform: scale(1.06, 1.1); } 74% { transform: scale(1.02, 1.03); } }\n" +
    "@keyframes pfDrift { 0%,100% { transform: translate(0,0); } 25% { transform: translate(.6px,.4px); } 55% { transform: translate(-.5px,.5px); } 80% { transform: translate(.2px,-.2px); } }\n" +
    "@keyframes pfZ { 0% { opacity: 0; transform: translate(0, 5px) scale(.6); } 25% { opacity: .9; } 100% { opacity: 0; transform: translate(10px, -24px) scale(1.3); } }\n" +
    "@keyframes pfShuffle { 0%,100% { transform: scale(1); } 50% { transform: scale(1.16, .8); } }\n" +
    "@keyframes pfSway { 0%,100% { transform: rotate(4deg); } 50% { transform: rotate(-4deg); } }\n" +
    "@keyframes pfSwayStumble { 0%,100% { transform: rotate(3.5deg); } 38% { transform: rotate(-4.5deg); } 52% { transform: rotate(-1.5deg); } 62% { transform: rotate(-5.5deg); } 82% { transform: rotate(2.5deg); } }\n" +
    "@keyframes pfBobP { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1.3px); } }\n" +
    "@keyframes pfCounterP { 0%,100% { transform: translateY(0); } 50% { transform: translateY(.9px); } }\n" +
    "@keyframes pfStrapIdle { 0%,100% { transform: rotate(-2.5deg); } 50% { transform: rotate(3deg); } }\n" +
    "@keyframes pfStrapWalk { 0%,100% { transform: rotate(9deg); } 50% { transform: rotate(-12deg); } }\n" +
    "@keyframes pfStrapTwitch { 0%,100% { transform: rotate(0); } 25% { transform: rotate(11deg); } 55% { transform: rotate(-8deg); } 80% { transform: rotate(4deg); } }\n" +
    "@keyframes pfStrapFlutter { 0%,100% { transform: rotate(0); } 20% { transform: rotate(15deg); } 45% { transform: rotate(-12deg); } 70% { transform: rotate(7deg); } 88% { transform: rotate(-3deg); } }\n" +
    "@keyframes pfJump { 0% { transform: translateY(0) scale(1); } 20% { transform: translateY(0) scale(1.14, .8); } 34% { transform: translateY(-8px) scale(.94, 1.1); } 54% { transform: translateY(-18px) scale(1, 1.04); } 72% { transform: translateY(-3px) scale(.99, 1.02); } 81% { transform: translateY(0) scale(1.18, .78); } 91% { transform: translateY(0) scale(.95, 1.05); } 100% { transform: translateY(0) scale(1); } }\n" +
    "@keyframes pfShadowJump { 0% { transform: scale(1); opacity: .17; } 20% { transform: scale(1.1, 1); opacity: .21; } 54% { transform: scale(.62); opacity: .08; } 81% { transform: scale(1.2, 1); opacity: .23; } 100% { transform: scale(1); opacity: .17; } }\n" +
    "@keyframes pfJumpLow { 0% { transform: translateY(0) scale(1); } 22% { transform: translateY(0) scale(1.16, .78); } 38% { transform: translateY(-5px) scale(.95, 1.07); } 55% { transform: translateY(-8px) scale(1, 1.02); } 70% { transform: translateY(-1px) scale(1, 1); } 78% { transform: translateY(0) scale(1.26, .68); } 87% { transform: translateY(0) scale(.92, 1.06); } 94% { transform: translateY(0) scale(1.06, .95); } 100% { transform: translateY(0) scale(1); } }\n" +
    "@keyframes pfShadowJumpLow { 0% { transform: scale(1); opacity: .17; } 22% { transform: scale(1.12, 1); opacity: .21; } 55% { transform: scale(.85); opacity: .12; } 78% { transform: scale(1.28, 1); opacity: .24; } 100% { transform: scale(1); opacity: .17; } }\n" +
    "@keyframes pfHop { 0% { transform: translateY(0) scale(1); } 30% { transform: translateY(0) scale(1.08, .88); } 60% { transform: translateY(-5px) scale(.97, 1.04); } 85% { transform: translateY(0) scale(1.06, .92); } 100% { transform: translateY(0) scale(1); } }\n" +
    "@keyframes pfShadowHop { 0%,100% { transform: scale(1); opacity: .17; } 60% { transform: scale(.88); opacity: .13; } }\n" +
    "@keyframes pfWaveEnd { 0%,100% { transform: rotate(0); } 14% { transform: rotate(-44deg); } 28% { transform: rotate(-28deg); } 42% { transform: rotate(-48deg); } 56% { transform: rotate(-28deg); } 70% { transform: rotate(-46deg); } 86% { transform: rotate(-8deg); } }\n" +
    "@keyframes pfStretchP { 0% { transform: scale(1); } 24% { transform: scale(1.07, .9); } 52% { transform: scale(.94, 1.1); } 68% { transform: scale(.94, 1.11); } 84% { transform: scale(1.04, .95); } 100% { transform: scale(1); } }\n" +
    "@keyframes pfStretchLeg { 0%,100% { transform: scaleY(1); } 52%,68% { transform: scaleY(1.06); } }\n" +
    "@keyframes pfMaskJig { 0%,100% { transform: rotate(-7deg); } 55% { transform: rotate(-13deg) translateY(-.6px); } 75% { transform: rotate(-4deg); } }\n" +
    "@keyframes pfInflate { 0% { transform: scale(1); } 8% { transform: scale(.94, .9); } 18% { transform: scale(1.22, 1.18); } 26% { transform: scale(1.25, 1.17) rotate(.8deg); } 32% { transform: scale(1.22, 1.2) rotate(-.8deg); } 38% { transform: scale(1.25, 1.18) rotate(.6deg); } 46% { transform: scale(1.23, 1.19) rotate(-.4deg); } 52% { transform: scale(1.24, 1.19); } 58% { transform: scale(.84, .8); } 66% { transform: scale(.78, .72); } 74% { transform: scale(1.18, .42); } 82% { transform: scale(1.14, .45); } 90% { transform: scale(.94, 1.08); } 96% { transform: scale(1.04, .96); } 100% { transform: scale(1); } }\n" +
    "@keyframes pfPfft { 0%,50% { transform: translateX(0); } 60% { transform: translateX(3px); } 74% { transform: translateX(7px); } 86% { transform: translateX(6px); } 100% { transform: translateX(0); } }\n" +
    "@keyframes pfShadowInflate { 0%,100% { transform: scale(1); opacity: .17; } 20% { transform: scale(1.16, 1); opacity: .2; } 52% { transform: scale(1.18, 1); opacity: .2; } 64% { transform: scale(.88, 1); opacity: .15; } 76% { transform: scale(1.32, 1); opacity: .24; } 88% { transform: scale(.96, 1); } }\n" +
    "@keyframes pfLegInL { 0%,100% { transform: translateX(0); } 10% { transform: translateX(-1.5px); } 20% { transform: translateX(5.5px); } 52% { transform: translateX(6px); } 62% { transform: translateX(1px); } 76% { transform: translateX(-2.5px); } 88% { transform: translateX(.5px); } }\n" +
    "@keyframes pfLegInR { 0%,100% { transform: translateX(0); } 10% { transform: translateX(1.5px); } 20% { transform: translateX(-5.5px); } 52% { transform: translateX(-6px); } 62% { transform: translateX(-1px); } 76% { transform: translateX(2.5px); } 88% { transform: translateX(-.5px); } }\n" +
    "@keyframes pfCheeks { 0%,16%,60%,100% { transform: scale(0); } 24% { transform: scale(1.15); } 32% { transform: scale(.95); } 44% { transform: scale(1.08); } 54% { transform: scale(1); } }\n" +
    "@keyframes pfYawnP { 0%,100% { transform: scale(1) rotate(0); } 22% { transform: scale(1.02, .96) rotate(1deg); } 46% { transform: scale(.97, 1.06) rotate(-3deg); } 66% { transform: scale(.97, 1.05) rotate(-2.5deg); } 82% { transform: scale(1.01, .99) rotate(1.2deg); } 86% { transform: scale(1) rotate(-1.2deg); } 90% { transform: scale(1) rotate(.8deg); } 94% { transform: scale(1) rotate(-.4deg); } }\n" +
    "@keyframes pfYawnMouth { 0%,100% { transform: scale(0); } 18% { transform: scale(1.15); } 28% { transform: scale(.95); } 40% { transform: scale(1.05); } 62% { transform: scale(1); } 80% { transform: scale(.4); } 88% { transform: scale(0); } }\n" +
    "@keyframes pfRoll { 0% { transform: rotate(0); } 6% { transform: rotate(-6deg); } 14% { transform: rotate(97deg); } 18% { transform: rotate(90deg); } 24% { transform: rotate(86deg); } 28% { transform: rotate(94deg); } 33% { transform: rotate(88deg); } 38% { transform: rotate(72deg); } 44% { transform: rotate(93deg); } 50% { transform: rotate(58deg); } 57% { transform: rotate(95deg); } 65% { transform: rotate(90deg); } 72% { transform: rotate(38deg); } 78% { transform: rotate(-8deg); } 84% { transform: rotate(4deg); } 90% { transform: rotate(-2deg); } 100% { transform: rotate(0); } }\n" +
    "@keyframes pfShadowRoll { 0%,100% { transform: scale(1); opacity: .17; } 14% { transform: scaleX(.6); opacity: .22; } 60% { transform: scaleX(.6); opacity: .22; } 78% { transform: scaleX(1.12); opacity: .2; } }\n" +
    "@keyframes pfGrumble { 0%,100% { transform: rotate(0) scale(1); } 6% { transform: rotate(1.6deg) scale(1.005, .995); } 12% { transform: rotate(-1.6deg) scale(1); } 18% { transform: rotate(1.4deg) scale(1.01, .99); } 24% { transform: rotate(-1.4deg) scale(1); } 30% { transform: rotate(1.1deg) scale(1.008, .992); } 36% { transform: rotate(-1.1deg) scale(1); } 42% { transform: rotate(.7deg) scale(1); } 50% { transform: rotate(0) scale(1); } 62% { transform: scale(1.045, 1.05); } 80% { transform: scale(1.015, .945); } 92% { transform: scale(.99, .975); } }\n" +
    "@keyframes pfSnug { 0%,100% { transform: scale(1.025, .975); } 50% { transform: scale(.975, 1.03); } }\n" +
    "@keyframes pfSwayBliss { 0%,100% { transform: rotate(1.8deg); } 50% { transform: rotate(-1.8deg); } }\n" +
    "@keyframes pfHeart { 0% { opacity: 0; transform: translateY(2px) scale(.5); } 25% { opacity: .9; } 100% { opacity: 0; transform: translateY(-15px) scale(1.15); } }\n" +
    "@keyframes pfCloud { 0% { opacity: 0; transform: translateY(4px) scale(.7); } 16% { opacity: .95; transform: translateY(0) scale(1); } 72% { opacity: .95; transform: translateY(-3px) scale(1); } 100% { opacity: 0; transform: translateY(-7px) scale(1); } }\n" +
    "@keyframes pfFluff { 0% { opacity: 0; transform: translate(0,0) scale(.4) rotate(0); } 22% { opacity: .75; transform: translate(0,-3px) scale(.9); } 100% { opacity: 0; transform: translate(var(--fx), var(--fy)) scale(1.1) rotate(var(--fr)); } }\n" +
    "@keyframes pfFluffY { 0% { opacity: 0; transform: translate(0,0) scale(.3) rotate(0); } 15% { opacity: .8; } 60% { transform: translate(4px,-10px) scale(1) rotate(30deg); } 100% { opacity: 0; transform: translate(7px,-6px) scale(1.05) rotate(50deg); } }\n" +
    "@keyframes pfSheen { 0% { opacity: 0; transform: translateX(-8px); } 25% { opacity: .3; } 100% { opacity: 0; transform: translateX(12px); } }\n" +
    "@keyframes pfJitter { 0%,100% { transform: translate(0,0); } 25% { transform: translate(.4px,-.2px); } 50% { transform: translate(-.4px,.15px); } 75% { transform: translate(.3px,.2px); } }\n" +
    "@keyframes pfFlopL { 0%,100% { transform: rotate(0); } 28% { transform: rotate(-8.5deg); } 46% { transform: rotate(-9.5deg); } 62% { transform: rotate(2.5deg); } 78% { transform: rotate(-1.5deg); } }\n" +
    "@keyframes pfFlopR { 0%,100% { transform: rotate(0); } 28% { transform: rotate(8.5deg); } 46% { transform: rotate(9.5deg); } 62% { transform: rotate(-2.5deg); } 78% { transform: rotate(1.5deg); } }\n" +
    "\n/* ---- reduced motion: the cutest static frame is the nap ---- */\n" +
    "@media (prefers-reduced-motion: reduce) { #m-puffi *, #m-puffi *::before, #m-puffi *::after { animation: none !important; transition: none !important; } }\n";

  var SVG = "" +
    "<svg class=\"char\" id=\"pf-char\" width=\"70\" height=\"64\" viewBox=\"0 0 70 64\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\">\n" +
    "<title>Puffi the neck pillow</title>\n" +
    "<defs>\n" +
    "  <clipPath id=\"pf-cpShA\"><rect x=\"15\" y=\"7.5\" width=\"15\" height=\"9\" rx=\"4.5\" transform=\"rotate(-14 22.5 12)\"/></clipPath>\n" +
    "  <clipPath id=\"pf-cpShL\"><rect x=\"46.5\" y=\"38\" width=\"11\" height=\"14\" rx=\"5\"/></clipPath>\n" +
    "</defs>\n" +
    "<g id=\"pf-root\">\n" +
    "<g id=\"pf-jitter\">\n" +
    "<g id=\"pf-breathe\">\n" +
    "<g id=\"pf-body\">\n" +
    "  <!-- the two ends of the U: they are the feet -->\n" +
    "  <g id=\"pf-legL\">\n" +
    "    <rect x=\"11\" y=\"26\" width=\"14\" height=\"34\" rx=\"6.5\" fill=\"#5EEAD4\" stroke=\"#0F766E\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/>\n" +
    "    <ellipse cx=\"18\" cy=\"58.6\" rx=\"5.6\" ry=\"1.9\" fill=\"#2DD4BF\" stroke=\"#0F766E\" stroke-width=\".7\"/>\n" +
    "    <line x1=\"14.2\" y1=\"33\" x2=\"14.2\" y2=\"52\" stroke=\"#F0FDFA\" stroke-width=\".7\" stroke-dasharray=\"1.6 1.8\" opacity=\".8\"/>\n" +
    "    <g id=\"pf-patch\" transform=\"rotate(-9 18.4 45)\">\n" +
    "      <circle cx=\"18.4\" cy=\"45\" r=\"3.7\" fill=\"none\" stroke=\"#F0FDFA\" stroke-width=\".5\" stroke-dasharray=\"1.2 1.4\" opacity=\".9\"/>\n" +
    "      <path d=\"M18.4,47.4 C16,45.5 15.2,43.8 16.4,42.7 C17.3,41.9 18.4,42.5 18.4,43.3 C18.4,42.5 19.5,41.9 20.4,42.7 C21.6,43.8 20.8,45.5 18.4,47.4 Z\" fill=\"#FDA4AF\" stroke=\"#E11D48\" stroke-width=\".6\" stroke-linejoin=\"round\"/>\n" +
    "    </g>\n" +
    "  </g>\n" +
    "  <g id=\"pf-legR\">\n" +
    "    <rect x=\"45\" y=\"26\" width=\"14\" height=\"34\" rx=\"6.5\" fill=\"#5EEAD4\" stroke=\"#0F766E\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/>\n" +
    "    <ellipse cx=\"52\" cy=\"58.6\" rx=\"5.6\" ry=\"1.9\" fill=\"#2DD4BF\" stroke=\"#0F766E\" stroke-width=\".7\"/>\n" +
    "    <line x1=\"55.8\" y1=\"33\" x2=\"55.8\" y2=\"52\" stroke=\"#F0FDFA\" stroke-width=\".7\" stroke-dasharray=\"1.6 1.8\" opacity=\".8\"/>\n" +
    "    <g clip-path=\"url(#pf-cpShL)\"><g id=\"pf-shineL\" class=\"streak\">\n" +
    "      <rect x=\"49.5\" y=\"36\" width=\"2.2\" height=\"18\" fill=\"#FFFFFF\" transform=\"rotate(18 50.6 45)\"/>\n" +
    "    </g></g>\n" +
    "  </g>\n" +
    "  <!-- cocktail umbrella tucked into the U: only comes out on vacation -->\n" +
    "  <g id=\"pf-umb\">\n" +
    "    <line x1=\"37.2\" y1=\"34.5\" x2=\"41.6\" y2=\"56\" stroke=\"#B45309\" stroke-width=\"1.1\" stroke-linecap=\"round\"/>\n" +
    "    <path d=\"M30.2,42.6 Q32,32.6 36.9,31.8 Q41.8,32.6 43.6,42.6 Q41.9,41.2 40.2,42.4 Q38.5,41 36.9,42.4 Q35.3,41 33.6,42.4 Q31.9,41.2 30.2,42.6 Z\" fill=\"#FDA4AF\" stroke=\"#E11D48\" stroke-width=\".7\" stroke-linejoin=\"round\"/>\n" +
    "    <line x1=\"36.9\" y1=\"32.2\" x2=\"36.9\" y2=\"42\" stroke=\"#E11D48\" stroke-width=\".5\"/>\n" +
    "    <circle cx=\"36.9\" cy=\"31.6\" r=\".8\" fill=\"#E11D48\"/>\n" +
    "  </g>\n" +
    "  <!-- the arch: the face lives here, seams are load-bearing charm -->\n" +
    "  <g id=\"pf-arch\">\n" +
    "    <path d=\"M11,33.5 L11,24 Q11,5.5 35,5.5 Q59,5.5 59,24 L59,33.5 Q59,36 56.5,36 L47.8,36 Q45.4,36 45.4,33 Q45.4,26.8 35,26.8 Q24.6,26.8 24.6,33 Q24.6,36 22.2,36 L13.5,36 Q11,36 11,33.5 Z\" fill=\"#5EEAD4\" stroke=\"#0F766E\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/>\n" +
    "    <path d=\"M13.6,25 Q13.6,8 35,8 Q56.4,8 56.4,25\" fill=\"none\" stroke=\"#F0FDFA\" stroke-width=\".7\" stroke-dasharray=\"1.7 1.9\" opacity=\".8\"/>\n" +
    "    <line x1=\"12.5\" y1=\"34.8\" x2=\"23.5\" y2=\"34.8\" stroke=\"#F0FDFA\" stroke-width=\".7\" stroke-dasharray=\"1.5 1.7\" opacity=\".8\"/>\n" +
    "    <line x1=\"46.5\" y1=\"34.8\" x2=\"57.5\" y2=\"34.8\" stroke=\"#F0FDFA\" stroke-width=\".7\" stroke-dasharray=\"1.5 1.7\" opacity=\".8\"/>\n" +
    "    <path d=\"M15.5,20.5 Q16.5,10.5 26,8.8\" stroke=\"#99F6E4\" stroke-width=\"2.2\" fill=\"none\" opacity=\".5\" stroke-linecap=\"round\"/>\n" +
    "    <g clip-path=\"url(#pf-cpShA)\"><g id=\"pf-shineA\" class=\"streak\">\n" +
    "      <rect x=\"20\" y=\"5.5\" width=\"2.4\" height=\"13\" fill=\"#FFFFFF\" transform=\"rotate(20 21.2 12)\"/>\n" +
    "    </g></g>\n" +
    "  </g>\n" +
    "  <!-- blowfish cheeks: only exist while holding air -->\n" +
    "  <g id=\"pf-cheeks\">\n" +
    "    <circle class=\"chk\" cx=\"23\" cy=\"19\" r=\"4.1\" fill=\"#99F6E4\" stroke=\"#0F766E\" stroke-width=\".8\"/>\n" +
    "    <circle class=\"chk\" cx=\"47\" cy=\"19\" r=\"4.1\" fill=\"#99F6E4\" stroke=\"#0F766E\" stroke-width=\".8\"/>\n" +
    "  </g>\n" +
    "  <g id=\"pf-face\">\n" +
    "    <g id=\"pf-bags\">\n" +
    "      <path d=\"M27,21.9 Q29.8,23.7 32.6,21.9\" fill=\"none\" stroke=\"#115E59\" stroke-width=\".9\" stroke-linecap=\"round\"/>\n" +
    "      <path d=\"M37.4,21.9 Q40.2,23.7 43,21.9\" fill=\"none\" stroke=\"#115E59\" stroke-width=\".9\" stroke-linecap=\"round\"/>\n" +
    "    </g>\n" +
    "    <ellipse cx=\"29.8\" cy=\"17.2\" rx=\"3.6\" ry=\"4\" fill=\"#FFFFFF\" stroke=\"#134E4A\" stroke-width=\"1\"/>\n" +
    "    <ellipse cx=\"40.2\" cy=\"17.2\" rx=\"3.6\" ry=\"4\" fill=\"#FFFFFF\" stroke=\"#134E4A\" stroke-width=\"1\"/>\n" +
    "    <g id=\"pf-pupils\">\n" +
    "      <circle cx=\"30.4\" cy=\"17.7\" r=\"1.8\" fill=\"#134E4A\"/>\n" +
    "      <circle cx=\"40.8\" cy=\"17.7\" r=\"1.8\" fill=\"#134E4A\"/>\n" +
    "      <circle cx=\"31\" cy=\"16.9\" r=\".6\" fill=\"#FFFFFF\"/>\n" +
    "      <circle cx=\"41.4\" cy=\"16.9\" r=\".6\" fill=\"#FFFFFF\"/>\n" +
    "    </g>\n" +
    "    <g id=\"pf-lids\">\n" +
    "      <rect x=\"26\" y=\"13\" width=\"7.6\" height=\"8.6\" rx=\"3.8\" fill=\"#5EEAD4\" stroke=\"#0F766E\" stroke-width=\".6\"/>\n" +
    "      <rect x=\"36.4\" y=\"13\" width=\"7.6\" height=\"8.6\" rx=\"3.8\" fill=\"#5EEAD4\" stroke=\"#0F766E\" stroke-width=\".6\"/>\n" +
    "    </g>\n" +
    "    <g id=\"pf-brows\">\n" +
    "      <path id=\"pf-browL\" d=\"M27.2,11.6 Q29.8,10.4 32.4,11.4\" fill=\"none\" stroke=\"#0F766E\" stroke-width=\"1\" stroke-linecap=\"round\"/>\n" +
    "      <path id=\"pf-browR\" d=\"M37.6,11.4 Q40.2,10.4 42.8,11.6\" fill=\"none\" stroke=\"#0F766E\" stroke-width=\"1\" stroke-linecap=\"round\"/>\n" +
    "    </g>\n" +
    "    <g id=\"pf-squint\">\n" +
    "      <path d=\"M27,18.3 Q29.8,15.4 32.6,18.3\" fill=\"none\" stroke=\"#134E4A\" stroke-width=\"1.4\" stroke-linecap=\"round\"/>\n" +
    "      <path d=\"M37.4,18.3 Q40.2,15.4 43,18.3\" fill=\"none\" stroke=\"#134E4A\" stroke-width=\"1.4\" stroke-linecap=\"round\"/>\n" +
    "    </g>\n" +
    "    <g id=\"pf-mouth\">\n" +
    "      <path id=\"pf-mouthS\" d=\"M32.9,23.2 Q35,25 37.1,23.2\" fill=\"none\" stroke=\"#134E4A\" stroke-width=\"1.2\" stroke-linecap=\"round\"/>\n" +
    "      <g id=\"pf-yawnO\">\n" +
    "        <ellipse cx=\"35\" cy=\"23.6\" rx=\"2.8\" ry=\"2.7\" fill=\"#134E4A\" stroke=\"#0F766E\" stroke-width=\".5\"/>\n" +
    "        <path d=\"M33.4,24.9 Q35,26.2 36.6,24.9 Q36.6,23.8 35,23.8 Q33.4,23.8 33.4,24.9 Z\" fill=\"#FDA4AF\"/>\n" +
    "      </g>\n" +
    "    </g>\n" +
    "    <ellipse cx=\"25.4\" cy=\"21.3\" rx=\"1.9\" ry=\"1.1\" fill=\"#F9A8D4\" opacity=\".55\"/>\n" +
    "    <ellipse cx=\"44.6\" cy=\"21.3\" rx=\"1.9\" ry=\"1.1\" fill=\"#F9A8D4\" opacity=\".55\"/>\n" +
    "    <g id=\"pf-blushDeep\">\n" +
    "      <ellipse cx=\"25.4\" cy=\"21.3\" rx=\"2.4\" ry=\"1.4\" fill=\"#FB7185\"/>\n" +
    "      <ellipse cx=\"44.6\" cy=\"21.3\" rx=\"2.4\" ry=\"1.4\" fill=\"#FB7185\"/>\n" +
    "    </g>\n" +
    "  </g>\n" +
    "  <!-- sleep mask: parked on the forehead, slides down for naps -->\n" +
    "  <g id=\"pf-mask\">\n" +
    "    <path d=\"M25.7,11.6 Q17.5,12.6 12.8,17.8\" fill=\"none\" stroke=\"#A78BFA\" stroke-width=\"1.1\"/>\n" +
    "    <path d=\"M44.3,11.6 Q52.5,12.6 57.2,17.8\" fill=\"none\" stroke=\"#A78BFA\" stroke-width=\"1.1\"/>\n" +
    "    <g id=\"pf-maskCup\">\n" +
    "      <rect x=\"25.5\" y=\"7.6\" width=\"19\" height=\"8.2\" rx=\"4\" fill=\"#C4B5FD\" stroke=\"#7C3AED\" stroke-width=\"1\" stroke-linejoin=\"round\"/>\n" +
    "      <path d=\"M31.9,9.3 A2.6,2.6 0 1 0 34.4,12.9 A2.1,2.1 0 0 1 31.9,9.3 Z\" fill=\"#F0FDFA\" opacity=\".95\"/>\n" +
    "      <circle cx=\"38.6\" cy=\"10.3\" r=\".55\" fill=\"#F0FDFA\"/>\n" +
    "      <circle cx=\"40.8\" cy=\"13.2\" r=\".5\" fill=\"#F0FDFA\"/>\n" +
    "      <path d=\"M41.3,9.2 l.4,.9 .9,.4 -.9,.4 -.4,.9 -.4,-.9 -.9,-.4 .9,-.4 Z\" fill=\"#F0FDFA\"/>\n" +
    "    </g>\n" +
    "  </g>\n" +
    "  <!-- snap-button strap: Puffi's answer to a luggage tag -->\n" +
    "  <g id=\"pf-strap\">\n" +
    "    <path d=\"M58.6,25.5 Q59.8,27 59.5,28.6\" fill=\"none\" stroke=\"#0F766E\" stroke-width=\".8\"/>\n" +
    "    <rect x=\"57.7\" y=\"28.4\" width=\"3.4\" height=\"8.4\" rx=\"1.5\" fill=\"#F0FDFA\" stroke=\"#0F766E\" stroke-width=\".8\"/>\n" +
    "    <line x1=\"59.4\" y1=\"30\" x2=\"59.4\" y2=\"34.6\" stroke=\"#99F6E4\" stroke-width=\".6\" stroke-dasharray=\"1 1.2\"/>\n" +
    "    <circle cx=\"59.4\" cy=\"38.2\" r=\"1.9\" fill=\"#C4B5FD\" stroke=\"#7C3AED\" stroke-width=\".8\"/>\n" +
    "    <circle cx=\"59.4\" cy=\"38.2\" r=\".6\" fill=\"#7C3AED\"/>\n" +
    "  </g>\n" +
    "</g>\n" +
    "</g>\n" +
    "</g>\n" +
    "</g>\n" +
    "<!-- fluff puffs at foot level (outside the airborne groups) -->\n" +
    "<g id=\"pf-fluffG\">\n" +
    "  <circle class=\"fl\" cx=\"18\" cy=\"57.5\" r=\"1.5\" fill=\"#F0FDFA\" style=\"--fx:-8px;--fy:2px;--fr:-70deg\"/>\n" +
    "  <circle class=\"fl\" cx=\"52\" cy=\"57.5\" r=\"1.4\" fill=\"#CCFBF1\" style=\"--fx:8px;--fy:1px;--fr:80deg\"/>\n" +
    "  <path class=\"fl\" d=\"M32,57.2 q2,-1.8 4,0 q-2,1.8 -4,0 Z\" fill=\"#99F6E4\" style=\"--fx:-3px;--fy:-3px;--fr:120deg\"/>\n" +
    "  <circle class=\"fl\" cx=\"41\" cy=\"58.2\" r=\"1.1\" fill=\"#F0FDFA\" style=\"--fx:4px;--fy:-2px;--fr:-90deg\"/>\n" +
    "</g>\n" +
    "<!-- one wisp that escapes during the yawn -->\n" +
    "<g id=\"pf-fluffY\">\n" +
    "  <path class=\"fy\" d=\"M36.5,23.5 q2.2,-1.5 3.8,.4 q-2.2,1.5 -3.8,-.4 Z\" fill=\"#F0FDFA\" stroke=\"#99F6E4\" stroke-width=\".4\"/>\n" +
    "</g>\n" +
    "</svg>";

  var SHADOW = "<svg class=\"shadow\" id=\"pf-shadow\" width=\"64\" height=\"10\" viewBox=\"0 0 64 10\" aria-hidden=\"true\"><ellipse cx=\"32\" cy=\"5\" rx=\"28\" ry=\"4\" fill=\"#000\"/></svg>";

  var FX = "<div class=\"fx\" id=\"pf-fx\">" +
    "<span class=\"zz z1\">z</span>" +
    "<span class=\"zz z2\">Z</span>" +
    "<span class=\"zz z3\">z</span>" +
    "<div class=\"cloud\">✈</div>" +
    "<span class=\"hx h1\">♥</span>" +
    "<span class=\"hx h2\">♥</span>" +
    "<span class=\"hx h3\">♥</span>" +
    "</div>";

  // strap micro-motion + landing fluff, shared by several states
  function twitchStrap(k) { k.addC('twitch'); k.later(function () { k.remC('twitch'); }, 640); }
  function fluffGround(k) { k.pulse('fluff', 1800); }

  TrekMascots.register({
    id: 'puffi',
    name: 'Puffi',
    tagline: 'the neck pillow, five more minutes',
    width: 70,
    height: 64,
    css: CSS,
    svg: SVG,
    shadow: SHADOW,
    fx: FX,
    moods: ['rested', 'uneasy', 'stressed', 'bliss'],
    reducedPose: 'pose-sit mask-down eyes-closed',
    signature: 'inflate',
    shineClasses: ['sh1', 'sh2'],
    stateClasses: ['st-walk', 'st-idle', 'st-sit', 'st-sleep', 'st-stretch', 'st-wave', 'st-jump',
      'st-inflate', 'st-yawn', 'st-rollover', 'st-cloudgaze', 'st-grumble', 'st-snuggle',
      'pose-sit', 'mask-down',
      'look-down', 'look-up', 'look-l', 'look-r', 'eyes-closed', 'squint', 'hop',
      'twitch', 'flutter', 'flopL', 'flopR', 'blush-deep', 'brows-knit', 'fluff', 'fluffY'],
    afterState: { sleep: 'stretch', stretch: 'idle', rollover: 'idle' },
    glide: null,
    blinkMs: 200,
    blinkEvery: [3000, 7000],
    config: {
      turnPad: 20,
      edgeSnap: 34,
      speed: { rested: 16, uneasy: 14, stressed: 26, bliss: 12 },
      step:  { rested: '0.95s', uneasy: '1.05s', stressed: '0.6s', bliss: '1.1s' },
      waveEveryMs: 150000,
      dur: {
        walk: [3200, 8000], idle: [2200, 4600], sit: [4000, 9000], sleep: [9000, 16000],
        stretch: [1950, 1950], wave: [2200, 2200], jump: [1300, 1300],
        inflate: [3600, 3600], yawn: [2500, 2500], rollover: [4700, 4700],
        cloudgaze: [4100, 4100], grumble: [2900, 2900], snuggle: [3800, 5200]
      },
      weights: {
        rested:   { walk: 5,   idle: 4,   sit: 3.4, yawn: 2.4, cloudgaze: 1.6, snuggle: .8,  inflate: .5,  jump: .5, wave: .5, rollover: .35, grumble: .2 },
        uneasy:   { walk: 4,   idle: 3.6, sit: 4.2, yawn: 3.6, cloudgaze: .8,  snuggle: .6,  inflate: .45, jump: .3, wave: .3, rollover: .5,  grumble: 1.1 },
        stressed: { walk: 6.5, idle: 2.6, sit: 1.4, yawn: 1.6, cloudgaze: .2,  snuggle: .1,  inflate: .3,  jump: .9, wave: .2, rollover: .7,  grumble: 3.2 },
        bliss:    { walk: 3,   idle: 3.4, sit: 4.4, yawn: 2.2, cloudgaze: 1.4, snuggle: 2.2, inflate: .7,  jump: .5, wave: .7, rollover: .3,  grumble: 0 }
      },
      sleepFromSit: { rested: 3.4, uneasy: 4.4, stressed: .05, bliss: 5.5 }
    },

    onTurn: function (k) { k.pulse('flutter', 680); },   // strap flutters on turn-around
    moodFromTrip: function (days, ongoing) {
      if (ongoing === true) return 'bliss';
      if (days !== null && days >= 0 && days <= 7) return 'stressed';
      if (days !== null && days > 7 && days <= 14) return 'uneasy';
      return 'rested';
    },
    onMood: function (k, m, changed) {
      if (m === 'bliss') {
        if (!k._umbOn) {
          k._umbOn = true;
          setTimeout(function () { if (k._umbOn) k.addC('umb-on'); }, 900);
        }
      } else if (k._umbOn) {
        k._umbOn = false;
        k.remC('umb-on');
      }
      if (changed && m === 'stressed' && !TrekMascots.reduced && (k.state === 'sleep' || k.state === 'sit')) {
        k.setState(k.state === 'sleep' ? 'stretch' : 'grumble'); // no time for napping
      }
    },
    ambient: function (k) {
      // one U-end loses tension every so often; a pillow's version of an ear flick
      (function flopLoop() {
        setTimeout(function () {
          if (k.dead) return;
          if (k.state === 'idle') k.pulse(Math.random() < .5 ? 'flopL' : 'flopR', 1000);
          flopLoop();
        }, k.rand(13000, 28000));
      })();
    },

    enter: {
      walk: function (k) { if (Math.random() < .25) k.setDir(-k.dir); },
      idle: function (k) {
        if (k.mood === 'bliss' && Math.random() < .6) k.addC('squint');
        if (Math.random() < .7) k.later(function () {
          k.addC(Math.random() < .5 ? 'look-l' : 'look-r');
          k.later(function () { k.remC('look-l'); k.remC('look-r'); }, k.rand(700, 1300));
        }, k.rand(400, 1600));
        if (Math.random() < (k.mood === 'uneasy' ? .85 : .45)) k.later(function () { twitchStrap(k); }, k.rand(700, 2400));
      },
      sit: function (k) {
        k.addC('pose-sit');
        if (k.mood === 'bliss' && Math.random() < .7) k.addC('squint');
        if (Math.random() < (k.mood === 'uneasy' ? .8 : .4)) k.later(function () { twitchStrap(k); }, k.rand(1200, 3600));
        if (Math.random() < .45) k.later(function () {
          k.addC('look-down');
          k.later(function () { k.remC('look-down'); }, k.rand(900, 1500));
        }, k.rand(600, 1800));
      },
      sleep: function (k) {
        k.addC('pose-sit');
        k.later(function () { k.addC('mask-down'); }, 420);
      },
      stretch: function (k) { k.addC('eyes-closed'); k.later(function () { k.remC('eyes-closed'); }, 800); },
      wave: function (k) {
        k.lastWave = performance.now();
        k.later(function () { k.addC('squint'); }, 500);
        if (k.mood === 'bliss') {
          k.later(function () { k.addC('hop'); }, 1300);
          k.later(function () { k.remC('hop'); }, 1900);
        }
        k.later(function () { k.remC('squint'); }, 1800);
      },
      jump: function (k) {
        if (k.mood === 'stressed') {
          // low panic hop: braces, lands with an oof
          k.later(function () { k.addC('eyes-closed'); }, 700);
          k.later(function () { k.remC('eyes-closed'); fluffGround(k); }, 1000);
        } else {
          k.later(function () { k.addC('squint'); }, 450);
          k.later(function () { k.remC('squint'); }, 950);
          k.later(function () { fluffGround(k); }, 1010);   // fluff on landing
        }
      },
      // signature move: the Blowfish — puff up, hold it, lose it, flop, bounce back
      inflate: function (k) {
        k.later(function () { k.addC('eyes-closed'); }, 550);
        k.later(function () { k.remC('eyes-closed'); }, 1900);  // air escapes, eyes pop open
        k.later(function () { fluffGround(k); }, 2560);         // the flop
        k.later(function () { k.addC('squint'); }, 3150);       // no harm done
      },
      yawn: function (k) {
        k.later(function () { k.addC('eyes-closed'); }, 480);
        k.later(function () { k.pulse('fluffY', 1700); }, 950); // one wisp escapes
        k.later(function () { k.remC('eyes-closed'); }, 1950);
      },
      // tips onto his side, two honest attempts, rights himself, pretends it never happened
      rollover: function (k) {
        k.later(function () { fluffGround(k); }, 660);          // side impact
        k.later(function () { k.addC('look-l'); }, 950);
        k.later(function () { k.remC('look-l'); k.addC('look-r'); }, 1320);
        k.later(function () { k.remC('look-r'); }, 1650);
        k.later(function () { k.addC('eyes-closed'); }, 1720);  // effort
        k.later(function () { k.remC('eyes-closed'); }, 2700);
        k.later(function () { k.addC('blush-deep'); }, 3650);   // nobody saw that
        k.later(function () { k.addC('look-r'); }, 3850);
        k.later(function () { k.remC('look-r'); k.addC('look-l'); }, 4250);
      },
      cloudgaze: function (k) {
        k.later(function () { k.addC('look-up'); }, 250);
        k.later(function () { k.addC('squint'); }, 2700);
        k.later(function () { k.remC('squint'); k.remC('look-up'); }, 3850);
      },
      grumble: function (k) {
        k.later(function () { k.addC('brows-knit'); }, 120);
        k.later(function () { k.addC('look-l'); }, 420);
        k.later(function () { k.remC('look-l'); k.addC('look-r'); }, 920);
        k.later(function () { k.remC('look-r'); }, 1360);
        k.later(function () { k.remC('brows-knit'); k.addC('eyes-closed'); }, 1750); // the resigned sigh
        k.later(function () { k.remC('eyes-closed'); }, 2620);
      },
      snuggle: function (k) {
        k.addC('squint');
        if (Math.random() < .5) k.later(function () { twitchStrap(k); }, k.rand(1500, 3000));
      }
    }
  });
})();
