/* Bảng phấn tí hon — PLANE: máy bay bay ngang trời mỗi 2–3 phút, thả 5–10 thùng quà treo dù, bọc bong bóng.
 * Chạm thùng đang bay → bong bóng vỡ, quà rơi ra. Không chạm → dù đưa thùng xuống tới mặt, bong bóng vỡ, thùng nằm lại;
 * người tí hon đụng thùng (hoặc bé chạm thùng) → mở ra. Chạm máy bay → thả thêm 1 thùng (tối đa 3 mỗi lượt).
 * Top-level: makePlane, Crate, CRATE_GIFTS, planeTap, planeSwipe + helper pln_*. Chỉ khai báo — PIXI/layer chỉ đụng sau boot().
 */

const CRATE_GIFTS = ['berry', 'berry', 'berry', 'seeds', 'seeds', 'mushroom', 'mushroom', 'ladder', 'star'];   // có trọng số
const pln_FIRST = [50, 70], pln_EVERY = [120, 180], pln_SPEED = 120, pln_MAX = 14, pln_EXTRA = 3;
const pln_BR = 24, pln_BOX = 13;        // bán kính bong bóng; tâm thùng cao 13px trên đáy

function makePlane() {
  return {
    on: false, x: -200, y: 90, dir: 1, t: 0, next: rand(...pln_FIRST), drops: [], extra: 0, wob: 0,
    g: put(new PIXI.Graphics(), skyLayer), redrawIn: 0,
    fly() {                                              // 1 lượt: bay từ mép này sang mép kia, thả 5–10 thùng ở các x ngẫu nhiên
      this.on = true; this.dir = Math.random() < 0.5 ? 1 : -1;
      this.x = this.dir > 0 ? -120 : WW + 120; this.y = rand(60, 110);
      const n = 5 + ((Math.random() * 6) | 0);
      this.drops = Array.from({ length: n }, () => rand(120, WW - 120)).sort((a, b) => (a - b) * this.dir);
      this.extra = pln_EXTRA;
    },
    tap() { this.wob = 1; if (this.extra > 0) { this.extra--; this.drop(); } },
    hit(x, y) { return this.on && Math.abs(x - this.x) < 62 && Math.abs(y - this.y) < 30; },
    drop() {
      if (crates.length >= pln_MAX) return;
      crates.push(new Crate(this.x - this.dir * 18, this.y + 18, this.dir));
      sfx('chute', this.x);
    },
    update(dt) {
      if (!this.on) { if ((this.next -= dt) <= 0) this.fly(); return; }
      this.t += dt; this.wob = Math.max(0, this.wob - dt * 1.5);
      this.x += this.dir * pln_SPEED * dt;
      while (this.drops.length && (this.x - this.drops[0]) * this.dir >= 0) { this.drops.shift(); this.drop(); }
      if (this.x > -150 && this.x < WW + 150) sfx('plane', this.x);
      if ((this.dir > 0 && this.x > WW + 140) || (this.dir < 0 && this.x < -140)) { this.on = false; this.next = rand(...pln_EVERY); }
    },
    render(dt) {
      this.g.visible = this.on;
      if (!this.on) return;
      this.g.position.set(this.x, this.y + Math.sin(this.t * 1.6) * 5);
      this.g.rotation = Math.sin(this.t * 1.1) * 0.04 + Math.sin(this.t * 18) * 0.12 * this.wob;
      this.g.scale.set(this.dir, 1);
      if ((this.redrawIn -= dt) <= 0) { this.redrawIn = 0.06; pln_draw(this.g, this.t); }
    },
  };
}

// máy bay phấn ~110px, mũi hướng +x
function pln_draw(g, t) {
  g.clear();
  g.moveTo(-40, -2).lineTo(-56, -26).lineTo(-44, -26).lineTo(-28, -6).closePath().fill(0xff6f91).stroke(chalk(2.2));   // đuôi đứng
  g.ellipse(0, 0, 46, 13).fill(0xffe15a).stroke(chalk(2.4));                                                     // thân
  g.moveTo(-8, 2).lineTo(-24, 24).lineTo(-6, 24).lineTo(12, 2).closePath().fill(0xff6f91).stroke(chalk(2.2));    // cánh
  for (const wx of [-20, -6, 8]) g.circle(wx, -3, 3.6).fill(0x9fe4ff).stroke(chalk(1.4));                        // cửa sổ
  g.circle(22, -4, 6).fill(0x9fe4ff).stroke(chalk(1.6));                                                         // buồng lái
  const sp = Math.sin(t * 40) * 13;                                                                              // cánh quạt quay
  g.moveTo(47, -sp).lineTo(47, sp).stroke(chalk(2.6, 0.85));
  g.circle(48, 0, 3).fill(CH);
  if (night && night.k > 0.3 && Math.sin(t * 6) > 0) g.circle(-50, -26, 3).fill(0xff4b2e).circle(-14, 24, 3).fill(0x3de89b);   // đèn nháy ban đêm
}

