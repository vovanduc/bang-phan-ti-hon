/* Bảng phấn tí hon — NATURE: cầu vồng, vũng nước, hoa & bướm
 * Top-level: makeRainbow, puddleRain, updatePuddles, drawPuddles, puddleAt, cloverRain, Butterfly, updateButterflies + helper nat_*.
 * Chỉ khai báo — PIXI/layer chỉ đụng sau boot().
 */

const nat_RAINBOW_C = [0xff5a5a, 0xffa04a, 0xffe45c, 0x6fe07a, 0x5ac8ff, 0x7a86ff, 0xc07aff];
const nat_FLOWER_C = [0xff7fbf, 0xffe45c, 0xffffff, 0xc59bff, 0xff9a5a];

// ===== Cầu vồng: nắng + mưa cùng lúc → hiện; người đi lên như cây cầu =====
function makeRainbow() {
  const HW = 320, H = 190, R = (HW * HW + H * H) / (2 * H);   // cung tròn qua 2 chân cách nhau 2·HW, cao H → dốc chân ~62° < 71° leo được
  return {
    k: 0, on: false, hold: 0, solid: false, cx: 0, cy: GY + R - H, R, HW,
    g: put(new PIXI.Graphics(), rainbowLayer), redrawIn: 0,
    update(dt) {
      let rc = null;
      for (const c of clouds) if (c.rain > 0 && (!rc || Math.abs(c.x - sun.x) < Math.abs(rc.x - sun.x))) rc = c;
      if (sun.on > 0 && rc) {
        if (!this.on) {
          this.on = true;
          this.cx = clamp(rc.x, HW + 30, WW - HW - 30);
          sfx('rainbow', this.cx);
        }
        this.hold = 14;
      }
      if (this.on && (this.hold -= dt) <= 0) this.on = false;
      this.k = clamp(this.k + (this.on ? 0.7 : -0.5) * dt, 0, 1);
      const s = this.k > 0.6;                          // đủ rõ mới đi lên được
      if (s !== this.solid) { this.solid = s; maskDirty = true; }
    },
    arc(r, f) {                                        // gọi f(x, y) dọc cung bán kính r, phần trên mặt đất
      const a0 = Math.asin(clamp((this.cy - GY) / r, -1, 1));
      for (let a = Math.PI + a0; a <= 2 * Math.PI - a0 + 1e-6; a += 0.012)
        f(this.cx + r * Math.cos(a), this.cy + r * Math.sin(a));
    },
    stamp() {                                          // mặt đi = mép ngoài (dải đỏ)
      let px = null, py = null;
      this.arc(this.R - 3, (x, y) => { if (px !== null) stampSeg(px, py, x, y); px = x; py = y; });
    },
    render(dt) {
      const g = this.g;
      g.visible = this.k > 0;
      if (!g.visible || (this.redrawIn -= dt) > 0) return;
      this.redrawIn = 0.1;
      g.clear();
      nat_RAINBOW_C.forEach((c, i) => {
        let first = true;
        this.arc(this.R - 3 - i * 6, (x, y) => { if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x + J(0.3), y + J(0.3)); });
        g.stroke({ width: 6.5, color: c, alpha: 0.6 * this.k, cap: 'round' });
      });
      let first = true;
      this.arc(this.R + 1, (x, y) => { if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y); });
      g.stroke(chalk(2, 0.8 * this.k));
    },
  };
}

