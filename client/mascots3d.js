// Koffi & Friends in 3D: the four characters as real-time Three.js figures.
//
// The 2D engine (engine.js) still owns time, locomotion, moods and the state machine; this file
// only reads a runtime's state and classes every frame and poses a 3D figure to match. Figures
// are procedural (no model files): shells, sleeves and pillows are deformed primitives, faces are
// flat shader-drawn eyes plus a sculpted mouth. If WebGL is not available TrekStage3D.create
// returns null and the stage falls back to the SVG characters.
(function () {
'use strict';
if (!window.THREE) return;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lin = h => new THREE.Color(h).convertSRGBToLinear();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const env01 = (u, a, b) => clamp((u - a) / (b - a), 0, 1);
const bell = (u, a, b) => { const k = env01(u, a, b); return Math.sin(Math.PI * k); };

/* ───── materials ───── */
// fine fabric nap for plush surfaces
const NAP = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 9000; k++) { const v = 90 + Math.random() * 90 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); return t; })();
const M = {
  soft: (c, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: lin(c), roughness: .58, metalness: 0, sheen: .8, sheenRoughness: .55, sheenColor: lin('#ffffff'), envMapIntensity: .85 }, o)),
  leather: c => new THREE.MeshPhysicalMaterial({ color: lin(c), roughness: .42, metalness: 0, clearcoat: .35, clearcoatRoughness: .45, envMapIntensity: .9 }),
  metal: c => new THREE.MeshPhysicalMaterial({ color: lin(c), roughness: .26, metalness: 1, envMapIntensity: 1.25 }),
  paper: c => new THREE.MeshPhysicalMaterial({ color: lin(c), roughness: .86, metalness: 0, sheen: .3, envMapIntensity: .7 }),
  plush: (c, s = '#ffffff') => new THREE.MeshPhysicalMaterial({ color: lin(c), roughness: 1, metalness: 0, sheen: .75, sheenRoughness: .55, sheenColor: lin(s), envMapIntensity: .45, bumpMap: NAP, bumpScale: .035 }),
  flat: c => new THREE.MeshBasicMaterial({ color: new THREE.Color(c), toneMapped: false }),
  tex: (t, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ map: t, roughness: .6, metalness: 0, sheen: .4, envMapIntensity: .8 }, o)),
};

// crumb texture for fried breading
const CRUMB = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 2200; k++) { const v = 60 + Math.random() * 160 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, .8 + Math.random() * 2.6, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t; })();

/* ───── geometry helpers ───── */
function rrShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
/** rounded box, centred: r = corner radius in xy, b = bevel on every edge */
function rbox(w, h, d, r = .5, b = .2, seg = 5) {
  b = Math.min(b, d / 2 - .001, w / 2 - .01, h / 2 - .01);
  const g = new THREE.ExtrudeGeometry(rrShape(w - 2 * b, h - 2 * b, Math.max(.01, r - b)), { depth: Math.max(.002, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: seg, curveSegments: 16 });
  g.translate(0, 0, -(d - 2 * b) / 2); g.computeVertexNormals(); return g;
}
function mesh(geo, mat, cast = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; }
function tube(points, r, mat, closed = false, flatten = 1) {
  const c = new THREE.CatmullRomCurve3(points, closed);
  const g = new THREE.Group(); g.add(mesh(new THREE.TubeGeometry(c, 48, r, 14, closed), mat));
  if (!closed) [c.getPoint(0), c.getPoint(1)].forEach(v => { const s = mesh(new THREE.SphereGeometry(r, 16, 12), mat); s.position.copy(v); g.add(s); });
  g.scale.z = flatten; return g;
}
function canvasTex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); }
  return t;
}
function decal(w, h, draw, z = 0, mat = {}) {
  const t = canvasTex(Math.round(w * 64), Math.round(h * 64), draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.tex(t, Object.assign({ transparent: true }, mat)));
  m.position.z = z; m.receiveShadow = true; return m;
}
const SHADOW_TEX = canvasTex(128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(0,0,0,.5)'); r.addColorStop(.5, 'rgba(0,0,0,.2)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
});

/* ───── shared character rig, Pixar style ───── */
// eyeball texture: white ball, a coloured iris with a dark limbal ring and fibres, a big pupil, painted where +z hits the sphere
const eyeTexCache = {};
function eyeTex(iris) {
  if (eyeTexCache[iris]) return eyeTexCache[iris];
  const t = canvasTex(1024, 512, (g, w, h) => {
    const sc = g.createLinearGradient(0, 0, 0, h); sc.addColorStop(0, '#e9e6f2'); sc.addColorStop(.5, '#ffffff'); sc.addColorStop(1, '#ece8f0');
    g.fillStyle = sc; g.fillRect(0, 0, w, h);
    const cx = w * .25, cy = h * .5, px = w / (Math.PI * 2);      // px per radian, same in x and y
    const R = .56 * px, P = .33 * px;
    const ir = g.createRadialGradient(cx, cy, P * .6, cx, cy, R);
    ir.addColorStop(0, shade(iris, .55)); ir.addColorStop(.55, iris); ir.addColorStop(.9, shade(iris, .7)); ir.addColorStop(1, '#14101e');
    g.fillStyle = ir; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2;
    for (let k = 0; k < 70; k++) { const a = k / 70 * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * P * 1.1, cy + Math.sin(a) * P * 1.1); g.lineTo(cx + Math.cos(a) * R * .88, cy + Math.sin(a) * R * .88); g.stroke(); }
    g.fillStyle = '#0b0912'; g.beginPath(); g.arc(cx, cy, P, 0, 7); g.fill();
  });
  return (eyeTexCache[iris] = t);
}
function shade(hex, k) { const c = new THREE.Color(hex); return '#' + c.multiplyScalar(k).getHexString(); }

/** flat 2D eye, drawn by a shader: outline, white, iris with gaze, pupil, catchlights, upper lid with a lash line, lower lid */
const FLAT_EYE_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FLAT_EYE_FS = `
precision highp float; varying vec2 vUv;
uniform vec2 uGaze; uniform float uLid; uniform float uLow; uniform vec3 uIris; uniform vec3 uSkin; uniform vec3 uInk;
float aa(float d){ return clamp(.5 - d / fwidth(d), 0., 1.); }
void main(){
  vec2 p = vUv * 2. - 1.; float d = length(p);
  if (d > 1.) discard;
  if (uLid < -.85) { float yc = .02 - .3 * p.x * p.x; float a = aa(abs(p.y - yc) - .075) * step(abs(p.x), .82); if (a < .02) discard; gl_FragColor = vec4(uInk, a); return; }
  vec3 col = mix(vec3(.91,.9,.96), vec3(1.), smoothstep(-1., .4, p.y));
  vec2 ip = p - uGaze * vec2(.36, .3); float id = length(ip);
  vec3 iris = mix(uIris * .55, uIris, smoothstep(.12, .5, id)); iris = mix(iris, uIris * .45, smoothstep(.46, .56, id));
  col = mix(col, iris, aa(id - .56));
  col = mix(col, vec3(.04,.03,.07), aa(id - .3));
  col = mix(col, vec3(1.), aa(length(p - vec2(-.24, .3)) - .15));
  col = mix(col, vec3(1.), aa(length(p - vec2(.2, -.16)) - .065));
  float yl = uLid - .22 * p.x * p.x;
  float low = -1.08 + uLow * .3 + .18 * p.x * p.x;
  col = mix(col, uSkin, aa(p.y - low));
  col = mix(col, uSkin, aa(yl - p.y));
  col = mix(col, uInk, aa(abs(p.y - yl) - .055) * step(-.98, uLid));
  col = mix(col, uInk, aa(.9 - d) * smoothstep(-.95, -.7, uLid));
  if (uLid < -.7 && p.y > yl + .06 && d > .9) discard;
  gl_FragColor = vec4(col, 1.);
}`;

/**
 * Two sculpted eyes with real lids and brows.
 * lidMat covers the ball like skin; the lid angle carries the mood (wide, normal, sleepy, closed).
 */
function makeEyes(o) {
  const { r = .9, gap = 1.1, iris = '#6b4a2b', lidMat, browMat, browLen = 1.1, browY = 1.62, tilt = 0, skin = '#888888', flatZ = .3 } = o;
  const flats = [];
  const g = new THREE.Group(), balls = [], lids = [], lows = [], brows = [];
  const ballM = new THREE.MeshPhysicalMaterial({ map: eyeTex(iris), roughness: .18, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 1.1 });
  for (const sx of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(sx * gap, 0, 0); e.rotation.z = -sx * tilt; g.add(e);
    const ball = mesh(new THREE.SphereGeometry(r, 48, 32), ballM, false); e.add(ball);
    // upper lid: a shell a touch bigger than the ball, rotated down to close
    const lid = mesh(new THREE.SphereGeometry(r * 1.07, 48, 24, 0, Math.PI * 2, 0, Math.PI * .5), lidMat, false); e.add(lid);
    const lidRim = mesh(new THREE.TorusGeometry(r * 1.07, r * .07, 8, 48), lidMat, false); lidRim.rotation.x = Math.PI / 2; lid.add(lidRim);
    // lower lid: a thin crescent that pushes up when he smiles
    const low = mesh(new THREE.SphereGeometry(r * 1.06, 48, 16, 0, Math.PI * 2, Math.PI * .78, Math.PI * .22), lidMat, false); e.add(low);
    const brow = new THREE.Group(); brow.position.set(0, browY * r, r * .55); e.add(brow);
    const bc = new THREE.QuadraticBezierCurve3(V3(-browLen / 2, -.12, 0), V3(0, .3, .08), V3(browLen / 2, -.12, 0));
    const bm = mesh(new THREE.TubeGeometry(bc, 20, r * .13, 10, false), browMat, false); brow.add(bm);
    [bc.getPoint(0), bc.getPoint(1)].forEach(v => { const s = mesh(new THREE.SphereGeometry(r * .13, 10, 8), browMat, false); s.position.copy(v); brow.add(s); });
    const fm = new THREE.ShaderMaterial({ vertexShader: FLAT_EYE_VS, fragmentShader: FLAT_EYE_FS, extensions: { derivatives: true }, transparent: true,
      uniforms: { uGaze: { value: new THREE.Vector2() }, uLid: { value: 1 }, uLow: { value: 0 }, uIris: { value: new THREE.Color(iris) }, uSkin: { value: new THREE.Color(skin) }, uInk: { value: new THREE.Color('#1d1830') } } });
    const flat = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.3, r * 2.3), fm); flat.position.z = flatZ; flat.visible = false; e.add(flat); flats.push(flat);
    const hiM = M.flat('#ffffff');
    const h1 = new THREE.Mesh(new THREE.SphereGeometry(r * .17, 16, 12), hiM); h1.position.set(-r * .3, r * .36, r * .9); e.add(h1);
    const h2 = new THREE.Mesh(new THREE.SphereGeometry(r * .07, 12, 8), hiM); h2.position.set(r * .22, -r * .2, r * .96); e.add(h2);
    balls.push(ball); lids.push(lid); lows.push(low); brows.push(brow);
  }
  const api = { group: g, balls, lids, lows, brows, r, flats, flatZ,
    flatMode(on) { flats.forEach(f => f.visible = on); g.children.forEach(e => e.children.forEach(ch => { if (!flats.includes(ch) && !brows.includes(ch)) ch.visible = !on; })); brows.forEach(b => b.position.z = on ? flatZ + .05 : r * .55); },
    /** lid: radians the upper lid is rotated down (−.6 wide … 1.45 shut), up/tilt: brow raise in r units and angle */
    set(lid, gx, gy, up = 0, browTilt = 0, low = 0, squint = 0) {
      lids.forEach(l => { l.rotation.x = lid; });
      flats.forEach(f => { const u = f.material.uniforms; u.uLid.value = -Math.sin(clamp(lid, -1.57, 1.57)) * 1.04; u.uLow.value = low; u.uGaze.value.set(clamp(gx, -1, 1), -clamp(gy, -1, 1)); });
      lows.forEach(l => { l.rotation.x = .35 - low * .55; });
      balls.forEach(b => { b.rotation.y = gx * .55; b.rotation.x = gy * .45; });
      brows.forEach((b, k) => { const sx = k ? 1 : -1; b.position.y = (browY + up) * r - squint * .1; b.rotation.z = sx * browTilt; });
    },
  };
  return api;
}

