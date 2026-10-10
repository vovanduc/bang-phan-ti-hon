/* sky.js — slice S: mây, mưa, sao, mặt trời
 * Top-level: Cloud, updateRain, Star, burst, makeSun
 */

// ===== Mây phấn: cụm vòng tròn viền trắng trôi ngang, chạm vào thì mưa =====
class Cloud {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.w = rand(110, 150); this.h = this.w * 0.5;
    this.speed = rand(5, 11) * (Math.random() < 0.5 ? 1 : -1);
    this.rain = 0;                    // giây còn mưa (Person gán Math.max(rain,5) khi chạm)
    this.acc = 0;                     // tích lũy giọt mưa
    this.poke = 0;                    // xung phồng khi bị chạm
    // các puff theo tỷ lệ w: [dx, dy, r]
    this.puffs = [[-0.3, 0.12, 0.2], [0, 0.16, 0.22], [0.3, 0.12, 0.19], [-0.13, -0.12, 0.23], [0.15, -0.1, 0.21]]
      .map(p => [p[0] * this.w, p[1] * this.w, p[2] * this.w]);
    this.g = put(new PIXI.Graphics(), skyLayer);
    this.redrawIn = 0;
  }
  tap() {                              // chạm mây → thêm mưa, phồng nhẹ
    this.rain = Math.min(12, Math.max(this.rain, 0) + 6);
    this.poke = 1;
    sfx('rain', this.x);
  }
  update(dt) {
    this.x += this.speed * dt;
    if (this.x > WW + this.w) this.x = -this.w;         // quấn vòng mép màn
    else if (this.x < -this.w) this.x = WW + this.w;
    this.poke *= Math.exp(-4 * dt);
    if (this.rain > 0) {
      this.rain -= dt;
      this.acc += 95 * dt;                             // ~95 giọt/s rải khắp bề rộng mây
      while (this.acc >= 1) {
        this.acc -= 1;
        drops.push({ x: this.x + rand(-0.4, 0.4) * this.w, y: this.y + this.h * 0.4, v: rand(650, 850), len: rand(14, 26) });
      }
    }
  }
  render(dt) {
    const g = this.g;
    g.position.set(this.x, this.y);
    g.scale.set(1 + 0.08 * this.poke);
    this.redrawIn -= dt;
    if (this.redrawIn <= 0) {                          // ~10fps nét phấn run
      this.redrawIn = rand(0.09, 0.11);
      g.clear();
      for (const p of this.puffs) g.circle(p[0] + J(0.5), p[1] + J(0.5), p[2]);
      g.stroke(chalk(5, 0.95));
      for (const p of this.puffs) g.circle(p[0], p[1], p[2] - 0.5);
      g.fill(boardAt(this.y));                         // che cung trong → chỉ còn viền ngoài cụm
    }
  }
}

// ===== Mưa: core vẽ, ở đây cập nhật; giọt chạm mặt thì tưới (waterAt của ground.js) =====
function updateRain(dt) {
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    const ny = d.y + d.v * dt;
    const hit = firstSolid(d.x, d.y, ny);
    if (hit < 0) {
      d.y = ny;
      if (d.y > WH) swapRemove(drops, i);
    } else {
      swapRemove(drops, i);
      waterAt(d.x, hit - 1, hit >= GY);                // hit-1 = hàng chân ngay trên mặt
    }
  }
}

// ===== Sao: ngôi sao 5 cánh viền màu, lấp lánh + bập bềnh; chạm → burst() =====
class Star {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.r = rand(9, 13);
    this.color = pick(STAR_C);
    this.t = rand(0, 6);
    this.k = 0;                                        // hiện dần 0→1
    this.g = put(new PIXI.Graphics(), skyLayer);
    this.redrawIn = 0;
  }
  update(dt) {
    this.t += dt;
    this.k = Math.min(1, this.k + 1.5 * dt);
  }
  render(dt) {
    const g = this.g;
    g.position.set(this.x, this.y + Math.sin(this.t * 0.8) * 3);
    g.scale.set(this.k * (0.9 + 0.12 * Math.sin(this.t * 3)));
    g.rotation = Math.sin(this.t * 0.7) * 0.15;
    this.redrawIn -= dt;
    if (this.redrawIn <= 0) {                          // ~8fps
      this.redrawIn = 0.125;
      g.clear();
      g.star(J(0.3), J(0.3), 5, this.r, this.r * 0.5, 0)
        .stroke({ width: 2.4, color: this.color, alpha: 0.95, join: 'round' });
    }
  }
  destroy() { this.g.destroy(); }
}

