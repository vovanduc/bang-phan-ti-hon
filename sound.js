/* Bảng phấn tí hon v4 — sound.js : mọi tiếng tổng hợp Web Audio (không file).
   Global export: SND, SFX, sfx, soundUnlock, soundUpdate, soundToggle (helper prefix snd_). */

const SND = {
  ctx: null, master: null, sfxBus: null, ambBus: null, bgmBus: null, verb: null,
  muted: false, voices: 0, last: {}, plays: {},
  noiseBuf: null, // buffer noise dùng chung
  rain: null, fire: null, chalk: null, // {src..., gain, pan?}
  bgmNext: 0,
};

const snd_THROTTLE = { pop: 40, burst: 150, seed: 80, sprout: 100, clover: 120, eat: 150, boing: 60, ouch: 0, hot: 80, bonk: 60, moo: 2500, land: 60, climb: 150, hop: 90, stack: 700, rain: 300, sun: 500, spin: 90, chirp: 120, help: 300, hiss: 150, chomp: 200, spray: 300, giggle: 400, ook: 250, grunt: 400, thud: 120 }; // stack: đo được ~3 lần/s khi chơi thật → giãn còn ≤1,4/s
let snd_chalkLevel = 0, snd_chalkX = undefined;

// ---------- helpers (chỉ dùng ctx + tham số) ----------
function snd_noiseBuf(ctx) {
  const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

// gói phát 1 cụm noise: {dur, hp, bp{freq,Q}, lp, gain, at?}
function snd_hitNoise(ctx, out, t, o) {
  const s = ctx.createBufferSource(); s.buffer = o.buf || (ctx.__sndNoise || (ctx.__sndNoise = snd_noiseBuf(ctx))); s.loop = false;
  let n = s;
  if (o.hp) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = o.hp; n.connect(f); n = f; }
  if (o.bp) { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = o.bp[0]; f.Q.value = o.bp[1] || 1; n.connect(f); n = f; }
  if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; n.connect(f); n = f; }
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(o.gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  n.connect(g); g.connect(out);
  s.start(t); s.stop(t + o.dur + 0.02);
  return o.dur;
}

// gói osc 1 nốt: freq có thể ramp exp f0->f1, dur, type, gain peak, verb?
function snd_tone(ctx, out, t, o) {
  const os = ctx.createOscillator(); os.type = o.type || 'sine';
  const jit = o.nojit ? 1 : (1 + (Math.random() * 2 - 1) * 0.04);
  os.frequency.setValueAtTime(o.f0 * jit, t);
  if (o.f1) os.frequency.exponentialRampToValueAtTime(o.f1 * jit, t + (o.slide || o.dur));
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(o.gain, t + (o.attack || 0.004));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  os.connect(g); g.connect(out);
  if (o.verb) { const vg = ctx.createGain(); vg.gain.value = o.verbGain || 0.5; g.connect(vg); vg.connect(o.verb); }
  os.start(t); os.stop(t + o.dur + 0.05);
  return o.dur;
}

// nhánh gửi verb từ 1 gain node (nhẹ tay)
function snd_sendVerb(ctx, node, verb, amt) {
  if (!verb) return;
  const g = ctx.createGain(); g.gain.value = amt;
  node.connect(g); g.connect(verb);
}

// ---------- giọng hoạt hình ----------
const snd_VOWEL = { i: [320, 2600], e: [450, 2100], a: [750, 1250], o: [450, 900], u: [330, 800] };
function snd_voice(ctx, out, t, syllables, gain) {
  let cur = t;
  for (const s of syllables) {
    const f = s.f * (s.pitch || 1) * (1 + (Math.random() * 2 - 1) * 0.03);
    const d = s.d;
    // phụ âm trước
    if (s.c === 't') snd_hitNoise(ctx, out, cur - 0.012, { dur: 0.012, hp: 3000, gain: gain * 0.8 });
    else if (s.c === 'ch') snd_hitNoise(ctx, out, cur - 0.03, { dur: 0.03, hp: 4000, gain: gain * 0.65 });
    else if (s.c === 'k') snd_hitNoise(ctx, out, cur - 0.02, { dur: 0.02, bp: [1800, 2], gain: gain * 0.9 });
    // nguồn sawtooth glide -8%
    const os = ctx.createOscillator(); os.type = 'sawtooth';
    os.frequency.setValueAtTime(f, cur);
    os.frequency.exponentialRampToValueAtTime(f * (s.glide || 0.92), cur + d);
    const mix = ctx.createGain(); mix.gain.value = 0;
    for (const fq of snd_VOWEL[s.v] || snd_VOWEL.e) {
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = 8;
      os.connect(bp); bp.connect(mix);
    }
    mix.gain.setValueAtTime(0, cur);
    mix.gain.linearRampToValueAtTime(gain, cur + 0.008);
    mix.gain.setValueAtTime(gain, cur + Math.max(0.008, d - 0.025));
    mix.gain.linearRampToValueAtTime(0, cur + d);
    mix.connect(out);
    os.start(cur); os.stop(cur + d + 0.05);
    cur += d;
  }
  return cur - t;
}

