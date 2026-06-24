import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Shuffle = ({ text }: { text: string }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      // Trong Shuffle.tsx, hãy chắc chắn style này của Shuffle khớp với chữ "Ether"
    style={{ 
        display: 'inline-flex',
        fontFamily: "'Press Start 2P', cursive", 
        color: '#00D4A0',
        cursor: 'pointer',
        lineHeight: 'inherit', // Dùng thừa hưởng từ cha
        fontSize: 'inherit',   // Nhận size từ cha
        alignItems: 'center',   // Căn giữa các ký tự

        marginTop: '-4px' // Điều chỉnh nhẹ để căn giữa với "Ether"
    }}
    >
      {text.split('').map((char, index) => (
        <LetterSlide 
          key={index} 
          char={char} 
          isHovered={isHovered} 
          delay={index % 2 === 0 ? 0.2 : 0} 
        />
      ))}
    </span>
  );
};

const LetterSlide = ({ char, isHovered, delay }: { char: string, isHovered: boolean, delay: number }) => {
  return (
    // Dùng width cố định để tránh bị mất chữ
    <div style={{ position: 'relative', width: '25px', height: '30px', overflow: 'hidden' }}>
      <AnimatePresence mode="popLayout">
        {!isHovered ? (
          <motion.span
            key="old"
            initial={{ x: 0 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.3, delay }}
            style={{ position: 'absolute', display: 'inline-block' }}
          >
            {char}
          </motion.span>
        ) : (
          <motion.span
            key="new"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay }}
            style={{ position: 'absolute', display: 'inline-block' }}
          >
            {char}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};