// ===== Vũng nước: giọt mưa chảy về chỗ trũng; nét chữ U thành hồ =====
// Từ điểm giọt chạm (hàng ngay trên mặt), trôi theo dốc xuống tới đáy. null = chảy khỏi mép nét.
function nat_flow(x, y) {
  x = Math.round(x); y = Math.round(y);
  for (let k = 0; k < 14 && solid(x, y); k++) y--;   // giọt dò mặt theo bước 3px → có thể lọt vào trong nét: đẩy lên đúng mặt
  if (y >= GY - 1) return [x, GY - 1];
  for (let n = 0; n < 1000; n++) {                    // đủ dài cho cả sườn cầu vồng (~320px)
    let best = 0, by = y, fell = false;
    for (const d of [-1, 1]) {
      const nx = x + d;
      if (nx < EDGE || nx > WW - EDGE || solid(nx, y)) continue;      // tường: nước không leo
      let ny = y, k = 0;
      while (k < 6 && !solid(nx, ny + 1)) { ny++; k++; }
      if (!solid(nx, ny + 1)) { fell = true; continue; }
      if (ny > by) { by = ny; best = d; }
    }
    if (!best) {
      if (fell) return null;
      best = nat_slope(x, y);                          // đoạn phẳng: dò xem phía nào dốc xuống (đỉnh vòm → chảy đi, đáy U → đọng)
      if (!best) return [x, y];
      by = y;
    }
    x += best; y = by;
  }
  return [x, y];
}

// đi ngang trên mặt phẳng tối đa 60px; trả hướng gặp dốc xuống / mép trước, 0 nếu hai phía đều dâng lên (đáy trũng)
function nat_slope(x, y) {
  const open = { '-1': true, '1': true };
  for (let k = 1; k <= 60; k++) {
    for (const d of [-1, 1]) {
      if (!open[d]) continue;
      const nx = x + d * k;
      if (nx < EDGE || nx > WW - EDGE || solid(nx, y)) { open[d] = false; continue; }   // thành / mép màn: chặn phía này
      if (!solid(nx, y + 1)) return d;                            // phía này thấp xuống
    }
  }
  return 0;
}

function puddleRain(x, y) {
  const s = nat_flow(x, y);
  if (!s) return;
  let p = null;
  for (const q of puddles) if (Math.abs(q.x - s[0]) < Math.max(30, q.hw + 8) && Math.abs(q.y - s[1]) < 10) { p = q; break; }
  if (!p) {
    if (puddles.length >= MAX_PUDDLES || Math.random() > 0.15) return;
    p = { x: s[0], y: s[1], vol: 0, dry: 0, hw: 0, level: s[1], xl: s[0], xr: s[0], bed: [], shapeIn: 0, rip: 0 };
    puddles.push(p);
  }
  p.vol = Math.min(400, p.vol + 1); p.dry = 0;
  if (Math.random() < 0.06) fx.push({ type: 'ripple', x: x, y: p.level, r0: 2, t: 0, life: 0.6 });   // gợn nước
}

// tính mặt nước + đáy: mực nước dâng theo thể tích, dừng ở tường (thành chữ U) hoặc mép nét
function nat_shape(p) {
  const lim = Math.min(10 + Math.sqrt(p.vol) * 4, 110);
  let level, wall = 0;
  const side = d => {
    let xx = p.x, last = p.x;
    for (let k = 0; k <= lim; k += 2) {
      xx = p.x + d * k;
      if (xx < EDGE || xx > WW - EDGE || solid(xx, level)) { wall++; break; }
      if (firstSolid(xx, level, level + 40) < 0) break;
      last = xx;
    }
    return last;
  };
  level = Math.round(p.y + 1 - Math.min(2 + Math.sqrt(p.vol) * 0.9, 22));   // hồ: có thành 2 bên thì dâng sâu
  p.xl = side(-1); p.xr = side(1);
  if (wall < 2) {                                      // mặt thoáng (đất phẳng, sườn): loang mỏng ≤ 4px
    wall = 0; level = Math.round(p.y + 1 - Math.min(1.5 + Math.sqrt(p.vol) * 0.15, 4));
    p.xl = side(-1); p.xr = side(1);
  }
  p.level = level; p.hw = (p.xr - p.xl) / 2;
  p.bed = [];
  for (let xx = p.xr; xx >= p.xl; xx -= 3) { const b = firstSolid(xx, level, level + 40); p.bed.push(xx, b < 0 ? level + 2 : b); }
}

