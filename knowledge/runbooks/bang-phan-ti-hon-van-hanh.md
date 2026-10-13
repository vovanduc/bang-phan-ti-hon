---
type: runbook
title: "Vận hành demo Bảng phấn tí hon v4"
description: Cách chạy, kiến trúc file, hook kiểm thử __bb, kịch bản đo, mở rộng cho demo PixiJS tái tạo teamLab tại .
tags: [runbook, demo, pixijs, bang-lang, v4]
timestamp: 2026-09-28T00:00:00Z
---
# Vận hành demo "Bảng phấn tí hon" v4

Thư mục: root repo (`index.html` + `*.js`). Cơ chế chi tiết: [knowledge/domain/bang-phan-ti-hon.md](../domain/bang-phan-ti-hon.md). Quyết định: [ADR-0004](../decisions/0004-bang-phan-v4-tai-tao-co-che.md). Spec: [docs/specs/2026-07-27-demo-bang-lang-trau.md](../../docs/specs/2026-07-27-demo-bang-lang-trau.md).

## 1. Chạy
- Đơn giản nhất: **bấm đúp** `index.html` ở root repo, hoặc `open index.html` (chạy được qua `file://`, đã kiểm).
- Hoặc tự chạy server: `python3 -m http.server 8765` ở root repo → mở `http://127.0.0.1:8765/`.
- Cần mạng lần đầu: PixiJS 8.6.6 tải từ CDN jsdelivr.
- ⚠️ Link localhost do **agent** bật sẽ chết khi agent tắt server/thoát — đưa user kèm cả hai cách trên (xem [gotcha](../gotchas/demo-web-agent.md)).
- **Bản công khai:** https://vovanduc.github.io/chalk-little-people/ — GitHub Pages build từ `main` / của chính repo này (repo đổi tên từ `bang-phan-ti-hon` 2026-10-13; link Pages cũ đã chết). Cập nhật: commit → push `main`; Pages tự build (~30 s, kiểm bằng `gh api repos/vovanduc/chalk-little-people/pages --jq .status` = `built`). `archive/` cũng được serve (vd `/archive/v2-teamlab-pixi.html`).

## 2. Kiến trúc
Classic `<script>` chung global scope, KHÔNG module. Thứ tự nạp trong index.html:
`pixi.min.js (CDN) → core.js → people.js → sky.js → ground.js → things.js → sound.js → <script>boot()</script>`.

| File | Sở hữu |
|---|---|
| `index.html` | shell, hint, credit link teamLab, thứ tự script |
| `core.js` | hằng số (WH=900, GY=780, MAX_*…), helper (`rand/pick/clamp/J/chalk/glow…`), mặt nạ va chạm 1B/px + vật lý Lemmings (`walkStep/settle/airStep`), `Line` + input, hạt fx, `tick()`, `boot()`, `window.__bb` |
| `people.js` | `Person`, `drawPerson`, `towerDepth` |
| `sky.js` | `Cloud`, `updateRain`, `Star`, `burst`, `makeSun` |
| `ground.js` | `GROW`, `LEAVES`, `waterAt`, `ageClovers`, `drawClovers`, `Seed`, `drawPlant`, `leaf`, `drawBerry` |
| `things.js` | `ITEM_TYPES`, `LIFE`, `ICON`, `Item`, `drawItem`, `trimItems`, `Bubble`, `flock`, `Bird`, `updateFlock`, `drawBird` |
| `sound.js` | `SND`, `SFX`, `sfx`, `soundUnlock`, `soundUpdate`, `soundToggle` (+ helper `snd_*`) — tiếng tổng hợp; core gọi `soundUnlock()` ở pointerdown và `soundUpdate(dt)` cuối `tick()`; các slice gọi `sfx(name, x)` tại sự kiện |

Luật: file entity chỉ **khai báo** (không chạy gì lúc nạp, không đụng `PIXI.*`/layer ở top-level); top-level chỉ đúng các tên liệt kê (helper khác → `static` hoặc prefix `<slice>_`); trùng `const/let/class` giữa file = SyntaxError cả trang.

Hợp đồng field giữa slice (người khác đọc/ghi): `Person.{x,y,state,rider,carrier,busy,eat,poke(),burn,soot,panic,ignite(p,spreads)}`, `Item.{type,x,y,state,k,squash,h,dir,air,taken,dead}`, `Seed.{x,y,stage,berries,rain()}`, `Star.{x,y,r,color,k}`, `Cloud.{x,y,w,h,rain,tap()}`, `sun.{x,y,r,on,id,shine(),lit(),update(),render()}`, hàm `burst`, `waterAt`, `trimItems`.

## 3. Kiểm thử
Hook `window.__bb` (core.js): mảng `people, items, seeds, clovers, stars, clouds, bubbles, lines, birds, fx, drops` + `sun`, `WW`, `GY`; hàm `step(n)` (bơm n tick, **60 bước = 1 giây**, mỗi step render), `tap(x,y)` (= `tapAt`), `draw(pts)` (pts = [x0,y0,x1,y1,…]), `drop(type,x,y=300)`.

