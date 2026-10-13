---
type: domain
title: "Bảng phấn tí hon v4 — danh mục cơ chế"
description: Toàn bộ cơ chế tương tác của demo tái tạo "A Blackboard where Little People Live" (teamLab) bằng PixiJS — 6 thao tác, hành vi tự trị, chuỗi nhân quả, giới hạn, đối chiếu bản gốc.
tags: [demo, pixijs, teamlab, bang-lang, v4]
timestamp: 2026-09-28T00:00:00Z
---
# Bảng phấn tí hon v4 — có mấy hành động, mỗi cái xảy ra thế nào

## Tổng quan
- Demo tại `` tái tạo **cơ chế** tác phẩm "A Blackboard where Little People Live" của teamLab (trang gốc: [EN](https://www.team-lab.com/en/blackboard/) · [JP](https://www.team-lab.com/blackboard/)). Không có thắng/thua — là một thế giới sống chạy vô hạn.
- Ranh giới IP: mọi hình tự vẽ bằng code nét phấn (không chép asset), không dùng tên "Little People" làm tên sản phẩm, ghi công + link teamLab ở góc màn hình (`#credit` trong index.html).
- Thế giới: cao cố định `WH=900`, rộng `WW` theo màn hình (~1600 ở 16:9); y ≥ `GY=780` là đất; đơn vị px.
- Quyết định thiết kế: xem [ADR-0004](../decisions/0004-bang-phan-v4-tai-tao-co-che.md); vận hành: xem [runbook](../runbooks/bang-phan-ti-hon-van-hanh.md).

## 6 thao tác của người chơi
Input: `pointerdown` → `tapAt(x,y)` (core.js). Chạm trúng vật → hành động tương ứng; chạm chỗ trống → bắt đầu vẽ nét. **Chạm mà không kéo thì không vẽ** (nét < 4 điểm bị xóa khi thả tay).

Thứ tự ưu tiên trong `tapAt` — chạm trúng vật nào trước thì ăn, dừng ngay:
`bong bóng` (bán kính + 10) → `sao` (trong 26px) → `người` (±16×scale ngang, từ chân lên 64×scale) → `mây` (w/2+8, h/2+8) → `mặt trời` (r+24).

| # | Thao tác | Xảy ra ngay | Hệ quả kéo theo |
|---|---|---|---|
| 1 | Kéo vẽ nét phấn | Tạo `Line` đóng dấu vào mặt nạ va chạm (đĩa bán kính 3px mỗi điểm) | Nét thành địa hình: người/bò/đồ vật đi lên, che mưa; vẽ đè chân người → nhấc họ lên; sống 60s + mờ 2,5s |
| 2 | Chạm người tí hon | `poke()`: giật mình, nhảy `vy = -300..-360`, giơ tay, miệng "o" 1s | Trên tháp thì bung tháp khỏi carrier; khi rơi có thể đáp lên nấm/đầu người khác |
| 3 | Chạm mây | `tap()`: `rain = min(12, rain + 6)` — mỗi chạm thêm 6s mưa, trần 12s | ~95 giọt/giây → cỏ/cây dâu; nét vẽ che mưa như mái |
| 4 | Chạm mặt trời | `shine()`: sáng `on = 8`s, `id++` | Vệt nắng hình thang tới đất; người trong vệt xoay 2,2s + phát sáng 9s — **mỗi lần chạm chỉ xoay 1 lần** (sunId chống lặp) |
| 5 | Chạm sao | `burst()`: sao biến mất, flash 0,7s | 22 tia + 3 hạt giống rơi + tối đa 2 sao mới |
| 6 | Chạm bong bóng | `pop()`: vòng nở + 8 giọt bắn ra | Vật bên trong rơi xuống (xem mục bong bóng); kéo nét đi qua bong bóng cũng chọc vỡ (`onMove`, bán kính r không +10) |

## Người tí hon tự làm gì
- **Đi**: tốc độ `rand(36,54)` px/s, scale cơ thể 0,9–1,08; bước 1px kiểu Lemmings qua `walkStep`.
- **Đứng ngó nghiêng**: mỗi 5–14s (lần đầu 3–12s) đứng nghỉ 0,7–2,5s; hết nghỉ 30% quay đầu.
- **Quay đầu**: chạm mép màn (`EDGE=14`), dốc đứng, hoặc nét chắn ngang thân → `'wall'` → đổi hướng. **Leo dốc tối đa 3px mỗi 1px ngang (~71°)**; xuống dốc tối đa 4px/bước (`STEP_DN`).
- **Rơi**: hụt chân ở mép nét/mép vực hoặc nét dưới chân mờ mất → `fly`, trọng lực `G_P=1100`, vận tốc chạm trần `VT_P=420` (rơi bồng bềnh). Nảy mép màn (`vx *= ±0,5`), đụng nét ngang thân bật ngược `vx *= -0,4`.
- **Trèo lên đầu nhau thành tháp**: gặp người phía trước cách 3–12px theo hướng đi, cùng độ cao (±5px), mà người đó không phải đang đi cùng chiều nhanh bằng/hơn mình → 55% trèo lên đỉnh tháp của người đó (45% đi xuyên qua nhau); gặp xong chờ 2,5s mới xét tiếp. Tháp tối đa `MAX_TOWER=5` tầng. **Tháp đổ** khi người bên dưới rời mặt đất (bay/leo thang) — người phía trên rơi xuống. Người đứng trên đầu đi chậm (40% tốc độ), lệch quá 11×scale thì nhảy xuống. Người rơi từ trên cao cũng đáp lên đầu người khác (lệch < 9px).
- **Người mới**: khi `people.length < MAXP`, cứ 1,6s một người đi vào từ mép trái/phải (x = −20 hoặc WW+20).

Phản ứng với vật (kiểm mỗi frame trong `look()`/`touch()`):
| Vật | Phản ứng |
|---|---|
| Thang (cách < 2px, chưa `seen`) | 80% bắt đầu leo |
| Nấm (cách < 12×k) | Nhún `squash=1` + bật `vy = -1050..-1250` lên trời |
| Quả dâu rời / cây stage 4 | Dừng ăn (xem mục dâu) |
| Lửa (khe 22px, vùng y ±30/44) | Nảy tránh `vx = ±170..250`, `vy = -380..-480`, hotT=1,1s + **bắt lửa** `ignite(rand(0.3,1))` (xem mục Cháy) |
| Bò (khe 26×26px, bò không nhảy) | Bị húc văng xoay tròn `rotV = ±7..12`, choáng 0,7s khi đáp |
| Vệt nắng | Xoay 2,2s + phát sáng 9s (1 lần mỗi lần mặt trời bật) |
| Sao (đầu cách < 20×26, sao đã hiện >80%) | `burst()` — đụng sao |
| Mây (đầu trong vùng 0,45w × 0,55h) | `rain = max(rain, 5)` — người chạm mây cũng gây mưa |

## Sao
- Lúc mở màn: 9 sao (`boot`). Tối thiểu `MIN_STARS=7`: thiếu thì cứ 3s thêm 1 ở `skySpot()`. Tối đa `MAX_STARS=16`.
- Sao nở dần (`k` 0→1 tốc 1,5/s), lấp lánh + bập bềnh ±3px.
- **Đụng sao** (người chơi chạm, hoặc đầu người tí hon chạm tới — bật lên từ nấm, nhảy ra ở đỉnh thang, hoặc đi trên nét vẽ cao; tháp 5 tầng vẫn thấp hơn vùng sao vì đầu người trên cùng ở y≈533 còn sao ở y ≤ 450 — suy luận từ hằng số): `burst()` → flash 0,7s + **22 tia** spark (tốc 70–260, sống 2,2–3,8s, 60% hình sao / 40% hình hoa) + **3 hạt giống** rơi (lấp lánh 0,5–0,9s rồi thành ụ hạt) + **tối đa 2 sao mới** quanh chỗ nổ (kẹp trong vùng trời, chỉ khi chưa đủ 16).
- Sao trong bong bóng vỡ ra → `burst` ngay tại chỗ, không rơi.

## Mây & mưa
- 3 mây lúc mở màn, trôi `rand(5,11)` px/s hai chiều, quấn vòng mép; không bao giờ bị xóa.
- Chạm mây: +6s mưa mỗi lần, trần 12s; người tí hon đi vào mây → `rain = max(rain, 5)` (5s). Mưa ~95 giọt/s trong vùng rộng ±0,4w dưới mây, giọt tốc 650–850 px/s.
- Giọt dừng ở **mặt đầu tiên** nó chạm (`firstSolid`) → **nét vẽ che mưa như mái nhà**.
- Giọt chạm mặt đất (`hit ≥ GY`): 10% xác suất mọc **cỏ ba lá** (s=0,3); trúng cỏ cũ cách < 7px → cỏ to dần (+0,25, tối đa 1). Cỏ sống 140s rồi teo 0,4/s đến khi biến mất. Trần `MAX_CLOVERS=160`.
- Giọt chạm ụ hạt (cách < 22px, ±10px y): `s.rain()` → tích nước nuôi cây.

## Cây dâu
- Ụ hạt (`Seed`): 3 cái lúc mở màn + mỗi hạt rơi từ nổ sao → ụ mới (trần `MAX_SEEDS=14`).
- 4 mốc nước `GROW = [20, 70, 140, 200]` giọt → stage 1 mầm → 2 cây nhỏ → 3 cây lớn → 4 ra dâu. Stage 4: ngay 2 quả; cứ thêm 90 giọt → +1 quả; tối đa 3 slot (`BERRY_AT` 3 vị trí).
- Không được tưới: ụ (stage 0) tàn sau 90s; cây (stage ≥1) sau 150s; mờ dần 2s trước khi chết.
- Hạt/cây nằm trên nét → nét mờ thì rơi xuống (`settle` thất bại → `falling`).
- **Ăn dâu**: người đi ngang tâm cây (|x−s.x| < 2, ±10px y, chưa `seen`) lấy quả đầu tiên chưa `taken`; dừng ăn `eatT=1,4`s; ăn xong quả khỏi cây (`splice`), 2 tim bay lên (một trễ 0,25s), và nhảy mừng `vy=-240` nếu đang đi bộ. Quả dâu rơi từ bong bóng (item `berry`) cũng ăn được (khe 8px) — ăn xong `dead=true`.

## Mặt trời
- Ở góc (WW−150, 112), r=28, 12 tia. `shine()`: sáng 8s; vệt nắng hình thang từ đĩa loe xuống đất rộng `BEAM=260` mỗi bên (×0,6 cho lớp trong sáng hơn).
- Người trong vệt (hàm `lit`, nón từ đĩa tới GY): xoay `spinT=2,2`s, phát sáng `glowT=9`s. Mỗi lần `shine()` tăng `id` → người đã tắm lần trước được tắm lại; trong cùng 1 lần sáng chỉ xoay 1 lần.

## Bong bóng & đồ vật
- Số bong bóng `MAXB = clamp(round(WW/450), 2, 5)` (≈4 ở WW=1600); bong bóng vỡ → `bubbleCD` 2–5s; hụt MAXB → `rand(3,6)`s nở cái mới. Trôi chậm vx ±16, vy ±7 + dao động sin.
- `ITEM_TYPES` trọng số: `ladder ×2, mushroom ×2, fire ×1, cow ×1, croc ×1, monkey ×1, bear ×1, star ×1, berry ×2` → 9 loại (mỗi phần 1/12). Trước v1.1.0: 6 loại, mỗi phần 1/9.
- Vỡ: sao → `burst` tại chỗ; loại khác → `new Item` rơi (G_I=1400, VT_I=900), chạm mặt → `live`; hết `LIFE` → mờ 1,2s → chết. Trần `MAX_ITEMS=10` (thừa → cái cũ nhất `fade()`).
- Từng vật:
  - **Thang** (`h=300`): rơi nghiêng, đáp đất dựng thẳng; người leo 55px/s, xếp hàng chờ nếu có người trong 44px phía trên; tới đỉnh (`y ≤ L.y−L.h+4`) nhảy ra `vx ±60–150, vy −220…−340` — đưa người lên cao để đáp lên đầu người khác / lên nét / thỉnh thoảng đụng sao thấp. LIFE 45s.
  - **Nấm**: bàn nhún — mũ `y−42k`, nửa rộng `27k`; người đi ngang → bật `vy −1050…−1250`; người rơi trúng mũ → nhún lại `vy −1000…−1200`. `k` lớn 0,4→1 (tốc 2,5/s). LIFE 45s.
  - **Lửa**: người tới gần nảy tránh và bắt lửa (xem mục Cháy); lửa sống `LIFE=10`s, bắn tàn lửa ~14 lần/s.
  - **Bò**: chạy `rand(130,170)` px/s trên địa hình (leo ≤4px), thỉnh thoảng nhảy cẫng (30%/s, `vy −260…−380`); húc người văng xoay tròn → tháp đổ (người bên dưới thành 'air'). LIFE 30s.
  - **Dâu** (`berry`): người ăn như trên. LIFE 40s.
  - **Sao**: nổ ngay khi bong bóng vỡ.
- Đồ vật trên nét → nét mờ thì `settle` thất bại → rơi xuống (`state='fall'`).

## Cháy (thêm 2026-10-13, v1.1.0)
- `Person.burn` 0–1 = độ cháy; `ignite(p, spreads=1)` chỉ tăng, không giảm. Đụng đồ vật lửa → `rand(0.3, 1)`.
- **Cháy to** (`burn ≥ BURN_BIG = 0.55`, getter `panic`): lửa trên mũ + hai bên thân, vầng sáng cam; kêu cứu (`sfx('help')`, 「cứu! cứu!」) mỗi 1,6–2,4s; bỏ đứng nghỉ/ăn/trèo tháp/leo thang, chạy nhanh ×2,2 về **mây đang mưa gần nhất**, không có thì mây gần nhất (`seekWater`; đụng tường → quay đầu, 1,5s không tìm hướng). Đang cưỡi tháp thì nhảy xuống. Yếu đi 0,05/s.
- **Cháy nhỏ** (`< 0.55`): một ngọn lửa nhỏ, đi bình thường, yếu đi 0,15/s → tự tắt sau ≤ 3,7s. Tổng thời gian cháy tối đa ~13s nếu không có mưa (không bao giờ "chết").
- **Lây**: người cháy to lây cho **1** người đứng sát (|dx| < 14, |dy| < 30) hoặc cùng tháp, lực `burn × 0.8`; người bị lây có `spreads = 0` nên không lây tiếp. Đụng lửa lại thì được `spreads = 1` lại. Đo 3 lần 1 đám lửa/20s: (trực tiếp, bị lây) = (3,1), (9,10), (6,3).
- **Mưa dập lửa**: giọt mưa trong |dx| < 12, từ đầu tới chân → `douse()`: tắt ngay, `sfx('hiss')` + 3 vòng hơi nước; miễn bắt lây 4s (tự tắt: 3s). Đo: mưa ngay trên đầu → tắt sau ~0,8s (thời gian giọt rơi từ mây).
- **Đen**: bắt lửa → `soot = 1` (phấn, mũ, mặt chuyển đen, mắt vẫn trắng); giữ `SOOT_HOLD = 6`s sau khi tắt rồi phai về màu thường trong 2s.
- Tiếng lửa liên tục tính cả người đang cháy: `min(3, số đám lửa + ceil(số người cháy / 2))`.

## Cá sấu, khỉ, gấu (thêm 2026-10-13, v1.1.0) — `animals.js`
Đồ vật từ bong bóng như con bò; `Item` gọi `ANIMALS[type].init/update/draw/tap`. Trạng thái `it.mode` + `it.modeT`. Thú được **ưu tiên chạm trước người** (`tapAt`: bong bóng > sao > thú > người > mây > mặt trời) vì bé chạm con to thì muốn trúng con to; khung chạm chỉ phủ thân thú.
- **Cá sấu** (`croc`, LIFE 35s): bò 38 px/s. Chở người: người đi bộ cách tâm < 10px → 70% trèo lên lưng (`seatY 22`, `seatW 22`; người trên lưng xếp tháp tiếp được). **Phun nước**: người cháy trong |dx| < 240, |dy| < 120 → quay mặt, há miệng 0,9s, vòi giọt nước (`fx drop`), `douse()` sau ~0,45s (đo: người cách 150px tắt sau 27 frame). Người cháy to chạy tới cá sấu như tới mây đang mưa (`seekWater`). **Đớp hụt** mỗi 6–10s: người đứng trước mũi 30–90px nhảy tránh, không đau. **Chạm** → lật ngửa cười 2s (`giggle`), người trên lưng rơi xuống.
- **Khỉ** (`monkey`, LIFE 30s): chạy 85 px/s, nhảy cẫng mỗi 1,5–3s. **Hái dâu**: bụi dâu chín trong 320px → chạy tới, 0,8s hái 1 quả, ném thành `Item('berry')` về phía người gần nhất (người ăn như dâu rơi từ bong bóng); nghỉ 4–7s. **Leo thang** 150 px/s, tới đỉnh phóng `vy −620…−720` (đo: lên tới y=341, vùng sao ≤ 450) — đụng sao làm sao nổ. **Chạm** → nhào lộn 1 vòng (`ook`).
- **Gấu** (`bear`, LIFE 35s): đi 22 px/s. Người trèo lên đầu gấu (`seatY 62`, `seatW 9`) thành tháp. **Ăn dâu**: bụi chín trong 300px → tới ăn từng quả 0,8s (tim bay) tới hết, rồi **ngủ** 7s (chữ z bay lên); nghỉ ăn 20–30s. Lúc ngủ: người đi qua (|dx| < 26) bị bụng gấu nhún bật `vy −800…−950`. **Dập lửa**: người cháy trong 320px → chạy 70 px/s tới, cách < 40px thì nhảy dậm (`thud` + vòng bụi) → `douse()`. **Chạm** → ôm người gần nhất trong 100px (tim cả hai, người đứng yên nhìn gấu 1,4s); chạm gấu đang ngủ → thức dậy.
- Người trên lưng/đầu thú rơi xuống khi thú lật, ngủ, nhảy, mờ đi, hoặc người đó cháy to.

## Chim
- Đàn **7 chim** giấy (4 hồng `0xffa6d2`, 3 trắng) bám quanh tâm đàn `flock` (điểm đến ngẫu nhiên, tốc 95 px/s; mỗi chim lắc sin quanh chỗ mình trong đàn, tốc tối đa 150).
- Lần đầu sau 6–10s, các lần sau 8–15s (không có nét phù hợp thì thử lại sau 3s): chọn **1 nét đã vẽ xong** (`!drawing`, `!fading`, ≥ 8 điểm, tuổi < 52s) → cả đàn đáp dàn trải ±7 điểm quanh một điểm ngẫu nhiên của nét.
- Đậu `rand(2,5)`s; bay đi khi hết giờ hoặc nét mờ/biến mất. Sau khi cả đàn bay lại → hẹn đợt mới.

## Nét phấn
- Địa hình cho người/bò/đồ vật/hạt: đóng dấu vào mặt nạ 1 byte/px (đĩa `LR=3` → dải ~7px). Dốc leo được vs vật cản theo `walkStep` (≤3px lên, ≤4px xuống, chắn ngang thân → wall).
- Vẽ dưới chân người → `settle` nhấc họ lên tối đa 14px.
- Sống `LINE_LIFE=60`s + mờ 2,5s → xóa, người/đồ đứng trên rơi. Tối đa `MAX_LINES=24` nét (vẽ quá → nét cũ nhất không-đang-vẽ bị ép mờ ngay).
- Mỗi đỉnh thêm cách đỉnh trước ≥4px; chạm không kéo (<4 điểm) → không thành nét.

## Âm thanh
Đã tích hợp và kiểm 2026-09-28 (`sound.js`). Tổng hợp Web Audio, không file âm thanh. Chỉ phát sau cú chạm đầu tiên lên bảng hoặc nút 🔊 (chính sách autoplay của trình duyệt); nút 🔊/🔇 góc dưới trái bật/tắt; pan trái/phải theo vị trí x; mỗi tiếng có khoảng giãn tối thiểu (`snd_THROTTLE`, vd trèo đầu 0,7s vì đo được ~3 lần/s khi chơi thật, bò kêu 2,5s, mặt trời 0,5s); trần 28 tiếng cùng lúc; reverb bật nếu trình duyệt cho gán impulse (Chromium headless không cho → tắt reverb, phần còn lại vẫn chạy).

| Sự kiện | Tiếng |
|---|---|
| Bong bóng vỡ | `pop` — sine 900→200Hz + xột xoạt |
| Nổ sao | `burst` — 5 nốt ngũ cung đi lên + lấp lánh |
| Hạt chạm đất | `seed` — "pốc" |
| Cây lên giai đoạn | `sprout` (stage 4: arpeggio C6-E6-G6) |
| Cỏ mọc | `clover` — "tích" 1800Hz |
| Ăn xong dâu | `eat` — 2 tiếng "nhồm" + nốt vui |
| Nấm nhún | `boing` |
| Chạm người | `ouch` — giọng "i-te-te" (giống 「イテテ！」bản gốc) |
| Chạm lửa | `hot` — giọng "a-chi-chi" (「あちち」) + "xèo" |
| Cháy to (mỗi 1,6–2,4s) | `help` — giọng "cứu! cứu!" lên giọng |
| Mưa dập lửa | `hiss` — xèo nhẹ |
| Cá sấu đớp hụt / phun nước / lật cười | `chomp` / `spray` / `giggle` |
| Khỉ ném dâu, phóng lên, nhào lộn | `ook` — "u-a" |
| Gấu ngủ, thức, ôm | `grunt` — "hừm" trầm |
| Gấu dậm lửa | `thud` |
| Bò húc | `bonk` | 
| Bò kêu | `moo` |
| Đồ chạm đất | `land` (thang: 2 tiếng "cạch") |
| Leo thang / nhảy đỉnh thang / trèo lên đầu | `climb` / `hop` / `stack` |
| Mây bắt đầu mưa | `rain` — "rào" |
| Chạm mặt trời | `sun` — hợp âm C5-E5-G5-B5 (「サンサン」) |
| Người xoay trong nắng | `spin` — 6 nốt nhanh (「くるくる」) |
| Chim đậu/cất cánh | `chirp` |
| Vẽ nét | `chalk` — cộng mức phấn, tiếng do lớp liên tục |
| Liên tục | Mưa rơi (theo số giọt), lửa cháy (theo số đám lửa + người đang cháy, tối đa 3), phấn cào bảng |
| Nhạc nền | Hộp nhạc tự sinh: nốt ngũ cung C ngẫu nhiên mỗi 0,6–1,8s, rất nhẹ (bgmBus 0,22) |

Kiểm (Chromium headless — không nghe được): 19/19 công thức render `OfflineAudioContext` ra tín hiệu, đỉnh 0,027–0,662, không vỡ; đầu ra lúc chạy: nhạc nền + tiếng nền 0,011 RMS, bong bóng vỡ 0,061; kéo nét bằng chuột thật → mức tiếng phấn 0,08; nút tắt tiếng đưa master về 0 rồi 0,9. **Chưa kiểm bằng tai.** 2026-10-13 thêm `help` (đỉnh 0,184 sau khi tăng gain 0,22→0,42; `hot` là 0,27) và `hiss` (đỉnh 0,071); thêm `chomp` 0,2, `spray` 0,048, `giggle` 0,21, `ook` 0,15, `grunt` 0,17, `thud` 0,31 — render OfflineAudioContext có tín hiệu, chưa nghe bằng tai.

## Chuỗi nhân quả

```
╭─────────────╮   ╭──────────╮   ╭───────────╮   ╭─────────╮   ╭────────╮
│ nấm bật     │──▶│ người bay│──▶│ đụng sao  │──▶│ 3 hạt   │──▶│ mưa    │──▶╮
│ thang→đỉnh  │   │ lên cao  │   │ burst()   │   │ rơi→ụ   │   │ tưới   │   │
│ tay chạm    │   │          │   │ +22 tia   │   │ đất     │   │        │   │
│ nét vẽ cao  │   │          │   │ +2 sao    │   │         │   │        │   │
╰─────────────╯   ╰──────────╯   ╰───────────╯   ╰─────────╯   ╰────────╯   │
                                                                            ▼
╭──────────╮   ╭─────────────╮   ╭──────────╮   ╭──────────╮   ╭─────────────╮
│ tim bay  │◀──│ ăn xong 1,4s│◀──│ người đi │◀──│ ra 2 quả │◀──│ stage 4     │
│ nhảy -240│   │ splice quả  │   │ ngang    │   │ +1/90 giọt│   │ 200 giọt   │
╰──────────╯   ╰─────────────╯   ╰──────────╯   ╰──────────╯   ╰─────────────╯

╭──────────╮   ╭──────────╮   ╭───────────────╮
│ chạm mây │──▶│ mưa ≤12s │──▶│ giọt→đất: 10% │
│ người→mây│   │ ~95 giọt/s│   │ cỏ; giọt→ụ:  │
│ (+5s)    │   │           │   │ cây dâu      │
╰──────────╯   ╰──────────╯   ╰───────────────╯

╭──────╮   ╭───────────╮   ╭──────────╮
│ bò   │──▶│ húc người │──▶│ tháp đổ  │
│ chạy │   │ văng xoay │   │ choáng   │
╰──────╯   ╰───────────╯   ╰──────────╯
```

## Giới hạn & số liệu
| Đại lượng | Giá trị (code) |
|---|---|
| Người | `MAXP = clamp(round(WW/48), 14, 44)`; khởi đầu ~60% MAXP; thêm 1,6s/con |
| Sao | min 7, max 16; khởi đầu 9; thiếu → +1/3s |
| Bong bóng | `MAXB = clamp(round(WW/450), 2, 5)`; hồi 2–5s (vỡ) / 3–6s (spawn) |
| Đồ vật | `MAX_ITEMS=10`, `LIFE` 10–45s tùy loại |
| Hạt/ụ dâu | `MAX_SEEDS=14`; hạt chết sau 90s không tưới, cây 150s |
| Cỏ | `MAX_CLOVERS=160`, sống ~140s |
| Nét | `MAX_LINES=24`, sống 60s + mờ 2,5s |
| Tháp người | `MAX_TOWER=5` tầng |
| Mây | 3, cố định; mưa trần 12s |
| Chim | 7, cố định |
| Hiệu năng | dt kẹp ≤ 0,05s; chi phí frame trung bình 2,16ms, tệ nhất 22,5ms (Chromium headless, đo trước khi có âm thanh) |

## Mẹo chơi (đo 2026-09-28, WW=1600)
- **Nấm chỉ đến từ bong bóng**: tỉ lệ 2/9 mỗi bong bóng, nấm sống 45s. Icon trong bong bóng cho biết vật bên trong. Bong bóng chưa chọc giữ chỗ (tối đa `MAXB`) nên không có bong bóng mới → muốn nhiều nấm phải chọc hết, kéo 1 nét cắt qua nhiều bong bóng cũng được. Mô phỏng 10 phút chọc ngay mọi bong bóng: 177 bong bóng (17,7/phút), 31 nấm (3,1/phút), trung bình 2,24 nấm cùng lúc, cao nhất 7.
- Màn ngang rộng hơn → nhiều bong bóng đứng chờ cùng lúc hơn: `MAXB = round(WW/450)`, 16:9 → 4, cần tỉ lệ ≥ 2,25:1 (vd 21:9) mới có 5 (suy ra từ công thức; nhịp mọc 2–6s không đổi).
- Đồ vật chung trần 10 → nhiều thang/bò/dâu thì nấm cũ bị mờ sớm. Nấm rơi gần như thẳng xuống dưới chỗ bong bóng vỡ → chọc khi bong bóng ở trên đám đông.
- Console (F12 → Console): `for (let x = 200; x <= 1400; x += 150) __bb.drop('mushroom', x)` → 9 nấm ngay (đã thử: 9 nấm sống; thả tổng 12 → còn 10, 2 cái cũ nhất mờ đi).
- Hàng nấm tự kéo cả chuỗi: người bị bật lên liên tục (tới 5 người bay cùng lúc trong thử nghiệm) → đầu chạm mây làm mưa, chạm sao làm sao nổ ra hạt → ụ hạt mới, mưa tự tưới thành cỏ/cây dâu (ảnh chụp thử: 3 mây cùng mưa, sao nổ, ụ hạt mới — không chạm mây/sao lần nào).
- **Mặt trời** chỉ làm người trong vệt nắng xoay 2,2s + phát sáng 9s (kèm tiếng), không làm cây lớn hay đổi gì khác — bản gốc cũng chỉ tả vậy. Vệt nắng ở mặt đất phủ ~410px bên phải (x ≥ WW−410). Chạm lại → người trong nắng xoay thêm lần nữa. Người đang bay/leo thang không xoay; đáp xuống trong lúc nắng còn thì xoay.

## Đối chiếu bản gốc & chưa có
Nguồn bản gốc: [trang EN](https://www.team-lab.com/en/blackboard/) + [trang JP](https://www.team-lab.com/blackboard/) (JP có chi tiết EN không nêu: chạm người → 「イテテ！」; lửa → 「あちち」 nảy văng; "こびとたちはすべったり、ジャンプしたり、よじ登ったりして" = người trượt/nhảy/leo; công nghệ Unity; ghi công "Sound: teamLab" trên teamlab.art).

Video gốc đã xem theo khung hình (kênh teamLab trên YouTube): [McDonald's Ikegami](https://www.youtube.com/watch?v=bCUo3Xm_9Hw) · [LECT Hiroshima](https://www.youtube.com/watch?v=3k-qHrd2LwM) · [Giants Kids Park](https://www.youtube.com/watch?v=vW_GHIdfs-Q). Hợp đồng thiết kế lúc build: [chính](../../docs/plans/2026-09-28-bang-phan-v4-contract.md) · [âm thanh](../../docs/plans/2026-09-28-bang-phan-v4-sound-contract.md).

| Chức năng bản gốc | v4 |
|---|---|
| Vẽ nét → người chạy, leo núi, nét làm vật cản | ✅ mặt nạ Lemmings, ≤71° |
| Chim đậu nghỉ trên nét | ✅ đàn 7 con, đậu 2–5s |
| Người chạm mây → mưa; chạm sao → thêm sao | ✅ |
| Chạm người/mây/mặt trời; mưa → cỏ ba lá; mưa lên hạt → cây dâu; tắm nắng xoay + sáng | ✅ đủ |
| Bong bóng → thang, lửa, nấm, bò (video thêm sao, dâu) | ✅ đủ 6 loại |
| Chuỗi sao → hạt → dâu → người ăn | ✅ |
| Âm thanh (ghi công Sound: teamLab; イテテ！/ あちち) | ✅ tổng hợp Web Audio: 27 tiếng sự kiện + mưa/lửa/phấn liên tục + hộp nhạc nền; giọng "i-te-te" / "a-chi-chi" (trang JP không nói rõ là giọng hay chữ — v4 chọn giọng) |
| **Chưa có** | |
| Người **trượt** dốc (「すべったり」) | ❌ |
| Nét nhiều màu "năng lực" (bản "A Canvas where Little People Live") | ❌ |
| Nhiều người chơi qua mạng | ❌ |
| Giọng nói thật | ❌ (v4 tổng hợp giọng formant giả) |
