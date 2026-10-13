---
type: intake-analysis
title: teamLab — A Blackboard where Little People Live (phân tích để clone/remix cho AI Riser 2026)
source_url: https://www.team-lab.com/en/blackboard/
source_author: teamLab (art collective)
source_type: docs
date_analyzed: 2026-07-18
spine_fit: 4
verdict: remix
tags: [game, agent-simulation, gemini, ai-riser-2026, canvas, cloud-run, F007]
---

# 1. Tóm tắt cốt lõi (ngắn — KHÔNG chép nguyên văn)

- **Bản chất:** KHÔNG phải game có mục tiêu thắng/thua — là **sandbox sinh thái với agent tự trị** ("little people" sống trên bảng đen, tự đi lại, không để ý người xem). Người chơi can thiệp vào thế giới thay vì điều khiển nhân vật.
- **Core loop tương tác** (3 kênh):
  1. **Vẽ** — nét phấn tự do trở thành địa hình/đường đi: người tí hon leo núi vừa vẽ, chim đậu lên dây; nét vẽ cũng là vật cản.
  2. **Chạm** — chạm mây → mưa → mọc cỏ ba lá/dâu (chuỗi nhân-quả nông nghiệp); chạm mặt trời → sáng, nhân vật phát sáng; sao vỡ → hạt giống.
  3. **Vật thể từ bong bóng** — chọc bong bóng rơi ra thang, lửa (nhân vật bỏ chạy), nấm (làm trampoline), bò (va chạm ngẫu nhiên).
- **Hành vi agent:** leo dốc, ăn cây, nhảy, né lửa, quay tròn khi tắm nắng — mô phỏng vật lý (trọng lực, va chạm) + hành vi tự nhiên (behavior state machine).
- **Công nghệ bản gốc:** projection mapping (Epson) + cảm biến chạm/chuyển động + physics engine real-time + agent AI; nhiều người chơi cùng lúc trên 1 canvas chung; lắp đặt thương mại tại các MUJI (Stockholm, One Bangkok, LECT, Parfum Nagoya, SUVLAND Chiba…) từ 2019.
- **Triết lý thiết kế:** "hành động của bạn tạo ra thế giới" — đồng sáng tạo, không có fail state, kể chuyện phát sinh (emergent), tương tác bằng cơ thể ở kích thước thật.

# 2. Điểm thật sự mới / đáng giá

- Công thức **agent tự trị + đầu vào sáng tạo của người dùng (vẽ) + chuỗi nhân-quả sinh thái** tạo cảm giác "thế giới sống" mà không cần content scripted — rất hợp thời đại LLM: Gemini có thể thay phần "hiểu nét vẽ" và "tính cách/kể chuyện" vốn phải hand-code.
- Thẩm mỹ bảng đen (line-art phấn trắng trên nền tối) là lợi thế kỹ thuật: **đồ họa rẻ mà vẫn đẹp**, hợp scope 1 tháng.

# 3. Độ hợp xương sống & tính học được

- Hợp trục "sản phẩm AI lên production": bản web = real-time canvas app + Gemini API + **deploy Cloud Run** (đúng yêu cầu AI Riser), có user thật đo được. Spine_fit 4/5 (trừ 1 vì là consumer game, không phải AI-infra content thuần).
- Làm lại hands-on được: HTML5 canvas (PixiJS/Phaser) + physics 2D (matter.js/planck) + behavior tree cho agent + Gemini API (vision cho nét vẽ, text cho tính cách/sự kiện). Không cần phần cứng — projector/camera là giai đoạn sau (đam mê dài hạn, demo offline tại GDG event).

# 4. Góc "biến tấu thành của bạn"

- [x] Bối cảnh **Việt Nam**: skin làng quê VN (con trâu thay bò, nón lá, ruộng bậc thang, chợ quê, múa lân) — vừa khác biệt bản gốc, vừa ăn điểm "impact/local" của giám khảo.
- [x] **Tích hợp AI**: Gemini multimodal nhận diện nét vẽ (vẽ gì cũng thành vật thể sống — mechanic của Sketch Town nhưng bằng LLM thay vì hand-code); Gemini sinh tính cách + thoại cho người tí hon; ra lệnh bằng tiếng Việt ("làm mưa đi").
- [x] Đào **sâu hơn**: đo chi phí/độ trễ Gemini cho game event real-time (dùng AI cho *sự kiện*, không cho *per-frame*) — chính là content production-lens cho blog.

# 5. Ranh giới nguyên gốc (bắt buộc)

