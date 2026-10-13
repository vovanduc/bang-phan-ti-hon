# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), đánh số theo [Semantic Versioning](https://semver.org/lang/vi/):
`MAJOR.MINOR.PATCH` — PATCH = sửa lỗi/chỉnh nhỏ (1.0.1), MINOR = thêm cơ chế/tính năng không phá cái cũ (1.1.0), MAJOR = đổi lớn/phá cách chơi cũ (2.0.0).

Tên v1–v3 trong `archive/` và "v4" trong docs là tên prototype nội bộ, không phải số phiên bản phát hành.

## [Unreleased]

## [1.0.0] - 2026-10-13

Bản phát hành đầu tiên trên GitHub Pages (game "v4" chuyển từ `community-builder@a3089da`).

### Added
- Bảng phấn PixiJS 8.6.6: bé vẽ nét phấn, người tí hon đi/leo/rơi theo nét vẽ.
- Người tí hon tự đi, ngó nghiêng, quay đầu, trèo lên đầu nhau thành tháp (tối đa 5 tầng).
- Sao, mây & mưa, cây dâu (người ăn dâu, bay tim), mặt trời (xoay + phát sáng), bong bóng thả đồ vật (thang, nấm, lửa, bò, dâu, sao), chim.
- Âm thanh tổng hợp bằng Web Audio (không file âm thanh), không tiếng giật mình.
- Hook kiểm thử `window.__bb`.
- `archive/` prototype v1–v3, `docs/` spec + hợp đồng build, `knowledge/` tri thức dự án.

[Unreleased]: https://github.com/vovanduc/bang-phan-ti-hon/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/vovanduc/bang-phan-ti-hon/releases/tag/v1.0.0
