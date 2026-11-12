// Only allowlisted metadata and application-owned messages may leave this module.
// Never serialize upstream messages, bodies, cookies, request headers or signed URLs.
const TYPES=new Set(['Error','TypeError','RangeError','HTTPError','RequestError','TimeoutError','ConnectTimeoutError','UserOfflineError','InvalidUniqueIdError','AlreadyConnectingError','AlreadyConnectedError','InvalidRequestError','InvalidResponseError','InvalidResponseCompositeError','SignAPIError','SignatureRateLimitError','SignatureMissingTokensError','PremiumFeatureError','AuthenticatedWebSocketConnectionError','SchemaDecodeError','AggregateError']);
const ROUTES=new Set(['fetchRoomIdRoute','fetchIsLiveRoute','fetchRoomInfoRoute','fetchRoomInfoApiLiveRoute','fetchRoomInfoHtmlRoute','fetchRoomIdFromEulerRoute','fetchRoomInfoFromEulerRoute','fetchSignedWebSocketFromEulerRoute','fetchWebcastSignatureFromEulerRoute','fetchRoomGiftsRoute','fetchRoomGiftsFromEulerRoute']);
const NETWORK=new Set(['ETIMEDOUT','ESOCKETTIMEDOUT','ECONNRESET','ECONNREFUSED','EAI_AGAIN','ENOTFOUND','ENETUNREACH','ERR_MODULE_NOT_FOUND','ERR_TLS_CERT_ALTNAME_INVALID','CERT_HAS_EXPIRED','UNABLE_TO_VERIFY_LEAF_SIGNATURE','DEPTH_ZERO_SELF_SIGNED_CERT']);
const text=x=>typeof x==='string'?x:'';
export function diagnoseTikTok(input,now=Date.now()){
  const queue=[input];const seen=new Set();const nodes=[];let retryAfterMs=0;
  while(queue.length&&nodes.length<12){const e=queue.shift();if(!e||typeof e!=='object'||seen.has(e))continue;seen.add(e);
    const name=[e.constructor?.name,e.name].find(x=>TYPES.has(x)&&x!=='Error')||'Error';
    const message=text(e.message);const route=ROUTES.has(e.config?.routeId)?e.config.routeId:null;
    const candidate=Number(e.response?.statusCode??e.response?.status??e.statusCode??e.status??message.match(/(?:HTTP|status(?: code)?|response:)\s*[:=]?\s*(\d{3})/i)?.[1]);
    const status=Number.isInteger(candidate)&&candidate>=100&&candidate<=599?candidate:null;
    const netCode=NETWORK.has(e.code)?e.code:[...NETWORK].find(code=>message.includes(code))||null;
    const tags=[];
    if(name==='RangeError'&&text(e.stack).includes('formatSignServerMessage'))tags.push('provider-format');
    if(/Unexpected server response:\s*200/i.test(message))tags.push('handshake');
    if(name==='UserOfflineError')tags.push('offline');
    if(name==='InvalidUniqueIdError')tags.push('username');
    if(name==='SignatureRateLimitError'||status===429)tags.push('rate-limit');
    if(name==='PremiumFeatureError'||status===402||/lack of permission/.test(message))tags.push('permission');
    if(status===401||status===403||name==='AuthenticatedWebSocketConnectionError')tags.push('denied');
    if(/SIGI_STATE|extract.*(?:Room ID|LiveRoom).*HTML|captcha-blocked|blocked by TikTok/i.test(message))tags.push('html');
    if(name==='InvalidResponseCompositeError')tags.push('lookup');
    if(name==='SignatureMissingTokensError'||name==='SignAPIError')tags.push('signing');
    if(name==='ConnectTimeoutError'||name==='TimeoutError'||/timeout|timed out/i.test(message))tags.push('timeout');
    if(netCode)tags.push('network');
    nodes.push({type:name,route,status,networkCode:netCode,tags});
    const sdkDelay=Number(e.retryAfter);if(Number.isFinite(sdkDelay)&&sdkDelay>0)retryAfterMs=Math.max(retryAfterMs,sdkDelay);
    const reset=Number(e.resetTime);if(Number.isFinite(reset)&&reset>now)retryAfterMs=Math.max(retryAfterMs,reset-now);
    const header=e.response?.headers?.['retry-after'];if(typeof header==='string'||typeof header==='number'){const sec=Number(header);const delay=Number.isFinite(sec)?sec*1000:Date.parse(String(header))-now;if(delay>0)retryAfterMs=Math.max(retryAfterMs,delay);}
    for(const child of [e.exception,e.error,e.cause,e.config?.requestErr])if(child)queue.push(child);
    for(const group of [e.config?.requestErrs,e.errors])if(Array.isArray(group))queue.push(...group.slice(0,12));
  }
  const has=tag=>nodes.some(n=>n.tags.includes(tag));let code='UNKNOWN',summary='Chưa xác định được lỗi nguồn. Cần đối chiếu mã loại lỗi và bước thất bại.',retryable=true;
  if(has('lookup')){code='ROOM_LOOKUP_FAILED';summary='Không tìm được phòng LIVE từ các nguồn tra cứu. Kiểm tra đúng @username; kết quả này không chứng minh tài khoản của bạn đã ngừng LIVE.';retryable=false;}
  else if(has('provider-format')){code='PROVIDER_FORMAT_ERROR';summary='Thư viện lỗi khi đọc thông báo từ nguồn. Chưa thể kết luận quyền truy cập hoặc kết nối LIVE thành công.';retryable=false;}
  else if(has('handshake')){code='WS_HANDSHAKE_INVALID';summary='Nguồn trả HTTP 200 thay vì nâng cấp WebSocket. Chưa có kết nối sự kiện; cần kiểm tra đường kết nối/nguồn.';retryable=false;}
  else if(has('offline')){code='ROOM_OFFLINE';summary='Nguồn trả về phòng chưa LIVE. Kiểm tra username và buổi LIVE, rồi bấm Kết nối lại.';retryable=false;}
  else if(has('username')){code='INVALID_USERNAME';summary='Username không hợp lệ. Dùng @username, không dùng tên hiển thị hoặc ID số.';retryable=false;}
  else if(has('rate-limit')){code='RATE_LIMIT';summary='Nguồn đang giới hạn lượt kết nối. Chờ hết thời gian được yêu cầu, không bấm kết nối liên tục.';}
  else if(has('permission')){code='PROVIDER_PERMISSION';summary='Một bước của nguồn yêu cầu quyền hoặc thông tin xác thực của nhà cung cấp. Không tự vượt quyền và chưa thể nhận sự kiện LIVE.';retryable=false;}
  else if(has('denied')){code='ACCESS_DENIED';summary='Yêu cầu bị từ chối (401/403 hoặc xác thực nguồn). Cần kiểm tra quyền truy cập; không phải lỗi giao diện game.';retryable=false;}
  else if(nodes.some(n=>n.networkCode==='ERR_MODULE_NOT_FOUND')){code='MISSING_DEPENDENCY';summary='Thiếu thư viện. Dừng bằng STOP rồi mở START lại để tự sửa dependencies.';retryable=false;}
  else if(has('network')){code='NETWORK_ERROR';summary='Lỗi mạng, DNS hoặc TLS khi truy cập nguồn. Không tắt kiểm tra chứng chỉ; xem mã mạng trong chi tiết.';}
  else if(has('timeout')){code='CONNECT_TIMEOUT';summary='Kết nối nguồn quá thời gian chờ; chưa nhận được luồng sự kiện.';}
  else if(has('signing')){code='SIGNING_FAILED';summary='Bước lấy chữ ký kết nối thất bại. Mã này chưa đủ để kết luận cần mua gói dịch vụ.';}
  else if(has('html')){code='ROOM_HTML_INVALID';summary='TikTok trả về nội dung không đọc được thành dữ liệu phòng LIVE. Cần kiểm tra nguồn/thư viện.';retryable=false;}
  if(has('lookup')&&has('permission'))summary+=' Nhánh dự phòng Euler cũng thiếu quyền; cấp quyền cho nhánh này không tự sửa các bước TikTok đã lỗi trước đó.';
  if(retryAfterMs>2147483647){retryable=false;summary+=' Thời gian chờ quá dài để tự thử lại; hãy thử thủ công sau thời hạn của nguồn.';}
  retryAfterMs=Math.min(2147483647,Math.max(0,Math.ceil(retryAfterMs)));
  // Remove internal tags. All strings below belong to fixed allowlists.
  const details=nodes.map(({tags,...rest})=>rest);
  return {code,summary,retryable,retryAfterMs,details};
}
export function diagnosticLine(d){const fields=d.details.map(n=>[n.type,n.route,n.status?'HTTP '+n.status:null,n.networkCode].filter(Boolean).join('/')).join(' → ');return '['+d.code+'] '+d.summary+(fields?' | '+fields:'');}
