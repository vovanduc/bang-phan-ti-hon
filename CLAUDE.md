# CLAUDE.md — Bảng phấn tí hon (repo: tiny-chalk-people)

Game web PixiJS cho trẻ 3 tuổi. Root repo = bản chạy trên GitHub Pages; push `main` là deploy.

- Trước khi sửa code: đọc `knowledge/runbooks/bang-phan-ti-hon-van-hanh.md` (luật classic script chung global scope, hợp đồng field giữa slice, hook `window.__bb`).
- Cơ chế hiện có: `knowledge/domain/bang-phan-ti-hon.md`. Thêm/đổi cơ chế → cập nhật file đó.
- Verify: `node --check *.js` + mở trang, bơm tick bằng `__bb.step(n)` (tab ẩn thì rAF dừng), 0 lỗi console.
- Đối tượng là bé 3 tuổi: chạm lớn, không chữ bắt buộc, không âm thanh giật mình, không thua/không phạt.
