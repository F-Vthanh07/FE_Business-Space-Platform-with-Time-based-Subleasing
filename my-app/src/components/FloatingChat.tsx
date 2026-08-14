/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Minus, Send, Image as ImageIcon, ArrowLeft, BellRing, FileSignature, FileText } from 'lucide-react';
import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';
import { ContractViewModal } from './Contract/ContractViewModal';
import { ContractCreateModal } from './Contract/ContractCreateModal';
import { ExternalContractCreateModal } from './Contract/ExternalContractCreateModal';

export const FloatingChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'LIST' | 'CHAT' | 'CONTRACT_DETAIL'>('LIST');

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const [connection, setConnection] = useState<HubConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Lưu lại connection hiện tại bằng ref để dùng trong các hàm không nằm trong closure
  // của useEffect khởi tạo (vd hàm refetch được gọi từ event listener bên ngoài).
  const connectionRef = useRef<HubConnection | null>(null);

  // Theo dõi các phòng chat đã Join qua SignalR, tránh gọi JoinConversation lặp lại
  // nhiều lần cho cùng 1 phòng mỗi khi refetch danh sách.
  const joinedRoomIdsRef = useRef<Set<any>>(new Set());

  const currentUserId = localStorage.getItem('current_user_id');
  const token = localStorage.getItem('portal_token');

  const isLessor = activeChat && (String(activeChat.lessorId) === String(currentUserId) || String(activeChat.LessorId) === String(currentUserId));

  const [contractDetail, setContractDetail] = useState<any>(null);

  // Modal tạo hợp đồng (tách riêng khỏi khung chat, full screen, 2 cột form/preview)
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  
  // STATE MỚI: Dùng để lưu trữ data của hợp đồng cần sửa
  const [editingContract, setEditingContract] = useState<any>(null);

  // Thêm state cho popup chọn loại hợp đồng
  const [showContractTypeMenu, setShowContractTypeMenu] = useState(false);
  const [isExternalContractModalOpen, setIsExternalContractModalOpen] = useState(false);

  // Thêm state lưu thông tin yêu cầu thuê liên quan
  const [relatedRequests, setRelatedRequests] = useState<any[]>([]);
  const [showRequestPopup, setShowRequestPopup] = useState(false);

  // Lấy ID người đang chat cùng mình (dùng cho link tới Profile)
  const getOtherPersonId = (room: any) => {
    if (!room) return '';
    const rLessorId = room.lessorId || room.LessorId;
    const rLesseeId = room.lesseeId || room.LesseeId;
    return String(rLessorId) === String(currentUserId) ? rLesseeId : rLessorId;
  };

  // Tên hiển thị của "người kia" trong khung chat (dùng cho tiêu đề chat, avatar...).
  // Field thật từ BE là lessorUserName/lesseeUserName (xem GET /api/Conversation/User/{id}),
  // vẫn giữ thêm vài field dự phòng (lessorName/LessorName...) phòng khi BE đổi tên field.
  const getOtherPersonName = (room: any) => {
    if (!room) return 'Khách';
    
    const rLessorId = room.lessorId || room.LessorId;
    const rLesseeId = room.lesseeId || room.LesseeId;

    if (String(rLessorId) === String(currentUserId)) {
      return room.lesseeUserName || room.LesseeUserName || room.lesseeName || room.LesseeName || 'Khách thuê';
    } else if (String(rLesseeId) === String(currentUserId)) {
      return room.lessorUserName || room.LessorUserName || room.lessorName || room.LessorName || 'Chủ nhà';
    }

    return room.lesseeUserName || room.LesseeUserName ||
      room.lessorUserName || room.LessorUserName ||
      room.lesseeName || room.LesseeName ||
      room.lessorName || room.LessorName || 'Khách';
  };

  // Lấy riêng tên của TỪNG bên (không phải "người kia") để truyền vào ContractViewModal,
  // vì modal đó cần biết rõ ai là Bên cho thuê / Bên thuê, không phải chỉ "người đang chat cùng mình".
  const getContractPartyNames = (room: any) => {
    if (!room) return { lessorName: '', lesseeName: '' };
    const lessorName = room.lessorUserName || room.LessorUserName || room.lessorName || room.LessorName || '';
    const lesseeName = room.lesseeUserName || room.LesseeUserName || room.lesseeName || room.LesseeName || '';
    return { lessorName, lesseeName };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (view === 'CHAT') scrollToBottom();
  }, [chatHistory, view]);

  // HÀM DÙNG CHUNG: fetch lại danh sách phòng chat từ BE, cập nhật state,
  // và tự động Join (qua SignalR) các phòng nào chưa từng Join trước đó.
  // Được gọi cả lúc mount lần đầu VÀ mỗi khi có sự kiện 'conversation-created'
  // bắn ra từ nơi khác trong app (vd sau khi chủ nhà vừa duyệt đơn thuê).
  const fetchAndSyncConversations = async () => {
    if (!currentUserId || !token) return;
    try {
      const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Conversation/User/${currentUserId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });
      if (!res.ok) return;
      const myRooms: any[] = await res.json();
      setConversations(myRooms);

      // Cập nhật số tin nhắn chưa đọc nếu BE có hỗ trợ trả về
      const totalUnread = myRooms.reduce((sum, room) => sum + (room.unreadCount || room.UnreadCount || 0), 0);
      if (totalUnread > 0) {
        setUnreadCount(totalUnread);
      }

      const activeConnection = connectionRef.current;
      if (activeConnection) {
        for (const room of myRooms) {
          const roomId = room.id || room.Id;
          if (!joinedRoomIdsRef.current.has(roomId)) {
            try {
              await activeConnection.invoke("JoinConversation", roomId);
              joinedRoomIdsRef.current.add(roomId);
            } catch (err) {
              console.error("Lỗi Join phòng chat mới:", err);
            }
          }
        }
      }
      return myRooms;
    } catch (error) {
      console.error("Lỗi fetch danh sách hội thoại:", error);
    }
  };

  useEffect(() => {
    if (!currentUserId || !token) return;
    let globalConnection: HubConnection;
    const initGlobalChat = async () => {
      try {
        const myRooms = (await fetchAndSyncConversations()) || [];

        globalConnection = new HubConnectionBuilder()
          .withUrl("https://flexi-space-capstone-project.onrender.com/chatHub", { accessTokenFactory: () => token || "" })
          .configureLogging(LogLevel.Information)
          .withAutomaticReconnect()
          .build();

        globalConnection.on("ReceiveNewMessage", (savedMessage: any) => {
          if (typeof savedMessage === 'string') return;
          const incomingRoomId = savedMessage.conversationId;
          const isMyOwnMessage = String(savedMessage.senderId) === String(currentUserId);

          setActiveChat((currentActive: any) => {
            if (currentActive && (currentActive.id === incomingRoomId || currentActive.conversationId === incomingRoomId)) {
              setChatHistory(prev => {
                if (prev.some(m => m.id === savedMessage.id)) return prev;
                return [...prev, {
                  id: savedMessage.id || Date.now(),
                  senderId: savedMessage.senderId,
                  text: savedMessage.content || savedMessage.message,
                  time: new Date(savedMessage.createdAt || new Date()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                  isRead: false
                }];
              });
            } else { if (!isMyOwnMessage) setUnreadCount(prev => prev + 1); }
            return currentActive;
          });

          if (!isMyOwnMessage) {
            const roomInfo = myRooms.find(r => r.id === incomingRoomId || r.Id === incomingRoomId);
            const senderDisplayName = roomInfo ? getOtherPersonName(roomInfo) : (savedMessage.senderName || 'Khách');
            const event = new CustomEvent('new-notification', {
              detail: { id: savedMessage.id || Date.now(), conversationId: incomingRoomId, senderName: senderDisplayName, message: savedMessage.content || savedMessage.message, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }
            });
            window.dispatchEvent(event);
          }
        });

        // BẮT SỰ KIỆN NÀY NẾU/KHI BACKEND HỖ TRỢ: khi chủ nhà duyệt đơn ở 1 máy khác,
        // BE có thể đẩy trực tiếp qua SignalR cho bên Khách thuê (lessee) biết vừa có
        // phòng chat mới, thay vì phải chờ họ F5 lại trang. Hiện BE CHƯA emit event này,
        // đây là chỗ FE đã chờ sẵn để khi BE bổ sung thì chỉ cần đúng tên event là chạy được luôn.
        globalConnection.on("ReceiveNewConversation", () => {
          fetchAndSyncConversations();
        });

        await globalConnection.start();
        for (const room of myRooms) {
          const roomId = room.id || room.Id;
          await globalConnection.invoke("JoinConversation", roomId);
          joinedRoomIdsRef.current.add(roomId);
        }
        connectionRef.current = globalConnection;
        setConnection(globalConnection);
      } catch (error) { console.error(error); }
    };
    initGlobalChat();
    return () => {
      if (globalConnection) globalConnection.stop();
      connectionRef.current = null;
      joinedRoomIdsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, token]);

  // LẮNG NGHE SỰ KIỆN 'conversation-created': bắn ra ngay sau khi chủ nhà (lessor)
  // duyệt đơn thuê và tạo phòng chat thành công (xem OwnerBookingRequests.tsx).
  // LƯU Ý QUAN TRỌNG: sự kiện này chỉ chạy được TRONG ĐÚNG TAB đang thao tác (tab của
  // chủ nhà vừa bấm Duyệt). Nó KHÔNG thể "đi" sang tab/trình duyệt khác của khách thuê -
  // nên chỉ giúp chủ nhà thấy phòng chat ngay lập tức, không giúp được khách thuê.
  useEffect(() => {
    const handleConversationCreated = () => {
      fetchAndSyncConversations();
    };
    window.addEventListener('conversation-created', handleConversationCreated);
    return () => window.removeEventListener('conversation-created', handleConversationCreated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đã gỡ bỏ polling tự động tải lại danh sách chat theo yêu cầu.
  // Danh sách chat sẽ chỉ được làm mới khi:
  // 1. Mở trang web (chạy lần đầu).
  // 2. Nhận được event SignalR "ReceiveNewConversation" từ BE (nếu BE đã làm).
  // 3. Có sự kiện 'conversation-created' nội bộ ở FE.

  useEffect(() => {
    const handleOpenChatEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) openChatRoom(customEvent.detail);
    };
    window.addEventListener('open-ether-chat', handleOpenChatEvent);
    return () => window.removeEventListener('open-ether-chat', handleOpenChatEvent);
  }, [connection]);

  // FETCH THÔNG TIN YÊU CẦU THUÊ LIÊN QUAN KHI MỞ CHAT
  useEffect(() => {
    if (activeChat && view === 'CHAT') {
      const fetchReqs = async () => {
        try {
          const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/PrimaryBookingRequest/GetAll`, {
            headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
          });
          if (res.ok) {
            const data = await res.json();
            const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);
            const otherId = getOtherPersonId(activeChat);
            const reqs = safeData.filter((r: any) => 
              (String(r.lessorId) === String(currentUserId) && String(r.lesseeId) === String(otherId)) ||
              (String(r.lessorId) === String(otherId) && String(r.lesseeId) === String(currentUserId))
            );
            setRelatedRequests(reqs);
          }
        } catch(e) {}
      };
      fetchReqs();
    }
  }, [activeChat, view, currentUserId, token]);

  const openChatRoom = async (roomData: any) => {
    setActiveChat(roomData);
    setView('CHAT');
    setIsOpen(true);
    setChatHistory([]);
    setUnreadCount(0);

    const roomId = roomData.conversationId || roomData.id || roomData.Id;
    if (connection) connection.invoke("JoinConversation", roomId).catch(err => console.log(err));

    try {
      const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Message/GetMessageHistory?conversationId=${roomId}&limit=50`, { headers: { 'Authorization': `Bearer ${token}` }});
      if (res.ok) {
        const historyData = await res.json();
        const mappedHistory = historyData.map((msg: any) => ({
          id: msg.id, senderId: msg.senderId, text: msg.content || msg.message || '', time: new Date(msg.createdAt || msg.sentAt || new Date()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          isRead: msg.isRead || msg.IsRead || false
        }));
        setChatHistory(mappedHistory);
      }
    } catch (err) { console.error(err); }
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || message;
    const roomId = activeChat?.conversationId || activeChat?.id || activeChat?.Id;
    if (!textToSend.trim() || !connection || !roomId) return;
    setMessage('');
    try { await connection.invoke("SendMessageToGroup", roomId, textToSend); }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (err) { alert("Lỗi khi gửi tin nhắn!"); }
  };

  const openContractDetail = async (contractId: string) => {
  setView('CONTRACT_DETAIL');
  setContractDetail(null);
  try {
    const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Contract/GetById/${contractId}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
    });
    if (res.ok) {
      const data = await res.json();
      setContractDetail(data);
    } else {
      // Hợp đồng không còn tồn tại (đã bị thu hồi/xóa) hoặc lỗi từ BE
      alert('Hợp đồng này không còn tồn tại hoặc đã bị thu hồi.');
      setView('CHAT');
    }
  } catch (err) {
    console.error("Lỗi lấy chi tiết Hợp đồng:", err);
    alert('Không thể tải chi tiết hợp đồng. Vui lòng thử lại.');
    setView('CHAT');
  }
  };

  // --- HÀM XỬ LÝ KHI BẤM NÚT "CHỈNH SỬA" ---
  const handleEditContract = (contractData: any) => {
    setEditingContract(contractData); // Nạp data cũ
    setIsContractModalOpen(true);     // Mở form Create (giờ sẽ đóng vai trò là form Edit)
    setView('CHAT');                  // Đóng pop-up View đi
  };

  // --- HÀM XỬ LÝ KHI BẤM NÚT "THU HỒI" ---
  const handleDeleteContract = async (contractId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn thu hồi và hủy bỏ hợp đồng này?')) return;
    
    try {
      const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Contract/Delete/${contractId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });

      if (res.ok) {
        alert('Đã thu hồi hợp đồng thành công!');
        // Tự động nhắn 1 tin báo cho khách biết
        handleSendMessage(undefined, `❌ Tôi đã thu hồi Hợp đồng (Mã: #${contractId}). Xin lỗi vì sự bất tiện này.`);
        setView('CHAT');
      } else {
        throw new Error('Thu hồi thất bại. Có thể hợp đồng đã được ký hoặc không tồn tại.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Lỗi kết nối đến máy chủ.');
    }
  };

  // Quét toàn bộ chatHistory để tìm các hợp đồng đã bị thu hồi
  const getRevokedContractIds = () => {
    const revokedIds = new Set<string>();
    chatHistory.forEach((msg) => {
      if (msg.text?.includes('❌') && msg.text?.includes('thu hồi')) {
        const m = msg.text.match(/Mã:\s*#(\d+)/i);
        if (m && m[1]) revokedIds.add(m[1]);
      }
    });
    return revokedIds;
  };

  const renderMessageContent = (text: string) => {
    const isRevokedMessage = text.includes('❌') && text.includes('thu hồi');
    if (isRevokedMessage) {
      return <>{text}</>;
    }

    const contractRegex = /Hợp đồng \(Mã: #(\d+)\)/i;
    const match = text.match(contractRegex);

    if (match && match[1]) {
      const cId = match[1];
      const revokedIds = getRevokedContractIds();
      const isThisContractRevoked = revokedIds.has(cId);

      return (
        <div>
          <span>{text}</span>
          <div style={{ marginTop: '8px' }}>
            {isThisContractRevoked ? (
              <span style={{ fontSize: '12px', color: '#EF4444', fontStyle: 'italic' }}>
                Hợp đồng này đã bị thu hồi
              </span>
            ) : (
              <button
                onClick={() => openContractDetail(cId)}
                style={{ padding: '6px 12px', backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <FileText size={14} /> Xem Hợp Đồng
              </button>
            )}
          </div>
        </div>
      );
    }
    return <>{text}</>;
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontFamily: 'system-ui, sans-serif' }}>

      {/* KHAI BÁO CSS NỘI BỘ CHO PHẦN GIAO DIỆN PREMIUM */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #CBD5E1;
            border-radius: 10px;
          }
        `}
      </style>

      {isOpen && (
        <div style={{ width: '360px', height: '520px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', marginBottom: '12px', border: '1px solid #E0E0E0' }}>

          {/* MÀN HÌNH 1: LIST INBOX */}
          {view === 'LIST' && (
            <>
              <div style={{ backgroundColor: '#1E293B', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Tin nhắn của bạn</div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}><Minus size={20} /></button>
              </div>
              <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fff' }}>
                {conversations.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '13px' }}>Chưa có cuộc trò chuyện nào.</div>
                ) : (
                  conversations.map((room, idx) => {
                    const displayName = getOtherPersonName(room);
                    return (
                      <div key={idx} onClick={() => openChatRoom(room)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F0F0F0', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div onClick={(e) => { e.stopPropagation(); window.open(`http://localhost:5173/profile/${getOtherPersonId(room)}`, '_blank'); }} style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#E4E6EB', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{displayName.substring(0, 2).toUpperCase()}</div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: (room.unreadCount || room.UnreadCount) > 0 ? '#1E293B' : '#2C2C2C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {displayName}
                          </div>
                          <div style={{ fontSize: '12px', color: (room.unreadCount || room.UnreadCount) > 0 ? '#ef4444' : '#777', fontWeight: (room.unreadCount || room.UnreadCount) > 0 ? 'bold' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(room.unreadCount || room.UnreadCount) > 0 ? `(${room.unreadCount || room.UnreadCount} tin nhắn mới)` : 'Nhấp để xem tin nhắn...'}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}

          {/* MÀN HÌNH 2: CHAT */}
          {view === 'CHAT' && activeChat && (
            <>
              <div style={{ backgroundColor: '#1E293B', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => setView('LIST')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}><ArrowLeft size={20} /></button>
                  <div onClick={() => window.open(`http://localhost:5173/profile/${getOtherPersonId(activeChat)}`, '_blank')} style={{ cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fff', color: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                    {getOtherPersonName(activeChat).substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', lineHeight: '1.2' }}>{getOtherPersonName(activeChat)}</div>
                    <div style={{ fontSize: '11px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4ADE80', display: 'inline-block' }}></span> {connection ? "Đã kết nối" : "Đang kết nối..."}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={() => setShowRequestPopup(!showRequestPopup)} title="Thông tin yêu cầu thuê" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                    <FileText size={16} />
                  </button>
                  {isLessor && (
                    <div style={{ position: 'relative' }}>
                      <button 
                        onClick={() => setShowContractTypeMenu(!showContractTypeMenu)} 
                        title="Tạo Hợp Đồng" 
                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                        <FileSignature size={16} />
                      </button>
                      
                      {showContractTypeMenu && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '8px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50, width: '180px', overflow: 'hidden' }}>
                          <button 
                            onClick={() => { setIsContractModalOpen(true); setShowContractTypeMenu(false); }}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid #F0F0F0', color: '#1E293B', cursor: 'pointer', fontSize: '13px' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            Tạo hợp đồng online
                          </button>
                          <button 
                            onClick={() => { setIsExternalContractModalOpen(true); setShowContractTypeMenu(false); }}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', color: '#1E293B', cursor: 'pointer', fontSize: '13px' }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            Tải ảnh hợp đồng lên
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
                </div>
              </div>

              {/* POPUP THÔNG TIN YÊU CẦU THUÊ */}
              {showRequestPopup && (
                <div style={{ padding: '10px 14px', backgroundColor: '#F0F9FF', borderBottom: '1px solid #E0F2FE', fontSize: '12px', color: '#0369A1' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Thông tin Yêu cầu thuê:</div>
                  {relatedRequests.length === 0 ? (
                    <div>Không tìm thấy yêu cầu thuê liên quan.</div>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                      {relatedRequests.map(req => (
                        <li key={req.id || req.Id} style={{ marginBottom: '4px' }}>
                          Mã Yêu Cầu: <strong>#{req.id || req.Id}</strong> - Thuê từ: {req.rentalStartDate ? new Date(req.rentalStartDate).toLocaleDateString('vi-VN') : '?'} đến {req.rentalEndDate ? new Date(req.rentalEndDate).toLocaleDateString('vi-VN') : '?'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="custom-scrollbar" style={{ flex: 1, padding: '14px', overflowY: 'auto', backgroundColor: '#F8F9FA', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {chatHistory.map((msg) => {
                  const isMe = String(msg.senderId) === String(currentUserId);
                  const senderName = isMe ? 'Bạn' : getOtherPersonName(activeChat);

                  const isSystemMsg = msg.text && (
                    msg.text.includes('Chủ mặt bằng đã xác nhận hợp đồng') ||
                    msg.text.includes('Khách thuê đã ký') ||
                    msg.text.includes('thu hồi Hợp đồng') ||
                    msg.text.includes('vừa tạo và gửi một Hợp đồng') ||
                    msg.text.includes('vừa cập nhật Hợp đồng')
                  );

                  if (isSystemMsg) {
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '12px 0', width: '100%' }}>
                        <div style={{ backgroundColor: '#F1F5F9', padding: '8px 16px', borderRadius: '16px', fontSize: '11.5px', color: '#475569', textAlign: 'center', maxWidth: '85%', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          {renderMessageContent(msg.text)}
                          <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>{msg.time}</div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px', padding: '0 4px' }}>{senderName}</span>
                      <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', backgroundColor: isMe ? '#1E293B' : '#fff', color: isMe ? '#fff' : '#2D3748', fontSize: '13.5px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', lineHeight: '1.4', border: isMe ? 'none' : '1px solid #EDF2F7', wordBreak: 'break-word' }}>
                        {renderMessageContent(msg.text)}
                      </div>
                      <span style={{ fontSize: '10px', color: '#A0AEC0', marginTop: '3px', padding: '0 4px' }}>
                        {msg.time}
                        {isMe && msg.isRead && <span style={{ marginLeft: '6px', color: '#4ADE80', fontWeight: 'bold' }}>✓ Đã xem</span>}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={(e) => handleSendMessage(e)} style={{ padding: '10px 12px', borderTop: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff' }}>
                <input type="text" placeholder="Nhập tin nhắn..." value={message} onChange={(e) => setMessage(e.target.value)} disabled={!connection} style={{ flex: 1, padding: '8px 14px', borderRadius: '20px', border: 'none', backgroundColor: '#EDF2F7', outline: 'none', fontSize: '13.5px', color: '#2D3748' }} />
                <button type="submit" disabled={!connection} style={{ background: 'none', border: 'none', color: message.trim() ? '#1E293B' : '#A0AEC0', cursor: 'pointer', padding: '4px' }}><Send size={18} /></button>
              </form>
            </>
          )}

          {/* MÀN HÌNH 3: XEM CHI TIẾT & KÝ HỢP ĐỒNG */}
          {view === 'CONTRACT_DETAIL' && (
            <ContractViewModal
              contract={contractDetail}
              onClose={() => setView('CHAT')}
              
              /* TRUYỀN 3 PROPS NÀY VÀO ĐỂ CONTRACT VIEW HIỂN THỊ NÚT SỬA/XÓA */
              isLessor={isLessor}
              onEdit={() => handleEditContract(contractDetail)}
              onDelete={() => handleDeleteContract(contractDetail.id)}

              /* TÊN THẬT CỦA 2 BÊN - LẤY TỪ activeChat (chính là hội thoại đã tạo ra hợp đồng này) */
              lessorName={getContractPartyNames(activeChat).lessorName}
              lesseeName={getContractPartyNames(activeChat).lesseeName}
            />
          )}

        </div>
      )}

      {!isOpen && (
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setView('LIST'); setIsOpen(true); setUnreadCount(0); }} style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#1E293B', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}>
            <MessageCircle size={28} />
          </button>
          {unreadCount > 0 && (
            <div style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: '#fff', fontSize: '12px', fontWeight: 'bold', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              <BellRing size={12} style={{ marginRight: '1px' }} />
            </div>
          )}
        </div>
      )}

      {/* MODAL TẠO & SỬA HỢP ĐỒNG */}
      <ContractCreateModal
        isOpen={isContractModalOpen}
        onClose={() => {
          setIsContractModalOpen(false);
          setEditingContract(null); // Reset cục data để lần sau mở form trống
        }}
        activeChat={activeChat}
        token={token}
        onCreated={(msg) => handleSendMessage(undefined, msg)}
        
        /* TRUYỀN CỤC DATA CŨ VÀO ĐỂ FORM TỰ BIẾT ĐÂY LÀ CHẾ ĐỘ CHỈNH SỬA */
        existingContract={editingContract} 
      />

      {/* MODAL TẠO HỢP ĐỒNG NGOẠI (TẢI ẢNH) */}
      {isExternalContractModalOpen && (
        <ExternalContractCreateModal
          isOpen={isExternalContractModalOpen}
          onClose={() => setIsExternalContractModalOpen(false)}
          activeChat={activeChat}
          token={token}
          onCreated={(msg) => handleSendMessage(undefined, msg)}
        />
      )}
    </div>
  );
};