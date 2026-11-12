# Nguồn và giấy phép (kiểm tra 12/11/2026)

- TikTok developer webhooks: https://developers.tiktok.com/docs/en/webhooks-events — danh sách công khai được xem không nêu general-purpose LIVE member/gift feed. Không coi đây là bằng chứng mọi chương trình đối tác riêng đều không có API.
- TikTok LIVE Connector: https://ttlc.docs.isaackogan.com/ — unofficial, Node >=20, ESM, anonymous public room, signing bên thứ ba.
- Vòng đời: https://ttlc.docs.isaackogan.com/getting-started/connection/
- Quà/streak: https://ttlc.docs.isaackogan.com/guides/gifts/
- Authentication: https://ttlc.docs.isaackogan.com/configuration/authentication/
- Releases: https://github.com/zerodytrash/TikTok-Live-Connector/releases/tag/v2.5.0
- npm metadata và module cài thực tế: tiktok-live-connector 2.5.0, AGPL-3.0-only; package-lock riêng ở bridge/.
- Three.js 0.170.0, MIT: https://github.com/mrdoob/three.js — LICENSE được chép cùng module vendor.
- ws 8.22.2, MIT: https://github.com/websockets/ws
- GitHub Pages Actions: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

Tài sản 3D và âm thanh do dự án tạo bằng mã. Không dùng ảnh, nhạc hoặc model của TikTok/người xem; không ngụ ý được TikTok bảo trợ.

## Âm thanh bổ sung (2026-11-12)

- `frontend/sounds/vietnamese-restaurant.mp3`: **Restaurant ambience chatter**, mycompasstv, 2019-06-16, https://freesound.org/people/mycompasstv/sounds/474740/ . Trang nguồn ghi Creative Commons 0; https://creativecommons.org/publicdomain/zero/1.0/ . Bản preview HQ được tải từ CDN Freesound, chuyển mono 22050Hz/32kbps để tối ưu kích thước; không nhận là bản thu do dự án tự thực hiện. Quyền CC0 cho phép sao chép, chỉnh sửa, phân phối và sử dụng thương mại. Không có cam kết TikTok sẽ không nhận diện nhầm tự động.
- Hai giai điệu và foley tổng hợp trong `frontend/js/audio.js`: tác phẩm mới cho XÓM ONLINE LIVE, hiến tặng CC0-1.0 (không dùng mẫu nhạc thương mại). Phần mã nguồn vẫn theo LICENSE của repository; quyền CC0 áp dụng âm thanh được tạo.
- Connector: https://ttlc.docs.isaackogan.com/events/chat-and-audience/ xác định member là thông báo vào, roomUser là snapshot/thống kê, không bảo đảm từng người rời. Không biến chênh lệch số người xem thành sự kiện rời theo ID.
