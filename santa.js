/* Bảng phấn tí hon — SANTA: ông già Noel ngồi xe trượt, 4 tuần lộc kéo (Rudolph mũi đỏ dẫn đầu), kéo theo 5–10 toa quà.
 * Bay ngang dưới tầm mây; mỗi toa thả 3–5 hộp quà bọc bong bóng (đồ vật ngẫu nhiên như bong bóng thường), mỗi đợt có ít nhất 1 dàn pháo bông.
 * Pháo bông (Item 'firework'): bé chạm, hoặc người/thú đụng → châm ngòi → bắn 95–110 quả + màn kết, nổ dưới tầm mây.
 * Ngày: nét phấn màu + khói; đêm: tia có quầng sáng, chớp sáng, kim tuyến lấp lánh, đánh thức người đang ngủ.
 * Người đứng gần: ~55% đứng ngắm (quay mặt về pháo, giơ tay "ồ"), còn lại sợ ồn chạy tán loạn (Person.scareT).
 * Top-level: makeSanta, santaTap, fwInit, fwUpdate, fwLight, fwDraw + helper/hằng số sta_*, fw_*. Chỉ khai báo — PIXI/layer chỉ đụng sau boot().
 */

const sta_FIRST = [100, 130], sta_EVERY = [240, 360], sta_SPEED = 110, sta_MAX_CRATES = 70, sta_EXTRA = 3;
const sta_DEER = 44, sta_SLEIGH = 4 * 44 + 44, sta_CAR0 = sta_SLEIGH + 92, sta_CAR = 72;   // khoảng cách dọc đoàn tính từ con tuần lộc đầu
const sta_WRAP = [0xff3aa6, 0x3346ff, 0x3de89b, 0xffe15a, 0xa35bff, 0xff6f91, 0x35e0ee];   // giấy gói quà
const fw_COLORS = [0xff3aa6, 0xffe15a, 0x35e0ee, 0xc8f25a, 0xa35bff, 0xff6f91, 0xffffff, 0xff9a2e];
const fw_SHAPES = ['peony', 'peony', 'ring', 'heart', 'star', 'smile', 'willow', 'crossette', 'double'];
const fw_G = 420, fw_MAXP = 2600;
const fw_parts = [], fw_rockets = [], fw_smoke = [];

