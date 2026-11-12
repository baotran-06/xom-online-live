# Windows, OBS và TikTok LIVE Studio

## Chạy lần đầu

1. Cài Node.js 22 LTS hoặc mới hơn từ https://nodejs.org . Khởi động lại terminal nếu vừa cài.
2. Giải nén toàn bộ dự án vào một thư mục mới, ví dụ `C:\XomOnlineLive`. Không mở HTML bằng file://.
3. Nhấp đúp `START-XOM.bat`. Script chạy npm ci lần đầu, build frontend, mở admin và giữ cửa sổ bridge. Nếu trình duyệt mở trước server, tải lại trang sau vài giây.
4. Admin: http://127.0.0.1:3210/admin ; Game: http://127.0.0.1:3210/ . Hai trang riêng, cùng bridge.
5. DEMO chạy ngay sau bước 3. Nhấn +12 khách, thử đầy quán, follow và quà. Nhấn Âm thanh trên game một lần, bật công tắc âm thanh ở admin.
6. Để thử TikTok, chạy `INSTALL-TIKTOK.bat` khi có Internet. Không có file này hoặc không cài được thư viện thì DEMO vẫn dùng được.
7. Phát LIVE thật trên tài khoản được TikTok cho phép. Nhập username (không phải tên hiển thị), bấm Kết nối. Chỉ khi có trạng thái connected VÀ sự kiện member/like/chat/gift thật thì mới xác minh đường truyền thật. Không cần mua quà để kiểm tra: có thể dùng người xem vào, chat hoặc thả tim.
8. Đóng cửa sổ bridge hoặc Ctrl+C để dừng. Nút “Khởi động lại” trên admin xóa phiên và tái lập cầu nối; nếu Node process đã crash thì chạy BAT lại.

Cổng 3210 bận: đóng cửa sổ bridge cũ. Hoặc mở CMD ở thư mục, chạy `set PORT=3212` rồi `npm start`, tự mở http://127.0.0.1:3212/admin . BAT mặc định mở 3210 nên không dùng BAT cho trường hợp đổi cổng.

## OBS Studio

1. Settings → Video: Base Canvas 1920×1080, FPS 30. Giữ tỉ lệ 16:9.
2. Sources → + → Browser. URL `http://127.0.0.1:3210/`, Width 1920, Height 1080, FPS 30. Không bật Local file.
3. Bật “Control audio via OBS” nếu muốn lấy tiếng hiệu ứng. Trong Advanced Audio Properties chọn output theo nhu cầu. Không phát cùng lúc âm thanh của tab game ngoài trình duyệt để tránh nhân đôi tiếng.
4. Game cần AudioContext được phép phát. Nếu browser source không phát tiếng, chuột phải nguồn → Interact → bấm Âm thanh; bật công tắc âm thanh admin. OBS/CEF có thể áp chính sách audio riêng; kiểm tra Audio Mixer trước khi LIVE.
5. Dùng tab admin trong Chrome/Edge để điều khiển. Không đưa tab admin vào scene. Nên tắt “Shutdown source when not visible” nếu muốn giữ hoạt ảnh khi chuyển scene, hoặc bật để giảm tải; trạng thái người xem vẫn do Node bridge giữ.
6. Browser Source có thể cần “Refresh cache of current page” sau khi cập nhật mã. Nếu WebGL lỗi, bật hardware acceleration và cập nhật driver GPU.

## TikTok LIVE Studio

Nếu bản LIVE Studio có nguồn Link/Webpage, thêm URL game local, 1920×1080. Nếu không có hoặc không hỗ trợ WebGL/audio, mở game trong Chrome/Edge, F11, rồi dùng Window Capture/Screen Capture của LIVE Studio. Có thể dùng OBS Virtual Camera cho hình nếu quy trình tài khoản hỗ trợ; âm thanh cần chọn nguồn hệ thống riêng (Virtual Camera không tự mang tiếng). Không hướng dẫn vượt điều kiện LIVE hoặc quyền truy cập của TikTok.

## Checklist thật

- Nhãn LIVE, trạng thái connected và ít nhất 1 sự kiện thật có tên đúng.
- Người xem gửi nhiều like không tạo nhiều nhân vật.
- Thử quà chỉ nếu tự nguyện; đối chiếu giftId và streak cuối với TikTok, không suy luận từ DEMO.
- Ngắt mạng thử reconnect, kết thúc LIVE kiểm tra ended.
- Chạy soak 2–4 giờ, quan sát Task Manager và FPS/OBS dropped frames. Chưa thực hiện bước này trong môi trường xây dựng.
