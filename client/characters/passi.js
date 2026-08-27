// Passi -- a little burgundy passport booklet: golden globe emblem on the
// cover, fanned page edges along the open side, a silky bookmark ribbon for a
// tail and an inner page that collects visa stamps. Nimble and a bit vain
// about his photo. Runs on the shared mascot engine.
(function () {
  'use strict';

  var CSS = '' +
  '\n  /* ---- moving root: JS drives translate3d(x) ---- */\n' +
  '#m-passi .jumper, #m-passi .flip { position: absolute; inset: 0; }\n' +
  '#m-passi .jumper { transform-origin: 50% 100%; }\n' +
  '#m-passi .flip { transition: transform .24s ease; transform-origin: 50% 50%; }\n' +
  '#m-passi .char {\n' +
  '    display: block;\n' +
  '    position: absolute;\n' +
  '    left: 0;\n' +
  '    bottom: 0;\n' +
  '    overflow: visible;\n' +
  '    /* rim: dark shadow + faint light halo so Passi reads on any hero image */\n' +
  '    filter: drop-shadow(0 1px 1px rgba(2,6,23,.35)) drop-shadow(0 0 1px rgba(248,250,252,.3));\n' +
  '  }\n' +
  '\n  /* ---- ground shadow ---- */\n' +
  '#m-passi .shadow {\n' +
  '    position: absolute;\n' +
  '    left: 50%;\n' +
  '    bottom: 0;\n' +
  '    margin-left: -28px;\n' +
  '    opacity: .17;\n' +
  '    filter: blur(1.1px);\n' +
  '    transform-origin: 50% 100%;\n' +
  '    transition: transform .4s ease, opacity .4s ease;\n' +
  '  }\n' +
  '#m-passi.pose-sit .shadow { transform: scaleX(1.12); opacity: .21; }\n' +
  '#m-passi.st-sleep .shadow { transform: scaleX(1.55); opacity: .2; }\n' +
  '#m-passi.glide-out .shadow { transform: scaleX(1.28); opacity: .12; }\n' +
  '\n  /* ---- SVG group plumbing: CSS transforms in viewBox units ---- */\n' +
  '  #pp-root, #pp-trunk, #pp-breathe, #pp-face, #pp-legL, #pp-legR, #pp-coverF, #pp-wingB, #pp-fan, #pp-ribbon, #pp-lids, #pp-corner, #pp-pg1, #pp-pg2, #pp-pg3, #pp-pg4, #pp-stampRig, #pp-stampAnim, #pp-puffV, #pp-scan, #pp-squint, #pp-visaNumW { transform-box: view-box; }\n' +
  '\n' +
  '#pp-root { transform-origin: 26px 62px; transition: transform .5s cubic-bezier(.4,0,.3,1); }\n' +
  '#pp-trunk { transform-origin: 26px 52px; transition: transform .45s cubic-bezier(.34,1.4,.64,1); }\n' +
  '#pp-breathe { transform-origin: 26px 48px; animation: ppBreathe 3.2s ease-in-out infinite; }\n' +
  '#pp-legL { transform-origin: 19.6px 47px; transition: transform .45s cubic-bezier(.34,1.4,.64,1); }\n' +
  '#pp-legR { transform-origin: 32.4px 47px; transition: transform .45s cubic-bezier(.34,1.4,.64,1); }\n' +
  '  /* front cover hinges at the spine; closing is snappier than opening */\n' +
  '#pp-coverF { transform-origin: 12.9px 28px; transition: transform .17s cubic-bezier(.5,-.28,.7,1); }\n' +
  '#pp-wingB { transform-origin: 12.2px 28px; transform: scaleX(.04); transition: transform .17s cubic-bezier(.5,-.28,.7,1); }\n' +
  '#pp-fan { transform-origin: 13px 28px; }\n' +
  '#pp-ribbon { transform-origin: 16px 7.4px; animation: ppRibbonIdle 3.6s ease-in-out infinite; transition: transform 1s ease; }\n' +
  '#pp-lids { transform-origin: 24.7px 15.7px; transform: scaleY(0); transition: transform .09s ease-out; }\n' +
  '#pp-pupils { transform-box: fill-box; transform-origin: center; transition: transform .3s ease, opacity .12s ease; animation: ppDrift 8s ease-in-out infinite; }\n' +
  '#pp-corner { transform-origin: 39.2px 9.6px; animation: ppCorner 6s ease-in-out infinite; }\n' +
  '#m-passi.mood-soon #pp-corner { animation-duration: 2.8s; }\n' +
  '#m-passi.mood-hype #pp-corner { animation-duration: 3.6s; }\n' +
  '#pp-pg1, #pp-pg2, #pp-pg3, #pp-pg4 { transform-origin: 13.5px 28px; }\n' +
  '#m-passi .rif { opacity: 0; }\n' +
  '\n  /* stamp rig + impact puff + day number all steer to a slot via --sx/--sy */\n' +
  '#pp-stampAnim { opacity: 0; transform-origin: 25px 28px; }\n' +
  '#pp-stampRig, #pp-puffV, #pp-visaNumW { transform: translate(var(--sx, 0px), var(--sy, 0px)); }\n' +
  '#pp-visaNum { opacity: 0; transform-box: fill-box; transform-origin: center; transition: opacity .18s ease; }\n' +
  '#m-passi.flipped #pp-visaNum { transform: scaleX(-1); } /* counter-flip: glyphs never mirror */\n' +
  '#m-passi.visa-num #pp-visaNum { opacity: 1; }\n' +
  '\n  /* earned visa stamps: hidden until stamped, then persist for the session */\n' +
  '#m-passi .visa { opacity: 0; transform: scale(.2); transform-box: fill-box; transform-origin: center;\n' +
  '         transition: transform .5s cubic-bezier(.3,1.5,.5,1), opacity .25s ease; }\n' +
  '#m-passi.visa-on-1 #pp-visa1, #m-passi.visa-on-2 #pp-visa2, #m-passi.visa-on-3 #pp-visa3, #m-passi.visa-on-4 #pp-visa4 { opacity: .96; transform: scale(1); }\n' +
  '#m-passi.visa-b1 #pp-visa1, #m-passi.visa-b2 #pp-visa2, #m-passi.visa-b3 #pp-visa3, #m-passi.visa-b4 #pp-visa4 { animation: ppVisaPop .65s ease-in-out; }\n' +
  '\n  /* ARRIVED corner stamp: slams in once the trip is live */\n' +
  '#pp-arrived { transform-box: fill-box; transform-origin: center; transform: rotate(-16deg) scale(2.3); opacity: 0;\n' +
  '         transition: transform .55s cubic-bezier(.2,1.6,.4,1), opacity .3s ease; }\n' +
  '#m-passi.arrived-on #pp-arrived { transform: rotate(-16deg) scale(1); opacity: .95; }\n' +
  '\n' +
  '#pp-squint { opacity: 0; transition: opacity .12s ease; }\n' +
  '#m-passi .blush { transition: opacity .3s ease; }\n' +
  '#m-passi .streak, #m-passi .pd, #m-passi .pg, #m-passi .pv { opacity: 0; }\n' +
  '#m-passi .pd, #m-passi .pg, #m-passi .pv { transform-box: fill-box; transform-origin: center; }\n' +
  '#m-passi .streak { transform-box: view-box; }\n' +
  '#pp-scan { transform: translateY(-8px); }\n' +
  '\n  /* ---- eyes ---- */\n' +
  '#m-passi.blink #pp-lids, #m-passi.st-sleep #pp-lids, #m-passi.eyes-closed #pp-lids { transform: scaleY(1); }\n' +
  '#m-passi.look-down #pp-pupils { animation: none; transform: translate(.8px, 1.9px); }\n' +
  '#m-passi.look-up   #pp-pupils { animation: none; transform: translate(.5px, -2px); }\n' +
  '#m-passi.look-l    #pp-pupils { animation: none; transform: translate(-1.4px, .2px); }\n' +
  '#m-passi.look-r    #pp-pupils { animation: none; transform: translate(1.4px, .2px); }\n' +
  '#m-passi.squint #pp-pupils { opacity: 0; }\n' +
  '#m-passi.squint #pp-squint { opacity: 1; }\n' +
  '#m-passi.rigid #pp-pupils { animation: none; transform: scale(.82); } /* eyes wide, dead ahead */\n' +
  '#m-passi.dizzy #pp-pupils { animation: ppDizzy .95s ease-in-out; }\n' +
  '#m-passi.dizzy .blush { opacity: .95; }\n' +
  '\n  /* ---- ribbon twitch (idle micro-motion) ---- */\n' +
  '#m-passi.twitch #pp-ribbon { animation: ppRibbonTwitch .55s ease-in-out; }\n' +
  '\n  /* ---- walk cycle: bouncy waddle, cover chatters, pages jig ---- */\n' +
  '#m-passi.st-walk #pp-legL { animation: ppStep var(--step) ease-in-out infinite; }\n' +
  '#m-passi.st-walk #pp-legR { animation: ppStep var(--step) ease-in-out infinite; animation-delay: calc(var(--step) / -2); }\n' +
  '#m-passi.st-walk #pp-trunk { animation: ppBob calc(var(--step) / 2) ease-in-out infinite; }\n' +
  '#m-passi.st-walk #pp-face { animation: ppCounter calc(var(--step) / 2) ease-in-out infinite; animation-delay: calc(var(--step) / -10); }\n' +
  '#m-passi.st-walk #pp-ribbon { animation: ppRibbonWalk var(--step) ease-in-out infinite; animation-delay: calc(var(--step) / -7); }\n' +
  '#m-passi.st-walk #pp-coverF { animation: ppCoverChatter var(--step) ease-in-out infinite; }\n' +
  '#m-passi.st-walk #pp-fan { animation: ppFanJig calc(var(--step) / 2) ease-in-out infinite; }\n' +
  '\n  /* ribbon flutter on turn-around (after walk rules so it wins for its .6s) */\n' +
  '#m-passi.flutter #pp-ribbon { animation: ppRibbonFlutter .6s ease-in-out; }\n' +
  '\n  /* ---- paper rustle one-shot (ambient + landings) ---- */\n' +
  '#m-passi.flare #pp-fan { animation: ppFanFlare .6s ease-in-out; }\n' +
  '#m-passi.flare #pp-corner { animation: ppCornerLift .6s ease-in-out; }\n' +
  '';

  CSS += '' +
  '\n  /* ---- sit / sleep ---- */\n' +
  '#m-passi.pose-sit #pp-trunk { transform: translateY(9px); }\n' +
  '#m-passi.pose-sit #pp-legL { transform: translate(14px, 9px) rotate(84deg); }\n' +
  '#m-passi.pose-sit #pp-legR { transform: translate(11px, 9px) rotate(72deg); }\n' +
  '  /* sleep: keels over and lies flat closed, feet poking out, ribbon as blanket */\n' +
  '#m-passi.st-sleep #pp-trunk { transform-origin: 26px 49px; transform: rotate(-78deg) translateY(1px);\n' +
  '         transition: transform .9s cubic-bezier(.5,0,.4,1); }\n' +
  '#m-passi.st-sleep #pp-legL { transform: translate(1px, 5px) rotate(84deg); }\n' +
  '#m-passi.st-sleep #pp-legR { transform: translate(-1px, 6px) rotate(88deg); }\n' +
  '#m-passi.st-sleep #pp-ribbon { animation: none; transform: rotate(-62deg) translate(.6px, .4px);\n' +
  '         transition: transform 1.4s ease .5s; }\n' +
  '#m-passi.st-sleep #pp-breathe { animation-name: ppBreatheDeep; animation-duration: 4.6s; }\n' +
  '\n  /* ---- fx overlays (outside the flip wrapper: glyphs never mirror) ---- */\n' +
  '#m-passi .fx { position: absolute; inset: 0; pointer-events: none; }\n' +
  '#m-passi .zz {\n' +
  '    position: absolute; top: 20px; opacity: 0;\n' +
  '    font: italic 700 12px/1 Georgia, serif;\n' +
  '    color: #FFF1F2;\n' +
  '    text-shadow: 0 1px 2px rgba(76,5,25,.75);\n' +
  '  }\n' +
  '#m-passi .z1 { left: 10px; } #m-passi .z2 { left: 3px; } #m-passi .z3 { left: 17px; }\n' +
  '#m-passi.st-sleep .z1 { animation: ppZ 2.7s ease-in-out infinite; }\n' +
  '#m-passi.st-sleep .z2 { animation: ppZ 2.7s ease-in-out .9s infinite; }\n' +
  '#m-passi.st-sleep .z3 { animation: ppZ 2.7s ease-in-out 1.8s infinite; }\n' +
  '  /* relieved sweat drop after inspection */\n' +
  '#m-passi .drop { position: absolute; left: 41px; top: 16px; width: 5px; height: 7px; opacity: 0;\n' +
  '    background: #BAE6FD; border: 1px solid #38BDF8;\n' +
  '    border-radius: 50% 50% 50% 50% / 62% 62% 38% 38%; }\n' +
  '#m-passi.sweat .drop { animation: ppSweat 1.05s ease-out; }\n' +
  '\n  /* ---- state one-shots ---- */\n' +
  '#m-passi.st-wave #pp-ribbon { animation: ppRibbonWave 1.9s ease-in-out; } /* no arms; the ribbon waves */\n' +
  '#m-passi.st-wave #pp-root { animation: ppWaveLean 1.9s ease-in-out; }\n' +
  '\n' +
  '#m-passi.st-jump .jumper { animation: ppJump 1s cubic-bezier(.4,0,.4,1); }\n' +
  '#m-passi.st-jump .shadow { animation: ppShadowJump 1s cubic-bezier(.4,0,.4,1); }\n' +
  '\n' +
  '#m-passi.hop .jumper { animation: ppHop .45s ease-in-out; }\n' +
  '#m-passi.hop .shadow { animation: ppShadowHop .45s ease-in-out; }\n' +
  '\n' +
  '#m-passi.st-peek #pp-root { transform: rotate(9deg) translateX(1.5px); }\n' +
  '\n' +
  '#m-passi.st-stretch #pp-root { animation: ppStretch 1.7s ease-in-out; }\n' +
  '#m-passi.st-stretch #pp-coverF { animation: ppCoverYawn 1.7s ease-in-out; }\n' +
  '\n  /* cover swings open at the spine (scaleX fakes the hinge at this size) */\n' +
  '#m-passi.cover-open #pp-coverF { transform: scaleX(.07); transition: transform .32s cubic-bezier(.3,1.25,.5,1); }\n' +
  '#m-passi.snap #pp-trunk { animation: ppSnap .5s ease-out; }\n' +
  '\n  /* ---- riffle: staggered page fan while the cover is open ---- */\n' +
  '#m-passi.riffling .rif { opacity: 1; }\n' +
  '#m-passi.riffling #pp-pg1 { animation: ppRiffle .46s cubic-bezier(.5,0,.6,1) 2; }\n' +
  '#m-passi.riffling #pp-pg2 { animation: ppRiffle .46s cubic-bezier(.5,0,.6,1) .1s 2; }\n' +
  '#m-passi.riffling #pp-pg3 { animation: ppRiffle .46s cubic-bezier(.5,0,.6,1) .2s 2; }\n' +
  '#m-passi.riffling #pp-pg4 { animation: ppRiffle .46s cubic-bezier(.5,0,.6,1) .3s 2; }\n' +
  '#m-passi.dusty .pd { animation: ppPuff .7s ease-out; }\n' +
  '#m-passi.dusty .pd:nth-child(2n) { animation-duration: .85s; }\n' +
  '#m-passi.puffG .pg { animation: ppPuff .6s ease-out; }\n' +
  '#m-passi.puffV .pv { animation: ppPuff .55s ease-out; }\n' +
  '\n  /* ---- visa stamping ---- */\n' +
  '#m-passi.stamping #pp-stampAnim { animation: ppStamp 2.4s ease-in-out; }\n' +
  '#m-passi.stamp-hit #pp-trunk { animation: ppStampHit .5s ease-out; }\n' +
  '\n  /* ---- gaze: reading his own visas, page corner lifts ---- */\n' +
  '#m-passi.st-gaze #pp-corner { animation: ppCornerLift 2.2s ease-in-out infinite; }\n' +
  '#m-passi.sigh #pp-trunk { animation: ppSigh .7s ease-in-out; }\n' +
  '\n  /* ---- ribbon chase: quick spins, ribbon streams, ends dizzy ---- */\n' +
  '#m-passi.st-ribbonchase .jumper { animation: ppChase 1.9s cubic-bezier(.45,.05,.55,.95); }\n' +
  '#m-passi.st-ribbonchase .shadow { animation: ppShadowChase 1.9s ease-in-out; }\n' +
  '#m-passi.st-ribbonchase #pp-ribbon { animation: ppRibbonStream 1.9s ease-in-out; }\n' +
  '\n  /* ---- inspection: rigid pose, held breath, scan beam, relieved slump ---- */\n' +
  '#m-passi.rigid #pp-root { transform: scale(1.015, 1.05); }\n' +
  '#m-passi.rigid #pp-breathe { animation-play-state: paused; }\n' +
  '#m-passi.rigid #pp-ribbon { animation: none; }\n' +
  '#m-passi.scanning #pp-scan { animation: ppScan 1.8s ease-in-out; }\n' +
  '#m-passi.phew #pp-trunk { transform: rotate(2.5deg) translateY(1.6px); }\n' +
  '\n  /* ---- glide: covers half-open as wings, lean in and sail the strip ---- */\n' +
  '#m-passi.glide-out #pp-root { transform: rotate(12deg); }\n' +
  '#m-passi.glide-out #pp-coverF { transform: scaleX(.46); transition: transform .3s cubic-bezier(.34,1.4,.64,1); }\n' +
  '#m-passi.glide-out #pp-wingB { transform: scaleX(-.5); transition: transform .3s cubic-bezier(.34,1.4,.64,1) .05s; }\n' +
  '#m-passi.glide-out #pp-legL { transform: translate(1px, -7px) rotate(52deg); }\n' +
  '#m-passi.glide-out #pp-legR { transform: translate(0, -3px) rotate(44deg); }\n' +
  '#m-passi.gliding #pp-root { animation: ppGlideBob 1.1s ease-in-out infinite; }\n' +
  '#m-passi.gliding #pp-coverF { animation: ppWingF .6s ease-in-out infinite; }\n' +
  '#m-passi.gliding #pp-wingB { animation: ppWingB .6s ease-in-out infinite; }\n' +
  '\n  /* ---- specular shine sweeps (gold emblem + gilded page edges) ---- */\n' +
  '#m-passi.sh1 #pp-shineEm { animation: ppShine .95s ease-in-out; }\n' +
  '#m-passi.sh2 #pp-shineFan { animation: ppShine .85s ease-in-out; }\n' +
  '';

  CSS += '' +
  '\n  /* ---- keyframes ---- */\n' +
  '  @keyframes ppStep    { 0%,100% { transform: rotate(22deg); } 50% { transform: rotate(-22deg); } }\n' +
  '  @keyframes ppBob     { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1.6px); } }\n' +
  '  @keyframes ppCounter { 0%,100% { transform: translateY(0); } 50% { transform: translateY(.9px); } }\n' +
  '  @keyframes ppRibbonIdle { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3.5deg); } }\n' +
  '  @keyframes ppRibbonWalk { 0%,100% { transform: rotate(12deg); } 50% { transform: rotate(-14deg); } }\n' +
  '  @keyframes ppRibbonTwitch { 0%,100% { transform: rotate(0); } 25% { transform: rotate(11deg); } 55% { transform: rotate(-8deg); } 80% { transform: rotate(4deg); } }\n' +
  '  @keyframes ppRibbonFlutter { 0%,100% { transform: rotate(0); } 20% { transform: rotate(16deg); } 45% { transform: rotate(-12deg); } 70% { transform: rotate(8deg); } 88% { transform: rotate(-3deg); } }\n' +
  '  @keyframes ppRibbonWave {\n' +
  '    0%,100% { transform: rotate(0); }\n' +
  '    16% { transform: rotate(-148deg); }\n' +
  '    32% { transform: rotate(-118deg); }\n' +
  '    48% { transform: rotate(-152deg); }\n' +
  '    64% { transform: rotate(-122deg); }\n' +
  '    80% { transform: rotate(-148deg); }\n' +
  '  }\n' +
  '  @keyframes ppRibbonStream {\n' +
  '    0%,100% { transform: rotate(0); }\n' +
  '    15% { transform: rotate(-64deg); }\n' +
  '    40% { transform: rotate(-84deg); }\n' +
  '    70% { transform: rotate(-70deg); }\n' +
  '    90% { transform: rotate(-18deg); }\n' +
  '  }\n' +
  '  @keyframes ppWaveLean { 0%,100% { transform: rotate(0); } 18%,78% { transform: rotate(-4deg); } }\n' +
  '  @keyframes ppBreathe     { 0%,100% { transform: scale(1); } 50% { transform: scale(1.009, 1.024); } }\n' +
  '  @keyframes ppBreatheDeep { 0%,100% { transform: scale(1); } 50% { transform: scale(1.02, 1.045); } }\n' +
  '  @keyframes ppDrift {\n' +
  '    0%,100% { transform: translate(0,0); }\n' +
  '    24%     { transform: translate(.7px,.3px); }\n' +
  '    52%     { transform: translate(-.6px,.5px); }\n' +
  '    76%     { transform: translate(.3px,-.3px); }\n' +
  '  }\n' +
  '  @keyframes ppCorner     { 0%,100% { transform: rotate(0); } 50% { transform: rotate(-7deg); } }\n' +
  '  @keyframes ppCornerLift { 0%,100% { transform: rotate(0); } 40% { transform: rotate(-24deg); } 60% { transform: rotate(-20deg); } }\n' +
  '  @keyframes ppCoverChatter { 0%,100% { transform: scaleX(1); } 50% { transform: scaleX(.962); } }\n' +
  '  @keyframes ppFanJig   { 0%,100% { transform: scaleX(1); } 50% { transform: scaleX(1.028); } }\n' +
  '  @keyframes ppFanFlare { 0%,100% { transform: scaleX(1); } 25% { transform: scaleX(1.06); } 50% { transform: scaleX(.97); } 75% { transform: scaleX(1.03); } }\n' +
  '  @keyframes ppZ {\n' +
  '    0%   { opacity: 0; transform: translate(0, 6px) scale(.6); }\n' +
  '    25%  { opacity: .9; }\n' +
  '    100% { opacity: 0; transform: translate(10px, -24px) scale(1.3); }\n' +
  '  }\n' +
  '  @keyframes ppJump {\n' +
  '    0%   { transform: translateY(0)     scale(1); }\n' +
  '    16%  { transform: translateY(0)     scale(1.1, .82); }   /* anticipation squash */\n' +
  '    28%  { transform: translateY(-12px) scale(.94, 1.1); }   /* launch stretch */\n' +
  '    50%  { transform: translateY(-34px) scale(1, 1.03); }    /* lightest of the family */\n' +
  '    72%  { transform: translateY(-3px)  scale(.98, 1.02); }\n' +
  '    82%  { transform: translateY(0)     scale(1.14, .82); }  /* landing squash */\n' +
  '    92%  { transform: translateY(0)     scale(.97, 1.03); }\n' +
  '    100% { transform: translateY(0)     scale(1); }\n' +
  '  }\n' +
  '  @keyframes ppShadowJump {\n' +
  '    0%   { transform: scale(1); opacity: .17; }\n' +
  '    16%  { transform: scale(1.08, 1); opacity: .2; }\n' +
  '    50%  { transform: scale(.5); opacity: .05; }\n' +
  '    82%  { transform: scale(1.16, 1); opacity: .22; }\n' +
  '    100% { transform: scale(1); opacity: .17; }\n' +
  '  }\n' +
  '  @keyframes ppHop {\n' +
  '    0%   { transform: translateY(0)    scale(1); }\n' +
  '    25%  { transform: translateY(0)    scale(1.06, .9); }\n' +
  '    55%  { transform: translateY(-9px) scale(.98, 1.04); }\n' +
  '    85%  { transform: translateY(0)    scale(1.05, .94); }\n' +
  '    100% { transform: translateY(0)    scale(1); }\n' +
  '  }\n' +
  '  @keyframes ppShadowHop { 0%,100% { transform: scale(1); opacity: .17; } 55% { transform: scale(.85); opacity: .12; } }\n' +
  '  @keyframes ppStretch {\n' +
  '    0%   { transform: scale(1); }\n' +
  '    30%  { transform: scale(.96, 1.07); }\n' +
  '    62%  { transform: scale(.96, 1.075); }\n' +
  '    82%  { transform: scale(1.04, .95); }\n' +
  '    100% { transform: scale(1); }\n' +
  '  }\n' +
  '  @keyframes ppCoverYawn { 0%,100% { transform: scaleX(1); } 30%,65% { transform: scaleX(.72); } }\n' +
  '  @keyframes ppSnap { 0% { transform: scale(1); } 30% { transform: scale(1.1, .85); } 60% { transform: scale(.96, 1.06); } 100% { transform: scale(1); } }\n' +
  '  @keyframes ppRiffle {\n' +
  '    0%   { transform: scaleX(1) rotate(0); }\n' +
  '    45%  { transform: scaleX(-.12) rotate(-2deg); }\n' +
  '    100% { transform: scaleX(-.88) rotate(-3deg); }\n' +
  '  }\n' +
  '  @keyframes ppPuff {\n' +
  '    0%   { opacity: 0; transform: translate(0,0) scale(.4); }\n' +
  '    18%  { opacity: .6; }\n' +
  '    100% { opacity: 0; transform: translate(var(--px), var(--py)) scale(1.25); }\n' +
  '  }\n' +
  '  @keyframes ppStamp {\n' +
  '    0%   { transform: translate(0,-40px) scale(1); opacity: 0; }\n' +
  '    9%   { transform: translate(0,-22px) scale(1); opacity: 1; }\n' +
  '    26%  { transform: translate(0,-26px) scale(1); }          /* anticipation rise */\n' +
  '    36%  { transform: translate(0,1px)   scale(1.06,.86); }   /* slam + squash */\n' +
  '    44%  { transform: translate(0,0)     scale(1); }\n' +
  '    58%  { transform: translate(0,0)     scale(1); }          /* press-and-hold */\n' +
  '    68%  { transform: translate(0,-9px)  scale(1); }\n' +
  '    82%  { transform: translate(0,-36px) scale(1); opacity: .9; }\n' +
  '    100% { transform: translate(0,-40px) scale(1); opacity: 0; }\n' +
  '  }\n' +
  '  @keyframes ppStampHit { 0% { transform: scale(1); } 30% { transform: scale(1.08,.9); } 60% { transform: scale(.97,1.05); } 100% { transform: scale(1); } }\n' +
  '  @keyframes ppVisaPop { 0%,100% { transform: scale(1); } 35% { transform: scale(1.4); } 65% { transform: scale(.88); } }\n' +
  '  @keyframes ppSigh { 0%,100% { transform: scale(1); } 30% { transform: scale(1.02, 1.05); } 68% { transform: scale(.985, .965); } }\n' +
  '  @keyframes ppChase {\n' +
  '    0%   { transform: rotateY(0)       translateY(0); }\n' +
  '    30%  { transform: rotateY(360deg)  translateY(-3px); }\n' +
  '    62%  { transform: rotateY(760deg)  translateY(-5px); }\n' +
  '    100% { transform: rotateY(1080deg) translateY(0); }\n' +
  '  }\n' +
  '  @keyframes ppShadowChase { 0%,100% { transform: scale(1); opacity: .17; } 50% { transform: scale(.82); opacity: .11; } }\n' +
  '  @keyframes ppDizzy {\n' +
  '    0%,100% { transform: translate(0,0); }\n' +
  '    15% { transform: translate(1.1px,-.5px); }\n' +
  '    35% { transform: translate(0,-1.2px); }\n' +
  '    55% { transform: translate(-1.1px,-.4px); }\n' +
  '    75% { transform: translate(0,.6px); }\n' +
  '  }\n' +
  '  @keyframes ppScan {\n' +
  '    0%   { transform: translateY(-8px); opacity: 0; }\n' +
  '    10%  { opacity: .8; }\n' +
  '    55%  { transform: translateY(42px); opacity: .8; }\n' +
  '    100% { transform: translateY(-8px); opacity: 0; }\n' +
  '  }\n' +
  '  @keyframes ppSweat {\n' +
  '    0%   { opacity: 0; transform: translate(0,0) scale(.5); }\n' +
  '    18%  { opacity: .95; }\n' +
  '    55%  { opacity: .9; transform: translate(8px,-6px) scale(1); }\n' +
  '    100% { opacity: 0; transform: translate(15px,6px) scale(1); }\n' +
  '  }\n' +
  '  @keyframes ppGlideBob { 0%,100% { transform: rotate(12deg) translateY(0); } 50% { transform: rotate(13.5deg) translateY(-2.4px); } }\n' +
  '  @keyframes ppWingF { 0%,100% { transform: scaleX(.46); } 50% { transform: scaleX(.34); } }\n' +
  '  @keyframes ppWingB { 0%,100% { transform: scaleX(-.5); } 50% { transform: scaleX(-.36); } }\n' +
  '  @keyframes ppShine {\n' +
  '    0%   { opacity: 0; transform: translateX(-6px); }\n' +
  '    20%  { opacity: .85; }\n' +
  '    100% { opacity: 0; transform: translateX(10px); }\n' +
  '  }\n' +
  '\n  /* ---- reduced motion: single static sitting pose ---- */\n' +
  '  @media (prefers-reduced-motion: reduce) {\n' +
  '    #m-passi, #m-passi * { animation: none !important; transition: none !important; }\n' +
  '  }\n' +
  '';

  var SVG = '' +
  '<svg class="char" id="pp-passi" width="62" height="73.92" viewBox="0 0 52 62" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">\n' +
  '  <title>Passi the passport</title>\n' +
  '  <defs>\n' +
  '    <clipPath id="pp-cpEm"><circle cx="24.7" cy="34" r="4.1"/></clipPath>\n' +
  '    <clipPath id="pp-cpFan"><rect x="36" y="8.2" width="4.2" height="40" rx="1.5"/></clipPath>\n' +
  '    <clipPath id="pp-cpBody"><rect x="10.5" y="6" width="31" height="45" rx="4"/></clipPath>\n' +
  '  </defs>\n' +
  '  <g id="pp-root">\n' +
  '    <!-- stubby legs -->\n' +
  '    <g id="pp-legL">\n' +
  '      <rect x="16.8" y="46" width="5.6" height="11" rx="2.8" fill="#881337" stroke="#4C0519" stroke-width=".8"/>\n' +
  '      <ellipse cx="19.8" cy="57.8" rx="4.2" ry="2.1" fill="#6B1130" stroke="#4C0519" stroke-width=".8"/>\n' +
  '    </g>\n' +
  '    <g id="pp-legR">\n' +
  '      <rect x="29.6" y="46" width="5.6" height="11" rx="2.8" fill="#881337" stroke="#4C0519" stroke-width=".8"/>\n' +
  '      <ellipse cx="32.6" cy="57.8" rx="4.2" ry="2.1" fill="#6B1130" stroke="#4C0519" stroke-width=".8"/>\n' +
  '    </g>\n' +
  '    <g id="pp-trunk">\n' +
  '      <g id="pp-breathe">\n' +
  '        <!-- back cover wing: a sliver behind the spine until the glide unfolds it -->\n' +
  '        <g id="pp-wingB">\n' +
  '          <path d="M12.2,11 Q12.2,7.4 15.8,7.4 L36,7.4 Q39.6,7.4 39.6,11 L39.6,45 Q39.6,48.6 36,48.6 L15.8,48.6 Q12.2,48.6 12.2,45 Z"\n' +
  '                fill="#9F1239" stroke="#4C0519" stroke-width="1.2" stroke-linejoin="round"/>\n' +
  '        </g>\n' +
  '        <!-- back cover + spine shading -->\n' +
  '        <g id="pp-back">\n' +
  '          <rect x="11.5" y="6.8" width="29.4" height="42.6" rx="4.2" fill="#881337" stroke="#4C0519" stroke-width="1.4"/>\n' +
  '          <rect x="11.9" y="7.6" width="2.6" height="41" rx="1.3" fill="#4C0519" opacity=".35"/>\n' +
  '        </g>\n' +
  '        <!-- fanned page edges along the open side -->\n' +
  '        <g id="pp-fan">\n' +
  '          <rect x="13" y="8.2" width="26.6" height="39.8" rx="3.4" fill="#FDE68A" stroke="#B45309" stroke-width=".5"/>\n' +
  '          <rect x="13" y="8.9" width="25.4" height="38.4" rx="3" fill="#FFF7ED" stroke="#E7CFA0" stroke-width=".4"/>\n' +
  '          <rect x="13" y="9.6" width="24.2" height="37" rx="2.8" fill="#FEF3C7" stroke="#EAD9A8" stroke-width=".4"/>\n' +
  '          <!-- dog-eared corner: flutters idly, lifts while he reads -->\n' +
  '          <g id="pp-corner">\n' +
  '            <path d="M36.4,9.6 L39.2,9.6 L39.2,12.8 Q37.5,10.6 36.4,9.6 Z" fill="#FDE68A" stroke="#D97706" stroke-width=".45"/>\n' +
  '          </g>\n' +
  '          <!-- gilded edge glint (clipped to the fan) -->\n' +
  '          <g clip-path="url(#pp-cpFan)"><g id="pp-shineFan" class="streak">\n' +
  '            <rect x="36.6" y="6" width="1.7" height="44" fill="#FFFFFF" transform="rotate(14 37.5 28)"/>\n' +
  '          </g></g>\n' +
  '        </g>\n' +
  '        <!-- inner visa page: revealed whenever the cover swings open -->\n' +
  '        <g id="pp-inner">\n' +
  '          <rect x="13.4" y="10" width="23.4" height="36.4" rx="2.6" fill="#FFFBEB" stroke="#D6BE8A" stroke-width=".5"/>\n' +
  '          <line x1="16.4" y1="14" x2="27.4" y2="14" stroke="#B45309" stroke-width="1" stroke-linecap="round" opacity=".65"/>\n' +
  '          <line x1="16.4" y1="16.4" x2="22.4" y2="16.4" stroke="#D97706" stroke-width=".7" stroke-linecap="round" opacity=".5"/>\n' +
  '          <line x1="16" y1="28" x2="34" y2="28" stroke="#EAD9A8" stroke-width=".5" stroke-dasharray="1.4 1.2"/>\n' +
  '          <line x1="16" y1="40.9" x2="33.6" y2="40.9" stroke="#E7CFA0" stroke-width=".5"/>\n' +
  '          <!-- visa stamps: earned via visastamp, persist for the session -->\n' +
  '          <g id="pp-visa1" class="visa"><g transform="rotate(-9 19.5 22.5)">\n' +
  '            <rect x="15.7" y="19.9" width="7.6" height="5.2" rx="1" fill="#DBEAFE" stroke="#2563EB" stroke-width=".6"/>\n' +
  '            <line x1="17" y1="21.6" x2="22" y2="21.6" stroke="#2563EB" stroke-width=".55" stroke-linecap="round"/>\n' +
  '            <line x1="17" y1="23.3" x2="20.4" y2="23.3" stroke="#60A5FA" stroke-width=".55" stroke-linecap="round"/>\n' +
  '          </g></g>\n' +
  '          <g id="pp-visa2" class="visa"><g transform="rotate(8 30 21.5)">\n' +
  '            <circle cx="30" cy="21.5" r="3" fill="#D1FAE5" stroke="#059669" stroke-width=".6"/>\n' +
  '            <path d="M28.6,21.6 L29.6,22.6 L31.5,20.5" fill="none" stroke="#047857" stroke-width=".7" stroke-linecap="round" stroke-linejoin="round"/>\n' +
  '          </g></g>\n' +
  '          <g id="pp-visa3" class="visa"><g transform="rotate(-7 19 33.5)">\n' +
  '            <path d="M19,30.6 L19.7,32.1 L21.3,32.3 L20.2,33.4 L20.4,35 L19,34.3 L17.6,35 L17.8,33.4 L16.7,32.3 L18.3,32.1 Z"\n' +
  '                  fill="#EDE9FE" stroke="#7C3AED" stroke-width=".5" stroke-linejoin="round"/>\n' +
  '          </g></g>\n' +
  '          <g id="pp-visa4" class="visa"><g transform="rotate(10 30.5 34.5)">\n' +
  '            <ellipse cx="30.5" cy="34.5" rx="3.6" ry="2.5" fill="#FFEDD5" stroke="#EA580C" stroke-width=".6"/>\n' +
  '            <path d="M28.4,35.3 Q30.5,32.9 32.6,34.1" fill="none" stroke="#EA580C" stroke-width=".55" stroke-linecap="round"/>\n' +
  '          </g></g>\n' +
  '          <!-- countdown digits ride the same --sx/--sy offsets as the stamp rig -->\n' +
  '          <g id="pp-visaNumW"><text id="pp-visaNum" x="25" y="30.6" text-anchor="middle"\n' +
  '                font-family="Trebuchet MS, Segoe UI, sans-serif" font-size="4.6" font-weight="700"\n' +
  '                fill="#1E3A8A">7</text></g>\n' +
  '        </g>\n' +
  '        <!-- riffle pages: invisible until the thumb-fan -->\n' +
  '        <g id="pp-pg1" class="rif"><rect x="13.5" y="10.4" width="23" height="35.6" rx="2.4" fill="#FFF7ED" stroke="#E2CE9F" stroke-width=".5"/></g>\n' +
  '        <g id="pp-pg2" class="rif"><rect x="13.5" y="10.8" width="22.6" height="34.8" rx="2.4" fill="#FEF3C7" stroke="#E2CE9F" stroke-width=".5"/></g>\n' +
  '        <g id="pp-pg3" class="rif"><rect x="13.5" y="10.6" width="22.8" height="35.2" rx="2.4" fill="#FFFBEB" stroke="#E2CE9F" stroke-width=".5"/></g>\n' +
  '        <g id="pp-pg4" class="rif"><rect x="13.5" y="11" width="22.4" height="34.4" rx="2.4" fill="#FDE68A" stroke="#D9B45C" stroke-width=".5"/></g>\n' +
  '        <!-- front cover: hinged at the spine, carries the face -->\n' +
  '        <g id="pp-coverF">\n' +
  '          <rect x="12.5" y="7" width="24.6" height="42" rx="4" fill="#9F1239" stroke="#4C0519" stroke-width="1.4"/>\n' +
  '          <rect x="14.6" y="9.2" width="20.4" height="37.6" rx="2.6" fill="none" stroke="#FCD34D" stroke-width=".5" opacity=".55"/>\n' +
  '          <g id="pp-face">\n' +
  '            <ellipse cx="20.2" cy="19.5" rx="3.5" ry="4" fill="#FFFFFF" stroke="#4C0519" stroke-width="1"/>\n' +
  '            <ellipse cx="29.2" cy="19.5" rx="3.5" ry="4" fill="#FFFFFF" stroke="#4C0519" stroke-width="1"/>\n' +
  '            <g id="pp-pupils">\n' +
  '              <circle cx="20.9" cy="20" r="1.7" fill="#3B0716"/>\n' +
  '              <circle cx="29.9" cy="20" r="1.7" fill="#3B0716"/>\n' +
  '              <circle cx="21.5" cy="19.2" r=".6" fill="#FFFFFF"/>\n' +
  '              <circle cx="30.5" cy="19.2" r=".6" fill="#FFFFFF"/>\n' +
  '            </g>\n' +
  '            <g id="pp-lids">\n' +
  '              <rect x="16.5" y="15.3" width="7.4" height="8.8" rx="3.7" fill="#9F1239" stroke="#4C0519" stroke-width=".6"/>\n' +
  '              <rect x="25.5" y="15.3" width="7.4" height="8.8" rx="3.7" fill="#9F1239" stroke="#4C0519" stroke-width=".6"/>\n' +
  '            </g>\n' +
  '            <!-- happy squint ^ ^ overlay -->\n' +
  '            <g id="pp-squint">\n' +
  '              <path d="M17.4,20.6 Q20.2,17.8 23,20.6" fill="none" stroke="#3B0716" stroke-width="1.4" stroke-linecap="round"/>\n' +
  '              <path d="M26.4,20.6 Q29.2,17.8 32,20.6" fill="none" stroke="#3B0716" stroke-width="1.4" stroke-linecap="round"/>\n' +
  '            </g>\n' +
  '            <path d="M22.6,25.4 Q24.7,27.4 26.8,25.4" fill="none" stroke="#3B0716" stroke-width="1.2" stroke-linecap="round"/>\n' +
  '            <ellipse class="blush" cx="16.9" cy="23.8" rx="1.7" ry="1.1" fill="#F9A8D4" opacity=".5"/>\n' +
  '            <ellipse class="blush" cx="32.5" cy="23.8" rx="1.7" ry="1.1" fill="#F9A8D4" opacity=".5"/>\n' +
  '          </g>\n' +
  '          <!-- golden globe emblem -->\n' +
  '          <g id="pp-emblem">\n' +
  '            <circle cx="24.7" cy="34" r="4.4" fill="#FCD34D" stroke="#D97706" stroke-width=".8"/>\n' +
  '            <ellipse cx="24.7" cy="34" rx="1.9" ry="4" fill="none" stroke="#D97706" stroke-width=".5"/>\n' +
  '            <line x1="20.7" y1="34" x2="28.7" y2="34" stroke="#D97706" stroke-width=".5"/>\n' +
  '            <path d="M21.2,31.8 Q24.7,30.6 28.2,31.8 M21.2,36.2 Q24.7,37.4 28.2,36.2" fill="none" stroke="#D97706" stroke-width=".45"/>\n' +
  '            <g clip-path="url(#pp-cpEm)"><g id="pp-shineEm" class="streak">\n' +
  '              <rect x="23.4" y="28.6" width="1.8" height="11" fill="#FFFFFF" transform="rotate(22 24.3 34)"/>\n' +
  '            </g></g>\n' +
  '          </g>\n' +
  '          <!-- PASSPORT squiggles -->\n' +
  '          <line x1="19.4" y1="42.2" x2="30" y2="42.2" stroke="#FCD34D" stroke-width="1" stroke-linecap="round" opacity=".85"/>\n' +
  '          <line x1="21.4" y1="44.6" x2="28" y2="44.6" stroke="#FCD34D" stroke-width=".8" stroke-linecap="round" opacity=".55"/>\n' +
  '          <!-- ARRIVED corner stamp: slams in when the trip goes live -->\n' +
  '          <g transform="translate(31.4,11.6)"><g id="pp-arrived">\n' +
  '            <rect x="-5" y="-2.5" width="10" height="5" rx="1.2" fill="none" stroke="#FCD34D" stroke-width=".9"/>\n' +
  '            <line x1="-3.3" y1="-.7" x2="3.3" y2="-.7" stroke="#FCD34D" stroke-width=".7" stroke-linecap="round"/>\n' +
  '            <line x1="-2.3" y1="1.1" x2="2.3" y2="1.1" stroke="#FCD34D" stroke-width=".6" stroke-linecap="round" opacity=".8"/>\n' +
  '          </g></g>\n' +
  '        </g>\n' +
  '        <!-- bookmark ribbon: the tail -->\n' +
  '        <g id="pp-ribbon">\n' +
  '          <path d="M15.2,7.4 C13.7,12.6 12.8,17.8 13.2,23.4 L12.4,26.2 L14.7,24.5 L16.2,26.4 L16.7,23.2 C15.7,17.9 16.3,12.6 17.8,8 Z"\n' +
  '                fill="#F472B6" stroke="#DB2777" stroke-width=".7" stroke-linejoin="round"/>\n' +
  '          <path d="M15.9,9.4 C14.9,13.8 14.4,18.4 14.7,22.6" fill="none" stroke="#DB2777" stroke-width=".45" opacity=".6"/>\n' +
  '        </g>\n' +
  '      </g>\n' +
  '    </g>\n' +
  '  </g>\n' +
  '  <!-- ground dust puff (feet level, outside the airborne groups) -->\n' +
  '  <g id="pp-puffG">\n' +
  '    <circle class="pg" cx="20" cy="58.4" r="1.6" fill="#E2E8F0" style="--px:-8px;--py:-3px"/>\n' +
  '    <circle class="pg" cx="32" cy="58.4" r="1.4" fill="#F1F5F9" style="--px:8px;--py:-4px"/>\n' +
  '    <circle class="pg" cx="24" cy="59" r="1.1" fill="#CBD5E1" style="--px:-4px;--py:-6px"/>\n' +
  '    <circle class="pg" cx="28.5" cy="59" r="1.2" fill="#E2E8F0" style="--px:4px;--py:-6px"/>\n' +
  '  </g>\n' +
  '  <!-- paper dust motes: fly off the page edge during the riffle -->\n' +
  '  <g id="pp-dust">\n' +
  '    <rect class="pd" x="38.6" y="20" width="1.6" height="1.6" fill="#FEF3C7" style="--px:7px;--py:-6px"/>\n' +
  '    <circle class="pd" cx="39.6" cy="27" r=".9" fill="#FFF7ED" style="--px:9px;--py:-2px"/>\n' +
  '    <rect class="pd" x="38.2" y="32" width="1.4" height="1.4" fill="#FDE68A" style="--px:6px;--py:3px"/>\n' +
  '    <circle class="pd" cx="39.9" cy="15.5" r=".8" fill="#FFF7ED" style="--px:8px;--py:-8px"/>\n' +
  '    <rect class="pd" x="39" y="38.5" width="1.3" height="1.3" fill="#FEF3C7" style="--px:7px;--py:6px"/>\n' +
  '  </g>\n' +
  '  <!-- stamp-impact puff (follows --sx/--sy to the visa slot) -->\n' +
  '  <g id="pp-puffV">\n' +
  '    <circle class="pv" cx="23" cy="27" r="1.1" fill="#FDE68A" style="--px:-5px;--py:-4px"/>\n' +
  '    <circle class="pv" cx="27" cy="26.5" r=".9" fill="#F1F5F9" style="--px:5px;--py:-4px"/>\n' +
  '    <path class="pv" d="M25,23.8 L25.6,25.1 L27,25.4 L26,26.3 L26.3,27.7 L25,27 L23.7,27.7 L24,26.3 L23,25.4 L24.4,25.1 Z"\n' +
  '          fill="#FCD34D" style="--px:1px;--py:-7px"/>\n' +
  '    <circle class="pv" cx="24" cy="28.2" r=".8" fill="#E2E8F0" style="--px:-3px;--py:-6px"/>\n' +
  '  </g>\n' +
  '  <!-- visa stamp rig: descends from above the strip -->\n' +
  '  <g id="pp-stampRig"><g id="pp-stampAnim"><g transform="translate(0,9)">\n' +
  '    <rect x="22.6" y="6" width="4.8" height="4.4" rx="2" fill="#B45309" stroke="#7C2D12" stroke-width=".8"/>\n' +
  '    <rect x="23.7" y="9.9" width="2.6" height="5.6" fill="#D97706" stroke="#7C2D12" stroke-width=".7"/>\n' +
  '    <path d="M20.6,19.6 L20.6,17.5 Q20.6,15.3 22.8,15.3 L27.2,15.3 Q29.4,15.3 29.4,17.5 L29.4,19.6 Z"\n' +
  '          fill="#312E81" stroke="#1E1B4B" stroke-width=".8"/>\n' +
  '  </g></g></g>\n' +
  '  <!-- inspection scan beam (clipped to the body silhouette) -->\n' +
  '  <g clip-path="url(#pp-cpBody)"><g id="pp-scan" class="streak">\n' +
  '    <rect x="8" y="2" width="36" height="4.6" fill="#BAE6FD" opacity=".5"/>\n' +
  '    <rect x="8" y="3.6" width="36" height="1.2" fill="#F0F9FF"/>\n' +
  '  </g></g>\n' +
  '</svg>';

  var SHADOW = '<svg class="shadow" id="pp-shadow" width="56" height="9" viewBox="0 0 56 9" aria-hidden="true">\n' +
  '  <ellipse cx="28" cy="4.5" rx="24" ry="3.5" fill="#000"/>\n' +
  '</svg>';

  var FX = '<div class="fx" id="pp-fx">\n' +
  '  <span class="zz z1">z</span>\n' +
  '  <span class="zz z2">z</span>\n' +
  '  <span class="zz z3">z</span>\n' +
  '  <span class="drop"></span>\n' +
  '</div>';

  // ribbon micro-motion + landing dust, shared by several states
  function twitchRibbon(k) { k.addC('twitch'); k.later(function () { k.remC('twitch'); }, 600); }
  function puffGround(k) { k.pulse('puffG', 800); }

  TrekMascots.register({
    id: 'passi',
    name: 'Passi',
    tagline: 'the passport — valid for wherever',
    width: 62,
    height: 74,
    css: CSS,
    svg: SVG,
    shadow: SHADOW,
    fx: FX,
    moods: ['chill', 'soon', 'hype', 'live'],
    reducedPose: 'pose-sit',
    signature: 'riffle',
    shineClasses: ['sh1', 'sh2'],
    blinkEvery: [2100, 5200],
    stateClasses: ['st-walk', 'st-idle', 'st-sit', 'st-sleep', 'st-stretch', 'st-wave', 'st-jump',
      'st-peek', 'st-riffle', 'st-visastamp', 'st-gaze', 'st-glide', 'st-ribbonchase', 'st-inspection',
      'pose-sit', 'cover-open', 'snap', 'flare', 'dusty', 'riffling',
      'look-down', 'look-up', 'look-l', 'look-r', 'eyes-closed', 'hop', 'squint', 'twitch',
      'stamping', 'stamp-hit', 'visa-num', 'puffG', 'puffV', 'visa-b1', 'visa-b2', 'visa-b3', 'visa-b4',
      'glide-out', 'gliding', 'rigid', 'scanning', 'phew', 'sweat', 'sigh', 'dizzy'],
    edgeStates: { peek: true },
    afterState: { sleep: 'stretch', stretch: 'idle' },
    glide: { state: 'glide', outClass: 'glide-out', spinClass: 'gliding', boost: 1.6 },
    config: {
      turnPad: 18,
      edgeSnap: 34,
      // a touch quicker than the suitcase in every mood; lightest of the family
      speed: { chill: 30, soon: 43, hype: 68, live: 37 },
      step:  { chill: '0.64s', soon: '0.5s', hype: '0.34s', live: '0.58s' },
      waveEveryMs: 80000,
      dur: {
        walk: [2400, 6800], idle: [1400, 3200], sit: [3000, 7000], sleep: [6500, 12000],
        stretch: [1750, 1750], wave: [2100, 2100], jump: [1100, 1100], peek: [2000, 3400],
        riffle: [3050, 3050], visastamp: [3650, 3650], gaze: [3900, 3900],
        glide: [4600, 4600], ribbonchase: [3250, 3250], inspection: [3900, 3900]
      },
      weights: {
        chill: { walk: 5, idle: 4,   sit: 3,   gaze: 2.2, wave: .7,  jump: .6,  peek: 1.2, riffle: 1.2, ribbonchase: .5,  glide: .3,  visastamp: .35, inspection: .45 },
        soon:  { walk: 6, idle: 3,   sit: 1.6, gaze: 1.6, wave: 1,   jump: 1.8, peek: 1.2, riffle: 1.5, ribbonchase: .7,  glide: .45, visastamp: .4,  inspection: .5 },
        hype:  { walk: 7, idle: 1.3, sit: .4,  gaze: .7,  wave: 2,   jump: 3.6, peek: 1.2, riffle: 2.1, ribbonchase: 1.1, glide: .6,  visastamp: 1,   inspection: .35 },
        live:  { walk: 5, idle: 3,   sit: 2.2, gaze: 1.4, wave: 1.2, jump: 1.3, peek: 1,   riffle: 1.3, ribbonchase: .8,  glide: 1.15, visastamp: .5, inspection: .6 }
      },
      sleepFromSit: { chill: 2.6, soon: 1.2, hype: 0, live: 1 }
    },

    // visa slots on the inner page: [--sx, --sy] offsets for stamp rig, puff and digits
    _slots: [[-5.5, -6], [5, -7], [-6, 5], [5.5, 6]],

    onTurn: function (k) { k.pulse('flutter', 640); },  // ribbon flutters on turn-around
    onGlideTuck: function (k) { puffGround(k); k.pulse('flare', 700); }, // paper settles after landing
    filterWeights: function (k, w) {
      // a real countdown makes stamping extra tempting
      if (k.mood === 'hype' && k.tripDays != null) w.visastamp = (w.visastamp || 0) + 1.1;
    },
    moodFromTrip: function (days, ongoing) {
      if (ongoing === true) return 'live';
      if (days !== null && days >= 0 && days <= 7) return 'hype';
      if (days !== null && days > 7 && days <= 14) return 'soon';
      return 'chill';
    },
    onMood: function (k, m, changed) {
      if (m === 'live') {
        if (!k._arrived) {
          k._arrived = true;
          setTimeout(function () { if (k._arrived) k.addC('arrived-on'); }, 700);
        }
      } else if (k._arrived) {
        k._arrived = false;
        k.remC('arrived-on');
      }
      if (changed && m === 'hype' && !TrekMascots.reduced && (k.state === 'sleep' || k.state === 'sit')) {
        k.setState(k.state === 'sleep' ? 'stretch' : 'jump');
      }
    },
    // always-on paper rustle; the closer the trip, the twitchier the pages
    ambient: function (k) {
      (function rustle() {
        var span = k.mood === 'soon' ? [6000, 11000] : k.mood === 'hype' ? [8000, 14000] : [16000, 30000];
        setTimeout(function () {
          if (k.dead) return;
          if (k.state !== 'sleep') k.pulse('flare', 700);
          rustle();
        }, TrekMascots.rand(span[0], span[1]));
      })();
    },

    enter: {
      walk: function (k) { if (Math.random() < .3) k.setDir(-k.dir); },
      idle: function (k) {
        if (Math.random() < .8) k.later(function () {
          k.addC(Math.random() < .5 ? 'look-l' : 'look-r');
          k.later(function () { k.remC('look-l'); k.remC('look-r'); }, k.rand(500, 900));
        }, k.rand(300, 1200));
        if (Math.random() < .5) k.later(function () { twitchRibbon(k); }, k.rand(600, 1800));
      },
      sit: function (k) {
        k.addC('pose-sit');
        if (Math.random() < .6) k.later(function () { twitchRibbon(k); }, k.rand(1000, 3000));
      },
      sleep: function () {},  // st-sleep owns the whole lie-down; nothing to add
      stretch: function (k) { k.addC('eyes-closed'); k.later(function () { k.remC('eyes-closed'); }, 650); },
      wave: function (k) {
        k.lastWave = performance.now();
        k.later(function () { k.addC('squint'); }, 450);
        k.later(function () { k.remC('squint'); }, 1550);
      },
      jump: function (k) {
        k.later(function () { k.addC('squint'); }, 300);
        k.later(function () { k.pulse('flare', 600); }, 400);   // pages flutter at apex
        k.later(function () { k.remC('squint'); }, 700);
        k.later(function () { puffGround(k); }, 810);           // dust on landing
        if (k.mood === 'hype') k.later(function () { k.pulse('dusty', 800); }, 830);
      },
      peek: function (k) {
        k.setDir(k.x - k.minX < k.maxX - k.x ? -1 : 1);
        k.later(function () { k.addC('look-down'); }, 380);
      },
      // signature move: the Riffle — thumb-fans every page, snaps shut, hops
      riffle: function (k) {
        k.later(function () { k.addC('cover-open'); }, 150);
        k.later(function () { k.addC('look-down'); }, 420);
        k.later(function () { k.addC('riffling'); }, 620);
        k.later(function () { k.pulse('dusty', 800); }, 760);
        k.later(function () { k.pulse('dusty', 800); }, 1450);
        k.later(function () { k.remC('riffling'); }, 1980);
        k.later(function () { k.remC('look-down'); k.remC('cover-open'); }, 2120);
        k.later(function () { k.pulse('snap', 520); puffGround(k); }, 2200);
        k.later(function () { k.addC('squint'); k.pulse('hop', 500); }, 2320);
        k.later(function () { k.remC('squint'); }, 2950);
      },
      // border control, self-service: opens flat and stamps his own visa page
      visastamp: function (k) {
        var count = k._visas || 0;
        var n = count < 4 ? count + 1 : 1 + Math.floor(Math.random() * 4);
        var slot = TrekMascots.get('passi')._slots[n - 1];
        k.el.style.setProperty('--sx', slot[0] + 'px');
        k.el.style.setProperty('--sy', slot[1] + 'px');
        var showDays = k.mood === 'hype' && k.tripDays != null;
        k.later(function () { k.addC('cover-open'); }, 140);
        k.later(function () { k.addC('stamping'); }, 420);
        k.later(function () { k.addC('look-up'); }, 520);
        k.later(function () {                            // impact frame
          k.remC('look-up');
          k.addC('stamp-hit');
          k.pulse('puffV');
          if (count < 4) { k.addC('visa-on-' + n); k._visas = count + 1; }
          else { k.addC('visa-b' + n); k.later(function () { k.remC('visa-b' + n); }, 700); }
          if (showDays) {
            var num = k.el.querySelector('#pp-visaNum');
            if (num) num.textContent = String(TrekMascots.clamp(Math.round(k.tripDays), 0, 99));
            k.addC('visa-num');
          }
        }, 1300);
        k.later(function () { k.remC('stamp-hit'); k.remC('puffV'); }, 1950);
        k.later(function () { k.addC('look-down'); }, 2250);  // admire the fresh ink
        k.later(function () { k.addC('squint'); }, 2500);
        k.later(function () { k.pulse('hop', 500); }, 2750);
        k.later(function () { k.remC('cover-open'); }, 3050);
        k.later(function () { k.pulse('snap', 520); }, 3100);
        k.later(function () { k.remC('squint'); k.remC('look-down'); }, 3350);
      },
      // reads his own visas like a photo album
      gaze: function (k) {
        k.later(function () { k.addC('cover-open'); }, 200);
        k.later(function () { k.addC('look-down'); }, 520);
        k.later(function () { k.addC('squint'); }, 1500);
        k.later(function () { k.remC('squint'); }, 2300);
        k.later(function () { k.pulse('sigh', 750); }, 2700);  // content exhale
        k.later(function () { k.remC('look-down'); }, 3350);
        k.later(function () { k.remC('cover-open'); }, 3550);
      },
      // glide mode: covers half-open as wings, lean forward and sail
      glide: function (k) {
        k.setDir(k.x - k.minX < k.maxX - k.x ? 1 : -1);  // glide toward the long side
        k.forceNext = 'walk';                            // always resume walking after
        k.glideTucked = false;
        k.addC('glide-out');
        k.later(function () { k.glideMoving = true; k.addC('gliding'); }, 430);
        k.later(function () {                            // catch an imaginary updraft
          if (k.glideMoving) k.pulse('hop', 500);
        }, k.rand(1500, 2700));
        k.later(function () { k.tuckGlide(); }, 3550);   // fold up, paper settles
      },
      // chases his own bookmark like a puppy; ends dizzy and embarrassed
      ribbonchase: function (k) {
        k.later(function () { k.addC('look-l'); }, 150);
        k.later(function () { puffGround(k); }, 250);
        k.later(function () { k.remC('look-l'); puffGround(k); }, 1950);  // skid stop
        k.later(function () { k.addC('dizzy'); }, 2100);
        k.later(function () { k.remC('dizzy'); }, 3080);
      },
      // passport control: stands VERY straight, holds breath under the scanner
      inspection: function (k) {
        k.later(function () { k.addC('rigid'); }, 150);
        k.later(function () { k.addC('scanning'); }, 600);
        k.later(function () {                            // cleared. breathe again
          k.remC('scanning');
          k.remC('rigid');
          k.addC('phew');
          k.addC('eyes-closed');
          k.pulse('sweat', 1100);
        }, 2550);
        k.later(function () { k.pulse('sigh', 750); }, 2900);
        k.later(function () { k.remC('eyes-closed'); }, 3150);
        k.later(function () { k.remC('phew'); }, 3550);
      }
    }
  });
})();