function makeSanta() {
  const root = put(new PIXI.Container(), skyLayer);
  return {
    on: false, x: 0, y: 260, dir: 1, t: 0, next: rand(...sta_FIRST), cars: [], extra: 0, hoT: 0, flash: 0,
    root, deer: [], sleigh: null, carG: [], redrawIn: 0, nose: null, lamp: null,
    fwG: put(new PIXI.Graphics(), skyLayer), flashes: [],
    parts: fw_parts, rockets: fw_rockets,
    fly() {
      this.on = true; this.t = 0; this.dir = Math.random() < 0.5 ? 1 : -1;
      this.x = this.dir > 0 ? -60 : WW + 60; this.y = rand(250, 285);   // mây ở y ≤ ~222 → đoàn luôn thấp hơn mây
      const n = 5 + ((Math.random() * 6) | 0);
      this.cars = [];
      for (let i = 0; i < n; i++) {
        const k = 3 + ((Math.random() * 3) | 0);
        const gifts = Array.from({ length: k }, () => pick(ITEM_TYPES));
        const xs = Array.from({ length: k }, () => rand(100, WW - 100)).sort((a, b) => (a - b) * this.dir);
        this.cars.push({ gifts, xs, wrap: pick(sta_WRAP), body: pick([0x3de89b, 0xff4b5c, 0x3346ff, 0xffe15a]) });
      }
      const nf = 1 + (Math.random() < 0.4 ? 1 : 0);                      // ít nhất 1 dàn pháo bông mỗi đợt
      for (let i = 0; i < nf; i++) { const c = pick(this.cars); c.gifts[(Math.random() * c.gifts.length) | 0] = 'firework'; }
      this.extra = sta_EXTRA; this.hoT = 0.8;
      this.deer = Array.from({ length: 4 }, () => put(new PIXI.Graphics(), root));
      this.sleigh = put(new PIXI.Graphics(), root);
      this.carG = this.cars.map(() => put(new PIXI.Graphics(), root));
    },
    end() {
      this.on = false; this.next = rand(...sta_EVERY);
      root.removeChildren().forEach(c => c.destroy());
      this.deer = []; this.sleigh = null; this.carG = [];
      if (this.nose) this.nose.visible = false;
      if (this.lamp) this.lamp.visible = false;
    },
    at(off) {                                           // vị trí 1 phần tử cách đầu đoàn `off` px; cả đoàn lượn sóng nối đuôi
      return [this.x - this.dir * off, this.y + Math.sin(this.t * 2.2 - off * 0.012) * 9];
    },
    hit(x, y) {
      if (!this.on) return null;
      for (let i = 0; i < this.cars.length; i++) { const [cx, cy] = this.at(sta_CAR0 + i * sta_CAR); if (Math.abs(x - cx) < 34 && Math.abs(y - cy + 12) < 30) return { car: i }; }
      const [sx, sy] = this.at(sta_SLEIGH);
      if (Math.abs(x - sx) < 50 && Math.abs(y - sy + 18) < 40) return { sleigh: true };
      const [dx, dy] = this.at(sta_DEER * 1.5);
      if (Math.abs(x - dx) < 100 && Math.abs(y - dy) < 30) return { deer: true };
      return null;
    },
    tap(h) {
      if (h.car !== undefined) { const c = this.cars[h.car]; if (c.gifts.length) { c.xs.shift(); this.drop(h.car, c.gifts.shift()); } sfx('jingle', this.x); }
      else if (h.sleigh) { sfx('hoho', this.x); if (this.extra > 0) { this.extra--; const [sx, sy] = this.at(sta_SLEIGH); this.dropAt(sx, sy, pick(ITEM_TYPES), pick(sta_WRAP)); } }
      else { this.flash = 1; sfx('jingle', this.x); }   // chạm tuần lộc: mũi Rudolph lóe sáng
    },
    drop(i, gift) { const [cx, cy] = this.at(sta_CAR0 + i * sta_CAR); this.dropAt(cx, cy, gift, this.cars[i].wrap); },
    dropAt(x, y, gift, wrap) {
      if (crates.length >= sta_MAX_CRATES) return;
      if (x < EDGE || x > WW - EDGE) return;
      crates.push(new Crate(x, y + 16, this.dir * 0.4, gift, wrap));
    },
    update(dt) {
      fw_update(dt);
      if (!this.on) {
        if ((this.next -= dt) <= 0) { if (plane.on) this.next = 10; else this.fly(); }   // không bay chồng máy bay
        return;
      }
      this.t += dt; this.flash = Math.max(0, this.flash - dt);
      this.x += this.dir * sta_SPEED * dt;
      const vis = this.x > -40 && this.x < WW + 40;
      if (vis) sfx('jingle', this.x);
      if (vis && (this.hoT -= dt) <= 0) { this.hoT = rand(6, 9); sfx('hoho', this.at(sta_SLEIGH)[0]); }
      this.cars.forEach((c, i) => {
        const [cx] = this.at(sta_CAR0 + i * sta_CAR);
        while (c.xs.length && (cx - c.xs[0]) * this.dir >= 0) { c.xs.shift(); this.drop(i, c.gifts.shift()); }
      });
      const [sx, sy] = this.at(sta_SLEIGH);                 // bụi phép lấp lánh sau xe trượt
      if (Math.random() < 22 * dt)
        fx.push({ type: 'spark', x: sx - this.dir * 40, y: sy + rand(-6, 10), vx: -this.dir * rand(10, 40), vy: rand(10, 40), r: rand(2, 4), rot: rand(0, 6), shape: 'star', c: pick([0xffe45c, 0xffffff, 0x9fe4ff]), t: 0, life: rand(0.8, 1.4) });
      const tail = this.x - this.dir * (sta_CAR0 + this.cars.length * sta_CAR + 60);
      if ((this.dir > 0 && tail > WW + 40) || (this.dir < 0 && tail < -40)) this.end();
    },
    render(dt) {
      fw_render(this, dt);
      if (!this.on) return;
      const redraw = (this.redrawIn -= dt) <= 0;
      if (redraw) this.redrawIn = 0.07;
      const place = (g, off, bob) => { const [x, y] = this.at(off); g.position.set(x, y + (bob || 0)); g.scale.set(this.dir, 1); return [x, y]; };
      this.deer.forEach((g, i) => { place(g, i * sta_DEER, Math.sin(this.t * 9 + i) * 2); if (redraw) sta_deer(g, this.t + i * 0.37, i === 0, i === 0 ? this.flash : 0); });
      const [sx, sy] = place(this.sleigh, sta_SLEIGH);
      if (redraw) sta_sleigh(this.sleigh, this.t, this.at(sta_DEER * 3), [sx, sy], this.dir);
      this.carG.forEach((g, i) => { place(g, sta_CAR0 + i * sta_CAR); if (redraw) sta_car(g, this.cars[i], this.t + i); });
      const k = night ? night.k : 0;                        // đêm: mũi Rudolph + đèn xe trượt phát sáng
      this.nose = this.nose || glow(0xff3030); this.lamp = this.lamp || glow(0xffe08a);
      const [nx, ny] = this.at(0);
      this.nose.visible = true; this.nose.position.set(nx + this.dir * 30, ny - 16); this.nose.scale.set(0.35 + 0.5 * this.flash + 0.05 * Math.sin(this.t * 8)); this.nose.alpha = Math.min(1, 0.15 + k * 0.85 + this.flash);
      this.lamp.visible = k > 0.05; this.lamp.position.set(sx + this.dir * 40, sy - 30); this.lamp.scale.set(0.5); this.lamp.alpha = 0.7 * k;
    },
  };
}