/** a mouth with volume: dark inside, tongue, a strip of teeth, a lip line. open 0 = closed smile */
function makeMouth(o) {
  const { w = 1.0, lipMat, inside = '#3d0d1d', tongue = '#ff7a8a', depth = .3 } = o;
  const g = new THREE.Group();
  const D = new THREE.Shape(); D.moveTo(-w, 0); D.quadraticCurveTo(0, -.18 * w, w, 0); D.bezierCurveTo(w * .7, -w * 1.15, -w * .7, -w * 1.15, -w, 0);
  const open = new THREE.Group(); g.add(open);
  const lip = mesh(new THREE.ExtrudeGeometry(D, { depth: .08, bevelEnabled: true, bevelThickness: .06, bevelSize: .09, bevelSegments: 4, curveSegments: 24 }), lipMat, false); lip.position.z = -.06; open.add(lip);
  const cav = mesh(new THREE.ExtrudeGeometry(D, { depth: .02, bevelEnabled: false, curveSegments: 24 }), M.soft(inside, { roughness: .7, sheen: 0 }), false); cav.position.z = .1; open.add(cav);
  const tg = mesh(new THREE.SphereGeometry(w * .48, 24, 16), M.soft(tongue, { roughness: .45, clearcoat: .4 }), false); tg.scale.set(1.15, .55, .35); tg.position.set(w * .05, -w * .62, .12); open.add(tg);
  const teeth = mesh(rbox(w * 1.1, w * .2, .06, .06, .02), M.soft('#fffdf7', { roughness: .3, clearcoat: .6 }), false); teeth.position.set(0, -w * .1, .13); open.add(teeth);
  // closed: a soft smile line with dimples
  const closed = new THREE.Group(); g.add(closed);
  const sc = new THREE.CatmullRomCurve3([V3(-w * .9, .05, 0), V3(-w * .45, -w * .3, .05), V3(w * .45, -w * .3, .05), V3(w * .9, .05, 0)]);
  closed.add(mesh(new THREE.TubeGeometry(sc, 24, .085, 10, false), M.soft(inside, { roughness: .6 }), false));
  [-1, 1].forEach(sx => { const d = mesh(new THREE.SphereGeometry(.11, 12, 10), lipMat, false); d.position.set(sx * w * .95, .08, -.02); closed.add(d); });
  g.userData.w = w;
  return { group: g, set(op, wide = 1) { const a = clamp(op, 0, 1); open.visible = a > .12; closed.visible = a <= .12; open.scale.set(wide, .25 + a * .85, 1); closed.scale.set(wide, 1, 1); } };
}

/** slim noodle arm, tapering to the wrist, with a small soft mitten; pivot at the shoulder, hangs down */
function makeArm(color, len = 1.8, r = .26, side = 1) {
  const arm = new THREE.Group(), m = M.soft(color);
  const R0 = .2, R1 = .13;
  const curve = new THREE.CatmullRomCurve3([V3(0, 0, 0), V3(side * .1, -len * .5, .06), V3(side * .02, -len, .1)]);
  const tg = new THREE.TubeGeometry(curve, 24, R0, 12, false);
  { const p = tg.attributes.position, uv = tg.attributes.uv, q = new THREE.Vector3(), v = new THREE.Vector3();
    for (let k = 0; k < p.count; k++) { const u = uv.getX(k); const ctr = curve.getPointAt(u, q); v.fromBufferAttribute(p, k).sub(ctr).multiplyScalar(1 - u * (1 - R1 / R0)).add(ctr); p.setXYZ(k, v.x, v.y, v.z); }
    tg.computeVertexNormals(); }
  arm.add(mesh(tg, m));
  arm.add(mesh(new THREE.SphereGeometry(R0, 14, 10), m));
  const hand = new THREE.Group(); hand.position.copy(curve.getPoint(1)); arm.add(hand);
  hand.add(mesh(new THREE.SphereGeometry(R1, 12, 8), m));
  // a cartoon hand: soft palm, three fingers with a slight curl, a thumb; palm turned towards the body
  const h = new THREE.Group(); h.rotation.y = side * 1.25; hand.add(h);
  const palm = mesh(new THREE.SphereGeometry(.38, 24, 18), m); palm.scale.set(1.05, 1.05, .62); palm.position.y = -.34; h.add(palm);
  const fingers = [];
  [[-.19, .2, .08], [0, .25, 0], [.19, .21, -.08]].forEach(([x, len, rz]) => {
    const f = new THREE.Group(); f.position.set(x, -.62, .02); f.rotation.set(.45, 0, rz); h.add(f);
    const seg = mesh(new THREE.CapsuleGeometry(.125, len, 4, 10), m); seg.position.y = -len / 2 - .04; f.add(seg);
    fingers.push(f);
  });
  const thumb = new THREE.Group(); thumb.position.set(-side * .27, -.26, .12); thumb.rotation.set(.2, 0, side * .95); h.add(thumb);
  const th = mesh(new THREE.CapsuleGeometry(.105, .22, 4, 10), m); th.position.y = -.18; thumb.add(th);
  arm.userData.fingers = fingers;
  arm.userData.hand = hand;
  return arm;
}

/** top-down outline of a shoe: wide round toe, narrower heel. +y of the shape becomes -z (heel), so toe ends up at +z */
function shoeOutline(L, W) {
  const s = new THREE.Shape(), t = L / 2, h = -L / 2;
  s.moveTo(0, -t);                                                     // toe tip
  s.bezierCurveTo(W * .55, -t, W * .52, -t * .35, W * .46, 0);           // toe to ball, right side
  s.bezierCurveTo(W * .42, t * .45, W * .42, -h * .95, 0, -h);           // to heel
  s.bezierCurveTo(-W * .42, -h * .95, -W * .42, t * .45, -W * .46, 0);
  s.bezierCurveTo(-W * .52, -t * .35, -W * .55, -t, 0, -t);
  return s;
}
/** extrude a top-down outline upwards: returns geometry with y = 0 at the bottom */
function upExtrude(shape, h, bevel, seg = 5) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(.01, h - 2 * bevel), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg, curveSegments: 32 });
  g.rotateX(-Math.PI / 2); g.translate(0, bevel, 0); g.computeVertexNormals(); return g;
}
/** a clean, chunky cartoon sneaker (or a fluffy slipper). Origin: centre of the sole's underside. Toe points +z */
function makeShoe(shoe, sole = '#ffffff', r = .44, slipper = false) {
  const g = new THREE.Group();
  const L = r * 5.0, W = r * 2.6, SH = r * .5;
  const soleM = M.soft(sole, { roughness: slipper ? .95 : .5, sheen: slipper ? 1 : .15 });
  const upperM = slipper ? M.plush(shoe, '#ffffff') : M.soft(shoe, { roughness: .42, clearcoat: .35, clearcoatRoughness: .35 });
  const accentM = M.soft(shade(shoe, .62), { roughness: .5 });
  // chunky sole
  g.add(mesh(upExtrude(shoeOutline(L, W), SH, SH * .3), soleM));
  // a coloured stripe round the sole
  const stripe = mesh(upExtrude(shoeOutline(L * 1.005, W * 1.01), SH * .14, .02, 1), accentM, false); stripe.position.y = SH * .42; g.add(stripe);
  // padded upper: a smooth deformed sphere, shoe-shaped from above, tall at the ankle, low and round at the toe
  const UH = r * 1.55;
  const sp = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
  const shellH = (z) => { const t = clamp((z / (L / 2) + .3) / 1.3, 0, 1); return UH * (1 - t * t * .62); };
  const ug = new THREE.SphereGeometry(1, 64, 40);
  { const p = ug.attributes.position; for (let k = 0; k < p.count; k++) { const nx = p.getX(k), ny = p.getY(k), nz = p.getZ(k);
      const Z = sp(nz, .8) * L / 2 * .9, X = sp(nx, .75) * W / 2 * .86 * (Z < 0 ? .9 : 1), Y = ny > 0 ? Math.pow(ny, .7) * shellH(Z) : ny * r * .12;
      p.setXYZ(k, X, Y, Z); } ug.computeVertexNormals(); }
  const upper = mesh(ug, upperM); upper.position.set(0, SH * .9, -L * .02); g.add(upper);
  // rubber toe cap and a side stripe, the two things that make it read as a sneaker
  if (!slipper) {
    const cap = mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), soleM); cap.scale.set(W / 2 * .82, r * .75, r * 1.25); cap.position.set(0, SH * .9, L / 2 * .9 - r * 1.25); g.add(cap);
    for (const sx of [-1, 1]) {
      const c = new THREE.CatmullRomCurve3([-.34, -.2, -.06, .08].map((f, k) => { const z = L * f; const sl = Math.min(1, Math.abs(z * 2 / L) * 0 + 1); return V3(sx * (W / 2 * .86 * (z < 0 ? .9 : 1) * Math.pow(Math.max(.05, 1 - Math.pow(Math.abs(z / (L / 2 * .9)), 1 / .8 * 2)), .5 * .75 / .75) + .02), r * (.35 + k * .27), z); }));
      const st = mesh(new THREE.TubeGeometry(c, 24, r * .12, 8, false), soleM, false); st.position.set(0, SH * .9, 0); g.add(st);
    }
  }
  if (slipper) { const pom = mesh(new THREE.SphereGeometry(r * .5, 20, 14), M.plush('#ffffff', '#ffffff')); pom.position.set(0, SH + r * .95, L * .22); g.add(pom); return g; }
  // ankle opening: a soft collar and the dark inside
  const ank = new THREE.Group(); ank.position.set(0, SH * .9 + shellH(-L * .2) - r * .12, -L * .2); g.add(ank);
  const collar = mesh(new THREE.TorusGeometry(r * .78, r * .2, 12, 36), accentM); collar.rotation.x = Math.PI / 2; collar.scale.set(1, 1.15, .8); ank.add(collar);
  const hole = mesh(new THREE.CircleGeometry(r * .72, 28), M.soft('#1a1a26', { roughness: .9 }), false); hole.rotation.x = -Math.PI / 2; hole.scale.set(1, 1.15, 1); hole.position.y = .02; ank.add(hole);
  // laces: three white rounded bars on the instep slope
  const laceM = M.soft('#ffffff', { roughness: .55 });
  for (let k = 0; k < 3; k++) {
    const z = L * (.0 + k * .1), yTop = SH * .9 + shellH(z);
    const l = mesh(new THREE.CapsuleGeometry(r * .09, W * .32, 4, 10), laceM); l.rotation.z = Math.PI / 2; l.position.set(0, yTop - r * .05, z); l.rotation.x = .5; g.add(l);
  }
  // heel tab
  const tab = mesh(rbox(r * .55, r * .8, r * .3, r * .2, .05), accentM); tab.position.set(0, SH * .9 + UH * .62, -L * .42); tab.rotation.x = .25; g.add(tab);
  return g;
}

