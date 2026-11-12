# Báo cáo kiểm thử — 12/11/2026

## Đã kiểm tra

| Hạng mục | Kết quả / bằng chứng |
|---|---|
| Cú pháp JavaScript / JSON | npm run check, 15 module hợp lệ |
| Test tự động | 14/14 pass (Node 24 local và Node 22 trên GitHub Actions đều pass) |
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

Root và bridge: npm audit --omit=dev sau cập nhật không ghi nhận advisory ở thời điểm kiểm tra. Đây không phải bảo đảm không có lỗ hổng.

## Chưa được xác minh

- WebGL/GPU và ảnh thực tế của quán: trình duyệt môi trường trả **Error creating WebGL context**. Mã scene và vòng animation đã chạy bằng stub trong test, không thay thế kiểm tra rendering thật.
- Audio đầu ra thiết bị/OBS. Mã tổng hợp hiệu ứng đã có; chưa nghe kiểm tra bằng thiết bị thật.
- Kết nối TikTok thật, viewer/member event, quà thật, streamEnd và reconnect với mạng TikTok thật. Các test adapter sử dụng fixture, không giả là LIVE thực tế.
- Chạy BAT trên Windows thật, Node 22 thật, TikTok LIVE Studio/OBS và soak nhiều giờ. BAT đã soạn và rà soát, chưa thực thi trên Windows.
- GitHub Pages: repo public https://github.com/baotran-06/xom-online-live đã được chủ tài khoản tạo; 42 file đã upload vào main (commit 88d2fe8fbf05cd26137f6e7db4067956f5cd9879). Workflow run 43159781036: job test-build thành công (npm ci, check, 14 tests, build, upload artifact); deploy thất bại HTTP 404, log yêu cầu bật GitHub Pages. Trình duyệt GitHub đang logged out nên dừng ở bước cấu hình để chủ tài khoản thực hiện. Chưa có deployment URL được xác nhận.

Không tuyên bố đã đáp ứng đầy đủ tiêu chí hoàn thành sản phẩm. Phần mã nguồn, DEMO logic/UI và giao tiếp bridge đã triển khai; cần hoàn tất các bước kiểm chứng còn lại.