// ---- vẽ đoàn xe (local, mặt hướng +x, chân/đáy ~ y 0) ----
function sta_deer(g, t, lead, flash) {
  g.clear();
  const run = Math.sin(t * 9);
  for (const [lx, ph] of [[-12, 0], [-6, Math.PI], [9, Math.PI * 0.5], [15, Math.PI * 1.5]])   // chân phi nước đại
    g.moveTo(lx, -6).lineTo(lx + Math.sin(t * 9 + ph) * 7, 8);
  g.moveTo(-17, -10).lineTo(-23, -15 + run * 2);                  // đuôi
  g.stroke(chalk(2));
  g.ellipse(0, -8, 18, 8).fill(0xb07a4f).stroke(chalk(2.2));      // thân
  g.moveTo(12, -12).lineTo(19, -20).stroke(chalk(5, 1)); g.moveTo(12, -12).lineTo(19, -20).stroke({ width: 3.2, color: 0xb07a4f, cap: 'round' });   // cổ
  g.ellipse(23, -22, 8, 6).fill(0xb07a4f).stroke(chalk(2));       // đầu
  g.moveTo(19, -27).lineTo(15, -38).lineTo(10, -42).moveTo(15, -38).lineTo(19, -44)   // gạc
    .moveTo(23, -27).lineTo(25, -39).lineTo(21, -44).moveTo(25, -39).lineTo(30, -42).stroke(chalk(1.8));
  g.circle(25, -24, 1.5).fill(0x1f4f52);                          // mắt
  g.circle(31, -21, lead ? 3.6 + flash * 2 : 2.4).fill(lead ? 0xff3030 : 0x5a3a2a);   // mũi (Rudolph đỏ)
  g.moveTo(-14, -14).lineTo(14, -14).stroke({ width: 2.6, color: 0xd62b3a, cap: 'round' });   // dây cương đỏ
  for (const bx of [-8, 0, 8]) g.circle(bx, -13, 2.2).fill(0xffe15a);   // chuông
  g.moveTo(-18, -12).lineTo(-26, -12).stroke(chalk(1.4, 0.8));    // dây nối ra sau
}

