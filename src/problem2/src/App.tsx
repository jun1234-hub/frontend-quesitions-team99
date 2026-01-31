import { useRef, useCallback } from 'react';
import { SwapCard } from './components/SwapCard';
import type { SwapCardRef } from './components/SwapCard';
import { FloatingTokens, type TokenDropResult } from './components/FloatingTokens';
import { TypewriterEffect } from './components/TypewriterEffect';
import type { Token } from './types/token';
import './App.css';

const TYPEWRITER_WORDS = [
  'instantly',
  'securely',
  'seamlessly',
  'globally',
  'effortlessly',
];

function App() {
  const swapCardRef = useRef<SwapCardRef>(null);

  const handleTokenDragEnd = useCallback((token: Token, position: { x: number; y: number }): TokenDropResult | void => {
    if (!swapCardRef.current) return;

    const dropZones = swapCardRef.current.getDropZones();
    const padding = 16;

    // Check if dropped on "from" zone
    if (dropZones.from) {
      const { left, right, top, bottom } = dropZones.from;
      if (position.x >= left - padding && position.x <= right + padding && position.y >= top - padding && position.y <= bottom + padding) {
        swapCardRef.current.setFromToken(token);
        return {
          accepted: true,
          zone: 'from',
          target: { x: (left + right) / 2, y: (top + bottom) / 2 },
        };
      }
    }

    // Check if dropped on "to" zone
    if (dropZones.to) {
      const { left, right, top, bottom } = dropZones.to;
      if (position.x >= left - padding && position.x <= right + padding && position.y >= top - padding && position.y <= bottom + padding) {
        swapCardRef.current.setToToken(token);
        return {
          accepted: true,
          zone: 'to',
          target: { x: (left + right) / 2, y: (top + bottom) / 2 },
        };
      }
    }

    return { accepted: false };
  }, []);

  return (
    <div className="app">
      {/* Uniswap-style floating tokens background */}
      <FloatingTokens onTokenDragEnd={handleTokenDragEnd} />

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="url(#logo-gradient)" strokeWidth="2" />
            <path
              d="M10 16L14 20L22 12"
              stroke="url(#logo-gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#FF007A" />
                <stop offset="1" stopColor="#FF5CAA" />
              </linearGradient>
            </defs>
          </svg>
          <span>SwapX</span>
        </div>
        <div className="nav-links">
          <a href="#" className="nav-link active">Swap</a>
          <a href="#" className="nav-link">Pool</a>
          <a href="#" className="nav-link">Bridge</a>
        </div>
        <button className="connect-wallet">Connect Wallet</button>
      </nav>

      {/* Main Content */}
      <main className="main">
        <div className="main-content">
          <TypewriterEffect words={TYPEWRITER_WORDS} />
          <p className="tagline">Trade crypto with the best rates across multiple chains</p>
          <SwapCard ref={swapCardRef} />
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <span>Powered by Switcheo</span>
      </footer>
    </div>
  );
}

export default App;
