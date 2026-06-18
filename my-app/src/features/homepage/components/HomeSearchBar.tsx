// src/features/homepage/components/HomeSearchBar.tsx
import React from 'react';
import { Filter, CheckCircle, Map } from 'lucide-react';

export const HomeSearchBar: React.FC = () => {
  return (
    <div className="home-search-wrapper">
      {/* THANH LỌC CHUYÊN NGHIỆP */}
      <div className="hs-filter-bar">
        <button className="hs-filter-btn active">
          <Filter size={16} /> Lọc <span className="hs-count">3</span>
        </button>
        
        <div className="hs-toggle-group">
          <CheckCircle size={16} color="#00A67E" /> 
          <span>Tin xác thực</span>
          <div className="hs-toggle-switch active"></div>
        </div>

        <select className="hs-select-box"><option>Loại hình</option></select>
        <select className="hs-select-box"><option>Khoảng giá</option></select>
        <select className="hs-select-box"><option>Diện tích</option></select>
        
        <button className="hs-map-btn"><Map size={16} /> Xem bản đồ</button>
      </div>

      {/* DẢI TAG ĐỊA ĐIỂM (Breadcrumb) */}
      <div className="hs-breadcrumb-bar">
        <span className="hs-text">Cho thuê / Hồ Chí Minh /</span>
        <div className="hs-pills-list">
          <button className="hs-pill">Thuê Quận 7</button>
          <button className="hs-pill">Thuê Bình Thạnh</button>
          <button className="hs-pill">Thuê Quận 8</button>
          <button className="hs-pill">Thuê Quận 2</button>
        </div>
      </div>
    </div>
  );
};