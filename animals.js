/* Bảng phấn tí hon — ANIMALS: cá sấu, khỉ, gấu (đồ vật từ bong bóng, như con bò)
 * Item gọi ANIMALS[type].init/update/draw/tap; mỗi con có it.mode + it.modeT.
 * Chỉ khai báo — chạy sau boot(). Top-level: ANIMALS + helper prefix ani_.
 */

// đi trên nét như con bò; trả false nếu đang bay/rơi
function ani_walk(it, dt, speed, up, bodyH) {
  if (!ani_ground(it, dt, bodyH)) return false;
  it.acc += speed * dt;
  while (it.acc >= 1) {
    it.acc -= 1;
    const r = walkStep(it, up, bodyH);
    if (r === 'wall') { it.dir *= -1; it.acc = 0; break; }
    if (r === 'fall') { it.air = true; it.vx = it.dir * speed * 0.8; it.vy = 0; break; }
  }
  return true;
}
// đứng yên: rơi nếu mất chỗ đứng; true = đang đứng trên mặt
function ani_ground(it, dt, bodyH) {
  if (it.air) {
    if (airStep(it, dt, G_I, VT_I, bodyH)) { it.air = false; it.vx = 0; it.landed = true; }
    return false;
  }
  if (!settle(it)) { it.air = true; it.vx = it.dir * 30; it.vy = 0; return false; }
  return true;
}
function ani_mode(it, m, t) { it.mode = m; it.modeT = t; }
function ani_face(it, x) { if (Math.abs(x - it.x) > 3) it.dir = Math.sign(x - it.x); }
// người đang cháy gần nhất trong tầm
function ani_burning(it, rx, ry) {
  let best = null, bd = rx;
  for (const p of people) {
    if (p.burn <= 0 || Math.abs(p.y - it.y) > ry) continue;
    const d = Math.abs(p.x - it.x);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}
// bụi dâu chín còn quả chưa ai lấy, gần nhất trong tầm
function ani_bush(it, range) {
  let best = null, bd = range;
  for (const s of seeds) {
    if (s.stage !== 4 || Math.abs(s.y - it.y) > 12 || !s.berries.some(b => b.taken == null)) continue;
    const d = Math.abs(s.x - it.x);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}
function ani_takeBerry(s) {
  const i = s.berries.findIndex(b => b.taken == null);
  if (i < 0) return false;
  s.berries.splice(i, 1);
  return true;
}
function ani_rot(pts, cx, cy, a) {        // xoay mảng [x,y,…] quanh (cx,cy)
  const c = Math.cos(a), s = Math.sin(a), o = [];
  for (let i = 0; i < pts.length; i += 2) {
    const dx = pts[i] - cx, dy = pts[i + 1] - cy;
    o.push(cx + dx * c - dy * s, cy + dx * s + dy * c);
  }
  return o;
}
function ani_hearts(x, y) {
  fx.push({ type: 'heart', x: x - 6, y, vy: -rand(30, 50), t: 0, life: 1.4 });
  fx.push({ type: 'heart', x: x + 6, y, vy: -rand(30, 50), t: -0.25, life: 1.4 });
}

const ANIMALS = {
  // ===== Cá sấu: chở người trên lưng, phun nước dập lửa, đớp hụt, chạm → lật ngửa cười =====
  croc: {
    init(it) {
      Object.assign(it, { mode: 'walk', modeT: 0, jaw: 0, rider: null, seatY: 22, seatW: 22, s: 1,
        midY: 13, hitW: 50, hitH: 26, snapCD: rand(4, 8), sprayCD: 0, target: null, flipY: false, swimCD: rand(2, 5), sink: 0, pool: null });
    },
    update(it, dt) {
      it.modeT -= dt; it.snapCD -= dt; it.sprayCD -= dt; it.swimCD -= dt;
      it.sink += ((it.mode === 'swim' ? 8 : 0) - it.sink) * Math.min(1, 4 * dt);   // bơi: chìm nửa thân
      if (it.mode === 'swim') {                       // bơi qua lại trong vũng nước
        const p = it.pool;
        if (!p || !puddles.includes(p) || p.hw < 18 || it.modeT <= 0) { it.pool = null; it.swimCD = rand(12, 20); ani_mode(it, 'walk', 0); return; }
        if ((it.x <= p.xl + 12 && it.dir < 0) || (it.x >= p.xr - 12 && it.dir > 0)) it.dir *= -1;
        if (Math.random() < 3 * dt) fx.push({ type: 'ripple', x: it.x - it.dir * 30, y: p.level, r0: 3, t: 0, life: 0.8 });
        const b = ani_burning(it, 240, 120);
        if (b && it.sprayCD <= 0) { it.target = b; ani_face(it, b.x); ani_mode(it, 'spray', 0.9); sfx('spray', it.x); return; }
        ani_walk(it, dt, 22, 4, 20); return;
      }
      if (it.mode === 'laugh') {
        it.jaw = 0.6 + 0.3 * Math.sin(it.anim * 18);
        if (it.modeT <= 0) { it.flipY = false; ani_mode(it, 'walk', 0); }
        ani_ground(it, dt, 20); return;
      }
      if (it.mode === 'spray') {
        const p = it.target;
        it.jaw = 1;
        if (p && p.burn > 0) {
          ani_face(it, p.x);
          if (Math.random() < 40 * dt) {                 // vòi nước: hạt bay vòng cung tới người
            const mx = it.x + it.dir * 46, my = it.y - 14, T = 0.45;
            const tx = p.x + rand(-6, 6), ty = p.y - rand(25, 55) * p.s;
            fx.push({ type: 'drop', x: mx, y: my, vx: (tx - mx) / T, vy: (ty - my - 0.5 * 300 * T * T) / T, t: 0, life: T + 0.1 });
          }
          if (it.modeT < 0.45 && Math.abs(p.x - it.x) < 280) { p.douse(); it.target = null; }
        }
        if (it.modeT <= 0) { ani_mode(it, 'walk', 0); it.sprayCD = 1; }
        ani_ground(it, dt, 20); return;
      }
      if (it.mode === 'snap') {
        it.jaw = Math.abs(Math.sin((0.8 - it.modeT) * Math.PI * 2.5));
        if (it.modeT <= 0) { ani_mode(it, 'walk', 0); it.jaw = 0; }
        ani_ground(it, dt, 20); return;
      }
      it.jaw = Math.max(0, it.jaw - 3 * dt);
      if (it.sprayCD <= 0 && !it.air) {
        const p = ani_burning(it, 240, 120);
        if (p) { it.target = p; ani_face(it, p.x); ani_mode(it, 'spray', 0.9); sfx('spray', it.x); return; }
      }
      if (it.snapCD <= 0 && !it.air) {                    // đớp hụt: người trước mũi nhảy tránh, không ai bị đau
        it.snapCD = rand(6, 10); ani_mode(it, 'snap', 0.8); sfx('chomp', it.x);
        for (const p of people) {
          const ahead = (p.x - it.x) * it.dir;
          if (p.state === 'walk' && ahead > 30 && ahead < 90 && Math.abs(p.y - it.y) < 20) { p.surpriseT = 1; p.fly(it.dir * rand(90, 140), -rand(260, 320)); }
        }
        return;
      }
      if (it.swimCD <= 0 && !it.air) {                // thấy vũng nước rộng → bò tới bơi
        const p = puddleAt(it.x, it.y, 420, 25);
        if (p) {
          if (it.x > p.xl + 10 && it.x < p.xr - 10) { it.pool = p; ani_mode(it, 'swim', rand(7, 11)); sfx('splash', it.x); return; }
          ani_face(it, p.x);
        } else it.swimCD = 3;
      }
      ani_walk(it, dt, 38, 4, 20);
    },
    tap(it) {
      if (it.air) return;
      ani_mode(it, 'laugh', 2); it.flipY = true; sfx('giggle', it.x);
    },
    draw(g, it) {
      const a = it.anim || 0, walking = it.mode === 'walk' && !it.air;
      for (const lx of [-28, -14, 12, 24]) {
        const dx = walking ? Math.sin(a * 10 + lx) * 4 : 0;
        g.moveTo(lx, -8).lineTo(lx + dx, 0);
      }
      g.stroke(chalk(3));
      g.poly([-34, -17, -68 + J(), -9, -34, -6], true).fill(0x5fbf5a).stroke(chalk(2.2));      // đuôi
      g.ellipse(-4, -12, 34, 10).fill(0x7ad46a).stroke(chalk(2.4));                           // thân
      g.ellipse(-4, -7, 26, 4).fill({ color: 0xc9f29a, alpha: 0.8 });                         // bụng
      for (let x = -28; x <= 16; x += 9) g.moveTo(x - 3, -20).lineTo(x, -25 + J(0.5)).lineTo(x + 3, -20);
      g.stroke(chalk(1.8));
      const jaw = it.jaw || 0;
      const up = ani_rot([24, -18, 58, -15, 58, -10, 24, -10], 24, -12, -0.55 * jaw);
      const lo = ani_rot([24, -10, 56, -9, 54, -4, 24, -4], 24, -9, 0.22 * jaw);
      g.poly(lo, true).fill(0x7ad46a).stroke(chalk(2));
      if (jaw > 0.1) {                                   // răng
        const t = ani_rot([30, -10, 33, -7, 36, -10, 39, -7, 42, -10, 45, -7, 48, -10], 24, -12, -0.55 * jaw);
        g.poly(t, false).stroke(chalk(1.4));
      }
      g.poly(up, true).fill(0x7ad46a).stroke(chalk(2.2));
      const e = ani_rot([29, -21], 24, -12, -0.55 * jaw);
      g.circle(e[0], e[1], 4.3).fill(CH).stroke(chalk(1.6));
      if (it.mode === 'laugh') g.moveTo(e[0] - 2.5, e[1] + 0.5).quadraticCurveTo(e[0], e[1] - 2.5, e[0] + 2.5, e[1] + 0.5).stroke({ width: 1.5, color: 0x1f4f52 });
      else g.circle(e[0] + 1.4, e[1], 1.8).fill(0x1f4f52);
    },
  },

  // ===== Khỉ: hái dâu ném cho người, leo thang phóng lên đụng sao, chạm → nhào lộn =====
  monkey: {
    init(it) {
      Object.assign(it, { mode: 'walk', modeT: 0, midY: 22, hitW: 24, hitH: 50, pickCD: rand(1, 3), hopCD: rand(1, 3),
        ladder: null, seenL: null, spin: 0, bush: null });
    },
    update(it, dt) {
      it.modeT -= dt; it.pickCD -= dt; it.hopCD -= dt;
      if (it.mode === 'climb') {
        const L = it.ladder;
        if (!L || L.state !== 'live') { it.air = true; it.vx = 0; it.vy = 0; ani_mode(it, 'walk', 0); return; }
        it.x = L.x; it.y -= 150 * dt;
        if (it.y <= L.y - L.h + 4) {                     // tới đỉnh: phóng lên trời
          it.air = true; it.vx = it.dir * rand(80, 140); it.vy = -rand(620, 720); ani_mode(it, 'leap', 0); sfx('ook', it.x);
        }
        return;
      }
      if (it.mode === 'leap' || it.mode === 'flip') {
        if (it.mode === 'flip') it.rot = -it.dir * Math.PI * 2 * clamp(1 - it.modeT / 0.8, 0, 1);
        for (const s of stars)
          if (s.k > 0.8 && Math.abs(s.x - it.x) < 26 && Math.abs(s.y - (it.y - 30)) < 30) { burst(s.x, s.y, s.color, s); break; }
        if (ani_ground(it, dt, 30) || it.landed) { it.landed = false; it.rot = 0; if (!it.air) ani_mode(it, 'walk', 0); }
        return;
      }
      if (it.mode === 'pick') {
        if (it.modeT <= 0) {
          const s = it.bush;
          if (s && s.stage === 4 && ani_takeBerry(s)) {   // ném quả dâu về phía người gần nhất
            let tgt = null, bd = 400;
            for (const p of people) { const d = Math.abs(p.x - it.x); if (p.state === 'walk' && d > 40 && d < bd) { bd = d; tgt = p; } }
            const b = new Item('berry', it.x, it.y - 40);
            b.vx = tgt ? clamp((tgt.x - it.x) / 0.9, -260, 260) : it.dir * rand(80, 160); b.vy = -rand(420, 520);
            items.push(b); trimItems(); sfx('ook', it.x); sfx('hop', it.x);
          }
          it.pickCD = rand(4, 7); it.bush = null; ani_mode(it, 'walk', 0);
        }
        ani_ground(it, dt, 30); return;
      }
      // walk
      if (!it.air) {
        for (const L of items) {
          if (L.type === 'ladder' && L.state === 'live' && L !== it.seenL && Math.abs(L.x - it.x) < 3 && Math.abs(L.y - it.y) < 10) {
            it.seenL = L; it.ladder = L; ani_mode(it, 'climb', 0); return;
          }
        }
        if (it.pickCD <= 0) {
          const s = it.bush || (it.bush = ani_bush(it, 320));
          if (s) {
            ani_face(it, s.x);
            if (Math.abs(s.x - it.x) < 4) { ani_mode(it, 'pick', 0.8); return; }
          } else it.pickCD = 2;
        }
        if (it.hopCD <= 0) { it.hopCD = rand(1.5, 3); it.air = true; it.vx = it.dir * 120; it.vy = -rand(220, 320); }
      }
      ani_walk(it, dt, 85, 5, 30); it.landed = false;
    },
    tap(it) {
      if (it.mode === 'climb') return;
      it.air = true; it.vx = 0; it.vy = -420; ani_mode(it, 'flip', 0.8); sfx('ook', it.x);
    },
    draw(g, it) {
      const a = it.anim || 0, m = it.mode, walking = m === 'walk' && !it.air;
      const sw = walking ? Math.sin(a * 14) * 5 : 0;
      g.moveTo(-3, -14).lineTo(-3 + sw, 0); g.moveTo(3, -14).lineTo(3 - sw, 0);
      g.moveTo(-7, -16).bezierCurveTo(-22, -14, -24, -34, -15, -34 + J(0.6));                 // đuôi cong
      const armsUp = m === 'climb' || m === 'pick' || m === 'leap' || m === 'flip' || it.air;
      if (armsUp) { const w = Math.sin(a * 12) * 3; g.moveTo(-5, -26).lineTo(-9, -40 + w); g.moveTo(5, -26).lineTo(10, -40 - w); }
      else { g.moveTo(-5, -26).lineTo(-8 - sw * 0.5, -13); g.moveTo(5, -26).lineTo(8 + sw * 0.5, -13); }
      g.stroke({ width: 2.6, color: 0xc0814a, cap: 'round', join: 'round' });
      g.ellipse(0, -21, 8, 9).fill(0xc0814a).stroke(chalk(2));                                // thân
      g.circle(-7, -39, 3.8).fill(0xf6d2a8).stroke(chalk(1.6));                                // tai
      g.circle(1, -36, 9).fill(0xc0814a).stroke(chalk(2.2));                                   // đầu
      g.ellipse(4.5, -34, 5.8, 5.5).fill(0xf6d2a8);                                            // mặt
      g.circle(3, -36.5, 1.4).circle(7, -36.5, 1.4).fill(0x1f4f52);
      g.moveTo(3, -31.5).quadraticCurveTo(5, -29.5, 7.5, -31.5).stroke({ width: 1.3, color: 0x1f4f52 });
    },
  },

  // ===== Gấu: chở tháp người trên đầu, ăn dâu rồi ngủ (bụng thành bàn nhún), dậm tắt lửa, chạm → ôm =====
  bear: {
    init(it) {
      Object.assign(it, { mode: 'walk', modeT: 0, rider: null, seatY: 62, seatW: 9, s: 1, midY: 30, hitW: 24, hitH: 62,
        eatCD: rand(2, 5), ate: 0, bush: null, target: null, zT: 0 });
    },
    update(it, dt) {
      it.modeT -= dt; it.eatCD -= dt;
      if (it.mode === 'sleep') {
        if (it.modeT > 100 && !night.dark) it.modeT = rand(0.5, 2);    // ngủ đêm: trời sáng thì dậy
        if ((it.zT -= dt) <= 0) { it.zT = 0.9; fx.push({ type: 'zz', x: it.x + it.dir * 26, y: it.y - 30, vy: -28, t: 0, life: 1.6 }); }
        if (it.modeT <= 0) { ani_mode(it, 'walk', 0); sfx('grunt', it.x); }
        ani_ground(it, dt, 40); return;
      }
      if (it.mode === 'eat') {
        if (it.modeT <= 0) {
          const s = it.bush;
          if (s && s.stage === 4 && ani_takeBerry(s)) { it.ate++; ani_hearts(it.x + it.dir * 10, it.y - 70); sfx('eat', it.x); it.modeT = 0.8; }
          else {
            it.bush = null; it.eatCD = rand(20, 30);
            if (it.ate > 0) { it.ate = 0; ani_mode(it, 'sleep', 7); sfx('grunt', it.x); } else ani_mode(it, 'walk', 0);
          }
        }
        ani_ground(it, dt, 40); return;
      }
      if (it.mode === 'stomp') {                         // nhảy lên rồi dậm xuống cạnh người đang cháy
        if (ani_ground(it, dt, 40) || it.landed) {
          it.landed = false;
          if (!it.air) {
            sfx('thud', it.x);
            fx.push({ type: 'pop', x: it.x, y: it.y - 4, r0: 6, t: 0, life: 0.4 });
            const p = it.target;
            if (p && p.burn > 0 && Math.abs(p.x - it.x) < 70) p.douse();
            it.target = null; ani_mode(it, 'walk', 0);
          }
        }
        return;
      }
      if (it.mode === 'hug') { if (it.modeT <= 0) ani_mode(it, 'walk', 0); ani_ground(it, dt, 40); return; }
      // walk: ưu tiên chạy tới người đang cháy, rồi tới bụi dâu; đêm thì đi ngủ
      if (!it.air && night.dark && it.mode === 'walk' && !ani_burning(it, 320, 80)) { ani_mode(it, 'sleep', 999); sfx('grunt', it.x); return; }
      if (!it.air) {
        const p = ani_burning(it, 320, 80);
        if (p) {
          ani_face(it, p.x);
          if (Math.abs(p.x - it.x) < 40) { it.target = p; it.air = true; it.vx = 0; it.vy = -300; ani_mode(it, 'stomp', 0); return; }
          ani_walk(it, dt, 70, 4, 40); return;
        }
        if (it.eatCD <= 0) {
          const s = it.bush || (it.bush = ani_bush(it, 300));
          if (s) {
            ani_face(it, s.x);
            if (Math.abs(s.x - it.x) < 6) { ani_mode(it, 'eat', 0.3); return; }
          } else it.eatCD = 3;
        }
      }
      ani_walk(it, dt, 22, 4, 40);
    },
    tap(it) {
      if (it.air || it.mode === 'stomp') return;
      if (it.mode === 'sleep') { ani_mode(it, 'walk', 0); sfx('grunt', it.x); return; }   // chạm gấu ngủ → thức dậy
      let best = null, bd = 100;
      for (const p of people) { const d = Math.abs(p.x - it.x); if (p.state === 'walk' && Math.abs(p.y - it.y) < 20 && d < bd) { bd = d; best = p; } }
      ani_mode(it, 'hug', 1.4); sfx('grunt', it.x);
      ani_hearts(it.x, it.y - 80);
      if (best) { ani_face(it, best.x); best.dir = Math.sign(it.x - best.x) || 1; best.idleT = 1.4; ani_hearts(best.x, best.y - 70 * best.s); }
    },
    draw(g, it) {
      const a = it.anim || 0, m = it.mode;
      if (m === 'sleep') {                               // nằm ngủ, bụng tròn
        g.ellipse(-2, -15, 30, 15).fill(0x9a6644).stroke(chalk(2.4));
        g.ellipse(-2, -18, 18, 9).fill({ color: 0xe8c39e, alpha: 0.85 });
        g.circle(28, -14, 12).fill(0x9a6644).stroke(chalk(2.2));
        g.circle(24, -25, 4.5).fill(0x9a6644).stroke(chalk(1.6));
        g.ellipse(37, -11, 5.5, 4).fill(0xe8c39e);
        g.moveTo(28, -17).lineTo(33, -17).stroke({ width: 1.6, color: 0x1f4f52 });
        return;
      }
      const walking = m === 'walk' && !it.air, sw = walking ? Math.sin(a * 8) * 4 : 0;
      g.roundRect(-14 + sw, -14, 10, 14, 4).roundRect(4 - sw, -14, 10, 14, 4).fill(0x9a6644).stroke(chalk(2));
      g.ellipse(0, -28, 19, 18).fill(0x9a6644).stroke(chalk(2.4));                            // thân
      g.ellipse(2, -26, 11, 11).fill({ color: 0xe8c39e, alpha: 0.85 });                       // bụng
      if (m === 'hug' || m === 'stomp') { g.moveTo(-12, -36).lineTo(-20, -52); g.moveTo(12, -36).lineTo(22, -52); }
      else { g.moveTo(-14, -36).lineTo(-17 - sw * 0.4, -22); g.moveTo(14, -36).lineTo(17 + sw * 0.4, -22); }
      g.stroke({ width: 5, color: 0x9a6644, cap: 'round' });
      g.circle(-4, -60, 5).circle(13, -60, 5).fill(0x9a6644).stroke(chalk(1.6));             // tai
      g.circle(5, -50, 12.5).fill(0x9a6644).stroke(chalk(2.2));                                // đầu
      g.ellipse(13, -46, 6, 4.5).fill(0xe8c39e);
      g.circle(17.5, -47.5, 1.8).circle(10, -53, 1.6).fill(0x1f4f52);
    },
  },
};
