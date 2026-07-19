/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X, Printer, Briefcase, Wallet, CalendarDays, Edit3, FileText, Building2 } from 'lucide-react';
import { CONTRACT_TEMPLATES, getTemplateById, fillContractTemplate, renderMergeValue, type ContractMergeData, splitContractHeaderBody, } from './contractTemplates';

interface ContractCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChat: any;
  token: string | null;
  // Gọi khi tạo + share hợp đồng thành công, để component cha gửi tin nhắn vào chat
  onCreated: (chatMessage: string) => Promise<void> | void;
}

const API_BASE = 'https://flexi-space-capstone-project.onrender.com';

export const ContractCreateModal: React.FC<ContractCreateModalProps> = ({
  isOpen,
  onClose,
  activeChat,
  token,
  onCreated,
}) => {
  const [mySpaces, setMySpaces] = useState<any[]>([]);
  const [matchedBookingRequests, setMatchedBookingRequests] = useState<any[]>([]);
  const [isLoadingBookingRequests, setIsLoadingBookingRequests] = useState(false);
  const [isCreatingContract, setIsCreatingContract] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  // Nhớ chuỗi đã render lần trước cho từng field (vd DIEN_TICH -> "90 m2")
  // để lần sau dữ liệu đổi, chỉ cần tìm đúng chuỗi cũ đó trong nội dung và
  // thay bằng chuỗi mới -> không đụng tới các phần bạn đã tự sửa tay.
  // Nếu bạn xóa hẳn đoạn đó đi, chuỗi cũ không còn -> hệ thống không tự chèn lại.
  const lastRenderedRef = React.useRef<Record<string, string>>({});

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
    businessPurpose: '',
    contractSchedules: [{ dayOfWeek: 'Monday', startTime: '08:00', endTime: '22:00' }],
  });

  const lessorId = activeChat?.lessorId || activeChat?.LessorId;
  const lesseeId = activeChat?.lesseeId || activeChat?.LesseeId;

  // Reset khi mở lại modal cho 1 cuộc chat mới
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTemplateId('');
      lastRenderedRef.current = {};
      setContractData((prev) => ({
        ...prev,
        spaceId: '',
        primaryBookingRequestId: 0,
        duration: 1,
        startDate: new Date().toISOString().split('T')[0],
        acreage: 0,
        price: 0,
        depositAmount: 0,
        description: '',
        businessPurpose: '',
      }));
    }
  }, [isOpen, activeChat?.id, activeChat?.conversationId]);

  // Lấy danh sách mặt bằng của chủ nhà
  useEffect(() => {
    if (!isOpen || !token) return;
    const currentUserId = localStorage.getItem('current_user_id');
    const fetchMySpaces = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/Space/GetAll?OwnerId=${currentUserId}`, {
          headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
        });
        if (res.ok) {
          const data = await res.json();
          setMySpaces(Array.isArray(data) ? data : data?.data || data?.items || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMySpaces();
  }, [isOpen, token]);

  // Lấy các yêu cầu đặt thuê đã match giữa 2 bên
  useEffect(() => {
    if (!isOpen || !token || !activeChat) return;
    const fetchMatchedRequests = async () => {
      setIsLoadingBookingRequests(true);
      try {
        const responses = await Promise.all(
          ['Approved'].map((status) =>
            fetch(`${API_BASE}/api/PrimaryBookingRequest/GetAll?status=${status}`, {
              headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
            })
              .then((res) => (res.ok ? res.json() : []))
              .catch(() => [])
          )
        );
        const allRequests = responses.flatMap((data: any) =>
          Array.isArray(data) ? data : data?.data || data?.items || []
        );
        const matched = allRequests.filter(
          (r: any) => String(r.lessorId) === String(lessorId) && String(r.lesseeId) === String(lesseeId)
        );
        setMatchedBookingRequests(matched);
        if (matched.length === 1) {
          const only = matched[0];
          setContractData((prev) => ({
            ...prev,
            primaryBookingRequestId: only.id,
            spaceId: only.spaceId ? String(only.spaceId) : prev.spaceId,
            price: only.offeredPrice ?? prev.price,
            duration: only.duration ?? prev.duration,
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingBookingRequests(false);
      }
    };
    fetchMatchedRequests();
  }, [isOpen, token, activeChat, lessorId, lesseeId]);

  // Ngày kết thúc = ngày bắt đầu + thời lượng (tính theo đơn vị Ngày/Tháng/Năm)
  const computeEndDate = (startDate: string, duration: number, unit: string): string => {
    if (!startDate || !duration) return '';
    const d = new Date(startDate);
    if (Number.isNaN(d.getTime())) return '';
    if (unit === 'Days') d.setDate(d.getDate() + duration);
    else if (unit === 'Months') d.setMonth(d.getMonth() + duration);
    else if (unit === 'Years') d.setFullYear(d.getFullYear() + duration);
    return d.toLocaleDateString('vi-VN');
  };

  const formatDurationLabel = (duration: number, unit: string) => {
    const unitLabel = unit === 'Days' ? 'ngày' : unit === 'Months' ? 'tháng' : 'năm';
    return duration ? `${duration} ${unitLabel}` : '';
  };

  // Gom toàn bộ dữ liệu đang nhập ở form (giá, cọc, diện tích, ngày...) thành
  // merge data để đổ trực tiếp vào nội dung mẫu hợp đồng - đây là chỗ đảm bảo
  // thông tin ở phần "Ghi chú điều khoản" luôn khớp với các ô nhập bên trên.
  const buildMergeData = (): ContractMergeData => {
    const selectedSpace = mySpaces.find((s) => String(s.id || s.Id) === String(contractData.spaceId));

    return {
      MA_YEU_CAU_THUE: contractData.primaryBookingRequestId ? `#${contractData.primaryBookingRequestId}` : '',
      NGAY_LAP_HD: new Date().toLocaleDateString('vi-VN'),

      TEN_MAT_BANG: selectedSpace?.name || '',
      DIA_CHI_MAT_BANG: selectedSpace?.address || selectedSpace?.location || selectedSpace?.name || '',
      DIEN_TICH: contractData.acreage ? `${contractData.acreage} m2` : '',
      MUC_DICH_KINH_DOANH: contractData.businessPurpose || '',

      GIA_THUE: contractData.price ? `${contractData.price.toLocaleString('vi-VN')} VNĐ/tháng` : '',
      TIEN_COC: contractData.depositAmount ? `${contractData.depositAmount.toLocaleString('vi-VN')} VNĐ` : '',

      THOI_HAN_THUE: formatDurationLabel(contractData.duration, contractData.durationUnit),
      NGAY_BAT_DAU: contractData.startDate ? new Date(contractData.startDate).toLocaleDateString('vi-VN') : '',
      NGAY_KET_THUC: computeEndDate(contractData.startDate, contractData.duration, contractData.durationUnit),

      BEN_A_HO_TEN: activeChat?.lessorName || activeChat?.LessorName || '',
      BEN_B_HO_TEN: activeChat?.lesseeName || activeChat?.LesseeName || '',
    };
  };

  // Ghi nhận lại toàn bộ giá trị vừa render cho từng field - dùng làm "chuỗi cũ"
  // để lần sau còn biết đường tìm mà thay.
  const rememberRenderedValues = (merge: ContractMergeData) => {
    const rendered: Record<string, string> = {};
    (Object.keys(merge) as (keyof ContractMergeData)[]).forEach((key) => {
      rendered[key] = renderMergeValue(key, merge[key]);
    });
    lastRenderedRef.current = rendered;
  };

  // Tạo MỚI HOÀN TOÀN nội dung điều khoản từ mẫu gốc + dữ liệu hiện tại.
  // Dùng khi vừa chọn mẫu, hoặc khi bấm nút "Tạo lại từ đầu" (sẽ ghi đè mọi
  // sửa tay trước đó).
  const regenerateDescriptionFromScratch = (templateId: string) => {
    const tpl = getTemplateById(templateId);
    if (!tpl) return;
    const merge = buildMergeData();
    const filled = fillContractTemplate(tpl, merge);
    rememberRenderedValues(merge);
    setContractData((prev) => ({ ...prev, description: filled }));
  };

  // Dò từng field: nếu giá trị hiển thị của field đó đã đổi so với lần render
  // trước, tìm đúng chuỗi cũ trong nội dung hiện tại và thay bằng chuỗi mới.
  // Field nào bạn đã xóa khỏi nội dung (không còn chuỗi cũ để tìm) sẽ được
  // bỏ qua, không tự chèn lại - giữ nguyên phần bạn đã chỉnh tay.
  const applyMergeDataDiff = (merge: ContractMergeData) => {
    setContractData((prev) => {
      let newDesc = prev.description;
      (Object.keys(merge) as (keyof ContractMergeData)[]).forEach((key) => {
        const newValue = renderMergeValue(key, merge[key]);
        const oldValue = lastRenderedRef.current[key];
        if (oldValue && oldValue !== newValue && newDesc.includes(oldValue)) {
          newDesc = newDesc.split(oldValue).join(newValue);
        }
      });
      return { ...prev, description: newDesc };
    });
    rememberRenderedValues(merge);
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    regenerateDescriptionFromScratch(templateId);
  };

  // Mỗi khi các trường tài chính/lịch trình/mặt bằng thay đổi -> tự dò và thay
  // đúng chỗ trong nội dung điều khoản, không đụng tới phần bạn đã tự sửa tay.
  useEffect(() => {
    if (!selectedTemplateId) return;
    applyMergeDataDiff(buildMergeData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedTemplateId,
    contractData.price,
    contractData.depositAmount,
    contractData.duration,
    contractData.durationUnit,
    contractData.startDate,
    contractData.acreage,
    contractData.businessPurpose,
    contractData.spaceId,
    contractData.primaryBookingRequestId,
    mySpaces,
  ]);

  const handlePrintTemplate = () => {
    // In riêng nội dung mẫu (dùng cho case offline: in ra rồi 2 bên ký tay)
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;
    const { header, body } = splitContractHeaderBody(contractData.description || '');
    const escapeHtml = (s: string) => s.replace(/</g, '&lt;');
    printWindow.document.write(`
      <html>
        <head>
          <title>Hợp đồng thuê mặt bằng</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; font-size: 14px; }
            .contract-header { text-align: center; white-space: pre-wrap; margin-bottom: 16px; }
            .contract-body { text-align: left; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="contract-header">${escapeHtml(header)}</div>
          <div class="contract-body">${escapeHtml(body)}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractData.primaryBookingRequestId) return alert('Vui lòng chọn yêu cầu đặt thuê!');
    if (!contractData.businessPurpose.trim()) return alert('Vui lòng nhập mục đích kinh doanh!');
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
        businessPurpose: contractData.businessPurpose,
        contractSchedules: contractData.contractSchedules,
        lessorId,
        lesseeId,
      };

      const createRes = await fetch(`${API_BASE}/api/Contract/Create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(createPayload),
      });
      if (!createRes.ok) {
        const errBody = await createRes.text().catch(() => '');
        console.error('Create contract failed:', createRes.status, errBody);
        throw new Error('Lỗi tạo hợp đồng: ' + (errBody || createRes.status));
      }
      const createdContract = await createRes.json();
      const newContractId = createdContract.id || createdContract.Id;

      if (newContractId) {
        const shareRes = await fetch(`${API_BASE}/api/Contract/${newContractId}/share`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, accept: '*/*' },
        });
        if (!shareRes.ok) throw new Error('Lỗi share hợp đồng');

        await onCreated(`📄 Tôi vừa tạo và gửi một Hợp đồng (Mã: #${newContractId}). Vui lòng kiểm tra và xác nhận nhé!`);
        alert('Tạo hợp đồng thành công!');
        onClose();
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsCreatingContract(false);
    }
  };

  if (!isOpen) return null;

  const selectedTemplate = getTemplateById(selectedTemplateId);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        zIndex: 100000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <style>
        {`
          .cc-input {
            width: 100%; padding: 10px 12px; border: 1px solid #E2E8F0; border-radius: 8px;
            background-color: #F8FAFC; font-size: 13px; color: #1E293B; outline: none;
            box-sizing: border-box; transition: all 0.2s ease;
          }
          .cc-input:focus { border-color: #10B981; background-color: #fff; box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }
          .cc-label { font-size: 12.5px; font-weight: 600; color: #475569; display: block; margin-bottom: 6px; }
          .cc-card { background: #fff; border-radius: 10px; padding: 16px; border: 1px solid #E2E8F0; margin-bottom: 14px; }
          .cc-card-header { font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
          .cc-scrollbar::-webkit-scrollbar { width: 6px; }
          .cc-scrollbar::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 10px; }
          .cc-template-option {
            border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 10px 12px; cursor: pointer;
            transition: all 0.15s ease; margin-bottom: 8px;
          }
          .cc-template-option:hover { border-color: #94A3B8; }
          .cc-template-option.active { border-color: #10B981; background-color: #ECFDF5; }
        `}
      </style>

      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          height: '88vh',
          backgroundColor: '#F1F5F9',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#1E293B',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fff',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} /> Tạo Hợp Đồng Thuê
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Body: 2 cột */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* CỘT TRÁI: FORM */}
          <form
            onSubmit={handleSubmit}
            className="cc-scrollbar"
            style={{ width: '48%', overflowY: 'auto', padding: '20px', borderRight: '1px solid #E2E8F0' }}
          >
            <div className="cc-card">
              <div className="cc-card-header">
                <Briefcase size={14} color="#64748B" /> Liên kết yêu cầu
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label className="cc-label">Yêu cầu đặt thuê</label>
                <select
                  className="cc-input"
                  required
                  value={contractData.primaryBookingRequestId}
                  onChange={(e) =>
                    setContractData((prev) => ({ ...prev, primaryBookingRequestId: Number(e.target.value) }))
                  }
                  disabled={isLoadingBookingRequests}
                >
                  <option value={0} disabled>
                    {isLoadingBookingRequests ? '-- Đang tải... --' : '-- Chọn yêu cầu --'}
                  </option>
                  {matchedBookingRequests.map((req) => (
                    <option key={req.id} value={req.id}>
                      #{req.id} - {Number(req.offeredPrice).toLocaleString('vi-VN')}₫
                    </option>
                  ))}
                </select>
                {!isLoadingBookingRequests && matchedBookingRequests.length === 0 && (
                  <span style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                    Không tìm thấy yêu cầu khớp giữa 2 bên.
                  </span>
                )}
              </div>
              <div>
                <label className="cc-label">Mặt bằng cấp phát</label>
                <select
                  className="cc-input"
                  required
                  value={contractData.spaceId}
                  onChange={(e) => setContractData({ ...contractData, spaceId: e.target.value })}
                >
                  <option value="" disabled>
                    -- Chọn mặt bằng --
                  </option>
                  {mySpaces.map((space) => (
                    <option key={space.id || space.Id} value={space.id || space.Id}>
                      {space.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card-header">
                <Wallet size={14} color="#64748B" /> Thông số Tài chính
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="cc-label">Giá thuê (VNĐ)</label>
                  <input
                    className="cc-input"
                    type="number"
                    required
                    value={contractData.price}
                    onChange={(e) => setContractData({ ...contractData, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="cc-label">Tiền cọc (VNĐ)</label>
                  <input
                    className="cc-input"
                    type="number"
                    required
                    value={contractData.depositAmount}
                    onChange={(e) => setContractData({ ...contractData, depositAmount: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card-header">
                <CalendarDays size={14} color="#64748B" /> Lịch trình Thuê
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="cc-label">Thời lượng</label>
                  <input
                    className="cc-input"
                    type="number"
                    required
                    value={contractData.duration}
                    onChange={(e) => setContractData({ ...contractData, duration: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="cc-label">Đơn vị tính</label>
                  <select
                    className="cc-input"
                    value={contractData.durationUnit}
                    onChange={(e) => setContractData({ ...contractData, durationUnit: e.target.value })}
                  >
                    <option value="Days">Ngày</option>
                    <option value="Months">Tháng</option>
                    <option value="Years">Năm</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="cc-label">Ngày bắt đầu</label>
                <input
                  className="cc-input"
                  type="date"
                  required
                  value={contractData.startDate}
                  onChange={(e) => setContractData({ ...contractData, startDate: e.target.value })}
                />
              </div>
            </div>

            <div className="cc-card">
              <div className="cc-card-header">
                <Edit3 size={14} color="#64748B" /> Diện tích
              </div>
              <label className="cc-label">Diện tích thực tế (m²)</label>
              <input
                className="cc-input"
                type="number"
                required
                value={contractData.acreage}
                onChange={(e) => setContractData({ ...contractData, acreage: Number(e.target.value) })}
              />
            </div>

            {/* MỤC ĐÍCH KINH DOANH - field mới backend yêu cầu */}
            <div className="cc-card">
              <div className="cc-card-header">
                <Building2 size={14} color="#64748B" /> Mục đích kinh doanh
              </div>
              <label className="cc-label">Mục đích sử dụng mặt bằng</label>
              <input
                className="cc-input"
                type="text"
                required
                value={contractData.businessPurpose}
                onChange={(e) => setContractData({ ...contractData, businessPurpose: e.target.value })}
                placeholder="VD: Kinh doanh quán cà phê, cửa hàng thời trang..."
              />
            </div>

            {/* CHỌN MẪU HỢP ĐỒNG */}
            <div className="cc-card">
              <div className="cc-card-header">
                <FileText size={14} color="#64748B" /> Chọn mẫu hợp đồng
              </div>
              {CONTRACT_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`cc-template-option ${selectedTemplateId === tpl.id ? 'active' : ''}`}
                  onClick={() => handleSelectTemplate(tpl.id)}
                >
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#1E293B' }}>{tpl.label}</div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>{tpl.shortDesc}</div>
                </div>
              ))}

              <label className="cc-label" style={{ marginTop: '10px' }}>
                Ghi chú điều khoản (nội dung mẫu, có thể chỉnh sửa)
              </label>
              <textarea
                className="cc-input"
                rows={6}
                value={contractData.description}
                onChange={(e) => setContractData({ ...contractData, description: e.target.value })}
                style={{ resize: 'vertical', fontFamily: "'Times New Roman', serif", fontSize: '12.5px', lineHeight: 1.5 }}
                placeholder="Chọn 1 mẫu ở trên để đổ nội dung, hoặc tự nhập ghi chú..."
              />
              <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                Giá thuê, tiền cọc, diện tích, ngày thuê, mục đích kinh doanh... bên trên sẽ tự động cập nhật đúng
                vào chỗ tương ứng trong nội dung bên dưới. Nếu bạn xóa 1 đoạn nào đó đi, đoạn đó sẽ không tự hiện lại
                cho tới khi bạn bấm "Tạo lại từ đầu". Tên, CCCD các bên tạm hiện dạng [...Nhãn...] do chưa có API lấy
                thông tin định danh.
              </span>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handlePrintTemplate}
                  disabled={!contractData.description}
                  style={{
                    flex: 1,
                    padding: '9px 14px',
                    background: '#fff',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: contractData.description ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: contractData.description ? 1 : 0.5,
                  }}
                >
                  <Printer size={14} /> In mẫu (ký tay offline)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedTemplateId) return;
                    if (
                      !window.confirm(
                        'Thao tác này sẽ tạo lại toàn bộ nội dung từ mẫu gốc và GHI ĐÈ mọi chỗ bạn đã tự sửa tay. Tiếp tục?'
                      )
                    )
                      return;
                    regenerateDescriptionFromScratch(selectedTemplateId);
                  }}
                  disabled={!selectedTemplateId}
                  style={{
                    flex: 1,
                    padding: '9px 14px',
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#B91C1C',
                    cursor: selectedTemplateId ? 'pointer' : 'not-allowed',
                    opacity: selectedTemplateId ? 1 : 0.5,
                  }}
                >
                  Tạo lại từ đầu
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreatingContract || !contractData.primaryBookingRequestId}
              style={{
                width: '100%',
                marginTop: '4px',
                marginBottom: '20px',
                padding: '14px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                opacity: isCreatingContract || !contractData.primaryBookingRequestId ? 0.6 : 1,
              }}
            >
              {isCreatingContract ? 'Đang tạo & Gửi...' : 'Phát Hành Hợp Đồng (Online)'}
            </button>
          </form>

          {/* CỘT PHẢI: PREVIEW LIVE */}
          <div
            className="cc-scrollbar"
            style={{ width: '52%', overflowY: 'auto', padding: '28px 36px', backgroundColor: '#fff' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '8px', color: '#94A3B8', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Xem trước hợp đồng
            </div>
            <h2 style={{ textAlign: 'center', textTransform: 'uppercase', marginBottom: '4px', fontSize: '18px', color: '#1E293B' }}>
              Hợp đồng Thuê Mặt Bằng
            </h2>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748B', marginBottom: '24px' }}>
              {selectedTemplate ? selectedTemplate.label : 'Chưa chọn mẫu'}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px 20px',
                fontSize: '13px',
                color: '#334155',
                marginBottom: '20px',
                padding: '14px',
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
              }}
            >
              <p style={{ margin: 0 }}>
                <strong>Giá thuê:</strong> {contractData.price ? contractData.price.toLocaleString('vi-VN') : '...'} VNĐ
              </p>
              <p style={{ margin: 0 }}>
                <strong>Tiền cọc:</strong> {contractData.depositAmount ? contractData.depositAmount.toLocaleString('vi-VN') : '...'} VNĐ
              </p>
              <p style={{ margin: 0 }}>
                <strong>Thời hạn:</strong> {contractData.duration} {contractData.durationUnit === 'Days' ? 'ngày' : contractData.durationUnit === 'Months' ? 'tháng' : 'năm'}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Ngày bắt đầu:</strong> {contractData.startDate ? new Date(contractData.startDate).toLocaleDateString('vi-VN') : '...'}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Diện tích:</strong> {contractData.acreage || '...'} m²
              </p>
              <p style={{ margin: 0 }}>
                <strong>Mục đích:</strong> {contractData.businessPurpose || '...'}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Mặt bằng:</strong>{' '}
                {mySpaces.find((s) => String(s.id || s.Id) === String(contractData.spaceId))?.name || '...'}
              </p>
            </div>

            <div
              style={{
                fontFamily: "'Times New Roman', serif",
                fontSize: '13px',
                lineHeight: 1.7,
                color: '#1E293B',
                padding: '20px',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                minHeight: '300px',
                backgroundColor: '#FEFEFE',
              }}
            >
              {contractData.description ? (
                (() => {
                  const { header, body } = splitContractHeaderBody(contractData.description);
                  return (
                    <>
                      {header && (
                        <div style={{ textAlign: 'center', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                          {header}
                        </div>
                      )}
                      <div style={{ textAlign: 'left', whiteSpace: 'pre-wrap' }}>{body}</div>
                    </>
                  );
                })()
              ) : (
                <span style={{ color: '#CBD5E1', fontStyle: 'italic', fontFamily: 'system-ui' }}>
                  Chọn 1 mẫu hợp đồng ở cột bên trái để xem nội dung ở đây...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};