import React, { useState, useEffect } from 'react';
import { Eye, FileCheck, FileImage, ExternalLink, Calendar, MapPin, CheckCircle2, Users } from 'lucide-react';
import './UploadedContractsPage.css'; // Sẽ tạo file css sau

const API_BASE = 'https://flexi-space-capstone-project.onrender.com';

export const UploadedContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed'>('pending');
  const [viewingContract, setViewingContract] = useState<any>(null);
  const [spaceNames, setSpaceNames] = useState<Map<string, string>>(new Map());
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());

  const token = localStorage.getItem('portal_token');
  const currentUserId = localStorage.getItem('current_user_id') || '';

  const fetchContracts = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // Fetch as Lessor and Lessee since GetAll doesn't support both at once
      const [asLessorRes, asLesseeRes] = await Promise.all([
        fetch(`${API_BASE}/api/Contract/GetAll?LessorId=${currentUserId}`, {
          headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
        }),
        fetch(`${API_BASE}/api/Contract/GetAll?LesseeId=${currentUserId}`, {
          headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
        }),
      ]);

      const dataLessor = asLessorRes.ok ? await asLessorRes.json() : [];
      const dataLessee = asLesseeRes.ok ? await asLesseeRes.json() : [];

      const asLessor = dataLessor?.data || dataLessor?.items || dataLessor || [];
      const asLessee = dataLessee?.data || dataLessee?.items || dataLessee || [];

      const map = new Map<string, any>();
      const normalize = (data: any) => Array.isArray(data) ? data : (data?.data || data?.items || []);
      
      [...normalize(asLessor), ...normalize(asLessee)].forEach((c: any) => {
        const source = c.source || c.Source;
        if (source === 'External') {
          map.set(String(c.id ?? c.Id), c);
        }
      });

      const myContracts = Array.from(map.values()).sort((a: any, b: any) => {
        const idA = Number(a.id ?? a.Id ?? 0);
        const idB = Number(b.id ?? b.Id ?? 0);
        return idB - idA;
      });
      
      setContracts(myContracts);

      // --- Fetch Space Names ---
      try {
        const spaceRes = await fetch(`${API_BASE}/api/Space/GetAll`, { headers: { Authorization: `Bearer ${token}` }});
        if (spaceRes.ok) {
          const sData = await spaceRes.json();
          const sItems = Array.isArray(sData) ? sData : (sData?.data || sData?.items || []);
          const sMap = new Map<string, string>();
          sItems.forEach((s: any) => sMap.set(String(s.id || s.Id), s.name || s.Name));
          setSpaceNames(sMap);
        }
      } catch (err) {}

      // --- Fetch User Names ---
      try {
        const uniqueUserIds = Array.from(new Set(myContracts.map((c: any) => {
          const isMyRoleLessor = String(c.lessorId || c.LessorId) === currentUserId;
          return isMyRoleLessor ? String(c.lesseeId || c.LesseeId) : String(c.lessorId || c.LessorId);
        }).filter(Boolean)));
        
        const newUMap = new Map<string, string>();
        await Promise.all(uniqueUserIds.map(async (uId) => {
          const pRes = await fetch(`${API_BASE}/api/Profile/user/${uId}`, { headers: { Authorization: `Bearer ${token}` }});
          if (pRes.ok) {
            const pData = await pRes.json();
            newUMap.set(uId as string, pData.fullName || pData.userName || '');
          }
        }));
        setUserNames(newUMap);
      } catch (err) {}
      
    } catch (err) {
      console.error('Error fetching external contracts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [token, currentUserId]);

  const handleConfirm = async (contractId: string | number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/ExternalContract/${contractId}/Confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Đã xác nhận hợp đồng thành công!');
        setViewingContract(null);
        fetchContracts();
      } else {
        const err = await res.text();
        alert('Lỗi xác nhận: ' + err);
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi xác nhận.');
    }
  };

  const isConfirmed = (c: any) => {
    const status = c.status || c.Status;
    return status === 'Confirmed' || status === 'Active' || c.isConfirmed === true || c.isActive === true;
  };

  const filteredContracts = contracts.filter(c => 
    activeTab === 'confirmed' ? isConfirmed(c) : !isConfirmed(c)
  );

  return (
    <div className="uploaded-contracts-page" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 8px 0' }}>Hợp đồng tải lên</h1>
        <p style={{ color: '#64748B', margin: 0 }}>Quản lý và xác nhận các hợp đồng ngoại (bản giấy chụp ảnh) của bạn.</p>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', borderBottom: '1px solid #E2E8F0' }}>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ padding: '12px 0', border: 'none', background: 'none', fontSize: '15px', fontWeight: activeTab === 'pending' ? '600' : '500', color: activeTab === 'pending' ? '#3B82F6' : '#64748B', borderBottom: activeTab === 'pending' ? '2px solid #3B82F6' : '2px solid transparent', cursor: 'pointer' }}>
          Chờ xác nhận
        </button>
        <button 
          onClick={() => setActiveTab('confirmed')}
          style={{ padding: '12px 0', border: 'none', background: 'none', fontSize: '15px', fontWeight: activeTab === 'confirmed' ? '600' : '500', color: activeTab === 'confirmed' ? '#3B82F6' : '#64748B', borderBottom: activeTab === 'confirmed' ? '2px solid #3B82F6' : '2px solid transparent', cursor: 'pointer' }}>
          Đã xác nhận
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Đang tải dữ liệu...</div>
      ) : filteredContracts.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
          <FileImage size={48} color="#94A3B8" style={{ margin: '0 auto 16px auto', display: 'block' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#334155', margin: '0 0 8px 0' }}>Không có hợp đồng nào</h3>
          <p style={{ color: '#64748B', margin: 0 }}>Bạn chưa có hợp đồng {activeTab === 'pending' ? 'chờ xác nhận' : 'đã xác nhận'} nào.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredContracts.map((c, idx) => {
            const isMyRoleLessor = String(c.lessorId || c.LessorId) === currentUserId;
            const otherId = isMyRoleLessor ? (c.lesseeId || c.LesseeId) : (c.lessorId || c.LessorId);
            const otherName = userNames.get(String(otherId)) || (isMyRoleLessor ? (c.lesseeUserName || 'Khách thuê') : (c.lessorUserName || 'Chủ nhà'));
            const myRoleText = isMyRoleLessor ? 'Cho thuê' : 'Đi thuê';
            const sId = String(c.spaceId || c.SpaceId);
            const spaceName = spaceNames.get(sId) || `#${sId}`;
            
            return (
              <div key={idx} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', backgroundColor: isMyRoleLessor ? '#EFF6FF' : '#F0FDF4', color: isMyRoleLessor ? '#3B82F6' : '#22C55E', marginBottom: '8px' }}>
                      Vai trò: {myRoleText}
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A', margin: '0 0 4px 0' }}>Hợp đồng #{c.id || c.Id}</h3>
                  </div>
                  {isConfirmed(c) ? (
                    <CheckCircle2 size={20} color="#22C55E" />
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#F59E0B', backgroundColor: '#FEF3C7', padding: '4px 8px', borderRadius: '6px' }}>Chờ xác nhận</span>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569' }}>
                    <Users size={16} color="#94A3B8" />
                    <span>Đối tác: <strong>{otherName}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569' }}>
                    <MapPin size={16} color="#94A3B8" />
                    <span>Mặt bằng: <strong>{spaceName}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569' }}>
                    <Calendar size={16} color="#94A3B8" />
                    <span>Ngày tạo: {new Date(c.createdAt || c.CreatedAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setViewingContract(c)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#0F172A', fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <Eye size={16} /> Xem chi tiết
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal View Details */}
      {viewingContract && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '800px', borderRadius: '16px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Chi tiết Hợp đồng #{viewingContract.id || viewingContract.Id}</h2>
              <button onClick={() => setViewingContract(null)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
                X
              </button>
            </div>

            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                <div style={{ flex: 1, backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#64748B', margin: '0 0 12px 0' }}>Bên cho thuê (A)</h4>
                  <p style={{ fontWeight: '600', color: '#0F172A', margin: 0, fontSize: '16px' }}>{viewingContract.lessorUserName || viewingContract.LessorUserName || 'Bạn'}</p>
                </div>
                <div style={{ flex: 1, backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#64748B', margin: '0 0 12px 0' }}>Bên thuê (B)</h4>
                  <p style={{ fontWeight: '600', color: '#0F172A', margin: 0, fontSize: '16px' }}>{viewingContract.lesseeUserName || viewingContract.LesseeUserName || 'Khách thuê'}</p>
                </div>
              </div>

              {viewingContract.canShare && (
                <div style={{ marginBottom: '24px', backgroundColor: '#EFF6FF', padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid #3B82F6', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ExternalLink size={20} color="#3B82F6" />
                  <span style={{ fontSize: '14px', color: '#1E40AF', fontWeight: '500' }}>Hợp đồng này được phép tạo hợp đồng phụ (chia sẻ mặt bằng).</span>
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A', margin: '0 0 16px 0' }}>Ảnh hợp đồng đính kèm</h4>
                
                {/* Giả định field ảnh là contractPictures, pictures, hoặc imageUrls. BE chưa rõ, hiển thị mockup nếu trống */}
                {viewingContract.pictures?.length > 0 || viewingContract.contractPictures?.length > 0 || viewingContract.externalContractPictures?.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {(viewingContract.pictures || viewingContract.contractPictures || viewingContract.externalContractPictures || []).map((pic: any, idx: number) => {
                      const url = typeof pic === 'string' ? pic : (pic.url || pic.imageUrl);
                      return (
                        <div key={idx} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0', height: '240px' }}>
                          <img src={url} alt={`Trang ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#F1F5F9' }} />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                    <FileImage size={40} color="#94A3B8" style={{ margin: '0 auto 12px auto', display: 'block' }} />
                    <p style={{ color: '#64748B', margin: 0, fontSize: '14px' }}>Hợp đồng này chưa tải ảnh lên hoặc API không trả về mảng ảnh.</p>
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
              <button onClick={() => setViewingContract(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#fff', color: '#334155', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                Đóng
              </button>
              
              {!isConfirmed(viewingContract) && String(viewingContract.lesseeId || viewingContract.LesseeId) === currentUserId && (
                <button 
                  onClick={() => handleConfirm(viewingContract.id || viewingContract.Id)}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#22C55E', color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCheck size={18} /> Xác nhận đồng ý
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