// ===== Nổ sao: flash + tia lửa + vài hạt giống + tối đa 2 sao mới =====
function burst(x, y, color, star) {
  if (star) {
    const i = stars.indexOf(star);
    if (i >= 0) stars.splice(i, 1);
    star.destroy();
  }
  sfx('burst', x);
  fx.push({ type: 'flash', x, y, t: 0, life: 0.7, sprite: glow(color) });
  for (let i = 0; i < 22; i++) {                       // tia lửa hình sao/hoa bay ra
    const a = rand(0, Math.PI * 2), v = rand(70, 260);
    fx.push({
      type: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      t: 0, life: rand(2.2, 3.8), c: pick(STAR_C), r: rand(4, 8),
      shape: Math.random() < 0.6 ? 'star' : 'flower', rot: rand(0, 6),
    });
  }
  for (let i = 0; i < 3; i++)                          // "vài sao thành hạt giống"
    fx.push({ type: 'seed', x, y, vx: (i % 2 ? 1 : -1) * rand(60, 160), vy: -rand(40, 140), t: 0, delay: rand(0.5, 0.9) });
  for (let i = 0; i < 2 && stars.length < MAX_STARS; i++)   // "thêm sao", kẹp trong vùng trời
    stars.push(new Star(clamp(x + rand(-160, 160), 40, WW - 40), clamp(y + rand(-90, 60), 50, GY - 330)));
}

// ===== Mặt trời: chạm → sáng rực 8s, chiếu vệt nắng nghiêng xuống đất =====
function makeSun() {
  return {
    x: WW - 150, y: 112, r: 28, on: 0, id: 0, t: 0, redrawIn: 0,
    g: put(new PIXI.Graphics(), skyLayer), gl: glow(0xfff0a0),
    shine() { this.on = 8; this.id++; sfx('sun', this.x); },   // id mới → người chưa tắm được tắm lại
    lit(x, y) {                                        // điểm chân có trong vệt nắng không
      const t = (y - this.y) / (GY - this.y);
      return t > 0 && Math.abs(x - this.x) < this.r + (BEAM - this.r) * t;
    },
    update(dt) { this.t += dt; if (this.on > 0) this.on -= dt; },
    render(dt) {
      const a = clamp(this.on, 0, 1);                  // tắt dần trong giây cuối
      const g = this.g;
      g.position.set(this.x, this.y);
      g.rotation = this.t * (0.05 + a * 0.6);          // xoay nhanh hơn khi sáng
      this.redrawIn -= dt;
      if (this.redrawIn <= 0) {                        // ~10fps
        this.redrawIn = rand(0.09, 0.11);
        g.clear();
        g.circle(J(0.5), J(0.5), this.r);
        if (a > 0) g.fill({ color: 0xfff3b0, alpha: 0.35 * a });
        g.stroke(chalk(3));
        const len = 10 + 12 * a;
        for (let i = 0; i < 12; i++) {                 // 12 tia quanh đĩa mặt trời
          const ang = i * Math.PI / 6, r0 = this.r + 7;
          const c = Math.cos(ang), s = Math.sin(ang);
          g.moveTo(c * r0, s * r0).lineTo(c * (r0 + len + J(1.5)), s * (r0 + len + J(1.5)));
        }
        g.stroke(chalk(2.6));
      }
      this.gl.visible = a > 0;
      if (a > 0) {
        this.gl.position.set(this.x, this.y);
        this.gl.scale.set(2.2 + 1.5 * a + 0.1 * Math.sin(4 * this.t));
        this.gl.alpha = a;
      }
      beamG.clear();                                   // vệt nắng: 2 hình thang trong suốt
      if (a > 0) {
        beamG.poly([this.x - this.r, this.y, this.x + this.r, this.y, this.x + BEAM, GY, this.x - BEAM, GY], true)
          .fill({ color: 0xfff6c4, alpha: 0.13 * a });
        beamG.poly([this.x - this.r * 0.6, this.y, this.x + this.r * 0.6, this.y, this.x + BEAM * 0.6, GY, this.x - BEAM * 0.6, GY], true)
          .fill({ color: 0xfff6c4, alpha: 0.08 * a });
      }
    },
  };
}
