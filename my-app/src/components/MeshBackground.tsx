import React from 'react';
import './MeshBackground.css';

interface MeshBackgroundProps {
  children: React.ReactNode;
}

export const MeshBackground: React.FC<MeshBackgroundProps> = ({ children }) => {
  return (
    <div className="mesh-container">
      <div className="mesh-bg" />
      <div className="mesh-bg-accent" />
      <div className="mesh-content">
        {children}
      </div>
    </div>
  );
};