// Chiki -- a golden konbini karaage living in its red-striped paper pouch.
// Same contract as Koffi: pure data + choreography on the shared engine.
// The chicken and the pouch are separate rigs; the duck signature slides the
// chicken down INTO the pouch, so draw order is back panel / chicken / front
// panel and the front rim naturally hides whatever sinks below y=33.
(function () {
  'use strict';

  var CSS = "\n\n  /* ---- moving root: JS drives translate3d(x) ---- */\n\n#m-chiki .jumper, #m-chiki .flip { position: absolute; inset: 0; }\n#m-chiki .jumper { transform-origin: 50% 100%; }\n#m-chiki .flip { transition: transform .26s ease; transform-origin: 50% 50%; }\n\n#m-chiki .char {\n    display: block;\n    position: absolute;\n    left: 0;\n    bottom: 0;\n    overflow: visible;\n    /* rim: dark shadow + faint light halo so Chiki reads on any hero image */\n    filter: drop-shadow(0 1px 1px rgba(2,6,23,.35)) drop-shadow(0 0 1px rgba(248,250,252,.3));\n  }\n\n  /* ---- ground shadow ---- */\n#m-chiki .shadow {\n    position: absolute;\n    left: 50%;\n    bottom: 0;\n    margin-left: -30px;\n    opacity: .17;\n    filter: blur(1.1px);\n    transform-origin: 50% 100%;\n    transition: transform .4s ease, opacity .4s ease;\n  }\n#m-chiki.pose-sit .shadow { transform: scaleX(1.1); opacity: .21; }\n\n  /* ---- SVG group plumbing: CSS transforms in viewBox units ---- */\n  #ck-root, #ck-body, #ck-pouch, #ck-legL, #ck-legR, #ck-chick, #ck-breathe, #ck-face, #ck-nubL, #ck-nubR, #ck-pupils, #ck-lids, #ck-squint, #ck-steam, #ck-priceCard, #ck-tourTag { transform-box: view-box; }\n\n#ck-root { transform-origin: 30px 64px; transition: transform .5s cubic-bezier(.4,0,.3,1); }\n#ck-body { transform-origin: 30px 57px; transition: transform .45s cubic-bezier(.34,1.4,.64,1); }\n#ck-pouch { transform-origin: 30px 57px; }\n#ck-legL { transform-origin: 23px 56px; transition: transform .45s cubic-bezier(.34,1.4,.64,1); }\n#ck-legR { transform-origin: 37px 56px; transition: transform .45s cubic-bezier(.34,1.4,.64,1); }\n#ck-chick { transform-origin: 30px 38px; transition: transform .34s cubic-bezier(.34,1.3,.64,1); }\n#ck-breathe { transform-origin: 30px 36px; animation: ckBreathe 3.6s ease-in-out infinite; }\n#ck-face { transform-origin: 30px 26px; }\n#ck-nubL { transform-origin: 17px 26px; transform: rotate(4deg); transition: transform .3s ease; }\n#ck-nubR { transform-origin: 43px 26px; transform: rotate(-4deg); transition: transform .3s ease; }\n#ck-lids { transform-origin: 30px 19.8px; transform: scaleY(0); transition: transform .09s ease-out; }\n#ck-pupils { transform-origin: 30px 24px; transition: transform .3s ease, opacity .12s ease; animation: ckDrift 9s ease-in-out infinite; }\n#ck-squint { opacity: 0; transition: opacity .12s ease; }\n#ck-jaw { transform-box: fill-box; transform-origin: center; }\n\n  /* ---- steam: always on; moods turn the burner up or down ---- */\n#ck-steam { transform-origin: 30px 10px; transition: transform .45s ease, opacity .35s ease; opacity: .55; }\n#m-chiki .wisp { transform-box: fill-box; transform-origin: 50% 100%; opacity: 0; animation: ckSteamRise 3.4s ease-in-out infinite; }\n#ck-s2 { animation-delay: 1.15s; }\n#ck-s3 { animation-delay: 2.2s; }\n#m-chiki.mood-lukewarm #ck-s3 { animation: none; }\n#m-chiki.mood-warm #ck-steam { opacity: .78; }\n#m-chiki.mood-warm .wisp { animation-duration: 2.9s; }\n#m-chiki.mood-fresh #ck-steam { opacity: 1; }\n#m-chiki.mood-fresh .wisp { animation-duration: 2.3s; }\n#m-chiki.mood-ontour #ck-steam { opacity: .8; }\n#m-chiki.st-sleep #ck-steam { opacity: .28; }\n#m-chiki.st-sleep .wisp { animation-duration: 6.5s; }\n#m-chiki.duck-in #ck-steam, #m-chiki.duck-peek #ck-steam { opacity: 0; }\n\n  /* ---- eyes ---- */\n#m-chiki.blink #ck-lids, #m-chiki.st-sleep #ck-lids, #m-chiki.eyes-closed #ck-lids { transform: scaleY(1); }\n#m-chiki.look-down #ck-pupils { animation: none; transform: translate(.8px, 1.9px); }\n#m-chiki.look-up   #ck-pupils { animation: none; transform: translate(.5px, -2px); }\n#m-chiki.look-l    #ck-pupils { animation: none; transform: translate(-1.4px, .2px); }\n#m-chiki.look-r    #ck-pupils { animation: none; transform: translate(1.4px, .2px); }\n#m-chiki.squint #ck-pupils { opacity: 0; }\n#m-chiki.squint #ck-squint { opacity: 1; }\n#m-chiki.panic #ck-pupils { animation: none; transform: scale(1.32); }\n#m-chiki.panic #ck-nubL { animation: ckFlail .26s ease-in-out infinite; }\n#m-chiki.panic #ck-nubR { animation: ckFlail .26s ease-in-out infinite; animation-delay: -.13s; }\n\n  /* ---- paper crinkle (idle micro-motion + turn-arounds) ---- */\n#m-chiki.crinkle #ck-pouch { animation: ckCrinkle .55s ease-in-out; }\n\n  /* ---- walk: pouch waddle, chicken counter-bob, steam trails back ---- */\n#m-chiki.st-walk #ck-legL { animation: ckStep var(--step) ease-in-out infinite; }\n#m-chiki.st-walk #ck-legR { animation: ckStep var(--step) ease-in-out infinite; animation-delay: calc(var(--step) / -2); }\n#m-chiki.st-walk #ck-pouch { animation: ckRock var(--step) ease-in-out infinite; }\n#m-chiki.st-walk #ck-chick { animation: ckBobC calc(var(--step) / 2) ease-in-out infinite; animation-delay: calc(var(--step) / -4); }\n#m-chiki.st-walk #ck-face { animation: ckJig calc(var(--step) / 2) ease-in-out infinite; animation-delay: calc(var(--step) / -10); }\n#m-chiki.st-walk #ck-steam { animation: ckSteamTrail var(--step) ease-in-out infinite; }\n\n  /* ---- sit / sleep pose ---- */\n#m-chiki.pose-sit #ck-body { transform: translateY(4.5px); }\n#m-chiki.pose-sit #ck-legL { transform: translate(3px, 4.5px) rotate(48deg); }\n#m-chiki.pose-sit #ck-legR { transform: translate(-3px, 4.5px) rotate(-48deg); }\n#m-chiki.pose-sit #ck-chick { transform: translateY(2.5px); }\n#m-chiki.st-sleep #ck-chick { transform: translateY(7.5px) rotate(-3deg); }\n#m-chiki.st-sleep #ck-breathe { animation-name: ckBreatheDeep; animation-duration: 4.8s; }\n\n  /* ---- sleep z's (outside the flip wrapper: glyphs never mirror) ---- */\n#m-chiki .fx { position: absolute; inset: 0; pointer-events: none; }\n#m-chiki .zz {\n    position: absolute; top: 4px; opacity: 0;\n    font: italic 700 12px/1 \"Trebuchet MS\", \"Segoe UI\", sans-serif;\n    color: #FEF3C7;\n    text-shadow: 0 1px 2px rgba(69,26,3,.7);\n  }\n#m-chiki .z1 { left: 36px; }\n#m-chiki .z2 { left: 27px; }\n#m-chiki .z3 { left: 43px; }\n#m-chiki.st-sleep .z1 { animation: ckZ 2.8s ease-in-out infinite; }\n#m-chiki.st-sleep .z2 { animation: ckZ 2.8s ease-in-out .9s infinite; }\n#m-chiki.st-sleep .z3 { animation: ckZ 2.8s ease-in-out 1.8s infinite; }\n\n  /* ---- state one-shots ---- */\n#m-chiki.st-wave #ck-nubR { animation: ckWave 1.9s ease-in-out; }\n\n#m-chiki.st-jump .jumper { animation: ckJump .95s cubic-bezier(.4,0,.4,1); }\n#m-chiki.st-jump .shadow { animation: ckShadowJump .95s cubic-bezier(.4,0,.4,1); }\n\n#m-chiki.hop .jumper { animation: ckHop .45s ease-in-out; }\n#m-chiki.hop .shadow { animation: ckShadowHop .45s ease-in-out; }\n\n#m-chiki.st-peek #ck-root { transform: rotate(8deg) translateX(1.5px); }\n\n#m-chiki.st-stretch #ck-root { animation: ckStretch 1.7s ease-in-out; }\n#m-chiki.st-stretch #ck-nubL { animation: ckNubStretchB 1.7s ease-in-out; }\n#m-chiki.st-stretch #ck-nubR { animation: ckNubStretchF 1.7s ease-in-out; }\n#m-chiki.st-stretch #ck-chick { animation: ckChickRise 1.7s ease-in-out; }\n\n  /* ---- duck (signature): drop in, peek over the rim, pop back out ---- */\n#m-chiki.psquash #ck-pouch { animation: ckPSquash .5s ease-out; }\n#m-chiki.duck-in #ck-chick { transform: translateY(16px); transition: transform .3s cubic-bezier(.55,0,.8,.6); }\n#m-chiki.duck-peek #ck-chick { transform: translateY(8.5px); transition: transform .4s cubic-bezier(.34,1.3,.64,1); }\n#m-chiki.popout #ck-chick { animation: ckPop .6s cubic-bezier(.3,1.5,.5,1); }\n\n  /* ---- steam state: burner on max ---- */\n#m-chiki.st-steam #ck-steam { opacity: 1; transform: scale(1.3); }\n#m-chiki.st-steam .wisp { animation-duration: 1.9s; }\n#m-chiki.st-steam #ck-chick { animation: ckWiggle 2.6s ease-in-out; }\n\n  /* ---- nibble: lean to the rim, chew, crumbs drop ---- */\n#m-chiki.st-nibble #ck-chick { transform: translate(1.5px, 5.5px) rotate(9deg); transition: transform .5s cubic-bezier(.4,0,.3,1); }\n#m-chiki.munch #ck-jaw { animation: ckChew .3s ease-in-out infinite; }\n#m-chiki.crumbfall .cf { animation: ckCrumbFall .7s ease-in forwards; }\n\n  /* ---- wobble: pouch tips past balance, teeters, recovers ---- */\n#m-chiki.st-wobble #ck-root { animation: ckTip 2.75s cubic-bezier(.45,.05,.55,.95); }\n#m-chiki.st-wobble .shadow { animation: ckShadowTip 2.75s ease-in-out; }\n\n  /* ---- season: wet-dog shake, spice flies ---- */\n#m-chiki.st-season #ck-root { animation: ckShakeR 2.35s ease-in-out; }\n#m-chiki.spicefly .spk { animation: ckSpice .8s ease-out forwards; }\n#m-chiki.spicefly .spk:nth-child(2n) { animation-duration: .95s; }\n\n  /* ---- price sticker split-flap + unmirrored number ---- */\n#ck-priceCard { transform-origin: 39.6px 46.8px; }\n#ck-priceNum { opacity: 0; transform-box: fill-box; transform-origin: center; transition: opacity .18s ease; }\n#ck-priceLines { transition: opacity .18s ease; }\n#m-chiki.flipped #ck-priceNum { transform: scaleX(-1); } /* counter-flip: glyphs never mirror */\n#m-chiki.price-num #ck-priceNum { opacity: 1; }\n#m-chiki.price-num #ck-priceLines { opacity: 0; }\n#m-chiki.flipping #ck-priceCard { animation: ckFlip .82s ease-in-out; }\n\n  /* ---- airport-tag sticker: slides in once on tour ---- */\n#ck-tourTag { transform: translateY(-8px); opacity: 0; transition: transform .6s cubic-bezier(.34,1.56,.64,1) .1s, opacity .3s ease .1s; }\n#m-chiki.tour-on #ck-tourTag { transform: translateY(0); opacity: .95; }\n\n  /* ---- grease glints + particles ---- */\n#m-chiki .streak { transform-box: view-box; opacity: 0; }\n#m-chiki .crumb, #m-chiki .bp, #m-chiki .spk, #m-chiki .cf, #m-chiki .pg { opacity: 0; transform-box: fill-box; transform-origin: center; }\n#m-chiki.sh1 #ck-shine1 { animation: ckShine .9s ease-in-out; }\n#m-chiki.sh2 #ck-shine2 { animation: ckShine .8s ease-in-out; }\n#m-chiki.burst .bp { animation: ckBurstPuff .7s ease-out; }\n#m-chiki.burst .crumb, #m-chiki.crumbs .crumb { animation: ckCrumb .85s ease-out forwards; }\n#m-chiki.burst .crumb:nth-child(2n) { animation-duration: .7s; }\n#m-chiki.puffG .pg { animation: ckPuff .6s ease-out; }\n\n  /* ---- keyframes ---- */\n  @keyframes ckStep    { 0%,100% { transform: rotate(18deg); } 50% { transform: rotate(-18deg); } }\n  @keyframes ckRock    { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }\n  @keyframes ckBobC    { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1.6px); } }\n  @keyframes ckJig     { 0%,100% { transform: translateY(0); } 50% { transform: translateY(.7px); } }\n  @keyframes ckSteamTrail { 0%,100% { transform: translateX(-2px) rotate(4deg); } 50% { transform: translateX(-3px) rotate(6deg); } }\n  @keyframes ckBreathe     { 0%,100% { transform: scale(1); } 50% { transform: scale(1.012, 1.03); } }\n  @keyframes ckBreatheDeep { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02, 1.05); } }\n  @keyframes ckDrift {\n    0%,100% { transform: translate(0,0); }\n    22%     { transform: translate(.7px,.3px); }\n    48%     { transform: translate(-.6px,.5px); }\n    72%     { transform: translate(.3px,-.3px); }\n  }\n  @keyframes ckSteamRise {\n    0%   { opacity: 0; transform: translateY(3px) scale(.7); }\n    25%  { opacity: .9; }\n    60%  { opacity: .5; }\n    100% { opacity: 0; transform: translateY(-7px) scale(1.15); }\n  }\n  @keyframes ckZ {\n    0%   { opacity: 0; transform: translate(0, 6px) scale(.6); }\n    25%  { opacity: .9; }\n    100% { opacity: 0; transform: translate(10px, -24px) scale(1.35); }\n  }\n  @keyframes ckJump {\n    0%   { transform: translateY(0)     scale(1); }\n    16%  { transform: translateY(0)     scale(1.12, .82); }  /* anticipation squash */\n    28%  { transform: translateY(-9px)  scale(.94, 1.08); }  /* launch stretch */\n    50%  { transform: translateY(-26px) scale(1, 1.02); }\n    72%  { transform: translateY(-2px)  scale(.98, 1.02); }\n    82%  { transform: translateY(0)     scale(1.14, .82); }  /* landing squash */\n    92%  { transform: translateY(0)     scale(.97, 1.03); }\n    100% { transform: translateY(0)     scale(1); }\n  }\n  @keyframes ckShadowJump {\n    0%   { transform: scale(1); opacity: .17; }\n    16%  { transform: scale(1.08, 1); opacity: .2; }\n    50%  { transform: scale(.55); opacity: .06; }\n    82%  { transform: scale(1.14, 1); opacity: .22; }\n    100% { transform: scale(1); opacity: .17; }\n  }\n  @keyframes ckHop {\n    0%   { transform: translateY(0)    scale(1); }\n    25%  { transform: translateY(0)    scale(1.06, .9); }\n    55%  { transform: translateY(-8px) scale(.98, 1.04); }\n    85%  { transform: translateY(0)    scale(1.05, .94); }\n    100% { transform: translateY(0)    scale(1); }\n  }\n  @keyframes ckShadowHop { 0%,100% { transform: scale(1); opacity: .17; } 55% { transform: scale(.85); opacity: .12; } }\n  @keyframes ckWave {\n    0%   { transform: rotate(-4deg); }\n    18%  { transform: rotate(-138deg); }\n    32%  { transform: rotate(-116deg); }\n    46%  { transform: rotate(-142deg); }\n    60%  { transform: rotate(-116deg); }\n    74%  { transform: rotate(-138deg); }\n    100% { transform: rotate(-4deg); }\n  }\n  @keyframes ckStretch {\n    0%   { transform: scale(1); }\n    30%  { transform: scale(.96, 1.06); }\n    62%  { transform: scale(.96, 1.065); }\n    82%  { transform: scale(1.04, .95); }\n    100% { transform: scale(1); }\n  }\n  @keyframes ckNubStretchF { 0%,100% { transform: rotate(-4deg); } 30%,65% { transform: rotate(-160deg); } }\n  @keyframes ckNubStretchB { 0%,100% { transform: rotate(4deg); }  30%,65% { transform: rotate(160deg); } }\n  @keyframes ckChickRise   { 0%,100% { transform: translateY(0); } 30%,65% { transform: translateY(-3.5px); } }\n  @keyframes ckPSquash { 0% { transform: scale(1); } 35% { transform: scale(1.08, .88); } 70% { transform: scale(.97, 1.03); } 100% { transform: scale(1); } }\n  @keyframes ckPop {\n    0%   { transform: translateY(9px)  scale(.9, 1.05); }\n    45%  { transform: translateY(-4px) scale(.96, 1.06); }\n    72%  { transform: translateY(1px)  scale(1.05, .95); }\n    100% { transform: translateY(0)    scale(1); }\n  }\n  @keyframes ckWiggle {\n    0%,100% { transform: rotate(0); }\n    15% { transform: rotate(-2.5deg); }\n    30% { transform: rotate(2.5deg); }\n    45% { transform: rotate(-2deg); }\n    60% { transform: rotate(2deg); }\n    78% { transform: rotate(-1deg); }\n  }\n  @keyframes ckChew { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.9) translateY(.4px); } }\n  @keyframes ckCrumbFall {\n    0%   { opacity: 0; transform: translate(0,0) rotate(0); }\n    15%  { opacity: .95; }\n    100% { opacity: 0; transform: translate(var(--fx, 2px), 12px) rotate(70deg); }\n  }\n  @keyframes ckTip {\n    0%   { transform: rotate(0); }\n    16%  { transform: rotate(-4deg); }    /* counter-lean before losing it */\n    30%  { transform: rotate(11deg); }\n    42%  { transform: rotate(13.5deg); }\n    55%  { transform: rotate(12deg); }\n    68%  { transform: rotate(13.5deg); }  /* teeter on the fold */\n    80%  { transform: rotate(-5deg); }\n    90%  { transform: rotate(3deg); }\n    100% { transform: rotate(0); }\n  }\n  @keyframes ckShadowTip { 0%,100% { transform: scale(1); opacity: .17; } 45% { transform: scaleX(.8); opacity: .12; } }\n  @keyframes ckFlail { 0%,100% { transform: rotate(-32deg); } 50% { transform: rotate(42deg); } }\n  @keyframes ckShakeR {\n    0%   { transform: rotate(0); }\n    10%  { transform: rotate(-8deg); }\n    18%  { transform: rotate(7deg); }\n    26%  { transform: rotate(-7deg); }\n    34%  { transform: rotate(7deg); }\n    42%  { transform: rotate(-6deg); }\n    50%  { transform: rotate(6deg); }\n    60%  { transform: rotate(-4deg); }\n    72%  { transform: rotate(3deg); }\n    84%  { transform: rotate(-1.5deg); }\n    100% { transform: rotate(0); }\n  }\n  @keyframes ckSpice {\n    0%   { opacity: 0; transform: translate(0,0) scale(.4) rotate(0); }\n    12%  { opacity: 1; }\n    100% { opacity: 0; transform: translate(var(--cx), var(--cy)) scale(1.05) rotate(var(--cr)); }\n  }\n  @keyframes ckFlip {\n    0%,25%,50%,75%,100%        { transform: scaleY(1); }\n    12.5%,37.5%,62.5%,87.5%    { transform: scaleY(.08); }\n  }\n  @keyframes ckShine {\n    0%   { opacity: 0; transform: translateX(-6px); }\n    20%  { opacity: .85; }\n    100% { opacity: 0; transform: translateX(9px); }\n  }\n  @keyframes ckBurstPuff {\n    0%   { opacity: 0; transform: translate(0,0) scale(.5); }\n    15%  { opacity: .85; }\n    100% { opacity: 0; transform: translate(var(--px, 0px), var(--py, -14px)) scale(1.6); }\n  }\n  @keyframes ckCrumb {\n    0%   { opacity: 0; transform: translate(0,0) scale(.4) rotate(0); }\n    12%  { opacity: 1; }\n    100% { opacity: 0; transform: translate(var(--cx), var(--cy)) scale(1) rotate(var(--cr)); }\n  }\n  @keyframes ckPuff {\n    0%   { opacity: 0; transform: translate(0,0) scale(.4); }\n    18%  { opacity: .55; }\n    100% { opacity: 0; transform: translate(var(--px), var(--py)) scale(1.25); }\n  }\n  @keyframes ckCrinkle { 0%,100% { transform: scale(1) rotate(0); } 30% { transform: scale(1.025, .975) rotate(.6deg); } 65% { transform: scale(.985, 1.015) rotate(-.5deg); } }\n\n  /* ---- reduced motion: freeze the always-on loops, keep a soft steam hint ---- */\n  @media (prefers-reduced-motion: reduce) {\n    #m-chiki .wisp { animation: none; opacity: .3; }\n    #ck-breathe, #ck-pupils { animation: none; }\n  }\n";

  var SVG = "<svg class=\"char\" id=\"ck-chiki\" width=\"66\" height=\"72.6\" viewBox=\"0 0 60 66\" aria-hidden=\"true\" xmlns=\"http://www.w3.org/2000/svg\">\n        <title>Chiki the konbini karaage</title>\n        <defs>\n          <clipPath id=\"ck-cpPouch\"><path d=\"M13,33 L47,33 L44,55 Q43.7,57.5 41.2,57.5 L18.8,57.5 Q16.3,57.5 16,55 Z\"/></clipPath>\n          <clipPath id=\"ck-cpSh1\"><ellipse cx=\"24\" cy=\"15\" rx=\"4.4\" ry=\"3\" transform=\"rotate(-18 24 15)\"/></clipPath>\n          <clipPath id=\"ck-cpSh2\"><ellipse cx=\"38.5\" cy=\"18\" rx=\"3.6\" ry=\"2.6\" transform=\"rotate(14 38.5 18)\"/></clipPath>\n        </defs>\n        <g id=\"ck-root\">\n          <!-- paper-fold legs -->\n          <g id=\"ck-legL\">\n            <rect x=\"19.8\" y=\"55\" width=\"6.4\" height=\"8\" rx=\"3\" fill=\"#FEF2F2\" stroke=\"#9F1239\" stroke-width=\".8\"/>\n            <line x1=\"21\" y1=\"58.5\" x2=\"25\" y2=\"58.2\" stroke=\"#FCA5A5\" stroke-width=\".7\"/>\n            <ellipse cx=\"23\" cy=\"63.7\" rx=\"4.6\" ry=\"2.2\" fill=\"#FECACA\" stroke=\"#9F1239\" stroke-width=\".8\"/>\n          </g>\n          <g id=\"ck-legR\">\n            <rect x=\"33.8\" y=\"55\" width=\"6.4\" height=\"8\" rx=\"3\" fill=\"#FEF2F2\" stroke=\"#9F1239\" stroke-width=\".8\"/>\n            <line x1=\"35\" y1=\"58.2\" x2=\"39\" y2=\"58.5\" stroke=\"#FCA5A5\" stroke-width=\".7\"/>\n            <ellipse cx=\"37\" cy=\"63.7\" rx=\"4.6\" ry=\"2.2\" fill=\"#FECACA\" stroke=\"#9F1239\" stroke-width=\".8\"/>\n          </g>\n\n          <g id=\"ck-body\">\n            <!-- pouch back panel: the chicken sits in front of this, behind the front -->\n            <g id=\"ck-pouchBack\">\n              <path d=\"M14.5,31 L45.5,31 L43.4,53.5 Q43.2,55.5 41,55.5 L19,55.5 Q16.8,55.5 16.6,53.5 Z\"\n                    fill=\"#FECACA\" stroke=\"#9F1239\" stroke-width=\"1\" stroke-linejoin=\"round\"/>\n              <path d=\"M15.5,31.8 L44.5,31.8 L44.2,34.8 L15.8,34.8 Z\" fill=\"#FCA5A5\" opacity=\".6\"/>\n            </g>\n\n            <!-- chicken -->\n            <g id=\"ck-chick\">\n              <g id=\"ck-breathe\">\n                <!-- steam wisps: the always-on tell that Chiki is fresh out of the fryer -->\n                <g id=\"ck-steam\" fill=\"none\" stroke-linecap=\"round\">\n                  <path id=\"ck-s1\" class=\"wisp\" d=\"M23.5,10 Q21.5,7.5 23.5,5 Q25.5,2.8 23.8,0.5\" stroke=\"#F8FAFC\" stroke-width=\"1.3\"/>\n                  <path id=\"ck-s2\" class=\"wisp\" d=\"M30.5,8.5 Q28.4,6 30.5,3.5 Q32.6,1.2 30.8,-1.2\" stroke=\"#F1F5F9\" stroke-width=\"1.4\"/>\n                  <path id=\"ck-s3\" class=\"wisp\" d=\"M37,10.5 Q35.2,8.2 37,6 Q38.8,3.8 37.3,1.6\" stroke=\"#F8FAFC\" stroke-width=\"1.1\"/>\n                </g>\n\n                <!-- crust nubs (wing lumps, painted behind the crust) -->\n                <g id=\"ck-nubL\">\n                  <path d=\"M18.5,22.5 Q13.5,23 13,27 Q13.2,30.5 17.5,30.5 Z\" fill=\"#F59E0B\" stroke=\"#92400E\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/>\n                </g>\n                <g id=\"ck-nubR\">\n                  <path d=\"M41.5,22.5 Q46.5,23 47,27 Q46.8,30.5 42.5,30.5 Z\" fill=\"#F59E0B\" stroke=\"#92400E\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/>\n                </g>\n\n                <!-- bumpy crust body -->\n                <path id=\"ck-crust\" d=\"M19,38.5 Q15.5,36.5 15.8,32.5 Q13.6,30 15,26.5 Q13.8,22.5 16.8,20 Q16.4,15.5 20.4,13.8 Q21.4,9.6 25.6,9.6 Q28,6.8 31.4,8.4 Q35.4,6.9 37.6,10.2 Q41.8,10.6 42.6,14.6 Q46.2,16.4 45.4,20.4 Q47.8,23.6 46,27 Q47.4,30.6 44.8,33 Q45,36.8 41.4,38.6 Q36,40.8 30,40.8 Q24,40.8 19,38.5 Z\"\n                      fill=\"#F59E0B\" stroke=\"#92400E\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/>\n\n                <!-- crust patches + crumb texture -->\n                <path d=\"M20.5,14.8 Q23,12.4 26,13.6 Q24,16.6 20.5,14.8 Z\" fill=\"#FBBF24\" opacity=\".8\"/>\n                <ellipse cx=\"35\" cy=\"13.5\" rx=\"2.6\" ry=\"1.6\" fill=\"#D97706\" opacity=\".5\" transform=\"rotate(15 35 13.5)\"/>\n                <ellipse cx=\"19.5\" cy=\"27\" rx=\"2\" ry=\"1.3\" fill=\"#D97706\" opacity=\".5\" transform=\"rotate(-20 19.5 27)\"/>\n                <ellipse cx=\"41.5\" cy=\"30\" rx=\"2.2\" ry=\"1.4\" fill=\"#B45309\" opacity=\".4\" transform=\"rotate(18 41.5 30)\"/>\n                <circle cx=\"24\" cy=\"33.5\" r=\"1\" fill=\"#B45309\" opacity=\".45\"/>\n                <circle cx=\"38\" cy=\"34.5\" r=\".8\" fill=\"#D97706\" opacity=\".5\"/>\n\n                <!-- sesame flecks -->\n                <ellipse cx=\"27\" cy=\"11.8\" rx=\"1\" ry=\".55\" fill=\"#FFFBEB\" stroke=\"#D97706\" stroke-width=\".4\" transform=\"rotate(-24 27 11.8)\"/>\n                <ellipse cx=\"40\" cy=\"17.5\" rx=\".9\" ry=\".5\" fill=\"#FFFBEB\" stroke=\"#D97706\" stroke-width=\".4\" transform=\"rotate(30 40 17.5)\"/>\n\n                <!-- grease glints (clipped to two crust spots) -->\n                <g clip-path=\"url(#ck-cpSh1)\"><g id=\"ck-shine1\" class=\"streak\">\n                  <rect x=\"23\" y=\"10.5\" width=\"1.8\" height=\"9\" fill=\"#FFFFFF\" transform=\"rotate(22 24 15)\"/>\n                </g></g>\n                <g clip-path=\"url(#ck-cpSh2)\"><g id=\"ck-shine2\" class=\"streak\">\n                  <rect x=\"37.8\" y=\"14\" width=\"1.6\" height=\"8\" fill=\"#FFFFFF\" transform=\"rotate(22 38.5 18)\"/>\n                </g></g>\n\n                <!-- face -->\n                <g id=\"ck-face\">\n                  <ellipse cx=\"24.5\" cy=\"24\" rx=\"3.7\" ry=\"4.1\" fill=\"#FFFFFF\" stroke=\"#92400E\" stroke-width=\"1\"/>\n                  <ellipse cx=\"35.5\" cy=\"24\" rx=\"3.7\" ry=\"4.1\" fill=\"#FFFFFF\" stroke=\"#92400E\" stroke-width=\"1\"/>\n                  <g id=\"ck-pupils\">\n                    <circle cx=\"25.2\" cy=\"24.5\" r=\"1.8\" fill=\"#451A03\"/>\n                    <circle cx=\"36.2\" cy=\"24.5\" r=\"1.8\" fill=\"#451A03\"/>\n                    <circle cx=\"25.8\" cy=\"23.7\" r=\".6\" fill=\"#FFFFFF\"/>\n                    <circle cx=\"36.8\" cy=\"23.7\" r=\".6\" fill=\"#FFFFFF\"/>\n                  </g>\n                  <g id=\"ck-lids\">\n                    <rect x=\"20.6\" y=\"19.4\" width=\"7.8\" height=\"9.2\" rx=\"3.9\" fill=\"#F59E0B\" stroke=\"#92400E\" stroke-width=\".6\"/>\n                    <rect x=\"31.6\" y=\"19.4\" width=\"7.8\" height=\"9.2\" rx=\"3.9\" fill=\"#F59E0B\" stroke=\"#92400E\" stroke-width=\".6\"/>\n                  </g>\n                  <!-- happy squint ^ ^ overlay -->\n                  <g id=\"ck-squint\">\n                    <path d=\"M21.5,25.2 Q24.5,22.2 27.5,25.2\" fill=\"none\" stroke=\"#451A03\" stroke-width=\"1.4\" stroke-linecap=\"round\"/>\n                    <path d=\"M32.5,25.2 Q35.5,22.2 38.5,25.2\" fill=\"none\" stroke=\"#451A03\" stroke-width=\"1.4\" stroke-linecap=\"round\"/>\n                  </g>\n                  <g id=\"ck-jaw\">\n                    <path d=\"M27.5,29.5 Q30,31.6 32.5,29.5\" fill=\"none\" stroke=\"#451A03\" stroke-width=\"1.2\" stroke-linecap=\"round\"/>\n                  </g>\n                  <ellipse cx=\"21.8\" cy=\"28.2\" rx=\"1.7\" ry=\"1.1\" fill=\"#F9A8D4\" opacity=\".55\"/>\n                  <ellipse cx=\"38.2\" cy=\"28.2\" rx=\"1.7\" ry=\"1.1\" fill=\"#F9A8D4\" opacity=\".55\"/>\n                </g>\n\n                <!-- nibble crumbs: drop from the mouth toward the rim -->\n                <g id=\"ck-crumbFX\">\n                  <circle class=\"cf\" cx=\"29\" cy=\"32\" r=\".8\" fill=\"#FBBF24\" style=\"--fx:-3px\"/>\n                  <circle class=\"cf\" cx=\"31.5\" cy=\"32.5\" r=\".65\" fill=\"#D97706\" style=\"--fx:2px\"/>\n                  <rect class=\"cf\" x=\"30\" y=\"31.5\" width=\"1.2\" height=\"1.2\" fill=\"#F59E0B\" style=\"--fx:4px\"/>\n                </g>\n\n                <!-- pop burst: steam puffs + crumb confetti (duck signature) -->\n                <g id=\"ck-burstFX\">\n                  <circle class=\"bp\" cx=\"26\" cy=\"9\" r=\"2.2\" fill=\"#F8FAFC\" style=\"--px:-7px;--py:-12px\"/>\n                  <circle class=\"bp\" cx=\"34\" cy=\"8.5\" r=\"2.5\" fill=\"#F1F5F9\" style=\"--px:7px;--py:-13px\"/>\n                  <circle class=\"bp\" cx=\"30\" cy=\"7\" r=\"2\" fill=\"#F8FAFC\" style=\"--px:0px;--py:-16px\"/>\n                  <circle class=\"crumb\" cx=\"30\" cy=\"10\" r=\"1.1\" fill=\"#FBBF24\" style=\"--cx:-13px;--cy:-16px;--cr:140deg\"/>\n                  <rect class=\"crumb\" x=\"28.5\" y=\"8.5\" width=\"2.2\" height=\"2.2\" fill=\"#D97706\" style=\"--cx:10px;--cy:-19px;--cr:200deg\"/>\n                  <circle class=\"crumb\" cx=\"32\" cy=\"9\" r=\".9\" fill=\"#F59E0B\" style=\"--cx:16px;--cy:-11px;--cr:90deg\"/>\n                  <rect class=\"crumb\" x=\"29\" y=\"9.5\" width=\"1.8\" height=\"1.8\" fill=\"#FDE68A\" style=\"--cx:-16px;--cy:-8px;--cr:-160deg\"/>\n                  <circle class=\"crumb\" cx=\"31\" cy=\"8\" r=\".8\" fill=\"#B45309\" style=\"--cx:-5px;--cy:-20px;--cr:60deg\"/>\n                  <rect class=\"crumb\" x=\"30.5\" y=\"8\" width=\"1.6\" height=\"1.6\" fill=\"#FBBF24\" style=\"--cx:18px;--cy:-17px;--cr:240deg\"/>\n                </g>\n\n                <!-- season shake: sesame + chili flecks fly off -->\n                <g id=\"ck-spiceFX\">\n                  <circle class=\"spk\" cx=\"22\" cy=\"16\" r=\".8\" fill=\"#FFFBEB\" style=\"--cx:-14px;--cy:-9px;--cr:120deg\"/>\n                  <rect class=\"spk\" x=\"36\" y=\"13\" width=\"1.6\" height=\"1.6\" fill=\"#DC2626\" style=\"--cx:13px;--cy:-11px;--cr:220deg\"/>\n                  <circle class=\"spk\" cx=\"30\" cy=\"11\" r=\".7\" fill=\"#FDE68A\" style=\"--cx:2px;--cy:-15px;--cr:80deg\"/>\n                  <ellipse class=\"spk\" cx=\"25\" cy=\"13\" rx=\"1\" ry=\".5\" fill=\"#FFFBEB\" style=\"--cx:-11px;--cy:-14px;--cr:-140deg\"/>\n                  <rect class=\"spk\" x=\"33\" y=\"17\" width=\"1.4\" height=\"1.4\" fill=\"#B45309\" style=\"--cx:15px;--cy:-4px;--cr:160deg\"/>\n                  <ellipse class=\"spk\" cx=\"35\" cy=\"10.5\" rx=\".9\" ry=\".5\" fill=\"#FFFBEB\" style=\"--cx:9px;--cy:-16px;--cr:200deg\"/>\n                </g>\n              </g>\n            </g>\n\n            <!-- pouch front panel: candy stripes, folded rim, stickers -->\n            <g id=\"ck-pouch\">\n              <path d=\"M13,33 L47,33 L44,55 Q43.7,57.5 41.2,57.5 L18.8,57.5 Q16.3,57.5 16,55 Z\"\n                    fill=\"#FEF2F2\" stroke=\"#9F1239\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/>\n              <g clip-path=\"url(#ck-cpPouch)\">\n                <rect x=\"17\" y=\"33\" width=\"3.4\" height=\"25\" fill=\"#EF4444\" opacity=\".85\"/>\n                <rect x=\"24\" y=\"33\" width=\"3.4\" height=\"25\" fill=\"#EF4444\" opacity=\".85\"/>\n                <rect x=\"31\" y=\"33\" width=\"3.4\" height=\"25\" fill=\"#EF4444\" opacity=\".85\"/>\n                <rect x=\"38\" y=\"33\" width=\"3.4\" height=\"25\" fill=\"#EF4444\" opacity=\".85\"/>\n              </g>\n              <!-- folded rim -->\n              <path d=\"M13,33 L47,33 L46.5,36.8 L13.5,36.8 Z\" fill=\"#FEE2E2\" stroke=\"#9F1239\" stroke-width=\"1\" stroke-linejoin=\"round\"/>\n              <line x1=\"15\" y1=\"35\" x2=\"45.5\" y2=\"35\" stroke=\"#FCA5A5\" stroke-width=\".6\"/>\n              <!-- crinkle creases -->\n              <path d=\"M20,41 L21.5,44.5\" stroke=\"#FCA5A5\" stroke-width=\".7\" stroke-linecap=\"round\" fill=\"none\"/>\n              <path d=\"M42,44 L40.8,47.5\" stroke=\"#FCA5A5\" stroke-width=\".7\" stroke-linecap=\"round\" fill=\"none\"/>\n\n              <!-- airport-tag sticker: hidden until the trip is live -->\n              <g id=\"ck-tourTag\"><g transform=\"rotate(-8 22 45)\">\n                <rect x=\"18\" y=\"42.5\" width=\"8\" height=\"5\" rx=\"1\" fill=\"#BAE6FD\" stroke=\"#0369A1\" stroke-width=\".7\"/>\n                <line x1=\"19.4\" y1=\"43.6\" x2=\"19.4\" y2=\"46.4\" stroke=\"#0369A1\" stroke-width=\".5\"/>\n                <line x1=\"20.6\" y1=\"43.6\" x2=\"20.6\" y2=\"46.4\" stroke=\"#0369A1\" stroke-width=\".9\"/>\n                <line x1=\"22\" y1=\"43.6\" x2=\"22\" y2=\"46.4\" stroke=\"#0369A1\" stroke-width=\".5\"/>\n                <line x1=\"23.2\" y1=\"43.6\" x2=\"23.2\" y2=\"46.4\" stroke=\"#0369A1\" stroke-width=\".8\"/>\n                <circle cx=\"25\" cy=\"45\" r=\".8\" fill=\"none\" stroke=\"#0369A1\" stroke-width=\".5\"/>\n              </g></g>\n\n              <!-- price sticker; inner card does the split-flap -->\n              <g id=\"ck-price\">\n                <g id=\"ck-priceCard\">\n                  <g transform=\"rotate(7 39.6 46.8)\">\n                    <rect x=\"35.6\" y=\"43.4\" width=\"8\" height=\"6.8\" rx=\"1.2\" fill=\"#FDE68A\" stroke=\"#D97706\" stroke-width=\"1\"/>\n                    <g id=\"ck-priceLines\">\n                      <line x1=\"37\" y1=\"45.6\" x2=\"42.2\" y2=\"45.6\" stroke=\"#B45309\" stroke-width=\".8\" stroke-linecap=\"round\"/>\n                      <line x1=\"37\" y1=\"47.4\" x2=\"41\" y2=\"47.4\" stroke=\"#B45309\" stroke-width=\".8\" stroke-linecap=\"round\"/>\n                      <line x1=\"37\" y1=\"49\" x2=\"42.2\" y2=\"49\" stroke=\"#B45309\" stroke-width=\".8\" stroke-linecap=\"round\"/>\n                    </g>\n                    <text id=\"ck-priceNum\" x=\"39.6\" y=\"49.2\" text-anchor=\"middle\"\n                          font-family=\"'Trebuchet MS','Segoe UI',sans-serif\" font-size=\"5.8\" font-weight=\"700\"\n                          fill=\"#B45309\">7</text>\n                  </g>\n                </g>\n              </g>\n            </g>\n          </g>\n        </g>\n\n        <!-- ground dust puff (feet level, outside the airborne groups) -->\n        <g id=\"ck-puffG\">\n          <circle class=\"pg\" cx=\"24\" cy=\"63\" r=\"1.6\" fill=\"#E2E8F0\" style=\"--px:-8px;--py:-3px\"/>\n          <circle class=\"pg\" cx=\"36\" cy=\"63\" r=\"1.4\" fill=\"#F1F5F9\" style=\"--px:8px;--py:-4px\"/>\n          <circle class=\"pg\" cx=\"28\" cy=\"63.5\" r=\"1.1\" fill=\"#CBD5E1\" style=\"--px:-4px;--py:-6px\"/>\n          <circle class=\"pg\" cx=\"33\" cy=\"63.5\" r=\"1.2\" fill=\"#E2E8F0\" style=\"--px:5px;--py:-5px\"/>\n        </g>\n      </svg>";

  var SHADOW = "<svg class=\"shadow\" id=\"ck-shadow\" width=\"60\" height=\"10\" viewBox=\"0 0 60 10\" aria-hidden=\"true\">\n    <ellipse cx=\"30\" cy=\"5\" rx=\"26\" ry=\"4\" fill=\"#000\"/>\n  </svg>";

  var FX = "<div class=\"fx\" id=\"ck-fx\">\n    <span class=\"zz z1\">z</span>\n    <span class=\"zz z2\">z</span>\n    <span class=\"zz z3\">z</span>\n  </div>";

  // pouch micro-motion + landing dust, shared by several states
  function crinklePouch(k) { k.pulse('crinkle', 600); }
  function puffGround(k) { k.pulse('puffG', 800); }

  TrekMascots.register({
    id: 'chiki',
    name: 'Chiki',
    tagline: 'the karaage — best before: right now',
    width: 66,
    height: 73,
    css: CSS,
    svg: SVG,
    shadow: SHADOW,
    fx: FX,
    moods: ['lukewarm', 'warm', 'fresh', 'ontour'],
    reducedPose: 'pose-sit',
    signature: 'duck',
    shineClasses: ['sh1', 'sh2'],
    blinkEvery: [2400, 5800],
    stateClasses: ['st-walk', 'st-idle', 'st-sit', 'st-sleep', 'st-stretch', 'st-wave', 'st-jump',
      'st-duck', 'st-steam', 'st-nibble', 'st-wobble', 'st-season', 'st-priceflip', 'st-peek',
      'pose-sit', 'look-down', 'look-up', 'look-l', 'look-r', 'eyes-closed', 'squint', 'hop',
      'crinkle', 'psquash', 'duck-in', 'duck-peek', 'popout', 'burst', 'crumbs',
      'munch', 'crumbfall', 'panic', 'spicefly', 'flipping', 'price-num', 'puffG'],
    edgeStates: { peek: true },
    afterState: { sleep: 'stretch', stretch: 'idle' },
    glide: null,
    config: {
      turnPad: 20,
      edgeSnap: 34,
      speed: { lukewarm: 20, warm: 32, fresh: 54, ontour: 30 },
      step:  { lukewarm: '0.8s', warm: '0.6s', fresh: '0.4s', ontour: '0.68s' },
      waveEveryMs: 95000,
      dur: {
        walk: [2600, 7000], idle: [1500, 3400], sit: [3200, 7500], sleep: [6500, 12000],
        stretch: [1750, 1750], wave: [2050, 2050], jump: [1050, 1050],
        duck: [3050, 3050], steam: [2600, 2600], nibble: [3400, 3400],
        wobble: [2850, 2850], season: [2450, 2450], priceflip: [3200, 3200],
        peek: [2000, 3400]
      },
      weights: {
        lukewarm: { walk: 4.5, idle: 4.5, sit: 3.4, duck: .9,  steam: 1.6, nibble: 1.6, wobble: .5, season: .25, wave: .6,  jump: .35, peek: 1.1, priceflip: 0 },
        warm:     { walk: 6,   idle: 3,   sit: 1.8, duck: 1.4, steam: 1.6, nibble: 1.4, wobble: .7, season: .6,  wave: 1,   jump: 1.4, peek: 1.2, priceflip: 0 },
        fresh:    { walk: 7,   idle: 1.5, sit: .4,  duck: 2.6, steam: 2,   nibble: 1,   wobble: .8, season: 1.6, wave: 1.8, jump: 3,   peek: 1.1, priceflip: 1.2 },
        ontour:   { walk: 5,   idle: 3,   sit: 2.2, duck: 1.4, steam: 2.2, nibble: 1.6, wobble: .6, season: .8,  wave: 1.2, jump: 1.2, peek: 1,   priceflip: 0 }
      },
      sleepFromSit: { lukewarm: 3, warm: 1.2, fresh: 0, ontour: 1 }
    },

    onTurn: function (k) { crinklePouch(k); },   // paper protests every turn-around
    filterWeights: function (k, w) {
      if (!(k.mood === 'fresh' && k.tripDays != null)) delete w.priceflip; // the flip needs a real countdown
    },
    moodFromTrip: function (days, ongoing) {
      if (ongoing === true) return 'ontour';
      if (days !== null && days >= 0 && days <= 7) return 'fresh';
      if (days !== null && days > 7 && days <= 14) return 'warm';
      return 'lukewarm';
    },
    onMood: function (k, m, changed) {
      if (m === 'ontour') {
        if (!k._tourOn) {
          k._tourOn = true;
          setTimeout(function () { if (k._tourOn) k.addC('tour-on'); }, 700);
        }
      } else if (k._tourOn) {
        k._tourOn = false;
        k.remC('tour-on');
      }
      if (changed && m === 'fresh' && !TrekMascots.reduced && (k.state === 'sleep' || k.state === 'sit')) {
        k.setState(k.state === 'sleep' ? 'stretch' : 'jump');
      }
    },
    // occasional crinkle outside the FSM so even long sits feel papery
    ambient: function (k) {
      (function crinkleLoop() {
        setTimeout(function () {
          if (k.dead) return;
          if (k.state !== 'sleep' && Math.random() < .7) crinklePouch(k);
          crinkleLoop();
        }, k.rand(14000, 30000));
      })();
    },

    enter: {
      walk: function (k) { if (Math.random() < .3) k.setDir(-k.dir); },
      idle: function (k) {
        if (Math.random() < .8) k.later(function () {
          k.addC(Math.random() < .5 ? 'look-l' : 'look-r');
          k.later(function () { k.remC('look-l'); k.remC('look-r'); }, k.rand(500, 900));
        }, k.rand(300, 1200));
        if (Math.random() < .5) k.later(function () { crinklePouch(k); }, k.rand(600, 1800));
        if (k.mood === 'fresh' && Math.random() < .3) k.later(function () {
          k.addC('look-up');                              // watching its own steam
          k.later(function () { k.remC('look-up'); }, 700);
        }, k.rand(1400, 2200));
        if (k.mood === 'ontour' && Math.random() < .35) k.later(function () {
          k.addC('squint');                               // content on the road
          k.later(function () { k.remC('squint'); }, 800);
        }, k.rand(800, 1600));
      },
      sit: function (k) {
        k.addC('pose-sit');
        if (Math.random() < .6) k.later(function () { crinklePouch(k); }, k.rand(1000, 3000));
      },
      sleep: function (k) { k.addC('pose-sit'); },
      stretch: function (k) { k.addC('eyes-closed'); k.later(function () { k.remC('eyes-closed'); }, 650); },
      wave: function (k) {
        k.lastWave = performance.now();
        k.later(function () { k.addC('squint'); }, 450);
        k.later(function () { k.remC('squint'); }, 1550);
        if (k.mood === 'fresh') {
          k.later(function () { k.addC('hop'); }, 1400);
          k.later(function () { k.remC('hop'); }, 1850);
        }
      },
      jump: function (k) {
        k.later(function () { k.addC('squint'); }, 300);
        k.later(function () { k.remC('squint'); }, 700);
        k.later(function () { puffGround(k); }, 770);      // dust on landing
        if (k.mood === 'fresh') {
          k.later(function () { k.pulse('crumbs', 900); }, 640); // crumbs shake loose on the way down
        }
      },
      peek: function (k) {
        k.setDir(k.x - k.minX < k.maxX - k.x ? -1 : 1);
        k.later(function () { k.addC('look-down'); }, 380);
      },
      // signature move: drop into the pouch, peek over the rim, pop back out
      duck: function (k) {
        k.pulse('psquash', 550);
        k.later(function () { k.addC('duck-in'); }, 140);
        k.later(function () { k.addC('look-up'); }, 700);
        k.later(function () { k.remC('duck-in'); k.addC('duck-peek'); }, 950);   // eyes over the rim
        k.later(function () {                                                    // suspense over: pop
          k.remC('duck-peek'); k.remC('look-up');
          k.pulse('popout', 650);
        }, 1950);
        k.later(function () { k.pulse('burst', 950); }, 2000); // steam burst + crumb confetti
        k.later(function () { k.addC('squint'); }, 2150);
        k.later(function () { k.addC('hop'); }, 2300);
        k.later(function () { k.remC('hop'); }, 2750);
        k.later(function () { k.remC('squint'); }, 2950);
      },
      // self-warming: CSS opens the plume, we just add the smug face
      steam: function (k) {
        k.later(function () { k.addC('look-up'); }, 100);
        k.later(function () { k.remC('look-up'); k.addC('squint'); }, 350);
        k.later(function () { k.remC('squint'); }, 2350);
      },
      // lean to the rim, munch a crumb off the fold, drop the evidence
      nibble: function (k) {
        k.later(function () { k.addC('look-down'); }, 250);
        k.later(function () { k.addC('munch'); }, 700);
        k.later(function () { k.pulse('crumbfall', 750); }, 900);
        k.later(function () { k.pulse('crumbfall', 750); }, 1650);
        k.later(function () { k.remC('munch'); }, 2450);
        k.later(function () { k.remC('look-down'); k.addC('squint'); }, 2600);
      },
      // paper physics fail: tip past balance, flail, recover with a hop
      wobble: function (k) {
        k.later(function () { k.addC('panic'); }, 500);
        k.later(function () { k.remC('panic'); }, 1950);
        k.later(function () { k.addC('hop'); }, 2150);
        k.later(function () { puffGround(k); }, 2250);
        k.later(function () { k.remC('hop'); }, 2650);
      },
      // wet-dog shake: spice flies, then stand there proud of it
      season: function (k) {
        k.later(function () { k.pulse('spicefly', 1000); }, 500);
        k.later(function () { k.addC('squint'); }, 1750);
        k.later(function () { k.addC('hop'); }, 1950);
        k.later(function () { k.remC('hop'); }, 2400);
      },
      // konbini split-flap: the price sticker flips to days-until-trip (fresh only)
      priceflip: function (k) {
        var d = TrekMascots.clamp(Math.round(k.tripDays == null ? 0 : k.tripDays), 0, 99);
        k.later(function () { k.addC('look-down'); }, 200);
        k.later(function () { k.addC('flipping'); }, 350);
        k.later(function () {                            // swap content mid-flap
          var num = k.el.querySelector('#ck-priceNum');
          if (num) num.textContent = String(d);
          k.addC('price-num');
        }, 760);
        k.later(function () { k.remC('flipping'); }, 1250);
        k.later(function () { k.addC('squint'); }, 1500);
        k.later(function () { k.addC('hop'); }, 1600);
        k.later(function () { k.remC('hop'); k.remC('squint'); }, 2150);
        k.later(function () { k.remC('look-down'); }, 2600);
      }
    }
  });
})();
