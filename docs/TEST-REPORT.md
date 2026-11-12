# Báo cáo kiểm thử — 12/11/2026

## Đã kiểm tra

| Hạng mục | Kết quả / bằng chứng |
|---|---|
| Cú pháp JavaScript / JSON | npm run check, 21 module hợp lệ |
| Test tự động | 33 tests Linux pass, 0 fail; 1 Windows-only test được skip ở Linux và chạy riêng thành công trên Windows (Node 22.23.4) |
| Join lặp 100 lần | Một tài khoản → một avatar, một unique visitor |
| 50 khách và nhường ghế | 28 ngồi, 22 chờ; khách tiếp theo nhận ghế được giải phóng; TTL xóa trạng thái |
| Quà/streak | Chỉ nhận repeatEnd, giữ tổng cuối, dedupe message/group, trigger nhóm theo ngưỡng |
| Payload phiên bản thực | Đã cài/import connector 2.5.0; fixture dựa trên protobuf v3 được cài thực tế |
| HTTP + WebSocket | Server thật trên cổng local tạm; admin cookie; tạo 35 khách → snapshot socket 28 ngồi/7 chờ |
| DEMO/LIVE | Xóa phiên khi chuyển; chặn DEMO bằng HTTP 409 ở LIVE; restart về DEMO |
| Điều khiển local | Origin sai bị chặn 403; kiểm tra path traversal; WebSocket read-only |
| Race stop/connect | Kết nối bất đồng bộ hoàn tất sau khi stop không phục hồi trạng thái connected |
| Tải 100.000 sự kiện | Queue, history, dedupe, user, visitor set có giới hạn; quá tải có bộ đếm |
| Cấu trúc cảnh 3D | Tạo scene thật với Three.js, instancing, 28 avatar; thực thi 4 action và cleanup texture; dùng renderer stub, không phải GPU |
| UI trình duyệt | Admin: bấm +12 khách, Thử đầy quán thêm40 → 52 đã ghé, 28 trong quán, 24 chờ, 7/7 bàn; quà Rose ×1 ghi nhãn DEMO |
| Build tĩnh | npm run build tạo dist có frontend, không chứa mã cầu nối/secret |
| GitHub Pages | Workflow run 43159781036, deploy attempt 2 thành công; URL https://baotran-06.github.io/xom-online-live/ được lấy từ output deployment và mở kiểm tra |
| DEMO trên Pages | Trang game và admin mở được; bấm mời12 trên game → admin ghi nhận12 khách, 3/7 bàn, không chờ; đồng bộ nhiều tab cùng origin |

Root và bridge: npm audit --omit=dev sau cập nhật không ghi nhận advisory ở thời điểm kiểm tra. Đây không phải bảo đảm không có lỗ hổng.

## Chưa được xác minh

- WebGL/GPU và ảnh thực tế của quán: trình duyệt môi trường trả **Error creating WebGL context**. Mã scene và vòng animation đã chạy bằng stub trong test, không thay thế kiểm tra rendering thật.
- Audio đầu ra thiết bị/OBS. Mã tổng hợp hiệu ứng đã có; chưa nghe kiểm tra bằng thiết bị thật.
- Kết nối TikTok thật, viewer/member event, quà thật, streamEnd và reconnect với mạng TikTok thật. Các test adapter sử dụng fixture, không giả là LIVE thực tế.
- Chưa chạy trên chính laptop người dùng, chưa quan sát Chrome/Edge tự mở bằng giao diện đồ họa (CI đặt XOM_NO_BROWSER=1), chưa kiểm chứng TikTok LIVE Studio/OBS hoặc soak nhiều giờ. Hai BAT đã thực thi trực tiếp trên Windows runner bằng cmd.exe và Node 22.23.4.


Mã được triển khai từ commit 88d2fe8fbf05cd26137f6e7db4067956f5cd9879. Lần deploy đầu báo404 vì chưa bật Pages; sau khi chủ tài khoản chọn Source = GitHub Actions, đã chạy lại job deploy hiện có và nhận success. Không sửa workflow hoặc repo khác.

Không tuyên bố đã đáp ứng đầy đủ tiêu chí hoàn thành sản phẩm. Phần mã nguồn, DEMO logic/UI và giao tiếp bridge đã triển khai; cần hoàn tất các bước kiểm chứng còn lại.

## START / STOP Windows — bản hiện tại