function sta_sleigh(g, t, deerAt, me, dir) {
  g.clear();
  const rx = (deerAt[0] - me[0]) * dir, ry = deerAt[1] - me[1];   // dây cương tới con tuần lộc cuối
  g.moveTo(34, -18).lineTo(rx - 18, ry - 12).stroke(chalk(1.4, 0.85));
  g.moveTo(-42, 4).lineTo(30, 4).quadraticCurveTo(46, 4, 44, -10).stroke(chalk(2.6));   // càng trượt cong
  g.moveTo(-28, 4).lineTo(-26, -4).moveTo(18, 4).lineTo(16, -4).stroke(chalk(2));
  g.moveTo(-40, -30).quadraticCurveTo(-44, -2, -30, -4).lineTo(26, -4).quadraticCurveTo(38, -10, 34, -24).lineTo(-6, -24).lineTo(-12, -34).closePath()
    .fill(0xd62b3a).stroke(chalk(2.4));                            // thân xe đỏ
  g.moveTo(-36, -12).lineTo(28, -12).stroke({ width: 2.4, color: 0xffe15a, cap: 'round' });   // viền vàng
  g.ellipse(-28, -40, 14, 12).fill(0x8a5a3c).stroke(chalk(2));     // bao quà
  g.rect(-36, -52, 9, 8).fill(0x3de89b).rect(-26, -54, 8, 8).fill(0xff3aa6).stroke(chalk(1.2));
  const wave = Math.sin(t * 6) * 0.6;                              // ông vẫy tay
  g.circle(4, -36, 13).fill(0xd62b3a).stroke(chalk(2.2));          // áo
  g.moveTo(12, -40).lineTo(22 + Math.cos(wave) * 6, -56 + Math.sin(wave) * 4).stroke({ width: 5, color: 0xd62b3a, cap: 'round' });
  g.circle(23 + Math.cos(wave) * 6, -57 + Math.sin(wave) * 4, 3.2).fill(CH);   // găng tay
  g.circle(6, -54, 9).fill(0xffd2b0).stroke(chalk(1.8));           // mặt
  g.circle(2, -46, 6).circle(8, -45, 6).circle(13, -49, 5).circle(-1, -50, 4).fill(CH);   // râu trắng
  g.circle(9, -56, 1.4).fill(0x1f4f52);                            // mắt
  g.circle(13, -53, 2).fill(0xff8f8f);                             // mũi hồng
  g.moveTo(-3, -58).lineTo(15, -60).lineTo(-10, -74 + Math.sin(t * 3) * 2).closePath().fill(0xd62b3a).stroke(chalk(1.8));   // mũ
  g.moveTo(-4, -58).lineTo(16, -60).stroke({ width: 4, color: CH, cap: 'round' });
  g.circle(-11, -74 + Math.sin(t * 3) * 2, 3.4).fill(CH);
}

function sta_car(g, c, t) {
  g.clear();
  g.moveTo(40, -10).lineTo(52, -12).stroke(chalk(1.4, 0.8));       // dây nối toa trước
  g.moveTo(-26, 4).lineTo(24, 4).quadraticCurveTo(34, 4, 32, -6).stroke(chalk(2.2));   // càng trượt
  g.roundRect(-24, -14, 46, 14, 4).fill(c.body).stroke(chalk(2.2));
  const n = c.gifts.length;                                        // hộp quà còn lại chất trên toa
  for (let i = 0; i < n; i++) {
    const bx = -18 + (i % 3) * 13 + (i >= 3 ? 6 : 0), by = i >= 3 ? -36 : -24;
    g.rect(bx - 5, by - 5, 11, 11).fill(sta_WRAP[(i + (c.wrap & 7)) % sta_WRAP.length]).stroke(chalk(1.3));
    g.moveTo(bx + 0.5, by - 5).lineTo(bx + 0.5, by + 6).stroke({ width: 1.6, color: 0xffe15a });
  }
}

// ---- pháo bông: Item 'firework' (things.js gọi fwInit/fwUpdate/fwDraw, Item.tap → fwLight) ----
function fwInit(it) { Object.assign(it, { mode: 'idle', modeT: 0, shots: 0, shotT: 0, hitW: 22, hitH: 40, midY: 0, fwId: Math.random() }); }

function fwLight(it) {
  if (it.mode === 'idle') { it.mode = 'fuse'; it.modeT = 1.3; sfx('fuse', it.x); fw_react(it, false); }
  else if (it.mode === 'fire') fw_launch(it);                       // đang bắn mà chạm thêm → bắn thêm quả nữa
}

