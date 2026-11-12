# XÓM ONLINE LIVE

- Game / DEMO: https://baotran-06.github.io/xom-online-live/
- Điều khiển DEMO: https://baotran-06.github.io/xom-online-live/admin.html
- Workflow đã thành công: https://github.com/baotran-06/xom-online-live/actions/runs/43159781036

Quán nhậu Việt Nam 3D tương tác với TikTok LIVE. Frontend Three.js/WebGL thật, mô hình và âm thanh được tạo bằng mã; Node.js bridge riêng; bảng điều khiển tách màn hình game. Không yêu cầu người xem đăng ký tài khoản game.

**Tình trạng bàn giao:** 42 file mã nguồn đã có trong repository public baotran-06/xom-online-live. GitHub Actions đã kiểm thử và build thành công trên Node 22; GitHub Pages đã triển khai thành công và URL công khai đã mở kiểm tra. DEMO trên Pages tạo 12 khách, đồng bộ sang bảng điều khiển với 3 bàn đang dùng. Chưa kiểm chứng hình ảnh WebGL/GPU, TikTok LIVE thật, Windows/OBS và soak nhiều giờ. Xem [báo cáo kiểm thử](docs/TEST-REPORT.md).

## Khởi chạy nhanh trên Windows

1. Cài **Node.js 22 LTS hoặc mới hơn**.
2. Giải nén vào thư mục mới; chạy **START-XOM.bat**.
3. Mở game `http://127.0.0.1:3210/`, điều khiển `http://127.0.0.1:3210/admin`.
4. Thử +12 khách, Thử đầy quán, follow và quà DEMO trên bảng điều khiển.
5. Muốn thử TikTok: chạy **INSTALL-TIKTOK.bat**, mở một buổi LIVE thật, nhập username và kết nối. Cần Internet. Không nhập mật khẩu hoặc token TikTok.

Hoặc terminal:

```bash
npm ci
npm run build
npm start
# Cửa sổ terminal khác, cài adapter TikTok tùy chọn:
npm ci --prefix bridge
```

Tắt bằng Ctrl+C. Game/Admin local phải cùng origin. Không mở HTML bằng file://.

## Có gì trong dự án

- Quán 3D, quầy bia, tủ lạnh, sân khấu/micro/loa, đèn dây, cây, poster, gạch lát, 7 bàn 4 ghế, đồ ăn/ly/chai.
- Nhân vật hình khối hoạt hình, tóc/màu áo đa dạng; tên trên đầu; đi, ngồi, vẫy, nâng ly, nhận hoa và hiệu ứng tập thể.
- Join/member hoặc tương tác có user ID tạo một nhân vật, chống trùng theo tài khoản; tự cấp ghế, hàng chờ FIFO, TTL hoạt động.
- Cấu hình quà theo ID/tên, xử lý streak cuối, dedupe có giới hạn, thông báo tên và âm thanh Web Audio.
- Bridge chỉ đọc TikTok; kết nối/ngắt/reconnect backoff, dừng khi streamEnd; websocket heartbeat và ngắt client quá chậm.
- DEMO browser độc lập; đồng bộ nhiều tab qua BroadcastChannel/Web Locks. API LIVE từ chối sự kiện DEMO.
- Giới hạn 28 avatar, 80 chờ, queue 2.000, xử lý 30 event/100 ms, history 80, log lỗi 60, dedupe 10.000. Vật tĩnh dùng InstancedMesh; geometry/material chia sẻ và dispose texture tên.
- Không có DB: dữ liệu phiên nằm trong RAM, đóng tiến trình là xóa.

## TikTok: điều đã xác minh và chưa xác minh

Đã kiểm tra tài liệu chính thức TikTok về webhook; danh sách công khai không xác lập general-purpose LIVE gift/member feed. Adapter dùng **tiktok-live-connector 2.5.0**, dự án không chính thức, kết nối public LIVE theo username, có thể phụ thuộc dịch vụ ký Euler Stream. Đã cài package, import API và kiểm tra schema protobuf v3 thực tế. Đây **không phải** kiểm chứng LIVE thành công.

- Chưa có username đang phát LIVE để thử end-to-end. Chưa xác minh quà thật, viewer leave, reconnect với mạng TikTok thật.
- `member` không được bảo đảm cho mọi người xem/phòng/vùng; người xem im lặng có thể không xuất hiện. Không có snapshot tất cả viewer.
- Không đăng ký leave event chưa được xác nhận; hết 10 phút không hoạt động sẽ nhường ghế. Đây là TTL, không phải biết chắc viewer rời LIVE.
- Khi nguồn thiếu message ID/group ID, không thể cam kết exactly-once tuyệt đối. Replay sau cửa sổ cache 15 phút cũng không được bảo đảm chống lặp.
- Dịch vụ ký có thể thay đổi, rate-limit, cần tài khoản/quyền hoặc có phí. Bản này không phụ thuộc máy chủ trả phí do dự án vận hành, nhưng không bảo đảm nhà cung cấp nguồn sẽ miễn phí/khả dụng mãi.
- Chuyển LIVE/DEMO xóa phiên; không tự thêm viewer/quà giả trong LIVE. Trạng thái connected chỉ xác nhận socket nguồn; phải có sự kiện thật mới xác nhận luồng dữ liệu thực tế.

