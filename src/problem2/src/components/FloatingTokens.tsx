import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import type { Token } from '../types/token';
import { fetchTokenPrices } from '../services/tokenService';
import './FloatingTokens.css';

interface FloatingToken extends Token {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  priceChange: number; // Simulated 24h change
}

export type TokenDropResult =
  | {
      accepted: true;
      target: { x: number; y: number };
      zone: 'from' | 'to';
    }
  | {
      accepted: false;
    };

interface FloatingTokensProps {
  onTokenDragStart?: (token: Token) => void;
  onTokenDragEnd?: (token: Token, position: { x: number; y: number }) => void | TokenDropResult;
}

interface TokenFlyout {
  id: string;
  symbol: string;
  token: Token;
  size: number;
  start: { x: number; y: number };
  target: { x: number; y: number };
}

// Generate random price change between -15% and +15%
const generatePriceChange = () => {
  return (Math.random() - 0.5) * 30;
};

// Generate random position ensuring tokens don't overlap with center card
const generatePosition = (index: number): { x: number; y: number } => {
  const positions = [
    { x: 8, y: 10 },   // top-left
    { x: 85, y: 8 },   // top-right
    { x: 5, y: 45 },   // middle-left
    { x: 88, y: 40 },  // middle-right
    { x: 12, y: 75 },  // bottom-left
    { x: 82, y: 78 },  // bottom-right
    { x: 25, y: 15 },  // top-left-center
    { x: 70, y: 12 },  // top-right-center
    { x: 8, y: 30 },   // upper-left
    { x: 90, y: 25 },  // upper-right
    { x: 15, y: 85 },  // bottom-left-low
    { x: 78, y: 85 },  // bottom-right-low
  ];

  return positions[index % positions.length];
};

const getEventClientPoint = (
  event: MouseEvent | TouchEvent | PointerEvent
): { x: number; y: number } | null => {
  if ('clientX' in event && typeof event.clientX === 'number') {
    return { x: event.clientX, y: event.clientY };
  }
  if ('changedTouches' in event && event.changedTouches.length > 0) {
    const touch = event.changedTouches[0];
    return { x: touch.clientX, y: touch.clientY };
  }
  return null;
};

