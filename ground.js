/* Bảng phấn tí hon — GROUND (worker G)
 * Cỏ ba lá + ụ hạt → cây dâu. Mọi nét vẽ ở tọa độ local, gốc (0,0) = đế vật.
 */

// Số giọt mưa để lên stage 1 (mầm), 2 (cây nhỏ), 3 (cây lớn), 4 (ra dâu)
const GROW = [20, 70, 140, 200];
// [góc rad, độ cao tương đối trên thân] cho 7 lá
const LEAVES = [[-2.5, .3], [-.6, .35], [-2.8, .6], [-.35, .62], [-2.2, .85], [-.95, .88], [-1.57, 1]];

// Giọt mưa chạm mặt tại x; y = hàng chân ngay trên mặt
function waterAt(x, y, ground) {
  // mưa lên hạt → tưới cây
  for (const s of seeds) if (Math.abs(s.x - x) < 22 && Math.abs(s.y - y) < 10) { s.rain(); return; }
  // cỏ chỉ mọc trên mặt đất, và chỉ thỉnh thoảng
  if (!ground || Math.random() > 0.1) return;
  let c = null;
  for (const q of clovers) if (Math.abs(q.x - x) < 7) { c = q; break; }
  if (c) { cloverRain(c); c.s = Math.min(1, c.s + 0.25); }   // tưới cỏ cũ: to dần; to hết cỡ thì nở hoa (nature.js)
  else if (clovers.length < MAX_CLOVERS) { clovers.push({ x, s: 0.3, age: 0 }); sfx('clover', x); }
  cloverDirty = true;
}

// Cỏ già dần: sau 140s teo lại rồi biến mất
function ageClovers(dt) {
  for (let i = clovers.length - 1; i >= 0; i--) {
    const c = clovers[i];
    c.age += dt;
    if (c.age > 140) { c.s -= 0.4 * dt; cloverDirty = true; }
    if (c.s <= 0.05) clovers.splice(i, 1);
  }
}

// Gom chung: 1 stroke cho tất cả cuống, 1 fill cho tất cả lá
function drawClovers() {
  cloverG.clear();
  if (!clovers.length) return;
  for (const c of clovers) {
    cloverG.moveTo(c.x, GY).lineTo(c.x + 1, GY - 9 * c.s);
  }
  cloverG.stroke({ width: 1.8, color: 0x49e28e, cap: 'round' });
  for (const c of clovers) {
    const tx = c.x + 1, ty = GY - 9 * c.s, r = 3.3 * c.s;
    for (const a of [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6]) {
      cloverG.circle(tx + Math.cos(a) * r, ty + Math.sin(a) * r, r);
    }
  }
  cloverG.fill({ color: 0x49e28e, alpha: 0.95 });
  for (const c of clovers) {                // hoa: cuống cao hơn + 5 cánh + nhụy vàng
    if (!c.flower) continue;
    const fx0 = c.x + 1, fy = GY - 20 * c.s, r = 3 * c.s;
    cloverG.moveTo(c.x + 1, GY - 9 * c.s).lineTo(fx0, fy).stroke({ width: 1.6, color: 0x49e28e, cap: 'round' });
    for (let k = 0; k < 5; k++) cloverG.circle(fx0 + Math.cos(k * 1.2566) * r * 1.2, fy + Math.sin(k * 1.2566) * r * 1.2, r);
    cloverG.fill(c.flower).circle(fx0, fy, r * 0.8).fill(0xffd23a);
  }
}

// Ụ đất nâu; mưa đủ thì thành cây dâu
class Seed {
  constructor(x, y) {
    this.x = Math.round(x); this.y = Math.round(y);
    this.vx = 0; this.vy = 0;
    this.water = 0;                       // tổng giọt đã hút
    this.stage = 0;                       // 0..4 (4 = có quả)
    this.gv = 0;                          // stage hiển thị, lerp mượt
    this.berries = [];                    // {slot, plant, taken, grow}
    this.idle = 0;                        // giây không được tưới
    this.falling = false;
    this.next = 0;                        // mốc water cho quả tiếp
    this.dead = false;
    this.g = put(new PIXI.Graphics(), plantLayer);
    this.redrawIn = 0;
  }

  rain() {
    this.water++;
    this.idle = 0;
    const was = this.stage;
    while (this.stage < 4 && this.water >= GROW[this.stage]) this.stage++;
    if (this.stage > was) sfx('sprout', this.x, { stage: this.stage });
    if (this.stage === 4) {
      if (this.next === 0) { this.addBerry(); this.addBerry(); this.next = this.water + 90; } // chín đầu: 2 quả
      else if (this.water >= this.next) { this.addBerry(); this.next += 90; }
    }
  }

  addBerry() {
    for (const slot of [0, 1, 2]) {
      if (!this.berries.some(b => b.slot === slot)) {
        this.berries.push({ slot, plant: this, taken: null, grow: 0 });
        return;
      }
    }
  }