// ---------- 27 công thức sự kiện ----------
const SFX = {
  pop(ctx, out, t) {
    snd_tone(ctx, out, t, { f0: 900, f1: 200, slide: 0.06, dur: 0.09, gain: 0.45 });
    snd_hitNoise(ctx, out, t, { dur: 0.02, hp: 2000, gain: 0.15 });
    return 0.1;
  },
  burst(ctx, out, t, o) {
    const scale = [1047, 1175, 1319, 1568, 1760, 2093].sort(() => Math.random() - 0.5).slice(0, 5).sort((a, b) => a - b);
    scale.forEach((f, i) => snd_tone(ctx, out, t + i * 0.045, { f0: f, type: 'triangle', dur: 0.74, attack: 0.004, gain: 0.12, verb: o.verb }));
    snd_hitNoise(ctx, out, t, { dur: 0.5, hp: 5000, gain: 0.04 });
    return 0.8;
  },
  seed(ctx, out, t) {
    return snd_tone(ctx, out, t, { f0: 320, f1: 170, slide: 0.04, dur: 0.09, gain: 0.22 });
  },
  sprout(ctx, out, t, o) {
    if ((o.stage || 1) < 4) {
      snd_tone(ctx, out, t, { f0: [659, 784, 880][(o.stage || 1) - 1] || 659, dur: 0.35, gain: 0.1, verb: o.verb });
      return 0.35;
    }
    [1047, 1319, 1568].forEach((f, i) => snd_tone(ctx, out, t + i * 0.07, { f0: f, dur: 0.3, gain: 0.1, verb: o.verb }));
    return 0.5;
  },
  clover(ctx, out, t) {
    return snd_tone(ctx, out, t, { f0: 1800, dur: 0.03, gain: 0.05 });
  },
  eat(ctx, out, t) {
    for (let i = 0; i < 2; i++) snd_hitNoise(ctx, out, t + i * 0.12, { dur: 0.05, bp: [450, 3], gain: 0.18 });
    snd_tone(ctx, out, t + 0.24, { f0: 784, f1: 1047, slide: 0.15, dur: 0.15, gain: 0.1 });
    return 0.4;
  },
  boing(ctx, out, t) {
    const os = ctx.createOscillator(); os.type = 'sine';
    os.frequency.setValueAtTime(150, t);
    os.frequency.exponentialRampToValueAtTime(620, t + 0.25);
    const vib = ctx.createOscillator(); vib.frequency.value = 12;
    const vg = ctx.createGain(); vg.gain.value = 30;
    vib.connect(vg); vg.connect(os.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.3, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    os.connect(g); g.connect(out);
    os.start(t); os.stop(t + 0.4); vib.start(t); vib.stop(t + 0.4);
    return 0.35;
  },
  ouch(ctx, out, t, o) {
    const p = o.pitch || 1;
    return snd_voice(ctx, out, t, [
      { v: 'i', f: 880, d: 0.08, pitch: p },
      { c: 't', v: 'e', f: 760, d: 0.07, pitch: p },
      { c: 't', v: 'e', f: 700, d: 0.09, pitch: p },
    ], 0.3);
  },
  hot(ctx, out, t, o) {
    const p = o.pitch || 1;
    const d = snd_voice(ctx, out, t, [
      { v: 'a', f: 950, d: 0.07, pitch: p },
      { c: 'ch', v: 'i', f: 1150, d: 0.05, pitch: p },
      { c: 'ch', v: 'i', f: 1150, d: 0.06, pitch: p },
    ], 0.3);
    snd_hitNoise(ctx, out, t, { dur: 0.25, hp: 3000, gain: 0.06 });
    return Math.max(d, 0.25);
  },
  help(ctx, out, t, o) {                   // 「cứu! cứu!」 giọng hoạt hình nhỏ, lên giọng như dấu sắc
    const p = o.pitch || 1;
    return snd_voice(ctx, out, t, [
      { c: 'k', v: 'i', f: 820, d: 0.05, pitch: p, glide: 1.1 },
      { v: 'u', f: 900, d: 0.13, pitch: p, glide: 1.2 },
      { c: 'k', v: 'i', f: 860, d: 0.05, pitch: p, glide: 1.1 },
      { v: 'u', f: 960, d: 0.15, pitch: p, glide: 1.22 },
    ], 0.42);
  },
  hiss(ctx, out, t) {                       // mưa dập lửa: xèo nhẹ
    snd_hitNoise(ctx, out, t, { dur: 0.6, hp: 2500, lp: 7000, gain: 0.07 });
    return 0.6;
  },
  chomp(ctx, out, t) {                      // cá sấu đớp hụt: 2 tiếng gỗ "cạch cạch"
    for (let i = 0; i < 2; i++) {
      snd_tone(ctx, out, t + i * 0.16, { f0: 320, f1: 140, slide: 0.05, dur: 0.06, type: 'triangle', gain: 0.22 });
      snd_hitNoise(ctx, out, t + i * 0.16, { dur: 0.03, bp: [1400, 3], gain: 0.12 });
    }
    return 0.25;
  },
  spray(ctx, out, t) {                      // vòi nước
    const s = ctx.createBufferSource(); s.buffer = ctx.__sndNoise || (ctx.__sndNoise = snd_noiseBuf(ctx));
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(2200, t + 0.7);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    s.connect(bp); bp.connect(g); g.connect(out); s.start(t); s.stop(t + 0.85);
    return 0.8;
  },
  giggle(ctx, out, t) {                     // cá sấu lật ngửa cười "hê hê hê"
    const syl = [];
    for (let i = 0; i < 5; i++) syl.push({ c: 'ch', v: 'e', f: 620 + (i % 2) * 90, d: 0.1, glide: 0.75 });
    return snd_voice(ctx, out, t, syl, 0.2);
  },
  ook(ctx, out, t) {                        // khỉ "u-a"
    return snd_voice(ctx, out, t, [{ v: 'u', f: 520, d: 0.11, glide: 1.4 }, { v: 'a', f: 760, d: 0.13, glide: 1.25 }], 0.3);
  },
  grunt(ctx, out, t) {                      // gấu "hừm" trầm, nhẹ
    return snd_voice(ctx, out, t, [{ v: 'o', f: 170, d: 0.35, glide: 0.85 }], 0.4);
  },
  thud(ctx, out, t) {                       // gấu dậm chân
    snd_tone(ctx, out, t, { f0: 110, f1: 50, slide: 0.15, dur: 0.18, gain: 0.35 });
    snd_hitNoise(ctx, out, t, { dur: 0.12, lp: 500, gain: 0.15 });
    return 0.2;
  },
  bonk(ctx, out, t) {
    snd_tone(ctx, out, t, { f0: 120, f1: 60, slide: 0.12, dur: 0.12, gain: 0.45 });
    snd_tone(ctx, out, t, { f0: 500, f1: 1400, slide: 0.4, dur: 0.4, gain: 0.12 });
    return 0.42;
  },
  moo(ctx, out, t) {
    const os = ctx.createOscillator(); os.type = 'sawtooth';
    os.frequency.setValueAtTime(115, t);
    os.frequency.exponentialRampToValueAtTime(95, t + 0.9);
    const vib = ctx.createOscillator(); vib.frequency.value = 5;
    const vg = ctx.createGain(); vg.gain.value = 3;
    vib.connect(vg); vg.connect(os.frequency);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t + 0.1);
    g.gain.setValueAtTime(0.22, t + 0.6); g.gain.linearRampToValueAtTime(0, t + 0.9);
    os.connect(lp); lp.connect(g); g.connect(out);
    os.start(t); os.stop(t + 0.95); vib.start(t); vib.stop(t + 0.95);
    return 0.9;
  },
  land(ctx, out, t, o) {
    if (o.type === 'ladder') {
      for (let i = 0; i < 2; i++) snd_hitNoise(ctx, out, t + i * 0.06, { dur: 0.012, bp: [1600, 4], gain: 0.25 });
      return 0.1;
    }
    return snd_tone(ctx, out, t, { f0: 180, f1: 90, slide: 0.1, dur: 0.1, gain: 0.3 });
  },
  climb(ctx, out, t) {
    return snd_tone(ctx, out, t, { f0: 1400, dur: 0.015, gain: 0.06 });
  },
  hop(ctx, out, t) {
    return snd_tone(ctx, out, t, { f0: 400, f1: 820, slide: 0.08, dur: 0.08, gain: 0.14 });
  },
  stack(ctx, out, t) {
    return snd_tone(ctx, out, t, { f0: 300, f1: 520, slide: 0.09, dur: 0.09, gain: 0.07 });
  },
  rain(ctx, out, t) {
    const s = ctx.createBufferSource(); s.buffer = ctx.__sndNoise || (ctx.__sndNoise = snd_noiseBuf(ctx)); s.loop = false;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1;
    bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(1200, t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.1, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    s.connect(bp); bp.connect(g); g.connect(out);
    s.start(t); s.stop(t + 0.55);
    return 0.5;
  },
  sun(ctx, out, t, o) {
    const chord = [523, 659, 784, 988];
    chord.forEach((f, i) => {
      snd_tone(ctx, out, t, { f0: f, type: i % 2 ? 'triangle' : 'sine', dur: 2.2, attack: 0.4, gain: 0.07, verb: o.verb, verbGain: 0.7 });
    });
    return 2.2;
  },
  spin(ctx, out, t, o) {
    [1047, 1175, 1319, 1568, 1760, 2093].forEach((f, i) =>
      snd_tone(ctx, out, t + i * 0.035, { f0: f, type: 'triangle', dur: 0.25, gain: 0.07, verb: o.verb }));
    return 0.45;
  },
  chirp(ctx, out, t) {
    for (let i = 0; i < 2; i++)
      snd_tone(ctx, out, t + i * 0.09, { f0: 2500, f1: 3800, slide: 0.06, dur: 0.06, gain: 0.05 });
    return 0.16;
  },
};

// ---------- API ----------
function sfx(name, x, o) {
  if (name === 'chalk') { snd_chalkLevel = Math.min(1, snd_chalkLevel + 0.35); if (x !== undefined) snd_chalkX = x; return; }
  if (!SND.ctx || SND.muted || !SFX[name]) return;
  const now = performance.now();
  if (now - (SND.last[name] || 0) < (snd_THROTTLE[name] || 0)) return;
  SND.last[name] = now;
  if (SND.voices >= 28) return;
  const ctx = SND.ctx;
  const panner = ctx.createStereoPanner();
  panner.pan.value = x === undefined ? 0 : clamp((x / WW) * 2 - 1, -1, 1) * 0.8;
  panner.connect(SND.sfxBus);
  o = Object.assign({}, o, { verb: SND.verb, buf: SND.noiseBuf });
  let dur;
  try { dur = SFX[name](ctx, panner, ctx.currentTime, o); }
  catch (e) { panner.disconnect(); return; }            // lỗi âm thanh không được làm đứng vòng lặp game
  SND.voices++;
  setTimeout(() => { SND.voices--; panner.disconnect(); }, (dur + 0.1) * 1000);
  SND.plays[name] = (SND.plays[name] || 0) + 1;
}

function soundUnlock() {
  try {
    if (!SND.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = SND.ctx = new AC();
      ctx.__sndNoise = SND.noiseBuf = snd_noiseBuf(ctx);
      SND.master = ctx.createGain(); SND.master.gain.value = SND.muted ? 0 : 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 4;
      SND.master.connect(comp); comp.connect(ctx.destination);
      SND.sfxBus = ctx.createGain(); SND.sfxBus.gain.value = 0.8; SND.sfxBus.connect(SND.master);
      SND.ambBus = ctx.createGain(); SND.ambBus.gain.value = 0.55; SND.ambBus.connect(SND.master);
      SND.bgmBus = ctx.createGain(); SND.bgmBus.gain.value = 0.22; SND.bgmBus.connect(SND.master);
      // reverb: impulse noise stereo decay 1.8s
      const len = ctx.sampleRate * 1.8, imp = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len / 3)); }
      try {                                             // Chromium headless báo sampleRate lệch rate thật → gán buffer ném lỗi: bỏ reverb, giữ phần còn lại
        const v = ctx.createConvolver(); v.buffer = imp;
        const vg = ctx.createGain(); vg.gain.value = 0.35;
        v.connect(vg); vg.connect(SND.master); SND.verb = v;
      } catch (e) { SND.verb = null; }
      // lớp liên tục: mưa
      const mkLoop = () => { const s = ctx.createBufferSource(); s.buffer = SND.noiseBuf; s.loop = true; s.start(); return s; };
      {
        const s = mkLoop(), hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
        hp.type = 'highpass'; hp.frequency.value = 300; lp.type = 'lowpass'; lp.frequency.value = 2400;
        g.gain.value = 0; s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(SND.ambBus);
        SND.rain = { gain: g };
      }
      // lửa
      {
        const s = mkLoop(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
        lp.type = 'lowpass'; lp.frequency.value = 300;
        g.gain.value = 0; s.connect(lp); lp.connect(g); g.connect(SND.ambBus);
        SND.fire = { gain: g };
      }
      // phấn
      {
        const s = mkLoop(), bp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter(), g = ctx.createGain(), p = ctx.createStereoPanner();
        bp.type = 'bandpass'; bp.frequency.value = 3500; bp.Q.value = 1.5; hp.type = 'highpass'; hp.frequency.value = 1000;
        g.gain.value = 0; s.connect(bp); bp.connect(hp); hp.connect(g); g.connect(p); p.connect(SND.ambBus);
        SND.chalk = { gain: g, pan: p };
      }
      SND.bgmNext = ctx.currentTime + 0.5;
    }
    if (SND.ctx.state === 'suspended') SND.ctx.resume();
  } catch (e) { /* trình duyệt không hỗ trợ */ }
}

