/* Bảng phấn tí hon — THINGS: đồ vật từ bong bóng (thang/nấm/lửa/bò/dâu + cá sấu/khỉ/gấu ở animals.js), bong bóng, đàn chim giấy.
 * Chỉ khai báo; mọi thứ Pixi/layer chỉ tồn tại sau boot(). */

const ITEM_TYPES = ['ladder','ladder','mushroom','mushroom','fire','cow','croc','monkey','bear','star','berry','berry']; // có trọng số
const LIFE = { ladder: 45, mushroom: 45, fire: 10, cow: 30, berry: 40, croc: 35, monkey: 30, bear: 35 };   // giây sau khi chạm đất
const ICON = { ladder: [0.3, 17], cow: [0.42, 10], mushroom: [0.55, 11], fire: [0.6, 12], star: [1, 0], berry: [1.25, 10], croc: [0.4, 6], monkey: [0.62, 13], bear: [0.42, 14] }; // [scale, dịch y] trong bong bóng

class Item {                       // vật rơi ra từ bong bóng
  constructor(type, x, y) {
    this.type = type; this.x = x; this.y = y;
    this.vx = rand(-15, 15); this.vy = 0;
    this.state = 'fall'; this.age = 0; this.anim = 0; this.squash = 0; this.acc = 0;
    this.k = type === 'mushroom' ? 0.4 : 1;
    this.dir = Math.random() < 0.5 ? 1 : -1;
    this.air = false; this.taken = null; this.dead = false;
    this.rot = type === 'ladder' ? rand(-0.5, 0.5) : 0;   // thang rơi nghiêng, chạm đất dựng thẳng
    this.h = 300; this.speed = rand(130, 170); this.fadeT = 0; this.redrawIn = 0;
    this.g = put(new PIXI.Graphics(), itemLayer);
    this.gl = type === 'fire' ? glow(0xff7a30) : null;
    if (ANIMALS[type]) ANIMALS[type].init(this);
  }
  tap() { if (ANIMALS[this.type]) ANIMALS[this.type].tap(this); }
  update(dt) {
    this.age += dt; this.anim += dt; this.squash *= Math.exp(-7 * dt);
    if (this.state === 'fall') {
      if (airStep(this, dt, G_I, VT_I, 8)) {
        this.state = 'live'; this.age = 0; this.rot = 0; this.vx = 0;
        this.x = Math.round(this.x); this.y = Math.round(this.y);
        sfx('land', this.x, { type: this.type });
        if (this.type === 'cow') sfx('moo', this.x);
      }
      return;
    }
    if (this.state === 'fade') {
      if ((this.fadeT -= dt) <= 0) this.dead = true;
      return;
    }
    // 'live'
    if (this.type === 'mushroom') this.k = Math.min(1, this.k + 2.5 * dt);
    if (this.type === 'cow') this.run(dt);
    else if (ANIMALS[this.type]) ANIMALS[this.type].update(this, dt);
    else if (!settle(this)) { this.state = 'fall'; this.vy = 0; }   // nét đỡ mất thì rơi
    if (this.age > LIFE[this.type]) this.fade();
    if (this.type === 'fire' && Math.random() < 14 * dt)
      fx.push({ type: 'ember', x: this.x + rand(-8, 8), y: this.y - rand(10, 30), vy: -rand(40, 90), t: 0, life: rand(0.5, 0.9) });
  }
  fade() { this.state = 'fade'; this.fadeT = 1.2; }
  run(dt) {                        // con bò chạy lung tung trên nét
    if (this.air) {
      if (airStep(this, dt, G_I, VT_I, 30)) this.air = false;
      return;
    }
    if (!settle(this)) { this.air = true; this.vx = this.dir * 60; this.vy = 0; return; }
    this.acc += this.speed * dt;
    while (this.acc >= 1) {
      this.acc -= 1;
      const r = walkStep(this, 4, 34);
      if (r === 'wall') { this.dir *= -1; this.acc = 0; break; }
      if (r === 'fall') { this.air = true; this.vx = this.dir * this.speed * 0.8; this.vy = 0; break; }
    }
    if (Math.random() < 0.3 * dt) {                    // thỉnh thoảng nhảy cẫng, có khi "ụm bò"
      this.air = true; this.vx = this.dir * this.speed; this.vy = -rand(260, 380);
      if (Math.random() < 0.3) sfx('moo', this.x);
    }
  }
  render(dt) {
    const a = this.state === 'fade' ? Math.max(0, this.fadeT / 1.2) : 1;
    this.g.position.set(this.x, this.y); this.g.rotation = this.rot; this.g.alpha = a;
    if (this.type === 'mushroom') this.g.scale.set(this.k * (1 + 0.25 * this.squash), this.k * (1 - 0.35 * this.squash));
    else if (this.type === 'cow') this.g.scale.set(this.dir, 1);
    else if (this.type === 'fire') this.g.scale.set(a);
    else if (ANIMALS[this.type]) {           // xoay/lật quanh giữa thân (nhào lộn, lật ngửa)
      this.g.pivot.set(0, -this.midY); this.g.position.set(this.x, this.y - this.midY + (this.sink || 0));
      this.g.scale.set(this.dir, this.flipY ? -1 : 1);
    }
    if ((this.redrawIn -= dt) <= 0) { this.redrawIn = this.type === 'fire' ? 0.06 : 0.085; drawItem(this.g, this.type, this); }
    if (this.gl) {
      this.gl.visible = true;
      this.gl.position.set(this.x, this.y - 18);
      this.gl.scale.set(0.95 + Math.random() * 0.12);
      this.gl.alpha = 0.5 * a;
    }
  }
  destroy() { this.g.destroy(); this.gl && this.gl.destroy(); }
}

