/* Bảng phấn tí hon — CORE (điều phối sở hữu)
 * Dựng lại cơ chế "A Blackboard where Little People Live" của teamLab bằng nét phấn tự vẽ.
 * File này: hằng số, helper, layer Pixi, mặt nạ va chạm + vật lý "đi trên nét vẽ", nét vẽ + input,
 * hạt hiệu ứng dùng chung, vòng lặp tick(), boot(), hook kiểm thử window.__bb.
 * Entity: people.js (Person) · sky.js (mây/mưa/sao/mặt trời) · ground.js (cỏ ba lá/hạt/cây dâu) · things.js (bong bóng/đồ vật/chim) · animals.js (cá sấu/khỉ/gấu) · nature.js (cầu vồng/vũng nước/hoa/bướm).
 * Classic script, chung global scope, nạp theo thứ tự trong index.html.
 */

// ===== Thế giới: đơn vị cố định cao 900, rộng theo tỷ lệ màn hình =====
const WH = 900, GY = 780;                 // mọi y ≥ GY là đất (nét đất ngang sát đáy như bản gốc)
const CH = 0xf6fffd;                      // phấn trắng
const BOARD_TOP = [0x40, 0xb4, 0xb6], BOARD_BOT = [0x2c, 0x98, 0x9e];
const HATS = [0xff3aa6, 0x3346ff, 0x35e0ee, 0xc8f25a, 0xa35bff, 0x3de89b, 0xffe15a, 0xff6f91];
const STAR_C = [0xffffff, 0xffe45c, 0xff9fd0, 0x9cf5b0, 0x9fe4ff];
const EDGE = 14;                          // chạm mép màn thì quay đầu
const STEP_UP = 3, STEP_DN = 4;           // leo tối đa 3px mỗi 1px ngang (~71°); dốc hơn = vật cản
const BODY_H = 50, HEAD_TOP = 51, MAX_TOWER = 5;
const G_P = 1100, VT_P = 420;             // trọng lực + vận tốc rơi tối đa của người (rơi bồng bềnh)
const G_I = 1400, VT_I = 900;             // của đồ vật
const LINE_LIFE = 60, LR = 3, MAX_LINES = 24;   // nét sống 60s rồi mờ; bán kính va chạm 3px (dải 7px)
const MAX_ITEMS = 10, MAX_SEEDS = 14, MAX_CLOVERS = 160, MAX_STARS = 16, MIN_STARS = 7;
const MAX_PUDDLES = 10, MAX_BUTTERFLIES = 6;
const BEAM = 260;                         // nửa bề rộng vệt nắng ở mặt đất
const BERRY_AT = [[-13, 0.45], [12, 0.55], [0, 0.75]];   // slot quả dâu: [dx, tỷ lệ chiều cao cây 56px]
const BURN_BIG = 0.55, SOOT_HOLD = 6;     // cháy ≥ BURN_BIG = cháy to (kêu cứu, chạy tìm mưa, lây); đen giữ 6s sau khi tắt rồi phai 2s

const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const J = (a = 0.7) => (Math.random() - 0.5) * 2 * a;       // run nét phấn (chalk boil)
const chalk = (w = 2.4, a = 0.95) => ({ width: w, color: CH, alpha: a, cap: 'round', join: 'round' });
const boardAt = y => {
  const t = clamp(y / WH, 0, 1), c = i => Math.round(BOARD_TOP[i] + (BOARD_BOT[i] - BOARD_TOP[i]) * t);
  return (c(0) << 16) | (c(1) << 8) | c(2);
};
const HEADFILL = boardAt(700);
const mixC = (a, b, t) => {                // trộn màu 0xRRGGBB, t=0 → a, t=1 → b
  const m = sh => Math.round(((a >> sh) & 255) + (((b >> sh) & 255) - ((a >> sh) & 255)) * t);
  return (m(16) << 16) | (m(8) << 8) | m(0);
};
const swapRemove = (arr, i) => { arr[i] = arr[arr.length - 1]; arr.pop(); };
const put = (o, parent = app.stage) => parent.addChild(o);

// ===== Pixi + layer (tạo trong boot) =====
let app, glowTex, boardS, beamG, rainbowLayer, lineLayer, puddleG, groundG, cloverG, plantLayer, itemLayer, glowLayer, peopleLayer, skyLayer, bubbleLayer, fxG;
function glow(tint) {
  const s = put(new PIXI.Sprite(glowTex), glowLayer);
  s.anchor.set(0.5); s.blendMode = 'add'; s.tint = tint; s.visible = false;
  return s;
}

