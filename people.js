/* Bảng phấn tí hon — người tí hon (slice P)
 * Đi / cưỡi đầu nhau / leo thang / bay. Nét phấn tự vẽ, không asset.
 * Chỉ khai báo — PIXI và layer chỉ đụng sau boot(), trong constructor/method.
 */

class Person {
  constructor(x, dir) {
    this.x = Math.round(x); this.y = GY - 1; this.rx = this.x; this.ry = this.y;
    this.vx = this.vy = 0; this.dir = dir; this.acc = 0;
    this.s = rand(0.9, 1.08); this.speed = rand(36, 54); this.hat = pick(HATS);
    this.state = 'walk'; this.anim = rand(0, 6.3);
    this.idleT = 0; this.nextIdle = rand(3, 12);
    this.eatT = 0; this.eat = null;
    this.spinT = 0; this.glowT = 0; this.sunId = -1;
    this.hotT = 0; this.surpriseT = 0; this.rot = 0; this.rotV = 0;
    this.carrier = null; this.rider = null; this.ox = 0;
    this.ladder = null; this.seen = null; this.bumpCD = rand(0, 2);
    this.g = put(new PIXI.Graphics(), peopleLayer);
    this.g.pivot.set(0, -30);                 // xoay quanh giữa thân, chân vẫn ở (x, y)
    this.redrawIn = 0; this.gl = null;        // glow tạo lười lúc tắm nắng
  }
  get busy() { return this.idleT > 0 || this.eatT > 0 || this.spinT > 0; }

  detach() {
    if (this.carrier) { this.carrier.rider = null; this.carrier = null; }
    this.ladder = null;
    if (this.eat) { this.eat.taken = null; this.eat = null; this.eatT = 0; }
  }
  fly(vx, vy) { this.detach(); this.state = 'air'; this.vx = vx; this.vy = vy; this.idleT = 0; }
  mount(q) {
    this.detach();
    this.carrier = q; q.rider = this; this.state = 'ride';
    this.ox = clamp(this.x - q.x, -8, 8); this.rot = this.rotV = 0; this.bumpCD = 2;
    sfx('stack', this.x);
  }
  poke() {                                  // bị chạm: giật mình nhảy, giơ tay, miệng "o"
    this.surpriseT = 1;
    sfx('ouch', this.x, { pitch: 2 - this.s });          // 「イテテ！」 — người nhỏ giọng cao hơn
    if (this.state !== 'air') this.fly(0, -rand(300, 360));
  }
  startEat(b) {
    this.eat = b; b.taken = this; this.eatT = 1.4;
    const bx = b.plant ? b.plant.x + BERRY_AT[b.slot][0] : b.x;
    if (Math.abs(bx - this.x) > 2) this.dir = Math.sign(bx - this.x) || this.dir;
  }
  finishEat() {
    const b = this.eat; this.eat = null;
    if (!b) return;
    if (b.plant) b.plant.berries.splice(b.plant.berries.indexOf(b), 1); else b.dead = true;
    const y = this.y - 70 * this.s;
    fx.push({ type: 'heart', x: this.x - 6, y, vy: -rand(30, 50), t: 0, life: 1.4 });
    fx.push({ type: 'heart', x: this.x + 6, y, vy: -rand(30, 50), t: -0.25, life: 1.4 });
    sfx('eat', this.x);
    if (this.state === 'walk') this.fly(0, -240);
  }

  update(dt) {
    this.bumpCD -= dt; this.hotT -= dt; this.surpriseT -= dt; this.glowT -= dt;
    if (this.spinT > 0) this.spinT -= dt;
    if (this.eatT > 0) { this.eatT -= dt; if (this.eatT <= 0) this.finishEat(); }
    if (this.state === 'walk') this.walk(dt);
    else if (this.state === 'ride') this.ride(dt);
    else if (this.state === 'climb') this.climb(dt);
    else this.air(dt);
    this.touch();
    const step = (this.state === 'walk' || this.state === 'ride') && !this.busy;
    this.anim += dt * (step ? this.speed * 0.19 : this.state === 'climb' ? 9 : 3);
  }

  walk(dt) {
    if (!settle(this)) { this.fly(this.dir * this.speed * 0.5, 0); return; }   // nét dưới chân mất
    if (this.busy) {
      if (this.idleT > 0) { this.idleT -= dt; if (this.idleT <= 0 && Math.random() < 0.3) this.dir *= -1; }
      return;
    }
    if ((this.nextIdle -= dt) <= 0) { this.idleT = rand(0.7, 2.5); this.nextIdle = rand(5, 14); return; }
    this.acc += this.speed * dt;
    while (this.acc >= 1) {
      this.acc -= 1;
      const r = walkStep(this, STEP_UP, BODY_H * this.s);   // mép màn: walkStep trả 'wall', không tự xử lý
      if (r === 'wall') { this.dir *= -1; this.acc = 0; break; }
      if (r === 'fall') { this.fly(this.dir * this.speed, 0); return; }
    }
    this.look();
  }

