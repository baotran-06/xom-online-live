# Mô hình 3D
Toàn bộ quán và nhân vật là mô hình mesh 3D thủ tục trong `../js/scene.js` (Three.js/WebGL), không phải ảnh nền hoặc ảnh giả 3D. Geometry dùng chung, batch InstancedMesh cho vật tĩnh. Nhân vật có rig group cho đầu/thân/tay/chân, chuyển động theo thời gian; nameplate CanvasTexture được hủy khi nhân vật rời quán. Không cần tải mô hình có bản quyền từ bên ngoài.
