# Thông tin xác thực và dữ liệu

Không có tài khoản game, không thu mật khẩu TikTok, session cookie TikTok, OAuth token hoặc khóa GitHub trong mã ứng dụng. Đọc LIVE công khai bằng username. Thư viện không chính thức có thể cần nhà cung cấp ký thứ ba; bản này không tự xin hay lưu khóa nhà cung cấp. Nếu anonymous signing bị giới hạn, báo lỗi và dừng sau tối đa 8 lần reconnect. Không né xác thực hoặc giới hạn nguồn.

HTTP và WebSocket bind **127.0.0.1**. Không mở cổng ra LAN/Internet. Kiểm tra Host ngăn DNS rebinding, Origin ngăn điều khiển từ website khác. Trang admin local cấp token ngẫu nhiên bộ nhớ trong cookie HttpOnly/SameSite=Strict, Path=/api. POST yêu cầu cookie + Origin cùng host + application/json. WebSocket read-only; không nhận lệnh điều khiển. Process restart thay token. Nút “Khởi động lại” chỉ tái lập bridge/phiên trong tiến trình, không tạo child process mới.

Thông tin người xem chỉ lưu RAM: ID, tên và sự kiện đã chuẩn hóa; không lưu avatar URL hay raw payload. Tên người xem dùng textContent/Canvas, không đưa vào innerHTML. Lịch sử 80, lỗi 60; log lỗi chung, không ghi stack/URL ký/token. Khi đóng tiến trình dữ liệu mất. Nếu phân phối hoặc phục vụ bản chỉnh sửa chứa connector AGPL, cần giữ tuân thủ giấy phép và cung cấp mã nguồn tương ứng.

`npm run publish:github` gọi gh CLI đã xác thực bằng kho thông tin đăng nhập của gh, không đọc hoặc in token. Script chỉ tạo repo mới, từ chối nếu tên đã tồn tại và không sửa các repo cũ. Không tự đăng nhập hoặc yêu cầu dán token vào mã.

Launcher ghi token quản lý ngẫu nhiên trong `.runtime/control.json` (gitignored), gắn instanceId và fingerprint thư mục. STOP chỉ gửi yêu cầu tới loopback sau khi kiểm tra đúng phiên/thư mục, không dùng taskkill toàn bộ node.exe. `/api/launcher/stop` yêu cầu Bearer token đúng; admin cookie không thay thế token này. `.runtime/preferences.json` chỉ lưu username công khai và lựa chọn tự kết nối, không có mật khẩu/cookie TikTok. Không upload `.runtime` hoặc gửi control.json.
