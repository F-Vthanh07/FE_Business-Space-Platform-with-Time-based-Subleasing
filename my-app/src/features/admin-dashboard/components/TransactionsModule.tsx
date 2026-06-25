import React from 'react';

interface TransactionsModuleProps {
  language: 'en' | 'vi';
}

export const TransactionsModule: React.FC<TransactionsModuleProps> = ({ language }) => {
  return (
    <div className="admin-module animate-fade-in">
      <header className="module-header">
        <h1>{language === 'en' ? 'Subleasing Transactions' : 'Hệ thống Giao dịch'}</h1>
        <p>{language === 'en' ? 'Monitor escrow nodes and hourly contract payouts' : 'Theo dõi hệ thống ví ký quỹ và dòng tiền thanh toán dịch vụ'}</p>
      </header>

      <div className="admin-table-container glass-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>TXID</th>
              <th>{language === 'en' ? 'Space Location' : 'Địa điểm'}</th>
              <th>{language === 'en' ? 'Renter' : 'Người thuê'}</th>
              <th>{language === 'en' ? 'Amount' : 'Số tiền'}</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-mono">TX88301</td>
              <td>Ether Workspace Quận 1</td>
              <td>Trần Thị B</td>
              <td>1,500,000 đ</td>
              <td><span className="badge-status active">{language === 'en' ? 'Completed' : 'Hoàn thành'}</span></td>
              <td>2026-06-24</td>
            </tr>
            <tr>
              <td className="font-mono">TX88302</td>
              <td>Co-working Space Cầu Giấy</td>
              <td>Nguyễn Văn A</td>
              <td>2,000,000 đ</td>
              <td><span className="badge-status active">{language === 'en' ? 'Completed' : 'Hoàn thành'}</span></td>
              <td>2026-06-23</td>
            </tr>
            <tr>
              <td className="font-mono">TX88303</td>
              <td>Nhà kho thương mại Thủ Đức</td>
              <td>Lê Hoàng C</td>
              <td>3,200,000 đ</td>
              <td><span className="badge-status pending">{language === 'en' ? 'Escrow Escaped' : 'Ký quỹ tạm giữ'}</span></td>
              <td>2026-06-22</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
