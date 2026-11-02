/* ============================================
   hero-motion.js — the moving graphic behind the home page hero.
   Four scenes from my own work; visitors switch between them and the choice
   is remembered. Only the chosen scene runs, and only while it is on screen.
     flow      Kármán vortex street: flow past a cylinder (CFD, CudaFluids)
     heat      5-point heat stencil on a dot grid, four cores under load (HPC)
     fluid     particle fluid sloshing in a tank (SPH, SPHinXsys)
     roofline  kernels climbing a roofline plot as optimizations land
   The page reads fine without this file: the controls stay hidden.
   ============================================ */
(function () {
  'use strict';

  var banner = document.querySelector('[data-hero-motion]');
  if (!banner) return;
  var canvas = banner.querySelector('.hero-canvas');
  var ctx = canvas && canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;

  var root = document.documentElement;
  var STORE_KEY = 'durganshu-hero';
  var NAMES = ['flow', 'heat', 'fluid', 'roofline'];
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrowQuery = window.matchMedia('(max-width: 767.98px)');
  var TAU = Math.PI * 2;

  function read() { try { return localStorage.getItem(STORE_KEY); } catch (_) { return null; } }
  function write(v) { try { localStorage.setItem(STORE_KEY, v); } catch (_) { /* storage unavailable */ } }

  // ─── Colours from the theme tokens ────────────────
  var pal = {};
  function parse(c) {
    c = (c || '').trim();
    if (c[0] === '#') {
      if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    }
    var m = c.match(/[\d.]+/g);
    return m ? m.slice(0, 3).map(Number) : [128, 128, 128];
  }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')'; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function readPalette() {
    var cs = getComputedStyle(root);
    pal.accent = parse(cs.getPropertyValue('--accent'));
    pal.accent2 = parse(cs.getPropertyValue('--accent-2'));
    pal.warm = parse(cs.getPropertyValue('--accent-orange'));
    pal.text = parse(cs.getPropertyValue('--text-primary'));
    pal.text2 = parse(cs.getPropertyValue('--text-secondary'));
    pal.bg = parse(cs.getPropertyValue('--bg-primary'));
    pal.dot = mix(pal.bg, pal.text2, 0.2);
  }
  var MONO = '"Geist Mono", "JetBrains Mono", ui-monospace, monospace';

  // ─── Scene: flow (vortex street) ──────────────────
  var VU = 0, VV = 0;
  var Flow = {
    caption: 'flow past a cylinder · St ≈ 0.2',
    init: function (s) {
      var w = s.w, h = s.h, g = s.region;
      var gh = g.y1 - g.y0;
      s.R = s.narrow ? Math.max(12, Math.min(gh * 0.11, 24)) : Math.max(14, Math.min(h * 0.075, 30));
      s.cx = s.narrow ? w * 0.38 : Math.max(w * 0.45, Math.min(s.textRight + 2.8 * s.R, w - 9 * s.R));
      s.cy = s.narrow ? g.y0 + gh * 0.5 : h * 0.48;
      s.S = Math.max(55, Math.min(w, 1400) * 0.07);
      s.Rp = s.R * 0.7;
      s.G = 4.6 * s.S * s.R;
      s.half = 5 * s.R / s.S;               // half the shedding period: St = 0.2
      s.timer = 0; s.side = -1; s.vort = [];
      var l = 8 * s.R, x0 = s.cx + 1.25 * s.R, vs = 0.8 * s.S;
      for (var x = x0 + l / 2, side = 1; x < w + 4 * s.R; x += l / 2, side = -side) {
        s.vort.push({ x: x, y: s.cy + side * 1.12 * s.R, ty: s.cy + side * 1.12 * s.R, g: -side * s.G * Math.exp(-(x - x0) / (vs * 7)), d2: Math.pow(0.8 * s.R, 2) });
      }
      var n = Math.round(Math.min(s.narrow ? 800 : 1500, w * h / 480));
      s.p = new Float32Array(n * 7);        // x, y, px, py, life, speed, dye
      s.n = n; s.nDye = Math.round(n * 0.55);
      for (var i = 0; i < n; i++) this.spawn(s, i, true);
      ctx.clearRect(0, 0, w, h);
      for (var k = 0; k < 140; k++) { this.step(s, 1 / 60); this.draw(s); }
    },
    spawn: function (s, i, anywhere) {
      var o = i * 7, p = s.p, dye = i < s.nDye, x, y;
      if (dye && !anywhere) {
        // dye released at the cylinder's shoulders, like a smoke-wire experiment
        var side = Math.random() < 0.5 ? -1 : 1, th = side * (Math.PI / 2 - rand(0, 0.5));
        x = s.cx + Math.cos(th) * s.R * 1.08; y = s.cy + Math.sin(th) * s.R * 1.08;
      } else {
        do {
          x = anywhere || Math.random() < 0.3 ? Math.random() * s.w : -Math.random() * 12;
          y = dye ? s.cy + rand(-2.2, 2.2) * s.R : Math.random() * s.h;
        } while (Math.pow(x - s.cx, 2) + Math.pow(y - s.cy, 2) < s.R * s.R * 1.1);
      }
      p[o] = p[o + 2] = x; p[o + 1] = p[o + 3] = y; p[o + 4] = dye ? 40 : rand(3, 9); p[o + 5] = 0; p[o + 6] = dye ? 1 : 0;
    },
    vel: function (s, x, y) {
      var U = s.S, u = U, v = 0, a = x - s.cx, b = y - s.cy, r2 = a * a + b * b, r4, R2;
      if (r2 > 1) { r4 = r2 * r2; R2 = s.R * s.R; u -= U * R2 * (a * a - b * b) / r4; v -= 2 * U * R2 * a * b / r4; }
      // slow wake behind the cylinder: the shear layers the vortices roll up from
      if (a > 0) { var wy = b / (1.1 * s.R); u -= U * 0.55 * Math.exp(-wy * wy) * Math.exp(-a / (14 * s.R)) * Math.min(1, a / s.R); }
      var P = s.pointer;
      if (P.in) {
        a = x - P.x; b = y - P.y; r2 = a * a + b * b;
        if (r2 > 1) { r4 = r2 * r2; R2 = s.Rp * s.Rp; u -= U * R2 * (a * a - b * b) / r4; v -= 2 * U * R2 * a * b / r4; }
      }
      for (var k = 0; k < s.vort.length; k++) {
        var q = s.vort[k], dx = x - q.x, dy = y - q.y, f = q.g / (TAU * (dx * dx + dy * dy + q.d2));
        u -= f * dy; v += f * dx;
      }
      VU = u; VV = v;
    },
    step: function (s, dt) {
      var w = s.w, h = s.h, R = s.R;
      s.timer += dt;
      if (s.timer > s.half) {
        s.timer -= s.half;
        var side = s.side; s.side = -side;
        s.vort.push({ x: s.cx + 1.25 * R, y: s.cy + side * 0.55 * R, ty: s.cy + side * 1.12 * R, g: -side * s.G, d2: Math.pow(0.8 * R, 2) });
      }
      for (var k = s.vort.length - 1; k >= 0; k--) {
        var q = s.vort[k];
        q.x += 0.8 * s.S * dt; q.y += (q.ty - q.y) * Math.min(1, dt * 1.5); q.g *= Math.exp(-dt / 7);
        if (q.x > w + 5 * R) s.vort.splice(k, 1);
      }
      var p = s.p, P = s.pointer, R2 = R * R * 0.96, Rp2 = s.Rp * s.Rp * 0.96;
      for (var i = 0, o = 0; i < s.n; i++, o += 7) {
        var x = p[o], y = p[o + 1];
        this.vel(s, x, y); var u1 = VU, v1 = VV;
        this.vel(s, x + u1 * dt * 0.5, y + v1 * dt * 0.5);
        var nx = x + VU * dt, ny = y + VV * dt;
        p[o + 2] = x; p[o + 3] = y; p[o] = nx; p[o + 1] = ny; p[o + 4] -= dt;
        p[o + 5] = Math.sqrt(VU * VU + VV * VV) / s.S;
        var inCyl = Math.pow(nx - s.cx, 2) + Math.pow(ny - s.cy, 2) < R2;
        var inPtr = P.in && Math.pow(nx - P.x, 2) + Math.pow(ny - P.y, 2) < Rp2;
        if (nx > w + 4 || ny < -20 || ny > h + 20 || inCyl || inPtr || p[o + 4] < 0) this.spawn(s, i, false);
      }
    },
    draw: function (s) {
      var w = s.w, h = s.h;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.085)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      // background tracers stay dim; the dye carries the colour, by speed
      var cols = [rgba(pal.text2, 0.3), rgba(pal.accent, 0.75), rgba(mix(pal.accent, pal.accent2, 0.55), 0.9), rgba(pal.accent2, 1)];
      var edges = [0.8, 1.15, 99];
      ctx.lineCap = 'round';
      var p = s.p;
      for (var b = 0; b < 4; b++) {
        ctx.beginPath();
        var lo = b > 1 ? edges[b - 2] : -1, hi = b ? edges[b - 1] : 99;
        for (var i = 0, o = 0; i < s.n; i++, o += 7) {
          var dye = p[o + 6] === 1, sp = p[o + 5];
          if ((b === 0) === dye) continue;
          if (b > 0 && (sp < lo || sp >= hi)) continue;
          if (p[o] === p[o + 2] && p[o + 1] === p[o + 3]) continue;
          ctx.moveTo(p[o + 2], p[o + 3]); ctx.lineTo(p[o], p[o + 1]);
        }
        ctx.lineWidth = b === 0 ? 1 : 1.6;
        ctx.strokeStyle = cols[b]; ctx.stroke();
      }
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(s.cx, s.cy, s.R, 0, TAU);
      ctx.fillStyle = rgba(pal.bg, 0.9); ctx.fill();
      ctx.strokeStyle = rgba(pal.text2, 0.55); ctx.stroke();
      if (s.pointer.in) {
        ctx.beginPath(); ctx.arc(s.pointer.x, s.pointer.y, s.Rp, 0, TAU);
        ctx.fillStyle = rgba(pal.bg, 0.9); ctx.fill();
        ctx.strokeStyle = rgba(pal.accent2, 0.7); ctx.stroke();
      }
    },
    redraw: function (s) { ctx.clearRect(0, 0, s.w, s.h); this.draw(s); }
  };

  // ─── Scene: heat (5-point stencil) ────────────────
  var Heat = {
    caption: '5-point stencil',
    init: function (s) {
      var w = s.w, h = s.h;
      s.sp = s.narrow ? 12 : 14;
      s.cols = Math.floor((w - 8) / s.sp); s.rows = Math.floor((h - 8) / s.sp);
      s.ox = (w - (s.cols - 1) * s.sp) / 2; s.oy = (h - (s.rows - 1) * s.sp) / 2;
      s.T = new Float32Array(s.cols * s.rows); s.T2 = new Float32Array(s.cols * s.rows);
      s.iter = 0; s.tick = 0; s.cores = [];
      for (var id = 0; id < 4; id++) { var c = this.place(s, { id: id }); c.age = rand(0, c.life * 0.6); s.cores.push(c); }
      for (var i = 0; i < 400; i++) this.step(s, 1 / 60, true);
    },
    place: function (s, c) {
      var g = s.region;
      var i0 = Math.max(3, Math.ceil((g.x0 - s.ox) / s.sp) + 2), i1 = Math.min(s.cols - 3, Math.floor((g.x1 - s.ox) / s.sp) - 2);
      var j0 = Math.max(3, Math.ceil((g.y0 - s.oy) / s.sp) + 3), j1 = Math.min(s.rows - 4, Math.floor((g.y1 - s.oy) / s.sp) - 2);
      if (i1 <= i0) { i0 = 3; i1 = s.cols - 3; }
      if (j1 <= j0) { j0 = 3; j1 = s.rows - 4; }
      for (var tries = 0; tries < 30; tries++) {
        c.i = Math.floor(rand(i0, i1)); c.j = Math.floor(rand(j0, j1));
        var clash = s.cores.some(function (o) { return o !== c && Math.abs(o.i - c.i) < 8 && Math.abs(o.j - c.j) < 7; });
        if (!clash) break;
      }
      c.power = rand(1.1, 1.6); c.life = rand(3, 7); c.age = 0;
      return c;
    },
    step: function (s, dt, quiet) {
      var cols = s.cols, rows = s.rows, self = this;
      s.cores.forEach(function (c) { c.age += dt; if (c.age > c.life) self.place(s, c); });
      for (var sub = 0; sub < 3; sub++) {
        var T = s.T, N = s.T2, di, dj, idx, target;
        s.cores.forEach(function (c) {
          var t = c.power * Math.max(0, Math.min(1, c.age / 0.8, (c.life - c.age) / 0.8));
          for (dj = -1; dj <= 1; dj++) for (di = -1; di <= 1; di++) {
            idx = (c.j + dj) * cols + c.i + di; target = (di || dj) ? t * 0.8 : t;
            if (T[idx] < target) T[idx] = target;
          }
        });
        var P = s.pointer;
        if (P.in) {
          var pi = Math.round((P.x - s.ox) / s.sp), pj = Math.round((P.y - s.oy) / s.sp);
          for (dj = -1; dj <= 1; dj++) for (di = -1; di <= 1; di++) {
            var ii = pi + di, jj = pj + dj;
            if (ii > 0 && jj > 0 && ii < cols - 1 && jj < rows - 1) { idx = jj * cols + ii; target = (di || dj) ? 1.3 : 1.7; if (T[idx] < target) T[idx] = target; }
          }
        }
        for (var j = 1; j < rows - 1; j++) {
          var r = j * cols;
          for (var i = 1; i < cols - 1; i++) {
            var k = r + i;
            N[k] = (T[k] + 0.22 * (T[k - 1] + T[k + 1] + T[k - cols] + T[k + cols] - 4 * T[k])) * 0.9965;
          }
        }
        s.T = N; s.T2 = T; s.iter++;
      }
      if (!quiet && ++s.tick % 12 === 0) s.caption('5-point stencil · ' + cols + '×' + rows + ' grid · iteration ' + s.iter.toLocaleString('en-US'));
    },
    draw: function (s) {
      ctx.clearRect(0, 0, s.w, s.h);
      var L = 12, stops = [[0, pal.dot], [0.3, pal.accent], [0.62, pal.warm], [1, pal.text]];
      function colorAt(t) {
        for (var k = 1; k < stops.length; k++) if (t <= stops[k][0]) { var a = stops[k - 1], b = stops[k]; return mix(a[1], b[1], (t - a[0]) / (b[0] - a[0])); }
        return stops[stops.length - 1][1];
      }
      var T = s.T, cols = s.cols, rows = s.rows, sp = s.sp;
      for (var lvl = 0; lvl < L; lvl++) {
        var t0 = lvl / L, t1 = (lvl + 1) / L, tm = (t0 + t1) / 2, r = 1.15 + 2.7 * tm;
        ctx.beginPath();
        for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
          var v = Math.min(0.999, T[j * cols + i] / 1.6);
          if (v < t0 || v >= t1) continue;
          var x = s.ox + i * sp, y = s.oy + j * sp;
          ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU);
        }
        ctx.fillStyle = rgba(colorAt(tm), lvl === 0 ? 1 : 0.6 + 0.4 * tm); ctx.fill();
      }
      ctx.font = '10.5px ' + MONO; ctx.lineWidth = 1; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      s.cores.forEach(function (c) {
        var ramp = Math.max(0, Math.min(1, c.age / 0.8, (c.life - c.age) / 0.8));
        if (ramp <= 0.02) return;
        var x = s.ox + c.i * sp, y = s.oy + c.j * sp, half = sp * 2.2;
        ctx.strokeStyle = rgba(pal.text2, 0.45 * ramp); ctx.strokeRect(x - half, y - half, half * 2, half * 2);
        ctx.fillStyle = rgba(pal.text2, 0.85 * ramp); ctx.fillText('core ' + c.id, x - half, y - half - 5);
      });
    }
  };

  // ─── Scene: fluid (double-density relaxation) ─────
  var Fluid = {
    caption: 'particle fluid',
    init: function (s) {
      var g = s.region;
      // the tank: the free area beside the text, or above it on phones
      s.tx0 = s.narrow ? 0 : Math.max(0, Math.min(s.textRight + 16, s.w - 300));
      s.tx1 = s.w; s.ty0 = 0; s.ty1 = s.narrow ? g.y1 : s.h * 0.8;
      var tw = s.tx1 - s.tx0, th = s.ty1 - s.ty0;
      var H = Math.max(13, Math.min(22, tw / 40));
      var n = Math.round(Math.max(160, Math.min(s.narrow ? 480 : 900, 0.33 * tw * th / (0.35 * H * H))));
      s.H = H; s.n = n; s.k = 0.5; s.kn = 0.8; s.rho0 = 2; s.t = rand(0, 20); s.tick = 0;
      ['x', 'y', 'vx', 'vy', 'px', 'py', 'spd'].forEach(function (key) { s[key] = new Float32Array(n); });
      s.nbJ = new Int32Array(256); s.nbQ = new Float32Array(256); s.nbR = new Float32Array(256);
      s.gc = Math.ceil(tw / H) + 1; s.gr = Math.ceil(th / H) + 1;
      s.head = new Int32Array(s.gc * s.gr); s.next = new Int32Array(n);
      var sp = H * 0.55, perRow = Math.max(1, Math.floor((tw - H) / sp));
      for (var i = 0, r = 0; i < n; r++) for (var c = 0; c < perRow && i < n; c++, i++) {
        s.x[i] = s.tx0 + H / 2 + c * sp + (r % 2) * sp / 2; s.y[i] = s.ty1 - H / 2 - r * sp;
      }
      for (var k = 0; k < 600; k++) this.step(s, 1 / 60, true);
    },
    step: function (s, dt, quiet) {
      s.t += dt;
      var ang = Math.sin(s.t * 0.45) * 0.11 + Math.sin(s.t * 0.13) * 0.05, g = 0.03;
      s.ang = ang;
      for (var k = 0; k < 2; k++) this.sub(s, Math.sin(ang) * g, Math.cos(ang) * g);
      s.pointer.vx *= 0.8; s.pointer.vy *= 0.8;
      if (!quiet && ++s.tick % 15 === 0) s.caption(s.n + ' particles · gravity ' + (ang >= 0 ? '+' : '−') + Math.abs(ang * 57.3).toFixed(0) + '°');
    },
    sub: function (s, gx, gy) {
      var n = s.n, x = s.x, y = s.y, vx = s.vx, vy = s.vy, px = s.px, py = s.py, H = s.H;
      var gc = s.gc, gr = s.gr, head = s.head, next = s.next, nbJ = s.nbJ, nbQ = s.nbQ, nbR = s.nbR;
      var X0 = s.tx0, Y0 = s.ty0, P = s.pointer, pr = H * 4, vmax = H * 0.45, i, j, d, dx, dy;
      for (i = 0; i < n; i++) {
        vx[i] += gx; vy[i] += gy;
        if (P.in) {
          dx = x[i] - P.x; dy = y[i] - P.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < pr && d > 0.01) { var f = 1 - d / pr; vx[i] += dx / d * f * 0.6 + P.vx * f * 0.05; vy[i] += dy / d * f * 0.6 + P.vy * f * 0.05; }
        }
        var sv = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
        if (sv > vmax) { vx[i] *= vmax / sv; vy[i] *= vmax / sv; }
        px[i] = x[i]; py[i] = y[i]; x[i] += vx[i]; y[i] += vy[i];
      }
      head.fill(-1);
      for (i = 0; i < n; i++) {
        var c = Math.min(gc - 1, Math.max(0, ((x[i] - X0) / H) | 0)), r = Math.min(gr - 1, Math.max(0, ((y[i] - Y0) / H) | 0));
        var cell = r * gc + c; next[i] = head[cell]; head[cell] = i;
      }
      var H2 = H * H;
      for (i = 0; i < n; i++) {
        var xi = x[i], yi = y[i];
        var c0 = Math.min(gc - 1, Math.max(0, ((xi - X0) / H) | 0)), r0 = Math.min(gr - 1, Math.max(0, ((yi - Y0) / H) | 0));
        var m = 0, rho = 0, rhon = 0;
        for (var rr = Math.max(0, r0 - 1); rr <= Math.min(gr - 1, r0 + 1); rr++)
          for (var cc = Math.max(0, c0 - 1); cc <= Math.min(gc - 1, c0 + 1); cc++)
            for (j = head[rr * gc + cc]; j !== -1; j = next[j]) {
              if (j === i) continue;
              dx = x[j] - xi; dy = y[j] - yi; var d2 = dx * dx + dy * dy;
              if (d2 >= H2 || d2 < 1e-6 || m >= 256) continue;
              d = Math.sqrt(d2); var q = 1 - d / H;
              rho += q * q; rhon += q * q * q; nbJ[m] = j; nbQ[m] = q; nbR[m] = d; m++;
            }
        var Pr = s.k * (rho - s.rho0), Pn = s.kn * rhon, ax = 0, ay = 0;
        for (var t = 0; t < m; t++) {
          j = nbJ[t]; var qq = nbQ[t]; d = nbR[t];
          var D = (Pr * qq + Pn * qq * qq) * 0.5, ux = (x[j] - xi) / d, uy = (y[j] - yi) / d;
          x[j] += D * ux; y[j] += D * uy; ax -= D * ux; ay -= D * uy;
        }
        x[i] += ax; y[i] += ay;
      }
      var pad = H * 0.3;
      for (i = 0; i < n; i++) {
        if (x[i] < s.tx0 + pad) x[i] = s.tx0 + pad; else if (x[i] > s.tx1 - pad) x[i] = s.tx1 - pad;
        if (y[i] < s.ty0 + pad) y[i] = s.ty0 + pad; else if (y[i] > s.ty1 - pad) y[i] = s.ty1 - pad;
        vx[i] = x[i] - px[i]; vy[i] = y[i] - py[i];
        s.spd[i] = s.spd[i] * 0.8 + Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]) * 0.2;
      }
    },
    draw: function (s) {
      ctx.clearRect(0, 0, s.w, s.h);
      // the tank: a faint open-topped outline, so the liquid reads as contained
      var wallTop = s.ty1 - (s.ty1 - s.ty0) * 0.55, inset = s.H * 0.15;
      ctx.strokeStyle = rgba(pal.text2, 0.35); ctx.lineWidth = 1;
      ctx.beginPath();
      if (s.tx0 > 1) { ctx.moveTo(s.tx0 + inset, wallTop); ctx.lineTo(s.tx0 + inset, s.ty1 - inset); } else ctx.moveTo(0, s.ty1 - inset);
      ctx.lineTo(s.w, s.ty1 - inset);
      ctx.stroke();
      var r = s.H * 0.26;
      var cols = [rgba(pal.accent, 0.75), rgba(mix(pal.accent, pal.accent2, 0.5), 0.9), rgba(pal.accent2, 1)];
      var edges = [0.6, 1.6, 1e9];
      for (var b = 0; b < 3; b++) {
        ctx.beginPath();
        var lo = b ? edges[b - 1] : -1, hi = edges[b];
        for (var i = 0; i < s.n; i++) {
          var v = s.spd[i]; if (v < lo || v >= hi) continue;
          ctx.moveTo(s.x[i] + r, s.y[i]); ctx.arc(s.x[i], s.y[i], r, 0, TAU);
        }
        ctx.fillStyle = cols[b]; ctx.fill();
      }
    }
  };

  // ─── Scene: roofline climb ────────────────────────
  var BW = 100, PEAK = 1024;                 // GB/s, GFLOP/s of an illustrative machine
  function roof(I) { return Math.min(BW * I, PEAK); }
  var KERNELS = [
    { name: 'STREAM triad', I: 1 / 12, f0: 0.1, steps: [['-O3', 0.4], ['OpenMP', 0.92]] },
    { name: 'SpMV', I: 0.25, f0: 0.08, steps: [['-O3', 0.3], ['RCM reorder', 0.55], ['OpenMP', 0.86]] },
    { name: '2D stencil', I: 0.5, f0: 0.06, steps: [['-O3', 0.22], ['-march=native', 0.42], ['cache blocking', 0.62, 1.6], ['OpenMP', 0.9]] },
    { name: 'FFT', I: 3, f0: 0.05, steps: [['-O3', 0.14], ['SIMD', 0.38], ['OpenMP', 0.78]] },
    { name: 'N-body', I: 12, f0: 0.04, steps: [['-O3', 0.1], ['-ffast-math', 0.22], ['AVX-512', 0.55], ['OpenMP', 0.9]] },
    { name: 'DGEMM', I: 40, f0: 0.02, steps: [['loop reorder', 0.09], ['blocking', 0.32], ['SIMD + FMA', 0.68], ['OpenMP', 0.94]] }
  ];
  var STEP_GAP = 1.5, STAGGER = 0.4, HOLD = 3, FADE = 0.8;
  var CYCLE = 5 * STEP_GAP + 5 * STAGGER + HOLD + FADE;
  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3); }
  var Roofline = {
    caption: 'illustrative machine · 100 GB/s · 1 TFLOP/s peak',
    init: function (s) {
      var g = s.region;
      if (s.narrow) {
        s.box = { x0: 44, x1: s.w - 18, y0: g.y0 + 30, y1: g.y1 - 34 };
      } else {
        var x0 = Math.max(s.textRight + 80, s.w * 0.5);
        if (s.w - 30 - x0 < 300) x0 = Math.max(60, s.w - 330);
        s.box = { x0: x0, x1: s.w - 30, y0: 46, y1: Math.max(200, s.h * 0.72) };
      }
      s.lx = [-4, 6]; s.ly = [2, 11];
      s.t = reduceMotion ? 5 * STEP_GAP + 5 * STAGGER + 0.5 : 0;
    },
    X: function (s, I) { var b = s.box; return b.x0 + (Math.log2(I) - s.lx[0]) / (s.lx[1] - s.lx[0]) * (b.x1 - b.x0); },
    Y: function (s, P) { var b = s.box; return b.y1 - (Math.log2(P) - s.ly[0]) / (s.ly[1] - s.ly[0]) * (b.y1 - b.y0); },
    state: function (s, k, idx) {
      var t = s.t - idx * STAGGER, f = k.f0, I = k.I, label = null, la = 0;
      for (var j = 0; j < k.steps.length; j++) {
        var st = k.steps[j], t0 = 0.6 + j * STEP_GAP;
        if (t < t0) break;
        var e = ease((t - t0) / 0.7), INew = st[2] || I;
        f = f + (st[1] - f) * e; I = Math.exp(Math.log(I) + (Math.log(INew) - Math.log(I)) * e);
        if (t - t0 < 1.3) { label = st[0]; la = Math.min(1, (t - t0) / 0.15, (1.3 - (t - t0)) / 0.3); }
      }
      return { f: f, I: I, label: label, la: la };
    },
    step: function (s, dt) { s.t += dt; if (s.t > CYCLE) s.t = 0; },
    draw: function (s) {
      var self = this, b = s.box;
      ctx.clearRect(0, 0, s.w, s.h);
      var fade = s.t > CYCLE - FADE ? (CYCLE - s.t) / FADE : Math.min(1, s.t / 0.4 + (reduceMotion ? 1 : 0));
      ctx.font = '10.5px ' + MONO; ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(pal.text2, 0.13); ctx.fillStyle = rgba(pal.text2, 0.8);
      ctx.beginPath();
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      [[-4, '1/16'], [-2, '1/4'], [0, '1'], [2, '4'], [4, '16'], [6, '64']].forEach(function (e) {
        var x = self.X(s, Math.pow(2, e[0])); ctx.moveTo(x, b.y0); ctx.lineTo(x, b.y1); ctx.fillText(e[1], x, b.y1 + 6);
      });
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      [2, 5, 8, 11].forEach(function (e) {
        var y = self.Y(s, Math.pow(2, e)); ctx.moveTo(b.x0, y); ctx.lineTo(b.x1, y); ctx.fillText(String(Math.pow(2, e)), b.x0 - 6, y);
      });
      ctx.stroke();
      ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('FLOP/byte', b.x1, b.y1 + 20);
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('GFLOP/s', b.x0 - 30, b.y0 - 10);
      ctx.setLineDash([3, 4]); ctx.strokeStyle = rgba(pal.text2, 0.4); ctx.fillStyle = rgba(pal.text2, 0.75);
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      [[512, 'no FMA'], [128, 'scalar']].forEach(function (c) {
        var y = self.Y(s, c[0]), x = self.X(s, c[0] / BW);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(b.x1, y); ctx.stroke(); ctx.fillText(c[1], b.x1, y - 3);
      });
      ctx.setLineDash([]);
      var xa = this.X(s, Math.pow(2, s.lx[0])), xr = this.X(s, PEAK / BW);
      var grad = ctx.createLinearGradient(b.x0, 0, b.x1, 0);
      grad.addColorStop(0, rgba(pal.accent, 1)); grad.addColorStop(1, rgba(pal.accent2, 1));
      ctx.strokeStyle = grad; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(xa, this.Y(s, roof(Math.pow(2, s.lx[0])))); ctx.lineTo(xr, this.Y(s, PEAK)); ctx.lineTo(b.x1, this.Y(s, PEAK)); ctx.stroke();
      ctx.fillStyle = rgba(pal.text, 0.9); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText('1 TFLOP/s peak', b.x1, this.Y(s, PEAK) - 6);
      ctx.save(); ctx.translate(this.X(s, 0.5), this.Y(s, roof(0.5)) - 8);
      ctx.rotate(Math.atan2(this.Y(s, roof(4)) - this.Y(s, roof(0.5)), this.X(s, 4) - this.X(s, 0.5)));
      ctx.textAlign = 'left'; ctx.fillText('100 GB/s', 0, 0); ctx.restore();
      ctx.lineWidth = 1;
      var hover = null, hoverD = Math.pow(s.pointer.reach || 26, 2), floor = Math.pow(2, s.ly[0]);
      KERNELS.forEach(function (k, idx) {
        var st = self.state(s, k, idx), P = Math.max(floor, st.f * roof(st.I));
        var x = self.X(s, st.I), y = self.Y(s, P), x0 = self.X(s, k.I), y0 = self.Y(s, Math.max(floor, k.f0 * roof(k.I)));
        ctx.strokeStyle = rgba(pal.accent2, 0.3 * fade); ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fillStyle = rgba(pal.accent2, 0.14 * fade); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 4.2, 0, TAU); ctx.fillStyle = rgba(mix(pal.accent, pal.accent2, st.f), fade); ctx.fill();
        if (st.label && fade > 0) {
          var below = idx % 2 === 1;
          ctx.font = '11.5px ' + MONO; ctx.textAlign = 'center'; ctx.textBaseline = below ? 'top' : 'bottom';
          var half = ctx.measureText(st.label).width / 2 + 4, lx = Math.min(s.w - half, Math.max(half, x));
          ctx.fillStyle = rgba(pal.accent, st.la * fade); ctx.fillText(st.label, lx, below ? y + 12 : y - 12);
          ctx.font = '10.5px ' + MONO;
        }
        var Pt = s.pointer;
        if (Pt.in) { var dd = Math.pow(Pt.x - x, 2) + Math.pow(Pt.y - y, 2); if (dd < hoverD) { hoverD = dd; hover = { k: k, x: x, y: y, f: st.f }; } }
      });
      if (hover) {
        var txt = hover.k.name + ' · ' + Math.round(hover.f * 100) + '% of roof';
        ctx.font = '12px ' + MONO;
        var tw = ctx.measureText(txt).width + 16;
        var tx = Math.min(s.w - tw - 8, Math.max(8, hover.x - tw / 2)), ty = hover.y + 14;
        ctx.fillStyle = rgba(pal.bg, 0.92); ctx.strokeStyle = rgba(pal.text2, 0.5);
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(tx, ty, tw, 24, 6); else ctx.rect(tx, ty, tw, 24); ctx.fill(); ctx.stroke();
        ctx.fillStyle = rgba(pal.text, 1); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(txt, tx + 8, ty + 12);
      }
    }
  };

  // ─── Runner ───────────────────────────────────────
  var SCENES = { flow: Flow, heat: Heat, fluid: Fluid, roofline: Roofline };
  var captionEl = banner.querySelector('[data-hero-caption]');
  var pauseBtn = banner.querySelector('[data-hero-pause]');
  var sceneBtns = Array.prototype.slice.call(banner.querySelectorAll('[data-hero-scene]'));
  var textEls = Array.prototype.slice.call(banner.querySelectorAll('.hero-text > *'));

  var stored = read();
  var current = NAMES.indexOf(stored) > -1 ? stored : 'flow';
  var scene = null;
  var s = null;
  var pointer = { x: 0, y: 0, vx: 0, vy: 0, in: false, reach: 26 };
  var paused = reduceMotion, visible = true, raf = 0, last = 0;

  function setCaption(t) { if (captionEl) captionEl.textContent = t; }

  // Where the text sits, so the graphic fills the space beside it (or above it on phones)
  function measure(w, h) {
    var c = canvas.getBoundingClientRect(), right = 0, top = h;
    textEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (!r.width) return;
      var range = document.createRange(); range.selectNodeContents(el);
      var rr = range.getBoundingClientRect();
      right = Math.max(right, (rr.width ? rr.right : r.right) - c.left);
      top = Math.min(top, r.top - c.top);
    });
    return { right: right, top: top };
  }

  function build() {
    var rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var narrow = narrowQuery.matches, m = measure(rect.width, rect.height);
    banner.style.setProperty('--hero-text-right', Math.round(m.right) + 'px');
    banner.style.setProperty('--hero-text-top', Math.round(m.top) + 'px');
    s = {
      w: rect.width, h: rect.height, narrow: narrow, textRight: m.right, pointer: pointer, caption: setCaption,
      region: narrow ? { x0: 0, x1: rect.width, y0: 0, y1: Math.max(120, m.top - 12) } : { x0: m.right + 24, x1: rect.width, y0: 0, y1: rect.height }
    };
    scene = SCENES[current];
    setCaption(scene.caption);
    scene.init(s);
    scene.draw(s);
    return true;
  }

  function frame(t) {
    raf = 0;
    if (!visible || paused || document.hidden || !s) return;
    var dt = Math.min(Math.max((t - last) / 1000, 0), 1 / 30); last = t;
    scene.step(s, dt); scene.draw(s);
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!raf && s && visible && !paused && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  function syncControls() {
    sceneBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-hero-scene') === current)); });
    if (pauseBtn) {
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
      pauseBtn.setAttribute('title', paused ? 'Play animation' : 'Pause animation');
      banner.classList.toggle('is-paused', paused);
    }
    banner.setAttribute('data-scene', current);
  }

  function setScene(name, remember) {
    if (NAMES.indexOf(name) < 0) return false;
    current = name;
    if (remember !== false) write(name);
    stop(); build(); syncControls(); start();
    return true;
  }
  function setPaused(p) { paused = !!p; syncControls(); if (paused) { stop(); if (s) scene.draw(s); } else start(); }

  sceneBtns.forEach(function (b) {
    b.addEventListener('click', function () { setScene(b.getAttribute('data-hero-scene')); });
  });
  if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!paused); });

  // The text sits on top of the canvas, so listen on the whole banner.
  // Mouse: the cursor interacts while it hovers. Touch and pen: a tap pokes the scene
  // and the effect lingers briefly; dragging sideways keeps interacting. Vertical swipes
  // still scroll the page (touch-action: pan-y in theme.css): the browser then cancels
  // the pointer and the effect ends.
  var touchId = null, releaseTimer = 0;
  function track(e) {
    var r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (pointer.in) { pointer.vx = x - pointer.x; pointer.vy = y - pointer.y; }
    pointer.x = x; pointer.y = y; pointer.in = true;
    if (paused && s) scene.draw(s);
  }
  function release(delay) {
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(function () {
      pointer.in = false; pointer.reach = 26;
      if (paused && s) scene.draw(s);
    }, delay);
  }
  banner.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' || (e.target.closest && e.target.closest('a, button'))) return;
    clearTimeout(releaseTimer);
    touchId = e.pointerId;
    pointer.in = false; pointer.vx = pointer.vy = 0;
    pointer.reach = 48;                      // a fingertip is less precise than a cursor
    track(e);
  });
  banner.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'mouse') { pointer.reach = 26; track(e); }
    else if (e.pointerId === touchId) track(e);
  });
  banner.addEventListener('pointerup', function (e) {
    if (e.pointerId !== touchId) return;
    touchId = null;
    release(current === 'roofline' ? 3500 : 1400);   // long enough to see what the tap did
  });
  banner.addEventListener('pointercancel', function (e) {
    if (e.pointerId !== touchId) return;     // the page started scrolling
    touchId = null;
    release(150);
  });
  banner.addEventListener('pointerleave', function (e) {
    if (e.pointerType !== 'mouse') return;
    pointer.in = false;
    if (paused && s) scene.draw(s);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); else stop(); }).observe(canvas);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

  var lastW = 0, lastH = 0, rt = 0;
  function onResize() {
    var r = canvas.getBoundingClientRect();
    if (Math.abs(r.width - lastW) < 1 && Math.abs(r.height - lastH) < 1) return;
    lastW = r.width; lastH = r.height;
    clearTimeout(rt);
    rt = setTimeout(function () { stop(); if (build()) start(); }, s ? 150 : 0);
  }
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(canvas);
  else window.addEventListener('resize', onResize);

  function retheme() { readPalette(); if (s) { if (scene.redraw) scene.redraw(s); else scene.draw(s); } }
  new MutationObserver(retheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', retheme);

  readPalette();
  banner.classList.add('is-live');
  syncControls();
  build();
  start();
  // The text's width changes once the web font arrives
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { stop(); build(); start(); });

  // For the terminal's `hero` command
  window.durganshuHero = {
    names: NAMES.slice(),
    get: function () { return current; },
    set: function (name) { return setScene(name); },
    isPaused: function () { return paused; },
    setPaused: setPaused
  };
})();
