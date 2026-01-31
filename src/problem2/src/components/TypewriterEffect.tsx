import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import './TypewriterEffect.css';

interface TypewriterEffectProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetweenWords?: number;
}

export function TypewriterEffect({
  words,
  typingSpeed = 80,
  deletingSpeed = 40,
  delayBetweenWords = 1500,
}: TypewriterEffectProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          // Typing
          if (currentText.length < currentWord.length) {
            setCurrentText(currentWord.slice(0, currentText.length + 1));
            setIsComplete(false);
          } else {
            // Finished typing - show highlight
            setIsComplete(true);
            // Wait then start deleting
            setTimeout(() => {
              setIsComplete(false);
              setIsDeleting(true);
            }, delayBetweenWords);
          }
        } else {
          // Deleting
          if (currentText.length > 0) {
            setCurrentText(currentText.slice(0, -1));
          } else {
            // Finished deleting, move to next word
            setIsDeleting(false);
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? deletingSpeed : typingSpeed
    );

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, delayBetweenWords]);

  return (
    <div className="typewriter-container">
      <span className="typewriter-static">Swap tokens </span>
      <span className={`typewriter-dynamic ${isComplete ? 'highlight' : ''}`}>
        <span className="typewriter-text">
          {currentText.split('').map((char, index) => (
            <motion.span
              key={`${currentWordIndex}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.1,
                ease: 'easeOut',
              }}
              className="typewriter-char"
            >
              {char}
            </motion.span>
          ))}
        </span>
        {!isComplete && (
          <motion.span
            className="typewriter-cursor"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.4, repeat: Infinity, repeatType: 'reverse' }}
          >
            |
          </motion.span>
        )}
      </span>
    </div>
  );
}