/** short leg on a sneaker; pivot at the hip */
function makeLeg(sock, shoe, len = 1.4, r = .42, sole = '#ffffff') {
  const leg = new THREE.Group();
  const shin = mesh(new THREE.CapsuleGeometry(r * .82, len, 6, 14), M.soft(sock)); shin.position.y = -len / 2 - r * .1; leg.add(shin);
  const foot = makeShoe(shoe, sole, r); foot.position.set(0, -len - .63, r * .85); leg.add(foot);
  leg.userData.foot = foot;
  return leg;
}

/**
 * Character = root (world placement) > lift (jumps) > sway (squash, lean) > body.
 * Every frame the shared update writes a fresh expression (ex) and pose; the character's signature may override it.
 */
function rig(def) {
  const root = new THREE.Group(), lift = new THREE.Group(), sway = new THREE.Group(), body = new THREE.Group();
  root.add(lift); lift.add(sway); sway.add(body);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: SHADOW_TEX, transparent: true, depthWrite: false, opacity: .55 }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = .02; root.add(blob);
  return Object.assign({ root, lift, sway, body, blob, legs: [], arms: [], t0: Math.random() * 10, act: 'idle', actT: 0, mood: 'chill', home: 0, x: 0, lidBase: -.35 }, def);
}
/** black agent sunglasses: straight brow line, rounded bottom, glossy black frame, mirror-dark lenses */
function makeShades(gap, r) {
  const g = new THREE.Group();
  // one lens outline for the right eye (outer corner at +x a little higher); the left one is the same geometry mirrored
  const lensShape = (w, h) => {
    const s = new THREE.Shape(), x0 = -w / 2, x1 = w / 2, t = h * .42, b = -h * .58;
    s.moveTo(x0, t); s.lineTo(x1, t + h * .06);
    s.quadraticCurveTo(x1 + w * .02, b * .15, x1 - w * .2, b);
    s.quadraticCurveTo(0, b - h * .08, x0 + w * .2, b * .94);
    s.quadraticCurveTo(x0 - w * .02, b * .1, x0, t);
    return s;
  };
  const frameM = new THREE.MeshPhysicalMaterial({ color: lin('#0b0b0f'), roughness: .25, clearcoat: 1, clearcoatRoughness: .08, envMapIntensity: 1.0, side: THREE.DoubleSide });
  const lensM = new THREE.MeshPhysicalMaterial({ color: lin('#020203'), roughness: .05, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: .9, side: THREE.DoubleSide });
  const W = r * 2.3, H = r * 1.75;
  const frameGeo = new THREE.ExtrudeGeometry(lensShape(W * 1.1, H * 1.12), { depth: .14, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 3, curveSegments: 20 });
  const lensGeo = new THREE.ExtrudeGeometry(lensShape(W * .96, H * .96), { depth: .06, bevelEnabled: true, bevelThickness: .04, bevelSize: .03, bevelSegments: 3, curveSegments: 20 });
  for (const sx of [-1, 1]) {
    const side = new THREE.Group(); side.position.x = sx * gap; side.scale.x = sx; g.add(side);
    side.add(mesh(frameGeo, frameM, false));
    const ln = mesh(lensGeo, lensM, false); ln.position.z = .14; side.add(ln);
    side.rotation.y = -sx * .1;
  }
  // bridge between the lenses and a thin brow bar
  const bridge = mesh(new THREE.CapsuleGeometry(.1, gap * 2 - W * 1.0, 4, 8), frameM, false); bridge.rotation.z = Math.PI / 2; bridge.position.set(0, H * .3, .08); g.add(bridge);
  g.visible = false; return g;
}

/* ───── KOFFI: a chubby retro trolley case, eager and a bit proud ───── */
function buildKoffi() {
  const c = rig({ id: 'koffi', name: 'Koffi', role: 'Koffer', color: '#5b54f0', blobW: 10, lidBase: -1.2, iris: '#d38b2c' });
  // a cabin trolley: portrait, ribbed hard shell, telescopic handle out, four spinner wheels
  const W = 8.0, H = 10.6, D = 4.8, WH = 1.25;
  const shell = M.soft('#5d55f2', { roughness: .35, clearcoat: .7, clearcoatRoughness: .22, sheen: .3 });
  const shellDark = M.soft('#3f37c9', { roughness: .45, clearcoat: .3 });
  const rubber = M.soft('#24243a', { roughness: .75 }), chrome = M.metal('#d5d9e2');
  const box = new THREE.Group(); box.position.y = WH + H / 2 + .25; c.body.add(box);
  box.add(mesh(rbox(W, H, D, 1.5, .9, 8), shell));
  // the two shells meet in a seam all the way round
  box.add(mesh(rbox(W - .12, H - .12, .34, 1.45, .12, 3), shellDark));
  // vertical ribs on the front shell, the classic hard-case look; they leave room for the face
  // (split around the strap, so the strap lies flat on the shell)
  const RT = 2.6, RB = -4.4, SG0 = -H * .2 - .62, SG1 = -H * .2 + .62;
  for (const x of [-2.7, -1.35, 1.35, 2.7]) for (const [y0, y1] of [[SG1, RT], [RB, SG0]]) {
    const rib = mesh(rbox(.42, y1 - y0, .3, .2, .12, 3), shell); rib.position.set(x, (y0 + y1) / 2, D / 2 - .02); box.add(rib);
  }
  // luggage strap: woven webbing that hugs the shell, coral edge bands, stitching, little planes; buckle with a combination lock
  const SY = -H * .2, SHt = 1.1;
  const strapTex = canvasTex(1024, 160, (g, w, h) => {
    g.fillStyle = '#23243a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff6b4a'; g.fillRect(0, 0, w, h * .2); g.fillRect(0, h * .8, w, h * .2);
    g.fillStyle = '#ffd34d'; g.fillRect(0, h * .2, w, h * .035); g.fillRect(0, h * .765, w, h * .035);
    g.fillStyle = 'rgba(255,255,255,.9)'; for (let x = 4; x < w; x += 22) { g.fillRect(x, h * .08, 12, 3); g.fillRect(x, h * .9, 12, 3); }
    g.fillStyle = 'rgba(255,255,255,.08)'; for (let x = 0; x < w; x += 6) g.fillRect(x, h * .24, 2, h * .52);
    g.fillStyle = '#f4f4ff'; g.font = `800 ${h * .26}px Segoe UI, sans-serif`; g.textBaseline = 'middle';
    for (let x = 30; x < w; x += 256) { plane(g, x + 18, h * .5, h * .14); g.fillText('TREK', x + 48, h * .52); }
  });
  strapTex.wrapS = strapTex.wrapT = THREE.RepeatWrapping; strapTex.repeat.set(1 / 5, -1 / SHt); strapTex.offset.set(0, 1 / SHt);
  const ringShape = rrShape(W + .16, D + .16, 1.0);
  ringShape.holes.push(rrShape(W - .02, D - .02, .9));
  const ring = new THREE.ExtrudeGeometry(ringShape, { depth: SHt, bevelEnabled: false, curveSegments: 24 });
  ring.rotateX(-Math.PI / 2); ring.translate(0, SY - SHt / 2, 0);
  box.add(mesh(ring, M.tex(strapTex, { roughness: .75, sheen: .6, sheenColor: lin('#ffffff'), envMapIntensity: .6 })));
  // buckle: a chunky black clip with grip ridges and a three-wheel combination lock
  const buck = new THREE.Group(); buck.position.set(0, SY, D / 2 + .1); box.add(buck);
  const black = M.soft('#16161f', { roughness: .4, clearcoat: .6, clearcoatRoughness: .3 });
  buck.add(mesh(rbox(2.6, 1.25, .38, .35, .12), black).translateZ(.1));
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { const rg = mesh(rbox(.08, .8, .08, .03, .02), M.soft('#2e2e3e')); rg.position.set(sx * (1.0 - k * .14), 0, .34); buck.add(rg); }
  const plate = mesh(rbox(1.25, .72, .12, .12, .04), chrome); plate.position.z = .32; buck.add(plate);
  const digits = decal(1.1, .55, (g, w, h) => {
    g.fillStyle = '#1b1b26'; g.fillRect(0, 0, w, h);
    ['0', '7', '1'].forEach((d, k) => { const x = w * (.06 + k * .32); g.fillStyle = '#f2f2f6'; rr(g, x, h * .1, w * .25, h * .8, w * .04); g.fill(); g.fillStyle = '#1b1b26'; g.font = `700 ${h * .62}px Consolas, monospace`; g.textAlign = 'center'; g.fillText(d, x + w * .125, h * .74); });
  }, 0); digits.position.z = .4; buck.add(digits);
  // carry handle on top
  const handle = new THREE.Group(); handle.position.y = H / 2 - .05; box.add(handle);
  const loop = mesh(new THREE.TorusGeometry(1.1, .3, 14, 32, Math.PI), rubber); loop.scale.set(1, .7, 1); loop.position.y = .1; handle.add(loop);
  // telescopic handle: rods and grip behind, always a bit out; the signature pulls it all the way
  const tele = new THREE.Group(); tele.position.set(0, H / 2 - 1.0, -D / 2 + 1.15); box.add(tele);
  for (const sx of [-1, 1]) { const rod = mesh(new THREE.CylinderGeometry(.17, .17, 3.0, 14), chrome); rod.position.set(sx * 2.0, 0, 0); tele.add(rod); }
  const grip = mesh(rbox(4.6, .6, .75, .3, .22), rubber); grip.position.y = 1.55; tele.add(grip); c.tele = tele; c.teleY = H / 2 - 1.0;
  // airline stickers on the lower front
  const st1 = decal(1.6, 1.6, (g, w, h) => { g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(w / 2, h / 2, w * .48, 0, 7); g.fill(); g.strokeStyle = '#b7791f'; g.lineWidth = w * .045; g.beginPath(); g.arc(w / 2, h / 2, w * .37, 0, 7); g.stroke(); g.fillStyle = '#b7791f'; star(g, w / 2, h / 2, w * .2); }, 0);
  st1.position.set(2.0, -H * .36, D / 2 + .34); st1.rotation.z = -.2; box.add(st1);
  const st2 = decal(1.9, 1.1, (g, w, h) => { g.fillStyle = '#34d399'; rr(g, 0, 0, w, h, h * .35); g.fill(); g.fillStyle = '#065f46'; g.font = `800 ${h * .5}px Segoe UI, sans-serif`; g.textAlign = 'center'; g.fillText('TYO', w / 2, h * .68); }, 0);
  st2.position.set(-1.9, -H * .37, D / 2 + .34); st2.rotation.z = .18; box.add(st2);
  // four spinner wheels
  c.wheels = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(sx * (W / 2 - 1.0), WH + .25, sz * (D / 2 - .9)); c.body.add(w);
    const housing = mesh(rbox(.9, .5, .9, .3, .12), rubber); housing.position.y = .05; w.add(housing);
    const axle = new THREE.Group(); axle.position.y = -WH / 2; w.add(axle);
    for (const dx of [-.22, .22]) {
      const t = mesh(new THREE.CylinderGeometry(WH / 2 - .05, WH / 2 - .05, .3, 24), rubber); t.rotation.z = Math.PI / 2; t.position.x = dx; axle.add(t);
      const hub = mesh(new THREE.CylinderGeometry(.22, .22, .32, 16), chrome); hub.rotation.z = Math.PI / 2; hub.position.x = dx; axle.add(hub);
    }
    c.wheels.push(axle);
  }
  // the face, upper half of the front shell, between the ribs
  const eyes = makeEyes({ r: 1.05, gap: 1.42, iris: c.iris, lidMat: shell, browMat: shellDark, browLen: 1.3, tilt: 0, skin: '#6d66f4', flatZ: .22 });
  eyes.group.position.set(0, H * .2, D / 2 + .25); box.add(eyes.group);
  const mouth = makeMouth({ w: .78, lipMat: shellDark }); mouth.group.position.set(0, H * .02, D / 2 + .55); box.add(mouth.group);
  const shades = makeShades(1.42, 1.05); shades.position.copy(eyes.group.position); box.add(shades);
  c.eyes = eyes; c.mouth = mouth; c.shades = shades;
  for (const sx of [1, -1]) { const arm = makeArm('#4b43d6', 2.0, .3, sx); arm.position.set(sx * (W / 2 + .05), H * .02, .4); arm.rotation.z = sx * .18; box.add(arm); c.arms.push(arm); }
  c.box = box; c.H = WH + H + 3.4; c.rolls = true;
  c.sig = { dur: 3.4, run(u, ex) {
    // wheelie: handle snaps up, he rocks back onto his rear wheels, spins once on them, drops back down with a bounce
    const handleUp = ease(env01(u, 0, .3)) * (1 - ease(env01(u, 2.9, 3.25)));
    c.tele.position.y = c.teleY + handleUp * 2.6;
    const tilt = ease(env01(u, .35, .8)) * (1 - ease(env01(u, 2.3, 2.6)));
    const th = tilt * .55 + Math.sin(u * 7) * .03 * tilt;
    const spin = ease(env01(u, .85, 2.25)) * Math.PI * 2;
    c.sway.rotation.y = spin;
    c.sway.rotation.x = -th;
    c.lift.position.y += 1.5 * Math.sin(th);
    const land = bell(u, 2.55, 2.85); c.sway.scale.set(1 + land * .09, 1 - land * .12, 1 + land * .09);
    c.lift.position.y += bell(u, 2.6, 2.95) * .6;
    c.wheels.forEach((w, k) => w.rotation.x += (k % 2 ? 1 : .2) * .4 * tilt);
    ex.lid = -1.35; ex.up = .45 + tilt * .2; ex.open = .3 + tilt * .6; ex.low = tilt * .6;
    ex.gx = Math.sin(spin) * .3;
    if (u > 2.85) { ex.open = .85; ex.low = .9; }
  } };
  return c;
}