export function FloatingTokens({ onTokenDragStart, onTokenDragEnd }: FloatingTokensProps) {
  const [floatingTokens, setFloatingTokens] = useState<FloatingToken[]>([]);
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);
  const [draggingToken, setDraggingToken] = useState<string | null>(null);
  const [flyouts, setFlyouts] = useState<TokenFlyout[]>([]);
  const [hiddenTokens, setHiddenTokens] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    async function loadTokens() {
      try {
        const tokens = await fetchTokenPrices();
        // Select 10 random tokens for floating display
        const selected = tokens
          .sort(() => Math.random() - 0.5)
          .slice(0, 10)
          .map((token, index) => {
            const pos = generatePosition(index);
            return {
              ...token,
              x: pos.x,
              y: pos.y,
              size: 50 + Math.random() * 30,
              delay: Math.random() * 2,
              duration: 15 + Math.random() * 10,
              priceChange: generatePriceChange(),
            };
          });
        setFloatingTokens(selected);
      } catch (err) {
        console.error('Failed to load tokens for background:', err);
      }
    }

    loadTokens();
  }, []);

  return (
    <div className="floating-tokens-container">
      {/* Colored blur orbs */}
      <div className="blur-orb orb-yellow" />
      <div className="blur-orb orb-purple" />
      <div className="blur-orb orb-green" />
      <div className="blur-orb orb-pink" />
      <div className="blur-orb orb-blue" />

      {/* Fly-to-slot overlay */}
      <div className="token-flyout-layer" aria-hidden="true">
        {flyouts.map((flyout) => {
          const dx = flyout.target.x - flyout.start.x;
          const dy = flyout.target.y - flyout.start.y;
          return (
            <motion.div
              key={flyout.id}
              className="token-flyout"
              style={{
                left: flyout.start.x,
                top: flyout.start.y,
                width: flyout.size,
                height: flyout.size,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: dx, y: dy, opacity: 0, scale: 0.72 }}
              transition={{
                x: { type: 'spring', stiffness: 420, damping: 32, mass: 0.6 },
                y: { type: 'spring', stiffness: 420, damping: 32, mass: 0.6 },
                opacity: { duration: 0.25, ease: 'easeOut' },
                scale: { duration: 0.45, ease: 'easeOut' },
              }}
              onAnimationComplete={() => {
                setFlyouts((prev) => prev.filter((f) => f.id !== flyout.id));
                setHiddenTokens((prev) => {
                  const next = new Set(prev);
                  next.delete(flyout.symbol);
                  return next;
                });
              }}
            >
              <div className="token-ring">
                <img
                  src={flyout.token.iconUrl}
                  alt=""
                  className="token-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="token-fallback" style={{ display: 'none' }}>
                  {flyout.token.symbol.charAt(0)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floating tokens */}
      {floatingTokens.map((token) => (
        hiddenTokens.has(token.symbol) ? null : (
        <motion.div
          key={token.symbol}
          className={`floating-token ${hoveredToken === token.symbol ? 'hovered' : ''} ${draggingToken === token.symbol ? 'dragging' : ''}`}
          style={{
            left: `${token.x}%`,
            top: `${token.y}%`,
            width: token.size,
            height: token.size,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={draggingToken === token.symbol ? {} : {
            opacity: 1,
            scale: 1,
            y: [0, -15, 0, 10, 0],
            x: [0, 5, -5, 3, 0],
          }}
          transition={{
            opacity: { duration: 0.5, delay: token.delay },
            scale: { duration: 0.5, delay: token.delay },
            y: {
              duration: token.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            x: {
              duration: token.duration * 1.3,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
          drag
          dragSnapToOrigin
          dragElastic={0.1}
          whileDrag={{ scale: 1.2, zIndex: 100 }}
          onDragStart={() => {
            setHoveredToken(null);
            setDraggingToken(token.symbol);
            onTokenDragStart?.(token);
          }}
          onDragEnd={(event, info) => {
            setDraggingToken(null);
            setHoveredToken(null);
            const eventPoint = getEventClientPoint(event);
            const rect = event.currentTarget instanceof HTMLElement
              ? event.currentTarget.getBoundingClientRect()
              : null;
            const tokenCenter = rect
              ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
              : null;

            const dropPosition = tokenCenter ?? eventPoint ?? { x: info.point.x, y: info.point.y };
            const result = onTokenDragEnd?.(token, dropPosition);

            if (result?.accepted && result.target && rect) {
              const start = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

              const id = `${token.symbol}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
              setHiddenTokens((prev) => new Set(prev).add(token.symbol));
              setFlyouts((prev) => [
                ...prev,
                {
                  id,
                  symbol: token.symbol,
                  token,
                  size: token.size,
                  start,
                  target: result.target,
                },
              ]);
            }
          }}
          onMouseEnter={() => setHoveredToken(token.symbol)}
          onMouseLeave={() => setHoveredToken(null)}
        >
          <div className="token-ring">
            <img
              src={token.iconUrl}
              alt={token.symbol}
              className="token-image"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="token-fallback" style={{ display: 'none' }}>
              {token.symbol.charAt(0)}
            </div>
          </div>

          {/* Hover tooltip with price info */}
          <motion.div
            className="token-tooltip"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{
              opacity: hoveredToken === token.symbol ? 1 : 0,
              y: hoveredToken === token.symbol ? 0 : 10,
              scale: hoveredToken === token.symbol ? 1 : 0.9,
            }}
            transition={{ duration: 0.2 }}
          >
            <span className="tooltip-symbol">{token.symbol}</span>
            <span className="tooltip-price">
              ${token.price < 1
                ? token.price.toFixed(4)
                : token.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </span>
            <span className={`tooltip-change ${token.priceChange >= 0 ? 'positive' : 'negative'}`}>
              {token.priceChange >= 0 ? '▲' : '▼'} {Math.abs(token.priceChange).toFixed(2)}%
            </span>
          </motion.div>
        </motion.div>
        )
      ))}
    </div>
  );
}