function soundUpdate(dt) {
  const ctx = SND.ctx;
  if (!ctx || !SND.rain) return;                       // chưa mở khóa / khởi tạo dở → im lặng, không ném lỗi vào tick
  const t = ctx.currentTime;
  // mưa
  const rainTarget = Math.min(0.22, drops.length / 900);
  SND.rain.gain.gain.setTargetAtTime(SND.muted ? 0 : rainTarget, t, 0.15);
  if (Math.random() < Math.min(0.5, drops.length / 400) && !SND.muted)
    snd_tone(ctx, SND.ambBus, t, { f0: rand(2000, 3500), dur: 0.012, gain: 0.02 });
  // lửa
  let nf = 0;
  for (const it of items) if (it.type === 'fire' && it.state === 'live' && ++nf >= 3) break;
  let nb = 0;                                          // người đang cháy cũng kêu tí tách
  for (const p of people) if (p.burn > 0) nb++;
  nf = Math.min(3, nf + Math.ceil(nb / 2));
  SND.fire.gain.gain.setTargetAtTime(SND.muted ? 0 : 0.03 * nf, t, 0.2);
  if (nf && !SND.muted && Math.random() < 12 * dt * nf)
    snd_hitNoise(ctx, SND.ambBus, t, { dur: rand(0.005, 0.015), bp: [rand(2000, 4000), 2], gain: rand(0.05, 0.12), buf: SND.noiseBuf });
  // phấn
  snd_chalkLevel *= Math.exp(-dt / 0.08);
  SND.chalk.gain.gain.setTargetAtTime(SND.muted ? 0 : 0.1 * snd_chalkLevel, t, 0.03);
  if (snd_chalkX !== undefined)
    SND.chalk.pan.pan.setTargetAtTime(clamp((snd_chalkX / WW) * 2 - 1, -1, 1) * 0.8, t, 0.05);
  // nhạc nền: hộp nhạc, lên lịch bằng audio time
  if (!SND.muted) {
    SND.bgmNext = Math.max(SND.bgmNext, t);            // tab ẩn lâu → bỏ các nốt đã lỡ, không dồn cả loạt phát cùng lúc
    while (SND.bgmNext < t + 0.3) {
      const idx = (Math.random() * snd_SCALE.length) | 0;
      snd_bgmNote(ctx, SND.bgmNext, idx);
      if (Math.random() < 0.2) snd_bgmNote(ctx, SND.bgmNext + 0.02, idx, pick([3, 5]));
      SND.bgmNext += rand(0.6, 1.8);
    }
  } else SND.bgmNext = Math.max(SND.bgmNext, t);
}

const snd_SCALE = [523, 587, 659, 784, 880, 1047, 1175, 1319];
function snd_bgmNote(ctx, t, idx, step) {
  const f = snd_SCALE[Math.min(snd_SCALE.length - 1, idx + (step || 0))];
  [[1, 1], [2.01, 0.3], [3.99, 0.1]].forEach(([m, a]) => {
    const os = ctx.createOscillator(); os.frequency.value = f * m;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06 * a, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    os.connect(g); g.connect(SND.bgmBus);
    snd_sendVerb(ctx, g, SND.verb, 0.6);
    os.start(t); os.stop(t + 1.7);
  });
}

function soundToggle() {
  soundUnlock();
  SND.muted = !SND.muted;
  if (SND.ctx) SND.master.gain.setTargetAtTime(SND.muted ? 0 : 0.9, SND.ctx.currentTime, 0.15 / 3);
  return SND.muted;
}
