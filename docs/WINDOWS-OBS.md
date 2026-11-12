# Windows, OBS và TikTok LIVE Studio

## Tải và cài lần đầu — chỉ làm một lần

1. Vào https://github.com/baotran-06/xom-online-live → nút **Code → Download ZIP**. Dùng bản mới trên nhánh main.
2. Nhấp phải ZIP → **Extract All / Giải nén tất cả** vào một thư mục riêng có quyền ghi, ví dụ `C:\Users\TenBan\Documents\XomOnlineLive`. Phải giữ nguyên toàn bộ thư mục `bridge`, `scripts`, `frontend`, `config` và các package-lock. **Không chỉ tải riêng hai file BAT**, không chạy BAT ngay bên trong ZIP.
3. Cài Node.js bản LTS từ https://nodejs.org/en/download, phiên bản **22 trở lên**, kèm npm và tùy chọn thêm vào PATH mặc định. Nếu START báo không tìm thấy Node, đóng cửa sổ cũ rồi nhấp START lại sau khi cài. Không cần quyền Administrator để chạy Xóm trong thư mục của bạn.
4. Đảm bảo Internet cho lần cài dependencies đầu tiên và mỗi khi muốn kết nối TikTok. Không cần tự gõ lệnh npm.

## Mỗi lần sử dụng

1. Nhấp đúp **START-XOM.bat** trong thư mục đã giải nén.
2. START kiểm tra Node; tự cài đúng dependencies root **và bridge TikTok** bằng package-lock nếu thiếu/thay đổi/lỗi import; build frontend; khởi động một Node process phục vụ cả HTTP, WebSocket và TikTok adapter.
3. Chỉ khi kiểm tra HTTP health, WebSocket nhận snapshot và các trang/tài nguyên frontend đều thành công, START mới mở **hai trang**: quản trị **http://127.0.0.1:3210/admin** và game **http://127.0.0.1:3210/**. Không cần tải lại trang để chờ server. Giữ cửa sổ START khi đang dùng.
4. Lần đầu, nhập username TikTok đang LIVE (không phải tên hiển thị) và bấm Kết nối. Công tắc **“Lần mở START sau tự kết nối username này”** sẽ lưu username công khai tron…1358 tokens truncated…0111ược trình duyệt mặc định:** START giữ server hoạt động và in URL local để bạn mở. Bình thường URL tự mở sau kiểm tra sẵn sàng.
- **Máy ngủ/đổi mạng:** TikTok có thể mất kết nối và reconnect. Khi số lần thử vượt giới hạn, bấm Kết nối lại trên admin. Không thể bảo đảm buổi LIVE tự bắt đầu trên TikTok chỉ bằng START.
- **WebGL lỗi:** bật tăng tốc đồ họa Chrome/Edge, cập nhật driver GPU và thử lại. Launcher kiểm tra tài nguyên WebGL đã phục vụ được, không chứng minh GPU của laptop render thành công.

Không cần chạy `INSTALL-TIKTOK.bat` riêng nữa; START đã cài adapter khi cần. File đó vẫn giữ cho tương thích. Không thêm START vào Windows Startup/Task Scheduler; bạn chủ động nhấp đúp mỗi lần dùng. Pages công khai chỉ là DEMO, không thay thế cầu nối local cho LIVE.

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

## Bản sửa nhật ký kết nối TikTok

Nếu gặp log cũ chỉ ghi “nguồn LIVE hoặc dịch vụ ký chưa khả dụng”: chạy STOP, tải lại bản ZIP mới từ main, giải nén vào thư mục mới rồi START lại. Bản mới hiển thị mã lỗi ngay dưới nút Kết nối, ghi các loại lỗi/route/HTTP đã lọc vào nhật ký và log local. Không ghi thông báo nguồn nguyên văn, response body, URL đã ký, cookie hoặc API key.

- `ROOM_LOOKUP_FAILED`: các nguồn tra cứu không tìm được room. Chưa chứng minh tài khoản đã ngừng LIVE; kiểm tra đúng @username. Nếu vẫn xảy ra cần đối chiếu chi tiết route/HTTP trên chính laptop.
- `ROOM_OFFLINE`: thư viện báo phòng chưa LIVE; kiểm tra buổi LIVE và username trước khi thử lại.
- `PROVIDER_PERMISSION` / `ACCESS_DENIED`: nguồn từ chối quyền/xác thực. Không thể sửa bằng DEMO hoặc thêm nguồn hình vào LIVE Studio; cần xử lý quyền của nguồn thực tế. Không gửi mật khẩu/cookie/API key vào chat.
- `RATE_LIMIT`: tự chờ thời gian Retry-After/reset của nguồn. Trong thời gian đó nút Kết nối bị API từ chối kèm số giây chờ, không gửi thêm yêu cầu nguồn.
- `NETWORK_ERROR` / `CONNECT_TIMEOUT`: xem mã DNS/mạng/TLS. Không tắt kiểm tra chứng chỉ để thử vượt lỗi.
- `SIGNING_FAILED`: lỗi lấy chữ ký; riêng mã này chưa chứng minh phải mua gói dịch vụ.
- `WS_HANDSHAKE_INVALID`: HTTP trả về chưa nâng cấp thành WebSocket, không coi là đã kết nối.

Lỗi cố định như lookup/permission không bị thử lại liên tục. Lỗi tạm thời có backoff và giới hạn8 lần; mở được socket nhưng chưa nhận sự kiện không làm đặt lại bộ đếm retry. Thêm nguồn hình game vào phần mềm phát LIVE chỉ hiển thị game, không sửa lỗi của cầu nối.

Danh mục quà mở rộng là dữ liệu phụ. Nếu chỉ tải danh mục này thất bại, bản sửa ghi `GIFT_CATALOG_UNAVAILABLE` và tiếp tục thử socket LIVE; tên/type quà sử dụng dữ liệu gốc của sự kiện hoặc cấu hình giftId khi có. Lỗi ký/kết nối socket vẫn được xử lý bình thường, không bị bỏ qua. HTTP429 của danh mục vẫn buộc chờ theo nguồn. Kết nối được hay chưa vẫn chỉ được xác minh bằng sự kiện thật.
