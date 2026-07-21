/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X, Printer, FileText, Wallet, CalendarDays, Building2, Briefcase, CheckCircle, Edit3, Trash2 } from 'lucide-react';
import { splitContractHeaderBody } from '../contractTemplates';
import { createPortal } from 'react-dom';

interface ContractViewModalProps {
  contract: any;
  onClose: () => void;
  isLessor?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  // Tên thật của 2 bên (lấy từ danh sách hội thoại - vì contract không tự trả tên).
  // Không bắt buộc: nếu không truyền, modal vẫn chạy bình thường và chỉ hiện nhãn vai trò chung chung.
  lessorName?: string;
  lesseeName?: string;
}

const formatCurrency = (value?: number) =>
  value || value === 0 ? `${value.toLocaleString('vi-VN')} VNĐ` : '...';

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('vi-VN') : '...';

const formatDurationUnit = (unit?: string) => {
  if (unit === 'Days') return 'ngày';
  if (unit === 'Months') return 'tháng';
  if (unit === 'Years') return 'năm';
  return unit || '...';
};

// DurationUnit trong Snapshot là số (khác bản sống là chuỗi 'Days'/'Months'/'Years').
// Suy ra từ dữ liệu quan sát được: Duration=12 + DurationUnit=2 => hiển thị "12 tháng".
// CHƯA có tài liệu chính thức từ BE cho enum này - nếu gặp hợp đồng đơn vị khác
// (ngày/tuần/năm) mà hiển thị sai, cần đối chiếu lại theo response thật từ GetSnapshotById.
const formatSnapshotDurationUnit = (unit?: number) => {
  switch (unit) {
    case 0: return 'ngày';
    case 1: return 'tuần';
    case 2: return 'tháng';
    case 3: return 'năm';
    default: return '';
  }
};

// Coi 1 giá trị là "đã ký" nếu nó là true, hoặc 1 chuỗi/ngày không rỗng (vd timestamp ký),
// vì BE có thể trả về dạng boolean (isSignedByLessor) hoặc dạng timestamp (lessorSignedAt).
const isTruthySigned = (v: any) => v === true || (typeof v === 'string' && v.trim().length > 0);

// Dò trạng thái đã ký của từng bên từ nhiều khả năng đặt tên field khác nhau của BE.
// NOTE: Nếu tên field thật của BE khác với các tên bên dưới, hãy mở tab Network ->
// gọi GetById 1 hợp đồng đã ký -> xem Response JSON có field nào đánh dấu đã ký rồi sửa lại đây.
const getSignFlags = (contract: any) => {
  const lessorSigned = isTruthySigned(
    contract?.isSignedByLessor ??
      contract?.IsSignedByLessor ??
      contract?.lessorSignedAt ??
      contract?.LessorSignedAt ??
      contract?.lessorSignDate ??
      contract?.LessorSignDate
  );
  const lesseeSigned = isTruthySigned(
    contract?.isSignedByLessee ??
      contract?.IsSignedByLessee ??
      contract?.lesseeSignedAt ??
      contract?.LesseeSignedAt ??
      contract?.lesseeSignDate ??
      contract?.LesseeSignDate
  );
  return { lessorSigned, lesseeSigned };
};

