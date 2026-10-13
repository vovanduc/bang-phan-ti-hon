# Demo "Bảng Làng" — đàn trâu phấn trắng (prep cho F007 AI Riser 2026)

> Ghi lại các tính năng user đã yêu cầu qua 3 vòng build nhanh (2026-07-27) + bản v4 dựng lại sát bản gốc (2026-09-28), làm mốc lên ý tưởng tiếp.
> Demo chạy được: mở file HTML trong browser (cần internet cho CDN) hoặc `python3 -m http.server` ở root repo.

## Bối cảnh
Remix teamLab "A Blackboard where Little People Live" (xem `docs/intake/2026-07-18-teamlab-blackboard-little-people.md`) — skin làng quê VN, trâu thay người tí hon. Câu hỏi mở đầu: PixiJS hay Three.js? → Kết luận: **chuyển động nằm ở lớp sim (state machine + vị trí), renderer nào cũng vẽ được**; sim viết tách khỏi renderer thì đổi renderer không đụng logic.

## Tính năng user yêu cầu (theo thứ tự)
1. **Build nhanh PixiJS để review** — 1 màn hình, trâu xuất hiện từ trái, ramp 10 → 50 con.
2. **Đụng mép màn quay đầu** (đúng bản gốc teamLab): trâu sống trong khung, không đi xuyên ra ngoài.
3. **Random con lười**: ~25% đàn đứng gặm 8–18s (thường 1.5–4s); ngủ dậy 30% đổi hướng.
4. **1 mặt phẳng duy nhất** (side-view như teamLab, không phải nhiều hàng depth) — để sau này vẽ vạch/cầu thang thành địa hình được.
5. **Không che nhau — chồng tầng** (theo ảnh chụp bản gốc): 1 vị trí chỉ 1 con mỗi tầng, con tới sau trèo lên tầng trống thấp nhất, hết kẹt tụt xuống. Tối đa 4 tầng.
6. **Tương tác chuột = cảm ứng teamLab**: click mây → mưa 5s → cỏ mọc chỗ mưa rơi (chuỗi nhân-quả mây→mưa→cỏ).
7. **Giữ lại bản v1 nông trại** — user thấy nhiều hàng depth "thực tế hơn, như trong nông trại; ngoài đời trâu không trèo lên nhau" → giữ làm hướng ý tưởng riêng.
8. **Bản Three.js để so sánh** với PixiJS.
9. **Dựng lại giống bản gốc nhất** (2026-09-28): bỏ skin trâu, làm đúng 4 nhóm chức năng chính thức của teamLab (vẽ nét, chạm, bong bóng, chuỗi sao → hạt → dâu) — xem mục v4.
10. **Có tiếng như bản gốc** (2026-09-28): bản gốc ghi công "Sound: teamLab" → v4 thêm âm thanh tổng hợp — xem mục v4. User đánh giá v4: "bản giống thật nhất mà tôi thấy".

## Các bản demo
| File | Mô tả |
|---|---|
| `archive/v1-nong-trai-pixi.html` | Nông trại: nhiều hàng depth (gần to xa nhỏ), trâu đi 1 chiều trái→phải rồi respawn. Tính năng 1–3. **User thích hướng "thực tế" này.** |
| `archive/v2-teamlab-pixi.html` | TeamLab-style: 1 mặt phẳng, bật mép, chồng tầng, click mây → mưa → cỏ. Tính năng 1–6. |
| `archive/v3-teamlab-three.html` | Cùng sim với v2, render bằng Three.js (ortho camera + LineSegments) để so sánh. |
| `index.html` | Dựng lại sát bản gốc: người tí hon mũ chóp màu trên bảng xanh ngọc, nét vẽ thành địa hình, đủ 4 nhóm chức năng chính thức. Tính năng 9. Thư mục nhiều file (core + 4 slice). |