Tham khảo [nguồn & giấy phép](docs/SOURCES.md), [kiến trúc](docs/ARCHITECTURE.md), [bảo mật](docs/SECURITY.md).

## Cấu hình

- `config/gifts.json`: `byId` ưu tiên hơn `byName`; action: wave, flowers, cheers, spotlight. Thay ID bằng ID ghi nhận từ LIVE thật. Quà không rõ tên/ID dùng defaultAction. `groupThreshold` theo repeatCount của một quà/streak cuối.
- `config/game-settings.json`: TTL, queue, capacity. Bố trí 7×4 ghế là cố định trong `frontend/js/scene.js`; chỉ hạ maxVisible nếu máy yếu. Tăng số bàn cần sửa cả mesh/layout.
- Khởi động lại tiến trình sau khi sửa config; nút Khởi động lại cầu nối chỉ reset adapter và phiên, không đọc lại file config.
- Âm thanh mặc định tắt. Nhấn Âm thanh trong game một lần để browser cho phép rồi bật công tắc ở admin.

## GitHub và GitHub Pages

Dự án này độc lập, không dùng thư mục hoặc repo cũ. Workflow `.github/workflows/pages.yml` cài phụ thuộc, kiểm thử, build `dist` và deploy Pages. Pages chỉ phục vụ **frontend tĩnh/DEMO**, không chạy Node.js. Khi LIVE thật, dùng frontend do bridge local phục vụ để không gặp mixed-content HTTPS→ws://local.

Repository đích: `baotran-06/xom-online-live`; Source Pages là GitHub Actions. Workflow hiện có `.github/workflows/pages.yml` đã triển khai thành công, không tạo workflow trùng lặp. Deployment xác nhận URL https://baotran-06.github.io/xom-online-live/ . Trang game và admin đều mở được; DEMO tạo 12 khách và đồng bộ 3 bàn. Các tài nguyên đã được xuất bản; WebGL chưa tạo được context trong môi trường kiểm thử nên chưa xác nhận phần ảnh 3D trên GPU.

**Không dùng helper tạo repo cho repository hiện tại đã tồn tại.** Helper bên dưới chỉ dành cho khởi tạo một repo mới và sẽ từ chối ghi đè. Để cập nhật dự án này, push vào `main`; workflow hiện có sẽ tự chạy.

Nếu đã cài GitHub CLI, đăng nhập bằng `gh auth login` trên máy của bạn (không đưa token vào mã), có thể chạy `npm run publish:github` từ checkout đã có commit. Script từ chối nếu repo cùng tên tồn tại, chỉ tạo repo mới và không chạm các repo khác. Script cần quyền tạo repo, push workflow và Pages administration; nếu thiếu quyền phải xử lý trên GitHub. Không dùng tài khoản hoặc token chia sẻ công khai.

## Kiểm thử

```bash
npm ci
npm ci --prefix bridge
npm run build
npm run check
npm test
```

Tests gồm core, adapter/schema thật, HTTP/WebSocket end-to-end, nguồn DEMO/LIVE, race disconnect và scene construction bằng renderer stub. Test stub không chứng minh GPU render được. Môi trường trình duyệt xây dựng hiện báo WebGL context không khả dụng; cần kiểm tra hình ảnh/FPS và soak 2–4 giờ trên Windows thật. Không có tuyên bố đã chạy ổn định nhiều giờ.

## OBS / TikTok LIVE Studio

Xem [hướng dẫn Windows và đưa game lên sóng](docs/WINDOWS-OBS.md). OBS Browser Source: URL game local, 1920×1080, 30 FPS; điều khiển bằng tab admin riêng. LIVE Studio có thể dùng Link source hoặc Window Capture tùy phiên bản/quyền tài khoản.

## Cấu trúc

- `frontend/`: game, admin, CSS, JS, assets/vendor, tài liệu models/sounds.
- `bridge/`: HTTP/API, WebSocket, TikTok adapter, cấu hình server, package-lock riêng.
- `config/`: quà và giới hạn thế giới.
- `tests/`: test tự động.
- `scripts/`: check, build và xuất bản GitHub bằng gh trên máy đã đăng nhập.
- `docs/`: kiến trúc, bảo mật, Windows/OBS, nguồn và báo cáo.
- `START-XOM.bat`, `INSTALL-TIKTOK.bat`: khởi chạy Windows.

## Giấy phép

AGPL-3.0-only cho bản phân phối dự án để phù hợp connector TikTok hiện tại. Three.js/ws theo MIT, thông báo bản quyền Three.js trong assets/vendor. Giữ mã nguồn và thông báo giấy phép khi phân phối. Tài sản đồ họa/âm thanh do mã dự án tạo, không lấy ảnh/avatar/nhạc có bản quyền bên ngoài. Không được TikTok bảo trợ.
