import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Token } from '../types/token';
import './TokenSelector.css';

interface TokenSelectorProps {
  tokens: Token[];
  selectedToken: Token | null;
  onSelect: (token: Token) => void;
  excludeToken?: Token | null;
}

export function TokenSelector({
  tokens,
  selectedToken,
  onSelect,
  excludeToken,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol !== excludeToken?.symbol &&
      (token.symbol.toLowerCase().includes(search.toLowerCase()) ||
        token.name.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleTokenSelect = (token: Token) => {
    onSelect(token);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="token-selector" ref={dropdownRef}>
      <motion.button
        type="button"
        className="token-trigger"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {selectedToken ? (
          <>
            <img
              src={selectedToken.iconUrl}
              alt={selectedToken.symbol}
              className="token-icon"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="token-symbol">{selectedToken.symbol}</span>
          </>
        ) : (
          <span className="token-placeholder">Select token</span>
        )}
        <motion.svg
          className="chevron"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="token-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="search-container">
              <svg
                className="search-icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M7.333 12.667A5.333 5.333 0 107.333 2a5.333 5.333 0 000 10.667zM14 14l-2.9-2.9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                className="search-input"
                placeholder="Search tokens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="token-list">
              {filteredTokens.length === 0 ? (
                <div className="no-results">No tokens found</div>
              ) : (
                filteredTokens.map((token, index) => (
                  <motion.button
                    key={token.symbol}
                    type="button"
                    className={`token-option ${
                      selectedToken?.symbol === token.symbol ? 'selected' : ''
                    }`}
                    onClick={() => handleTokenSelect(token)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <img
                      src={token.iconUrl}
                      alt={token.symbol}
                      className="token-icon"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div
                      className="token-icon-fallback"
                      style={{ display: 'none' }}
                    >
                      {token.symbol.charAt(0)}
                    </div>
                    <div className="token-info">
                      <span className="token-symbol">{token.symbol}</span>
                      <span className="token-name">{token.name}</span>
                    </div>
                    <span className="token-price">
                      ${token.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </span>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