function fwUpdate(it, dt) {
  if (!settle(it)) { it.state = 'fall'; it.vy = 0; return; }
  if (it.mode === 'idle') {
    for (const p of people)
      if (p.state !== 'climb' && Math.abs(p.x - it.x) < 16 && p.y > it.y - 30 && p.y < it.y + 6) { p.surpriseT = 1; fwLight(it); return; }
    for (const q of items)
      if (q !== it && (q.type === 'cow' || (q.hitW && q.type !== 'firework')) && q.state === 'live' && Math.abs(q.x - it.x) < 24 && Math.abs(q.y - it.y) < 20) { fwLight(it); return; }
    if (it.age > 40) fwLight(it);                                   // không ai đụng thì tự châm
  } else if (it.mode === 'fuse') {
    if (Math.random() < 30 * dt) fx.push({ type: 'ember', x: it.x + 8 + rand(-3, 3), y: it.y - 34, vy: -rand(20, 60), t: 0, life: rand(0.2, 0.5) });
    if ((it.modeT -= dt) <= 0) { it.mode = 'fire'; it.shots = 95 + ((Math.random() * 16) | 0); it.shotT = 0; }
  } else if (it.mode === 'fire') {
    if ((it.shotT -= dt) <= 0) {
      fw_launch(it); it.shotT = rand(0.16, 0.42);
      if (--it.shots <= 0) {                                        // màn kết: 8 quả cùng lúc
        for (let i = 0; i < 8; i++) fw_launch(it, i * 0.06);
        it.mode = 'done'; it.modeT = 3;
      }
    }
  } else if (it.mode === 'done' && (it.modeT -= dt) <= 0) it.fade();
}

function fwDraw(g, it) {                                            // dàn pháo hình bông hoa: hộp đỏ + 5 ống, ngòi xoắn
  const lit = it.mode === 'fire' || it.mode === 'done';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.32, tx = Math.cos(a) * 26, ty = -18 + Math.sin(a) * 22;
    g.moveTo(0, -18).lineTo(tx, ty).stroke({ width: 7, color: CH, cap: 'round' });
    g.moveTo(0, -18).lineTo(tx, ty).stroke({ width: 4.4, color: fw_COLORS[i], cap: 'round' });
    if (lit) g.circle(tx, ty, 2).fill(0x333333);
  }
  g.roundRect(-16, -20, 32, 20, 4).fill(0xd62b3a).stroke(chalk(2.2));
  g.star(0, -10, 5, 6, 3, 0).fill(0xffe15a);
  if (it.mode !== 'fire' && it.mode !== 'done') g.moveTo(16, -12).quadraticCurveTo(24, -18, 20, -26).quadraticCurveTo(16, -32, 22, -36).stroke(chalk(1.4));   // ngòi
}

function fw_launch(it, delay = 0) {
  const x0 = it.x + rand(-6, 6), y0 = it.y - 36, by = rand(270, 470);   // nổ dưới tầm mây
  fw_rockets.push({ x: x0, y: y0, vx: rand(-90, 90), vy: -Math.sqrt(2 * fw_G * (y0 - by)), t: -delay, src: it, shape: pick(fw_SHAPES), c: pick(fw_COLORS), c2: pick(fw_COLORS) });
  sfx('fwLaunch', x0, { whistle: Math.random() < 0.35 });
}

function fw_update(dt) {
  const dark = night && night.k > 0.5;
  for (let i = fw_rockets.length - 1; i >= 0; i--) {
    const r = fw_rockets[i];
    r.t += dt;
    if (r.t < 0) continue;
    r.vy += fw_G * dt; r.x += r.vx * dt; r.y += r.vy * dt;
    if (fw_parts.length < fw_MAXP && Math.random() < 40 * dt)       // vệt đuôi tên lửa
      fw_parts.push({ x: r.x, y: r.y, px: r.x, py: r.y, vx: rand(-15, 15), vy: rand(10, 40), c: dark ? 0xffd27a : 0xdddddd, t: 0, life: rand(0.3, 0.6), drag: 2, g: 40, w: 1.6 });
    if (r.vy >= -30) { swapRemove(fw_rockets, i); fw_burst(r, dark); }
  }
  for (let i = fw_parts.length - 1; i >= 0; i--) {
    const p = fw_parts[i];
    p.t += dt;
    if (p.split && p.t >= p.split) {                                // crossette: mỗi tia tách 4
      p.split = 0;
      for (let k = 0; k < 4 && fw_parts.length < fw_MAXP; k++) { const a = k * Math.PI / 2 + 0.6; fw_parts.push(fw_p(p.x, p.y, Math.cos(a) * 70, Math.sin(a) * 70, p.c, 0.9, dark)); }
    }
    p.px = p.x; p.py = p.y;
    const d = Math.exp(-p.drag * dt);
    p.vx *= d; p.vy = p.vy * d + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.t > p.life) swapRemove(fw_parts, i);
  }
  for (let i = fw_smoke.length - 1; i >= 0; i--) { const s = fw_smoke[i]; s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.t > s.life) swapRemove(fw_smoke, i); }
}