// ===== State dùng chung =====
const people = [], items = [], seeds = [], clovers = [], stars = [], clouds = [], bubbles = [], lines = [], birds = [], fx = [], drops = [], puddles = [], butterflies = [];
const strokes = new Map();                // pointerId → Line đang vẽ
let WW = 1600, K = 1, MW = 0, mask = new Uint8Array(0), MAXP = 30, MAXB = 3;
let sun = null, rainbow = null, maskDirty = false, cloverDirty = true, cloverIn = 0, spawnCD = 0, bubbleCD = 1, starCD = 2;

// ===== Mặt nạ va chạm: 1 byte / pixel thế giới; nét vẽ được "đóng dấu" vào đây =====
function solid(x, y) {
  y = Math.floor(y);
  if (y >= GY) return true;
  if (y < 0) return false;
  x = Math.floor(x);
  return x >= 0 && x < MW && mask[y * MW + x] === 1;
}
function disc(cx, cy) {
  cx = Math.round(cx); cy = Math.round(cy);
  for (let dy = -LR; dy <= LR; dy++) {
    const y = cy + dy;
    if (y < 0 || y >= WH) continue;
    const span = Math.floor(Math.sqrt(LR * LR - dy * dy));
    const x0 = Math.max(0, cx - span), x1 = Math.min(MW - 1, cx + span);
    if (x1 >= x0) mask.fill(1, y * MW + x0, y * MW + x1 + 1);
  }
}
function stampSeg(ax, ay, bx, by) {
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
  for (let i = 0; i <= n; i++) disc(ax + (bx - ax) * i / n, ay + (by - ay) * i / n);
}
function rebuildMask() { mask.fill(0); for (const l of lines) l.stamp(); if (rainbow && rainbow.solid) rainbow.stamp(); }
function topAt(x, y) { y = Math.round(y); let k = 0; while (solid(x, y) && k++ < 14) y--; return y; }
function firstSolid(x, y0, y1) {
  for (let y = y0; y < y1; y += 3) if (solid(x, y)) return Math.floor(y);
  return solid(x, y1) ? Math.floor(y1) : -1;
}

// ===== Vật lý "đi trên nét phấn" (kiểu Lemmings). e.y = hàng pixel trống ngay trên mặt đứng ("chân") =====
// Bước 1px theo e.dir. 'wall' = mép màn / dốc quá đứng / nét chắn ngang thân; 'fall' = hụt chân (e đã dời tới mép).
function walkStep(e, up, bodyH) {
  const nx = e.x + e.dir;
  if ((nx < EDGE && e.dir < 0) || (nx > WW - EDGE && e.dir > 0)) return 'wall';
  let y = e.y;
  if (solid(nx, y)) {
    let k = 1;
    while (k <= up && solid(nx, y - k)) k++;
    if (k > up) return 'wall';
    y -= k;
  } else {
    let k = 0;
    while (k < STEP_DN && !solid(nx, y + 1)) { y++; k++; }
    if (!solid(nx, y + 1)) { e.x = nx; e.y = y; return 'fall'; }
  }
  for (let k = up + 2; k < bodyH; k += 3) if (solid(nx, y - k)) return 'wall';
  e.x = nx; e.y = y;
  return 'ok';
}
// Gọi mỗi frame khi đứng trên mặt: nét mới vẽ đè chân → nhấc lên; nét dưới chân đã mờ mất → false (caller cho rơi).
function settle(e) {
  let k = 0;
  while (solid(e.x, e.y) && k++ < 14) e.y--;
  if (solid(e.x, e.y + 1)) return true;
  for (let d = 1; d <= STEP_DN; d++) if (solid(e.x, e.y + 1 + d)) { e.y += d; return true; }
  return false;
}
// Bay/rơi có trọng lực, chia bước ≤2px để không xuyên nét mỏng. true = vừa chạm mặt (x làm tròn, y = chân trên mặt).
function airStep(e, dt, g, vt, bodyH) {
  e.vy = Math.min(e.vy + g * dt, vt);
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(e.vx), Math.abs(e.vy)) * dt / 2));
  const sx = e.vx * dt / n, sy = e.vy * dt / n;
  for (let i = 0; i < n; i++) {
    let nx = e.x + sx;
    if (nx < EDGE) { nx = EDGE; e.vx = Math.abs(e.vx) * 0.5; }
    else if (nx > WW - EDGE) { nx = WW - EDGE; e.vx = -Math.abs(e.vx) * 0.5; }
    if (solid(nx, e.y - bodyH * 0.5)) e.vx *= -0.4; else e.x = nx;
    const ny = e.y + sy;
    if (sy > 0 && solid(e.x, ny)) {
      e.x = Math.round(e.x); e.y = Math.floor(ny);
      while (solid(e.x, e.y)) e.y--;
      return true;
    }
    if (sy < 0 && solid(e.x, ny - bodyH)) e.vy = Math.max(e.vy, 0); else e.y = ny;
  }
  return false;
}