/* ───── CHIKI: a crispy fried chicken cutlet in its striped paper sleeve, wearing the sleeve's bow tie ───── */
function buildChiki() {
  const c = rig({ id: 'chiki', name: 'Chiki', role: 'Konbini-Hähnchen', color: '#f2a531', blobW: 9, lidBase: -1.2, iris: '#7a4a22' });
  const LEG = 1.8, SW = 7.1, SH = 4.8, SD = 2.7;
  // the cutlet: a thick, craggy slab of golden breading
  const CW = 6.8, CH = 7.6, CD = 2.1;
  const cut = new THREE.Group(); cut.position.y = LEG + .5 + CH / 2 + 1.1; c.body.add(cut);
  // a soft superellipsoid, squashed flat, then bumped with smooth noise: big craggy lumps and fine crumb grit
  const cg = new THREE.SphereGeometry(1, 120, 90);
  {
    const p = cg.attributes.position, col = new Float32Array(p.count * 3), v = new THREE.Vector3(), n = new THREE.Vector3();
    const deep = lin('#8f430c'), base = lin('#c8701c'), gold = lin('#f0a43c');
    const sp = (a, e) => Math.sign(a) * Math.pow(Math.abs(a), e);
    for (let k = 0; k < p.count; k++) {
      n.fromBufferAttribute(p, k);
      // boxy in x and y (a cutlet), round in z (a thick piece of meat)
      v.set(sp(n.x, .55) * CW / 2, sp(n.y, .6) * CH / 2, sp(n.z, .9) * CD / 2);
      // the top edge is irregular: two humps and a dip, like a real breast fillet
      if (v.y > 0) v.y += (Math.sin(v.x * .9 + .6) * .35 + Math.sin(v.x * 2.1 - 1) * .18) * (v.y / (CH / 2)) ** 2;
      const big = fbm(v.x * .55, v.y * .55, v.z * .55, 3), fine = fbm(v.x * 3.2 + 9, v.y * 3.2, v.z * 3.2, 2);
      const side = Math.min(1, Math.hypot(v.x / (CW / 2), v.y / (CH / 2)));
      const nn = n.clone(); nn.x *= 1 / CW; nn.y *= 1 / CH; nn.z *= 1 / CD; nn.normalize();
      v.addScaledVector(nn, (big - .5) * .55 * (.4 + side * .6) + (fine - .5) * .22);
      p.setXYZ(k, v.x, v.y, v.z);
      // browner where it is thin and craggy, golden on the bumps
      const t = clamp((fine - .35) * 1.6, 0, 1), c2 = base.clone().lerp(gold, t * .8).lerp(deep, Math.max(0, side - .82) * 2.4 + (1 - t) * .25);
      col[k * 3] = c2.r; col[k * 3 + 1] = c2.g; col[k * 3 + 2] = c2.b;
    }
    cg.setAttribute('color', new THREE.BufferAttribute(col, 3)); cg.computeVertexNormals();
  }
  const crust = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .62, clearcoat: .55, clearcoatRoughness: .4, sheen: .2, sheenColor: lin('#ffcf80'), envMapIntensity: .8, bumpMap: CRUMB, bumpScale: .1 });
  // two bites out of the top right edge: circles in the cutlet's own space, each set switched by its own uniform
  const BITES = [[[2.3, 3.75, .95], [3.1, 3.2, .95], [3.6, 2.4, .85]], [[.9, 4.15, .9], [1.65, 3.95, .95], [.15, 4.25, .8]]];
  const biteU = [{ value: 0 }, { value: 0 }];
  const biteGLSL = BITES.map((set, i) => set.map(([x, y, r]) => `if (distance(vLocal.xy, vec2(${x.toFixed(2)}, ${y.toFixed(2)})) < ${r.toFixed(2)} * uBite${i}) discard;`).join('\n')).join('\n');
  const withBite = m => { m.onBeforeCompile = sh => {
    sh.uniforms.uBite0 = biteU[0]; sh.uniforms.uBite1 = biteU[1];
    sh.vertexShader = 'varying vec3 vLocal;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;');
    sh.fragmentShader = 'varying vec3 vLocal;\nuniform float uBite0;\nuniform float uBite1;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n' + biteGLSL);
  }; return m; };
  cut.add(mesh(cg, withBite(crust)));
  // inside: juicy white meat, seen through the bite
  const meat = new THREE.MeshPhysicalMaterial({ color: lin('#f6e3c8'), roughness: .55, clearcoat: .3, sheen: .4, sheenColor: lin('#fff3e0'), side: THREE.BackSide, bumpMap: NAP, bumpScale: .03 });
  const inner = mesh(cg, meat, false); inner.scale.setScalar(.985); cut.add(inner);
  c.biteU = biteU;
  // loose crumbs stuck on the crust
  const crumbM = M.soft('#e7a23a', { roughness: .6 }); for (let k = 0; k < 40; k++) { const a = k * 2.399, rr2 = Math.sqrt(k / 40) * CW * .45; const cr = mesh(new THREE.IcosahedronGeometry(.12 + (k % 3) * .04, 0), crumbM, false); cr.position.set(Math.cos(a) * rr2, Math.sin(a) * rr2 * 1.05, CD / 2 + .3); if (cr.position.y < .4 || Math.hypot(cr.position.x, cr.position.y - 1.65) < 2.6) continue; cr.rotation.set(k, k * 2, k * 3); cut.add(cr); }
  // the face on the crust
  const crustLid = M.soft('#d58a2a', { roughness: .55, clearcoat: .3 });
  const eyes = makeEyes({ r: 1.0, gap: 1.38, skin: '#d8862a', flatZ: .55, iris: c.iris, lidMat: crustLid, browMat: M.soft('#8a4a10', { roughness: .7 }), browLen: 1.2, tilt: 0 });
  eyes.group.position.set(0, 1.65, CD / 2 + .35); cut.add(eyes.group);
  const mouth = makeMouth({ w: .72, lipMat: M.soft('#b8661a') }); mouth.group.position.set(0, .3, CD / 2 + .62); cut.add(mouth.group);
  const shades = makeShades(1.38, 1.0); shades.position.copy(eyes.group.position); cut.add(shades);
  c.eyes = eyes; c.mouth = mouth; c.shades = shades; c.cut = cut;
  // the paper sleeve: a thin flat envelope, open at the top, yellow and white stripes, red perforated hem
  const sleeveTex = canvasTex(1024, 512, (g, w, h) => {
    const n = 18; for (let k = 0; k < n; k++) { g.fillStyle = k % 2 ? '#fffdf6' : '#ffd21f'; g.fillRect(k * w / n, 0, w / n + 1, h); }
    g.fillStyle = '#d7263d'; for (let x = 6; x < w; x += 22) g.fillRect(x, h * .05, 12, 4);
    g.fillRect(0, 0, w, h * .025);
  });
  const sleeve = new THREE.Group(); sleeve.position.y = LEG + .5; c.body.add(sleeve);
  const sg = new THREE.CylinderGeometry(1, 1, SH, 96, 8, true);
  { const p = sg.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k); const flare = 1 + (y / SH + .5) * .1; const crinkle = Math.sin(Math.atan2(z, x) * 23 + y * 2) * .025; p.setXYZ(k, x * (SW / 2) * flare * (1 + crinkle), y + SH / 2, z * (SD / 2) * flare * (1 + crinkle)); } sg.computeVertexNormals(); }
  const paper = M.tex(sleeveTex, { roughness: .78, sheen: 0, envMapIntensity: .6, side: THREE.DoubleSide });
  sleeve.add(mesh(sg, paper));
  const bottom = mesh(new THREE.CircleGeometry(1, 48), M.paper('#fffdf6')); bottom.scale.set(SW / 2, SD / 2, 1); bottom.rotation.x = Math.PI / 2; bottom.position.y = .02; sleeve.add(bottom);
  // the print on the sleeve, as on the real thing: a red bow tie emblem, three stars, the name in red script, a small tagline
  const label = decal(5.0, 3.3, (g, w, h) => {
    const red = '#d7263d';
    // bow tie emblem
    g.fillStyle = red; g.save(); g.translate(w / 2, h * .2);
    const bw = w * .2, bh = h * .2;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(-bw, -bh / 2); g.lineTo(-bw, bh / 2); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0, 0); g.lineTo(bw, -bh / 2); g.lineTo(bw, bh / 2); g.closePath(); g.fill();
    g.fillRect(-bw * .62, -bh * .3, bw * 1.24, bh * .6);
    g.fillStyle = '#ffffff'; g.font = `italic 600 ${bh * .32}px Segoe UI, Georgia, serif`; g.textAlign = 'center'; g.fillText('I am Chicken', 0, bh * .11);
    g.restore();
    // three stars and the name
    g.fillStyle = red; star(g, w * .3, h * .44, h * .045); star(g, w * .72, h * .44, h * .045); star(g, w * .8, h * .44, h * .045);
    g.font = `italic 800 ${h * .3}px "Segoe UI", Georgia, serif`; g.textAlign = 'center'; g.fillText('Chiki', w / 2, h * .7);
    g.font = `italic 700 ${h * .075}px Georgia, serif`; g.fillText('Taste of soft, juicy chicken.', w / 2, h * .83); g.fillText('The boneless type.', w / 2, h * .93);
  }, 0);
  label.position.set(0, SH * .44, SD / 2 * 1.08 + .04); label.scale.setScalar(.84); sleeve.add(label);
  c.tie = new THREE.Group();
  for (const sx of [1, -1]) { const arm = makeArm('#c4681a', 1.9, .3, sx); arm.position.set(sx * (SW / 2 + .05), LEG + .5 + SH * .78, .1); arm.rotation.z = sx * .2; c.body.add(arm); c.arms.push(arm); }
  for (const sx of [-1, 1]) { const leg = makeLeg('#f2a531', '#d7263d', LEG, .44, '#ffffff'); leg.position.set(sx * 1.8, LEG + .65, 0); c.body.add(leg); c.legs.push(leg); }
  // a little steam for the signature
  c.steam = [0, 1, 2].map(k => { const s = tube([V3(0, 0, 0), V3(.3, .6, 0), V3(-.25, 1.2, 0), V3(.2, 1.8, 0)], .09, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, toneMapped: false, depthWrite: false })); s.position.set(-1.6 + k * 1.6, CH / 2 + .2, 0); cut.add(s); return s; });
  c.H = LEG + .5 + CH / 2 + 1.1 + CH / 2 + 1; c.sleeve = sleeve;
  const crumbBurst = [];
  for (let k = 0; k < 14; k++) { const m = mesh(new THREE.IcosahedronGeometry(.16 + (k % 3) * .06, 0), crumbM, false); m.visible = false; cut.add(m); crumbBurst.push({ m, a: (k % 7) * .45 + .1, v: 3 + (k % 4), bite: k < 7 ? 0 : 1 }); }
  c.crumbBurst = crumbBurst;
  c.sig = { dur: 3.3, run(u, ex) {
    // happs, happs: two bites vanish from the top right, crumbs fly, he is stunned, then outraged, shakes, and the breading pops back
    const T1 = .45, T2 = 1.15, B = [[3.1, 3.4], [1.1, 4.1]];
    const regrow = ease(env01(u, 2.55, 2.85));
    c.biteU[0].value = (u >= T1 ? 1 : 0) * (1 - regrow);
    c.biteU[1].value = (u >= T2 ? 1 : 0) * (1 - regrow);
    c.cut.scale.setScalar(1 + bell(u, 2.7, 3.05) * .06);
    // each bite jolts him a little
    c.sway.position.x -= (bell(u, T1, T1 + .25) + bell(u, T2, T2 + .25)) * .35;
    c.sway.scale.y *= 1 - (bell(u, T1, T1 + .18) + bell(u, T2, T2 + .18)) * .05;
    c.crumbBurst.forEach(b => { const t = u - (b.bite ? T2 : T1); b.m.visible = t > 0 && t < .8; if (!b.m.visible) return;
      const [bx, by] = B[b.bite]; b.m.position.set(bx + Math.cos(b.a) * b.v * t, by + Math.sin(b.a) * b.v * t - 7 * t * t, 1.4); b.m.rotation.set(t * 9, t * 7, 0); });
    // acting
    if (u < T1) { ex.gx = 0; ex.gy = 0; }
    else if (u < T2) { ex.gx = .6; ex.gy = -.7; ex.lid = -1.45; ex.up = .7; ex.open = .9; }
    else if (u < 1.7) { ex.gx = .2; ex.gy = -.1; ex.lid = -1.5; ex.up = .9; ex.open = 1; }
    else if (u < 2.5) { ex.gx = .9; ex.gy = -.85; ex.lid = -.6; ex.up = -.15; ex.tilt = .35; ex.open = .05; }
    else { ex.gx = 0; ex.gy = 0; ex.open = .6; ex.low = .7; }
    c.cut.rotation.z = Math.sin(u * 26) * .1 * bell(u, 2.25, 2.7);
  }, end() { c.biteU[0].value = 0; c.biteU[1].value = 0; c.cut.scale.setScalar(1); c.crumbBurst.forEach(b => b.m.visible = false); } };
  return c;
}

