---
type: decision
title: "Demo v4: tái tạo cơ chế teamLab sát bản gốc, hình/tiếng tự làm"
description: Các quyết định kiến trúc & pháp lý cho  — tái tạo cơ chế, mặt nạ va chạm Lemmings, classic script nhiều file, âm thanh tổng hợp.
tags: [adr, demo, pixijs, bang-lang, v4]
timestamp: 2026-09-28T00:00:00Z
---
# Quyết định

## 1. Tái tạo CƠ CHẾ sát bản gốc — hình/tiếng tự làm
User yêu cầu 2026-09-28: "dựng lại giống bản gốc nhất". Quyết định tái tạo **cơ chế** (vẽ nét → địa hình; chạm người/mây/mặt trời/sao/bong bóng; chuỗi sao → hạt → cây dâu → người ăn) thay vì chỉ "lấy cảm hứng".

- Điều này **đi xa hơn verdict "remix"** trong [intake gốc](../../docs/intake/2026-07-18-teamlab-blackboard-little-people.md) — có ý thức.
- Ranh giới IP giữ nguyên: mọi hình tự vẽ bằng code nét phấn, không chép asset, không dùng tên "Little People" làm tên sản phẩm, ghi công + link teamLab trên màn hình (`#credit`). Cơ chế/gameplay không chịu bản quyền như tài sản nghệ thuật — vẫn ghi nguồn rõ ràng.
- Liên quan: gotcha `originality-attribution` (ở repo community-builder, private).

## 2. Mặt nạ va chạm kiểu Lemmings thay physics engine
`solid(x,y)` đọc `Uint8Array` 1 byte/pixel thế giới; nét vẽ "đóng dấu" đĩa bán kính 3px vào mask. `walkStep` bước 1px: leo ≤3px/px ngang (~71°), hụt chân → rơi.

- Lý do: nét người chơi vẽ tùy ý → địa hình đổi liên tục; mặt nạ pixel nhận mọi hình nét (núi, vòng xoắn, tường) mà code bước 1px vẫn ngắn. Chưa so thực nghiệm với physics engine (suy luận: rigid body như matter.js sẽ làm người tí hon lăn lộn thay vì đi bộ bám nét).
- Đánh đổi: chỉ 1 mặt nạ — không có va chạm vật-vật tổng quát (người đi xuyên nhau 45%, vật chồng nhau). Chấp nhận được: khung video gốc cho thấy người tí hon đi chồng lên nhau.

## 3. Thư mục nhiều file classic script (không module)
`v4-ban-goc/` = `core.js` + 4 slice + `sound.js`, tất cả classic `<script>` chung global scope, thứ tự nạp cố định, hợp đồng field/method ghi tường minh.

- Lý do: 4 worker viết song song trên 4 file riêng không đạp nhau; `file://` mở được (ES module bị CORS chặn trên file://).
- Đánh đổi: trùng tên top-level = SyntaxError cả trang → phải có luật "chỉ đúng tên đã liệt kê, helper khác prefix `<slice>_`". Không import/export = không tree-shake (không quan trọng, ~1k dòng).

## 4. Âm thanh tổng hợp Web Audio — không file
`sound.js` tổng hợp mọi tiếng bằng oscillator/noise/filter/envelope; giọng "イテテ"/"あちち" bằng formant filter giả; nhạc nền hộp nhạc tự sinh ngũ cung.

- Lý do: teamlab.art ghi công "Sound: teamLab"; trang JP tả người tí hon kêu 「イテテ！」 khi bị chạm và 「あちち」 khi chạm lửa (không nói rõ là giọng hay chữ — v4 chọn giọng tổng hợp). Không được dùng asset của người khác → tự tổng hợp; không file → không tải gì thêm ngoài Pixi CDN.
- Đánh đổi: chất giọng chỉ là "hoạt hình giả", không phải giọng thật — chấp nhận. Autoplay bị chặn → `AudioContext` chỉ tạo sau cử chỉ đầu tiên. Reverb dùng `ConvolverNode`; trình duyệt báo sampleRate lệch (Chromium headless) thì tắt reverb thay vì hỏng cả hệ âm thanh.

## 5. Bỏ skin trâu, giữ v1–v3
v4 bỏ trâu/chủ đề nông trại của v1–v3 để sát bản gốc; các bản cũ giữ nguyên tại `archive/` (v1–v3) (suy luận: giữ để so sánh lộ trình, không phải xóa).

# Nguồn
- Spec + số liệu verify: [docs/specs/2026-07-27-demo-bang-lang-trau.md](../../docs/specs/2026-07-27-demo-bang-lang-trau.md) §v4.
- Cơ chế chi tiết: [knowledge/domain/bang-phan-ti-hon.md](../domain/bang-phan-ti-hon.md).
- Trang gốc: https://www.team-lab.com/en/blackboard/ · https://www.team-lab.com/blackboard/
