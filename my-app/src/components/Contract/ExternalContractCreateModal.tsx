/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X, Building2, UploadCloud, FileImage } from 'lucide-react';

interface ExternalContractCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChat: any;
  token: string | null;
  onCreated: (chatMessage: string) => Promise<void> | void;
}

const API_BASE = 'https://flexi-space-capstone-project.onrender.com';

export const ExternalContractCreateModal: React.FC<ExternalContractCreateModalProps> = ({
  isOpen,
  onClose,
  activeChat,
  token,
  onCreated,
}) => {
  const [mySpaces, setMySpaces] = useState<any[]>([]);
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({});
  const [matchedBookingRequests, setMatchedBookingRequests] = useState<any[]>([]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [canShareSpace, setCanShareSpace] = useState(false);
  
  const [contractData, setContractData] = useState<{
    spaceId: string;
    primaryBookingRequestId: number;
    canShare: boolean;
    canGrantSharePermission: boolean;
  }>({
    spaceId: '',
    primaryBookingRequestId: 0,
    canShare: false,
    canGrantSharePermission: false,
  });

  const currentUserId = localStorage.getItem('current_user_id') || '';
  const isLessor = String(activeChat?.lessorId || activeChat?.LessorId) === currentUserId;
  const otherUserId = isLessor 
    ? (activeChat?.lesseeId || activeChat?.LesseeId) 
    : (activeChat?.lessorId || activeChat?.LessorId);
  const otherUserName = isLessor 
    ? (activeChat?.lesseeUserName || activeChat?.LesseeUserName || activeChat?.lesseeName || activeChat?.LesseeName || 'Khách thuê')
    : (activeChat?.lessorUserName || activeChat?.LessorUserName || activeChat?.lessorName || activeChat?.LessorName || 'Chủ nhà');

  useEffect(() => {
    if (!isOpen) return;
    setContractData({
      spaceId: '',
      primaryBookingRequestId: 0,
      canShare: false,
      canGrantSharePermission: false,
    });
    setSelectedFiles([]);
    setCanShareSpace(false);
  }, [isOpen]);

  // Fetch Spaces
  useEffect(() => {
    if (!isOpen || !token) return;
    const fetchMySpaces = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/Space/GetAll?OwnerId=${currentUserId}`, {
          headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
        });
        let ownerSpaces: any[] = [];
        if (res.ok) {
          const data = await res.json();
          ownerSpaces = Array.isArray(data) ? data : data?.data || data?.items || [];
        }

        const resUsage = await fetch(`${API_BASE}/api/SpaceUsageRight/Mine`, {
            headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
        });
        let usageSpaces: any[] = [];
        if (resUsage.ok) {
            const usageData = await resUsage.json();
            const rights = Array.isArray(usageData) ? usageData : usageData?.data || [];
            const shareableRights = rights.filter((r: any) => r.canShare === true);
            const spacePromises = shareableRights.map((r: any) =>
                fetch(`${API_BASE}/api/Space/GetById/${r.spaceId}`, {
                    headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
                }).then(r => r.ok ? r.json() : null)
            );
            const resolvedSpaces = await Promise.all(spacePromises);
            usageSpaces = resolvedSpaces.filter(Boolean);
        }

        const allSpaces = [...ownerSpaces, ...usageSpaces];
        const uniqueSpaces = Array.from(new Map(allSpaces.map((item) => [item.id || item.Id, item])).values());
        
        setMySpaces(uniqueSpaces);

        const ownerIds = Array.from(new Set(uniqueSpaces.map(s => s.ownerId || s.OwnerId).filter(Boolean)));
        const ownerPromises = ownerIds.map(async (id: any) => {
           try {
               const resp = await fetch(`${API_BASE}/api/User/${id}`, { headers: { 'Authorization': `Bearer ${token}` }});
               if (resp.ok) {
                   const data = await resp.json();
                   return { id, name: data.profileFullName || data.userName || data.email };
               }
           } catch {}
           return { id, name: 'Unknown' };
        });
        const resolvedOwners = await Promise.all(ownerPromises);
        const ownerMap: Record<string, string> = {};
        resolvedOwners.forEach(o => { ownerMap[o.id] = o.name; });
        setOwnerNames(ownerMap);

      } catch (err) {
        console.error(err);
      }
    };
    fetchMySpaces();
  }, [isOpen, token]);

  // Fetch Booking Requests based on selected space
  useEffect(() => {
    if (!isOpen || !token || !contractData.spaceId) {
      setMatchedBookingRequests([]);
      return;
    }
    const fetchBookings = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/BookingRequest/GetAll`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data?.data || data?.items || [];
          const filtered = items.filter((b: any) => 
             String(b.spaceId || b.SpaceId) === String(contractData.spaceId) &&
             String(b.userId || b.UserId) === String(otherUserId)
          );
          setMatchedBookingRequests(filtered);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchBookings();
  }, [isOpen, token, contractData.spaceId, otherUserId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!contractData.spaceId) return alert('Vui lòng chọn mặt bằng!');
    if (selectedFiles.length === 0) return alert('Vui lòng tải lên ít nhất 1 ảnh hợp đồng!');

    setIsCreating(true);
    try {
      // 1. Tạo hợp đồng ngoại
      const payload = {
        spaceId: contractData.spaceId,
        lesseeId: otherUserId,
        conversationId: activeChat?.conversationId || activeChat?.id || activeChat?.Id,
        canShare: canShareSpace,
        canGrantSharePermission: canShareSpace,
        primaryBookingRequestId: contractData.primaryBookingRequestId || undefined
      };

      const res = await fetch(`${API_BASE}/api/ExternalContract/Create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Lỗi tạo hợp đồng ngoại');
      }

      const createdData = await res.json();
      const contractId = createdData?.data?.id || createdData?.data?.Id || createdData?.id || createdData?.Id;

      if (!contractId) {
        throw new Error('Không lấy được ID của hợp đồng vừa tạo (Check API response)');
      }

      // 2. Upload ảnh
      if (contractId) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          // Gửi kèm contractId (tuỳ theo API Picture yêu cầu tên field là gì)
          formData.append('contractId', contractId.toString());
          formData.append('externalContractId', contractId.toString());

          await fetch(`${API_BASE}/api/Picture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
        }
      }

      const spaceObj = mySpaces.find(s => String(s.id || s.Id) === String(contractData.spaceId));
      const spaceName = spaceObj?.name || spaceObj?.Name || 'Mặt bằng';
      
      const notifyMsg = `[HỢP ĐỒNG MỚI] Tôi vừa tải lên bản cứng hợp đồng cho mặt bằng "${spaceName}". Vui lòng kiểm tra "Hợp đồng tải lên" trong Dashboard để xem và xác nhận!`;
      await onCreated(notifyMsg);
      onClose();
    } catch (error: any) {
      console.error(error);
      alert('Đã xảy ra lỗi: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '600px', borderRadius: '16px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Tải ảnh hợp đồng giấy</h2>
            <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0 0' }}>Lưu trữ bản chụp hợp đồng offline</p>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Bên cho thuê (A)</div>
              <div style={{ fontWeight: '600', color: '#0F172A' }}>Bạn</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Bên thuê (B)</div>
              <div style={{ fontWeight: '600', color: '#0F172A' }}>{otherUserName}</div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
              Chọn mặt bằng <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={contractData.spaceId}
                onChange={(e) => setContractData({ ...contractData, spaceId: e.target.value })}
                style={{ width: '100%', padding: '12px 16px 12px 40px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '14px', appearance: 'none', backgroundColor: '#fff', color: '#0F172A' }}
              >
                <option value="">-- Chọn mặt bằng --</option>
                {mySpaces.map((s, idx) => {
                  const sId = String(s.id || s.Id);
                  const oId = String(s.ownerId || s.OwnerId);
                  const oName = ownerNames[oId] || 'Unknown';
                  const sName = s.name || s.Name || `Mặt bằng #${sId}`;
                  return (
                    <option key={idx} value={sId}>{sName} (Chủ: {oName})</option>
                  );
                })}
              </select>
              <Building2 size={18} color="#64748B" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          {matchedBookingRequests.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>Liên kết với Yêu cầu đặt thuê (Tùy chọn)</label>
              <select
                value={contractData.primaryBookingRequestId || ''}
                onChange={(e) => setContractData({ ...contractData, primaryBookingRequestId: Number(e.target.value) })}
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '14px', backgroundColor: '#fff' }}
              >
                <option value="">-- Không liên kết --</option>
                {matchedBookingRequests.map((b) => (
                  <option key={b.id || b.Id} value={b.id || b.Id}>
                    Yêu cầu #{b.id || b.Id} - Giá thương lượng: {b.offeredPrice?.toLocaleString('vi-VN')} VNĐ
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={canShareSpace}
                onChange={(e) => setCanShareSpace(e.target.checked)}
                style={{ width: '18px', height: '18px', marginRight: '10px', cursor: 'pointer', accentColor: '#3B82F6' }}
              />
              <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>Cho phép tạo hợp đồng dựa vào mặt bằng này</span>
            </label>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
              Tải ảnh hợp đồng lên <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '32px 24px', textAlign: 'center', backgroundColor: '#F8FAFC', transition: 'all 0.2s', cursor: 'pointer' }}>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="file-upload" />
              <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <UploadCloud size={40} color="#3B82F6" style={{ marginBottom: '12px' }} />
                <span style={{ fontWeight: '500', color: '#0F172A', marginBottom: '4px' }}>Bấm vào đây để chọn ảnh</span>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Hỗ trợ JPG, PNG</span>
              </label>
            </div>
            
            {selectedFiles.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {selectedFiles.map((file, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#F1F5F9' }}>
                      <FileImage size={24} color="#94A3B8" />
                    </div>
                    <button 
                      onClick={() => removeFile(idx)}
                      style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <X size={12} />
                    </button>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '9px', padding: '2px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#fff', color: '#334155', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={isCreating} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#3B82F6', color: '#fff', fontWeight: '600', fontSize: '14px', cursor: isCreating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: isCreating ? 0.7 : 1 }}>
            {isCreating ? 'Đang xử lý...' : 'Xác nhận tải lên'}
          </button>
        </div>
      </div>
    </div>
  );
};
