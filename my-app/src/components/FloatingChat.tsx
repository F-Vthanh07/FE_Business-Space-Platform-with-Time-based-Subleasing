/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Minus, Send, Image as ImageIcon, ArrowLeft, BellRing, FileSignature } from 'lucide-react';
import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';

export const FloatingChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Thêm màn hình CONTRACT vào view
  const [view, setView] = useState<'LIST' | 'CHAT' | 'CONTRACT'>('LIST'); 
  
  const [conversations, setConversations] = useState<any[]>([]); 
  const [activeChat, setActiveChat] = useState<any | null>(null); 
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0); 

  const [connection, setConnection] = useState<HubConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentUserId = localStorage.getItem('current_user_id');
  const token = localStorage.getItem('portal_token');

  const isLessor = activeChat && (activeChat.lessorId === currentUserId || activeChat.LessorId === currentUserId);

  // ================================================================
  // STATE CHO FORM TẠO HỢP ĐỒNG
  // ================================================================
  const [isCreatingContract, setIsCreatingContract] = useState(false);
  const [mySpaces, setMySpaces] = useState<any[]>([]);

  // Danh sách các Booking Request khớp giữa 2 người (lessor <-> lessee) của conversation hiện tại
  const [matchedBookingRequests, setMatchedBookingRequests] = useState<any[]>([]);
  const [isLoadingBookingRequests, setIsLoadingBookingRequests] = useState(false);

  const [contractData, setContractData] = useState({
    spaceId: '',
    primaryBookingRequestId: 0,
    durationUnit: 'Days',
    duration: 1,
    startDate: new Date().toISOString().split('T')[0],
    acreage: 0,
    price: 0,
    depositAmount: 0,
    description: '',
    contractSchedules: [
      { dayOfWeek: 'Monday', startTime: '08:00', endTime: '22:00' }
    ]
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (view === 'CHAT') scrollToBottom();
  }, [chatHistory, view]);

  // TỰ ĐỘNG TẢI DANH SÁCH MẶT BẰNG CỦA CHỦ NHÀ KHI MỞ FORM TẠO HỢP ĐỒNG
  useEffect(() => {
    if (view === 'CONTRACT' && isLessor && currentUserId) {
      const fetchMySpaces = async () => {
        try {
          const res = await fetch(`https://localhost:7069/api/Space/GetAll?OwnerId=${currentUserId}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
          });
          if (res.ok) {
            const data = await res.json();
            const safeData = Array.isArray(data) ? data : (data?.data || data?.items || []);
            setMySpaces(safeData);
          }
        } catch (err) {
          console.error("Lỗi lấy danh sách mặt bằng:", err);
        }
      };
      fetchMySpaces();
    }
  }, [view, isLessor, currentUserId, token]);

  // ================================================================
  // TÌM CÁC BOOKING REQUEST KHỚP VỚI CUỘC TRÒ CHUYỆN HIỆN TẠI
  // (PrimaryBookingRequest chưa lưu conversationId, nên phải lọc theo
  //  lessorId + lesseeId lấy từ activeChat)
  // ================================================================
  useEffect(() => {
    if (view === 'CONTRACT' && isLessor && activeChat) {
      const fetchMatchedRequests = async () => {
        setIsLoadingBookingRequests(true);
        try {
          const lesseeId = activeChat.lesseeId || activeChat.LesseeId;
          const lessorId = activeChat.lessorId || activeChat.LessorId;

          // Enum status bên BE: Pending, Approved (đã xác nhận từ Swagger)
          // Request đủ điều kiện tạo hợp đồng là khi chủ nhà đã đồng ý -> Approved
          const statusesToCheck = ['Approved'];
          const responses = await Promise.all(
            statusesToCheck.map(status =>
              fetch(`https://localhost:7069/api/PrimaryBookingRequest/GetAll?status=${status}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
              })
                .then(res => (res.ok ? res.json() : []))
                .catch(() => [])
            )
          );

          const allRequests = responses.flatMap((data: any) =>
            Array.isArray(data) ? data : (data?.data || data?.items || [])
          );

          const matched = allRequests.filter((r: any) =>
            r.lessorId === lessorId && r.lesseeId === lesseeId
          );

          setMatchedBookingRequests(matched);

          // Nếu chỉ có đúng 1 request khớp -> auto điền luôn cho tiện
          if (matched.length === 1) {
            const only = matched[0];
            setContractData(prev => ({
              ...prev,
              primaryBookingRequestId: only.id,
              spaceId: only.spaceId ? String(only.spaceId) : prev.spaceId,
              price: only.offeredPrice ?? prev.price,
              duration: only.duration ?? prev.duration,
            }));
          }
        } catch (err) {
          console.error("Lỗi lấy booking request khớp:", err);
        } finally {
          setIsLoadingBookingRequests(false);
        }
      };
      fetchMatchedRequests();
    }
  }, [view, isLessor, activeChat, token]);

  // ================================================================
  // 1. KẾT NỐI SIGNALR & LẤY DANH SÁCH PHÒNG
  // ================================================================
  useEffect(() => {
    if (!currentUserId || !token) return;
    let globalConnection: HubConnection;

    const initGlobalChat = async () => {
      try {
        const res = await fetch(`https://localhost:7069/api/Conversation/User/${currentUserId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
        });
        
        let myRooms: any[] = [];
        if (res.ok) {
          myRooms = await res.json();
          setConversations(myRooms);
        }

        globalConnection = new HubConnectionBuilder()
          .withUrl("https://localhost:7069/chatHub", { accessTokenFactory: () => token || "" })
          .configureLogging(LogLevel.Information)
          .withAutomaticReconnect()
          .build();

        globalConnection.on("ReceiveNewMessage", (savedMessage: any) => {
          if (typeof savedMessage === 'string') return; 

          const incomingRoomId = savedMessage.conversationId;
          const isMyOwnMessage = savedMessage.senderId === currentUserId;
          
          setActiveChat((currentActive: { id: any; conversationId: any; }) => {
            if (currentActive && (currentActive.id === incomingRoomId || currentActive.conversationId === incomingRoomId)) {
              setChatHistory(prev => {
                if (prev.some(m => m.id === savedMessage.id)) return prev;
                return [...prev, {
                  id: savedMessage.id || Date.now(),
                  senderId: savedMessage.senderId,
                  text: savedMessage.content || savedMessage.message,
                  time: new Date(savedMessage.createdAt || new Date()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                }];
              });
            } else {
              if (!isMyOwnMessage) setUnreadCount(prev => prev + 1);
            }
            return currentActive;
          });

          if (!isMyOwnMessage) {
            let senderDisplayName = savedMessage.senderName || 'Khách';
            const roomInfo = myRooms.find(r => r.id === incomingRoomId || r.Id === incomingRoomId);
            if (roomInfo) {
               senderDisplayName = roomInfo.lessorName || roomInfo.lesseeName || senderDisplayName;
            }

            const event = new CustomEvent('new-notification', {
              detail: {
                id: savedMessage.id || Date.now(),
                conversationId: incomingRoomId,
                senderName: senderDisplayName,
                message: savedMessage.content || savedMessage.message,
                time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              }
            });
            window.dispatchEvent(event);
          }
        });

        await globalConnection.start();
        for (const room of myRooms) {
          await globalConnection.invoke("JoinConversation", room.id || room.Id);
        }
        setConnection(globalConnection);
      } catch (error) {
        console.error("Lỗi khởi tạo hệ thống Chat ngầm:", error);
      }
    };
    initGlobalChat();
    return () => { if (globalConnection) globalConnection.stop(); };
  }, [currentUserId, token]);

  // ================================================================
  // 2. MỞ HỘP CHAT
  // ================================================================
  useEffect(() => {
    const handleOpenChatEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) openChatRoom(customEvent.detail);
    };
    window.addEventListener('open-ether-chat', handleOpenChatEvent);
    return () => window.removeEventListener('open-ether-chat', handleOpenChatEvent);
  }, [connection]);

  const openChatRoom = async (roomData: any) => {
    setActiveChat(roomData);
    setView('CHAT');
    setIsOpen(true);
    setChatHistory([]);
    setUnreadCount(0); 

    const roomId = roomData.conversationId || roomData.id || roomData.Id;
    if (connection) {
      connection.invoke("JoinConversation", roomId).catch(err => console.log("Lỗi join phòng mới:", err));
    }

    try {
      const res = await fetch(`https://localhost:7069/api/Message/GetMessageHistory?conversationId=${roomId}&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const historyData = await res.json();
        const mappedHistory = historyData.map((msg: any) => ({
          id: msg.id,
          senderId: msg.senderId,
          text: msg.content || msg.message || '',
          time: new Date(msg.createdAt || msg.sentAt || new Date()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }));
        setChatHistory(mappedHistory); 
      }
    } catch (err) {
      console.error("Lỗi lấy lịch sử:", err);
    }
  };

  // ================================================================
  // 3. GỬI TIN NHẮN
  // ================================================================
  const handleSendMessage = async (e: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || message;
    const roomId = activeChat?.conversationId || activeChat?.id || activeChat?.Id;
    if (!textToSend.trim() || !connection || !roomId) return;
    
    setMessage(''); 
    try {
      await connection.invoke("SendMessageToGroup", roomId, textToSend);
    } catch (err) {
      console.error("Lỗi gửi tin nhắn: ", err);
      alert("Lỗi khi gửi tin nhắn!");
    }
  };

  // ================================================================
  // 4. LUỒNG TẠO VÀ SHARE HỢP ĐỒNG (THEO SWAGGER API)
  // ================================================================
  const handleCreateAndShareContract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contractData.primaryBookingRequestId) {
      alert('Vui lòng chọn yêu cầu đặt thuê liên quan trước khi tạo hợp đồng!');
      return;
    }

    setIsCreatingContract(true);
    const roomId = activeChat?.conversationId || activeChat?.id || activeChat?.Id;

    try {
      // BƯỚC 1: Tạo Hợp Đồng
      const createPayload = {
        conversationId: roomId,
        spaceId: Number(contractData.spaceId) || 0,
        primaryBookingRequestId: Number(contractData.primaryBookingRequestId) || 0,
        durationUnit: contractData.durationUnit,
        duration: Number(contractData.duration),
        startDate: new Date(contractData.startDate).toISOString(),
        acreage: Number(contractData.acreage),
        price: Number(contractData.price),
        depositAmount: Number(contractData.depositAmount),
        description: contractData.description,
        contractSchedules: contractData.contractSchedules
      };

      const createRes = await fetch('https://localhost:7069/api/Contract/Create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createPayload)
      });

      if (!createRes.ok) throw new Error('Lỗi khi tạo hợp đồng (Create)');
      const createdContract = await createRes.json();
      // BE thường trả về object có chứa ID vừa tạo
      const newContractId = createdContract.id || createdContract.Id; 

      if (newContractId) {
        // BƯỚC 2: Share Hợp Đồng cho người thuê
        const shareRes = await fetch(`https://localhost:7069/api/Contract/${newContractId}/share`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*'
          }
        });

        if (!shareRes.ok) throw new Error('Lỗi khi share hợp đồng');

        // BƯỚC 3: Gửi tin nhắn tự động báo cho người thuê biết
        await handleSendMessage(e, `📄 Tôi vừa tạo và gửi một Hợp đồng (Mã: #${newContractId}). Vui lòng kiểm tra và xác nhận nhé!`);
        
        alert('Tạo và gửi hợp đồng thành công!');
        setView('CHAT'); // Quay lại màn hình chat
      } else {
        throw new Error('Không nhận được ID hợp đồng từ Backend');
      }

    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Có lỗi xảy ra khi tạo hợp đồng!');
    } finally {
      setIsCreatingContract(false);
    }
  };


  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontFamily: 'system-ui, sans-serif' }}>
      {isOpen && (
        <div style={{ width: '360px', height: '520px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', marginBottom: '12px', border: '1px solid #E0E0E0' }}>
          
          {/* MÀN HÌNH 1: LIST INBOX */}
          {view === 'LIST' && (
            <>
              <div style={{ backgroundColor: '#1E293B', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Tin nhắn của bạn</div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}><Minus size={20} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fff' }}>
                {conversations.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '13px' }}>Chưa có cuộc trò chuyện nào.</div>
                ) : (
                  conversations.map((room, idx) => {
                    const displayName = room.lessorId === currentUserId ? (room.lesseeName || 'Người thuê') : (room.lessorName || 'Chủ nhà');
                    return (
                      <div key={idx} onClick={() => openChatRoom(room)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F0F0F0', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#E4E6EB', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{displayName.substring(0, 2).toUpperCase()}</div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#2C2C2C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
                          <div style={{ fontSize: '12px', color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Nhấp để xem tin nhắn...</div>
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
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fff', color: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                    {(activeChat.lessorId === currentUserId ? (activeChat.lesseeName || 'KH') : (activeChat.lessorName || 'CH')).substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', lineHeight: '1.2' }}>
                      {activeChat.lessorId === currentUserId ? (activeChat.lesseeName || 'Khách Thuê') : (activeChat.lessorName || 'Chủ nhà')}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4ADE80', display: 'inline-block' }}></span> {connection ? "Đã kết nối" : "Đang kết nối..."}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* NÚT TẠO HỢP ĐỒNG CHỈ DÀNH CHO CHỦ NHÀ */}
                  {isLessor && (
                    <button onClick={() => setView('CONTRACT')} title="Tạo Hợp Đồng" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                      <FileSignature size={16} />
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
                </div>
              </div>

              <div style={{ flex: 1, padding: '14px', overflowY: 'auto', backgroundColor: '#F8F9FA', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {chatHistory.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', backgroundColor: isMe ? '#1E293B' : '#fff', color: isMe ? '#fff' : '#2D3748', fontSize: '13.5px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', lineHeight: '1.4', border: isMe ? 'none' : '1px solid #EDF2F7', wordBreak: 'break-word' }}>
                        {msg.text}
                      </div>
                      <span style={{ fontSize: '10px', color: '#A0AEC0', marginTop: '3px', padding: '0 4px' }}>{msg.time}</span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={(e) => handleSendMessage(e)} style={{ padding: '10px 12px', borderTop: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff' }}>
                <button type="button" style={{ background: 'none', border: 'none', color: '#A0AEC0', cursor: 'pointer', padding: '4px' }}><ImageIcon size={18} /></button>
                <input type="text" placeholder="Nhập tin nhắn..." value={message} onChange={(e) => setMessage(e.target.value)} disabled={!connection} style={{ flex: 1, padding: '8px 14px', borderRadius: '20px', border: 'none', backgroundColor: '#EDF2F7', outline: 'none', fontSize: '13.5px', color: '#2D3748' }} />
                <button type="submit" disabled={!connection} style={{ background: 'none', border: 'none', color: message.trim() ? '#1E293B' : '#A0AEC0', cursor: 'pointer', padding: '4px' }}><Send size={18} /></button>
              </form>
            </>
          )}

          {/* MÀN HÌNH 3: FORM TẠO HỢP ĐỒNG (CHỈ CHỦ NHÀ) */}
          {view === 'CONTRACT' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ backgroundColor: '#1E293B', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => setView('CHAT')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}><ArrowLeft size={20} /></button>
                  <span style={{ fontWeight: '600', fontSize: '15px' }}>Tạo Hợp Đồng Thuê</span>
                </div>
              </div>
              
              <form onSubmit={handleCreateAndShareContract} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#FAFAFA' }}>

                {/* CHỌN YÊU CẦU ĐẶT THUÊ LIÊN QUAN (BOOKING REQUEST) */}
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Yêu cầu đặt thuê liên quan</div>
                <select
                  required
                  value={contractData.primaryBookingRequestId}
                  onChange={(e) => {
                    const selectedId = Number(e.target.value);
                    const selectedReq = matchedBookingRequests.find(r => r.id === selectedId);
                    setContractData(prev => ({
                      ...prev,
                      primaryBookingRequestId: selectedId,
                      // Auto-fill các trường liên quan từ request, chủ nhà vẫn có thể chỉnh lại
                      spaceId: selectedReq?.spaceId ? String(selectedReq.spaceId) : prev.spaceId,
                      price: selectedReq?.offeredPrice ?? prev.price,
                      duration: selectedReq?.duration ?? prev.duration,
                    }));
                  }}
                  disabled={isLoadingBookingRequests}
                  style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', width: '100%', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  <option value={0} disabled>
                    {isLoadingBookingRequests ? '-- Đang tải... --' : '-- Vui lòng chọn yêu cầu đặt thuê --'}
                  </option>
                  {matchedBookingRequests.map(req => (
                    <option key={req.id} value={req.id}>
                      #{req.id} - {Number(req.offeredPrice).toLocaleString('vi-VN')}₫ - {req.purpose || 'Không ghi chú'}
                    </option>
                  ))}
                </select>
                {!isLoadingBookingRequests && matchedBookingRequests.length === 0 && (
                  <div style={{ fontSize: '12px', color: '#e53e3e' }}>
                    Không tìm thấy yêu cầu đặt thuê nào giữa hai bên. Không thể tạo hợp đồng.
                  </div>
                )}

                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Mặt bằng cho thuê</div>
                <select 
                  required 
                  value={contractData.spaceId} 
                  onChange={(e) => setContractData({...contractData, spaceId: e.target.value})} 
                  style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', width: '100%', backgroundColor: '#fff', cursor: 'pointer' }}
                >
                  <option value="" disabled>-- Vui lòng chọn mặt bằng --</option>
                  {mySpaces.map(space => (
                    <option key={space.id || space.Id} value={space.id || space.Id}>
                      {space.name} (Diện tích: {space.area}m²)
                    </option>
                  ))}
                </select>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Giá thuê (VND)</div>
                    <input type="number" required value={contractData.price} onChange={(e) => setContractData({...contractData, price: Number(e.target.value)})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Tiền cọc (VND)</div>
                    <input type="number" required value={contractData.depositAmount} onChange={(e) => setContractData({...contractData, depositAmount: Number(e.target.value)})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Thời lượng</div>
                    <input type="number" required value={contractData.duration} onChange={(e) => setContractData({...contractData, duration: Number(e.target.value)})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Đơn vị</div>
                    <select value={contractData.durationUnit} onChange={(e) => setContractData({...contractData, durationUnit: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}>
                      <option value="Days">Ngày (Days)</option>
                      <option value="Months">Tháng (Months)</option>
                      <option value="Years">Năm (Years)</option>
                    </select>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Ngày Bắt Đầu</div>
                <input type="date" required value={contractData.startDate} onChange={(e) => setContractData({...contractData, startDate: e.target.value})} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }} />
                
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Diện tích cho thuê (m2)</div>
                <input type="number" required value={contractData.acreage} onChange={(e) => setContractData({...contractData, acreage: Number(e.target.value)})} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }} />

                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Ghi chú / Mô tả</div>
                <textarea rows={3} value={contractData.description} onChange={(e) => setContractData({...contractData, description: e.target.value})} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', resize: 'none' }} />

                <button type="submit" disabled={isCreatingContract || !contractData.primaryBookingRequestId} style={{ marginTop: '12px', padding: '12px', backgroundColor: '#1E293B', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: (isCreatingContract || !contractData.primaryBookingRequestId) ? 0.6 : 1 }}>
                  {isCreatingContract ? 'Đang tạo & Gửi...' : 'Tạo & Gửi Hợp Đồng'}
                </button>
              </form>
            </div>
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
    </div>
  );
};