- teamLab là tác phẩm nghệ thuật có bản quyền: **KHÔNG** dùng tên "Little People", không sao chép asset/art style nhận diện, không tự nhận liên quan teamLab.
- Đóng góp GỐC: chủ đề làng quê Việt Nam + cơ chế AI-native (vẽ-gì-cũng-sống bằng Gemini vision, nhân vật có tính cách LLM, lệnh tiếng Việt) + bản web công khai ai cũng chơi được (bản gốc chỉ có tại chỗ lắp đặt).
- Ghi công: giới thiệu là "lấy cảm hứng từ dòng tác phẩm Little People của teamLab" + link nguồn khi viết bài/post.

# 5b. Đối chiếu bản tổng hợp ChatGPT của user (đọc 2026-07-19, link share)

Nguồn: https://chatgpt.com/share/6a5c942d-21f4-83ec-bcd3-c921eaf1712b — user đã brainstorm trước với ChatGPT. Nội dung chính:

**Ý tưởng gameplay (hội tụ với phân tích trên):**
- "Living World" god-game touch-first, không level/thắng thua; chuỗi nhân-quả: mây→mưa→mầm→hoa→người chạy tới; kéo mặt trời → chu kỳ ngày/đêm (NPC ngủ, bật đèn, đốt lửa); sông→cá→câu cá; nhà→cửa mở→gia đình đi dạo.
- **Thế giới bền vững (persistent):** hôm qua trồng mầm, hôm nay thành cây, tuần sau ra quả — NPC tới hái. → Hook giữ user quay lại (đúng tiêu chí Gold "active user engagement").
- NPC có personality (Farmer thích cây/nước/bò; Child thích bướm/hoa/cầu vồng); hướng xa: LLM cho NPC suy nghĩ theo mục tiêu thay vì state machine cứng.
- Multiplayer cùng-tạo-thế-giới (2–4 người, không PvP).

**Tầm nhìn dài hạn (của user, giữ làm định hướng SAU event):**
- "Interactive Ecosystem Engine" → đổi asset ra Village/Aquarium/Farm/Dinosaur/Space/Smart City…
- Chiến lược open-core: engine MIT → plugin architecture → asset marketplace → enterprise (theo mẫu Godot/GitLab/Grafana). "Vàng" ở content/AI/asset/community (80%), không ở engine (20%).
- Stack: **web-first** (React + PixiJS/Phaser), **core simulation bằng TypeScript tách khỏi renderer** (web = canvas, mobile/kiosk = Godot renderer sau); save format **JSON để AI đọc/sinh được**; multiplayer server Go/Rust sync state-diff; backend Go+Postgres+Redis+S3.
- Ý đắt nhất cho AI Riser: **"Prompt → Generate World → JSON → Engine"** — mô tả thế giới bằng ngôn ngữ tự nhiên, AI sinh world JSON, engine render. Với Gemini structured output đây là feature khả thi trong scope 1 tháng.

**Điểm KHÁC quan điểm (đã nêu với user):** ChatGPT khuyên SDK-first (repo đầu là engine, game chỉ là example). Với deadline 30/08 thì NGƯỢC LẠI: demo-first — build game hoàn chỉnh trước, trích SDK sau khi có cộng đồng quan tâm. Platform-ization sớm là bẫy scope. Godot/multiplayer real-time: KHÔNG làm trong tháng 8.

**Slice chốt cho AI Riser (đề xuất):** web app PixiJS + core sim TypeScript, skin làng quê VN, persistent world, 3 feature Gemini: (1) vẽ-gì-cũng-sống (vision), (2) NPC personality + thoại (text), (3) tả-thế-giới-bằng-tiếng-Việt → world JSON (structured output). Build trong AI Studio, deploy Cloud Run. SDK open-source = giai đoạn sau, đồng thời là evidence OSS cho hồ sơ CB.

# 6. Verdict & hành động tiếp

- Verdict: **remix** — không clone y nguyên; xây sandbox "bảng làng" AI-native lấy cảm hứng từ cơ chế gốc.
- Hành động: chạy phiên brainstorming chốt spec (scope 1 tháng cho F007 AI Riser: đăng ký → kickoff 01/08 → build tuần 1–2 → user thật tuần 3–4 → nộp form trước 30/08). Idea vào ../index.md: [ ] — chờ chốt spec sau brainstorming.
- Chờ bổ sung: bản tổng hợp ChatGPT của user (link /c/ riêng tư bị 403 — cần link /share/).
- 2026-09-28: theo yêu cầu user "giống bản gốc nhất", dựng v4 tái tạo **cơ chế** (hình/tiếng tự làm, không dùng tên) — vượt verdict remix có ý thức; xem [ADR 0004](../../knowledge/decisions/0004-bang-phan-v4-tai-tao-co-che.md) và [danh mục cơ chế](../../knowledge/domain/bang-phan-ti-hon.md).
