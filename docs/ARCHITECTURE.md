# Kiến trúc

```
TikTok Webcast → tiktok-live-connector (Node) → tiktok.js
→ chuẩn hóa sự kiện → World.queue → World.tick → WebSocket snapshot
→ Client → Tavern (Three.js) + HUD
```

- `frontend/js/core.js`: nguồn trạng thái duy nhất cho khách, ghế, timeout, quà, lịch sử và chống lặp.
- `bridge/tiktok.js`: adapter chỉ đọc LIVE công khai; không gửi chat hay giao dịch quà. Dùng API hiện đại TikTokLiveConnection 2.5.0. `processInitialData:false` không xử lý batch lịch sử ban đầu.
- `bridge/server.js`: HTTP static + API điều khiển local. Cấu hình ở `config/` được đọc khi khởi động tiến trình.
- `bridge/websocket.js`: broadcast 10 lần/giây; ping/pong, giới hạn 20 clients, ngắt client chậm quá 1 MiB buffer.
- `frontend/js/client.js`: dùng cầu nối khi xác minh được `/api/state`; nếu trang tĩnh thì chạy DEMO. Web Locks chọn một tab làm chủ mô phỏng, BroadcastChannel đồng bộ game/admin cùng origin. Nếu thiếu Web Locks, không bảo đảm nhiều tab chỉ có một engine.
- `frontend/js/scene.js`: mesh thật, ánh sáng, bóng đổ, phối cảnh trước quán; instancing vật tĩnh. CanvasTexture chỉ dùng cho bảng hiệu và tên nhân vật.
- `frontend/admin.html`: điều khiển; game ở `index.html`.

## Quy tắc nhận người xem

`member` → join. `chat`, `like`, `follow`, `gift` cũng có thể tạo nhân vật nếu chưa có. Không có API liệt kê đầy đủ mọi người xem. Không cam kết tất cả người xem sẽ xuất hiện vì TikTok có thể không gửi sự kiện member ở một số phòng/vùng. Không suy đoán một tài khoản rời LIVE từ tổng viewerCount. Do không có nguồn leave đáng tin được xác nhận, dùng TTL 10 phút kể từ sự kiện gần nhất. Đây là trạng thái hoạt động ước lượng, không phải danh sách người xem hiện diện chính xác.

28 ghế (7×4) + 80 khách chờ. Khách chờ chỉ nằm trong danh sách dữ liệu, không được render. Ghế trống cấp FIFO. Trong một phiên, Set ghi nhận tối đa 50.000 tài khoản duy nhất; sau đó giữ tổng là mức tối thiểu và hiển thị cảnh báo, không tiếp tục tăng bộ nhớ.

## Quà và chống lặp

- Ưu tiên `byId`, rồi tên chữ thường, rồi defaultAction. Chỉ 4 action hợp lệ.
- Gift type 1: chờ repeatEnd, xử lý repeatCount cuối. Nếu có groupId, dedupe theo phiên/user/gift/group; nếu có msgId dedupe event theo phiên/type/msgId.
- Khi thiếu cả message ID lẫn group ID đáng tin, không thể bảo đảm exactly-once từ nguồn. Không dùng khóa user+gift+time vì sẽ nuốt những quà hợp lệ liên tiếp. Hạn chế được công bố, không hứa tuyệt đối.
- Cache chống lặp 10.000 event / 15 phút. Replay ngoài cửa sổ cache có thể được xử lý lại.
- groupThreshold áp dụng lên số lượng của một sự kiện quà cuối/streak, không phải tổng tiền hay tổng quà toàn phiên.
- Quà không có tên vẫn được log giftId để người vận hành gán action bằng config. ID mẫu để trống, không bịa ID thật.

## Ranh giới DEMO / LIVE

Chuyển chế độ xóa toàn bộ khách, queue, cache, lịch sử. LIVE từ chối source DEMO và API demo trả 409. Mất socket khi đang LIVE không tự chạy người xem giả. Trang GitHub Pages chỉ là frontend và DEMO, không có Node server. Để lên sóng thật dùng game/admin do bridge phục vụ tại 127.0.0.1. Không nối trang HTTPS Pages tới ws://local để tránh mixed-content và Local Network Access prompts.

## Giới hạn cấu hình

`tables:7`, `seatsPerTable:4`, `maxVisible:28` khớp bố trí mesh hiện tại. Có thể hạ maxVisible. Tăng bàn/ghế cần sửa `TABLES` và layout cảnh; không chỉ sửa JSON. Giới hạn hàng đợi 2.000, xử lý 30 event/100 ms (~300/s). Quá tải được bỏ và đếm rõ trên admin. Idle avatar hết hạn, geometry dùng chung, texture tên được dispose, audio nodes được disconnect. Chưa có kiểm thử soak nhiều giờ trên máy Windows thật.