export const ContractViewModal: React.FC<ContractViewModalProps> = ({
  contract,
  onClose,
  isLessor,
  onEdit,
  onDelete,
  lessorName,
  lesseeName,
}) => {
  // State quản lý luồng ký Hợp đồng
  const [signStep, setSignStep] = useState<'idle' | 'otp_sent' | 'success'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Snapshot: bản dữ liệu đã đóng băng tại thời điểm ký (kèm thông tin xác thực chữ ký).
  // Chỉ tải khi hợp đồng đã có hiệu lực đầy đủ, để tránh hiển thị nhầm dữ liệu "sống"
  // có thể bị chỉnh sửa sau ngày ký.
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);

  const status = contract?.status || contract?.Status;
  const { lessorSigned, lesseeSigned } = getSignFlags(contract);
  const signedByMe = isLessor ? lessorSigned : lesseeSigned;
  const signedByOther = isLessor ? lesseeSigned : lessorSigned;
  // Hợp đồng coi như có hiệu lực đầy đủ khi status = Active, hoặc khi cả 2 bên đều đã ký
  // (fallback cho trường hợp field status chưa kịp cập nhật).
  const isFullyActive = status === 'Active' || (lessorSigned && lesseeSigned);

  // Mỗi khi đổi sang xem 1 hợp đồng khác (hoặc dữ liệu hợp đồng được load xong),
  // tự xác định lại xem mình (isLessor) đã ký hợp đồng này chưa để hiện đúng UI ngay
  // từ đầu, không đợi bấm nút mới biết.
  useEffect(() => {
    if (!contract) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOtpCode('');
    setSignStep(signedByMe || status === 'Active' ? 'success' : 'idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract?.id, isLessor]);

  // Khi hợp đồng đã ký xong (Active), lấy Snapshot - bản dữ liệu đã đóng băng tại
  // thời điểm ký (kèm thông tin xác thực chữ ký) - để hiển thị chính xác thay vì
  // dữ liệu "sống" có thể lệch nếu sau đó mặt bằng/giá gốc bị thay đổi.
  useEffect(() => {
    if (!contract?.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnapshot(null);
    if (!isFullyActive) return;

    const fetchSnapshot = async () => {
      setLoadingSnapshot(true);
      try {
        const token = localStorage.getItem('portal_token');
        const res = await fetch(
          `https://flexi-space-capstone-project.onrender.com/api/Contract/GetSnapshotById/${contract.id}`,
          { headers: { Authorization: `Bearer ${token}`, accept: '*/*' } }
        );
        if (res.ok) {
          setSnapshot(await res.json());
        }
      } catch (err) {
        console.error('Lỗi tải snapshot hợp đồng:', err);
      } finally {
        setLoadingSnapshot(false);
      }
    };
    fetchSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract?.id, isFullyActive]);

  if (!contract) return null;

  const spaceName = contract.spaceName || contract.space?.name || '...';

  // Ưu tiên dữ liệu Snapshot (đã đóng băng, đúng tại thời điểm ký) nếu có,
  // fallback về dữ liệu sống khi hợp đồng chưa ký xong hoặc snapshot chưa tải xong.
  const displayDescription = snapshot?.Description || contract.description;
  const displayPrice = snapshot?.Price ?? contract.price;
  const displayDeposit = snapshot?.DepositAmount ?? contract.depositAmount;
  const displayDuration = snapshot?.Duration ?? contract.duration;
  const displayDurationUnitLabel = snapshot
    ? formatSnapshotDurationUnit(snapshot.DurationUnit)
    : formatDurationUnit(contract.durationUnit);
  const displayAcreage = snapshot?.Acreage ?? contract.acreage;
  const displayBusinessPurpose = snapshot?.BusinessPurpose || contract.businessPurpose;
  const displayStartDate = snapshot?.StartDate || contract.startDate;
  const displayLessorName = snapshot?.LessorName || lessorName;
  const displayLesseeName = snapshot?.LesseeName || lesseeName;

  const verification = snapshot?.ContractVerification;
  const lessorSignedFinal = verification ? verification.IsLessorAgreed : lessorSigned;
  const lesseeSignedFinal = verification ? verification.IsLesseeAgreed : lesseeSigned;

  const { header: contractHeader, body: contractBody } = splitContractHeaderBody(displayDescription || '');

  // --- HÀM GỬI OTP ---
  const handleSendOtp = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('portal_token');
      const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Contract/${contract.id}/send-otp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });

      if (!response.ok) {
        const raw = await response.text().catch(() => '');
        let serverMsg = raw;
        try {
          // BE có thể trả string JSON kiểu "Bạn đã ký hợp đồng này rồi." (có ngoặc kép bao ngoài)
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'string') serverMsg = parsed;
          else if (parsed?.message) serverMsg = parsed.message;
        } catch {
          // raw không phải JSON, giữ nguyên chuỗi thô
        }

        // Đây không thực sự là lỗi - BE đang báo tài khoản này ký rồi, nên chỉ cần
        // cập nhật lại UI cho đúng thực tế, không cần alert cảnh báo người dùng.
        if (typeof serverMsg === 'string' && serverMsg.includes('đã ký')) {
          setSignStep('success');
          return;
        }

        throw new Error(serverMsg || 'Lỗi khi gửi OTP. Vui lòng thử lại!');
      }

      setSignStep('otp_sent');
      alert('Mã OTP đã được gửi đến Email của bạn. Vui lòng kiểm tra!');
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- HÀM XÁC THỰC OTP ---
  const handleValidateOtp = async () => {
    if (!otpCode.trim()) {
      alert('Vui lòng nhập mã OTP!');
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('portal_token');
      // Lưu ý: Swagger yêu cầu truyền inputOtp qua Query Parameter
      const response = await fetch(`https://flexi-space-capstone-project.onrender.com/api/Contract/${contract.id}/validate-otp?inputOtp=${encodeURIComponent(otpCode)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
      });

      if (!response.ok) {
        throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn!');
      }

      setSignStep('success');
      alert('Ký hợp đồng thành công!');
      // TODO: Có thể trigger thêm một hàm callback ra ngoài để báo Parent component refresh lại danh sách
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Chỉ cho Sửa/Thu hồi khi chưa ký thành công
  const canModify = isLessor && signStep === 'idle';

  return createPortal(
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
          .cv-scrollbar::-webkit-scrollbar { width: 6px; }
          .cv-scrollbar::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 10px; }
          .cv-card { background: #F8FAFC; border-radius: 10px; padding: 16px; border: 1px solid #E2E8F0; margin-bottom: 14px; }
          .cv-card-header { font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
          .cv-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; font-size: 13px; color: #334155; }
          .cv-row p { margin: 0; }
          .cv-btn { padding: 12px 24px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
          .cv-btn-primary { background-color: #10B981; color: white; }
          .cv-btn-primary:disabled { background-color: #A7F3D0; cursor: not-allowed; }
          .cv-btn-secondary { background-color: #E2E8F0; color: #475569; }
          .cv-terms-box { max-height: 320px; overflow-y: auto; }
          .cv-input { padding: 12px; border: 2px solid #E2E8F0; border-radius: 8px; font-size: 16px; text-align: center; letter-spacing: 2px; outline: none; transition: border-color 0.2s; }
          .cv-input:focus { border-color: #10B981; }
          .cv-action-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 12.5px; font-weight: 600; cursor: pointer; }
          @media print {
            .cv-no-print { display: none !important; }
          }
        `}
      </style>

      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          height: '90vh',
          backgroundColor: '#F1F5F9',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* HEADER */}
        <div
          className="cv-no-print"
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
            <FileText size={18} /> Chi Tiết Hợp Đồng {contract.id ? `#${contract.id}` : ''}
          </span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => window.print()}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <Printer size={20} />
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="cv-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '28px 36px', backgroundColor: '#fff' }}>
          <div style={{ textAlign: 'center', marginBottom: '8px', color: '#94A3B8', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Hợp đồng thuê mặt bằng
          </div>
          <h2 style={{ textAlign: 'center', textTransform: 'uppercase', marginBottom: '4px', fontSize: '18px', color: '#1E293B' }}>
            Hợp Đồng Thuê Mặt Bằng
          </h2>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748B', marginBottom: '16px' }}>
            Lập ngày {formatDate(contract.createdAt || new Date().toISOString())}
          </p>

          {/* Nút Sửa / Thu hồi - chỉ chủ nhà mới thấy, và chỉ khi hợp đồng chưa ký xong */}
          {canModify && (onEdit || onDelete) && (
            <div className="cv-no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="cv-action-btn"
                  style={{ border: '1px solid #CBD5E1', backgroundColor: '#fff', color: '#334155' }}
                >
                  <Edit3 size={14} /> Chỉnh sửa
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="cv-action-btn"
                  style={{ border: 'none', backgroundColor: '#FEF2F2', color: '#B91C1C' }}
                >
                  <Trash2 size={14} /> Thu hồi
                </button>
              )}
            </div>
          )}

          {/* Liên kết */}
          <div className="cv-card">
            <div className="cv-card-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={14} color="#64748B" /> Liên kết
              </span>
            </div>
            <div className="cv-row">
              <p><strong>Mặt bằng:</strong> {spaceName}</p>
              <p><strong>Mã yêu cầu đặt thuê:</strong> #{contract.primaryBookingRequestId || '...'}</p>
            </div>
          </div>

          {/* Các bên tham gia - chỉ hiện khi có tên thật (truyền từ ngoài vào, hoặc từ Snapshot) */}
          {(displayLessorName || displayLesseeName) && (
            <div className="cv-card">
              <div className="cv-card-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="#64748B" /> Các bên tham gia
                </span>
              </div>
              <div className="cv-row">
                <p><strong>Bên cho thuê:</strong> {displayLessorName || '...'}</p>
                <p><strong>Bên thuê:</strong> {displayLesseeName || '...'}</p>
              </div>
            </div>
          )}

          {/* Tài chính */}
          <div className="cv-card">
            <div className="cv-card-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wallet size={14} color="#64748B" /> Thông số Tài chính
              </span>
            </div>
            <div className="cv-row">
              <p><strong>Giá thuê:</strong> {formatCurrency(displayPrice)}</p>
              <p><strong>Tiền cọc:</strong> {formatCurrency(displayDeposit)}</p>
            </div>
          </div>

          {/* Lịch trình */}
          <div className="cv-card">
            <div className="cv-card-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CalendarDays size={14} color="#64748B" /> Lịch trình Thuê
              </span>
            </div>
            <div className="cv-row">
              <p><strong>Thời hạn:</strong> {displayDuration} {displayDurationUnitLabel}</p>
              <p><strong>Ngày bắt đầu:</strong> {formatDate(displayStartDate)}</p>
            </div>
          </div>

          {/* Diện tích & mục đích */}
          <div className="cv-card">
            <div className="cv-card-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={14} color="#64748B" /> Diện tích & Mục đích
              </span>
            </div>
            <div className="cv-row">
              <p><strong>Diện tích:</strong> {displayAcreage || '...'} m2</p>
              <p><strong>Mục đích kinh doanh:</strong> {displayBusinessPurpose || '...'}</p>
            </div>
          </div>

          {/* Nội dung điều khoản */}
          <div className="cv-card">
            <div className="cv-card-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} color="#64748B" /> Nội dung điều khoản
              </span>
              {snapshot && (
                <span style={{
                  fontSize: '10.5px', fontWeight: 700, color: '#0D9488',
                  background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.3)',
                  padding: '2px 8px', borderRadius: 999, textTransform: 'none', letterSpacing: 0,
                }}>
                  🔒 Đã khoá tại thời điểm ký
                </span>
              )}
              {loadingSnapshot && (
                <span style={{ fontSize: '10.5px', color: '#94A3B8', textTransform: 'none' }}>
                  Đang tải bản gốc...
                </span>
              )}
            </div>
            <div
              className="cv-scrollbar cv-terms-box"
              style={{
                fontFamily: "'Times New Roman', serif",
                fontSize: '13px',
                lineHeight: 1.7,
                color: '#1E293B',
                padding: '20px',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                backgroundColor: '#FEFEFE',
              }}
            >
              {displayDescription ? (
                <>
                  {contractHeader && (
                    <div style={{ textAlign: 'center', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                      {contractHeader}
                    </div>
                  )}
                  <div style={{ textAlign: 'left', whiteSpace: 'pre-wrap' }}>{contractBody}</div>
                </>
              ) : (
                <span style={{ color: '#CBD5E1', fontStyle: 'italic', fontFamily: 'system-ui' }}>
                  Không có nội dung điều khoản.
                </span>
              )}
            </div>
          </div>

          {/* Chữ ký Placeholder */}
          <div style={{ marginTop: '30px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '13px', color: '#334155' }}>
            <div style={{ width: '45%' }}>
              Bên cho thuê{displayLessorName ? ` (${displayLessorName})` : ''}<br />
              {lessorSignedFinal ? (
                <>
                  <span style={{ color: '#10B981', fontWeight: 700, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '10px' }}>
                    <CheckCircle size={14} /> Đã ký
                  </span>
                  {verification?.LessorSignedAt && (
                    <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>
                      {new Date(verification.LessorSignedAt).toLocaleString('vi-VN')}
                    </div>
                  )}
                </>
              ) : (
                <span style={{ color: '#94A3B8', fontSize: '12px', marginTop: '10px', display: 'inline-block' }}>(Ký tên)</span>
              )}
            </div>
            <div style={{ width: '45%' }}>
              Bên thuê{displayLesseeName ? ` (${displayLesseeName})` : ''}<br />
              {lesseeSignedFinal ? (
                <>
                  <span style={{ color: '#10B981', fontWeight: 700, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '10px' }}>
                    <CheckCircle size={14} /> Đã ký
                  </span>
                  {verification?.LesseeSignedAt && (
                    <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>
                      {new Date(verification.LesseeSignedAt).toLocaleString('vi-VN')}
                    </div>
                  )}
                </>
              ) : (
                <span style={{ color: '#94A3B8', fontSize: '12px', marginTop: '10px', display: 'inline-block' }}>(Ký tên)</span>
              )}
            </div>
          </div>

          {/* KHU VỰC THAO TÁC KÝ HỢP ĐỒNG ONLINE (e-Signature) */}
          <div className="cv-no-print" style={{ borderTop: '2px dashed #E2E8F0', paddingTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

            {signStep === 'idle' && (
              <>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Xác nhận và Ký điện tử Hợp đồng này thông qua OTP</p>
                <button
                  className="cv-btn cv-btn-primary"
                  onClick={handleSendOtp}
                  disabled={isProcessing}
                  style={{ width: '280px' }}
                >
                  <CheckCircle size={18} />
                  {isProcessing ? 'Đang gửi mã...' : 'Đồng Ý Ký (Nhận mã OTP)'}
                </button>
              </>
            )}

            {signStep === 'otp_sent' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Nhập mã OTP gồm 6 số đã được gửi đến Email của bạn</p>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="------"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="cv-input"
                  style={{ width: '200px' }}
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className="cv-btn cv-btn-secondary"
                    onClick={() => setSignStep('idle')}
                    disabled={isProcessing}
                  >
                    Hủy
                  </button>
                  <button
                    className="cv-btn cv-btn-primary"
                    onClick={handleValidateOtp}
                    disabled={isProcessing || otpCode.length < 6}
                  >
                    {isProcessing ? 'Đang kiểm tra...' : 'Xác Nhận Ký'}
                  </button>
                </div>
              </div>
            )}

            {signStep === 'success' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#10B981' }}>
                <CheckCircle size={40} />
                <h3 style={{ margin: 0, fontSize: '18px' }}>
                  {isFullyActive ? 'Hợp đồng đã có hiệu lực!' : 'Bạn đã ký hợp đồng này!'}
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748B', textAlign: 'center' }}>
                  {isFullyActive
                    ? 'Cả 2 bên đã hoàn tất ký kết, hợp đồng chính thức có hiệu lực.'
                    : signedByOther
                      ? 'Cả 2 bên đã ký, hợp đồng chính thức có hiệu lực.'
                      : 'Hợp đồng sẽ chính thức có hiệu lực khi Bên còn lại hoàn tất việc ký kết.'}
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};