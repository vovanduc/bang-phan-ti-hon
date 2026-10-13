# Bảng phấn tí hon v4 — hợp đồng slice ÂM THANH (`sound.js`)

> **Lưu ý khi đọc (đưa vào repo 2026-10-01):** hợp đồng giao việc ngày 2026-09-28 cho worker viết `sound.js`. **Code `sound.js` là nguồn sự thật**; sau tích hợp đã chỉnh: reverb bọc try/catch (Chromium headless báo sampleRate lệch → gán buffer cho ConvolverNode ném lỗi, từng làm đứng cả game), `soundUpdate` bỏ qua khi khởi tạo dở, `sfx` nuốt lỗi của công thức, `stack` giãn 700 ms + gain 0.07, nhạc nền bỏ các nốt đã lỡ sau khi tab ẩn.

Repo (lúc viết): `community-builder`, demo khi đó ở `demos/bang-lang/v4-ban-goc/`; nay là root repo `bang-phan-ti-hon`. Demo: ``. Đọc `core.js` (helper `rand`, `pick`, `clamp`, biến `WW`, mảng `drops`, `items`, `strokes`) và [hợp đồng chính](2026-09-28-bang-phan-v4-contract.md) §1 (luật classic script) trước khi code.

## 0. Vì sao / giống bản gốc thế nào
- Bản gốc teamLab ghi công "Sound: teamLab" → có âm thanh. Trang tiếng Nhật (https://www.team-lab.com/blackboard/) tả: chạm người tí hon → họ kêu 「イテテ！」(i-te-te, "ui da da"); chạm lửa → 「あちち」(a-chi-chi, "nóng nóng") và nảy văng; nấm là bàn nhún; mặt trời "サンサン" (chói chang); người trong nắng "くるくる" (xoay tròn) và sáng lên.
- KHÔNG dùng/tải file âm thanh nào (không asset, không sample của ai). Mọi tiếng TỔNG HỢP bằng Web Audio API (oscillator, noise buffer, filter, envelope). Tiếng dễ thương, nhẹ, kiểu hộp nhạc/hoạt hình — không chói, không ồn.

## 1. Luật file
- Chỉ viết `sound.js`. Không sửa file khác (điều phối tự gắn lời gọi `sfx(...)` vào các file khác + thêm `<script src="sound.js">` và nút tắt tiếng vào index.html).
- Classic script, chung global scope, KHÔNG module/import/export/top-level await. Lúc nạp chỉ khai báo, không tạo AudioContext (chỉ tạo trong `soundUnlock()`, được gọi từ cử chỉ người dùng).
- Top-level CHỈ các tên: `SND`, `SFX`, `sfx`, `soundUnlock`, `soundUpdate`, `soundToggle`. Helper khác phải prefix `snd_` (vd `snd_noise`, `snd_voice`).
- Chỉ kiểm: `node --check sound.js`. Không build/test/browser.

## 2. API công khai
```
const SND = { ctx: null, master: null, sfxBus: null, ambBus: null, bgmBus: null, verb: null,
              muted: false, voices: 0, last: {}, plays: {} }     // plays[name] = số lần đã phát (để test đếm)
function soundUnlock()      // gọi trong pointerdown đầu tiên (và nút loa). Lần đầu: tạo AudioContext (window.AudioContext || webkitAudioContext),
                            // dựng chuỗi bus, noise buffer, reverb, các lớp liên tục; mọi lần: nếu ctx.state === 'suspended' → ctx.resume(). Không throw nếu trình duyệt không hỗ trợ.
function sfx(name, x, o)    // phát 1 hiệu ứng. x = hoành độ thế giới (0..WW) để pan trái/phải; o = tùy chọn theo từng tiếng. 
                            // Không có ctx (chưa unlock) hoặc muted → return ngay (không lỗi). Tên lạ → return.
                            // Chặn dồn dập: bỏ qua nếu gọi cùng name trong khoảng THROTTLE[name] ms. Trần 28 voice cùng lúc → bỏ qua.
                            // Tạo StereoPanner (pan = clamp((x / WW) * 2 - 1, -1, 1) * 0.8; x undefined → 0) → sfxBus; gọi SFX[name](ctx, panner, ctx.currentTime, o || {}) → nhận dur (giây);
                            // SND.voices++ rồi setTimeout trả voice + disconnect panner sau dur + 0.1s. SND.plays[name] = (SND.plays[name] || 0) + 1.
function soundUpdate(dt)    // core gọi mỗi frame. Không có ctx → return. Điều khiển các lớp liên tục (mục 5) + nhạc nền (mục 6).
function soundToggle()      // bật/tắt tiếng; ramp master.gain về 0 hoặc 0.9 trong ~0.15s; trả về SND.muted mới. Gọi soundUnlock() trước.
const SFX = { pop(ctx, out, t, o) { …; return dur }, … }   // mỗi công thức CHỈ dùng ctx + out + t (+ o); KHÔNG đụng SND/WW/biến toàn cục khác,
                            // trừ reverb: dùng `o.verb` nếu có (sfx() truyền SND.verb vào o.verb) — để test render được trong OfflineAudioContext(ctx, out = oc.destination).
```
Chuỗi bus: `sfxBus (0.8)` + `ambBus (0.55)` + `bgmBus (0.22)` → `master (0.9)` → `DynamicsCompressor` (threshold -18, ratio 4) → `ctx.destination`. Reverb `SND.verb` = ConvolverNode với impulse tự sinh (noise stereo, decay mũ ~1.8s) → master (qua gain 0.35). Chuông/hộp nhạc/hợp âm gửi thêm 1 nhánh vào verb.

## 3. Hiệu ứng sự kiện (điều phối sẽ gọi đúng các tên này)
Mỗi lần phát lệch cao độ ngẫu nhiên ±4% cho đỡ lặp. Âm lượng ghi là gain đỉnh trước bus.

| name | khi nào (điều phối gắn) | `o` | công thức gợi ý | THROTTLE ms |
|---|---|---|---|---|
| `pop` | bong bóng vỡ | — | sine 900→200 Hz (exp, 60ms), gain 0.45→0 trong 90ms + noise 20ms highpass 2 kHz gain 0.15 | 40 |
| `burst` | nổ sao | — | 5 nốt ngũ cung đi lên (C6 D6 E6 G6 A6 C7, chọn ngẫu nhiên 5, sắp tăng), triangle, cách nhau 45ms, attack 4ms, decay 0.7s, gain 0.12/nốt, gửi verb + lấp lánh: noise highpass 5 kHz decay 0.5s gain 0.04 | 150 |
| `seed` | hạt rơi chạm đất | — | "pốc": sine 320→170 Hz trong 40ms, gain 0.22, decay 90ms | 80 |
| `sprout` | cây lên giai đoạn | `stage` 1..4 | stage 1–3: 1 nốt sine [E5, G5, A5] decay 0.35s gain 0.1, gửi verb; stage 4 (ra dâu): arpeggio C6-E6-G6 cách 70ms gain 0.1 | 100 |
| `clover` | cỏ ba lá mới mọc | — | "tích" sine 1800 Hz 30ms gain 0.05 | 120 |
| `eat` | người ăn xong quả dâu | — | 2 tiếng "nhồm": noise bandpass 450 Hz Q 3, 50ms, cách 120ms, gain 0.18; rồi nốt vui sine trượt G5→C6 0.15s gain 0.1 | 150 |
| `boing` | nấm nhún người lên | — | sine 150→620 Hz trong 0.25s + rung 12 Hz sâu 30 Hz, gain 0.3, decay 0.35s | 60 |
| `ouch` | chạm người tí hon ("イテテ!") | `pitch` (1 ± 0.15, tùy người) | GIỌNG hoạt hình 3 âm tiết i-te-te bằng `snd_voice` (mục 4): [{v:'i',f:880,d:0.08},{c:'t',v:'e',f:760,d:0.07},{c:'t',v:'e',f:700,d:0.09}] × pitch, gain 0.3 | 0 |
| `hot` | người chạm lửa nảy ra ("あちち") | `pitch` | giọng a-chi-chi nhanh, cao: [{v:'a',f:950,d:0.07},{c:'ch',v:'i',f:1150,d:0.05},{c:'ch',v:'i',f:1150,d:0.06}] × pitch + "xèo": noise highpass 3 kHz 0.25s gain 0.06 | 80 |
| `bonk` | bò húc văng người | — | "bịch": sine 120→60 Hz 0.12s gain 0.45 + "uiii": sine 500→1400 Hz 0.4s gain 0.12 | 60 |
| `moo` | bò chạm đất lần đầu / thỉnh thoảng khi nhảy | — | sawtooth 115→95 Hz 0.9s qua lowpass 700 Hz (Q 4), vibrato 5 Hz ±3 Hz, attack 0.1s, release 0.3s, gain 0.22 | 2500 |
| `land` | đồ vật rơi chạm mặt | `type` | ladder: 2 tiếng "cạch" gỗ = noise 12ms bandpass 1.6 kHz Q 4 cách 60ms gain 0.25; loại khác: "thịch" sine 180→90 Hz 0.1s gain 0.3 | 60 |
| `climb` | người bắt đầu leo thang | — | "tắc" sine 1400 Hz 15ms gain 0.06 | 150 |
| `hop` | người nhảy ra ở đỉnh thang | — | sine 400→820 Hz 80ms gain 0.14 | 90 |
| `stack` | người trèo lên đầu người khác | — | sine 300→520 Hz 90ms gain 0.1 | 150 |
| `rain` | mây bắt đầu mưa | — | "rào": noise bandpass quét 400→1200 Hz, 0.5s, gain 0.1 (tiếng mưa đều do lớp liên tục ở mục 5) | 300 |
| `sun` | chạm mặt trời ("サンサン") | — | hợp âm C5-E5-G5-B5 (sine+triangle), attack 0.4s, giữ, release tới 2.2s, gain 0.07/nốt, gửi verb | 500 |
| `spin` | người bắt đầu xoay trong nắng ("くるくる") | — | 6 nốt ngũ cung đi lên nhanh cách 35ms, triangle, decay 0.25s, gain 0.07, gửi verb | 90 |
| `chirp` | chim đậu xuống / cất cánh | — | "chíp chíp": 2 lần sine 2500→3800 Hz 60ms cách 90ms, gain 0.05 | 120 |
| `chalk` | mỗi đoạn nét vừa vẽ thêm | — | KHÔNG tạo node mới: chỉ cộng mức phấn `snd_chalkLevel += 0.35` (tối đa 1); tiếng do lớp liên tục ở mục 5 | 0 |

`chalk` đặc biệt: không tính voice, không throttle, không tạo panner (nhớ x gần nhất để pan lớp phấn).

## 4. Giọng hoạt hình `snd_voice(ctx, out, t, syllables, gain)`
- Nguồn: sawtooth ở tần số `f` (nhân pitch), có glide nhẹ -8% trong âm tiết.
- 2 bộ lọc formant bandpass song song (Q ~8) theo nguyên âm: `i` [320, 2600], `e` [450, 2100], `a` [750, 1250], `o` [450, 900] Hz; trộn lại → gain envelope từng âm tiết (attack 8ms, release 25ms).
- Phụ âm: `t` = noise 12ms highpass 3 kHz gain 0.25 ngay trước âm tiết; `ch` = noise 30ms highpass 4 kHz gain 0.2.
- Trả về tổng thời lượng.

## 5. Lớp liên tục (trong `soundUpdate`, tạo 1 lần khi unlock, luôn chạy, chỉ đổi gain bằng setTargetAtTime)
- **Mưa**: noise buffer loop → highpass 300 Hz → lowpass 2400 Hz → gain; mục tiêu = min(0.22, drops.length / 900). Thêm lách tách: mỗi frame xác suất `min(0.5, drops.length/400)` phát 1 "tách" (sine 2000–3500 Hz 12ms gain 0.02) — không qua `sfx()`, không đếm voice.
- **Lửa**: đếm item `type === 'fire' && state === 'live'` (tối đa 3). Có lửa → noise loop lowpass 300 Hz gain 0.03×n + lép bép ngẫu nhiên 12 lần/s mỗi đám (noise 5–15ms bandpass 2–4 kHz gain 0.05–0.12). Hết lửa → gain về 0.
- **Phấn cào bảng**: noise loop → bandpass 3.5 kHz Q 1.5 → highpass 1 kHz → gain = 0.1 × `snd_chalkLevel`; mỗi frame `snd_chalkLevel *= exp(-dt / 0.08)`. Pan theo x của lần `sfx('chalk', x)` gần nhất.

## 6. Nhạc nền (bgmBus, rất nhẹ)
- Hộp nhạc tự sinh: cứ rand(0.6, 1.8)s một nốt từ thang ngũ cung C (C5 D5 E5 G5 A5 C6 D6 E6); 20% khả năng kèm nốt thứ hai cách quãng 3 hoặc 5 bậc.
- Tiếng nốt: sine + bồi âm 2.01× (gain 0.3) + 3.99× (gain 0.1), attack 5ms, decay mũ 1.6s, gain 0.06, gửi verb.
- Lên lịch bằng thời gian audio (`ctx.currentTime`), không dùng setInterval. Muted → không lên lịch.

## 7. Nghiệm thu
- File chỉ có 6 tên top-level trên (+ helper `snd_*`); đủ 20 tên hiệu ứng ở mục 3 trong `SFX` (trừ `chalk` xử lý riêng trong `sfx`), mỗi công thức trả về số giây > 0.
- Mọi node tạo ra đều tự dừng (`osc.stop(t + dur)`, source noise `stop`) để không rò rỉ.
- Gọi `sfx(...)` / `soundUpdate(...)` trước `soundUnlock()` không lỗi.
- `node --check sound.js` qua.