/* ───── PASSI: a proper little passport, gently bowed, with a silk ribbon curl ───── */
function buildPassi() {
  const c = rig({ id: 'passi', name: 'Passi', role: 'Reisepass', color: '#9f1239', blobW: 8.5, lidBase: -1.15, iris: '#1f7a5c' });
  const LEG = 1.9, W = 7.0, H = 9.6, D = 1.8;
  const book = new THREE.Group(); book.position.y = LEG + H / 2 + .55; c.body.add(book);
  const grain = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#a3163f'; g.fillRect(0, 0, w, h); for (let k = 0; k < 3000; k++) { g.fillStyle = `rgba(${k % 2 ? '255,255,255' : '40,0,10'},.06)`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 1.5, 0, 7); g.fill(); } }, [2, 2]);
  const cover = M.tex(grain, { roughness: .48, clearcoat: .35, clearcoatRoughness: .45, sheen: .5, sheenColor: lin('#ffb0c4') });
  const coverDark = M.soft('#7d0f2f', { roughness: .5 });
  // covers bowed a little outwards so he reads as soft and alive, not a plank
  const bow = g => { const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k); const b = (1 - (x / (W / 2)) ** 2) * .35 + (1 - (y / (H / 2)) ** 2) * .15; p.setZ(k, p.getZ(k) + Math.sign(p.getZ(k) || 1) * b * .5); } g.computeVertexNormals(); return g; };
  const front = mesh(bow(rbox(W, H, .5, 1.0, .22, 6)), cover); front.position.z = D / 2 - .1; book.add(front);
  const back = mesh(bow(rbox(W, H, .5, 1.0, .22, 6)), cover); back.position.z = -D / 2 + .1; book.add(back);
  const spine = mesh(new THREE.CylinderGeometry(D / 2 + .05, D / 2 + .05, H - .4, 32, 1, false, Math.PI, Math.PI), cover); spine.position.x = -W / 2 + .45; book.add(spine);
  const pagesTex = canvasTex(64, 512, (g, w, h) => { g.fillStyle = '#f6eedb'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 3) { g.fillStyle = 'rgba(150,120,80,.2)'; g.fillRect(0, y, w, 1); } });
  pagesTex.rotation = Math.PI / 2; pagesTex.center.set(.5, .5);
  const pages = mesh(rbox(W - .5, H - .55, D - .5, .8, .1), M.tex(pagesTex, { roughness: .9, sheen: 0 })); pages.position.x = .15; book.add(pages);
  // gold foil, raised a hair: frame, globe, PASSPORT
  const gold = M.metal('#ebbd52');
  const fz = D / 2 + .45;
  const frameCurve = (w, h, r) => { const s = rrShape(w, h, r); return new THREE.CatmullRomCurve3(s.getPoints(48).map(p => V3(p.x, p.y, 0)), true); };
  const frame = mesh(new THREE.TubeGeometry(frameCurve(W - 1.3, H - 1.3, .7), 120, .05, 6, true), gold, false); frame.position.z = fz - .08; frame.scale.z = .3; book.add(frame);
  const globe = new THREE.Group(); globe.position.set(0, -2.15, fz - .05); book.add(globe);
  const gR = 1.05;
  globe.add(mesh(new THREE.TorusGeometry(gR, .07, 8, 56), gold, false));
  [.5, 1].forEach(s => { const m = mesh(new THREE.TorusGeometry(gR, .05, 8, 56), gold, false); m.scale.x = s * .5; globe.add(m); });
  [-.5, 0, .5].forEach(k => { const y = k * gR, w = Math.sqrt(gR * gR - y * y); const m = mesh(new THREE.CapsuleGeometry(.05, w * 2 - .1, 3, 6), gold, false); m.rotation.z = Math.PI / 2; m.position.y = y; globe.add(m); });
  const title = decal(4.6, .9, (g, w, h) => { g.fillStyle = '#ebbd52'; g.font = `700 ${h * .55}px Consolas, monospace`; g.textAlign = 'center'; g.fillText('PASSPORT', w / 2, h * .7); }, 0, { metalness: .9, roughness: .3 });
  title.position.set(0, -3.75, fz - .04); book.add(title);
  // face on the upper cover
  const eyes = makeEyes({ r: .98, gap: 1.35, skin: '#c23a5c', flatZ: .3, iris: c.iris, lidMat: cover, browMat: coverDark, browLen: 1.2, tilt: 0 });
  eyes.group.position.set(.15, 2.25, fz - .25); book.add(eyes.group);
  const mouth = makeMouth({ w: .62, lipMat: coverDark }); mouth.group.position.set(.15, .55, fz + .02); book.add(mouth.group);
  const shades = makeShades(1.35, .98); shades.position.copy(eyes.group.position); book.add(shades);
  c.eyes = eyes; c.mouth = mouth; c.shades = shades;
  // ribbon bookmark curling out of the top like a cowlick
  const silk = new THREE.MeshPhysicalMaterial({ color: lin('#f472b6'), roughness: .3, sheen: 1, sheenColor: lin('#ffd1e8'), sheenRoughness: .25, envMapIntensity: 1 });
  const curl = new THREE.Group(); curl.position.set(1.6, H / 2 - .2, 0); book.add(curl);
  const rc = new THREE.CatmullRomCurve3([V3(0, -.4, 0), V3(.1, .5, 0), V3(.6, 1.3, .1), V3(1.3, 1.4, .2), V3(1.5, .9, .25), V3(1.1, .7, .25)]);
  const rg = new THREE.TubeGeometry(rc, 60, .2, 8, false); rg.scale(1, 1, .25);
  curl.add(mesh(rg, silk)); c.curl = curl;
  // rubber stamp for the signature, and the mark it leaves on the cover
  const stamp = new THREE.Group(); stamp.visible = false; c.lift.add(stamp);
  const wood = M.leather('#9a6230');
  const knob = mesh(new THREE.SphereGeometry(.75, 24, 16), wood); knob.position.y = 2.4; stamp.add(knob);
  const neck = mesh(new THREE.CylinderGeometry(.32, .45, 1.5, 20), wood); neck.position.y = 1.4; stamp.add(neck);
  const base = mesh(rbox(2.2, .55, 2.2, .35, .12), M.leather('#6b4423')); base.position.y = .4; stamp.add(base);
  const rubber = mesh(new THREE.CylinderGeometry(1.0, 1.0, .16, 32), M.soft('#2559d6')); rubber.position.y = .06; stamp.add(rubber);
  c.stamp = stamp;
  const mark = decal(2.2, 2.2, (g, w, h) => {
    g.strokeStyle = 'rgba(37,89,214,.92)'; g.lineWidth = w * .05; g.beginPath(); g.arc(w / 2, h / 2, w * .44, 0, 7); g.stroke();
    g.lineWidth = w * .02; g.beginPath(); g.arc(w / 2, h / 2, w * .34, 0, 7); g.stroke();
    g.fillStyle = 'rgba(37,89,214,.92)'; g.font = `700 ${h * .18}px Consolas, monospace`; g.textAlign = 'center'; g.fillText('HND', w / 2, h * .5); g.font = `600 ${h * .1}px Consolas, monospace`; g.fillText('05 NOV', w / 2, h * .66);
  }, 0, { roughness: .9 });
  mark.position.set(1.7, -1.2, fz + .02); mark.rotation.z = -.25; mark.scale.setScalar(.001); book.add(mark); c.mark = mark;
  for (const sx of [1, -1]) { const arm = makeArm('#8c1236', 1.9, .28, sx); arm.position.set(sx * (W / 2 + .05), -.4, .1); arm.rotation.z = sx * .15; book.add(arm); c.arms.push(arm); }
  for (const sx of [-1, 1]) { const leg = makeLeg('#5c0a22', '#2b2b45', LEG, .42, '#f1f1f6'); leg.position.set(sx * 1.6, LEG + .65, 0); c.body.add(leg); c.legs.push(leg); }
  c.H = LEG + H + 3; c.book = book;
  c.sig = { dur: 2.6, run(u, ex) {
    // he holds still for the stamp (brows up, eyes squeezed), thunk, a fresh HND mark, and he is very pleased with it
    const inK = ease(env01(u, 0, .6)), press = bell(u, .62, 1.0), outK = ease(env01(u, 1.1, 1.65));
    c.stamp.visible = u < 1.65;
    c.stamp.position.set(1.7, LEG + .55 + H / 2 - 1.2, fz + 2.6 + (1 - inK) * 3 + outK * 5 - press * .3);
    c.stamp.rotation.set(Math.PI / 2 - (1 - inK) * .6 + outK * .5, 0, -.25);
    c.book.scale.set(1 + press * .05, 1 - press * .05, 1 - press * .12);
    c.mark.scale.setScalar(u >= .82 ? 1 + bell(u, .82, 1.15) * .12 : .001);
    ex.lid = u < 1.0 ? .2 + press * 1.2 : -.25; ex.up = u < 1.0 ? .5 : .25; ex.gx = u > 1.2 ? .55 : 0; ex.gy = u > 1.2 ? .45 : -.2;
    ex.open = u > 1.25 ? .55 : 0; ex.low = u > 1.25 ? .9 : 0;
  }, end() { c.mark.scale.setScalar(1); } };
  return c;
}

