/* Bảng phấn tí hon — NIGHT: ngày ↔ đêm, mặt trăng, đom đóm, người tí hon đi ngủ
 * Top-level: makeNight, Firefly + helper ngt_*. Chỉ khai báo — PIXI/layer chỉ đụng sau boot().
 */

const ngt_DAY = 150, ngt_NIGHT = 90;    // giây: ngày tự tối sau 150s, đêm tự sáng sau 90s

function makeNight() {
  return {
    k: 0, phase: 'day', t: 0, holdId: null, holdT: 0, cricketIn: 2,
    g: put(new PIXI.Graphics(), nightLayer),            // lớp phủ xanh đêm ngay trên mặt bảng, dưới nét phấn
    moon: put(new PIXI.Graphics(), skyLayer), moonIn: 0,
    get dark() { return this.k > 0.8; },
    fall() { if (this.phase === 'night') return; this.phase = 'night'; this.t = 0; sun.on = 0; sfx('dusk', sun.x); },
    rise() { if (this.phase === 'day') return; this.phase = 'day'; this.t = 0; sfx('dawn', sun.x); },
    hold(id) { this.holdId = id; this.holdT = 0; },       // bấm giữ mặt trời 1s → đêm
    release(id) { if (this.holdId === id) this.holdId = null; },
    tap() { if (this.phase === 'night') this.rise(); else sun.shine(); },
    update(dt) {
      this.t += dt;
      if (this.holdId !== null && (this.holdT += dt) >= 1) { this.holdId = null; this.fall(); }
      if (this.phase === 'day' && this.t >= ngt_DAY) this.fall();
      else if (this.phase === 'night' && this.t >= ngt_NIGHT) this.rise();
      this.k = clamp(this.k + (this.phase === 'night' ? 1 : -1) * dt / 6, 0, 1);   // chạng vạng / bình minh 6s

      if (this.k > 0.5 && fireflies.length < MAX_FIREFLIES && Math.random() < 3 * dt) fireflies.push(new Firefly());
      for (const f of fireflies) f.update(dt, this.k);
      for (let i = fireflies.length - 1; i >= 0; i--) if (fireflies[i].dead) { fireflies[i].destroy(); fireflies.splice(i, 1); }

      for (const p of people) {
        if (p.yawnT > 0 && (p.yawnT -= dt) <= 0) {
          if (this.dark && p.state === 'walk' && !p.panic) p.sleep = true;
        }
        if (p.sleep) {
          if (!this.dark && Math.random() < 1.2 * dt) { p.sleep = false; p.idleT = 0.8; }   // sáng: lần lượt dậy, vươn vai
          else if (Math.random() < 0.15 * dt) fx.push({ type: 'zz', x: p.x + p.dir * 10, y: p.y - 22, vy: -24, t: 0, life: 1.6 });
          continue;
        }
        // tối: người đang đi trên mặt (không cháy, không bận) thỉnh thoảng ngáp rồi nằm ngủ; ~1/4 thức đi dạo
        if (this.dark && p.state === 'walk' && !p.busy && !p.panic && p.yawnT <= 0 && p.nightOwl === undefined) p.nightOwl = Math.random() < 0.25;
        if (this.dark && p.state === 'walk' && !p.busy && !p.panic && !p.nightOwl && !(p.yawnT > 0) && Math.random() < 0.25 * dt) {
          p.yawnT = 1.3; p.idleT = 1.3; sfx('yawn', p.x, { pitch: 2 - p.s });
        }
        if (!this.dark) p.nightOwl = undefined;
      }
      if (this.k > 0.5 && (this.cricketIn -= dt) <= 0) { this.cricketIn = rand(1.2, 3.5); sfx('cricket', rand(0, WW)); }
    },
    render(dt) {
      const k = this.k;
      this.g.visible = k > 0;
      if (k > 0) this.g.clear().rect(0, 0, WW, WH).fill({ color: 0x0b1d3a, alpha: 0.58 * k });
      sun.g.alpha = 1 - k; sun.gl.alpha *= 1 - k;
      const m = this.moon;
      m.visible = k > 0;
      if (!m.visible) return;
      m.position.set(sun.x, sun.y); m.alpha = k;
      if ((this.moonIn -= dt) <= 0) {                    // trăng lưỡi liềm phấn
        this.moonIn = 0.1;
        m.clear();
        m.circle(J(0.4), J(0.4), 26).fill({ color: 0xfff6c8, alpha: 0.95 });
        m.circle(11 + J(0.3), -7 + J(0.3), 23).fill(nightTint(boardAt(sun.y)));
        m.circle(0, 0, 26).stroke(chalk(2, 0.5));
      }
      for (const f of fireflies) f.render();
    },
  };
}

// ===== Đom đóm: bay lượn thấp, nhấp nháy; trời sáng thì tắt dần rồi mất =====
class Firefly {
  constructor() {
    this.x = rand(40, WW - 40); this.y = rand(450, GY - 20);
    this.vx = 0; this.vy = 0; this.t = rand(0, 10); this.rate = rand(1.5, 3); this.a = 0; this.dead = false;
    this.ax = rand(0, 6); this.ay = rand(0, 6);
    this.gl = glow(0xe6ff6a); this.gl.visible = true; this.gl.alpha = 0;
  }
  update(dt, k) {
    this.t += dt;
    this.vx += (Math.sin(this.t * 0.7 + this.ax) * 30 - this.vx) * dt;
    this.vy += (Math.cos(this.t * 0.9 + this.ay) * 20 - this.vy) * dt;
    this.x = clamp(this.x + this.vx * dt, 20, WW - 20); this.y = clamp(this.y + this.vy * dt, 380, GY - 10);
    this.a = k * (0.25 + 0.75 * Math.max(0, Math.sin(this.t * this.rate)));
    if (k < 0.3) this.dead = true;
  }
  render() { this.gl.position.set(this.x, this.y); this.gl.scale.set(0.22); this.gl.alpha = this.a; }
  destroy() { this.gl.destroy(); }
}
