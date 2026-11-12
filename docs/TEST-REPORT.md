# Báo cáo kiểm thử — 12/11/2026

## Đã kiểm tra

| Hạng mục | Kết quả / bằng chứng |
|---|---|
| Cú pháp JavaScript / JSON | npm run check, 19 module hợp lệ |
| Test tự động | 20 tests Linux pass, 0 fail; 1 Windows-only test được skip ở Linux và chạy riêng thành công trên Windows (Node 22.23.4) |
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
