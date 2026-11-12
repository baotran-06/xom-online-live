# Màn hình người xem và âm thanh XÓM ONLINE

## Cập nhật trên Windows

1. Bấm STOP-XOM.bat trong thư mục cũ.
2. Tải ZIP mới tại https://github.com/baotran-06/xom-online-live/archive/refs/heads/main.zip rồi giải nén vào thư mục mới. Không chạy trong ZIP.
3. Bấm START-XOM.bat. Chờ hai trang game và điều khiển mở.
4. Trên màn hình game, bấm **Bắt đầu âm thanh** một lần. Trình duyệt yêu cầu thao tác chủ động; không thể bảo đảm tự phát sau khi bật máy.
5. Mời 12 khách DEMO để nghe không khí quán. Khi quán trống, kênh môi trường yên lặng. DEMO có nhãn riêng; khi dùng LIVE, chuyển chế độ và kết nối tài khoản thực.

## Ba kênh độc lập

- Nhạc: hai giai điệu nguyên gốc vui nhẹ, quyền CC0. Có phát/dừng, bài trước/sau, tự chuyển bài khi kết thúc, âm lượng và bật/tắt riêng. Có thể thêm file nhạc trên máy, chọn bài rồi xóa khỏi playlist. File cá nhân không tải lên server/GitHub; danh sách thêm thủ công chỉ tồn tại trong phiên, cần thêm lại sau khi tải lại trang. Muốn giữ playlist mặc định, chỉnh `frontend/config/audio.json`, dùng đường dẫn file trong `frontend/sounds/` và ghi giấy phép.
- Không khí quán: bản thu thật tại nhà hàng Việt Nam của mycompasstv, CC0. Cắt ngẫu nhiên các đoạn 12–18 giây, chuyển âm chồng nhẹ; 1/2/3 lớp tùy số khách. Âm lượng chuyển mượt trong vài giây, giảm khi có sự kiện rời rõ ràng. Đây là bản thu trò chuyện nền, không phải bộ thoại riêng “gọi món/gọi bạn” hay tiếng cười được xác nhận từng câu. Chưa có bộ thoại Việt tách rời; có thể thay nguồn đã được cấp quyền trong cấu hình âm thanh.
- Hiệu ứng: âm quà, cụng ly và tiếng gỗ/ghế cách điệu được tổng hợp trong game. Kênh hiệu ứng quà theo công tắc admin; tiếng ly/ghế ngẫu nhiên thuộc kênh môi trường. Tối đa 14 nguồn hoạt động, tự giải phóng node, thu hồi URL file khi xóa/đóng game; bộ nén hạn chế đỉnh âm. Đây không phải bản thu riêng của từng đồ vật.

Thanh “Đầu ra game” đo tín hiệu PCM sau bộ trộn. **Có tín hiệu ở game không chứng minh TikTok đã thu được.** Âm lượng nhạc mặc định nhỏ hơn môi trường; có thể giảm nhạc thêm để ưu tiên tiếng quán.

## Thu tiếng vào TikTok LIVE Studio

1. Mở game trong Chrome/Edge, kiểm tra tab không bị mute; bấm Bắt đầu âm thanh và Thử tiếng cụng ly.
2. Trong Windows Volume Mixer, kiểm tra trình duyệt không bị tắt tiếng và đang phát ra thiết bị loa/tai nghe bạn dùng.
3. Thêm nguồn hình cửa sổ game `http://127.0.0.1:3210/`, không chọn `/admin`. Nguồn hình không tự chứng minh có nguồn âm thanh.
4. Trong bộ trộn của LIVE Studio, bật nguồn âm thanh hệ thống/desktop hoặc nguồn thu âm ứng dụng nếu phiên bản đang dùng có hỗ trợ. Chọn đúng thiết bị đầu ra của trình duyệt. Tên nút thay đổi theo phiên bản; nếu chưa tìm được, chụp phần bộ trộn để đối chiếu.
5. Chỉ dùng một đường thu âm game để tránh lặp/echo. Nên dùng tai nghe để micro không thu lại tiếng loa.
6. Bấm Thử tiếng cụng ly, nhìn đồng hồ âm lượng của LIVE Studio phải nhảy. Nhạc có thể phát dù chưa có khách; môi trường cần có khách.
7. Ghi thử bằng LIVE Studio nếu có chức năng ghi hình, nghe lại. Khi phát thử LIVE, dùng điện thoại/tài khoản khác nghe với tai nghe; xác nhận cả nhạc, môi trường và tiếng thử. Tắt tiếng phát lại trên laptop để tránh hồi âm.

