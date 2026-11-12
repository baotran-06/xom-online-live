# Windows, OBS và TikTok LIVE Studio

## Tải và cài lần đầu — chỉ làm một lần

1. Vào https://github.com/baotran-06/xom-online-live → nút **Code → Download ZIP**. Dùng bản mới trên nhánh main.
2. Nhấp phải ZIP → **Extract All / Giải nén tất cả** vào một thư mục riêng có quyền ghi, ví dụ `C:\Users\TenBan\Documents\XomOnlineLive`. Phải giữ nguyên toàn bộ thư mục `bridge`, `scripts`, `frontend`, `config` và các package-lock. **Không chỉ tải riêng hai file BAT**, không chạy BAT ngay bên trong ZIP.
3. Cài Node.js bản LTS từ https://nodejs.org/en/download, phiên bản **22 trở lên**, kèm npm và tùy chọn thêm vào PATH mặc định. Nếu START báo không tìm thấy Node, đóng cửa sổ cũ rồi nhấp START lại sau khi cài. Không cần quyền Administrator để chạy Xóm trong thư mục của bạn.
4. Đảm bảo Internet cho lần cài dependencies đầu tiên và mỗi khi muốn kết nối TikTok. Không cần tự gõ lệnh npm.

## Mỗi lần sử dụng

1. Nhấp đúp **START-XOM.bat** trong thư mục đã giải nén.
2. START kiểm tra Node; tự cài đúng dependencies root **và bridge TikTok** bằng package-lock nếu thiếu/thay đổi/lỗi import; build frontend; khởi động một Node process phục vụ cả HTTP, WebSocket và TikTok adapter.
3. Chỉ khi kiểm tra HTTP health, WebSocket nhận snapshot và các trang/tài nguyên frontend đều thành công, START mới mở **http://127.0.0.1:3210/admin**. Không cần tải lại trang để chờ server. Giữ cửa sổ START khi đang dùng.
4. Lần đầu, nhập username TikTok đang LIVE (không phải tên hiển thị) và bấm Kết nối. Công tắc **“Lần mở START sau tự kết nối username này”** sẽ lưu username công khai trong `.runtime/preferences.json`; không lưu mật khẩu/cookie TikTok. Nếu bật công tắc, những lần nhấp START sau tự thử kết nối username đã lưu. Bỏ công tắc rồi bấm Kết nối để ngừng lưu lựa chọn tự kết nối.
5. Lúc khởi động, local mặc định **LIVE đang chờ**, không tự tạo khách hoặc quà DEMO. Chế độ DEMO chỉ được bật khi bạn chủ động chọn trên admin.
6. Mở game riêng bằng nút **Mở màn hình game**, hoặc http://127.0.0.1:3210/ . Màn hình quản lý không nằm trong game.
7. Khi xong, nhấp đúp **STOP-XOM.bat** trong **đúng thư mục đang chạy**. STOP yêu cầu server ngắt TikTok, hủy reconnect, đóng WebSocket và HTTP, rồi xóa thông tin phiên tạm. STOP không tắt Chrome, OBS, LIVE Studio hoặc Node của ứng dụng khác.

Nhấn START lần nữa khi đang chạy sẽ mở lại admin, không tạo server trùng. Nếu đang cài dependencies thì cửa sổ START thứ hai sẽ báo đang khởi động để bạn chờ. STOP trong lúc cài gửi yêu cầu dừng; chờ bước cài hiện tại kết thúc rồi tự dừng. Không đóng cưỡng bức cửa sổ trong lúc npm đang cài.

## Đọc trạng thái TikTok đúng cách

| Trạng thái | Ý nghĩa |
|---|---|
| HTTP/WebSocket/frontend sẵn sàng | Dịch vụ local hoạt động; chưa chứng minh TikTok đang kết nối |
| Đang kết nối TikTok | Đang thử kết nối username, có thể thất bại do offline, mạng hoặc dịch vụ ký |
| Socket đã mở · đang chờ sự kiện TikTok thật | Kết nối transport đã mở, **chưa xác minh LIVE hoạt động** |
| Đã nhận sự kiện TikTok LIVE thật | Adapter vừa nhận ít nhất một sự kiện nguồn hợp lệ có tài khoản; xem bộ đếm và thời điểm gần nhất |
| Đang kết nối lại / lỗi / đã ngắt | Không xem là LIVE đã xác minh; không chèn dữ liệu giả để che lỗi |

Kiểm tra bằng một người xem khác vào LIVE, gửi chat hoặc thả tim. Không cần mua quà để kiểm tra. `member` không được TikTok đảm bảo cho tất cả người xem. Nếu chưa có sự kiện thật thì hệ thống sẽ giữ thông báo đang chờ, kể cả socket mở được. Nhà phát triển chưa có username đang LIVE do bạn cung cấp để kiểm chứng sự kiện thật trên tài khoản của bạn.

## Lỗi thường gặp

- **Thiếu Node/npm hoặc Node quá cũ:** cài Node.js LTS 22 trở lên kèm npm; nhấn START lại, không cần viết code.
- **Cài dependency thất bại:** kiểm tra mạng, dung lượng đĩa, quyền ghi thư mục; nhấn START lại. Không báo server sẵn sàng khi cài thất bại.
- **Cổng 3210 đang bận:** nếu Xóm của cùng thư mục đang chạy, START tái dùng. Nếu chương trình khác/bản Xóm khác chiếm cổng, START báo lỗi và không tự giết tiến trình. Đóng đúng ứng dụng đó hoặc dùng STOP từ thư mục của phiên Xóm cũ.
- **Cửa sổ tắt bất thường:** nhấn START lại; khóa PID chết được phát hiện và dọn. Nếu PID còn sống nhưng server không phản hồi, STOP báo lỗi thay vì force-kill một PID có thể đã được dùng lại. Kiểm tra cửa sổ START cũ.
- **Nhật ký:** `.runtime/logs/latest.log` và `latest.log.previous`. Log có giới hạn; `.runtime` nằm trong gitignore. Không gửi file `control.json` vì có token quản lý local.
- **Không mở được trình duyệt mặc định:** START giữ server hoạt động và in URL local để bạn mở. Bình thường URL tự mở sau kiểm tra sẵn sàng.
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