// Vẽ vật ở tọa độ local: đế tại (0,0), mặt hướng +x
function drawItem(g, type, it) {
  g.clear();
  if (type === 'ladder') {
    const h = it.h;
    g.moveTo(-9 + J(0.5), 0).lineTo(-9 + J(0.7), -h);
    g.moveTo(9 + J(0.5), 0).lineTo(9 + J(0.7), -h);
    for (let y = -12; y > -h + 6; y -= 15)
      g.moveTo(-9 + J(0.4), y + J(0.5)).lineTo(9 + J(0.4), y + J(0.5));
    g.stroke(chalk(2.6));
  } else if (type === 'mushroom') {
    g.roundRect(-7, -17, 14, 17, 5).fill({ color: 0xfdf4e6, alpha: 0.95 }).stroke(chalk(2.2));
    g.moveTo(-27, -14).bezierCurveTo(-27, -51, 27, -51, 27, -14).closePath()   // vòm mũ cao tới -42 = mốc va chạm của Person
      .fill(0xff4d7d).stroke(chalk(2.4));
    g.circle(-12, -27, 3.8).circle(3, -35, 3.2).circle(15, -23, 3).fill(CH);
  } else if (type === 'fire') {
    const flames = [[17, 40, 0xff4b2e], [12, 28, 0xff9a2e], [6.5, 16, 0xffe46a]];
    for (const [w, h, c] of flames) {
      const hh = h * rand(0.85, 1.15), tipX = J(2);
      g.moveTo(-w / 2, 0)
        .quadraticCurveTo(-w, -hh * 0.5, tipX, -hh)
        .quadraticCurveTo(w, -hh * 0.5, w / 2, 0)
        .closePath().fill(c);
    }
  } else if (type === 'cow') {
    // 4 chân que
    const legs = [-19, -12, 13, 20];
    for (let i = 0; i < 4; i++) {
      const lx = legs[i];
      const dx = it.air ? (i % 2 ? 3 : -3) : Math.sin(it.anim * 14 + (i % 2) * Math.PI) * 6;
      g.moveTo(lx, -14).lineTo(lx + dx, 0);
    }
    g.moveTo(-25, -30).quadraticCurveTo(-33, -26 + J(1), -31, -18);   // đuôi cong ra sau
    g.stroke(chalk(2.2));
    g.ellipse(0, -25, 27, 14).fill(0xffd9ea).stroke(chalk(2.4));      // thân
    g.ellipse(-8, -28, 8, 5).ellipse(10, -21, 6, 4).fill(0xff8fc0);   // đốm
    g.moveTo(22, -40).lineTo(20, -46); g.moveTo(30, -41).lineTo(32, -47); g.stroke(chalk(2)); // sừng
    g.ellipse(29, -33, 11, 9).fill(0xffd9ea).stroke(chalk(2.2));      // đầu
    g.ellipse(37, -29, 6, 4.5).fill(0xff9fc8).stroke(chalk(1.6));     // mõm
    g.circle(31, -35, 1.6).fill(0x1f4f52);                            // mắt
  } else if (ANIMALS[type]) {
    ANIMALS[type].draw(g, it);
  } else if (type === 'berry') {
    drawBerry(g, 0, -17, 1);           // hàm của ground.js
  } else if (type === 'star') {
    g.star(0, 0, 5, 12, 6, 0).stroke({ width: 2.4, color: 0xffe45c, join: 'round' });
  }
}