/* ───── PUFFI: a big fleece neck pillow, forever five minutes from a nap ───── */
function buildPuffi() {
  const c = rig({ id: 'puffi', name: 'Puffi', role: 'Nackenkissen', color: '#2dd4bf', blobW: 10.5, lidBase: -.3, iris: '#6d4bd8' });
  const R = 2.55, T = 2.15, LEGH = 2.6;
  const fleece = M.plush('#62e6cf', '#c9fff4'), cuff = M.plush('#2bb39c', '#a8f5e7');
  const pts = []; for (let k = 0; k <= 32; k++) { const a = Math.PI * k / 32; pts.push(V3(-Math.cos(a) * R, Math.sin(a) * R, 0)); }
  const curve = new THREE.CatmullRomCurve3([V3(-R, -LEGH, 0), V3(-R, -LEGH * .5, 0), ...pts, V3(R, -LEGH * .5, 0), V3(R, -LEGH, 0)], false, 'centripetal');
  const pillow = new THREE.Group(); pillow.position.y = LEGH + T * .55 + .1; c.body.add(pillow);
  // fat, squishy tube: thicker at the crown, slightly flattened front to back
  const tg = new THREE.TubeGeometry(curve, 200, T, 48, false);
  { const p = tg.attributes.position, uv = tg.attributes.uv, v = new THREE.Vector3(), q = new THREE.Vector3();
    for (let k = 0; k < p.count; k++) { const u = uv.getX(k); const ctr = curve.getPointAt(u, q); v.fromBufferAttribute(p, k).sub(ctr);
      const crown = 1 + Math.sin(u * Math.PI) ** 6 * .12; v.multiplyScalar(crown); v.z *= .9; v.add(ctr); p.setXYZ(k, v.x, v.y, v.z); }
    tg.computeVertexNormals(); }
  pillow.add(mesh(tg, fleece));
  // the two ends: soft cuffs that are also his feet
  for (const sx of [-1, 1]) { const cf = mesh(new THREE.SphereGeometry(T * 1.02, 36, 20), cuff); cf.scale.set(1, .5, .92); cf.position.set(sx * R, -LEGH - .05, 0); pillow.add(cf); }
  // piping along the outer edge, the classic travel pillow detail
  const outerPts = []; for (let k = 0; k <= 120; k++) { const u = k / 120, p = curve.getPointAt(u), t = curve.getTangentAt(u); const out = V3(-t.y, t.x, 0).normalize(); if (out.x * p.x + out.y * p.y < 0) out.negate(); outerPts.push(p.clone().addScaledVector(out, T * .98)); }
  const piping = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(outerPts), 240, .14, 8, false), M.plush('#ffffff', '#ffffff')); pillow.add(piping);
  // eye mask pushed up on the forehead, with a moon and stars
  const maskShape = rrShape(3.9, 1.45, .7);
  const mg = new THREE.ExtrudeGeometry(maskShape, { depth: .3, bevelEnabled: true, bevelThickness: .14, bevelSize: .14, bevelSegments: 5, curveSegments: 18 });
  mg.translate(0, 0, -.15);
  const TC = T * 1.12 * .93;   // the crown's cross-section radius the mask wraps around
  { const p = mg.attributes.position; for (let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k); const rho = TC + .3 + z, a = y / TC; p.setXYZ(k, x, Math.sin(a) * rho - x * x * .07, Math.cos(a) * rho); } mg.computeVertexNormals(); }
  const maskG = new THREE.Group(); pillow.add(maskG); c.maskG = maskG;
  const mask = mesh(mg, M.plush('#7c86f6', '#d9ddff')); maskG.add(mask);
  const moon = decal(1.6, 1.05, (g, w, h) => { g.fillStyle = '#ffe28a'; g.beginPath(); g.arc(w * .32, h * .5, h * .36, 0, 7); g.fill(); g.fillStyle = '#7c86f6'; g.beginPath(); g.arc(w * .41, h * .42, h * .31, 0, 7); g.fill(); g.fillStyle = '#fff3c4'; star(g, w * .68, h * .36, h * .14); star(g, w * .86, h * .64, h * .1); }, 0);
  { const p = moon.geometry.attributes.position; for (let k = 0; k < p.count; k++) { const y = p.getY(k), a = y / TC, rho = TC + .74; p.setXYZ(k, p.getX(k), Math.sin(a) * rho - p.getX(k) ** 2 * .07, Math.cos(a) * rho); } }
  maskG.add(moon);
  // heart patch and a zipper pull on the side
  const heart = decal(1.3, 1.2, (g, w, h) => { g.fillStyle = '#ff6f91'; g.beginPath(); g.moveTo(w / 2, h * .88); g.bezierCurveTo(-w * .1, h * .4, w * .2, -h * .05, w / 2, h * .3); g.bezierCurveTo(w * .8, -h * .05, w * 1.1, h * .4, w / 2, h * .88); g.fill(); g.strokeStyle = '#fff'; g.setLineDash([w * .06, w * .05]); g.lineWidth = w * .035; g.stroke(); }, 0);
  heart.position.set(-R - .2, -LEGH * .2, T * .9 + .05); heart.rotation.y = -.25; pillow.add(heart);
  const zip = new THREE.Group(); zip.position.set(R + T * .9, -LEGH * .05, .6); pillow.add(zip);
  zip.add(mesh(rbox(.34, .55, .22, .1, .05), M.metal('#d6dbe4')));
  const pull = mesh(rbox(.3, 1.0, .09, .12, .03), M.metal('#d6dbe4')); pull.position.y = -.72; zip.add(pull); c.zip = zip;
  // face at the crown: big sleepy eyes
  const eyes = makeEyes({ r: 1.05, gap: 1.3, skin: '#7aead6', flatZ: .5, iris: c.iris, lidMat: fleece, browMat: cuff, browLen: 1.1, browY: 1.38, tilt: 0 });
  eyes.group.position.set(0, R + .1, T * .82); pillow.add(eyes.group);
  const mouth = makeMouth({ w: .62, lipMat: cuff }); mouth.group.position.set(0, R - 1.55, T * .95); pillow.add(mouth.group);
  const shades = makeShades(1.3, 1.05); shades.position.copy(eyes.group.position); pillow.add(shades);
  c.eyes = eyes; c.mouth = mouth; c.shades = shades;
  const PH = 1.12;
  c.setMask = k => { maskG.position.set(0, R, 0); maskG.rotation.set(-PH * (1 - k) - .06 * k, 0, .22 * (1 - k)); maskG.scale.set(1 + k * .05, 1 + k * .05, 1 + k * .32); };
  c.setMask(0);
  for (const sx of [1, -1]) { const arm = makeArm('#2bb39c', 1.7, .3, sx); arm.position.set(sx * (R + T * .85), .3, .5); arm.rotation.z = sx * .25; pillow.add(arm); c.arms.push(arm); }
  c.H = LEGH + T * .55 + R + T + 2; c.pillow = pillow; c.legsAreBody = true;
  c.zzz = [0, 1, 2].map(k => { const z = decal(1, 1, (g, w, h) => { g.fillStyle = '#7c86f6'; g.font = `800 ${h * .95}px Segoe UI, sans-serif`; g.textAlign = 'center'; g.fillText('z', w / 2, h * .82); }, 0, { depthWrite: false }); z.visible = false; c.lift.add(z); return z; });
  c.sig = { dur: 3.4, run(u, ex) {
    // a huge yawn, mask down, he nods off, z z z, then wakes with a start
    const yawn = bell(u, .05, 1.0); ex.open = yawn * 1.0; ex.lid = .4 + yawn * .7; ex.up = yawn * .4;
    c.sway.scale.set(1 - yawn * .04, 1 + yawn * .07, 1);
    const down = ease(env01(u, .9, 1.4)) * (1 - ease(env01(u, 3.0, 3.25)));
    c.setMask(down);
    if (u > 1.0 && u < 3.0) { ex.lid = 1.4; ex.open = .0; }
    c.sway.rotation.z += Math.sin(u * 2.4) * .08 * down;
    c.zzz.forEach((z, k) => { const p = env01(u, 1.3 + k * .4, 2.5 + k * .4); z.visible = p > 0 && p < 1; z.position.set(2.4 + p * 2.2 + k * .3, c.H - 1.6 + p * 3, 2); z.scale.setScalar(.6 + p * .9); z.material.opacity = Math.sin(p * Math.PI); });
    const jolt = bell(u, 3.05, 3.4); if (jolt > 0) { c.lift.position.y += jolt * 1.6; ex.lid = -.7; ex.up = .7; ex.open = .6 * jolt; }
  }, end() { c.setMask(0); } };
  return c;
}

/* smooth 3D value noise for organic surfaces */
function hash3(x, y, z) { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (i, j, k) => hash3(xi + i, yi + j, zi + k);
  return L(L(L(c(0,0,0), c(1,0,0), u), L(c(0,1,0), c(1,1,0), u), v), L(L(c(0,0,1), c(1,0,1), u), L(c(0,1,1), c(1,1,1), u), v), w);
}
function fbm(x, y, z, oct) { let a = .5, f = 1, s = 0, n = 0; for (let k = 0; k < oct; k++) { s += a * vnoise(x * f, y * f, z * f); n += a; a *= .5; f *= 2.03; } return s / n; }

