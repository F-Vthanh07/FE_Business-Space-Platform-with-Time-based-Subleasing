/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock3,
  XCircle,
  Eye,
  Building2,
  Users,
  RefreshCcw,
} from 'lucide-react';
import { ContractCreateModal } from '../../../../components/Contract/ContractCreateModal';
import { ContractViewModal } from '../../../../components/Contract/ContractViewModal';
import { useConfirm } from '../../../../components/ConfirmModal';

const API_BASE = 'https://flexi-space-capstone-project.onrender.com';

type StatusFilter = 'ALL' | 'UNSIGNED' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';

// Lấy status ra khỏi object hợp đồng, chấp nhận cả 2 kiểu casing (status / Status)
// vì BE có lúc trả camelCase, có lúc PascalCase tuỳ endpoint.
const getStatus = (c: any) => c.status || c.Status || '';

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'UNSIGNED', label: 'Chưa ký' },
  { id: 'SIGNED', label: 'Đã ký' },
  { id: 'EXPIRED', label: 'Hết hạn' },
  { id: 'CANCELLED', label: 'Đã huỷ' },
];

// ===== BADGE STYLE — ĐỔI SANG TÔNG MÀU TRONG SUỐT PHÙ HỢP NỀN TỐI =====
const badgeBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 700,
  padding: '3px 9px',
  borderRadius: 999,
  whiteSpace: 'nowrap',
  border: '1px solid transparent',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'Active')
    return (
      <span style={{ ...badgeBase, background: 'rgba(22,163,74,0.15)', color: '#4ADE80', borderColor: 'rgba(74,222,128,0.3)' }}>
        <CheckCircle2 size={12} /> Đã ký
      </span>
    );
  if (status === 'Draft')
    return (
      <span style={{ ...badgeBase, background: 'rgba(245,158,11,0.15)', color: '#FBBF24', borderColor: 'rgba(251,191,36,0.3)' }}>
        <Clock3 size={12} /> Chưa ký
      </span>
    );
  if (status === 'Expired')
    return (
      <span style={{ ...badgeBase, background: 'rgba(107,114,128,0.15)', color: '#9CA3AF', borderColor: 'rgba(156,163,175,0.3)' }}>
        <Clock3 size={12} /> Hết hạn
      </span>
    );
  if (status === 'Cancelled')
    return (
      <span style={{ ...badgeBase, background: 'rgba(239,68,68,0.15)', color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' }}>
        <XCircle size={12} /> Đã huỷ
      </span>
    );
  return <span style={{ ...badgeBase, background: 'rgba(107,114,128,0.15)', color: '#9CA3AF' }}>{status || '...'}</span>;
};

export const MyContractsPage: React.FC = () => {
  const { confirm, confirmModal } = useConfirm();
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('ALL');

  const [viewingContract, setViewingContract] = useState<any>(null);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const token = localStorage.getItem('portal_token');
  const currentUserId = localStorage.getItem('current_user_id');

  // Đếm số lượng cho từng tab (Chưa ký / Đã ký / Hết hạn / Đã huỷ) - lấy từ danh sách "Tất cả"
  const [allContracts, setAllContracts] = useState<any[]>([]);

  // Contract GetAll KHÔNG trả tên 2 bên, nhưng api/Conversation/User/{id} (dùng chung với FloatingChat)
  // thì có sẵn lessorUserName/lesseeUserName. Nên lấy tên từ đó, match theo cặp lessorId+lesseeId.
  const [nameMap, setNameMap] = useState<Record<string, { lessorUserName: string; lesseeUserName: string }>>({});

  const normalizeList = (data: any) => (Array.isArray(data) ? data : data?.data || data?.items || []);

  const fetchConversationNames = async () => {
    if (!token || !currentUserId) return;
    try {
      const res = await fetch(`${API_BASE}/api/Conversation/User/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      });
      if (!res.ok) return;
      const list = normalizeList(await res.json());
      const map: Record<string, { lessorUserName: string; lesseeUserName: string }> = {};
      list.forEach((conv: any) => {
        const lessorId = conv.lessorId ?? conv.LessorId;
        const lesseeId = conv.lesseeId ?? conv.LesseeId;
        map[`${lessorId}|${lesseeId}`] = {
          lessorUserName: conv.lessorUserName || conv.LessorUserName || '',
          lesseeUserName: conv.lesseeUserName || conv.LesseeUserName || '',
        };
      });
      setNameMap(map);
    } catch (err) {
      console.error('Lỗi tải tên 2 bên từ cuộc trò chuyện:', err);
    }
  };

  // Map tab -> giá trị Status thật của BE (đúng như dropdown trong Swagger: Draft, Active, Expired, Cancelled)
  const statusParamOf = (f: StatusFilter): string | null => {
    if (f === 'UNSIGNED') return 'Draft';
    if (f === 'SIGNED') return 'Active';
    if (f === 'EXPIRED') return 'Expired';
    if (f === 'CANCELLED') return 'Cancelled';
    return null; // ALL -> không truyền Status, để BE trả hết
  };

  // Gọi 2 lần vì mình có thể là Bên A (Lessor) hoặc Bên B (Lessee) tuỳ hợp đồng,
  // API GetAll chỉ lọc theo đúng 1 role trong 1 lần gọi. status = null nghĩa là không lọc theo Status.
  const fetchContractsByStatus = async (status: string | null) => {
    const statusQuery = status ? `&Status=${status}` : '';
    const [asLessorRes, asLesseeRes] = await Promise.all([
      fetch(`${API_BASE}/api/Contract/GetAll?LessorId=${currentUserId}${statusQuery}`, {
        headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      }),
      fetch(`${API_BASE}/api/Contract/GetAll?LesseeId=${currentUserId}${statusQuery}`, {
        headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      }),
    ]);

    const asLessor = asLessorRes.ok ? normalizeList(await asLessorRes.json()) : [];
    const asLessee = asLesseeRes.ok ? normalizeList(await asLesseeRes.json()) : [];

    // Gộp và loại trùng theo id và chỉ lấy hợp đồng nguồn "Platform"
    const map = new Map<string, any>();
    [...asLessor, ...asLessee].forEach((c) => {
      const source = c.source || c.Source;
      if (source !== 'External') {
        map.set(String(c.id ?? c.Id), c);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const idA = Number(a.id ?? a.Id ?? 0);
      const idB = Number(b.id ?? b.Id ?? 0);
      return idB - idA; // mới nhất lên trên
    });
  };

  // Tải danh sách theo đúng tab đang chọn (dùng Status query param thật của BE)
  const fetchMyContracts = async () => {
    if (!token || !currentUserId) return;
    setIsLoading(true);
    try {
      const list = await fetchContractsByStatus(statusParamOf(filter));
      setContracts(list);

      // Nếu đang xem "Tất cả" thì tận dụng luôn kết quả này để tính số đếm cho các tab,
      // đỡ phải gọi thêm request riêng.
      if (filter === 'ALL') setAllContracts(list);
    } catch (err) {
      console.error('Lỗi tải danh sách hợp đồng:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Tải riêng danh sách "Tất cả" một lần khi vào trang, chỉ để tính số đếm hiển thị trên tab
  const fetchCounts = async () => {
    try {
      const list = await fetchContractsByStatus(null);
      setAllContracts(list);
    } catch (err) {
      console.error('Lỗi tải số đếm hợp đồng:', err);
    }
  };

  useEffect(() => {
    fetchMyContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, token, filter]);

  useEffect(() => {
    if (filter !== 'ALL') fetchCounts();
    fetchConversationNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, token]);

  const filteredContracts = contracts; // BE đã lọc sẵn theo Status, không cần lọc lại ở FE

  const counts = useMemo(() => {
    const c = { UNSIGNED: 0, SIGNED: 0, EXPIRED: 0, CANCELLED: 0 };
    allContracts.forEach((ct) => {
      const s = getStatus(ct);
      if (s === 'Draft') c.UNSIGNED++;
      else if (s === 'Active') c.SIGNED++;
      else if (s === 'Expired') c.EXPIRED++;
      else if (s === 'Cancelled') c.CANCELLED++;
    });
    return c;
  }, [allContracts]);

  const isLessorOf = (c: any) => String(c.lessorId ?? c.LessorId) === String(currentUserId);

  // Tên 2 bên trong hợp đồng: ưu tiên lấy từ danh sách hội thoại (nameMap) vì Contract GetAll
  // không trả tên. Nếu không tìm thấy hội thoại tương ứng (hiếm, vd hội thoại đã bị xoá) thì
  // fallback hiện theo id.
  const getPartyNames = (c: any) => {
    const lessorId = c.lessorId ?? c.LessorId;
    const lesseeId = c.lesseeId ?? c.LesseeId;
    const fromChat = nameMap[`${lessorId}|${lesseeId}`];
    const lessorName = fromChat?.lessorUserName || c.lessorName || c.LessorName || `Chủ nhà #${lessorId ?? '...'}`;
    const lesseeName = fromChat?.lesseeUserName || c.lesseeName || c.LesseeName || `Khách thuê #${lesseeId ?? '...'}`;
    return { lessorName, lesseeName };
  };

  const handleDeleteContract = async (contractId: string) => {
    const ok = await confirm({
      title: 'Thu hồi hợp đồng',
      message: 'Bạn có chắc chắn muốn thu hồi và huỷ bỏ hợp đồng này?',
      confirmLabel: 'Thu hồi',
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/api/Contract/Delete/${contractId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
      });
      if (!res.ok) throw new Error('Thu hồi thất bại. Có thể hợp đồng đã được ký hoặc không tồn tại.');
      alert('Đã thu hồi hợp đồng thành công!');
      setViewingContract(null);
      fetchMyContracts();
      fetchCounts();
    } catch (err: any) {
      alert(err.message || 'Lỗi kết nối đến máy chủ.');
    }
  };

  const handleEditContract = (contract: any) => {
    setEditingContract(contract);
    setIsEditModalOpen(true);
    setViewingContract(null);
  };

  const spaceNameOf = (c: any) => c.spaceName || c.space?.name || `Mặt bằng #${c.spaceId ?? c.SpaceId ?? '...'}`;
  const formatCurrency = (v?: number) => (v || v === 0 ? `${v.toLocaleString('vi-VN')} VNĐ` : '...');
  const formatDurationUnit = (u?: string) => (u === 'Days' ? 'ngày' : u === 'Months' ? 'tháng' : u === 'Years' ? 'năm' : u || '');

  return (
    <div className="animate-in">
      {/* CSS RIÊNG CHO TRANG NÀY — ĐỔI TOÀN BỘ SANG TÔNG MÀU TỐI, KHỚP THEME GLASS CỦA APP */}
      <style>
        {`
          .mc-tab {
            padding: 8px 16px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            border: 1px solid var(--color-border);
            background: var(--color-bg-card);
            color: var(--color-text-secondary);
            transition: all .15s ease;
            white-space: nowrap;
          }
          .mc-tab:hover { border-color: var(--color-accent); color: var(--color-text-primary); }
          .mc-tab.active { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }

          .mc-card {
            background: var(--color-bg-card);
            border: 1px solid var(--color-border);
            border-radius: 14px;
            padding: 18px 20px;
            margin-bottom: 12px;
            transition: box-shadow .15s ease, border-color .15s ease, background .15s ease;
          }
          .mc-card:hover {
            box-shadow: var(--shadow-card-hover);
            border-color: var(--color-accent);
            background: var(--color-bg-hover);
          }

          .mc-view-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 12.5px;
            font-weight: 700;
            cursor: pointer;
            border: none;
            background: #3B82F6;
            color: #fff !important;
            box-shadow: 0 4px 14px rgba(59,130,246,0.3);
          }
          .mc-view-btn:hover { background: #2563EB; }

          .mc-refresh-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12.5px;
            font-weight: 600;
            cursor: pointer;
            border: 1px solid var(--color-border);
            background: var(--color-bg-card);
            color: var(--color-text-secondary);
          }
          .mc-refresh-btn:hover:not(:disabled) { border-color: var(--color-accent); color: var(--color-text-primary); }
          .mc-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        `}
      </style>

      {confirmModal}

      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={22} /> Hợp Đồng Của Bạn
          </h1>
          <p className="page-subtitle text-secondary" style={{ marginTop: '4px' }}>
            Tất cả hợp đồng bạn tham gia, dù là bên cho thuê hay bên thuê.
          </p>
        </div>
        <button
          className="mc-refresh-btn"
          onClick={() => {
            fetchMyContracts();
            fetchCounts();
          }}
          disabled={isLoading}
        >
          <RefreshCcw size={14} /> {isLoading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* TABS LỌC THEO TRẠNG THÁI */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`mc-tab ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            {f.id !== 'ALL' && counts[f.id] > 0 ? ` (${counts[f.id]})` : ''}
          </button>
        ))}
      </div>

      {/* DANH SÁCH */}
      <div className="glass-card" style={{ padding: '20px', borderRadius: '12px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.6, fontSize: '14px' }}>
            Đang tải danh sách hợp đồng...
          </div>
        ) : filteredContracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
            <FileText size={48} style={{ margin: '0 auto 16px auto' }} />
            <p>Không có hợp đồng nào ở mục này.</p>
          </div>
        ) : (
          filteredContracts.map((contract) => {
            const id = contract.id ?? contract.Id;
            const status = getStatus(contract);
            const { lessorName, lesseeName } = getPartyNames(contract);
            const amILessor = isLessorOf(contract);

            return (
              <div key={id} className="mc-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', minWidth: 0 }}>
                  <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--color-text-primary)' }}>Hợp đồng #{id}</span>
                      <StatusBadge status={status} />
                      <span style={{
                        fontSize: '11px', fontWeight: 700,
                        color: amILessor ? '#8b5cf6' : '#0891b2',
                        background: amILessor ? 'rgba(139,92,246,0.15)' : 'rgba(8,145,178,0.15)',
                        border: `1px solid ${amILessor ? 'rgba(139,92,246,0.3)' : 'rgba(8,145,178,0.3)'}`,
                        padding: '2px 8px', borderRadius: 999
                      }}>
                        {amILessor ? 'Bạn là Bên cho thuê' : 'Bạn là Bên thuê'}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
                      <Building2 size={13} style={{ opacity: 0.6 }} /> {spaceNameOf(contract)}
                    </div>

                    <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: 'var(--color-text-secondary)' }}>
                      <Users size={13} style={{ opacity: 0.6 }} />
                      <span><strong style={{ color: 'var(--color-text-primary)' }}>{lessorName}</strong> &harr; <strong style={{ color: 'var(--color-text-primary)' }}>{lesseeName}</strong></span>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', fontSize: '12.5px', flexWrap: 'wrap', color: 'var(--color-text-secondary)' }}>
                      <span>Giá thuê: <strong style={{ color: '#4ADE80' }}>{formatCurrency(contract.price)}</strong></span>
                      <span>Thời hạn: <strong style={{ color: 'var(--color-text-primary)' }}>{contract.duration} {formatDurationUnit(contract.durationUnit)}</strong></span>
                    </div>
                  </div>

                  <button className="mc-view-btn" onClick={() => setViewingContract(contract)}>
                    <Eye size={14} /> Xem chi tiết{status === 'Draft' ? ' & Ký' : ''}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL XEM CHI TIẾT / KÝ HỢP ĐỒNG (dùng lại component đã có) */}
      {viewingContract && (
        <ContractViewModal
          contract={viewingContract}
          onClose={() => setViewingContract(null)}
          isLessor={isLessorOf(viewingContract)}
          onEdit={() => handleEditContract(viewingContract)}
          onDelete={() => handleDeleteContract(viewingContract.id ?? viewingContract.Id)}
          lessorName={getPartyNames(viewingContract).lessorName}
          lesseeName={getPartyNames(viewingContract).lesseeName}
        />
      )}

      {/* MODAL SỬA HỢP ĐỒNG (dùng lại component tạo/sửa đã có) */}
      <ContractCreateModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingContract(null);
        }}
        // Không có sẵn "activeChat" ở trang danh sách này (không mở từ khung chat),
        // nên dựng tạm object đủ field mà ContractCreateModal cần để chạy chế độ SỬA.
        activeChat={
          editingContract
            ? {
                lessorId: editingContract.lessorId ?? editingContract.LessorId,
                lesseeId: editingContract.lesseeId ?? editingContract.LesseeId,
                conversationId: editingContract.conversationId ?? editingContract.ConversationId,
              }
            : null
        }
        token={token}
        onCreated={async () => {
          setIsEditModalOpen(false);
          setEditingContract(null);
          await fetchMyContracts();
          fetchCounts();
        }}
        existingContract={editingContract}
      />
    </div>
  );
};

export default MyContractsPage;