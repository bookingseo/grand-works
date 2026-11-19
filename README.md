# Đại Công Trường Xưởng · Grand Works Studio

Xưởng tạo, kiểm tra, đóng gói và phát hành game web. Dùng Node.js 22 trở lên.
[Chơi trên web](https://bookingseo.github.io/grand-works/).
Ca Luyện Thép là game đầu tiên. Cầu Trục Ca Đêm dùng cùng dây chuyền sản xuất.
Chạy `node studio.mjs new ten-game "Tên game"` để tạo thư mục nguồn và bản nháp.
Trong `games/ten-game`, viết game và khai báo tựa, mô tả Việt/Anh, ảnh bìa, thứ tự và danh sách tệp trong `game.json`. Đặt `publish` thành `true` khi sẵn sàng.
Chạy `node --test tests/works.test.mjs` và `node studio.mjs check` để kiểm tra.
Chạy `node studio.mjs build`, rồi mở `index.html` trong thư mục kết quả. Mỗi bản có địa chỉ thư mục theo nội dung.
Khi đẩy thay đổi lên nhánh main, GitHub Actions chạy lại kiểm tra, đóng gói và phát hành toàn bộ danh mục lên Pages.
