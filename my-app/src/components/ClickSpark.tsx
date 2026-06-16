import React, { useEffect, useState } from 'react';

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: string;
  extraScale?: number;
}

interface Spark {
  id: number;
  x: number;
  y: number;
}

export default function ClickSpark({
  sparkColor = '#00D4A0',
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = 'ease-out',
  extraScale = 1,
}: ClickSparkProps) {
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    // Lắng nghe sự kiện click trên toàn bộ trang web
    const handleClick = (e: MouseEvent) => {
      const newSpark = { id: Date.now(), x: e.clientX, y: e.clientY };
      setSparks((prev) => [...prev, newSpark]);
      
      // Dọn dẹp spark sau khi hiệu ứng kết thúc để không nặng máy
      setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.id !== newSpark.id));
      }, duration);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [duration]);

  return (
    <>
      {sparks.map((spark) => (
        <div
          key={spark.id}
          style={{
            position: 'fixed',
            left: spark.x,
            top: spark.y,
            pointerEvents: 'none',
            zIndex: 999999, // Đảm bảo luôn nổi lên trên cùng
          }}
        >
          {Array.from({ length: sparkCount }).map((_, i) => {
            // Tính toán góc bắn ra cho từng hạt (tỏa tròn đều)
            const angle = (i * 2 * Math.PI) / sparkCount;
            const distance = sparkRadius * extraScale;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: sparkSize,
                  height: sparkSize,
                  borderRadius: '50%',
                  backgroundColor: sparkColor,
                  transform: 'translate(-50%, -50%)',
                  animation: `spark-anim ${duration}ms ${easing} forwards`,
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      ))}
      
      {/* CSS Keyframes xử lý hiệu ứng nổ và mờ dần */}
      <style>{`
        @keyframes spark-anim {
          0% { 
            transform: translate(-50%, -50%) scale(1); 
            opacity: 1; 
          }
          100% { 
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0); 
            opacity: 0; 
          }
        }
      `}</style>
    </>
  );
}