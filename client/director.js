// Duet director — choreographs two mascots sharing the strip. The engine keeps
// both fully autonomous; every 1.5–4 minutes the director waits for a calm
// moment, freezes both FSMs (hold), plays one scene start-to-finish and hands
// control back (release). Scenes are built ONLY from the shared contract
// classes (wave/hop/squint/look-*) plus a few character-specific states, so a
// missing partner ability simply removes the scene from the deck.
(function () {
  'use strict';

  var rand = TrekMascots.rand;

  // states we may interrupt to start a scene — never mid-air, mid-roll, mid-stamp
  var CALM = { idle: 1, walk: 1, sit: 1 };

  function has(k, state) { return !!k.def.enter[state] || k.def.stateClasses.indexOf('st-' + state) >= 0; }
  function byId(a, b, id) { return a.def.id === id ? a : (b.def.id === id ? b : null); }

  function spark(stageFx, x, glyph) {
    var s = document.createElement('span');
    s.textContent = glyph || '✦';
    s.style.left = Math.round(x) + 'px';
    stageFx.appendChild(s);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 1100);
  }

  /** walk both to a shared spot, facing each other; done() once both arrive */
  function meet(a, b, gap, done) {
    var left = a.x <= b.x ? a : b;
    var right = left === a ? b : a;
    var mid = (a.x + b.x) / 2;
    var lo = Math.max(a.minX, Math.min(a.maxX, mid - gap / 2));
    var hi = Math.max(b.minX, Math.min(b.maxX, mid + gap / 2));
    var todo = 2;
    function arrived() { if (--todo === 0) done(); }
    left.walkTo(lo, function () { left.play('idle', { skipEnter: true }); left.setDir(1); arrived(); });
    right.walkTo(hi, function () { right.play('idle', { skipEnter: true }); right.setDir(-1); arrived(); });
  }

  var SCENES = {
    // both raise a limb, a sparkle pops between them
    highfive: {
      eligible: function () { return true; },
      run: function (a, b, fx, done) {
        meet(a, b, 54, function () {
          a.play('wave'); b.play('wave');
          setTimeout(function () { spark(fx, (a.x + b.x) / 2 + 30); }, 650);
          setTimeout(function () { a.pulse('hop', 470); b.pulse('hop', 470); }, 1400);
          setTimeout(done, 2400);
        });
      }
    },

    // side by side, greeting the traveler in near-sync
    syncwave: {
      eligible: function () { return true; },
      run: function (a, b, fx, done) {
        meet(a, b, 88, function () {
          a.setDir(1); b.setDir(1);
          a.play('wave');
          setTimeout(function () { b.play('wave'); }, 180);
          setTimeout(done, 2400);
        });
      }
    },

    // one playful lap across the strip, both hop at the end
    chase: {
      eligible: function (a, b) { return a.maxX - a.minX > 160; },
      run: function (a, b, fx, done) {
        var runner = Math.random() < .5 ? a : b;
        var chaser = runner === a ? b : a;
        var goal = runner.x - runner.minX < runner.maxX - runner.x ? runner.maxX : runner.minX;
        runner.walkTo(goal, function () { runner.play('idle', { skipEnter: true }); });
        setTimeout(function () {
          chaser.walkTo(goal < chaser.x ? goal + 40 : goal - 40, function () {
            chaser.play('idle', { skipEnter: true });
            runner.pulse('hop', 470); chaser.pulse('hop', 470);
            runner.setDir(chaser.x < runner.x ? -1 : 1);
            chaser.setDir(runner.x < chaser.x ? -1 : 1);
            setTimeout(done, 800);
          });
        }, 350);
      }
    },

    // Passi officiates: Koffi gets a fresh passport-control sticker
    stampgift: {
      eligible: function (a, b) { return byId(a, b, 'passi') && byId(a, b, 'koffi'); },
      run: function (a, b, fx, done) {
        var passi = byId(a, b, 'passi'), koffi = byId(a, b, 'koffi');
        meet(a, b, 60, function () {
          passi.addC('look-up');
          passi.pulse('hop', 470);
          koffi.play('stamp');
          setTimeout(function () { spark(fx, koffi.x + 36, '★'); }, 1100);
          setTimeout(function () { passi.remC('look-up'); passi.addC('squint'); }, 2100);
          setTimeout(function () { passi.remC('squint'); done(); }, 3400);
        });
      }
    },

    // Puffi climbs aboard and naps while Koffi glides the trolley across
    napride: {
      eligible: function (a, b) { return byId(a, b, 'puffi') && byId(a, b, 'koffi'); },
      run: function (a, b, fx, done) {
        var puffi = byId(a, b, 'puffi'), koffi = byId(a, b, 'koffi');
        if (koffi.maxX - koffi.minX < 150) { done(); return; }
        meet(a, b, 44, function () {
          puffi.pulse('hop', 470);
          setTimeout(function () {
            var jumper = puffi.el.querySelector('.jumper');
            if (jumper) jumper.style.bottom = '44px';   // hop onto the lid
            puffi.perchOn = koffi;                         // the 3D stage seats him on top
            puffi.play('sleep');
            koffi.play('roll');                          // enter.roll drives the glide + self-tucks
          }, 500);
          var follow = setInterval(function () {         // ride shotgun on the suitcase
            puffi.x = TrekMascots.clamp(koffi.x + 3, puffi.minX, puffi.maxX);
          }, 40);
          setTimeout(function () {
            clearInterval(follow);
            var jumper = puffi.el.querySelector('.jumper');
            if (jumper) jumper.style.bottom = '';
            puffi.perchOn = null;
            puffi.play('stretch');
            setTimeout(done, 1300);
          }, 4600);
        });
      }
    },

    // Chiki shares the warm steam; the partner leans in and basks
    steamshare: {
      eligible: function (a, b) { return byId(a, b, 'chiki'); },
      run: function (a, b, fx, done) {
        var chiki = byId(a, b, 'chiki');
        var pal = chiki === a ? b : a;
        meet(a, b, 48, function () {
          chiki.play(has(chiki, 'steam') ? 'steam' : 'idle');
          pal.addC(pal.x < chiki.x ? 'look-r' : 'look-l');
          setTimeout(function () { pal.addC('squint'); }, 900);
          setTimeout(function () { spark(fx, (a.x + b.x) / 2 + 30, '♥'); }, 1300);
          setTimeout(function () {
            pal.remC('look-l'); pal.remC('look-r'); pal.remC('squint');
            done();
          }, 3000);
        });
      }
    },

    // Chiki vanishes into the pouch; the partner searches, Chiki pops back out
    peekaboo: {
      eligible: function (a, b) { var c = byId(a, b, 'chiki'); return c && has(c, 'duck'); },
      run: function (a, b, fx, done) {
        var chiki = byId(a, b, 'chiki');
        var pal = chiki === a ? b : a;
        meet(a, b, 58, function () {
          chiki.play('duck');
          setTimeout(function () { pal.addC('look-l'); }, 500);
          setTimeout(function () { pal.remC('look-l'); pal.addC('look-r'); }, 1150);
          setTimeout(function () { pal.remC('look-r'); }, 1800);
          setTimeout(function () { pal.pulse('hop', 470); pal.addC('squint'); }, 2350);
          setTimeout(function () { pal.remC('squint'); done(); }, 3300);
        });
      }
    }
  };

  function Director(a, b, stage) {
    this.a = a;
    this.b = b;
    this.fx = document.getElementById('stage-fx');
    this.busy = false;
    this.stopped = false;
    this.glanceAt = performance.now() + rand(18000, 36000);
    this.sceneAt = performance.now() + rand(25000, 60000);
  }

  Director.prototype = {
    stop: function () { this.stopped = true; },

    calm: function () {
      return CALM[this.a.state] && CALM[this.b.state] && !this.a.paused && !this.b.paused;
    },

    tick: function () {
      if (this.stopped || this.busy) return;
      var now = performance.now();

      // ambient awareness: a brief glance across the strip
      if (now > this.glanceAt) {
        this.glanceAt = now + rand(20000, 42000);
        if (this.calm() && Math.abs(this.a.x - this.b.x) > 40) {
          var g = Math.random() < .5 ? this.a : this.b;
          var o = g === this.a ? this.b : this.a;
          g.addC(o.x < g.x ? 'look-l' : 'look-r');
          setTimeout(function () { g.remC('look-l'); g.remC('look-r'); }, rand(600, 1100));
        }
      }

      if (now > this.sceneAt) {
        if (!this.calm()) { this.sceneAt = now + 8000; return; } // wait out the nap/roll/stamp
        this.playScene();
      }
    },

    playScene: function () {
      var deck = [], k;
      for (k in SCENES) if (SCENES[k].eligible(this.a, this.b)) deck.push(k);
      if (!deck.length) { this.sceneAt = performance.now() + 120000; return; }
      var name = deck[Math.floor(Math.random() * deck.length)];
      var self = this;
      this.busy = true;
      this.a.hold(); this.b.hold();
      var guard = setTimeout(finish, 12000); // a stuck scene must never freeze the strip
      function finish() {
        clearTimeout(guard);
        if (!self.busy) return;
        self.busy = false;
        self.sceneAt = performance.now() + rand(90000, 240000);
        self.a.release(); self.b.release();
      }
      try {
        SCENES[name].run(this.a, this.b, this.fx, finish);
      } catch (e) {
        finish();
      }
    }
  };

  window.TrekDirector = {
    start: function (a, b, stage) { return new Director(a, b, stage); }
  };
})();