function trimItems() {                 // quá MAX_ITEMS → vật cũ nhất mờ dần
  const live = items.filter(i => i.state !== 'fade');
  for (let i = 0; i < live.length - MAX_ITEMS; i++) live[i].fade();
}

class Bubble {
  constructor() {
    this.x = rand(80, WW - 80); this.y = rand(170, GY - 300);
    this.r = rand(30, 38); this.vx = rand(-16, 16); this.vy = rand(-7, 7);
    this.t = rand(0, 6); this.k = 0;              // nở dần
    this.type = pick(ITEM_TYPES); this.dead = false; this.redrawIn = 0;
    this.c = put(new PIXI.Container(), bubbleLayer);
    this.ring = put(new PIXI.Graphics(), this.c);
    this.icon = put(new PIXI.Graphics(), this.c);
    const [sc, oy] = ICON[this.type];
    this.icon.scale.set(sc); this.icon.position.set(0, oy);
    drawItem(this.icon, this.type, { h: 110, anim: 0, air: true });   // vật thu nhỏ, vẽ 1 lần
  }
  update(dt) {
    this.t += dt; this.k = Math.min(1, this.k + 1.2 * dt);
    this.x += this.vx * dt; this.y += (this.vy + Math.sin(this.t * 1.3) * 9) * dt;
    if (this.x < 60) this.vx = Math.abs(this.vx);
    if (this.x > WW - 60) this.vx = -Math.abs(this.vx);
    if (this.y < 150) this.vy = Math.abs(this.vy) + 2;
    if (this.y > GY - 250) this.vy = -Math.abs(this.vy) - 2;
  }
  pop() {
    this.dead = true;
    sfx('pop', this.x);
    fx.push({ type: 'pop', x: this.x, y: this.y, t: 0, life: 0.35, r0: this.r });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + rand(-0.2, 0.2);
      fx.push({ type: 'drop', x: this.x + Math.cos(a) * this.r, y: this.y + Math.sin(a) * this.r,
        vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, t: 0, life: 0.5 });
    }
    if (this.type === 'star') burst(this.x, this.y, 0xffe45c);
    else { items.push(new Item(this.type, this.x, this.y + 8)); trimItems(); }
    bubbleCD = rand(2, 5);             // hẹn giờ bong bóng mới (biến let của core)
  }
  render(dt) {
    this.c.position.set(this.x, this.y);
    this.c.scale.set(this.k * (1 + 0.03 * Math.sin(this.t * 2.2)));
    if ((this.redrawIn -= dt) <= 0) {
      this.redrawIn = 0.125;
      const g = this.ring, r = this.r;
      g.clear();
      g.circle(0, 0, r).fill({ color: CH, alpha: 0.06 }).stroke(chalk(2.2, 0.85));
      g.circle(0.36 * r + J(0.3), -0.44 * r, 0.19 * r).fill({ color: CH, alpha: 0.95 });
      g.circle(0.62 * r, -0.14 * r, 0.09 * r).fill({ color: CH, alpha: 0.9 });
    }
  }
  destroy() { this.c.destroy({ children: true }); }
}

const flock = { x: 200, y: 180, tx: 600, ty: 200, t: 0, cd: 6 + Math.random() * 4, mode: 'fly' }; // tâm đàn chim