  look() {
    for (const it of items) {
      if (it.state !== 'live' || Math.abs(it.y - this.y) > 10) continue;
      if (it.type === 'ladder' && Math.abs(it.x - this.x) < 2 && this.seen !== it) {
        this.seen = it;
        if (Math.random() < 0.8) { this.detach(); this.state = 'climb'; this.ladder = it; this.x = it.x; sfx('climb', this.x); }
        return;
      }
      if (it.type === 'mushroom' && Math.abs(it.x - this.x) < 12 * it.k) {
        it.squash = 1; sfx('boing', this.x); this.fly(this.dir * rand(40, 160), -rand(1050, 1250)); return;
      }
      if (it.type === 'berry' && Math.abs(it.x - this.x) < 8 && !it.taken) { this.startEat(it); return; }
    }
    for (const s of seeds) {
      if (s.stage !== 4 || Math.abs(s.y - this.y) > 10 || Math.abs(s.x - this.x) >= 2 || this.seen === s) continue;
      this.seen = s;
      const b = s.berries.find(bb => bb.taken == null);
      if (b) { this.startEat(b); return; }
    }
    if (this.bumpCD > 0) return;
    for (const q of people) {
      if (q === this || q.state !== 'walk') continue;
      const ahead = (q.x - this.x) * this.dir;
      if (ahead < 3 || ahead > 12 || Math.abs(q.y - this.y) > 5) continue;
      if (q.dir === this.dir && !q.busy && q.speed >= this.speed) continue;
      this.bumpCD = 2.5;
      if (Math.random() < 0.55) {            // trèo lên đỉnh tháp; 45% đi xuyên
        let top = q, d = 1;
        while (top.rider) { top = top.rider; d++; }
        if (d < MAX_TOWER) this.mount(top);
      }
      return;
    }
  }

  ride(dt) {
    const c = this.carrier;
    if (!c || c.state === 'air' || c.state === 'climb') { this.fly(this.dir * 40, -60); return; }  // tháp đổ
    if (this.idleT > 0) this.idleT -= dt;
    else if (!this.busy) this.ox += this.dir * this.speed * 0.4 * dt;
    this.x = c.x + this.ox; this.y = c.y - HEAD_TOP * c.s;
    if (Math.abs(this.ox) > 11 * c.s) this.fly(this.dir * rand(50, 90), -rand(140, 220));
  }

  climb(dt) {
    const L = this.ladder;
    if (!L || L.state !== 'live') { this.fly(0, 0); return; }
    this.x = L.x;
    let wait = false;
    for (const q of people) {               // xếp hàng: có người trong 44px phía trên thì đứng chờ
      if (q !== this && q.state === 'climb' && q.ladder === L && q.y < this.y && this.y - q.y < 44) { wait = true; break; }
    }
    if (!wait) this.y -= 55 * dt;
    if (this.y <= L.y - L.h + 4) { sfx('hop', this.x); this.fly(this.dir * rand(60, 150), -rand(220, 340)); }
  }

  air(dt) {
    this.rot += this.rotV * dt;
    if (this.vy > 0) {
      for (const it of items) {
        if (it.type !== 'mushroom' || it.state !== 'live') continue;
        const top = it.y - 42 * it.k;
        if (Math.abs(it.x - this.x) < 27 * it.k && this.y <= top && top <= this.y + this.vy * dt) {
          it.squash = 1; sfx('boing', this.x); this.vy = -rand(1000, 1200); this.vx = this.dir * rand(40, 150);
          this.rot = this.rotV = 0; return;
        }
      }
      for (const q of people) {
        if (q === this || q.rider || q.state === 'air' || q.state === 'climb') continue;
        const top = q.y - HEAD_TOP * q.s;
        if (Math.abs(q.x - this.x) < 9 && this.y <= top && top <= this.y + this.vy * dt && towerDepth(q) < MAX_TOWER) {
          this.mount(q); return;
        }
      }
    }
    if (airStep(this, dt, G_P, VT_P, BODY_H * this.s)) {
      this.x = Math.round(this.x); this.y = Math.round(this.y);
      this.state = 'walk'; this.acc = 0;
      if (this.rotV) this.idleT = 0.7;       // bò húc xong: chạm đất là choáng
      this.rot = this.rotV = 0;
    }
  }

  touch() {
    const hx = this.x, hy = this.y - 42 * this.s;
    for (const it of items) {
      if (it.type === 'fire' && (it.state === 'fall' || it.state === 'live') && this.hotT <= 0
          && Math.abs(it.x - this.x) < 22 && it.y - 44 < this.y && this.y < it.y + 30) {
        const away = Math.sign(this.x - it.x) || -this.dir;
        this.dir = away; this.hotT = 1.1; this.surpriseT = 1;
        sfx('hot', this.x, { pitch: 2 - this.s });          // 「あちち」
        this.fly(away * rand(170, 250), -rand(380, 480)); return;
      }
      if (it.type === 'cow' && it.state === 'live' && !it.air && this.state !== 'air'
          && Math.abs(it.x + it.dir * 10 - this.x) < 26 && Math.abs(it.y - this.y) < 26) {
        this.surpriseT = 1.2; this.rotV = rand(7, 12) * it.dir;
        sfx('bonk', this.x);
        this.fly(it.dir * rand(240, 360), -rand(430, 620)); return;
      }
    }
    if (sun.on > 0 && this.sunId !== sun.id && this.state !== 'air' && this.state !== 'climb' && sun.lit(this.x, this.y)) {
      this.sunId = sun.id; this.spinT = 2.2; this.glowT = 9; sfx('spin', this.x);
    }
    for (const s of stars) {
      if (s.k > 0.8 && Math.abs(s.x - hx) < 20 && Math.abs(s.y - hy) < 26) { burst(s.x, s.y, s.color, s); break; }
    }
    for (const c of clouds) {
      if (Math.abs(c.x - hx) < c.w * 0.45 && Math.abs(c.y - hy) < c.h * 0.55) { if (c.rain <= 0) sfx('rain', c.x); c.rain = Math.max(c.rain, 5); }
    }
  }