function fw_p(x, y, vx, vy, c, life, dark, o) {
  return Object.assign({ x, y, px: x, py: y, vx, vy, c, t: 0, life: life * rand(0.85, 1.15), drag: 1.4, g: 60, w: dark ? 2.4 : 2.8, tw: dark && Math.random() < 0.5 }, o);
}

function fw_burst(r, dark) {
  const { x, y, c, c2 } = r, room = fw_MAXP - fw_parts.length, P = fw_parts;
  const add = p => { if (P.length < fw_MAXP) P.push(p); };
  const S = dark ? 1.15 : 1;                                        // đêm: nhiều tia hơn, sáng lâu hơn
  if (room > 40) switch (r.shape) {
    case 'ring': for (let i = 0; i < 44; i++) { const a = i / 44 * Math.PI * 2; add(fw_p(x, y, Math.cos(a) * 190, Math.sin(a) * 190, c, 1.3 * S, dark)); } break;
    case 'double': for (let i = 0; i < 70; i++) { const a = i / 35 * Math.PI, v = i < 35 ? 110 : 210; add(fw_p(x, y, Math.cos(a) * v, Math.sin(a) * v, i < 35 ? c2 : c, 1.4 * S, dark)); } break;
    case 'heart':                                                   // trái tim hồng
      for (let i = 0; i < 56; i++) { const a = i / 56 * Math.PI * 2, hx = 16 * Math.sin(a) ** 3, hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); add(fw_p(x, y, hx * 11, hy * 11, 0xff6fae, 1.4 * S, dark, { drag: 1.8, g: 30 })); } break;
    case 'star':
      for (let i = 0; i < 60; i++) { const k = i / 60 * 10, j = Math.floor(k), f = k - j, r0 = j % 2 ? 0.45 : 1, r1 = j % 2 ? 1 : 0.45, a0 = j * Math.PI / 5 - Math.PI / 2, a1 = (j + 1) * Math.PI / 5 - Math.PI / 2;
        const sx = Math.cos(a0) * r0 * (1 - f) + Math.cos(a1) * r1 * f, sy = Math.sin(a0) * r0 * (1 - f) + Math.sin(a1) * r1 * f; add(fw_p(x, y, sx * 200, sy * 200, 0xffe15a, 1.4 * S, dark, { drag: 1.8, g: 30 })); } break;
    case 'smile':                                                   // mặt cười: vòng + 2 mắt + miệng
      for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; add(fw_p(x, y, Math.cos(a) * 190, Math.sin(a) * 190, c, 1.4 * S, dark, { drag: 1.8, g: 25 })); }
      for (const ex of [-1, 1]) for (let i = 0; i < 4; i++) add(fw_p(x, y, ex * 65 + rand(-6, 6), -60 + rand(-6, 6), c2, 1.4 * S, dark, { drag: 1.8, g: 25 }));
      for (let i = 0; i < 14; i++) { const a = 0.35 + i / 13 * (Math.PI - 0.7); add(fw_p(x, y, Math.cos(a) * 110, Math.sin(a) * 110, c2, 1.4 * S, dark, { drag: 1.8, g: 25 })); }
      break;
    case 'willow': for (let i = 0; i < 54; i++) { const a = Math.random() * Math.PI * 2, v = rand(90, 170); add(fw_p(x, y, Math.cos(a) * v, Math.sin(a) * v, 0xffc04d, 2.6 * S, dark, { drag: 1, g: 110, w: 2 })); } break;
    case 'crossette': for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; add(fw_p(x, y, Math.cos(a) * 150, Math.sin(a) * 150, c, 1.6 * S, dark, { split: 0.5 })); } break;
    default: for (let i = 0; i < Math.round(66 * S); i++) { const a = Math.random() * Math.PI * 2, v = rand(60, 230); add(fw_p(x, y, Math.cos(a) * v, Math.sin(a) * v, i % 4 ? c : c2, 1.3 * S, dark)); }   // peony
  }
  if (dark) santa.flashes.push({ x, y, c: r.shape === 'heart' ? 0xff6fae : c, t: 0 });   // đêm: chớp sáng cả vùng
  else for (let i = 0; i < 7; i++) fw_smoke.push({ x: x + rand(-40, 40), y: y + rand(-30, 30), r: rand(12, 26), vx: rand(-8, 8), vy: rand(-6, 4), t: 0, life: rand(2.5, 4) });   // ngày: khói
  const big = r.shape === 'double' || r.shape === 'willow' ? 1.2 : rand(0.7, 1);
  sfx('fwBoom', x, { size: big, delay: rand(0.05, 0.15) });          // tiếng tới trễ hơn ánh sáng chút xíu như thật
  if (r.shape === 'willow' || dark || Math.random() < 0.4) sfx('fwCrackle', x);
  fw_react(r.src, true, x);
}