function updatePuddles(dt) {
  for (let i = puddles.length - 1; i >= 0; i--) {
    const p = puddles[i];
    if ((p.dry += dt) > 3) p.vol -= 1.5 * dt;           // hết mưa ~3s thì khô dần
    if ((p.shapeIn -= dt) <= 0) { p.shapeIn = 0.25; nat_shape(p); }
    if (p.vol <= 0 || !solid(p.x, p.y + 1)) { puddles.splice(i, 1); continue; }   // khô hẳn / nét đỡ mờ mất
    for (const q of people) {                          // người lội: té nước; đang cháy thì tắt
      if (q.state !== 'walk' || q.x < p.xl || q.x > p.xr || q.y < p.level - 3 || q.y > p.y + 3) continue;
      if (q.burn > 0) q.douse();
      if ((q.splashCD = (q.splashCD || 0) - dt) <= 0 && !q.busy) {
        q.splashCD = rand(0.5, 1);
        for (let k = 0; k < 4; k++) fx.push({ type: 'drop', x: q.x, y: p.level, vx: rand(-80, 80), vy: -rand(120, 220), t: 0, life: 0.5 });
        sfx('splash', q.x);
      }
    }
  }
}

function drawPuddles() {
  const g = puddleG;
  g.clear();
  for (const p of puddles) {
    if (p.xr - p.xl < 4) continue;
    const a = clamp(p.vol / 20, 0.25, 1);
    g.moveTo(p.xl, p.level).lineTo(p.xr, p.level);
    for (let i = 0; i < p.bed.length; i += 2) g.lineTo(p.bed[i], p.bed[i + 1]);
    g.closePath().fill({ color: 0x9fe3ff, alpha: 0.5 * a });
    g.moveTo(p.xl, p.level).lineTo(p.xr, p.level).stroke(chalk(2, 0.75 * a));
  }
}

// vũng nước chứa điểm chân (x, y), hoặc gần nhất trong tầm range (|dx|) có nửa rộng ≥ minHW
function puddleAt(x, y, range = 0, minHW = 0) {
  let best = null, bd = 1e9;
  for (const p of puddles) {
    if (p.hw < minHW || Math.abs(p.y - y) > (range ? 120 : 4)) continue;
    const d = x < p.xl ? p.xl - x : x > p.xr ? x - p.xr : 0;
    if (d <= range && d < bd) { bd = d; best = p; }
  }
  return best;
}

// ===== Hoa: cỏ ba lá đã to hết cỡ mà còn được tưới → nở hoa =====
function cloverRain(c) {
  if (c.s < 1 || c.flower) return;
  if ((c.wet = (c.wet || 0) + 1) >= 5) { c.flower = pick(nat_FLOWER_C); c.age = Math.min(c.age, 40); sfx('bloom', c.x); }
}

