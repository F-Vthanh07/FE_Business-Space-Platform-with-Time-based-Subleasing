// src/features/homepage/components/HomeSearchBar.tsx
import React from 'react';
import { Filter, CheckCircle } from 'lucide-react';

export const HomeSearchBar: React.FC = () => {
  return (
    <div className="home-search-wrapper">

      {/* THANH LỌC CHUYÊN NGHIỆP */}
      <div className="hs-filter-bar">
        <button className="hs-filter-btn active">
          <Filter size={16} />
          Lọc
          <span className="hs-count">3</span>
        </button>

        <div className="hs-toggle-group">
          <CheckCircle size={16} color="#00A67E" />
          <span>Tin xác thực</span>
          <div className="hs-toggle-switch active"></div>
        </div>

        <select className="hs-select-box">
          <option>Loại hình</option>
          <option>Mặt bằng kinh doanh</option>
          <option>Văn phòng</option>
          <option>Kho xưởng</option>
        </select>

        <select className="hs-select-box">
          <option>Khoảng giá</option>
          <option>Dưới 10 triệu</option>
          <option>10 - 20 triệu</option>
          <option>20 - 50 triệu</option>
          <option>Trên 50 triệu</option>
        </select>

        <select className="hs-select-box">
          <option>Diện tích</option>
          <option>Dưới 50 m²</option>
          <option>50 - 100 m²</option>
          <option>100 - 200 m²</option>
          <option>Trên 200 m²</option>
        </select>


      </div>

      {/* DẢI TAG ĐỊA ĐIỂM (Breadcrumb) */}
      <div className="hs-breadcrumb-bar">
        <span className="hs-text">Cho thuê / Hồ Chí Minh /</span>
        <div className="hs-pills-list">
          <button className="hs-pill">Thuê Quận 7</button>
          <button className="hs-pill">Thuê Bình Thạnh</button>
          <button className="hs-pill">Thuê Quận 8</button>
          <button className="hs-pill">Thuê Quận 2</button>
          <button className="hs-pill">Thuê Quận 1</button>
          <button className="hs-pill">Thuê Thủ Đức</button>
        </div>
      </div>

    </div>
  );
};