class Bird {
  constructor(i) {
    this.ox = rand(-70, 70); this.oy = rand(-35, 35);   // chỗ trong đàn
    this.x = flock.x + this.ox; this.y = flock.y + this.oy;
    this.vx = 0; this.vy = 0; this.flap = rand(0, 6);
    this.color = i % 3 ? 0xffa6d2 : CH;
    this.state = 'fly'; this.face = 1; this.line = null; this.px = 0; this.py = 0; this.t = 0;
    this.g = put(new PIXI.Graphics(), skyLayer); this.redrawIn = 0;
  }
  update(dt) {
    if (this.state === 'perch') {
      this.t -= dt;
      if (this.t <= 0 || !this.line || this.line.dead || this.line.fading) { this.state = 'fly'; this.vy = -120; sfx('chirp', this.x); }
      return;
    }
    let tx, ty, spd;
    if (this.state === 'land') {
      if (!this.line || this.line.dead || this.line.fading) { this.state = 'fly'; return; }
      tx = this.px; ty = this.py; spd = 110;
      const dx = tx - this.x, dy = ty - this.y;
      if (Math.hypot(dx, dy) < 4) {
        this.state = 'perch'; this.x = tx; this.y = ty; this.t = rand(2, 5); this.vx = this.vy = 0; sfx('chirp', this.x);
        return;
      }
    } else {  // 'fly': bám theo tâm đàn + lắc nhẹ
      tx = flock.x + this.ox + Math.sin(flock.t * 1.7 + this.ox) * 12;
      ty = flock.y + this.oy + Math.cos(flock.t * 1.3 + this.oy) * 8;
      spd = 150;
    }
    // lái mượt về đích
    const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy) || 1;
    const want = Math.min(spd, d * 3), k = Math.min(1, 2.5 * dt);
    this.vx += ((dx / d) * want - this.vx) * k;
    this.vy += ((dy / d) * want - this.vy) * k;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.flap += 16 * dt;
    if (Math.abs(this.vx) > 8) this.face = Math.sign(this.vx);
  }
  render(dt) {
    this.g.position.set(this.x, this.y); this.g.scale.set(this.face, 1);
    if ((this.redrawIn -= dt) <= 0) { this.redrawIn = 0.085; drawBird(this.g, this); }
  }
  destroy() { this.g.destroy(); }
}

function updateFlock(dt) {
  flock.t += dt;
  if (flock.mode === 'fly') {
    const dx = flock.tx - flock.x, dy = flock.ty - flock.y, d = Math.hypot(dx, dy);
    if (d < 20) { flock.tx = rand(120, WW - 120); flock.ty = rand(90, 360); }
    else { flock.x += (dx / d) * 95 * dt; flock.y += (dy / d) * 95 * dt; }
    if ((flock.cd -= dt) <= 0) {
      const cand = lines.filter(l => !l.drawing && !l.dead && !l.fading && l.pts.length >= 16 && l.age < LINE_LIFE - 8);
      if (cand.length) {
        const l = pick(cand), n = l.pts.length / 2;
        const c = (Math.random() * n) | 0;
        for (const b of birds) {
          const i = clamp(c + Math.round(rand(-7, 7)), 0, n - 1);
          b.line = l; b.px = l.pts[2 * i]; b.py = topAt(l.pts[2 * i], l.pts[2 * i + 1]);
          b.state = 'land';
        }
        flock.x = l.pts[2 * c]; flock.y = l.pts[2 * c + 1] - 60; flock.mode = 'rest';
      } else flock.cd = 3;
    }
  } else {  // 'rest': chờ mọi chim bay lại
    if (birds.every(b => b.state === 'fly')) {
      flock.mode = 'fly'; flock.cd = rand(8, 15);
      let mx = 0, my = 0;
      for (const b of birds) { mx += b.x; my += b.y; }
      flock.x = mx / birds.length; flock.y = my / birds.length;
      flock.tx = rand(120, WW - 120); flock.ty = rand(90, 360);
    }
  }
}

function drawBird(g, b) {              // chim giấy ~18px, mặt +x
  g.clear();
  if (b.state === 'perch') {
    g.poly([-9, -4, 5, -6, 9, -5, 5, -2, -3, -1], true).fill(b.color);          // thân đậu
    g.poly([-7, -5, 3, -6, -9, -9], true).fill({ color: b.color, alpha: 0.85 }); // cánh gập
  } else {
    g.poly([-9, 0, 5, -2, 9, -1, 5, 2], true).fill(b.color);                     // thân bay
    g.poly([-3, -1, 4, -1, -1, -1 - 11 * Math.sin(b.flap)], true)
      .fill({ color: b.color, alpha: 0.9 });                                     // cánh vỗ
  }
}