Nếu game có tín hiệu mà LIVE Studio không nhảy mức: lỗi ở chọn nguồn/thiết bị thu. Nếu LIVE Studio nhảy mức mà điện thoại không có tiếng: kiểm tra mute và đường phát của LIVE Studio. Chúng tôi chưa thể kiểm tra đường thu thực tế trên laptop hay buổi LIVE của bạn từ môi trường phát triển.

OBS: thêm Browser Source với URL local; bật “Control audio via OBS”, kiểm tra Audio Mixer và Advanced Audio Properties. Nếu ghi cửa sổ Chrome thay vì Browser Source, thu thêm audio desktop/ứng dụng tương ứng; không thu hai lần.

## Bảng hướng dẫn và bảng tên

Cột bên phải luôn thuộc màn hình game, có vùng riêng không che cảnh. Cảnh quán giữ nguyên hình học; camera điều chỉnh khung nhìn để giữ toàn bộ bề ngang khi dành chỗ cho cột. Nội dung nhãn/icon sửa ở `frontend/config/interactions.json`; mô tả hành động lấy từ `giftRules` thực của World, nên thay ánh xạ quà sẽ cập nhật hướng dẫn. Đối chiếu quà theo ID vẫn cần xác minh theo vùng từ nguồn LIVE thật. Follow chỉ vẫy chào, không hứa vật phẩm/phần thưởng chưa triển khai.

Bảng tên là sprite luôn quay về camera, đi theo nhân vật, có nền sáng, rút gọn theo ký tự Unicode, xếp tầng theo vị trí chiếu để giảm chồng lấn. Tên LIVE lấy từ payload nguồn, không tự tạo nickname. Khi thiếu nickname, hiển thị ID nguồn. DEMO ghi rõ nguồn mô phỏng.

## Khách rời quán

State machine khi có `leave` với đúng ID: đứng dậy 0,9 giây → đi theo lối bên bàn và hành lang ra cửa bên trái → đi ra ngoài khung hình → xóa sau 18 giây. Giữ chỗ trong lúc rời để khách mới không ngồi chồng. Khách rời không được đưa sang hàng chờ. Cùng ID quay lại trong lúc đang rời được đợi hết hoạt ảnh rồi tạo lại lượt vào mới; không tạo hai nhân vật. Bảng tên được giải phóng cùng nhân vật.

**Giới hạn LIVE:** connector 2.5.0 hiện không có listener rời LIVE theo ID được tài liệu hóa. Không suy diễn từ `roomUser.total`, thiếu chat hay mất socket; không bật timeout im lặng trong LIVE. Vì vậy chưa tuyên bố tự phát hiện người rời TikTok thật. Core và WebSocket đã hỗ trợ dữ liệu `leave`; cần nguồn có sự kiện rời được xác minh để nối adapter. Trường `liveEvidence.capabilities.viewerLeave=false` công khai giới hạn này.

Thử ngay: admin → Bật DEMO → +12 khách → chờ ngồi → Khách #1 rời quán. Khách #1 đứng lên, đi ra và biến mất ngoài cảnh. Nhấn lại không làm nhân vật khác rời. Xóa/đổi phiên là thao tác quản lý nên dọn cảnh ngay, không giả làm sự kiện người xem rời LIVE.
