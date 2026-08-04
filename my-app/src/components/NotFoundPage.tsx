import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/routes';
import FuzzyText from './FuzzyText'; 

// Import ảnh từ thư mục assets
import image404 from '../assets/404.jpg'; 

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      color: '#ffffff'
    }}>
      {/* 
        Style tag để tạo hiệu ứng nhiễu (glitch) và chớp tắt (flicker) cho background.
        Bạn có thể điều chỉnh thời gian (0.15s, 4s) để ảnh nhiễu nhanh hay chậm.
      */}
      <style>
        {`
          @keyframes bg-glitch {
            0% { transform: translate(0); filter: hue-rotate(0deg) contrast(1); }
            20% { transform: translate(-4px, 3px); filter: hue-rotate(10deg) contrast(1.2); }
            40% { transform: translate(4px, -3px); filter: hue-rotate(-10deg) contrast(1.1); }
            60% { transform: translate(-3px, -4px); filter: hue-rotate(15deg) contrast(1.3); }
            80% { transform: translate(4px, 4px); filter: hue-rotate(-15deg) contrast(1.2); }
            100% { transform: translate(0); filter: hue-rotate(0deg) contrast(1); }
          }
          
          @keyframes bg-flicker {
            0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
            20%, 24%, 55% { opacity: 0.6; }
          }

          .fullscreen-glitch-bg {
            position: absolute;
            /* Scale to to bù trừ khoảng hụt khi bị dịch chuyển (transform) */
            top: -10px; left: -10px; right: -10px; bottom: -10px; 
            background-image: url(${image404});
            background-size: cover;
            background-position: center;
            z-index: -2;
            animation: bg-glitch 0.15s infinite linear alternate, bg-flicker 4s infinite;
          }

          .dark-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.7); /* Lớp phủ đen 70% để làm nổi chữ */
            z-index: -1;
          }
        `}
      </style>

      {/* Background Layer */}
      <div className="fullscreen-glitch-bg"></div>
      
      {/* Lớp phủ tối mờ */}
      <div className="dark-overlay"></div>
      
      {/* Content Layer (Chữ và Nút nằm trên cùng) */}
      <div style={{ position: 'relative', zIndex: 1, padding: '0 20px' }}>
        
        <div style={{ margin: '0', cursor: 'pointer' }}>
          <FuzzyText 
            baseIntensity={0.2} 
            hoverIntensity={0.8} 
            enableHover={true}
            color="#00D4A0" 
            fontSize="clamp(5rem, 15vw, 10rem)" 
            fontWeight={900}
            direction="horizontal"
          >
            404
          </FuzzyText>
        </div>

        <h2 style={{ fontSize: '2.5rem', margin: '0 0 15px 0', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
          Ôi hỏng! Trang này không tồn tại.
        </h2>
        
        <p style={{ fontSize: '1.2rem', color: '#cccccc', marginBottom: '40px', maxWidth: '600px', textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>
          Có vẻ như bạn đã đi lạc vào một không gian không xác định (The Backrooms) hoặc đường dẫn đã bị hỏng.
        </p>
        
        <button
          onClick={() => navigate(ROUTES.HOME)}
          style={{
            padding: '16px 40px',
            fontSize: '1.2rem',
            backgroundColor: '#00D4A0',
            color: '#000000',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 0 20px rgba(0, 212, 160, 0.4)',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 212, 160, 0.7)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 212, 160, 0.4)';
          }}
        >
          Quay Về Trang Chủ
        </button>
      </div>

    </div>
  );
};