## Kỹ thuật chung (v1–v3)
- Thẩm mỹ bảng đen: nét phấn trắng `#f0ead8` trên nền `#182420`, jitter ±0.9px redraw ~11fps (chalk boil — cảm giác vẽ tay).
- Trâu = line-art vẽ code (thân ellipse, bướu vai, sừng lưỡi liềm, 4 chân lệch pha, đuôi ve vẩy, đầu cúi khi gặm) — không asset ảnh.
- Behavior state machine: `walk` ↔ `graze`. Sim thuần (x, dir, state, level) tách khỏi vẽ.
- 50 con @ 60fps thoải mái. Stack resolve O(n²)/frame — lên trăm con mới cần spatial grid.

## So sánh PixiJS vs Three.js (kết quả thực nghiệm)
- **PixiJS thắng cho thể loại này**: có Graphics API vẽ nét trực tiếp (`quadraticCurveTo`, `ellipse`, stroke width/cap tùy ý). Code vẽ ngắn, nét phấn dày 2.4px đúng chất bảng đen.
- **Three.js làm được nhưng gượng**: phải tự sample đường cong thành đoạn thẳng, tự quản BufferGeometry; `LineBasicMaterial` bị giới hạn WebGL **1px** — nét mảnh, mất chất phấn (muốn nét dày phải dùng Line2/fat-lines addon). Chỉ đáng nếu sau này muốn look 3D/2.5D.
- Sim giống hệt nhau chạy trên cả 2 → xác nhận kiến trúc "core sim tách renderer" trong intake là đúng.