// người đứng gần (≤ 450px): lần đầu chia vai — ~55% đứng ngắm, còn lại sợ ồn chạy tán loạn; đêm có thêm người ngủ bị đánh thức
function fw_react(it, boom, bx) {
  for (const p of people) {
    if (Math.abs(p.x - it.x) > 450 || p.panic || p.state === 'air' || p.state === 'climb') continue;
    if (p.sleep) { p.sleep = false; p.yawnT = 0; p.surpriseT = 1; }
    if (p.fwOf !== it.fwId) { p.fwOf = it.fwId; p.fwRole = Math.random() < (night && night.dark ? 0.45 : 0.55) ? 'watch' : 'run'; }
    if (!boom) { p.surpriseT = Math.max(p.surpriseT, 0.6); continue; }
    if (p.fwRole === 'watch') {
      if (p.state === 'walk') { p.idleT = Math.max(p.idleT, 2.5); p.nextIdle = Math.max(p.nextIdle, 4); if (Math.abs(bx - p.x) > 4) p.dir = Math.sign(bx - p.x); }
      p.surpriseT = Math.max(p.surpriseT, 0.6);                    // giơ tay, miệng "ồ"
      if (p.state === 'walk' && Math.random() < 0.04) p.fly(0, -rand(180, 240));   // nhảy cẫng reo hò
    } else if (p.state === 'walk') { p.scareT = Math.max(p.scareT, rand(2.5, 4)); p.surpriseT = 1; }
  }
}

function fw_render(s, dt) {
  const g = s.fwG, dark = night && night.k > 0.5;
  g.clear();
  for (const m of fw_smoke) { const a = Math.sin(Math.PI * m.t / m.life) * 0.13; g.circle(m.x, m.y, m.r + m.t * 6).fill({ color: 0xeef4f2, alpha: a }); }
  for (const c of [...fw_COLORS, 0xff6fae, 0xffc04d, 0xffd27a, 0xdddddd]) {
    let any = false;
    for (const p of fw_parts) {
      if (p.c !== c) continue;
      if (p.tw && p.t > p.life * 0.6 && Math.random() < 0.5) continue;   // kim tuyến lấp lánh cuối đời tia (đêm)
      g.moveTo(p.px - p.vx * 0.02, p.py - p.vy * 0.02).lineTo(p.x, p.y); any = true;
    }
    if (!any) continue;
    if (dark) g.stroke({ width: 7, color: c, alpha: 0.22, cap: 'round' });   // đêm: quầng sáng quanh tia, giữ màu (blend 'add' làm bạc màu)
    g.stroke({ width: dark ? 2.4 : 2.8, color: c, alpha: 0.95, cap: 'round' });
  }
  for (const r of fw_rockets) if (r.t >= 0) g.circle(r.x, r.y, 2.6).fill(dark ? 0xfff2c0 : CH);
  for (let i = s.flashes.length - 1; i >= 0; i--) {                 // chớp sáng ban đêm: sprite glow dùng lại
    const f = s.flashes[i];
    if (!f.gl) f.gl = glow(f.c);
    f.t += dt; f.gl.visible = true; f.gl.position.set(f.x, f.y); f.gl.scale.set(3 + f.t * 4); f.gl.alpha = Math.max(0, 0.55 * (1 - f.t / 0.6));
    if (f.t > 0.6) { f.gl.destroy(); swapRemove(s.flashes, i); }
  }
}

// core gọi trong tapAt
function santaTap(x, y) {
  const h = santa.hit(x, y);
  if (!h) return false;
  santa.tap(h); return true;
}
