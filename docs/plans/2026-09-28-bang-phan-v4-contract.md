# Bảng phấn tí hon v4 — hợp đồng cho workers

> **Lưu ý khi đọc (đưa vào repo 2026-10-01):** hợp đồng giao việc điều phối viết ngày 2026-09-28 để 4 worker build v4 song song — giữ làm design intent. **Code trong `` là nguồn sự thật**; sau tích hợp đã chỉnh: vòm mũ nấm vẽ bằng bezier cao tới −42 (khớp mốc va chạm), lá và quả dâu to hơn, gắn `sfx(...)` vào các slice (xem [hợp đồng âm thanh](2026-09-28-bang-phan-v4-sound-contract.md)). Ảnh `/tmp/teamlab/*` ở §0 đã xóa sau phiên; link video gốc + tri thức tổng hợp: [knowledge/domain/bang-phan-ti-hon.md](../../knowledge/domain/bang-phan-ti-hon.md).

Repo (lúc viết): `community-builder`, demo khi đó ở `demos/bang-lang/v4-ban-goc/`; nay là root repo `bang-phan-ti-hon`. Thư mục demo: ``.
Core đã viết xong: `core.js` + `index.html` — ĐỌC core.js TRƯỚC KHI CODE (helper, vật lý, fx, vòng lặp, boot).

## 0. Mục tiêu

Dựng lại **cơ chế** tác phẩm teamLab "A Blackboard where Little People Live" trên web, giống bản gốc nhất về hành vi + bố cục.
Mọi hình vẽ tự vẽ bằng code nét phấn (không chép asset, không dùng tên "Little People" làm tên sản phẩm).