/* tiny canvas drawing helpers */
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function star(g, x, y, r) { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, q = k % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } g.closePath(); g.fill(); }
function plane(g, x, y, s) { g.save(); g.translate(x, y); g.rotate(-.6); g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, -s * .12); g.lineTo(s * 1.05, 0); g.lineTo(s, s * .12); g.closePath(); g.fill(); g.beginPath(); g.moveTo(-s * .1, 0); g.lineTo(s * .25, -s * .85); g.lineTo(s * .45, -s * .85); g.lineTo(s * .35, 0); g.fill(); g.beginPath(); g.moveTo(-s * .1, 0); g.lineTo(s * .25, s * .85); g.lineTo(s * .45, s * .85); g.lineTo(s * .35, 0); g.fill(); g.restore(); }
function mergeGeos(list) {
  let n = 0; list.forEach(g => n += g.attributes.position.count);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
  list.forEach(g => { const gg = g.index ? g.toNonIndexed() : g; pos.set(gg.attributes.position.array, o * 3); nor.set(gg.attributes.normal.array, o * 3); o += gg.attributes.position.count; });
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, o * 3), 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor.subarray(0, o * 3), 3)); return out;
}


/* ───────────────────────── stage: renderer, camera, cast ───────────────────────── */

// What each character does in 3D. Everything else in its state machine is filtered out,
// so the engine only ever picks a state the 3D figure can act.
// figures on the boarding pass are drawn a bit larger than the 2D boxes they replace
const BAR_SCALE = 1.25;

const SPEC = {
  koffi: { build: buildKoffi, signature: 'lid', rolls: true, size: .9,
    states: ['walk', 'idle', 'sit', 'sleep', 'stretch', 'wave', 'jump', 'spin', 'lid', 'roll', 'stamp'],
    dur: { lid: [3400, 3400] },
    moods: { hype: 'excited', live: 'vacation' } },
  chiki: { build: buildChiki, signature: 'bite',
    states: ['walk', 'idle', 'sit', 'sleep', 'stretch', 'wave', 'jump', 'duck', 'steam', 'bite'],
    dur: { bite: [3300, 3300] }, addState: { bite: 'nibble' },     // bite takes over nibble's weights
    moods: { fresh: 'excited', ontour: 'vacation' } },
  passi: { build: buildPassi, signature: 'visastamp',
    states: ['walk', 'idle', 'sit', 'sleep', 'stretch', 'wave', 'jump', 'visastamp', 'glide'],
    dur: {}, moods: { hype: 'excited', live: 'vacation' } },
  puffi: { build: buildPuffi, signature: 'inflate',
    states: ['walk', 'idle', 'sit', 'sleep', 'stretch', 'wave', 'jump', 'inflate', 'yawn'],
    dur: { inflate: [3500, 3500] }, moods: { bliss: 'vacation', stressed: 'grumpy' } },
};

/** a copy of the character definition that only uses states the 3D figure can play */
function derive(def) {
  const spec = SPEC[def.id];
  if (!spec) return null;
  const allow = new Set(spec.states);
  const weights = {};
  for (const mood in def.config.weights) {
    const w = {}, src = def.config.weights[mood];
    for (const s in src) if (allow.has(s)) w[s] = src[s];
    for (const s in (spec.addState || {})) w[s] = src[spec.addState[s]] || .8;
    weights[mood] = w;
  }
  const d = Object.create(def);
  d.config = Object.assign({}, def.config, { weights, dur: Object.assign({}, def.config.dur, spec.dur) });
  d.stateClasses = def.stateClasses.concat(Object.keys(spec.dur).map(s => 'st-' + s));
  d.signature = spec.signature;
  d.edgeStates = {};                                   // peek is not part of the 3D set
  d.enter = Object.assign({}, def.enter);
  if (spec.addState) for (const s in spec.addState) if (!d.enter[s]) d.enter[s] = k => {};
  d.three = spec;
  return d;
}

function studioEnv(renderer) {
  const env = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(60, 30, 60), new THREE.MeshBasicMaterial({ color: 0x34343c, side: THREE.BackSide }));
  room.position.y = 8; env.add(room);
  const panel = (w, h, k, pos) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k) })); m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); };
  panel(18, 10, 3.4, [-12, 16, 12]); panel(5, 22, 2.2, [22, 5, -2]); panel(14, 7, 1.1, [6, 2, 22]); panel(26, 26, .6, [0, 22.9, .1]);
  const pm = new THREE.PMREMGenerator(renderer); const tex = pm.fromScene(env, .04).texture; pm.dispose();
  return tex;
}

function makeZzz(c) {
  return [0, 1, 2].map(() => {
    const z = decal(1.2, 1.2, (g, w, h) => { g.fillStyle = '#c7d2fe'; g.font = `800 ${h * .95}px "Segoe UI", sans-serif`; g.textAlign = 'center'; g.fillText('z', w / 2, h * .82); }, 0, { depthWrite: false });
    z.visible = false; c.lift.add(z); return z;
  });
}

/** a small rubber stamp tool (Koffi's sticker stamp) */
function makeStampTool() {
  const g = new THREE.Group(), wood = M.leather('#9a6230');
  const knob = mesh(new THREE.SphereGeometry(.7, 20, 14), wood); knob.position.y = 2.2; g.add(knob);
  const neck = mesh(new THREE.CylinderGeometry(.3, .42, 1.4, 16), wood); neck.position.y = 1.3; g.add(neck);
  g.add(mesh(rbox(2, .5, 2, .3, .1), M.leather('#6b4423')).translateY(.35));
  g.add(mesh(new THREE.CylinderGeometry(.9, .9, .14, 24), M.soft('#e8476a')).translateY(.05));
  g.visible = false; return g;
}

/** measure a freshly built character: height of everything visible, for px scaling */
function measure(c) {
  c.root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  c.body.traverse(o => { if (o.isMesh && o.visible && o.geometry) { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); box.union(b); } });
  return box;
}