  render(dt) {
    const k = this.state === 'air' ? 1 : Math.min(1, dt * (this.state === 'ride' ? 9 : 20));
    this.rx += (this.x - this.rx) * k; this.ry += (this.y - this.ry) * k;
    this.g.position.set(this.rx, this.ry - 30 * this.s);
    this.g.scale.set(this.s * this.dir * (this.spinT > 0 ? Math.cos(this.spinT * 14) : 1), this.s);
    this.g.rotation = this.rot;
    if ((this.redrawIn -= dt) <= 0) { this.redrawIn = rand(0.075, 0.095); drawPerson(this.g, this); }
    if (this.glowT > 0) {
      this.gl = this.gl || glow(0xfff4b8);
      this.gl.visible = true;
      this.gl.position.set(this.rx, this.ry - 32 * this.s);
      this.gl.scale.set(1.1 + 0.08 * Math.sin(this.anim * 3));
      this.gl.alpha = Math.min(1, this.glowT / 2) * 0.9;
    } else if (this.gl) this.gl.visible = false;
  }
}

// 1 = đứng đất; cộng thêm mỗi carrier phía dưới
function towerDepth(q) {
  let d = 1, c = q.carrier;
  while (c) { d++; c = c.carrier; }
  return d;
}

// Local: chân (0,0), mặt +x, chóp mũ ~-67. Caller lật hướng bằng scale.x.
function drawPerson(g, p) {
  g.clear();
  const walking = (p.state === 'walk' || p.state === 'ride') && !p.busy;
  const air = p.state === 'air', climb = p.state === 'climb';
  const up = air || climb || p.spinT > 0 || p.surpriseT > 0;
  const a = p.anim, sw = walking ? Math.sin(a) : 0, ca = Math.cos(a);
  let lfx, lfy, rfx, rfy;
  if (air) { lfx = -5; lfy = -1; rfx = 5; rfy = -4; }
  else if (climb) { const s = Math.sin(a); lfx = -4; lfy = -2 + s * 4; rfx = 4; rfy = -2 - s * 4; }
  else if (walking) { lfx = sw * 7; lfy = -Math.max(0, ca) * 3; rfx = -sw * 7; rfy = -Math.max(0, -ca) * 3; }
  else { lfx = -3.5; lfy = 0; rfx = 3.5; rfy = 0; }
  let lax, lay, rax, ray;
  if (p.eatT > 0) { lax = -6; lay = -17; rax = 9; ray = -40 + Math.sin(a * 5) * 2; }
  else if (up) { const w = Math.sin(a * 3) * 2; lax = -9; lay = -39 + w; rax = 9; ray = -39 - w; }
  else { lax = -sw * 6 - 2; lay = -16; rax = sw * 6 + 2; ray = -16; }   // đứng = bước đi lúc sw = 0

  g.moveTo(-1.5, -15).lineTo(lfx + J(), lfy + J());
  g.moveTo(1.5, -15).lineTo(rfx + J(), rfy + J());
  g.moveTo(-2, -26).lineTo(lax + J(), lay + J());
  g.moveTo(2, -26).lineTo(rax + J(), ray + J());
  g.stroke(chalk(2.3));

  const j = v => v + J(0.4);
  g.poly([j(-4), j(-29), j(-6.5), j(-15), j(6.5), j(-15), j(4), j(-29)], true);
  g.fill({ color: HEADFILL, alpha: 0.55 }); g.stroke(chalk(2.2));
  g.poly([-3.2, -28.6, 3.2, -28.6, 0.4, -19], true).fill(p.hat);

  const hx = J(0.35), hy = -40 + J(0.35);
  g.circle(hx, hy, 11).fill({ color: HEADFILL, alpha: 0.6 }).stroke(chalk(2.4));
  g.circle(hx + 5.5, hy - 1.5, 1.5).fill(CH);
  if (p.surpriseT > 0 || p.eatT > 0) g.circle(hx + 7.2, hy + 5, 1.7).stroke(chalk(1.3));
  g.poly([hx - 11, hy - 4, hx + 8, hy - 7.5, hx - 8 + J(0.6), hy - 27 + J(0.6)], true);
  g.fill(p.hat); g.stroke(chalk(2.2));
}