  update(dt) {
    this.idle += dt;
    if (this.falling) {
      if (airStep(this, dt, G_I, VT_I, 6)) this.falling = false;
    } else if (!settle(this)) {          // nét đỡ biến mất → rơi
      this.falling = true; this.vx = 0; this.vy = 0;
    }
    this.gv += (this.stage - this.gv) * Math.min(1, 1.5 * dt);
    for (const b of this.berries) b.grow = Math.min(1, b.grow + dt);
    const life = this.stage ? 150 : 90;  // hạt buồn tắt nhanh hơn cây
    if (this.idle > life + 2) this.dead = true;
  }

  render(dt) {
    const life = this.stage ? 150 : 90;
    this.g.position.set(this.x, this.y);
    this.g.alpha = clamp(1 - (this.idle - life) / 2, 0, 1);   // mờ dần 2s trước khi chết
    this.redrawIn -= dt;
    if (this.redrawIn <= 0) { this.redrawIn = rand(0.09, 0.12); drawPlant(this.g, this); }
  }

  destroy() {
    for (const b of this.berries) if (b.taken) b.taken.eat = null;  // nhả người đang ăn
    this.g.destroy();
  }
}

// Ụ đất + thân lá + quả; local, gốc = đỉnh ụ
function drawPlant(g, s) {
  g.clear();
  g.moveTo(-14, 1).quadraticCurveTo(0, -12, 14, 1).fill(0x8a4636);       // ụ đất nâu
  if (s.gv < 0.05) return;
  const t = Math.min(1, s.gv / 3);
  const stemH = 6 + 50 * t;
  const len = (10 + 24 * t) * Math.min(1, s.gv * 2);     // lá to bản như cây dâu trong video gốc
  const wid = 5 + 13 * t;
  g.moveTo(0, -3).quadraticCurveTo(J(1.5), -stemH / 2, J(1), -stemH)
   .stroke({ width: 2.4, color: 0x35c97c, cap: 'round' });               // thân xanh
  const n = s.gv < 1.5 ? 2 : s.gv < 2.5 ? 4 : 7;
  for (let i = 0; i < n; i++) leaf(g, 0, -stemH * LEAVES[i][1], LEAVES[i][0] + J(0.04), len, wid);
  for (const b of s.berries) drawBerry(g, BERRY_AT[b.slot][0], -56 * BERRY_AT[b.slot][1], 0.4 + 0.8 * b.grow);
}

// Lá giọt nước: fill xanh + viền phấn + gân trắng
function leaf(g, x, y, ang, len, wid) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const tx = x + c * len, ty = y + s * len;
  const mx = x + c * len / 2, my = y + s * len / 2;
  g.moveTo(x, y)
   .quadraticCurveTo(mx - s * wid, my + c * wid, tx, ty)
   .quadraticCurveTo(mx + s * wid, my - c * wid, x, y)
   .fill(0x34c77b)
   .stroke(chalk(1.6, 0.9));
  // gân chính tới 85% + 2 cặp gân phụ ở 35% và 60%
  const ex = x + c * len * 0.85, ey = y + s * len * 0.85;
  g.moveTo(x, y).lineTo(ex, ey);
  for (const f of [0.35, 0.6]) {
    const bx = x + c * len * f, by = y + s * len * f, vr = wid * 0.55;
    g.moveTo(bx, by).lineTo(bx - s * vr + c * len * 0.12, by + c * vr + s * len * 0.12);
    g.moveTo(bx, by).lineTo(bx + s * vr + c * len * 0.12, by - c * vr + s * len * 0.12);
  }
  g.stroke(chalk(1.1, 0.75));
}

// Quả dâu tây: (x,y) = đỉnh quả (chỗ đài), cao ~17*s, rộng ~16*s
function drawBerry(g, x, y, s) {
  g.moveTo(x - 7 * s, y + 3 * s)
   .quadraticCurveTo(x - 9 * s, y + 11 * s, x, y + 17 * s)
   .quadraticCurveTo(x + 9 * s, y + 11 * s, x + 7 * s, y + 3 * s)
   .quadraticCurveTo(x, y - 2 * s, x - 7 * s, y + 3 * s)
   .fill(0xff2f84)
   .stroke({ width: 1.4, color: CH, alpha: 0.9 });
  // 5 chấm hạt trắng rải trên thân
  for (const [dx, dy] of [[-3.5, 6], [3.5, 6], [-1.8, 10.5], [1.8, 10.5], [0, 14]]) {
    g.circle(x + dx * s, y + dy * s, 0.9 * s);
  }
  g.fill(CH);
  // đài lá xanh khép trên đỉnh quả
  g.poly([x - 5 * s, y + 2 * s, x - 2.5 * s, y - 3 * s, x + 2.5 * s, y - 3 * s, x + 5 * s, y + 2 * s], true)
   .fill(0x3ed67f);
}
