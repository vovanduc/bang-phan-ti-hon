---
type: gotcha
title: "Gotcha khi agent build/verify demo web cho user"
description: Link localhost chết khi agent thoát, FPS headless nói dối, tab ẩn dừng rAF, điểm chạm chồng vật, giới hạn công cụ browser omp, autoplay âm thanh — từ demo bảng phấn 2026-09-28.
tags: [gotcha, demo, browser, headless, pixijs, web-audio]
timestamp: 2026-09-28T00:00:00Z
---
# Gotcha — demo web do agent bật/giao

## Link localhost của agent chết khi agent thoát
Agent bật `python3 -m http.server` rồi giao link `http://127.0.0.1:…`; cuối phiên agent tắt server khi dọn dẹp → user gặp "127.0.0.1 refused to connect" (sự cố thật 2026-09-28, demo ``). Bật lại với mode `persist` của omp (`proc://<name>/mode`) giữ được qua các lượt, nhưng 2026-10-01 tiến trình omp đã khởi động lại và service mất (`proc://` trống) → link lại chết.
**Luôn** giao kèm: (a) đường dẫn file để bấm đúp / `open <path>`; (b) lệnh tự chạy server. Xem [runbook](../runbooks/bang-phan-ti-hon-van-hanh.md).

## FPS headless nói dối
Chromium headless: `app.ticker.FPS` báo ~38 dù vòng rAF trống đo ~54 Hz và chi phí frame thật chỉ 2,16ms.
→ Đo **chi phí frame trực tiếp**: mỗi frame `tick(1/60); app.render(); gl.finish()`, lấy trung bình và frame tệ nhất trên 180 frame.

## Tab ẩn → rAF dừng
Tab nền/ẩn → requestAnimationFrame pause → sim "đứng". Không tin mắt được; phải **bơm tick tay** (`__bb.step(n)` trong v4, `app.ticker.update()` chung chung). `window.innerWidth` cũng về 0 khi tab ẩn — giữ kích thước cuối.

## Chạm tự động trúng vật chồng nhau
`tapAt` xử lý theo thứ tự ưu tiên (v4: bong bóng > sao > người > mây > mặt trời) → chạm mây mà có sao chồng lên sẽ nổ sao thay vì mưa. Nghi là nguyên nhân 1 lần đo `maxDrops: 0` (chưa xác nhận). → Chọn điểm chạm trống / kiểm vật chồng trước.

## Một lỗi trong hệ phụ làm đứng cả game
Pixi `Ticker` ngừng hẳn khi 1 callback ném lỗi (đã thử: callback ném lỗi ở lần 1 → trong 1,5s không được gọi lại lần nào) → cả game đứng hình, console chỉ có đúng 1 dòng lỗi.
Sự cố thật 2026-09-28: Chromium headless báo `AudioContext.sampleRate` = 48000 nhưng chạy ở 44100 → gán `ConvolverNode.buffer` ném `NotSupportedError` → `soundUnlock` nuốt lỗi nhưng dừng giữa chừng (lớp mưa/lửa/phấn = null) → `soundUpdate` ném lỗi trong `tick`.
→ Hệ phụ (âm thanh, hiệu ứng) phải tự chặn lỗi: tính năng tùy chọn bọc try/catch riêng (reverb hỏng thì bỏ reverb), hàm update gác trạng thái khởi tạo dở, lời gọi từ game (`sfx`) không được ném lỗi ra.

## Công cụ browser của omp (eval `browser`)
- `tab.waitFor` chỉ nhận **selector chuỗi** (hàm predicate throw).
- `page.evaluate` trong `tab.run` chạy ở **isolated world** — không thấy global của trang (vd `window.__bb` undefined).
→ Đọc state bằng `tab.evaluate("(() => …)()")`; dùng `tab.run` cho `page.mouse` input và `page.screenshot({clip})`. `tab.console()` trả `{entries, nextSeq, dropped}`, không phải array.

## Âm thanh: autoplay + headless
- Trình duyệt chặn tự phát → `AudioContext` chỉ tạo/`resume` sau cử chỉ người dùng (pointerdown); gọi `sfx()` trước đó phải no-op.
- Headless không nghe được → verify bằng render **OfflineAudioContext** (đo peak/RMS) + đếm lượt phát (`SND.plays[name]`).

## yt-dlp hay 403 giữa chừng
Tải video YouTube tham chiếu: youtube hay cắt ~40% (client `android_vr`) nhưng **file .part DASH vẫn giải mã được** → `ffmpeg -vf "fps=1/2,scale=480:-1,drawtext=…,tile=3x3"` ra ảnh ghép có timestamp để đọc frame.