// ===== Bướm: có hoa thì bay tới đậu; người tới ngửi hoa → hắt xì, bướm bay đi =====
class Butterfly {
  constructor() {
    const left = Math.random() < 0.5;
    this.x = left ? -20 : WW + 20; this.y = rand(380, 620);
    this.vx = 0; this.vy = 0; this.flap = rand(0, 6); this.face = left ? 1 : -1;
    this.color = pick([0xffe45c, 0xff9fd0, 0x9fe4ff, 0xc59bff]);
    this.state = 'fly'; this.flower = null; this.t = rand(1, 3); this.leaving = false; this.dead = false;
    this.g = put(new PIXI.Graphics(), skyLayer); this.redrawIn = 0;
  }
  pickFlower() {
    const fl = clovers.filter(c => c.flower && !butterflies.some(b => b !== this && b.flower === c));
    this.flower = fl.length ? pick(fl) : null;
    if (!this.flower) this.leaving = true;
  }
  startle() { if (this.state === 'rest') { this.state = 'fly'; this.vy = -90; this.t = rand(2, 4); this.flower = null; } }
  update(dt) {
    this.flap += (this.state === 'rest' ? 3 : 18) * dt;
    if (this.state === 'rest') {
      if (!this.flower || !this.flower.flower || !clovers.includes(this.flower) || (this.t -= dt) <= 0) { this.startle(); this.vy = -60; }
      return;
    }
    if (!this.leaving && (!this.flower || !clovers.includes(this.flower)) && (this.t -= dt) <= 0) this.pickFlower();
    let tx, ty;
    if (this.leaving) { tx = this.face > 0 ? WW + 60 : -60; ty = 300; }
    else if (this.flower) { tx = this.flower.x; ty = GY - 20 * this.flower.s - 4; }
    else { tx = this.x + this.face * 60; ty = 450 + Math.sin(this.flap * 0.1) * 60; }
    const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy) || 1;
    if (this.flower && d < 4) { this.state = 'rest'; this.x = tx; this.y = ty; this.vx = this.vy = 0; this.t = rand(3, 7); return; }
    const want = Math.min(70, d * 2), k = Math.min(1, 2 * dt);
    this.vx += ((dx / d) * want - this.vx) * k;
    this.vy += ((dy / d) * want - this.vy) * k + Math.sin(this.flap * 0.7) * 160 * dt;   // bay chập chờn
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (Math.abs(this.vx) > 6) this.face = Math.sign(this.vx);
    if (this.leaving && (this.x < -50 || this.x > WW + 50)) this.dead = true;
  }
  render(dt) {
    this.g.position.set(this.x, this.y); this.g.scale.set(this.face, 1);
    if ((this.redrawIn -= dt) > 0) return;
    this.redrawIn = 0.05;
    const g = this.g, w = 0.35 + 0.65 * Math.abs(Math.sin(this.flap));      // cánh khép/mở
    g.clear();
    g.ellipse(-4 * w, -4, 6 * w, 5).ellipse(4 * w, -4, 6 * w, 5).fill({ color: this.color, alpha: 0.95 });
    g.ellipse(-3 * w, 2, 4 * w, 3.5).ellipse(3 * w, 2, 4 * w, 3.5).fill({ color: this.color, alpha: 0.8 });
    g.moveTo(0, -7).lineTo(0, 5).stroke(chalk(1.6));
    g.moveTo(0, -7).lineTo(-3, -11).moveTo(0, -7).lineTo(3, -11).stroke(chalk(1));
  }
  destroy() { this.g.destroy(); }
}

let nat_bflyCD = 2;
function updateButterflies(dt) {
  const nf = clovers.reduce((n, c) => n + (c.flower ? 1 : 0), 0);
  if (butterflies.length < Math.min(MAX_BUTTERFLIES, Math.ceil(nf / 2)) && (nat_bflyCD -= dt) <= 0) { nat_bflyCD = rand(2, 5); butterflies.push(new Butterfly()); }
  for (const b of butterflies) b.update(dt);
  for (let i = butterflies.length - 1; i >= 0; i--) if (butterflies[i].dead) { butterflies[i].destroy(); butterflies.splice(i, 1); }
  // người đi ngang hoa: dừng ngửi 1,4s → hắt xì → bướm trên hoa đó bay đi
  for (const q of people) {
    if (q.sneezeT > 0) {
      if ((q.sneezeT -= dt) <= 0) {
        sfx('achoo', q.x, { pitch: 2 - q.s }); q.surpriseT = 0.6;
        if (q.state === 'walk') q.fly(-q.dir * 40, -160);
        for (const b of butterflies) if (Math.abs(b.x - q.x) < 40) b.startle();
      }
      continue;
    }
    if ((q.sniffCD = (q.sniffCD || 0) - dt) > 0 || q.state !== 'walk' || q.busy || q.panic || q.y < GY - 2) continue;
    for (const c of clovers) {
      if (!c.flower || Math.abs(c.x - q.x) > 2) continue;
      q.sniffCD = rand(8, 14);
      if (Math.random() < 0.35) { q.idleT = 1.4; q.sneezeT = 1.4; q.dir = Math.sign(c.x - q.x) || q.dir; }
      break;
    }
  }
}