- Source commit: 5665cfa5c3eab0b8e3c426cb603b374664510445.
- Workflow: https://github.com/baotran-06/xom-online-live/actions/runs/43164688103 — windows-launcher, test-build và deploy đều success.
- Windows runner / Node 22.23.4: gọi START-XOM.bat bằng cmd.exe trong thư mục có khoảng trắng/dấu ngoặc; ban đầu không có node_modules. START tự cài root và bridge, build, HTTP/WS/frontend hoạt động ở 127.0.0.1:3210; LIVE đang chờ, 0 người, 0 sự kiện và verified=false.
- Gọi START lần hai: giữ cùng PID, không sinh server mới. Token dừng sai bị từ chối; STOP từ thư mục khác bị chặn và server gốc vẫn sống. STOP đúng thư mục đóng socket/HTTP và tiến trình; STOP lần nữa trả thành công. Cổng 3210 do listener khác chiếm: START báo lỗi và giữ listener đó hoạt động.
- Linux / Node 22: thêm kiểm tra lỗi cài đặt, sửa import dependency bị hỏng ngay trong một lần khởi động và STOP trong lúc đang setup. Không tạo server sau yêu cầu dừng.
- Trạng thái awaiting-event không có nghĩa LIVE đã xác minh. Unit test dùng fixture để chứng minh chỉ sự kiện provider hợp lệ mới đặt verified; các fixture không phải kiểm chứng TikTok thật.
- Chưa có username/buổi LIVE thật để kiểm tra tài khoản người dùng. Không phát sinh quà/khách DEMO để báo thành công LIVE.

## Tự mở hai trang — cập nhật mới nhất

Source commit 6854638d62894ff2cd2961b0764949621ebb509b, workflow https://github.com/baotran-06/xom-online-live/actions/runs/43174970548. Đã đọc và kiểm tra START-XOM.bat, STOP-XOM.bat và launcher thực tế trong repo. Launcher sau health check mở lần lượt http://127.0.0.1:3210/admin và http://127.0.0.1:3210/; nếu một lần mở thất bại vẫn thử trang còn lại và in cả hai URL để xử lý. Unit test xác nhận hai URL, trường hợp một lần mở lỗi và chế độ không mở browser của CI. Windows runner đã gọi trực tiếp cả BAT và pass các bài setup, HTTP/WebSocket, mở trùng, STOP và cổng bận. CI không quan sát giao diện browser hoặc TikTok LIVE thật trên laptop người dùng.

## Bản sửa lỗi nguồn TikTok

- Thông báo cũ đã bỏ mất exception thực tế. Bản mới chỉ xuất các trường allowlist: loại lỗi, route, HTTP, mã mạng; không xuất message gốc, body, URL ký, cookie hoặc key.
- Kiểm thử: phân loại lỗi SDK thật; exception composite/cause lồng nhau và có chu trình; không lộ dữ liệu nhạy cảm; gộp lỗi vừa emit vừa reject; lỗi quyền dừng retry;429 chờ đúng millisecond của SDK và header HTTP; cooldown không bị xóa khi ngắt thủ công; socket mở chưa có sự kiện không reset retry; lỗi danh mục quà tùy chọn không làm chết transport và không bỏ qua429.
- Thử username công khai trong ảnh do người dùng cung cấp từ môi trường kiểm thử: không tìm được room, verified=false, RequestError HTTP301 ở bước lookup. Không nhận sự kiện thật. Mạng/môi trường kiểm thử khác laptop người dùng, nên không kết luận đây là cùng nguyên nhân trên laptop.
- Vẫn cần chạy bản mới trên laptop để lấy mã lỗi cụ thể tại nguồn đó. Không xem phần sửa log/retry là bằng chứng đã kết nối TikTok thành công.

## Nâng cấp người xem / âm thanh (2026-11-12)

- Local: 40 tests, 39 pass, 1 Windows-only skip; thêm kiểm tra vòng đời rời/quay lại, nhiều khách rời, LIVE im lặng, hướng dẫn theo ánh xạ quà, PCM WAV không rỗng, mức môi trường theo số khách và Unicode tên dài.
- Browser test `scripts/browser-check.mjs` chạy trong workflow hiện có: WebGL thật qua Chromium/SwiftShader; đo PCM từng kênh; nút phát, playlist thêm/xóa/đổi; chuyển động rời và xóa rồi vào lại; ảnh 1920×1080 và 1280×720 làm artifact. Không gọi đó là kiểm chứng âm thanh trên LIVE Studio.
- Chromium local không khởi động được do hạn chế socket của môi trường, nên kết quả trình duyệt phải lấy từ GitHub Actions sau khi chạy.
- Chưa kiểm chứng sự kiện rời TikTok thật (nguồn hiện không cung cấp), chưa xác nhận mix âm thanh ra buổi LIVE trên laptop. Không đổi dữ liệu DEMO thành LIVE.