function create(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, failIfMajorPerformanceCaveat: true, powerPreference: 'low-power' });
  } catch (e) { return null; }
  if (!renderer.getContext()) return null;
  renderer.setClearColor(0, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene(); scene.environment = studioEnv(renderer);
  const key = new THREE.DirectionalLight(0xffffff, 1.15); key.position.set(-14, 34, 22); scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe4ff, .55); rim.position.set(18, 14, -20); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3d60, .32));
  const camera = new THREE.OrthographicCamera(0, 100, 100, 0, -2000, 2000);
  camera.position.set(0, 0, 1000);
  let W = 0, H = 0, lost = false;
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; });

  const cast = [];   // { k (runtime), c (3d figure), s (px per unit) }
  const cache = {};

  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    if (w === W && h === H) return;
    W = w; H = h;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(W, H, false);
    camera.left = 0; camera.right = W; camera.top = H; camera.bottom = 0; camera.updateProjectionMatrix();
  }

  function figure(def) {
    if (cache[def.id]) return cache[def.id];
    const spec = SPEC[def.id], c = spec.build();
    c.eyes.flatMode(true);
    c.shades.position.z = c.eyes.group.position.z + c.eyes.flatZ + .12;
    c.zzzs = c.zzz || makeZzz(c);
    if (def.id === 'koffi') {
      c.stampTool = makeStampTool(); c.lift.add(c.stampTool);
      c.stickers = [[-2.4, -2.9], [2.4, -1.6], [-2.2, 1.1], [2.3, 3.4]].map(([x, y], i) => {
        const d = decal(1.3, 1.3, (g, w, h) => { const cols = ['#f472b6', '#38bdf8', '#a3e635', '#fbbf24']; g.fillStyle = cols[i]; g.beginPath(); g.arc(w / 2, h / 2, w * .47, 0, 7); g.fill(); g.fillStyle = '#ffffff'; star(g, w / 2, h / 2, w * .22); }, 0);
        d.position.set(x, y, 2.75); d.visible = false; c.box.add(d); return d;
      });
    }
    if (c.cut) { c.cutY = c.cut.position.y; c.cutH = 7.6; }
    if (def.id === 'koffi') c.topY = 12.1;
    c.legs.forEach(l => l.userData.hipY = l.position.y);
    const box = measure(c);
    c.h = box.max.y - Math.min(0, box.min.y); c.w = box.max.x - box.min.x;
    cache[def.id] = c;
    return c;
  }

  function setCast(runtimes) {
    cast.forEach(e => scene.remove(e.c.root));
    cast.length = 0;
    runtimes.forEach((k, j) => {
      const c = figure(k.def);
      const s = (k.def.height * (k.def.three.size || 1.02) * BAR_SCALE) / c.h;
      c.root.scale.setScalar(s);
      c.root.position.z = -j * 60;
      c.stickersOn = 0; if (c.stickers) c.stickers.forEach(d => d.visible = false);
      scene.add(c.root);
      cast.push({ k, c, s });
    });
  }

  function update(e, now, dt) {
    const { k, c, s } = e, def = k.def, spec = def.three;
    const T = now / 1000 + (c.t0 || 0), st = k.state, u = Math.max(0, (now - (k.stateAt || now)) / 1000);
    const cls = k.el.classList, has = n => cls.contains(n);
    c.lift.position.set(0, 0, 0); c.sway.position.set(0, 0, 0); c.sway.rotation.set(0, 0, 0); c.sway.scale.set(1, 1, 1);
    c.body.position.set(0, 0, 0);
    const mood = spec.moods[k.mood] || 'chill';
    const ex = { lid: c.lidBase, gx: 0, gy: 0, up: 0, tilt: 0, low: 0, open: .28 };
    // calm wandering gaze between rest points
    const sac = Math.floor(T / 1.7), sr = n => (Math.sin(sac * 12.9898 + n * 78.233) * 43758.5453) % 1;
    ex.gx = sr(1) * .4; ex.gy = sr(2) * .18 - .05;
    if (mood === 'excited') { ex.lid = -1.3; ex.up = .3; ex.open = .45; ex.low = .5; }
    if (mood === 'grumpy') { ex.lid = .05; ex.tilt = -.3; ex.open = 0; }
    c.shades.visible = mood === 'vacation';
    const br = Math.sin(T * 2.0) * .014; c.body.scale.set(1 - br * .6, 1 + br, 1 - br * .6);
    c.legs.forEach(l => l.rotation.set(0, 0, 0));
    c.arms.forEach((a, i) => { const sx = i ? -1 : 1; a.rotation.set(0, 0, sx * (.2 + Math.sin(T * 2 + i) * .05)); });
    if (c.tele) c.tele.position.y = c.teleY;
    c.zzzs.forEach(z => z.visible = false);
    if (c.setMask) c.setMask(0);
    if (c.stampTool) c.stampTool.visible = false;
    if (c.stamp && st !== 'visastamp') c.stamp.visible = false;

    // walking: the stride follows the engine's own speed and step length
    const speed = Math.abs(k.vx), moving = speed > 2;
    const stepSec = parseFloat(def.config.step[k.mood]) || .7;
    const amp = Math.min(1, speed / (def.config.speed[k.mood] || 30));
    if (moving) {
      const ph = T * Math.PI * 2 / stepSec, bob = Math.abs(Math.sin(ph));
      if (spec.rolls) { c.wheels.forEach(w => w.rotation.x += (k.vx * k.dir) / s * dt / .6); c.sway.rotation.z = Math.sin(T * 3) * .025; c.sway.rotation.x = .05 * amp; }
      else if (c.legsAreBody) { c.sway.rotation.z = Math.sin(ph) * .12 * amp; c.lift.position.y += bob * .25 * amp; }
      else {
        c.legs.forEach((l, i) => l.rotation.x = Math.sin(ph + i * Math.PI) * .6 * amp);
        c.arms.forEach((a, i) => a.rotation.x = Math.sin(ph + i * Math.PI) * .6 * amp);
        c.lift.position.y += bob * .45 * amp; c.sway.rotation.z = Math.sin(ph) * .05 * amp;
      }
    }
    // facing: turned towards where he goes, a little towards the viewer at rest
    const face = k.dir * (moving ? .55 : .28);
    c.root.rotation.y += (face - c.root.rotation.y) * Math.min(1, dt * 6);
    c.root.rotation.x = .16;

    const sitPose = () => {
      if (spec.rolls) { c.sway.position.y -= .25; ex.lid = Math.max(ex.lid, -.6); return; }
      if (c.legsAreBody) { c.sway.scale.y *= .9; c.sway.scale.x *= 1.05; return; }
      const legLen = c.legs.length ? 1.6 : 0;
      c.sway.position.y -= legLen; c.legs.forEach(l => { l.rotation.x = -1.35; l.position.y = l.userData.hipY != null ? l.userData.hipY : l.position.y; });
    };
    if (has('pose-sit')) sitPose();

    switch (st) {
      case 'sleep': {
        ex.lid = 1.45; ex.open = 0;
        if (c.setMask) c.setMask(1);
        c.zzzs.forEach((z, i) => { const p = ((T * .45 + i / 3) % 1); z.visible = true; z.position.set(c.zx || 4, (c.h * .82) + p * 3, 2); z.scale.setScalar(.5 + p); z.material.opacity = Math.sin(p * Math.PI); });
        break;
      }
      case 'stretch': {
        const k2 = bell(u, 0, 1.75);
        c.arms.forEach((a, i) => { const sx = i ? -1 : 1; a.rotation.z = sx * (.2 + k2 * 2.5); });
        c.sway.scale.y *= 1 + k2 * .07; ex.lid = 1.45 * Math.min(1, k2 * 1.5); ex.open = .6 * k2;
        break;
      }
      case 'wave': {
        const w = ease(clamp(u * 2.6, 0, 1)) * (1 - ease(clamp((u - 1.7) * 3, 0, 1)));
        const a = c.arms[0]; a.rotation.z = .2 + w * 2.35; a.rotation.y = Math.sin(u * 12) * .45 * w;
        c.sway.rotation.z -= .06 * w; ex.gx = 0; ex.gy = 0; ex.open = .7 * w + .2; ex.low = .9 * w; ex.lid = Math.min(ex.lid, -1.2);
        break;
      }
      case 'jump': {
        const p = clamp(u / 1.0, 0, 1), air = bell(p, .18, .8);
        c.lift.position.y += air * 2.1;
        const crouch = bell(p, 0, .2) + bell(p, .8, 1); c.sway.scale.set(1 + crouch * .08, 1 - crouch * .1, 1 + crouch * .08);
        ex.open = .5 + air * .4; ex.low = .7;
        break;
      }
      case 'spin': c.sway.rotation.y = ease(clamp(u / .95, 0, 1)) * Math.PI * 2; ex.open = .6; break;
      case 'roll': {
        if (c.tele) c.tele.position.y = c.teleY + ease(clamp(u / .35, 0, 1)) * 2.4;
        c.sway.rotation.x = .12; c.wheels.forEach(w => w.rotation.x += dt * 12);
        ex.lid = -1.3; ex.open = .7; ex.low = .7;
        break;
      }
      case 'stamp': { if (!c.stampTool) break;
        // a stamp drops onto his front, thunk, a fresh sticker
        const inK = ease(env01(u, 0, .7)), press = bell(u, .75, 1.15), outK = ease(env01(u, 1.3, 1.9));
        const slot = c.stickers[(c.stickersOn) % 4], tool = c.stampTool;
        tool.visible = u < 1.9;
        tool.position.set(slot.position.x, c.box.position.y + slot.position.y, 6 + (1 - inK) * 3 + outK * 5 - press * 1.2);
        tool.rotation.set(Math.PI / 2, 0, 0);
        c.sway.scale.z *= 1 - press * .06;
        if (u > .95 && !c.stampDone) { c.stampDone = true; slot.visible = true; c.stickersOn++; }
        ex.lid = press > .2 ? 1.45 : -1.2; ex.up = .4; ex.open = u > 1.2 ? .7 : .2; ex.low = u > 1.2 ? .8 : 0;
        break;
      }
      case 'duck': { if (!c.cut) break;
        // sink into the sleeve, peek over the rim, pop out
        const down = ease(env01(u, 0, .45)) * (1 - ease(env01(u, 2.0, 2.3))), peek = bell(u, .7, 1.9);
        c.cut.scale.y = 1 - down * .35;
        c.cut.position.z = -Math.max(down, peek > 0 ? 0 : 0) * 1.3 + peek * .9;   // back into the sleeve so the face hides behind its wall
        c.cut.position.y = c.cutY - down * 2.5 + peek * 1.6 + bell(u, 2.2, 2.7) * 1.4;
        ex.gx = peek ? Math.sin(u * 4) * .8 : 0; ex.up = .4 * peek; ex.open = u > 2.1 ? .9 : .1;
        break;
      }
      case 'steam': { if (!c.steam) break;
        c.steam.forEach((sm, i) => { const p = ((u * .6 + i / 3) % 1); sm.position.y = c.cutH / 2 + .2 + p * 2; sm.children.forEach(m => m.material.opacity = Math.sin(p * Math.PI) * .75); });
        ex.lid = -.2; ex.low = .8; ex.open = .25; ex.tilt = .15;
        break;
      }
      case 'glide': {
        c.arms.forEach((a, i) => { const sx = i ? -1 : 1; a.rotation.z = sx * (1.45 + Math.sin(T * 10) * .25); });
        c.lift.position.y += .8 + Math.sin(T * 5) * .25; c.sway.rotation.z = -k.dir * .08; ex.lid = -1.3; ex.open = .7;
        break;
      }
      case 'yawn': {
        const y = bell(u, .1, 1.6); ex.open = y; ex.lid = .3 + y * .9; ex.up = y * .4; c.sway.scale.set(1 - y * .04, 1 + y * .07, 1);
        break;
      }
      case 'lid': case 'bite': case 'visastamp': case 'inflate':
        if (c.sig) c.sig.run(Math.min(u, c.sig.dur), ex);
        break;
    }
    if (st !== 'stamp') c.stampDone = false;
    if (st !== 'steam' && c.steam) c.steam.forEach(sm => sm.children.forEach(m => m.material.opacity = 0));
    if (st !== 'duck' && c.cut && st !== 'bite') { c.cut.position.y = c.cutY; c.cut.scale.y = 1; c.cut.position.z = 0; }
    if (c.sig && c.sig.end && !['lid', 'bite', 'visastamp', 'inflate'].includes(st) && c.sigDirty) { c.sig.end(); c.sigDirty = false; }
    if (['lid', 'bite', 'visastamp', 'inflate'].includes(st)) c.sigDirty = true;

    // classes the director and the engine set
    if (has('look-l')) ex.gx = -.75; if (has('look-r')) ex.gx = .75;
    if (has('look-up')) ex.gy = -.6; if (has('look-down')) ex.gy = .6;
    if (has('squint')) { ex.low = Math.max(ex.low, .8); ex.open = Math.max(ex.open, .5); }   // a happy squint: cheeks up, lids stay open
    if (has('eyes-closed') || has('blink')) ex.lid = 1.45;
    const hopAt = k.classAt && k.classAt.hop;
    if (has('hop') && hopAt) c.lift.position.y += bell((now - hopAt) / 470, 0, 1) * 2;

    // perched (duet: Puffi rides on Koffi), smaller and asleep
    if (k.perchOn) {
      const host = cast.find(e2 => e2.k === k.perchOn);
      // he lies down flat on the lid like a travel pillow and naps; standing up there would leave the 110 px strip
      const sc = .62;
      if (host) { c.root.scale.setScalar(s * sc); c.sway.rotation.set(-1.45, 0, 0); c.lift.position.y += (host.c.topY || 12) * host.s / (s * sc) + 1.6; c.lift.position.z += 1.5; ex.lid = 1.45; ex.open = 0; }
    } else c.root.scale.setScalar(s);

    c.eyes.set(ex.lid, clamp(ex.gx, -1, 1), clamp(ex.gy, -1, 1), ex.up, ex.tilt, ex.low);
    c.mouth.set(ex.open);
    c.root.position.x = k.x + def.width / 2;
    c.root.position.y = 3;
    const h = c.lift.position.y; c.blob.scale.set(c.blobW * (1 - h * .04), c.blobW * .42 * (1 - h * .04), 1); c.blob.material.opacity = .45 * (1 - h * .06);
  }

  let last = 0;
  function render(now) {
    if (lost) return;
    const dt = Math.min(.05, last ? (now - last) / 1000 : .016); last = now;
    if (tiles) return renderTiles(now, dt);
    resize();
    for (const e of cast) { try { update(e, now, dt); } catch (err) { /* one figure's slip must not freeze the stage */ } }
    renderer.render(scene, camera);
  }

  // ---- preview mode (settings page): every tile is a little stage of its own
  let tiles = null;
  const pcam = new THREE.PerspectiveCamera(24, 1, .1, 400);
  const fakeClasses = { contains: () => false };
  function setTiles(list) {
    tiles = list.map(t => {
      const def = derive(TrekMascots.get(t.id));
      const c = figure(def);
      scene.add(c.root);
      const k = { def, state: 'idle', stateAt: performance.now(), mood: def.moods[0], vx: 0, dir: 1, x: -def.width / 2, el: { classList: fakeClasses }, classAt: {} };
      return Object.assign(t, { def, c, k, s: 1, wasHover: false });
    });
    renderer.setScissorTest(true);
  }
  function renderTiles(now, dt) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w !== W || h !== H) { W = w; H = h; renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(W, H, false); }
    const box = canvas.getBoundingClientRect();
    renderer.setClearColor(0, 0); renderer.setScissor(0, 0, W, H); renderer.clear();
    for (const t of tiles) {
      const r = t.el.getBoundingClientRect();
      const x = r.left - box.left, y = box.bottom - r.bottom, rw = r.width, rh = r.height;
      if (rw < 2 || rh < 2) continue;
      // hover plays the signature (and replays it while the pointer stays)
      const sig = t.def.signature, sigDur = (t.def.config.dur[sig] || [3000])[0];
      if (t.hover && (!t.wasHover || (t.k.state === sig && now - t.k.stateAt > sigDur + 400))) { t.k.state = sig; t.k.stateAt = now; }
      if (!t.hover && t.wasHover) { t.k.state = 'idle'; t.k.stateAt = now; }
      t.wasHover = t.hover;
      if (t.reduced) { t.k.state = 'sit'; }
      for (const o of tiles) o.c.root.visible = o === t;
      update(t, now, dt);
      t.c.root.position.set(0, 0, 0); t.c.root.scale.setScalar(1);
      const hh = t.c.h, tn = Math.tan(THREE.MathUtils.degToRad(12)), dist = Math.max((hh * 1.25 / 2) / tn, (t.c.w * 1.35 / 2) / (tn * rw / rh));
      pcam.aspect = rw / rh; pcam.position.set(0, hh * .52, dist); pcam.lookAt(0, hh * .46, 0); pcam.updateProjectionMatrix();
      renderer.setViewport(x, y, rw, rh); renderer.setScissor(x, y, rw, rh);
      renderer.render(scene, pcam);
    }
  }

  return { renderer, scene, camera, render, resize, setCast, setTiles, derive, figure, get lost() { return lost; } };
}

window.TrekStage3D = { create, derive, SPEC };

})();