Tab ẩn → rAF dừng → **luôn bơm tick bằng `__bb.step(n)`**, đừng chờ rAF.

Kịch bản đã đo (Chromium headless, 2026-09-28 — chi tiết trong spec §v4):
| Kịch bản | Cách gọi | Kết quả đã đo |
|---|---|---|
| Leo núi | vẽ dốc, step | 15 người leo tới đỉnh (223px) |
| Tường đứng | vẽ nét đứng | 0 lượt vượt |
| Tháp người | chờ đông + step | tối đa 9 người cưỡi đầu cùng lúc (tháp ≤5 tầng) |
| Mưa → cỏ | `tap` mây | mưa 7s → 10 cụm cỏ |
| Nổ sao | `tap` sao | 3 hạt rơi ra |
| Dâu | mưa lên ụ hạt | stage 4, 2 quả, cả 2 bị ăn |
| Thang | `drop('ladder',x,y)` | 8 người leo tới đỉnh |
| Nấm | `drop('mushroom',…)` | bật 7 người lên y≈150 |
| Lửa / bò | `drop('fire'/'cow',…)` | 12 người nhảy tránh / 30 người bị húc |
| Mặt trời | `tap` mặt trời | 6 người xoay + phát sáng |
| Chim đậu | `draw` nét, step | 7/7 chim đậu lên nét |
| Nét mờ | chờ 60s | 7 người trên nét rơi hết |

Lưu ý test tự động: chọn điểm `tap` **không chồng vật khác** — `tapAt` ưu tiên bong bóng > sao > người > mây > mặt trời (nghi là nguyên nhân 1 lần đo mây ra `maxDrops: 0`; chưa xác nhận).

Đo hiệu năng: đo `tick + render + gl.finish()` trực tiếp (đã đo: TB 2,16ms, tệ 22,5ms / 180 frame). KHÔNG tin `app.ticker.FPS` headless (báo ~38 dù frame rẻ — xem gotcha).

Âm thanh: headless không nghe được. Mở khóa bằng click thật (`page.mouse.click`), rồi kiểm: (a) `SND.ctx.state === 'running'`; (b) đếm `SND.plays[name]` sau khi kích sự kiện; (c) render từng `SFX[name]` trong `OfflineAudioContext`, đo peak/RMS; (d) AnalyserNode nối vào `SND.master` đo RMS lúc chạy; (e) click `#snd` → master 0 ↔ 0,9. Đã đo 2026-09-28: 19/19 tiếng có tín hiệu (đỉnh 0,027–0,662); kịch bản bơm tick nhanh phát 17/19 tên — `sun`/`spin` bị trần 28 tiếng chặn vì dồn quá nhiều tiếng, kích riêng thì phát. Nên xen `await sleep()` giữa các loạt `step`.

## 4. Mở rộng
- **Thêm loại đồ vật**: `ITEM_TYPES` (trọng số), `LIFE`, `ICON`, nhánh trong `drawItem`, phản ứng của người trong `Person.look()`/`touch()` — nếu cần; không cần sửa core.
- **Thêm hành vi người**: state mới trong `Person.update` switch + nhánh `drawPerson`; field chia sẻ phải cập nhật bảng hợp đồng.
- **Thêm tiếng**: thêm `SFX.<name>` trong sound.js + dòng `snd_THROTTLE` + gọi `sfx('<name>', x)` tại sự kiện; gọi trước khi mở khóa vẫn an toàn (no-op).

## 5. Quy trình nhiều worker đã dùng (v4)
Điều phối viết `core.js` + `index.html` + hợp đồng field/method trước → 4 worker song song, mỗi người 1 slice (people/sky/ground/things) → điều phối tích hợp + verify browser headless. Slice âm thanh làm tương tự sau đó. Bài học: hợp đồng field phải ghi tường minh (bảng §4 trong [hợp đồng giao việc](../../docs/plans/2026-09-28-bang-phan-v4-contract.md); âm thanh: [hợp đồng sound](../../docs/plans/2026-09-28-bang-phan-v4-sound-contract.md)) thì worker không đạp nhau.

## 6. Nghiên cứu bản gốc
- Đọc cả trang EN + JP — JP có chi tiết EN thiếu (イテテ！, あちち, mô tả trượt/nhảy/leo).
- Xem video theo khung hình: `yt-dlp` hay 403 giữa chừng (~40%) nhưng file `.part` DASH vẫn giải mã được → `ffmpeg -i part.mp4 -vf "fps=1/2,scale=480:-1,drawtext=text='%{pts\:hms}':…,tile=3x3" sheet.jpg` → đọc ảnh ghép có mốc giờ bằng tool `read`.
