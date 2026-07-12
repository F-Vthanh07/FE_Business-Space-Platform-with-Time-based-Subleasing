/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Minus, Send } from 'lucide-react';
// IMPORT THƯ VIỆN SIGNALR VÀO ĐÂY
import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';

export const FloatingChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [activeLessor, setActiveLessor] = useState<any | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  
  // State lưu trữ kết nối đường ống SignalR
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const currentUserId = localStorage.getItem('current_user_id');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [chatHistory, isOpen]);

  // --- LẮNG NGHE SỰ KIỆN MỞ CHAT TỪ TRANG CHI TIẾT ---
  useEffect(() => {
    const handleOpenChatEvent = async (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { conversationId } = customEvent.detail;
        setActiveLessor(customEvent.detail);
        setIsOpen(true);
        setChatHistory([]); // Xóa lịch sử cũ khi mở phòng mới

        // 1. KẾT NỐI TỚI ĐƯỜNG ỐNG CHATHUB CỦA BACKEND
        const token = localStorage.getItem('portal_token');
        const newConnection = new HubConnectionBuilder()
          // Đảm bảo đường dẫn này khớp với cấu hình BE của ông (thường là /chathub)
          .withUrl("https://localhost:7069/chatHub", { 
            accessTokenFactory: () => token || "" 
          })
          .configureLogging(LogLevel.Information)
          .withAutomaticReconnect()
          .build();

        // 2. LẮNG NGHE SỰ KIỆN "ReceiveNewMessage" (Khớp với BE)
        newConnection.on("ReceiveNewMessage", (savedMessage: any) => {
          setChatHistory(prev => [...prev, {
            id: savedMessage.id || Date.now(),
            senderId: savedMessage.senderId,
            text: savedMessage.content || savedMessage.message, // Tùy BE trả về thuộc tính gì
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
          }]);
        });

        // 3. KHỞI ĐỘNG KẾT NỐI VÀ VÀO PHÒNG
        try {
          await newConnection.start();
          console.log("Đã kết nối ChatHub!");
          
          // Gọi hàm JoinConversation của C# BE
          await newConnection.invoke("JoinConversation", conversationId);
          console.log(`Đã join phòng: ${conversationId}`);
          
          setConnection(newConnection);
        } catch (err) {
          console.error("Lỗi kết nối SignalR: ", err);
        }
      }
    };

    window.addEventListener('open-ether-chat', handleOpenChatEvent);
    return () => window.removeEventListener('open-ether-chat', handleOpenChatEvent);
  }, []);

  // Hàm ngắt kết nối khi đóng Chat
  const handleCloseChat = async () => {
    if (connection && activeLessor?.conversationId) {
      try {
        await connection.invoke("LeaveConversation", activeLessor.conversationId);
        await connection.stop();
      } catch (err) {
        console.error("Lỗi khi ngắt kết nối:", err);
      }
    }
    setConnection(null);
    setIsOpen(false);
    setActiveLessor(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !connection || !activeLessor?.conversationId) return;
    
    const textToSend = message;
    setMessage(''); // Clear ô input ngay lập tức cho mượt
    
    try {
      // 4. GỌI HÀM SendMessageToGroup XUỐNG BE C#
      await connection.invoke("SendMessageToGroup", activeLessor.conversationId, textToSend);
    } catch (err) {
      console.error("Lỗi gửi tin nhắn: ", err);
      alert("Lỗi khi gửi tin nhắn!");
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontFamily: 'system-ui, sans-serif' }}>
      
      {isOpen && activeLessor && (
        <div style={{ width: '340px', height: '460px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden', marginBottom: '12px', border: '1px solid #E0E0E0' }}>
          
          {/* HEADER CHAT */}
          <div style={{ backgroundColor: '#1E293B', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#fff', color: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                {activeLessor.name?.substring(0, 2).toUpperCase() || 'CH'}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px', lineHeight: '1.2' }}>{activeLessor.name}</div>
                <div style={{ fontSize: '11px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4ADE80', display: 'inline-block' }}></span> 
                  {connection ? "Đã kết nối" : "Đang kết nối..."}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}><Minus size={18} /></button>
              <button onClick={handleCloseChat} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}><X size={18} /></button>
            </div>
          </div>

          {/* NỘI DUNG TIN NHẮN REALTIME */}
          <div style={{ flex: 1, padding: '14px', overflowY: 'auto', backgroundColor: '#F8F9FA', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {chatHistory.map((msg) => {
              // So sánh ID người gửi với ID hiện tại của mình để biết cục tin nhắn nằm bên trái hay phải
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    maxWidth: '75%', padding: '10px 14px', 
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: isMe ? '#1E293B' : '#fff', 
                    color: isMe ? '#fff' : '#2D3748',
                    fontSize: '13.5px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    lineHeight: '1.4',
                    border: isMe ? 'none' : '1px solid #EDF2F7'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '10px', color: '#A0AEC0', marginTop: '3px', padding: '0 4px' }}>{msg.time}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT TIN NHẮN */}
          <form onSubmit={handleSendMessage} style={{ padding: '10px 12px', borderTop: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff' }}>
            <input 
              type="text" 
              placeholder="Nhập tin nhắn..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!connection}
              style={{ flex: 1, padding: '8px 14px', borderRadius: '20px', border: 'none', backgroundColor: '#EDF2F7', outline: 'none', fontSize: '13.5px', color: '#2D3748' }}
            />
            <button type="submit" disabled={!connection} style={{ background: 'none', border: 'none', color: message.trim() ? '#1E293B' : '#A0AEC0', cursor: 'pointer', padding: '4px' }}>
              <Send size={18} />
            </button>
          </form>

        </div>
      )}

      {!isOpen && (
        <button 
          onClick={() => {
            if(!activeLessor) {
              setActiveLessor({ name: 'EtherSpace Bot' });
              setChatHistory([{ id: 0, senderId: 'bot', text: 'Xin chào, hãy chọn một mặt bằng và nhắn tin với chủ nhà nhé!', time: 'Vừa xong' }]);
            }
            setIsOpen(true);
          }}
          style={{ 
            width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#1E293B', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
          }}
        >
          <MessageCircle size={26} />
        </button>
      )}

    </div>
  );
};