Chức năng chính thức (https://www.team-lab.com/en/blackboard/):
1. **Vẽ nét tự do**: người tí hon chạy trên nét; chim đậu nghỉ chốc lát trên nét; vẽ núi → người leo núi; nét có thể thành vật cản; người chạm tới mây → mưa; người chạm tới sao → thêm sao.
2. **Chạm** người tí hon (phản ứng), mây (mưa), mặt trời (sáng rực). Mưa xuống đất → mọc cỏ ba lá; mưa lên hạt → mọc cây dâu. Người tắm nắng → xoay tròn và phát sáng.
3. **Chạm bong bóng xà phòng** → rơi ra thang, lửa, nấm, bò (video gốc còn thấy sao, dâu). Người leo thang; lửa chạm người → nhảy tránh nóng; nấm = bạt nhún, người bật lên trời; bò chạy lung tung, húc văng người.
4. **Chuỗi nhân quả**: chạm sao → nổ ra nhiều sao nhỏ; vài sao thành hạt giống rơi xuống; mưa lên hạt → cây dâu; người tí hon ăn dâu.

Ảnh tham chiếu bản gốc (xem bằng tool `read` — ảnh hiển thị inline; CHỈ tham khảo, KHÔNG sao chép nét):
- Khung video gốc có ghi timestamp: `/tmp/teamlab/bCUo3Xm_9Hw_sheet_2.jpg`, `_sheet_3.jpg`, `/tmp/teamlab/3k-qHrd2LwM_sheet_1.jpg`…`_sheet_3.jpg`, `/tmp/teamlab/vW_GHIdfs-Q_sheet_1.jpg`…`_sheet_3.jpg`
- Ảnh chính thức: `https://assets.team-lab.com/b5EBo9Uo-OK6SM09ZTkEZQ/6WwH44KVe6xQYufeWxKLEH/width=1200,format=jpeg` (thang, tháp người, sao, bò, nấm), `.../XdxLjyvqJAuho3U9MAUaYj/width=1200,format=jpeg` (vẽ nét, bong bóng có thang), `.../NrACapXXTQmp7ZB4cddn9e/width=1200,format=jpeg` (mưa), `.../75tCcjT4pbsUSt3d3qELQH/width=1200,format=jpeg`

Quan sát chính: bảng xanh ngọc có vệt lau; nét đất trắng dày sát đáy; người tí hon = đầu tròn to viền trắng, mắt chấm, mũ chóp nón màu nghiêng ra sau, thân áo nhỏ có "khăn" tam giác cùng màu mũ, tay chân que; đi thành hàng, hay trèo lên đầu nhau thành tháp; mây = cụm vòng tròn viền trắng; mưa = cột vệt trắng dày dưới mây; ụ hạt nâu trên đất; cây dâu lá xanh to có gân trắng, quả hồng-đỏ chấm trắng; nấm mũ hồng-đỏ chấm trắng; bò hồng-trắng; lửa đỏ-cam-vàng; thang trắng; bong bóng = vòng tròn trắng + 2 chấm bóng trắng góc trên phải + vật thu nhỏ bên trong; chim giấy nhỏ hồng/trắng bay thành đàn.

## 1. Kiến trúc & luật chung

| file | owner | nội dung |
|---|---|---|
| index.html, core.js | điều phối | shell, hằng số, helper, layer, vật lý, nét vẽ, input, fx, tick(), boot(), `window.__bb` |
| people.js | worker P | Person, drawPerson |
| sky.js | worker S | Cloud, updateRain, Star, burst, makeSun |
| ground.js | worker G | cỏ ba lá, Seed (cây dâu), drawBerry, waterAt |
| things.js | worker T | Item (thang/nấm/lửa/bò/dâu), Bubble, chim + đàn |

- Classic `<script>`: KHÔNG module/import/export, KHÔNG top-level await. Thứ tự nạp: pixi → core → people → sky → ground → things → `boot()`. Mọi file chung global scope.
- File entity CHỈ khai báo (class/function/const). Không chạy gì lúc nạp, không đụng `PIXI.*`/`app`/layer ở top-level (chỉ có sau `boot()`); dùng chúng bên trong constructor/method là đúng.
- Top-level CHỈ được khai báo đúng các tên liệt kê cho slice của bạn. Helper khác: đặt `static` trong class hoặc prefix `<slice>_` (vd `sky_puff`). Trùng tên `const/let/class` giữa các file = SyntaxError cả trang. Tên của core (mục 3) là tên dành riêng.
- KHÔNG sửa file khác (core.js, index.html, slice khác). Thiếu gì ở core → ghi vào báo cáo.
- Pixi **v8.6.6**. Graphics v8: `g.clear()`, `moveTo/lineTo`, `circle(x,y,r)`, `ellipse(x,y,rx,ry)`, `roundRect(x,y,w,h,r)`, `poly([x0,y0,…], true)`, `star(x,y,points,r,innerR,rot)`, `quadraticCurveTo`, `bezierCurveTo`, `closePath()`, `.fill(color | {color, alpha})`, `.stroke({width,color,alpha,cap,join})`. Gọi `fill()` rồi `stroke()` → stroke dùng lại path vừa fill. Nhiều subpath trước 1 lần `stroke()`/`fill()` vẽ chung 1 style. `poly(..., true)` để stroke khép kín. KHÔNG dùng API v7 (`lineStyle`, `beginFill`, `drawCircle`…). Sprite: `blendMode = 'add'`, `tint`, `anchor.set(0.5)`.

## 2. Tọa độ & quy ước vẽ

- Đơn vị thế giới: cao cố định `WH=900`, rộng `WW` (≈1600 trên 16:9). y hướng xuống. Stage đã scale sẵn.
- Mọi `y ≥ GY (780)` là đất. Thực thể đứng trên mặt có `y` = hàng pixel TRỐNG ngay trên mặt ("chân"; trên đất: `y = GY - 1`).
- Mỗi entity có 1 `PIXI.Graphics` (hoặc Container) riêng trong layer của nó. Mỗi frame chỉ cập nhật transform (position/scale/rotation/alpha); dựng lại nét (`clear()` + vẽ) ~12 fps bằng bộ đếm `this.redrawIn` (trừ dt, ≤0 thì vẽ và reset ~0.085s) + jitter `J()` → nét phấn "run" như vẽ tay.
- Vẽ ở tọa độ local: gốc (0,0) = chân/đế vật, mặt hướng +x; lật hướng bằng `g.scale.x = dir * s`.
- Nét phấn: `chalk(width, alpha)` (trắng CH, cap/join round). Màu tô: hex số (0xff4d7d).

## 3. Core API (core.js — tên dành riêng)

Hằng số: `WH, GY, CH, BOARD_TOP, BOARD_BOT, HATS, STAR_C, EDGE, STEP_UP, STEP_DN, BODY_H, HEAD_TOP, MAX_TOWER, G_P, VT_P, G_I, VT_I, LINE_LIFE, LR, MAX_LINES, MAX_ITEMS, MAX_SEEDS, MAX_CLOVERS, MAX_STARS, MIN_STARS, BEAM, BERRY_AT, HEADFILL`.
Helper: `rand(a,b)`, `pick(arr)`, `clamp(v,a,b)`, `J(amp=0.7)`, `chalk(w=2.4,a=0.95)`, `boardAt(y)` (màu nền bảng ở độ cao y), `swapRemove(arr,i)`, `put(obj, parent)` (addChild, trả obj), `glow(tint)` (Sprite phát sáng additive trong glowLayer, texture 128px ⇒ scale 1 = đường kính 128; tạo ra `visible=false`; caller tự set visible/position/scale/alpha và `destroy()`), `heartShape`, `skySpot()`.
Layer (có sau boot): `app, beamG` (Graphics vệt nắng), `lineLayer, cloverG` (Graphics cỏ), `plantLayer, itemLayer, glowLayer, peopleLayer, skyLayer, bubbleLayer, fxG`.
State: mảng `people, items, seeds, clovers, stars, clouds, bubbles, lines, birds, fx, drops`; `let WW, sun, cloverDirty, bubbleCD` (được gán từ slice).
Tên hàm/biến khác của core cũng dành riêng: `solid, disc, stampSeg, rebuildMask, topAt, firstSolid, walkStep, settle, airStep, Line, removeLine, toWorld, tapAt, onDown, onMove, onUp, makeBoard, layout, updateFx, drawFx, sweep, tick, boot, K, MW, mask, MAXP, MAXB, maskDirty, cloverIn, spawnCD, starCD, strokes, glowTex, boardS, groundG`.

Vật lý:
- `solid(x,y)` → bool (đất + nét vẽ).
- `walkStep(e, up, bodyH)` → `'ok' | 'wall' | 'fall'`. Dời e 1px theo `e.dir`, bám mặt (leo ≤ up px, xuống ≤ STEP_DN px). `'wall'` = mép màn/dốc quá đứng/nét chắn ngang thân → caller đổi hướng. `'fall'` = hụt chân (e đã dời tới) → caller chuyển sang bay/rơi. `e.x, e.y` phải là số nguyên.
- `settle(e)` → bool: gọi mỗi frame khi đứng trên mặt; tự nhấc e lên nếu nét mới vẽ đè chân; `false` = mặt dưới chân đã mất → caller cho rơi.
- `airStep(e, dt, g, vt, bodyH)` → `true` khi vừa chạm mặt (e.x làm tròn, e.y = chân trên mặt). Dùng `e.vx, e.vy`; nảy mép màn; đụng nét ngang thân thì bật ngược vx.
- `topAt(x,y)` → hàng trống ngay trên mặt tại (x,y). `firstSolid(x,y0,y1)` → hàng solid đầu tiên khi đi từ y0 xuống y1, `-1` nếu không có.

Nét vẽ `Line`: `pts` = [x0,y0,x1,y1,…], `age`, `drawing` (đang vẽ), `dead`, getter `fading` (sắp biến mất). Sống 60s + mờ 2.5s rồi core xóa và dựng lại mặt nạ.

Hạt fx — push object vào `fx`; core cập nhật + vẽ + xóa khi `t > life`:
- `{type:'spark', x, y, vx, vy, t:0, life, c, r, shape:'star'|'flower', rot}`
- `{type:'seed', x, y, vx, vy, t:0, delay}` — lấp lánh như sao nhỏ trong `delay` giây rồi thành hạt nâu rơi; chạm mặt → core tạo `new Seed(x, y)`.
- `{type:'flash', x, y, t:0, life, sprite: glow(color)}`
- `{type:'pop', x, y, t:0, life, r0}` (vòng nở)
- `{type:'drop', x, y, vx, vy, t:0, life}` (giọt bong bóng)
- `{type:'heart', x, y, vy, t, life}` (t âm = trễ)
- `{type:'ember', x, y, vy, t:0, life}`
Mưa: `drops` = `[{x, y, v, len}]` — core vẽ; sky.js cập nhật.

Vòng lặp core mỗi frame: lines → `sun.update` → `clouds[].update` → `updateRain` → `stars[].update` (+core thêm sao khi < MIN_STARS) → `bubbles[].update` (+sweep +core thêm bong bóng) → `items[].update` (+sweep) → `seeds[].update` (+sweep) → `ageClovers` → `people[].update` (+core thêm người tới MAXP, đi vào từ mép) → `updateFlock` → `birds[].update` → fx; rồi render: `sun.render`, `clouds/stars/bubbles/items/seeds/people/birds[].render(dt)`, `drawClovers()` (khi `cloverDirty`), fx.
"sweep" = core gọi `destroy()` rồi xóa khỏi mảng mọi phần tử có `dead === true`.
Input (core): chạm vật theo ưu tiên `bubble.pop()` > `burst(star.x, star.y, star.color, star)` > `person.poke()` > `cloud.tap()` > `sun.shine()`; chạm chỗ trống → vẽ nét; kéo nét qua bong bóng → `pop()`.
Boot: `sun = makeSun()`; 3 `new Cloud(x,y)`, 9 `new Star(x,y)`, MAXB `new Bubble()`, 7 `new Bird(i)`, 3 `new Seed(x, GY-1)`, 14 cỏ `{x, s, age}`, ~60% MAXP `new Person(x, dir)`.

## 4. Hợp đồng giữa các slice (field người khác đọc/ghi — PHẢI đúng tên)

| entity (file) | field/method công khai |
|---|---|
| Person (people) | `x, y` (chân, sim), `rx, ry` (vị trí vẽ đã làm mượt), `s` (scale), `dir`, `state` ∈ `'walk'|'ride'|'climb'|'air'`, `rider`, `carrier`, getter `busy`, `eat` (quả đang ăn); methods `update(dt)`, `render(dt)`, `poke()`. Không bao giờ bị xóa. |
| Item (things) | `type` ∈ `'ladder'|'mushroom'|'fire'|'cow'|'berry'`, `x, y` (đế = chân trên mặt; số nguyên khi `'live'`), `state` ∈ `'fall'|'live'|'fade'`, `k` (nấm lớn dần 0.4→1), `squash` (Person gán 1 khi nhún), `h` (thang cao 300), `dir` (bò), `air` (bò đang nhảy/rơi), `taken` (quả dâu: người đang ăn hoặc null), `dead` (Person gán true khi ăn xong quả dâu). Hình học: mũ nấm đỉnh `y - 42*k`, nửa rộng `27*k`; thang từ `y` lên `y - h`. |
| Seed (ground) | `x, y` (chân ụ đất), `stage` 0..4 (4 = có quả), `berries` = `[{slot, plant, taken, grow}]`, method `rain()`. Người ăn xong → `plant.berries.splice(indexOf(b),1)`. Vị trí quả: `plant.x + BERRY_AT[slot][0]`, cao `56*BERRY_AT[slot][1]` trên chân. |
| Star (sky) | `x, y, r, color, k` (hiện dần 0→1), `destroy()` |
| Cloud (sky) | `x, y, w, h, rain` (giây còn mưa; Person gán `rain = Math.max(rain, 5)`), `tap()` |
| sun (sky, object từ makeSun) | `x, y, r, on` (giây còn sáng), `id` (tăng mỗi lần chạm), `shine()`, `lit(x, y)` (điểm chân có trong vệt nắng không), `update(dt)`, `render(dt)` |
| hàm | `burst(x,y,color,star?)` (sky), `waterAt(x,y,ground)` + `drawBerry(g,x,y,s)` (ground), `trimItems()` (things) |

## 5. Đặc tả từng slice

### (P) people.js — top-level: `Person`, `drawPerson`, `towerDepth`

```
class Person
  constructor(x, dir): x = Math.round(x); y = GY-1; rx,ry = x,y; vx=vy=0; dir; acc=0 (tích lũy bước 1px)
    s = rand(0.9,1.08); speed = rand(36,54); hat = pick(HATS); state='walk'; anim = rand(0,6.3)
    idleT=0; nextIdle=rand(3,12); eatT=0; eat=null; spinT=0; glowT=0; sunId=-1; hotT=0; surpriseT=0; rot=0; rotV=0
    carrier=null; rider=null; ox=0; ladder=null; seen=null; bumpCD=rand(0,2)
    g = put(new PIXI.Graphics(), peopleLayer); g.pivot.set(0,-30); redrawIn=0; gl=null (sprite glow tạo lười)
  get busy(): idleT>0 || eatT>0 || spinT>0
  detach(): nếu carrier → carrier.rider=null, carrier=null; ladder=null; nếu eat → eat.taken=null, eat=null, eatT=0
  fly(vx,vy): detach(); state='air'; this.vx=vx; this.vy=vy; idleT=0
  mount(q): detach(); carrier=q; q.rider=this; state='ride'; ox=clamp(x-q.x,-8,8); rot=rotV=0; bumpCD=2
  poke(): surpriseT=1; nếu state!=='air' → fly(0, -rand(300,360))          // bị chạm: giật mình nhảy, giơ tay, miệng "o"
  startEat(b): eat=b; b.taken=this; eatT=1.4; bx = b.plant ? b.plant.x + BERRY_AT[b.slot][0] : b.x; |bx-x|>2 → dir=sign(bx-x)
  finishEat(): b=eat; eat=null; không có b → return
    b.plant ? b.plant.berries.splice(b.plant.berries.indexOf(b),1) : (b.dead = true)
    2 fx heart {x: x±6, y: y-70*s, vy: -rand(30,50), t: 0 và -0.25, life: 1.4}; nếu state==='walk' → fly(0,-240) (nhảy mừng)
  update(dt):
    bumpCD, hotT, surpriseT, glowT -= dt; spinT>0 → spinT -= dt; eatT>0 → eatT -= dt, ≤0 → finishEat()
    state: 'walk'→walk(dt) | 'ride'→ride(dt) | 'climb'→climb(dt) | 'air'→air(dt)
    touch()
    anim += dt * ((state walk|ride && !busy) ? speed*0.19 : state==='climb' ? 9 : 3)
  walk(dt):
    !settle(this) → fly(dir*speed*0.5, 0); return
    busy → (idleT>0: idleT -= dt; vừa hết thì 30% quay đầu); return
    nextIdle -= dt ≤ 0 → idleT=rand(0.7,2.5); nextIdle=rand(5,14); return        // đứng ngó nghiêng
    acc += speed*dt; while acc ≥ 1: acc -= 1; r = walkStep(this, STEP_UP, BODY_H*s)
      'wall' → dir *= -1; acc = 0; break      'fall' → fly(dir*speed, 0); return
    look()
  look(): (đang đi trên mặt)
    items có state==='live' và |it.y-y| ≤ 10:
      'ladder' && |it.x-x| < 2 && seen !== it → seen=it; 80%: detach(); state='climb'; ladder=it; x=it.x; return
      'mushroom' && |it.x-x| < 12*it.k → it.squash=1; fly(dir*rand(40,160), -rand(1050,1250)); return    // bật lên trời
      'berry' && |it.x-x| < 8 && !it.taken → startEat(it); return
    seeds có stage===4, |s.y-y| ≤ 10, |s.x-x| < 2, seen !== s → seen=s; quả đầu tiên có taken==null → startEat(b); return
    chồng người (chỉ khi bumpCD ≤ 0): q !== this, q.state==='walk', ahead=(q.x-x)*dir ∈ [3,12], |q.y-y| ≤ 5
      bỏ qua q nếu q cùng hướng, không busy và q.speed ≥ speed (không đuổi kịp)
      bumpCD=2.5; 55%: top=q, d=1; while top.rider: top=top.rider, d++; d < MAX_TOWER → mount(top)   // trèo lên đầu thành tháp
      return    (45% còn lại: đi xuyên qua nhau như bản gốc)
  ride(dt):
    c=carrier; !c || c.state==='air' || c.state==='climb' → fly(dir*40, -60); return      // tháp đổ
    idleT>0 → idleT -= dt; ngược lại !busy → ox += dir*speed*0.4*dt
    x = c.x + ox; y = c.y - HEAD_TOP*c.s
    |ox| > 11*c.s → fly(dir*rand(50,90), -rand(140,220))      // bước hụt khỏi đầu → nhảy xuống
  climb(dt):
    L=ladder; !L || L.state!=='live' → fly(0,0); return
    x=L.x; có Person khác state==='climb', cùng ladder, q.y < y và y-q.y < 44 → đứng chờ; ngược lại y -= 55*dt
    y ≤ L.y - L.h + 4 → fly(dir*rand(60,150), -rand(220,340))   // lên đỉnh thang nhảy ra
  air(dt):
    rot += rotV*dt
    vy > 0:
      nấm: items type 'mushroom' state 'live', top = it.y - 42*it.k, |it.x-x| < 27*it.k, y ≤ top ≤ y+vy*dt
           → it.squash=1; vy=-rand(1000,1200); vx=dir*rand(40,150); rot=rotV=0; return
      đầu người: q !== this, !q.rider, q.state không phải 'air'/'climb', top = q.y - HEAD_TOP*q.s, |q.x-x| < 9,
           y ≤ top ≤ y+vy*dt, towerDepth(q) < MAX_TOWER → mount(q); return
    airStep(this, dt, G_P, VT_P, BODY_H*s) → true: land(): x,y=Math.round; state='walk'; acc=0; rotV (bị bò húc) → idleT=0.7 (choáng); rot=rotV=0
  touch(): (mọi state) hx=x; hy = y - 42*s (đầu)
    items:
      'fire' (state 'fall' hoặc 'live'), hotT ≤ 0, |it.x-x| < 22, it.y-44 < y < it.y+30
        → away = Math.sign(x-it.x) || -dir; dir=away; hotT=1.1; surpriseT=1; fly(away*rand(170,250), -rand(380,480)); return
      'cow' state 'live' && !it.air, state của mình !== 'air', |it.x + it.dir*10 - x| < 26, |it.y-y| < 26
        → surpriseT=1.2; rotV = rand(7,12)*it.dir; fly(it.dir*rand(240,360), -rand(430,620)); return
    sun.on > 0 && sunId !== sun.id && state không 'air'/'climb' && sun.lit(x,y) → sunId=sun.id; spinT=2.2; glowT=9
    stars: s.k > 0.8 && |s.x-hx| < 20 && |s.y-hy| < 26 → burst(s.x, s.y, s.color, s); break     // chạm sao → thêm sao
    clouds: |c.x-hx| < c.w*0.45 && |c.y-hy| < c.h*0.55 → c.rain = Math.max(c.rain, 5)          // chạm mây → mưa
  render(dt):
    k = state==='air' ? 1 : Math.min(1, dt*(state==='ride' ? 9 : 20)); rx += (x-rx)*k; ry += (y-ry)*k
    g.position.set(rx, ry - 30*s); g.scale.set(s*dir*(spinT>0 ? Math.cos(spinT*14) : 1), s); g.rotation = rot
    (redrawIn -= dt) ≤ 0 → redrawIn = rand(0.075,0.095); drawPerson(g, this)
    glowT > 0 → gl = gl || glow(0xfff4b8); gl.visible=true; gl.position.set(rx, ry-32*s); gl.scale.set(1.1 + 0.08*Math.sin(anim*3)); gl.alpha = Math.min(1, glowT/2)*0.9
    ngược lại gl && (gl.visible=false)
function towerDepth(q): d=1; c=q.carrier; while c: d++, c=c.carrier; return d
function drawPerson(g, p): g.clear(); local: chân (0,0), mặt hướng +x, cao ~67 tới chóp mũ
  walking = (state walk|ride) && !busy; air; climb; up = air || climb || spinT>0 || surpriseT>0; a=anim; sw = walking ? sin(a) : 0
  chân từ hông (-1.5,-15) và (1.5,-15): đi → (sw*7, -max(0,cos a)*3) và (-sw*7, -max(0,-cos a)*3); đứng → (-3.5,0),(3.5,0)
      leo → (-4, -2+sin(a)*4),(4, -2-sin(a)*4); bay → (-5,-1),(5,-4). Đầu mút + J()
  tay từ vai (-2,-26),(2,-26): đi → (-sw*6-2,-16),(sw*6+2,-16); ăn → (-6,-17) và (9, -40+sin(a*5)*2) (với lên quả)
      up → w=sin(a*3)*2: (-9,-39+w),(9,-39-w). → 1 lần stroke chalk(2.3)
  thân áo: tứ giác (-4,-29)(-6.5,-15)(6.5,-15)(4,-29) (+J(.4)) khép kín → fill {HEADFILL,0.55} + stroke chalk(2.2)
  khăn: poly([-3.2,-28.6, 3.2,-28.6, 0.4,-19], true) fill p.hat
  đầu: hx=J(.35), hy=-40+J(.35); circle(hx,hy,11) fill {HEADFILL,0.6} + stroke chalk(2.4); mắt circle(hx+5.5,hy-1.5,1.5) fill CH
  miệng "o" khi surpriseT>0 || eatT>0: circle(hx+7.2,hy+5,1.7) stroke chalk(1.3)
  mũ chóp nón nghiêng ra sau: poly([hx-11,hy-4, hx+8,hy-7.5, hx-8+J(.6),hy-27+J(.6)], true) fill p.hat + stroke chalk(2.2)
```

### (S) sky.js — top-level: `Cloud`, `updateRain`, `Star`, `burst`, `makeSun`

```
class Cloud
  constructor(x,y): w=rand(110,150); h=w*0.5; speed = rand(5,11)*(Math.random()<0.5?1:-1); rain=0; acc=0; poke=0
    puffs theo tỷ lệ w: [[-0.3,0.12,0.2],[0,0.16,0.22],[0.3,0.12,0.19],[-0.13,-0.12,0.23],[0.15,-0.1,0.21]] → [dx*w, dy*w, r*w]
    g = put(new PIXI.Graphics(), skyLayer); redrawIn=0
  tap(): rain = Math.min(12, Math.max(rain,0) + 6); poke = 1
  update(dt): x += speed*dt; quấn vòng: x > WW+w → x=-w; x < -w → x=WW+w; poke *= Math.exp(-4*dt)
    rain > 0: rain -= dt; acc += 95*dt; while acc ≥ 1: acc -= 1; drops.push({x: x + rand(-0.4,0.4)*w, y: y + h*0.4, v: rand(650,850), len: rand(14,26)})
  render(dt): g.position.set(x,y); g.scale.set(1 + 0.08*poke)
    redraw ~10fps: clear; mọi puff circle(dx+J(.5), dy+J(.5), r) → stroke chalk(5,0.95); rồi mọi puff circle(dx,dy,r-0.5) → fill(boardAt(y))
      ⇒ chỉ còn viền ngoài của cụm (các cung bên trong bị nền che)
  (mây không bao giờ bị xóa, không cần destroy)
function updateRain(dt): duyệt ngược drops (xóa bằng swapRemove):
  ny = d.y + d.v*dt; hit = firstSolid(d.x, d.y, ny)
  hit < 0 → d.y = ny (xóa nếu d.y > WH); ngược lại xóa + waterAt(d.x, hit-1, hit >= GY)
class Star
  constructor(x,y): r=rand(9,13); color=pick(STAR_C); t=rand(0,6); k=0; g=put(new PIXI.Graphics(), skyLayer); redrawIn=0
  update(dt): t += dt; k = Math.min(1, k + 1.5*dt)
  render(dt): position (x, y + sin(t*0.8)*3); scale k*(0.9 + 0.12*sin(t*3)); rotation sin(t*0.7)*0.15
    redraw ~8fps: clear; star(J(.3),J(.3),5,r,r*0.5,0) stroke {width 2.4, color, alpha .95, join 'round'}
  destroy(): g.destroy()
function burst(x,y,color,star):
  star → xóa khỏi `stars` (splice) + star.destroy()
  fx.push({type:'flash', x, y, t:0, life:0.7, sprite: glow(color)})
  22 spark: góc rand, tốc rand(70,260), life rand(2.2,3.8), c pick(STAR_C), r rand(4,8), shape 60% 'star' / 40% 'flower', rot rand(0,6)
  3 seed: vx = ±rand(60,160), vy = -rand(40,140), delay rand(0.5,0.9)                // "vài sao thành hạt giống"
  tối đa 2 new Star quanh (x+rand(-160,160), y+rand(-90,60)) kẹp x∈[40,WW-40], y∈[50,GY-330], chỉ khi stars.length < MAX_STARS   // "thêm sao"
function makeSun(): trả object
  { x: WW-150, y: 112, r: 28, on: 0, id: 0, t: 0, redrawIn: 0, g: put(new PIXI.Graphics(), skyLayer), gl: glow(0xfff0a0),
    shine(): on = 8; id++
    lit(x,y): t=(y-this.y)/(GY-this.y); return t > 0 && |x-this.x| < r + (BEAM-r)*t
    update(dt): t += dt; on > 0 → on -= dt
    render(dt): a = clamp(on,0,1) (tắt dần giây cuối); g.position.set(x,y); g.rotation = t*(0.05 + a*0.6)
      redraw ~10fps: circle(J(.5),J(.5),r); a>0 → fill {0xfff3b0, 0.35*a}; stroke chalk(3); 12 tia từ bán kính r+7 dài 10+12*a (+J(1.5)) → stroke chalk(2.6)
      gl.visible = a > 0; gl.position.set(x,y); gl.scale.set(2.2 + 1.5*a + 0.1*sin(4t)); gl.alpha = a
      beamG.clear(); a > 0 → beamG.poly([x-r,y, x+r,y, x+BEAM,GY, x-BEAM,GY], true).fill({color:0xfff6c4, alpha:0.13*a})
                              + hình thang hẹp 0.6 lần (cả r và BEAM) fill {0xfff6c4, 0.08*a} }
```

### (G) ground.js — top-level: `GROW`, `LEAVES`, `waterAt`, `ageClovers`, `drawClovers`, `Seed`, `drawPlant`, `leaf`, `drawBerry`

```
const GROW = [20, 70, 140, 200]     // số giọt mưa để lên stage 1 (mầm), 2 (cây nhỏ), 3 (cây lớn), 4 (ra dâu)
const LEAVES = [[-2.5,.3],[-.6,.35],[-2.8,.6],[-.35,.62],[-2.2,.85],[-.95,.88],[-1.57,1]]   // [góc rad, độ cao tương đối trên thân]
function waterAt(x, y, ground): (giọt mưa chạm mặt tại x; y = hàng chân)
  seed có |s.x-x| < 22 && |s.y-y| < 10 → s.rain(); return
  !ground || Math.random() > 0.1 → return               // cỏ chỉ mọc trên mặt đất
  cỏ c có |c.x-x| < 7 → c.s = Math.min(1, c.s+0.25); không có && clovers.length < MAX_CLOVERS → clovers.push({x, s:0.3, age:0})
  cloverDirty = true
function ageClovers(dt): mọi cỏ age += dt; age > 140 → s -= 0.4*dt, cloverDirty = true; s ≤ 0.05 → xóa
function drawClovers(): cloverG.clear(); rỗng → return
  mọi cỏ: moveTo(x, GY) lineTo(x+1, GY-9*s) → 1 lần stroke {width 1.8, color 0x49e28e, cap 'round'}
  mọi cỏ: 3 lá tròn r=3.3*s quanh đỉnh cuống (x+1, GY-9*s) lệch theo góc -90°, 30°, 150° một khoảng r → 1 lần fill {0x49e28e, 0.95}
class Seed   // ụ đất nâu; mưa đủ thì thành cây dâu
  constructor(x,y): x,y = Math.round; vx=vy=0; water=0; stage=0; gv=0 (stage hiển thị, lerp); berries=[]; idle=0; falling=false; next=0
    g = put(new PIXI.Graphics(), plantLayer); redrawIn=0
  rain(): water++; idle=0; while stage < 4 && water ≥ GROW[stage] → stage++
    stage===4: next===0 → addBerry(); addBerry(); next = water + 90;  ngược lại water ≥ next → addBerry(); next += 90
  addBerry(): slot = số đầu tiên trong [0,1,2] chưa có trong berries[].slot; có → berries.push({slot, plant:this, taken:null, grow:0})
  update(dt): idle += dt
    falling → airStep(this, dt, G_I, VT_I, 6) true → falling=false;  ngược lại !settle(this) → falling=true; vx=vy=0
    gv += (stage-gv)*Math.min(1, 1.5*dt); berries[].grow = Math.min(1, grow+dt)
    life = stage ? 150 : 90; idle > life + 2 → dead = true
  render(dt): g.position.set(x,y); g.alpha = clamp(1 - (idle-life)/2, 0, 1); redraw ~9fps: drawPlant(g, this)
  destroy(): mọi berry có taken → taken.eat = null; g.destroy()
function drawPlant(g, s): g.clear(); ụ đất: moveTo(-14,1).quadraticCurveTo(0,-12,14,1) fill 0x8a4636
  s.gv < 0.05 → return. t=Math.min(1,gv/3); stemH=6+50*t; len=(7+19*t)*Math.min(1,gv*2); wid=3+6*t
  thân: moveTo(0,-3).quadraticCurveTo(J(1.5), -stemH/2, J(1), -stemH) stroke {width 2.4, color 0x35c97c, cap 'round'}
  n = gv < 1.5 ? 2 : gv < 2.5 ? 4 : 7; lá i<n: leaf(g, 0, -stemH*LEAVES[i][1], LEAVES[i][0]+J(0.04), len, wid)
  quả: drawBerry(g, BERRY_AT[b.slot][0], -56*BERRY_AT[b.slot][1], 0.35 + 0.65*b.grow)
function leaf(g,x,y,ang,len,wid): c=cos(ang), s=sin(ang); tip=(x+c*len, y+s*len); giữa=(x+c*len/2, y+s*len/2)
  moveTo(x,y).quadraticCurveTo(giữa.x - s*wid, giữa.y + c*wid, tip).quadraticCurveTo(giữa.x + s*wid, giữa.y - c*wid, x,y) fill 0x34c77b + stroke chalk(1.6,0.9)
  gân giữa (x,y)→85% độ dài + 2 cặp gân phụ chéo ra hai bên ở 35% và 60% → 1 lần stroke chalk(1.1,0.75)
function drawBerry(g,x,y,s): quả dâu tây, (x,y) = đỉnh quả, cao ~17*s, rộng ~16*s: thân tròn nhọn đáy fill 0xff2f84 + stroke {width 1.4, color CH, alpha .9}
  5 chấm hạt trắng r=0.9*s rải trên thân → 1 lần fill CH; đài lá xanh 0x3ed67f (poly 4 đỉnh, khép) ở đỉnh quả
```

### (T) things.js — top-level: `ITEM_TYPES`, `LIFE`, `ICON`, `Item`, `drawItem`, `trimItems`, `Bubble`, `flock`, `Bird`, `updateFlock`, `drawBird`

```
const ITEM_TYPES = ['ladder','ladder','mushroom','mushroom','fire','cow','star','berry','berry']   // có trọng số
const LIFE = { ladder: 45, mushroom: 45, fire: 10, cow: 30, berry: 40 }                             // giây sau khi chạm đất
const ICON = { ladder:[0.3,17], cow:[0.42,10], mushroom:[0.55,11], fire:[0.6,12], star:[1,0], berry:[1.25,10] }  // [scale, dịch y] để vật nằm giữa bong bóng
class Item   // vật rơi ra từ bong bóng
  constructor(type,x,y): type,x,y; vx=rand(-15,15); vy=0; state='fall'; age=0; anim=0; squash=0; acc=0
    k = type==='mushroom' ? 0.4 : 1; dir = Math.random()<0.5?1:-1; air=false; taken=null; dead=false
    rot = type==='ladder' ? rand(-0.5,0.5) : 0; h=300; speed=rand(130,170); redrawIn=0
    g = put(new PIXI.Graphics(), itemLayer); gl = type==='fire' ? glow(0xff7a30) : null
  update(dt): age += dt; anim += dt; squash *= Math.exp(-7*dt)
    'fall': airStep(this, dt, G_I, VT_I, 8) true → state='live'; age=0; rot=0; vx=0 (thang dựng thẳng). return
    'fade': (fadeT -= dt) ≤ 0 → dead=true. return
    'live': mushroom → k = Math.min(1, k+2.5*dt); cow → run(dt); loại khác → !settle(this) → state='fall', vy=0 (nét đỡ mất thì rơi)
      age > LIFE[type] → fade()
      fire: Math.random() < 14*dt → fx.push({type:'ember', x: x+rand(-8,8), y: y-rand(10,30), vy: -rand(40,90), t:0, life: rand(0.5,0.9)})
  fade(): state='fade'; fadeT=1.2
  run(dt): (con bò)
    air → airStep(this, dt, G_I, VT_I, 30) true → air=false; return
    !settle(this) → air=true; vx=dir*60; vy=0; return
    acc += speed*dt; while acc ≥ 1: acc -= 1; r = walkStep(this, 4, 34)
      'wall' → dir *= -1; acc=0; break      'fall' → air=true; vx=dir*speed*0.8; vy=0; break
    Math.random() < 0.3*dt → air=true; vx=dir*speed; vy=-rand(260,380)          // thỉnh thoảng nhảy cẫng
  render(dt): a = state==='fade' ? Math.max(0, fadeT/1.2) : 1; g.position.set(x,y); g.rotation=rot; g.alpha=a
    mushroom → g.scale.set(k*(1+0.25*squash), k*(1-0.35*squash)); cow → g.scale.set(dir,1); fire → g.scale.set(a)
    (redrawIn -= dt) ≤ 0 → redrawIn = type==='fire' ? 0.06 : 0.085; drawItem(g, type, this)
    gl → visible=true; position (x, y-18); scale 0.95 + Math.random()*0.12; alpha 0.5*a
  destroy(): g.destroy(); gl && gl.destroy()
function drawItem(g, type, it): g.clear(); rồi theo type (local, đế tại (0,0), mặt +x):
  ladder: 2 thanh dọc x=±9 từ 0 lên -it.h; bậc ngang mỗi 15px từ y=-12 lên; J() nhẹ → stroke chalk(2.6)
  mushroom: cuống roundRect(-7,-17,14,17,5) fill {0xfdf4e6,.95} + stroke chalk(2.2); mũ vòm (-27,-14)→(0,-42)→(27,-14) khép kín fill 0xff4d7d + stroke chalk(2.4);
            3 chấm trắng circle(-12,-27,3.8) circle(3,-35,3.2) circle(15,-23,3) → fill CH
  fire: 3 lớp ngọn lửa hình giọt đáy phẳng (rộng 17/12/6.5, cao 40/28/16 × rand(.85,1.15)) màu 0xff4b2e / 0xff9a2e / 0xffe46a, đỉnh lắc J(2)
  cow: dài ~70 cao ~48: 4 chân que x=-19,-12,13,20 từ y=-14 xuống 0 (chạy: đầu mút lệch sin(it.anim*14 + (i%2)*π)*6; it.air: xoạc cố định ±3);
       đuôi cong sau; thân ellipse(0,-25,27,14) fill 0xffd9ea + stroke chalk(2.4); 2 đốm ellipse fill 0xff8fc0; 2 sừng ngắn;
       đầu ellipse(29,-33,11,9) fill 0xffd9ea + stroke; mõm ellipse(37,-29,6,4.5) fill 0xff9fc8 + stroke chalk(1.6); mắt chấm 0x1f4f52
  berry: drawBerry(g, 0, -17, 1)          // hàm của ground.js
  star: g.star(0,0,5,12,6,0).stroke({width:2.4, color:0xffe45c, join:'round'})
function trimItems(): các item có state !== 'fade': số lượng > MAX_ITEMS → item cũ nhất (đầu mảng) .fade()
class Bubble
  constructor(): x=rand(80,WW-80); y=rand(170,GY-300); r=rand(30,38); vx=rand(-16,16); vy=rand(-7,7); t=rand(0,6); k=0 (nở dần); type=pick(ITEM_TYPES); dead=false; redrawIn=0
    c = put(new PIXI.Container(), bubbleLayer); ring = put(new PIXI.Graphics(), c); icon = put(new PIXI.Graphics(), c)
    [sc, oy] = ICON[type]; icon.scale.set(sc); icon.position.set(0, oy); drawItem(icon, type, {h:110, anim:0, air:true})   // vật thu nhỏ bên trong, vẽ 1 lần
  update(dt): t += dt; k = Math.min(1, k+1.2*dt); x += vx*dt; y += (vy + Math.sin(t*1.3)*9)*dt
    dội: x<60 → vx=|vx|; x>WW-60 → vx=-|vx|; y<150 → vy=|vy|+2; y>GY-250 → vy=-|vy|-2
  pop(): dead=true; fx.push({type:'pop', x, y, t:0, life:0.35, r0:r}); 8 fx drop quanh viền (vx,vy = hướng ra × 90, life 0.5)
    type==='star' → burst(x, y, 0xffe45c);  ngược lại items.push(new Item(type, x, y+8)); trimItems()
    bubbleCD = rand(2,5)      // biến let của core: hẹn giờ bong bóng mới
  render(dt): c.position.set(x,y); c.scale.set(k*(1 + 0.03*Math.sin(t*2.2)))
    ring redraw ~8fps: clear; circle(0,0,r) fill {CH,0.06} + stroke chalk(2.2,0.85); circle(0.36*r+J(.3), -0.44*r, 0.19*r) fill {CH,0.95}; circle(0.62*r, -0.14*r, 0.09*r) fill {CH,0.9}
  destroy(): c.destroy({children:true})
const flock = { x:200, y:180, tx:600, ty:200, t:0, cd: 6 + Math.random()*4, mode:'fly' }   // tâm đàn chim (KHÔNG gọi rand ở top-level cũng được vì core.js nạp trước — nhưng dùng Math.random cho chắc)
class Bird
  constructor(i): ox=rand(-70,70); oy=rand(-35,35) (chỗ trong đàn); x=flock.x+ox; y=flock.y+oy; vx=vy=0; flap=rand(0,6)
    color = i%3 ? 0xffa6d2 : CH; state='fly' ('fly'|'land'|'perch'); face=1; line=null; px=py=0; t=0
    g = put(new PIXI.Graphics(), skyLayer); redrawIn=0
  update(dt):
    'perch': t -= dt; t ≤ 0 || !line || line.dead || line.fading → state='fly'; vy=-120. return
    'land': đích (px,py), tốc 110; !line || line.dead || line.fading → state='fly'
            khoảng cách < 4 → state='perch'; x=px; y=py; t=rand(2,5) (nghỉ chốc lát); vx=vy=0; return
    'fly': đích = (flock.x + ox + sin(flock.t*1.7 + ox)*12, flock.y + oy + cos(flock.t*1.3 + oy)*8), tốc 150
    lái mượt: d = khoảng cách tới đích; want = Math.min(tốc, d*3); vx += ((dx/d)*want - vx)*Math.min(1, 2.5*dt) (vy tương tự)
    x += vx*dt; y += vy*dt; flap += 16*dt; |vx| > 8 → face = Math.sign(vx)
  render(dt): g.position.set(x,y); g.scale.set(face,1); redraw ~12fps: drawBird(g, this)
  destroy(): g.destroy()
function updateFlock(dt): flock.t += dt
  mode 'fly': bay về (tx,ty) 95px/s; khoảng cách < 20 → tx=rand(120,WW-120), ty=rand(90,360)
    (flock.cd -= dt) ≤ 0: ứng viên = lines có !drawing && !dead && !fading && pts.length ≥ 16 && age < LINE_LIFE-8
      có → l=pick(ứng viên); n=pts.length/2; c=rand int [0,n); mỗi chim: i=clamp(c + randInt(-7..7), 0, n-1); b.line=l; b.px=pts[2i]; b.py=topAt(pts[2i], pts[2i+1]); b.state='land'
            flock.x = pts[2c]; flock.y = pts[2c+1] - 60; mode='rest'
      không → cd = 3
  mode 'rest': mọi chim đã state==='fly' → mode='fly'; cd=rand(8,15); flock.x/y = trung bình vị trí chim; tx,ty mới
function drawBird(g,b): g.clear(); chim giấy nhỏ ~18px, mặt +x
  bay: poly([-9,0, 5,-2, 9,-1, 5,2], true) fill b.color; cánh tam giác poly([-3,-1, 4,-1, -1, -1-11*Math.sin(b.flap)], true) fill {b.color, .9}
  đậu (state 'perch', gốc = chân trên nét): thân poly([-9,-4, 5,-6, 9,-5, 5,-2, -3,-1], true) fill b.color; cánh gập poly([-7,-5, 3,-6, -9,-9], true) fill {b.color,.85}
```

## 6. Nghiệm thu chung cho mọi worker
- File slice của bạn tồn tại, chỉ khai báo đúng tên top-level trong danh sách, đúng field/method hợp đồng mục 4.
- `node --check <file>.js` qua (chỉ kiểm cú pháp; KHÔNG chạy build/test/formatter khác).
- Không sửa file nào khác.
