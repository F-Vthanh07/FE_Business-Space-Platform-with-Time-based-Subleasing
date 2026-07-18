/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Minus, Send, Image as ImageIcon, ArrowLeft, BellRing, FileSignature, FileText, Briefcase, Wallet, CalendarDays, Edit3 } from 'lucide-react';
import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';
import { ContractViewModal } from './ContractViewModal';

export const FloatingChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'LIST' | 'CHAT' | 'CONTRACT' | 'CONTRACT_DETAIL'>('LIST'); 
  
  const [conversations, setConversations] = useState<any[]>([]); 
  const [activeChat, setActiveChat] = useState<any | null>(null); 
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0); 

  const [connection, setConnection] = useState<HubConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentUserId = localStorage.getItem('current_user_id');
  const token = localStorage.getItem('portal_token');

  const isLessor = activeChat && (String(activeChat.lessorId) === String(currentUserId) || String(activeChat.LessorId) === String(currentUserId));

  const [contractDetail, setContractDetail] = useState<any>(null);

  const getOtherPersonName = (room: any) => {
    if (!room) return 'Khách';
    const nameFromRoom = room.lesseeName || room.LesseeName || room.lessorName || room.LessorName;
    if (nameFromRoom) return nameFromRoom;
    const rLessorId = room.lessorId || room.LessorId;
    return String(rLessorId) === String(currentUserId) ? "Khách thuê" : "Chủ nhà";
  };

  const [isCreatingContract, setIsCreatingContract] = useState(false);
  const [mySpaces, setMySpaces] = useState<any[]>([]);
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
    contractSchedules: [{ dayOfWeek: 'Monday', startTime: '08:00', endTime: '22:00' }]
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (view === 'CHAT') scrollToBottom();
  }, [chatHistory, view]);

  useEffect(() => {
    if (view === 'CONTRACT' && isLessor && currentUserId) {
      const fetchMySpaces = async () => {
        try {
          const res = await fetch(`https://localhost:7069/api/Space/GetAll?OwnerId=${currentUserId}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
          });
          if (res.ok) {
            const data = await res.json();
            setMySpaces(Array.isArray(data) ? data : (data?.data || data?.items || []));
          }
        } catch (err) { console.error(err); }
      };
      fetchMySpaces();
    }
  }, [view, isLessor, currentUserId, token]);

  useEffect(() => {
    if (view === 'CONTRACT' && isLessor && activeChat) {
      const fetchMatchedRequests = async () => {
        setIsLoadingBookingRequests(true);
        try {
          const lesseeId = activeChat.lesseeId || activeChat.LesseeId;
          const lessorId = activeChat.lessorId || activeChat.LessorId;
          const responses = await Promise.all(
            ['Approved'].map(status =>
              fetch(`https://localhost:7069/api/PrimaryBookingRequest/GetAll?status=${status}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
              }).then(res => (res.ok ? res.json() : [])).catch(() => [])
            )
          );
          const allRequests = responses.flatMap((data: any) => Array.isArray(data) ? data : (data?.data || data?.items || []));
          const matched = allRequests.filter((r: any) => String(r.lessorId) === String(lessorId) && String(r.lesseeId) === String(lesseeId));
          setMatchedBookingRequests(matched);
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
        } catch (err) { console.error(err); } finally { setIsLoadingBookingRequests(false); }
      };
      fetchMatchedRequests();
    }
  }, [view, isLessor, activeChat, token]);

  useEffect(() => {
    if (!currentUserId || !token) return;
    let globalConnection: HubConnection;
    const initGlobalChat = async () => {
      try {
        const res = await fetch(`https://localhost:7069/api/Conversation/User/${currentUserId}`, { headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }});
        let myRooms: any[] = [];
        if (res.ok) { myRooms = await res.json(); setConversations(myRooms); }

        globalConnection = new HubConnectionBuilder()
          .withUrl("https://localhost:7069/chatHub", { accessTokenFactory: () => token || "" })
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
                  time: new Date(savedMessage.createdAt || new Date()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
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
        await globalConnection.start();
        for (const room of myRooms) await globalConnection.invoke("JoinConversation", room.id || room.Id);
        setConnection(globalConnection);
      } catch (error) { console.error(error); }
    };
    initGlobalChat();
    return () => { if (globalConnection) globalConnection.stop(); };
  }, [currentUserId, token]);

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
    if (connection) connection.invoke("JoinConversation", roomId).catch(err => console.log(err));

    try {
      const res = await fetch(`https://localhost:7069/api/Message/GetMessageHistory?conversationId=${roomId}&limit=50`, { headers: { 'Authorization': `Bearer ${token}` }});
      if (res.ok) {
        const historyData = await res.json();
        const mappedHistory = historyData.map((msg: any) => ({
          id: msg.id, senderId: msg.senderId, text: msg.content || msg.message || '', time: new Date(msg.createdAt || msg.sentAt || new Date()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }));
        setChatHistory(mappedHistory); 
      }
    } catch (err) { console.error(err); }
  };

  const handleSendMessage = async (e: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || message;
    const roomId = activeChat?.conversationId || activeChat?.id || activeChat?.Id;
    if (!textToSend.trim() || !connection || !roomId) return;
    setMessage(''); 
    try { await connection.invoke("SendMessageToGroup", roomId, textToSend); } 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    catch (err) { alert("Lỗi khi gửi tin nhắn!"); }
  };

  const handleCreateAndShareContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractData.primaryBookingRequestId) return alert('Vui lòng chọn yêu cầu đặt thuê!');
    setIsCreatingContract(true);
    const roomId = activeChat?.conversationId || activeChat?.id || activeChat?.Id;

    try {
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
        contractSchedules: contractData.contractSchedules,
        lessorId: activeChat?.lessorId || activeChat?.LessorId,
        lesseeId: activeChat?.lesseeId || activeChat?.LesseeId
      };

      const createRes = await fetch('https://localhost:7069/api/Contract/Create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(createPayload)
      });

      if (!createRes.ok) throw new Error('Lỗi tạo hợp đồng');
      const createdContract = await createRes.json();
      const newContractId = createdContract.id || createdContract.Id; 

      if (newContractId) {
        const shareRes = await fetch(`https://localhost:7069/api/Contract/${newContractId}/share`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }});
        if (!shareRes.ok) throw new Error('Lỗi share hợp đồng');

        await handleSendMessage(e, `📄 Tôi vừa tạo và gửi một Hợp đồng (Mã: #${newContractId}). Vui lòng kiểm tra và xác nhận nhé!`);
        alert('Tạo hợp đồng thành công!');
        setView('CHAT'); 
      }
    } catch (error: any) { alert(error.message); } finally { setIsCreatingContract(false); }
  };

  const openContractDetail = async (contractId: string) => {
    setView('CONTRACT_DETAIL');
    setContractDetail(null); 
    try {
      const res = await fetch(`https://localhost:7069/api/Contract/GetById/${contractId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });
      if (res.ok) {
        const data = await res.json();
        setContractDetail(data);
      }
    } catch (err) {
      console.error("Lỗi lấy chi tiết Hợp đồng:", err);
    }
  };

  const renderMessageContent = (text: string) => {
    const contractRegex = /Hợp đồng \(Mã: #(\d+)\)/i;
    const match = text.match(contractRegex);

    if (match && match[1]) {
      const cId = match[1];
      return (
        <div>
          <span>{text}</span>
          <div style={{ marginTop: '8px' }}>
            <button 
              onClick={() => openContractDetail(cId)}
              style={{ padding: '6px 12px', backgroundColor: '#10B981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <FileText size={14} /> Xem Hợp Đồng
            </button>
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
          .premium-input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            background-color: #F8FAFC;
            font-size: 13px;
            color: #1E293B;
            transition: all 0.2s ease;
            outline: none;
            box-sizing: border-box;
          }
          .premium-input:focus {
            border-color: #10B981;
            background-color: #fff;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
          }
          .premium-label {
            font-size: 12.5px;
            font-weight: 600;
            color: #475569;
            display: block;
            margin-bottom: 6px;
          }
          .premium-card {
            background: #fff;
            border-radius: 10px;
            padding: 14px;
            border: 1px solid #E2E8F0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            margin-bottom: 12px;
          }
          .premium-card-header {
            font-size: 13px;
            font-weight: 700;
            color: #1E293B;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          /* Tùy chỉnh thanh cuộn cho mượt */
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
                  {isLessor && (
                    <button onClick={() => setView('CONTRACT')} title="Tạo Hợp Đồng" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                      <FileSignature size={16} />
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
                </div>
              </div>

              <div className="custom-scrollbar" style={{ flex: 1, padding: '14px', overflowY: 'auto', backgroundColor: '#F8F9FA', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {chatHistory.map((msg) => {
                  const isMe = String(msg.senderId) === String(currentUserId);
                  const senderName = isMe ? 'Bạn' : getOtherPersonName(activeChat);

                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px', padding: '0 4px' }}>{senderName}</span>
                      <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', backgroundColor: isMe ? '#1E293B' : '#fff', color: isMe ? '#fff' : '#2D3748', fontSize: '13.5px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', lineHeight: '1.4', border: isMe ? 'none' : '1px solid #EDF2F7', wordBreak: 'break-word' }}>
                        {renderMessageContent(msg.text)}
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

          {/* MÀN HÌNH 3: FORM TẠO HỢP ĐỒNG MỚI (PREMIUM UI) */}
          {view === 'CONTRACT' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#F1F5F9' }}>
              
              {/* Header */}
              <div style={{ backgroundColor: '#1E293B', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <button onClick={() => setView('CHAT')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0', display: 'flex' }}><ArrowLeft size={20} /></button>
                <span style={{ fontWeight: '700', fontSize: '16px' }}>Tạo Hợp Đồng Thuê</span>
              </div>
              
              {/* Body Form */}
              <form className="custom-scrollbar" onSubmit={handleCreateAndShareContract} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                
                {/* BLOCK 1: THÔNG TIN CHUNG */}
                <div className="premium-card">
                  <div className="premium-card-header"><Briefcase size={14} color="#64748B"/> Liên kết yêu cầu</div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <label className="premium-label">Yêu cầu đặt thuê</label>
                    <select className="premium-input" required value={contractData.primaryBookingRequestId} onChange={(e) => setContractData(prev => ({ ...prev, primaryBookingRequestId: Number(e.target.value) }))} disabled={isLoadingBookingRequests}>
                      <option value={0} disabled>{isLoadingBookingRequests ? '-- Đang tải... --' : '-- Chọn yêu cầu --'}</option>
                      {matchedBookingRequests.map(req => (
                        <option key={req.id} value={req.id}>#{req.id} - {Number(req.offeredPrice).toLocaleString('vi-VN')}₫</option>
                      ))}
                    </select>
                    {!isLoadingBookingRequests && matchedBookingRequests.length === 0 && (
                      <span style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px', display: 'block' }}>Không tìm thấy yêu cầu khớp giữa 2 bên.</span>
                    )}
                  </div>

                  <div>
                    <label className="premium-label">Mặt bằng cấp phát</label>
                    <select className="premium-input" required value={contractData.spaceId} onChange={(e) => setContractData({...contractData, spaceId: e.target.value})}>
                      <option value="" disabled>-- Chọn mặt bằng --</option>
                      {mySpaces.map(space => <option key={space.id || space.Id} value={space.id || space.Id}>{space.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* BLOCK 2: TÀI CHÍNH */}
                <div className="premium-card">
                  <div className="premium-card-header"><Wallet size={14} color="#64748B"/> Thông số Tài chính</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="premium-label">Giá thuê (VNĐ)</label>
                      <input className="premium-input" type="number" required value={contractData.price} onChange={(e) => setContractData({...contractData, price: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="premium-label">Tiền cọc (VNĐ)</label>
                      <input className="premium-input" type="number" required value={contractData.depositAmount} onChange={(e) => setContractData({...contractData, depositAmount: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>

                {/* BLOCK 3: THỜI GIAN */}
                <div className="premium-card">
                  <div className="premium-card-header"><CalendarDays size={14} color="#64748B"/> Lịch trình Thuê</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label className="premium-label">Thời lượng</label>
                      <input className="premium-input" type="number" required value={contractData.duration} onChange={(e) => setContractData({...contractData, duration: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="premium-label">Đơn vị tính</label>
                      <select className="premium-input" value={contractData.durationUnit} onChange={(e) => setContractData({...contractData, durationUnit: e.target.value})}>
                        <option value="Days">Ngày</option><option value="Months">Tháng</option><option value="Years">Năm</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="premium-label">Ngày bắt đầu</label>
                    <input className="premium-input" type="date" required value={contractData.startDate} onChange={(e) => setContractData({...contractData, startDate: e.target.value})} />
                  </div>
                </div>

                {/* BLOCK 4: CHI TIẾT KHÁC */}
                <div className="premium-card">
                  <div className="premium-card-header"><Edit3 size={14} color="#64748B"/> Bổ sung</div>
                  <div style={{ marginBottom: '12px' }}>
                    <label className="premium-label">Diện tích thực tế (m²)</label>
                    <input className="premium-input" type="number" required value={contractData.acreage} onChange={(e) => setContractData({...contractData, acreage: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="premium-label">Ghi chú điều khoản</label>
                    <textarea className="premium-input" rows={3} value={contractData.description} onChange={(e) => setContractData({...contractData, description: e.target.value})} style={{ resize: 'none' }} placeholder="Ghi chú thêm về quy định mặt bằng..." />
                  </div>
                </div>

                {/* NÚT SUBMIT */}
                <button 
                  type="submit" 
                  disabled={isCreatingContract || !contractData.primaryBookingRequestId} 
                  style={{ 
                    marginTop: '4px', 
                    marginBottom: '16px',
                    padding: '14px', 
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontWeight: 'bold', 
                    fontSize: '14px',
                    cursor: 'pointer', 
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    opacity: (isCreatingContract || !contractData.primaryBookingRequestId) ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {isCreatingContract ? 'Đang tạo & Gửi...' : 'Phát Hành Hợp Đồng'}
                </button>
              </form>
            </div>
          )}

          {/* MÀN HÌNH 4: XEM CHI TIẾT & KÝ HỢP ĐỒNG (Giữ nguyên) */}
          {view === 'CONTRACT_DETAIL' && (
            <ContractViewModal 
              contract={contractDetail} 
              onClose={() => setView('CHAT')} 
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
    </div>
  );
};