class Crate {
  constructor(x, y, dir, gift = pick(CRATE_GIFTS), wrap = 0) {   // wrap ≠ 0: hộp quà ông già Noel (giấy gói màu wrap, không dù)
    this.x = x; this.y = y; this.vx = dir * 20; this.vy = 30; this.drift = dir * rand(4, 14); this.wrap = wrap;
    this.state = 'chute';                                // chute: treo dù trong bong bóng · ground: nằm trên mặt · fall: rơi tự do
    this.gift = gift; this.t = rand(0, 6); this.age = 0; this.chuteA = 1; this.dead = false; this.redrawIn = 0;
    this.c = put(new PIXI.Container(), itemLayer);
    this.g = put(new PIXI.Graphics(), this.c);
    this.icon = put(new PIXI.Graphics(), this.c);
    pln_icon(this.icon, this.gift);
  }
  get cy() { return this.y - pln_BOX; }
  hit(x, y) {
    if (this.state === 'chute') return Math.hypot(x - this.x, y - this.cy) < pln_BR + 12 || (!this.wrap && Math.abs(x - this.x) < 40 && y > this.y - 100 && y < this.cy);
    return Math.abs(x - this.x) < 22 && y > this.y - 34 && y < this.y + 8;
  }
  pop() {                                                // bong bóng vỡ (chạm mặt / chạm thùng)
    sfx('pop', this.x);
    fx.push({ type: 'pop', x: this.x, y: this.cy, t: 0, life: 0.35, r0: pln_BR });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + rand(-0.2, 0.2);
      fx.push({ type: 'drop', x: this.x + Math.cos(a) * pln_BR, y: this.cy + Math.sin(a) * pln_BR, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, t: 0, life: 0.5 });
    }
  }
  open() {                                               // mở thùng: quà bung ra, thùng biến mất
    if (this.dead) return;
    this.dead = true;
    if (this.state === 'chute') this.pop();
    sfx('gift', this.x);
    const x = this.x, y = this.cy;
    for (let i = 0; i < 10; i++)
      fx.push({ type: 'spark', x, y, vx: rand(-140, 140), vy: rand(-200, -40), r: rand(3, 6), rot: rand(0, 6), shape: i % 2 ? 'star' : 'flower', c: pick(STAR_C), t: 0, life: rand(0.8, 1.4) });
    if (this.gift === 'star') burst(x, Math.min(y, GY - 340), 0xffe45c);
    else if (this.gift === 'seeds')
      for (let i = 0; i < 3; i++) fx.push({ type: 'seed', x, y, vx: (i - 1) * rand(60, 120), vy: -rand(80, 160), t: 0, delay: rand(0.3, 0.6) });
    else {
      const n = this.gift === 'berry' ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const it = new Item(this.gift, x, y);
        it.vx = (i - (n - 1) / 2) * rand(50, 80); it.vy = -rand(120, 220);
        items.push(it);
      }
      trimItems();
    }
  }
  update(dt) {
    this.t += dt; this.age += dt;
    if (this.state === 'chute') {
      this.vx += (this.drift + Math.cos(this.t * 1.2) * 22 - this.vx) * Math.min(1, 2 * dt);   // dù đung đưa
      if (airStep(this, dt, 120, 38, 10)) {               // chạm mặt: bong bóng vỡ, dù xẹp, thùng nằm lại
        this.pop(); this.state = 'ground'; this.age = 0; this.vx = 0; sfx('land', this.x);
      }
      return;
    }
    if (this.state === 'fall') { if (airStep(this, dt, G_I, VT_I, 10)) { this.state = 'ground'; this.vx = 0; } return; }
    this.chuteA = Math.max(0, this.chuteA - dt);
    if (!settle(this)) { this.state = 'fall'; this.vy = 0; return; }   // nét đỡ mờ mất
    for (const p of people)
      if (p.state !== 'climb' && Math.abs(p.x - this.x) < 16 && p.y > this.y - 30 && p.y < this.y + 6) { p.surpriseT = 1; this.open(); return; }
    for (const it of items)                               // thú/bò chạy ngang cũng mở được
      if ((it.type === 'cow' || it.hitW) && it.state === 'live' && Math.abs(it.x - this.x) < 22 && Math.abs(it.y - this.y) < 20) { this.open(); return; }
    if (this.age > 45) this.open();                       // không ai đụng thì tự mở, không bỏ phí
  }
  render(dt) {
    const air = this.state === 'chute';
    this.c.position.set(this.x, this.y);
    this.c.rotation = air ? Math.sin(this.t * 1.2) * 0.1 : 0;
    if ((this.redrawIn -= dt) <= 0) { this.redrawIn = 0.1; pln_crate(this.g, air, this.chuteA, this.t, this.wrap); }
  }
  destroy() { this.c.destroy({ children: true }); }
}

