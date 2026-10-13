# Bảng phấn tí hon

Game bảng phấn cho trẻ nhỏ (đang chơi thử: bé 3 tuổi). Bé vẽ nét phấn, chạm mây, thả đồ — người tí hon trên bảng tự đi, leo, chồng tháp, phản ứng theo.
Tái tạo **cơ chế** tác phẩm "A Blackboard where Little People Live" của teamLab; hình và tiếng tự làm (xem [ADR-0004](knowledge/decisions/0004-bang-phan-v4-tai-tao-co-che.md)).

**Chơi:** https://vovanduc.github.io/bang-phan-ti-hon/

## Chạy local
- Bấm đúp `index.html` (chạy qua `file://`), hoặc `python3 -m http.server 8765` → http://127.0.0.1:8765/
- Lần đầu cần mạng: PixiJS 8.6.6 tải từ CDN jsdelivr.

## Cấu trúc
| Đường dẫn | Nội dung |
|---|---|
| `index.html`, `core.js`, `people.js`, `sky.js`, `ground.js`, `things.js`, `sound.js` | Game v4 (bản đang chạy trên Pages) |
| `archive/` | Prototype v1–v3 (skin làng quê/trâu, Pixi & Three.js) |
| `docs/intake/` | Phân tích tác phẩm teamLab gốc |
| `docs/specs/`, `docs/plans/` | Spec demo + hợp đồng build v4 (gameplay, âm thanh) |
| `knowledge/` | Tri thức lâu bền — bắt đầu từ [knowledge/index.md](knowledge/index.md) |

## Phát triển
Đọc [runbook](knowledge/runbooks/bang-phan-ti-hon-van-hanh.md) trước: kiến trúc file, hợp đồng field giữa slice, hook kiểm thử `window.__bb`, cách thêm cơ chế mới.
Deploy: push `main` → GitHub Pages tự build.
Phát hành phiên bản: cập nhật [CHANGELOG.md](CHANGELOG.md), commit, `git tag -a vX.Y.Z -m "vX.Y.Z"`, `git push origin main vX.Y.Z`, `gh release create vX.Y.Z --notes-from-tag` (hoặc dán mục changelog).

## Lịch sử
Bắt đầu trong repo private `community-builder` (2026-07 → 2026-10, F007 — demo cho AI Riser 2026); chuyển sang đây 2026-10-13. Lịch sử commit cũ ở lại repo đó.
