import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Shuffle.css';

export const Shuffle = ({ text }: { text: string }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        display: 'inline-flex',
        fontFamily: "'Press Start 2P', cursive", 
        color: '#00D4A0',
        cursor: 'pointer',
        lineHeight: 'inherit',
        fontSize: 'inherit',
        alignItems: 'center',
        marginTop: '2px'
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
    <div style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}>
      <span style={{ visibility: 'hidden', display: 'inline-block' }}>{char === ' ' ? '\u00A0' : char}</span>
      <AnimatePresence mode="popLayout">
        {!isHovered ? (
          <motion.span
            key="old"
            initial={{ x: 0, opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.3, delay }}
            style={{ position: 'absolute', top: 0, left: 0, display: 'inline-block' }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ) : (
          <motion.span
            key="new"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay }}
            style={{ position: 'absolute', top: 0, left: 0, display: 'inline-block' }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};