// thùng gỗ đáy (0,0); air = còn dù + bong bóng; chuteA = dù xẹp mờ dần sau khi chạm mặt
function pln_crate(g, air, chuteA, t, wrap) {
  g.clear();
  const cy = -pln_BOX;
  if (wrap) {                                            // hộp quà Noel: giấy gói + nơ, không dù
    g.roundRect(-13, cy - 13, 26, 26, 3).fill(wrap).stroke(chalk(2.2));
    g.moveTo(-13, cy - 8).lineTo(13, cy - 8).stroke({ width: 3, color: 0xffe15a });
    g.ellipse(-6, cy - 16, 6, 4).ellipse(6, cy - 16, 6, 4).fill(0xffe15a).stroke(chalk(1.2));
  } else if (air) {
    const top = cy - pln_BR - 44;
    g.moveTo(-36, top + 16).bezierCurveTo(-36, top - 14, 36, top - 14, 36, top + 16)
      .quadraticCurveTo(24, top + 9, 12, top + 16).quadraticCurveTo(0, top + 9, -12, top + 16).quadraticCurveTo(-24, top + 9, -36, top + 16)
      .fill(0xff8fc0).stroke(chalk(2.2));                                        // tán dù
    for (const sx of [-34, -12, 12, 34]) g.moveTo(sx, top + 16).lineTo(sx * 0.3, cy - pln_BR + 3);
    g.stroke(chalk(1.4, 0.8));
  } else if (chuteA > 0) {
    g.moveTo(14, -2).quadraticCurveTo(30, -16 + J(1), 46, -2).closePath().fill({ color: 0xff8fc0, alpha: chuteA });   // dù xẹp bên cạnh
  }
  if (!wrap) {
    g.roundRect(-13, cy - 13, 26, 26, 3).fill(0xd9a066).stroke(chalk(2.2));              // thùng
    g.moveTo(-13, cy).lineTo(-7, cy).moveTo(7, cy).lineTo(13, cy).stroke(chalk(1.4, 0.7));   // nẹp thùng chừa chỗ icon
  }
  if (air) {
    const r = pln_BR;
    g.circle(0, cy, r).fill({ color: CH, alpha: 0.07 }).stroke(chalk(2.2, 0.85));
    g.circle(0.36 * r + J(0.3), cy - 0.44 * r, 0.19 * r).fill({ color: CH, alpha: 0.95 });
    g.circle(0.62 * r, cy - 0.14 * r, 0.09 * r).fill({ color: CH, alpha: 0.9 });
  }
}

// icon quà trên mặt thùng (vẽ 1 lần), để bé đoán trước bên trong có gì
function pln_icon(g, gift) {
  if (gift === 'seeds') {
    g.ellipse(-5, -12, 2.6, 3.4).ellipse(5, -12, 2.6, 3.4).ellipse(0, -18, 2.6, 3.4).fill(0x8a4636);
    return;
  }
  const [sc, oy] = ICON[gift];
  drawItem(g, gift, { h: 110, anim: 0, air: true });
  g.scale.set(sc * 0.5); g.position.set(0, -pln_BOX + oy * 0.5);
}

// core gọi trong tapAt / onMove
function planeTap(x, y) {
  for (const c of crates) if (!c.dead && c.hit(x, y)) { c.open(); return true; }
  if (plane.hit(x, y)) { plane.tap(); return true; }
  return false;
}
function planeSwipe(x, y) {                              // kéo nét qua thùng đang bay cũng chọc vỡ như bong bóng
  for (const c of crates) if (!c.dead && c.state === 'chute' && Math.hypot(c.x - x, c.cy - y) < pln_BR) c.open();
}
