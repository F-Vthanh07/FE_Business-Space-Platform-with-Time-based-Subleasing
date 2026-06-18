// src/features/homepage/components/TopAgentsWidget.tsx
import React from 'react';
import { Star, Award } from 'lucide-react';

export const TopAgentsWidget: React.FC = () => {
  const agents = [
    { name: 'Ms Lê Hương', active: '175 tin phù hợp', color: '#ff6b6b' },
    { name: 'Ngọc Thúy', active: '161 tin phù hợp', color: '#ff9ff3' },
    { name: 'Mỹ Hạnh', active: '150 tin phù hợp', color: '#feca57' },
    { name: 'Trần Công Thành', active: '132 tin phù hợp', color: '#48dbfb' },
    { name: 'Đặng Đình Thịnh', active: '130 tin phù hợp', color: '#1dd1a1' },
  ];

  return (
    <div className="top-agents-card">
      <div className="top-agents-header">
        <Award size={32} color="#00D4A0" style={{ marginBottom: 8 }} />
        <h3 style={{ margin: 0, fontSize: '15px', color: '#111827', fontWeight: 800, textAlign: 'center' }}>
          TOP 20 Môi giới<br/>chuyên nghiệp tại TP.HCM
        </h3>
      </div>
      
      <div className="top-agents-list">
        {agents.map((agent, i) => (
          <div key={i} className="agent-row">
            <div className="agent-avatar" style={{ backgroundColor: agent.color }}>
              {agent.name.charAt(0)}
              <div className="agent-badge"><Star size={8} fill="#fff" color="#fff" /></div>
            </div>
            <div>
              <div className="agent-name">{agent.name}</div>
              <div className="agent-stats">{agent.active}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="agent-dots">
        <span className="dot active"></span>
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </div>
  );
};