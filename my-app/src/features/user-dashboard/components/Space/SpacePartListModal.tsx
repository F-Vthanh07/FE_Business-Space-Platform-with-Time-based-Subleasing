import React, { useState, useEffect } from 'react';
import { X, Layers, Clock, ShieldAlert, Edit3, Trash2, Eye } from 'lucide-react';
import '../../../shared/ModalShell.css';

interface SpacePart {
  id: number;
  name: string;
  area: number;
  isActive: boolean;
  latitude: number;
  longitude: number;
}

interface SpacePartListModalProps {
  parentSpace: any;
  onClose: () => void;
  onEditPart: (part: any) => void;
}

export const SpacePartListModal: React.FC<SpacePartListModalProps> = ({ parentSpace, onClose, onEditPart }) => {
  const [spaceParts, setSpaceParts] = useState<SpacePart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [viewingPartId, setViewingPartId] = useState<number | null>(null);
  const [partDetails, setPartDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchSpaceParts = async () => {
      setIsLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('portal_token');
        const url = `https://flexi-space-capstone-project.onrender.com/api/SpacePart/GetByParent/${parentSpace.id}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // API returns an array or paginated object
          setSpaceParts(Array.isArray(data) ? data : (data?.items || []));
        } else {
          // If 404, maybe there are no parts yet
          if (response.status === 404) {
             setSpaceParts([]);
          } else {
             setError('Lỗi khi tải danh sách không gian con.');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi kết nối máy chủ.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (parentSpace?.id) {
      fetchSpaceParts();
    }
  }, [parentSpace]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá không gian chia nhỏ này?')) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('portal_token');
      const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/SpacePart/Delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSpaceParts(prev => prev.filter(p => p.id !== id));
        if (viewingPartId === id) {
          setViewingPartId(null);
          setPartDetails(null);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || 'Lỗi khi xoá không gian con.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (id: number) => {
    if (viewingPartId === id) {
      setViewingPartId(null);
      setPartDetails(null);
      return;
    }
    
    setViewingPartId(id);
    setIsLoadingDetails(true);
    try {
      const token = localStorage.getItem('portal_token');
      const res = await fetch(`https://flexi-space-capstone-project.onrender.com/api/SpacePart/GetById/${id}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });
      if (res.ok) {
        const data = await res.json();
        setPartDetails(data);
      } else {
        setError('Không thể tải chi tiết không gian con.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ khi tải chi tiết.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="glass-card modal-shell animate-in" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div className="modal-title-area">
            <div className="modal-icon-wrap modal-icon-wrap--blue"><Layers size={16} /></div>
            <div>
              <h2 className="modal-title">Danh sách không gian chia nhỏ</h2>
              <p className="modal-subtitle text-secondary">Thuộc không gian: {parentSpace?.name}</p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} disabled={isLoading}>
            <X size={15} />
          </button>
        </div>

        <div className="modal-body" style={{ minHeight: '200px' }}>
          {error && (
            <div className="form-error-box" style={{ marginBottom: '16px' }}>
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="loading-state text-secondary" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
              <Clock size={24} style={{ marginBottom: '8px' }} />
              <span>Đang tải danh sách...</span>
            </div>
          ) : spaceParts.length === 0 ? (
            <div className="text-secondary" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p>Chưa có không gian nào được chia nhỏ từ mặt bằng này.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {spaceParts.map(part => (
                <React.Fragment key={part.id}>
                <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{part.name}</h4>
                    <p className="text-secondary" style={{ margin: 0, fontSize: '13px' }}>Diện tích: {part.area} m²</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-icon" onClick={() => handleViewDetails(part.id)} title="Xem chi tiết">
                      <Eye size={16} />
                    </button>
                    <button className="btn-icon" onClick={() => onEditPart(part)} title="Sửa">
                      <Edit3 size={16} />
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(part.id)} title="Xoá" style={{ color: 'var(--color-danger)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {viewingPartId === part.id && (
                  <div className="space-part-details" style={{ padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '8px', marginTop: '-8px', marginBottom: '12px', fontSize: '13px' }}>
                    {isLoadingDetails ? (
                      <div className="text-secondary" style={{ textAlign: 'center' }}><Clock size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}/> Đang tải chi tiết...</div>
                    ) : partDetails ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div><strong>Trạng thái:</strong> {partDetails.isActive ?? partDetails.IsActive ? 'Đang hoạt động' : 'Đang tạm dừng'}</div>

                        {(partDetails.amenities || partDetails.Amenities) && (partDetails.amenities || partDetails.Amenities).length > 0 && (
                          <div>
                            <strong>Tiện ích:</strong> {(partDetails.amenities || partDetails.Amenities).map((a: any) => a.name || a.Name).join(', ')}
                          </div>
                        )}
                        {(partDetails.spaceAllowedCategories || partDetails.SpaceAllowedCategories) && (partDetails.spaceAllowedCategories || partDetails.SpaceAllowedCategories).length > 0 && (
                          <div>
                            <strong>Ngành nghề cho phép:</strong> Có giới hạn
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions-footer">
          <button type="button" className="btn-primary submit-btn" onClick={onClose} style={{ width: '100%' }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
