/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { X, Printer } from 'lucide-react';

export const ContractViewModal: React.FC<{ contract: any, onClose: () => void }> = ({ contract, onClose }) => {
  if (!contract) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '800px', height: '90vh', backgroundColor: '#fff', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* HEADER */}
        <div style={{ padding: '16px 24px', backgroundColor: '#1E293B', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: '16px' }}>EtherSpace</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={() => window.print()} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Printer size={20}/></button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20}/></button>
          </div>
        </div>

        {/* NỘI DUNG HỢP ĐỒNG (DẠNG A4) */}
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '40px', color: '#333', lineHeight: '1.6' }}>
          <h1 style={{ textAlign: 'center', textTransform: 'uppercase', marginBottom: '40px' }}>Hợp đồng Thuê Mặt Bằng</h1>
          
          <p>Hợp đồng này được lập vào ngày {new Date().toLocaleDateString('vi-VN')} giữa:</p>
          <p><strong>Bên Cho Thuê:</strong> ........................................</p>
          <p><strong>Bên Thuê:</strong> ........................................</p>

          <h3 style={{ borderBottom: '2px solid #333', marginTop: '30px' }}>1. Chi tiết hợp đồng</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <p><strong>Giá thuê:</strong> {contract.price?.toLocaleString()} VNĐ</p>
            <p><strong>Tiền cọc:</strong> {contract.depositAmount?.toLocaleString()} VNĐ</p>
            <p><strong>Thời gian thuê:</strong> {contract.duration} {contract.durationUnit}</p>
            <p><strong>Ngày bắt đầu:</strong> {new Date(contract.startDate).toLocaleDateString('vi-VN')}</p>
          </div>

          <h3 style={{ borderBottom: '2px solid #333', marginTop: '30px' }}>2. Mô tả mặt bằng</h3>
          <p>{contract.description || "Mặt bằng thương mại tại vị trí trung tâm..."}</p>

          <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' }}>Bên cho thuê<br/><br/><br/>(Ký tên)</div>
            <div style={{ textAlign: 'center' }}>Bên thuê<br/><br/><br/>(Ký tên)</div>
          </div>
        </div>
      </div>
    </div>
  );
};