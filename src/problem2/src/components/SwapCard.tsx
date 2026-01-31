import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Token } from '../types/token';
import {
  fetchTokenPrices,
  calculateExchangeRate,
  formatNumber,
} from '../services/tokenService';
import { TokenSelector } from './TokenSelector';
import './SwapCard.css';

export interface SwapCardRef {
  getDropZones: () => { from: DOMRect | null; to: DOMRect | null };
  setFromToken: (token: Token) => void;
  setToToken: (token: Token) => void;
}

export const SwapCard = forwardRef<SwapCardRef>(function SwapCard(_, ref) {
  const fromDropZoneRef = useRef<HTMLDivElement>(null);
  const toDropZoneRef = useRef<HTMLDivElement>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSwapAnimation, setShowSwapAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fromDropHighlight, setFromDropHighlight] = useState(false);
  const [toDropHighlight, setToDropHighlight] = useState(false);

  useImperativeHandle(ref, () => ({
    getDropZones: () => ({
      from: fromDropZoneRef.current?.getBoundingClientRect() ?? null,
      to: toDropZoneRef.current?.getBoundingClientRect() ?? null,
    }),
    setFromToken: (token: Token) => {
      const found = tokens.find(t => t.symbol === token.symbol);
      if (found) {
        setFromToken(found);
        // Flash highlight effect
        setFromDropHighlight(true);
        setTimeout(() => setFromDropHighlight(false), 500);
      }
    },
    setToToken: (token: Token) => {
      const found = tokens.find(t => t.symbol === token.symbol);
      if (found) {
        setToToken(found);
        // Flash highlight effect
        setToDropHighlight(true);
        setTimeout(() => setToDropHighlight(false), 500);
      }
    },
  }), [tokens]);

  useEffect(() => {
    async function loadTokens() {
      try {
        const fetchedTokens = await fetchTokenPrices();
        setTokens(fetchedTokens);
        // Set default tokens
        const eth = fetchedTokens.find((t) => t.symbol === 'ETH');
        const usdc = fetchedTokens.find((t) => t.symbol === 'USDC');
        if (eth) setFromToken(eth);
        if (usdc) setToToken(usdc);
      } catch (err) {
        console.error('Failed to load tokens:', err);
        setError('Failed to load token prices');
      } finally {
        setIsLoading(false);
      }
    }

    loadTokens();
  }, []);

  const calculateToAmount = useCallback(
    (amount: string) => {
      if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0) {
        setToAmount('');
        return;
      }

      const result = calculateExchangeRate(
        fromToken,
        toToken,
        parseFloat(amount)
      );
      setToAmount(formatNumber(result));
    },
    [fromToken, toToken]
  );

  const calculateFromAmount = useCallback(
    (amount: string) => {
      if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0) {
        setFromAmount('');
        return;
      }

      const result = calculateExchangeRate(
        toToken,
        fromToken,
        parseFloat(amount)
      );
      setFromAmount(formatNumber(result));
    },
    [fromToken, toToken]
  );

  useEffect(() => {
    if (fromAmount) {
      calculateToAmount(fromAmount);
    }
  }, [fromToken, toToken, fromAmount, calculateToAmount]);

  const handleFromAmountChange = (value: string) => {
    // Allow only valid number input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFromAmount(value);
      calculateToAmount(value);
    }
  };

  const handleToAmountChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setToAmount(value);
      calculateFromAmount(value);
    }
  };

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setError(null);
    setIsSwapping(true);
    setShowSwapAnimation(true);

    // Simulate backend interaction
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setShowSwapAnimation(false);
    setIsSwapping(false);
    setSuccess(true);

    // Reset after showing success
    setTimeout(() => {
      setSuccess(false);
      setFromAmount('');
      setToAmount('');
    }, 3000);
  };

  const getExchangeRateDisplay = () => {
    if (!fromToken || !toToken) return null;
    const rate = calculateExchangeRate(fromToken, toToken, 1);
    return `1 ${fromToken.symbol} = ${formatNumber(rate)} ${toToken.symbol}`;
  };

  const isValidSwap =
    fromToken &&
    toToken &&
    fromAmount &&
    parseFloat(fromAmount) > 0 &&
    fromToken.symbol !== toToken.symbol;

  if (isLoading) {
    return (
      <div className="swap-card loading">
        <div className="loader">
          <motion.div
            className="loader-ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          <span>Loading tokens...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="swap-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Token Crossover Animation Overlay */}
      <AnimatePresence>
        {showSwapAnimation && fromToken && toToken && (
          <motion.div
            className="swap-animation-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="swap-animation-container">
              {/* From Token - moves right → */}
              <motion.div
                className="swap-token from-token"
                initial={{ x: -70, y: 0, scale: 1 }}
                animate={{
                  x: 70,
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  ease: 'easeInOut',
                }}
              >
                <img
                  src={fromToken.iconUrl}
                  alt={fromToken.symbol}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="token-fallback-anim">{fromToken.symbol.charAt(0)}</div>
              </motion.div>

              {/* To Token - moves left ← */}
              <motion.div
                className="swap-token to-token"
                initial={{ x: 70, y: 0, scale: 1 }}
                animate={{
                  x: -70,
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  ease: 'easeInOut',
                }}
              >
                <img
                  src={toToken.iconUrl}
                  alt={toToken.symbol}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="token-fallback-anim">{toToken.symbol.charAt(0)}</div>
              </motion.div>

              {/* Center glow */}
              <motion.div
                className="swap-glow"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Swap arrows */}
              <motion.div
                className="swap-arrows"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path
                    d="M8 15H32M32 15L26 9M32 15L26 21"
                    stroke="url(#arrow-gradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M32 25H8M8 25L14 19M8 25L14 31"
                    stroke="url(#arrow-gradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="arrow-gradient" x1="0" y1="0" x2="40" y2="40">
                      <stop stopColor="#FF007A" />
                      <stop offset="1" stopColor="#00D4FF" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>
            </div>

            <motion.p
              className="swap-status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Swapping {fromToken.symbol} → {toToken.symbol}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="swap-form">
        {/* From Section */}
        <div ref={fromDropZoneRef}>
          <motion.div
            className={`token-input-container ${fromDropHighlight ? 'drop-highlight' : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
          <div className="input-header">
            <span className="input-label">You pay</span>
            {fromToken && (
              <span className="balance">
                ≈ ${formatNumber((parseFloat(fromAmount) || 0) * fromToken.price, 2)}
              </span>
            )}
          </div>
          <div className="input-row">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              className="amount-input"
            />
            <TokenSelector
              tokens={tokens}
              selectedToken={fromToken}
              onSelect={setFromToken}
              excludeToken={toToken}
            />
          </div>
          </motion.div>
        </div>

        {/* Swap Direction Button */}
        <motion.button
          className="swap-direction"
          onClick={handleSwapTokens}
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 4V16M10 16L6 12M10 16L14 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>

        {/* To Section */}
        <div ref={toDropZoneRef}>
          <motion.div
            className={`token-input-container ${toDropHighlight ? 'drop-highlight' : ''}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="input-header">
              <span className="input-label">You receive</span>
              {toToken && toAmount && (
                <span className="balance">
                  ≈ ${formatNumber(parseFloat(toAmount) * toToken.price, 2)}
                </span>
              )}
            </div>
            <div className="input-row">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={toAmount}
                onChange={(e) => handleToAmountChange(e.target.value)}
                className="amount-input"
              />
              <TokenSelector
                tokens={tokens}
                selectedToken={toToken}
                onSelect={setToToken}
                excludeToken={fromToken}
              />
            </div>
          </motion.div>
        </div>

        {/* Exchange Rate */}
        <AnimatePresence>
          {fromToken && toToken && !showSwapAnimation && (
            <motion.div
              className="exchange-rate"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 8H12M12 8L9 5M12 8L9 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{getExchangeRateDisplay()}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 5.5V8.5M8 10.5H8.005M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              className="success-message"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <motion.svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
              <span>Swap successful!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swap Button */}
        <motion.button
          className={`swap-button ${isSwapping ? 'loading' : ''} ${success ? 'success' : ''}`}
          onClick={handleSwap}
          disabled={!isValidSwap || isSwapping || success}
          whileHover={isValidSwap && !isSwapping ? { scale: 1.02 } : {}}
          whileTap={isValidSwap && !isSwapping ? { scale: 0.98 } : {}}
        >
          {isSwapping ? (
            <div className="button-loader">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ⟳
              </motion.span>
              Processing...
            </div>
          ) : success ? (
            'Completed!'
          ) : !fromToken || !toToken ? (
            'Select tokens'
          ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
            'Enter an amount'
          ) : (
            'Swap'
          )}
        </motion.button>
      </div>
    </motion.div>
  );
});
