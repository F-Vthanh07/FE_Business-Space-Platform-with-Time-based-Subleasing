// src/features/homepage/components/HomeListings.tsx
import React, { useState } from 'react';
import { Heart, ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { mockListings } from './homeData';

interface HomeListingsProps {
  onCardClick: (id: string) => void;
  selectedId: string;
}

export const HomeListings: React.FC<HomeListingsProps> = ({ onCardClick, selectedId }) => {
  // Logic Phân trang (Pagination)
  const ITEMS_PER_PAGE = 4;
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(mockListings.length / ITEMS_PER_PAGE);
  const currentItems = mockListings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="listings-column">
      <div className="listings-header">
        <h3>Cho Thuê Mặt Bằng, Kiot TP.HCM Giá Tốt Nhất</h3>
        <span className="sort-by">
          Hiện có 3.260 bất động sản. &nbsp;&nbsp;|&nbsp;&nbsp; Sắp xếp: <span className="active-sort">Mặc định</span>
        </span>
      </div>

      {currentItems.map((item) => (
        <div
          key={item.id}
          className={`listing-card-complex gsap-listing-card ${selectedId === item.id ? 'selected' : ''}`}
          onClick={() => onCardClick(item.id)}
        >
          {/* Khối Ảnh (1 To bên trái, 2 Nhỏ bên phải) */}
          <div className="complex-images-block">
            <div className="img-main">
              <img src={item.images[0]} alt="Main" />
              <div className="img-count-badge">📸 14</div>
            </div>
            <div className="img-thumbs">
              <img src={item.images[1]} alt="Thumb 1" />
              <img src={item.images[2]} alt="Thumb 2" />
            </div>
          </div>
          
          {/* Khối Thông Tin */}
          <div className="complex-info-block">
            <h4 className="complex-title">{item.name}</h4>
            <div className="complex-price-row">
              <span className="price-text">{item.price} {item.period}</span>
              <span className="dot-sep">•</span>
              <span>{item.area}</span>
              <span className="dot-sep">•</span>
              <span>{item.type}</span>
            </div>
            <p className="complex-loc">📍 {item.loc}</p>
            <p className="complex-desc">{item.description}</p>
            
            {/* Khối Agent ở đáy */}
            <div className="complex-agent-footer">
              <div className="agent-info-left">
                <div className="agent-avatar-mini">{item.agent.avatar}</div>
                <div>
                  <div className="agent-name-mini">{item.agent.name}</div>
                  <div className="agent-time">{item.agent.posted}</div>
                </div>
              </div>
              <div className="agent-actions">
                <button className="btn-call"><Phone size={14}/> {item.agent.phone} - Hiện số</button>
                <button className="btn-heart"><Heart size={16} color="#6B7280" /></button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* THANH PHÂN TRANG (PAGINATION) DYNAMIC */}
      <div className="pagination-container">
        <button 
          className="page-btn" 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
        </button>
        
        {[...Array(totalPages)].map((_, i) => (
          <button 
            key={i}
            className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`} 
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        
        <span className="page-dots">...</span>
        <button className="page-btn">142</button>
        
        <button 
          className="page-btn"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};