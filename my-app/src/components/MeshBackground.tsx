import React from 'react';

interface MeshBackgroundProps {
  children: React.ReactNode;
}

export const MeshBackground: React.FC<MeshBackgroundProps> = ({ children }) => {
  return (
    <>
      <div className="mesh-bg" />
      <div className="mesh-bg-accent" />
      {children}
    </>
  );
};