## v4 — dựng lại sát bản gốc (2026-09-28)
Đối chiếu: trang chính thức (4 nhóm FUNCTION) + 3 video teamLab (McDonald's Ikegami, LECT Hiroshima, Giants Kids Park) xem theo khung hình.

| Chức năng gốc | Cách làm trong v4 |
|---|---|
| Vẽ nét → người chạy trên nét, leo núi, nét làm vật cản | Nét "đóng dấu" vào mặt nạ va chạm 1 byte/pixel; người bước 1px kiểu Lemmings: leo ≤3px mỗi 1px ngang (~71°), dốc hơn hoặc nét chắn ngang thân thì quay đầu. Nét sống 60s rồi mờ, người đứng trên đó rơi xuống |
| Chim đậu nghỉ trên nét | Đàn 7 chim giấy; định kỳ chọn 1 nét đã vẽ, đậu 2–5s rồi bay tiếp |
| Người chạm mây → mưa; chạm sao → thêm sao | Mỗi frame kiểm đầu người có nằm trong mây/sao không |
| Chạm người / mây / mặt trời | Người giật mình nhảy; mây mưa 6s (cộng dồn tối đa 12s); mặt trời sáng 8s kèm vệt nắng, người trong nắng xoay 2,2s và phát sáng 9s |
| Mưa → cỏ ba lá; mưa lên hạt → cây dâu | Giọt mưa dừng ở mặt đầu tiên nó chạm; trên đất thì mọc/lớn cỏ; trên ụ hạt thì tích nước qua 4 mốc (mầm → cây nhỏ → cây lớn → ra dâu) |
| Bong bóng → thang, lửa, nấm, bò (+ sao, dâu thấy trong video) | Bong bóng trôi, bên trong có vật thu nhỏ; vỡ ra thì vật rơi theo trọng lực. Thang: người xếp hàng leo, lên đỉnh nhảy ra. Lửa: người nhảy tránh. Nấm: bạt nhún bật lên trời. Bò: chạy trên địa hình, húc người văng xoay tròn |
| Sao → nhiều sao nhỏ, vài sao thành hạt; người ăn dâu | Nổ sao: flash + 22 tia + 3 hạt rơi thành ụ đất + 2 sao mới. Người đi qua cây có quả thì dừng lại với tay ăn, tim bay lên |
| Người đứng lên đầu nhau (ảnh + video gốc) | Va nhau thì 55% trèo lên đỉnh tháp (tối đa 5 tầng); tháp đổ khi người bên dưới rời mặt đất |

- Ranh giới nguyên gốc: chỉ tái tạo **cơ chế**; mọi hình tự vẽ bằng code; không dùng tên "Little People" làm tên sản phẩm; ghi công + link teamLab ở góc màn hình.
- Kiến trúc: `v4-ban-goc/` = `core.js` (hằng số, mặt nạ va chạm + vật lý, nét vẽ, input, fx, vòng lặp) + 4 slice `people.js`, `sky.js`, `ground.js`, `things.js`, dạng classic script chung global scope. Tách vậy để 4 worker viết song song theo 1 hợp đồng field/method; điều phối viết core và tích hợp. Vẫn mở được bằng double-click (`file://`).
- Verify 2026-09-28 (Chromium headless, bơm tick qua `window.__bb.step`): 15 người leo núi tới đỉnh (223px); tường đứng: 0 lượt đi bộ vượt qua; tối đa 9 người cưỡi đầu nhau cùng lúc; mưa 7s mọc 10 cụm cỏ; nổ sao ra 3 hạt; mưa lên hạt → giai đoạn 4 + 2 quả, cả 2 quả bị ăn; 8 người leo thang tới đỉnh; nấm bật 7 người lên y≈150; lửa làm 12 người nhảy tránh; bò húc văng 30 người; mặt trời: 6 người xoay + phát sáng; 7/7 chim đậu lên nét; nét mờ → 7 người trên nét rơi hết; vẽ bằng chuột thật tạo nét 41 điểm; resize 1100×700 và `file://` không lỗi. Chi phí frame (180 frame tick + render + `gl.finish()`): trung bình 2,16 ms, tệ nhất 22,5 ms.
- Âm thanh (2026-09-28): `sound.js` tổng hợp Web Audio, không file — 19 tiếng sự kiện (giọng "i-te-te" khi chạm người, "a-chi-chi" khi chạm lửa, bong bóng, sao, nấm, bò…) + mưa/lửa/phấn liên tục + hộp nhạc nền; mở khóa ở cú chạm đầu, nút 🔊/🔇. Verify headless (không nghe được): 19/19 công thức có tín hiệu (đỉnh 0,027–0,662), 0 lỗi, nút tắt tiếng hoạt động. Tri thức đầy đủ: `knowledge/domain/bang-phan-ti-hon.md`.

## Gotcha đã gặp (đáng nhớ)
- Trâu gặm cỏ khi chưa vào màn, dậy đổi hướng → đi trái vô tận. Fix: bounce mép trái vô điều kiện (`x < EDGE → dir = 1`).
- `window.innerWidth = 0` khi tab ẩn → sim hỏng (Three.js). Fix: giữ size nonzero cuối cùng. Pixi không dính vì đọc `app.screen`.
- Tab ẩn → rAF pause → verify demo phải bơm tick thủ công (`window.__step(n)` / `app.ticker.update(t)`), không tin mắt được.
- Chromium headless: `app.ticker.FPS` báo ~38 trong khi vòng rAF trống đo được ~54 Hz và chi phí frame thật trung bình 2,16 ms → FPS headless không phản ánh hiệu năng; đo chi phí frame trực tiếp (tick + render + `gl.finish()`). Chênh 54 → 38 chưa rõ nguyên nhân.
- Lần test đầu chạm mây ra `maxDrops: 0`; chạy lại, cả 3 mây đều `rain` = 6 và có 229 giọt sau 60 frame. Nguyên nhân lần đầu chưa xác nhận — suy đoán: điểm chạm trùng 1 ngôi sao, vì `tapAt` xét bong bóng > sao > người > mây > mặt trời. Test tự động nên chọn điểm chạm không chồng vật khác.

## Hướng ý tưởng tiếp (chưa làm)
- v1 nông trại: user muốn phát triển hướng "thực tế" — chờ user lên ý tưởng.
- Chuỗi nhân-quả sâu hơn: mưa → cỏ → trâu kéo tới ăn → cỏ biến mất.
- Vẽ nét thành địa hình — **đã làm ở v4** bằng mặt nạ va chạm kiểu Lemmings, không cần matter.js.
- Tích hợp Gemini (vẽ-gì-cũng-sống, NPC personality, lệnh tiếng Việt) — xem intake + slice AI Riser.
- v4 chưa có: âm thanh (bản lắp đặt gốc có tiếng), nét nhiều màu có "năng lực" như bản "A Canvas where Little People Live", chơi nhiều người qua mạng.
