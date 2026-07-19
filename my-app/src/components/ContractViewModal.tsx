/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { X, Printer, FileText, Wallet, CalendarDays, Building2, Briefcase } from 'lucide-react';
import { splitContractHeaderBody } from './contractTemplates';

interface ContractViewModalProps {
  contract: any;
  onClose: () => void;
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

export const ContractViewModal: React.FC<ContractViewModalProps> = ({ contract, onClose }) => {
  if (!contract) return null;

  const spaceName = contract.spaceName || contract.space?.name || '...';
  const { header: contractHeader, body: contractBody } = splitContractHeaderBody(contract.description || '');

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
          .cv-scrollbar::-webkit-scrollbar { width: 6px; }
          .cv-scrollbar::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 10px; }
          .cv-card { background: #F8FAFC; border-radius: 10px; padding: 16px; border: 1px solid #E2E8F0; margin-bottom: 14px; }
          .cv-card-header { font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
          .cv-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; font-size: 13px; color: #334155; }
          .cv-row p { margin: 0; }
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
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748B', marginBottom: '24px' }}>
            Lập ngày {formatDate(contract.createdAt || new Date().toISOString())}
          </p>

          {/* Liên kết */}
          <div className="cv-card">
            <div className="cv-card-header">
              <Briefcase size={14} color="#64748B" /> Liên kết
            </div>
            <div className="cv-row">
              <p><strong>Mặt bằng:</strong> {spaceName}</p>
              <p><strong>Mã yêu cầu đặt thuê:</strong> #{contract.primaryBookingRequestId || '...'}</p>
            </div>
          </div>

          {/* Tài chính */}
          <div className="cv-card">
            <div className="cv-card-header">
              <Wallet size={14} color="#64748B" /> Thông số Tài chính
            </div>
            <div className="cv-row">
              <p><strong>Giá thuê:</strong> {formatCurrency(contract.price)}</p>
              <p><strong>Tiền cọc:</strong> {formatCurrency(contract.depositAmount)}</p>
            </div>
          </div>

          {/* Lịch trình */}
          <div className="cv-card">
            <div className="cv-card-header">
              <CalendarDays size={14} color="#64748B" /> Lịch trình Thuê
            </div>
            <div className="cv-row">
              <p><strong>Thời hạn:</strong> {contract.duration} {formatDurationUnit(contract.durationUnit)}</p>
              <p><strong>Ngày bắt đầu:</strong> {formatDate(contract.startDate)}</p>
            </div>
          </div>

          {/* Diện tích & mục đích */}
          <div className="cv-card">
            <div className="cv-card-header">
              <Building2 size={14} color="#64748B" /> Diện tích & Mục đích
            </div>
            <div className="cv-row">
              <p><strong>Diện tích:</strong> {contract.acreage || '...'} m2</p>
              <p><strong>Mục đích kinh doanh:</strong> {contract.businessPurpose || '...'}</p>
            </div>
          </div>

          {/* Nội dung điều khoản */}
          <div className="cv-card">
            <div className="cv-card-header">
              <FileText size={14} color="#64748B" /> Nội dung điều khoản
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
                minHeight: '200px',
                backgroundColor: '#FEFEFE',
              }}
            >
              {contract.description ? (
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

          {/* Chữ ký */}
          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '13px', color: '#334155' }}>
            <div>Bên cho thuê<br /><br /><br />(Ký tên)</div>
            <div>Bên thuê<br /><br /><br />(Ký tên)</div>
          </div>
        </div>
      </div>
    </div>
  );
};