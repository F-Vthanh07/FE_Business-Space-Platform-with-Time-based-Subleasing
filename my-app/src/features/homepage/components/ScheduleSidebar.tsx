// src/features/homepage/components/ScheduleSidebar.tsx
import React, { useState } from 'react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';

export const ScheduleSidebar: React.FC = () => {
  const { language } = useThemeLanguage();
  const [simulateConflict, setSimulateConflict] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(1); // 0, 1, 2

  return (
    <div className="detail-sidebar">
      <div className="showcase-card">
        <div className="showcase-header">
          <div>
            <span className="showcase-badge-active">
              {language === 'en' ? 'Selected Venue' : 'Mặt bằng đang chọn'}
            </span>
            <h3 className="showcase-title">
              {language === 'en' ? 'Hourly Sharing Schedule' : 'Lịch trình phân bổ theo giờ'}
            </h3>
          </div>
          
          <div className="ai-simulate-box">
            <span style={{ fontSize: 12, fontWeight: 700, color: '#4B5563' }}>
              {language === 'en' ? 'Simulate AI Conflict Check:' : 'Mô phỏng Xung đột AI:'}
            </span>
            <input
              type="checkbox"
              checked={simulateConflict}
              onChange={(e) => {
                setSimulateConflict(e.target.checked);
                if (e.target.checked) setSelectedSlot(2);
              }}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#00D4A0' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
          <div className="showcase-slots-list">
            
            {/* Slot 1 */}
            <div className={`showcase-slot-row ${selectedSlot === 0 ? 'showcase-slot-row--selected' : ''}`} onClick={() => setSelectedSlot(0)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="slot-index-circle">1</div>
                <div>
                  <div className="showcase-slot-time">08:00 - 12:00</div>
                  <div className="showcase-slot-desc">Morning Specialty Cafe Pop-up</div>
                </div>
              </div>
              <span className="showcase-slot-badge slot-badge-booked">Booked</span>
            </div>

            {/* Slot 2 */}
            <div className={`showcase-slot-row ${selectedSlot === 1 ? 'showcase-slot-row--selected' : ''}`} onClick={() => setSelectedSlot(1)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="slot-index-circle">2</div>
                <div>
                  <div className="showcase-slot-time">13:00 - 17:00</div>
                  <div className="showcase-slot-desc">Afternoon Accessories pop-up</div>
                </div>
              </div>
              <span className="showcase-slot-badge slot-badge-available">Available</span>
            </div>

            {/* Slot 3 (Conflict Demo) */}
            <div className={`showcase-slot-row ${selectedSlot === 2 ? 'showcase-slot-row--selected' : ''}`} onClick={() => setSelectedSlot(2)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="slot-index-circle">3</div>
                <div>
                  <div className="showcase-slot-time">18:00 - 22:00</div>
                  <div className="showcase-slot-desc">Evening Designer Showcase</div>
                </div>
              </div>
              <span className={`showcase-slot-badge ${simulateConflict ? 'slot-badge-conflict' : 'slot-badge-booked'}`}>
                {simulateConflict ? 'Conflict' : 'Booked'}
              </span>
            </div>

          </div>

          <div className="showcase-console">
            <div className="console-stat-box">
              <span className="console-stat-title">{language === 'en' ? 'Proposed Price:' : 'Mức giá đề xuất:'}</span>
              <div className="console-stat-value">400,000 VND / hr</div>
            </div>

            <button className="search-btn-main btn-rent-now">
              {language === 'en' ? 'Rent This Slot Now' : 'Thuê Slot Này Ngay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};