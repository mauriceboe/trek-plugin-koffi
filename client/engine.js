// Mascot engine — the character-agnostic half of what used to be Koffi's inline
// script. One Runtime per character on the stage (max two), each with its own
// weighted state machine, locomotion, blink/shine micro-loops and lane. A
// character is pure data + choreography (see characters/*.js): SVG markup, CSS,
// mood tables and per-state enter hooks. The engine owns time, movement and the
// class plumbing; characters own everything that makes them feel alive.
//
// Registration: each character file calls TrekMascots.register(def). The stage
// (index.html) decides which of them to spawn from the user's saved picks.
(function () {
  'use strict';

  var DEBUG = false;
  function log() { if (DEBUG && window.console) console.log.apply(console, ['[mascots]'].concat([].slice.call(arguments))); }

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function pick(w) {
    var sum = 0, k;
    for (k in w) sum += w[k];
    var r = Math.random() * sum;
    for (k in w) { r -= w[k]; if (r <= 0) return k; }
    return 'idle';
  }

  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * One live character on the stage.
   *
   * def = {
   *   id, name, width, height,
   *   svg,                    // inner stage markup (svg + fx overlays)
   *   css,                    // stylesheet, selectors scoped under #m-<id>
   *   stateClasses: [...],    // every class setState must sweep
   *   config: { speed, step, dur, weights, sleepFromSit, waveEveryMs, rollBoost? },
   *   enter: { stateName: function (k) {...}, ... },
   *   moodFromTrip: function (days, ongoing) -> mood string,
   *   moods: ['chill', ...],  // valid moods (class mood-<m> is applied)
   *   reducedPose: 'pose-sit',// class(es) for the static reduced-motion pose
   *   glide: { state, boost, outClass, spinClass } | null,  // roll-style gliding state
   * }
   */
  function Runtime(def, stage, opts) {
    this.def = def;
    this.opts = opts || {};
    this.el = document.createElement('div');
    this.el.className = 'mascot';
    this.el.id = 'm-' + def.id;
    this.el.setAttribute('data-ch', def.id);
    this.el.style.width = def.width + 'px';
    this.el.style.height = def.height + 'px';
    // headless: the 3D stage draws the character; the element only carries the class contract
    if (this.opts.headless) this.el.style.visibility = 'hidden';
    else this.el.innerHTML =
      (def.shadow || '') +
      '<div class="jumper"><div class="flip">' + def.svg + '</div></div>' +
      (def.fx || '');
    stage.appendChild(this.el);
    this.flip = this.el.querySelector('.flip');
    this.stateAt = performance.now();
    this.classAt = {};
    this.perchOn = null;          // duet: the runtime this one rides on (3D stage only)

    this.mood = def.moods[0];
    this.x = 0; this.dir = 1; this.vx = 0;
    this.minX = 6; this.maxX = 100;
    this.state = ''; this.walkTarget = null; this.afterWalk = null; this.forceNext = null;
    this.lastWave = performance.now();
    this.glideMoving = false; this.glideTucked = true;
    this.timers = [];
    this.booted = false;
    this.paused = false;          // director holds the FSM during a duet
    this.lastT = performance.now();
    this.lastTurnT = -1e9;
    this.tripDays = null; this.tripOngoing = false;
  }

  Runtime.prototype = {
    addC: function (c) { if (!this.el.classList.contains(c)) this.classAt[c] = performance.now(); this.el.classList.add(c); },
    remC: function (c) { this.el.classList.remove(c); },
    hasC: function (c) { return this.el.classList.contains(c); },
    later: function (fn, ms) { var t = setTimeout(fn, ms); this.timers.push(t); return t; },
    clearTimers: function () {
      for (var i = 0; i < this.timers.length; i++) clearTimeout(this.timers[i]);
      this.timers.length = 0;
    },
    rand: rand,

    setLane: function (minX, maxX) {
      this.minX = minX;
      this.maxX = Math.max(minX, maxX);
      this.x = clamp(this.x, this.minX, this.maxX);
    },

    setDir: function (d) {
      if (this.booted && d !== this.dir && !reduced && this.def.onTurn) this.def.onTurn(this);
      this.dir = d;
      if (this.flip) this.flip.style.transform = 'scaleX(' + (d < 0 ? -1 : 1) + ')';
      this.el.classList.toggle('flipped', d < 0); // counter-flips text glyphs
    },

    /** re-trigger a one-shot class (reflow-cycled) */
    pulse: function (c, ms) {
      var self = this;
      this.remC(c); void this.el.offsetWidth; this.addC(c); this.classAt[c] = performance.now();
      if (ms) setTimeout(function () { self.remC(c); }, ms);
    },

    chooseNext: function () {
      var def = this.def, cfg = def.config;
      var now = performance.now();
      if (def.afterState && def.afterState[this.state]) return def.afterState[this.state];
      if (cfg.waveEveryMs && now - this.lastWave > cfg.waveEveryMs && this.state !== 'wave') return 'wave';
      if (this.forceNext) { var f = this.forceNext; this.forceNext = null; return f; }
      if (this.state === 'sit') {
        return pick({ walk: 3, idle: 2, sleep: (cfg.sleepFromSit && cfg.sleepFromSit[this.mood]) || 0 });
      }
      var base = cfg.weights[this.mood], w = {}, k;
      for (k in base) if (base[k] > 0) w[k] = base[k];
      if (def.filterWeights) def.filterWeights(this, w);
      if (def.glide && this.maxX - this.minX < 130) delete w[def.glide.state]; // gliding needs runway
      if (this.state !== 'walk') delete w[this.state];  // no immediate repeats except walking
      return pick(w);
    },

    tuckGlide: function () {
      var g = this.def.glide;
      if (!g || this.glideTucked) return;
      this.glideTucked = true;
      this.glideMoving = false;
      this.remC(g.spinClass);
      this.remC(g.outClass);
      var self = this;
      this.later(function () { if (self.def.onGlideTuck) self.def.onGlideTuck(self); }, 150);
    },

    setState: function (name) {
      this.clearTimers();
      this.glideMoving = false;
      this.glideTucked = true;
      var sc = this.def.stateClasses;
      for (var i = 0; i < sc.length; i++) this.remC(sc[i]);

      // edge states walk over first when mid-strip (peek and friends)
      var edgeStates = this.def.edgeStates || {};
      if (edgeStates[name]) {
        var edge = (this.x - this.minX < this.maxX - this.x) ? this.minX : this.maxX;
        if (Math.abs(this.x - edge) > (this.def.config.edgeSnap || 34)) {
          this.walkTarget = edge;
          this.afterWalk = name;
          this.setDir(edge < this.x ? -1 : 1);
          this.state = 'walk';
          this.stateAt = performance.now();
          this.addC('st-walk');
          var self0 = this;
          this.later(function () { self0.end(); },
            Math.abs(this.x - edge) / this.def.config.speed[this.mood] * 1000 + 4000); // safety net
          return;
        }
      }

      this.state = name;
      this.stateAt = performance.now();
      this.walkTarget = null;
      this.addC('st-' + name);
      if (this.def.enter[name]) this.def.enter[name](this);
      var d = this.def.config.dur[name] || [2000, 3000];
      var self = this;
      this.later(function () { self.end(); }, rand(d[0], d[1]));
      log(this.def.id, 'state:', name, 'mood:', this.mood);
    },

    end: function () {
      if (this.paused) return; // director resumes us explicitly
      var q = this.afterWalk;
      this.afterWalk = null;
      this.setState(q || this.chooseNext());
    },

    /** director hooks: freeze/unfreeze the autonomous FSM */
    hold: function () { this.paused = true; this.clearTimers(); },
    release: function (nextState) {
      this.paused = false;
      this.onArrive = null;
      this.setState(nextState || this.chooseNext());
    },

    /**
     * Director-driven state: swap classes + run the enter hook, but never
     * auto-advance — the scene decides when this beat is over. skipEnter lets a
     * scene use the walk cycle without enter.walk's random direction flip.
     */
    play: function (name, opts) {
      this.clearTimers();
      var sc = this.def.stateClasses;
      for (var i = 0; i < sc.length; i++) this.remC(sc[i]);
      this.state = name;
      this.stateAt = performance.now();
      this.walkTarget = null;
      this.addC('st-' + name);
      if (!(opts && opts.skipEnter) && this.def.enter[name]) this.def.enter[name](this);
    },

    /** walk to an x position; resolves via onArrive while held by the director */
    walkTo: function (target, done) {
      this.play('walk', { skipEnter: true });
      this.setDir(target < this.x ? -1 : 1);
      this.walkTarget = target;
      this.onArrive = done;
    },

    tick: function (t) {
      var dt = Math.min(.05, (t - this.lastT) / 1000);
      this.lastT = t;
      var g = this.def.glide;
      var gliding = g && this.state === g.state && this.glideMoving;
      var moving = this.state === 'walk' || gliding;
      var tv = moving ? this.dir * this.def.config.speed[this.mood] * (gliding ? (g.boost || 1.5) : 1) : 0;
      this.vx += (tv - this.vx) * Math.min(1, dt * (moving ? 4.5 : 9));
      this.x = clamp(this.x + this.vx * dt, this.minX, this.maxX);
      if (this.state === 'walk') {
        if (this.walkTarget == null) {
          if (!this.paused) {
            // Early-turn only when the strip is wide enough for two pads, and never
            // twice within 500ms — a tiny lane otherwise flip-thrashes every frame.
            var tp = this.def.config.turnPad == null ? 20 : this.def.config.turnPad;
            var pad = this.maxX - this.minX > tp * 2 + 8 ? tp : 0;
            if (t - this.lastTurnT > 500) {
              if (this.dir < 0 && this.x <= this.minX + pad) { this.lastTurnT = t; this.setDir(1); }
              else if (this.dir > 0 && this.x >= this.maxX - pad) { this.lastTurnT = t; this.setDir(-1); }
            }
          }
        } else if (Math.abs(this.x - this.walkTarget) < 3 || this.x <= this.minX || this.x >= this.maxX) {
          this.walkTarget = null;
          if (this.paused && this.onArrive) {
            var cb = this.onArrive;
            this.onArrive = null;
            cb(this);
          } else {
            this.end();
          }
        }
      } else if (gliding) {
        if ((this.dir < 0 && this.x <= this.minX + 4) || (this.dir > 0 && this.x >= this.maxX - 4)) this.tuckGlide();
      }
      this.el.style.transform = 'translate3d(' + this.x.toFixed(2) + 'px,0,0)';
    },

    setMood: function (m) {
      var def = this.def;
      if (def.moods.indexOf(m) < 0) m = def.moods[0];
      var changed = m !== this.mood;
      this.mood = m;
      for (var i = 0; i < def.moods.length; i++) this.remC('mood-' + def.moods[i]);
      this.addC('mood-' + m);
      this.el.style.setProperty('--step', def.config.step[m]);
      if (def.onMood) def.onMood(this, m, changed);
      log(def.id, 'mood:', m);
    },

    applyTrip: function (days, ongoing) {
      this.tripDays = days;
      this.tripOngoing = ongoing;
      this.setMood(this.def.moodFromTrip(days, ongoing));
    },

    boot: function (laneMin, laneMax) {
      this.setLane(laneMin, laneMax);
      this.x = clamp(this.minX + (this.maxX - this.minX) * rand(.3, .7), this.minX, this.maxX);
      this.setDir(Math.random() < .5 ? -1 : 1);
      this.setMood(this.def.moods[0]);
      this.el.style.transform = 'translate3d(' + this.x.toFixed(2) + 'px,0,0)';
      this.booted = true;
      if (reduced) {
        var poses = (this.def.reducedPose || '').split(' ');
        for (var i = 0; i < poses.length; i++) if (poses[i]) this.addC(poses[i]);
        return;
      }
      // Blinking + specular shine live outside the FSM so they never stall.
      var self = this;
      (function blinkLoop() {
        setTimeout(function () {
          if (self.dead) return;
          if (self.state !== 'sleep' && !self.hasC('squint')) {
            self.pulse('blink', self.def.blinkMs || 130);
            if (Math.random() < .3) setTimeout(function () { self.pulse('blink', self.def.blinkMs || 130); }, 250);
          }
          blinkLoop();
        }, rand.apply(null, self.def.blinkEvery || [2300, 5600]));
      })();
      if (this.def.shineClasses && this.def.shineClasses.length) {
        (function shineLoop() {
          setTimeout(function () {
            if (self.dead) return;
            if (self.state !== 'sleep') {
              var cs = self.def.shineClasses;
              var c = cs[Math.floor(Math.random() * cs.length)];
              self.addC(c);
              setTimeout(function () { self.remC(c); }, 1100);
            }
            shineLoop();
          }, rand(9000, 22000));
        })();
      }
      if (this.def.ambient) this.def.ambient(this); // character-owned always-on loops
      this.setState('idle');
    },

    destroy: function () {
      this.dead = true;
      this.clearTimers();
      if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
    }
  };

  var registry = {};
  var order = [];

  window.TrekMascots = {
    reduced: reduced,
    rand: rand,
    clamp: clamp,
    pick: pick,
    register: function (def) {
      if (!registry[def.id]) order.push(def.id);
      registry[def.id] = def;
      if (def.css) {
        var s = document.createElement('style');
        s.setAttribute('data-ch', def.id);
        s.textContent = def.css;
        document.head.appendChild(s);
      }
    },
    get: function (id) { return registry[id]; },
    ids: function () { return order.slice(); },
    Runtime: Runtime
  };
})();