// ===== Nét phấn người chơi vẽ =====
class Line {
  constructor(x, y) {
    this.pts = [x, y]; this.age = 0; this.drawing = true; this.dead = false;
    this.g = put(new PIXI.Graphics(), lineLayer);
    disc(x, y); this.draw();
  }
  add(x, y) {
    const p = this.pts, lx = p[p.length - 2], ly = p[p.length - 1];
    if (Math.hypot(x - lx, y - ly) < 4) return false;
    p.push(x, y); stampSeg(lx, ly, x, y); this.draw();
    return true;
  }
  stamp() {
    const p = this.pts;
    disc(p[0], p[1]);
    for (let i = 2; i < p.length; i += 2) stampSeg(p[i - 2], p[i - 1], p[i], p[i + 1]);
  }
  trace(g) { const p = this.pts; g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); }
  draw() { const g = this.g; g.clear(); this.trace(g); g.stroke(chalk(12, 0.14)); this.trace(g); g.stroke(chalk(5.5, 0.95)); }
  get fading() { return this.age > LINE_LIFE; }
}
function removeLine(l) { l.dead = true; l.g.destroy(); lines.splice(lines.indexOf(l), 1); maskDirty = true; }

// ===== Input: chạm vật → tương tác; chạm chỗ trống → vẽ nét (đa điểm chạm) =====
function toWorld(e) { const r = app.canvas.getBoundingClientRect(); return [(e.clientX - r.left) / K, (e.clientY - r.top) / K]; }
function tapAt(x, y) {
  for (const b of bubbles) if (!b.dead && Math.hypot(b.x - x, b.y - y) < b.r + 10) { b.pop(); return true; }
  for (const s of stars) if (Math.hypot(s.x - x, s.y - y) < 26) { burst(s.x, s.y, s.color, s); return true; }
  // thú (thân to) trước người: bé chạm cá sấu/khỉ/gấu thì trúng thú dù có người đi ngang
  for (const it of items) if (it.hitW && it.state === 'live' && Math.abs(it.x - x) < it.hitW && y > it.y - it.hitH && y < it.y + 8) { it.tap(); return true; }
  for (const p of people) if (Math.abs(p.rx - x) < 16 * p.s && y > p.ry - 64 * p.s && y < p.ry + 6) { p.poke(); return true; }
  for (const c of clouds) if (Math.abs(c.x - x) < c.w / 2 + 8 && Math.abs(c.y - y) < c.h / 2 + 8) { c.tap(); return true; }
  if (Math.hypot(sun.x - x, sun.y - y) < sun.r + 24) { sun.shine(); return true; }
  return false;
}
function onDown(e) {
  soundUnlock();                                        // trình duyệt chỉ cho phát tiếng sau cử chỉ người dùng
  const [x, y] = toWorld(e);
  if (tapAt(x, y)) return;
  if (lines.length >= MAX_LINES) { const old = lines.find(l => !l.drawing && !l.fading); if (old) old.age = LINE_LIFE; }
  const l = new Line(x, y);
  lines.push(l); strokes.set(e.pointerId, l);
}
function onMove(e) {
  const l = strokes.get(e.pointerId);
  if (!l) return;
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
  for (const ev of evs.length ? evs : [e]) {
    const [x, y] = toWorld(ev);
    if (!l.add(x, y)) continue;
    sfx('chalk', x);                                    // tiếng phấn cào bảng theo tốc độ vẽ
    for (const b of bubbles) if (!b.dead && Math.hypot(b.x - x, b.y - y) < b.r) b.pop();
  }
}
function onUp(e) {
  const l = strokes.get(e.pointerId);
  if (!l) return;
  strokes.delete(e.pointerId); l.drawing = false;
  if (l.pts.length < 4) removeLine(l);                 // chạm không kéo = không vẽ
}

// ===== Bảng + kích thước =====
function makeBoard() {
  const sc = 0.5, c = document.createElement('canvas');
  c.width = Math.ceil(WW * sc); c.height = Math.ceil(WH * sc);
  const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, c.height);
  gr.addColorStop(0, '#40b4b6'); gr.addColorStop(1, '#2c989e');
  x.fillStyle = gr; x.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 90; i++) {                        // vệt lau bảng mờ
    x.save(); x.translate(rand(0, c.width), rand(0, c.height)); x.rotate(rand(-0.5, 0.5)); x.scale(rand(2, 6), 1);
    const r = rand(15, 60), g = x.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, `rgba(255,255,255,${rand(0.02, 0.06)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill(); x.restore();
  }
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,255,255,${rand(0.01, 0.035)})`; x.fillRect(rand(0, c.width), 0, rand(4, 30), c.height); }
  for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(255,255,255,${rand(0.04, 0.14)})`; x.fillRect(rand(0, c.width), rand(0, c.height), 1, 1); }
  const old = boardS.texture;
  boardS.texture = PIXI.Texture.from(c); boardS.width = WW; boardS.height = WH;
  if (old !== PIXI.Texture.EMPTY) old.destroy(true);
}
function layout() {
  let w = window.innerWidth, h = window.innerHeight;
  if (!w || !h) { if (MW) return; w = 1600; h = 900; }  // tab ẩn → innerWidth = 0: giữ kích thước cũ (gotcha v3)
  K = h / WH; app.stage.scale.set(K);
  const nw = Math.ceil(w / K);
  if (nw === WW && MW) return;
  WW = nw; MW = WW; mask = new Uint8Array(MW * WH); rebuildMask();
  MAXP = clamp(Math.round(WW / 48), 14, 44); MAXB = clamp(Math.round(WW / 450), 2, 5);
  makeBoard();
  groundG.clear().moveTo(0, GY + 2).lineTo(WW, GY + 2).stroke(chalk(12, 0.14)).moveTo(0, GY + 2).lineTo(WW, GY + 2).stroke(chalk(5, 0.95));
  if (sun) sun.x = WW - 150;
  for (const e of [...people, ...items, ...seeds]) { e.x = Math.round(clamp(e.x, EDGE, WW - EDGE)); if (e.y > GY - 1) e.y = GY - 1; }
  for (const e of [...stars, ...bubbles, ...clouds]) e.x = clamp(e.x, 40, WW - 40);
  flock.tx = clamp(flock.tx, 120, WW - 120);
}
function skySpot() {
  let x, y, n = 0;
  do { x = rand(40, WW - 40); y = rand(60, GY - 340); } while (sun && Math.hypot(x - sun.x, y - sun.y) < 90 && n++ < 10);
  return [x, y];
}

// ===== Hạt hiệu ứng dùng chung: slice push object vào `fx`; core cập nhật, vẽ, xóa khi t > life =====
function updateFx(dt) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i];
    f.t += dt;
    if (f.type === 'spark') {
      const d = Math.exp(-dt * 2.2);
      f.vx *= d; f.vy = f.vy * d + 10 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += dt * 1.5;
    } else if (f.type === 'seed') {                     // lấp lánh như sao nhỏ rồi thành hạt nâu rơi xuống
      if (f.t < f.delay) { const d = Math.exp(-dt * 2.5); f.vx *= d; f.vy *= d; f.x += f.vx * dt; f.y += f.vy * dt; }
      else {
        f.vy = Math.min(f.vy + 900 * dt, 600);
        const ny = f.y + f.vy * dt, hit = firstSolid(f.x, f.y, ny);
        if (hit >= 0) { f.dead = true; sfx('seed', f.x); if (seeds.length < MAX_SEEDS) seeds.push(new Seed(f.x, topAt(f.x, hit))); }
        else f.y = ny;
        if (f.y > WH) f.dead = true;
      }
      f.x = clamp(f.x, EDGE, WW - EDGE);
    } else if (f.type === 'flash') {
      f.sprite.visible = true; f.sprite.position.set(f.x, f.y);
      f.sprite.scale.set(0.6 + f.t * 3); f.sprite.alpha = Math.max(0, 1 - f.t / f.life);
    } else if (f.type === 'drop') { f.vy += 300 * dt; f.x += f.vx * dt; f.y += f.vy * dt; }
    else if (f.type === 'heart' || f.type === 'ember' || f.type === 'zz') { if (f.t > 0) f.y += f.vy * dt; }
    if (f.dead || (f.life && f.t > f.life)) { if (f.sprite) f.sprite.destroy(); swapRemove(fx, i); }
  }
}
function heartShape(g, x, y, s, a) {
  g.circle(x - 2.6 * s, y, 3 * s).circle(x + 2.6 * s, y, 3 * s)
    .poly([x - 5.5 * s, y + 1 * s, x + 5.5 * s, y + 1 * s, x, y + 7.5 * s], true).fill({ color: 0xff7fbf, alpha: a });
}
function drawFx() {
  const g = fxG;
  g.clear();
  for (const d of drops) g.moveTo(d.x, d.y - d.len).lineTo(d.x - 1.2, d.y);
  if (drops.length) g.stroke({ width: 1.8, color: CH, alpha: 0.7, cap: 'round' });
  for (const f of fx) {
    if (f.t < 0) continue;
    const a = f.life ? clamp((f.life - f.t) / Math.min(0.6, f.life), 0, 1) : 1;
    if (f.type === 'spark') {
      if (f.shape === 'star') g.star(f.x, f.y, 5, f.r, f.r * 0.5, f.rot);
      else for (let k = 0; k < 5; k++) g.circle(f.x + Math.cos(f.rot + k * 1.2566) * f.r * 0.62, f.y + Math.sin(f.rot + k * 1.2566) * f.r * 0.62, f.r * 0.42);
      g.stroke({ width: 1.8, color: f.c, alpha: a * (0.55 + 0.45 * Math.sin(f.t * 11 + f.r * 3)) });
    } else if (f.type === 'seed') {
      if (f.t < f.delay) g.star(f.x, f.y, 5, 6, 3, f.t * 2).stroke({ width: 1.8, color: 0xffe45c, alpha: 0.9 });
      else g.ellipse(f.x, f.y, 3, 4).fill(0x8a4636);
    } else if (f.type === 'pop') g.circle(f.x, f.y, f.r0 + f.t * 150).stroke({ width: 2, color: CH, alpha: a * 0.8 });
    else if (f.type === 'drop') g.circle(f.x, f.y, 2.2).fill({ color: CH, alpha: a });
    else if (f.type === 'heart') heartShape(g, f.x, f.y, 1.2, a);
    else if (f.type === 'ember') g.circle(f.x, f.y, 2).fill({ color: 0xffb347, alpha: a });
    else if (f.type === 'ripple') { const r = f.r0 + f.t * 30; g.ellipse(f.x, f.y, r, r * 0.28).stroke({ width: 1.4, color: CH, alpha: a * 0.7 }); }   // gợn nước dẹt
    else if (f.type === 'zz') {                          // gấu ngủ: chữ z bay lên, lắc nhẹ
      const s = 4 + f.t * 3, x = f.x + Math.sin(f.t * 3) * 5;
      g.moveTo(x - s, f.y - s).lineTo(x + s, f.y - s).lineTo(x - s, f.y + s).lineTo(x + s, f.y + s).stroke({ width: 1.8, color: CH, alpha: a });
    }
  }
}

// ===== Vòng lặp =====
function sweep(arr) { for (let i = arr.length - 1; i >= 0; i--) if (arr[i].dead) { arr[i].destroy(); arr.splice(i, 1); } }
function tick(dt) {
  for (let i = lines.length - 1; i >= 0; i--) {         // nét sống LINE_LIFE giây rồi mờ dần như phấn bị lau
    const l = lines[i];
    if (l.drawing) continue;
    l.age += dt;
    if (l.fading) { l.g.alpha = Math.max(0, 1 - (l.age - LINE_LIFE) / 2.5); if (l.age > LINE_LIFE + 2.5) removeLine(l); }
  }
  if (maskDirty) { maskDirty = false; rebuildMask(); }
  sun.update(dt);
  for (const c of clouds) c.update(dt);
  updateRain(dt);
  rainbow.update(dt);
  updatePuddles(dt);
  for (const s of stars) s.update(dt);
  if (stars.length < MIN_STARS && (starCD -= dt) <= 0) { starCD = 3; stars.push(new Star(...skySpot())); }
  for (const b of bubbles) b.update(dt);
  sweep(bubbles);
  if (bubbles.length < MAXB && (bubbleCD -= dt) <= 0) { bubbleCD = rand(3, 6); bubbles.push(new Bubble()); }
  for (const it of items) it.update(dt);
  sweep(items);
  for (const s of seeds) s.update(dt);
  sweep(seeds);
  ageClovers(dt);
  for (const p of people) p.update(dt);
  updateButterflies(dt);
  if (people.length < MAXP && (spawnCD -= dt) <= 0) {    // người mới đi vào từ mép màn
    spawnCD = 1.6;
    const left = Math.random() < 0.5;
    people.push(new Person(left ? -20 : WW + 20, left ? 1 : -1));
  }
  updateFlock(dt);
  for (const b of birds) b.update(dt);
  updateFx(dt);
  // vẽ: transform mỗi frame; mỗi entity tự dựng lại nét ~12fps trong render()
  sun.render(dt);
  rainbow.render(dt);
  drawPuddles();
  for (const c of clouds) c.render(dt);
  for (const s of stars) s.render(dt);
  for (const b of bubbles) b.render(dt);
  for (const it of items) it.render(dt);
  for (const s of seeds) s.render(dt);
  for (const p of people) p.render(dt);
  for (const b of butterflies) b.render(dt);
  for (const b of birds) b.render(dt);
  if (cloverDirty && (cloverIn -= dt) <= 0) { cloverIn = 0.1; cloverDirty = false; drawClovers(); }
  drawFx();
  soundUpdate(dt);
}

async function boot() {
  app = new PIXI.Application();
  await app.init({ resizeTo: window, background: 0x2f9ea3, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true });
  document.body.appendChild(app.canvas);
  boardS = put(new PIXI.Sprite());
  beamG = put(new PIXI.Graphics());
  rainbowLayer = put(new PIXI.Container());
  lineLayer = put(new PIXI.Container());
  groundG = put(new PIXI.Graphics(), lineLayer);
  cloverG = put(new PIXI.Graphics());
  puddleG = put(new PIXI.Graphics());
  plantLayer = put(new PIXI.Container());
  itemLayer = put(new PIXI.Container());
  glowLayer = put(new PIXI.Container());
  peopleLayer = put(new PIXI.Container());
  skyLayer = put(new PIXI.Container());
  bubbleLayer = put(new PIXI.Container());
  fxG = put(new PIXI.Graphics());
  const gc = document.createElement('canvas');
  gc.width = gc.height = 128;
  const gx = gc.getContext('2d'), gr = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  gx.fillStyle = gr; gx.fillRect(0, 0, 128, 128);
  glowTex = PIXI.Texture.from(gc);
  layout();
  sun = makeSun();
  rainbow = makeRainbow();
  // cảnh mở đầu như bản gốc lúc chưa ai chạm: người đi trên nét đất, vài ụ hạt, cỏ, mây, sao, bong bóng, đàn chim
  for (let i = 0; i < 3; i++) clouds.push(new Cloud(WW * (0.18 + i * 0.3) + rand(-60, 60), rand(85, 185)));
  for (let i = 0; i < 9; i++) stars.push(new Star(...skySpot()));
  for (let i = 0; i < MAXB; i++) bubbles.push(new Bubble());
  for (let i = 0; i < 7; i++) birds.push(new Bird(i));
  for (let i = 0; i < 3; i++) seeds.push(new Seed(rand(80, WW - 80), GY - 1));
  for (let i = 0; i < 14; i++) clovers.push({ x: rand(20, WW - 20), s: rand(0.5, 1), age: rand(0, 60) });
  for (let i = 0, n = Math.round(MAXP * 0.6); i < n; i++) people.push(new Person(rand(EDGE + 10, WW - EDGE - 10), Math.random() < 0.5 ? 1 : -1));
  app.canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  window.addEventListener('resize', layout);
  app.ticker.add(t => tick(Math.min(t.deltaMS / 1000, 0.05)));
  setTimeout(() => { const h = document.getElementById('hint'); if (h) h.style.opacity = 0; }, 12000);
}

// Hook kiểm thử: tab ẩn → rAF dừng, phải bơm tick tay (gotcha demo 2026-07-27)
window.__bb = {
  people, items, seeds, clovers, stars, clouds, bubbles, lines, birds, fx, drops, puddles, butterflies, GY,
  get rainbow() { return rainbow; },
  get sun() { return sun; },
  get WW() { return WW; },
  step(n = 1) { for (let i = 0; i < n; i++) tick(1 / 60); app.render(); },
  tap: (x, y) => tapAt(x, y),
  draw(pts) {
    const l = new Line(pts[0], pts[1]);
    lines.push(l);
    for (let i = 2; i < pts.length; i += 2) l.add(pts[i], pts[i + 1]);
    l.drawing = false;
    return l;
  },
  drop(type, x, y = 300) { if (type === 'star') burst(x, y, 0xffe45c); else { items.push(new Item(type, x, y)); trimItems(); } },
};
