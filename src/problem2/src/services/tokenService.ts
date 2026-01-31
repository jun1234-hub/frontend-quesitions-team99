import type { Token, TokenPrice } from '../types/token';

const PRICE_API_URL = 'https://interview.switcheo.com/prices.json';
const ICON_BASE_URL = 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens';

// Token name mapping for display purposes
const TOKEN_NAMES: Record<string, string> = {
  BLUR: 'Blur',
  bNEO: 'Bridged NEO',
  BUSD: 'Binance USD',
  USD: 'US Dollar',
  ETH: 'Ethereum',
  GMX: 'GMX',
  STEVMOS: 'Stride Staked EVMOS',
  LUNA: 'Terra Luna',
  RATOM: 'pStake ATOM',
  STRD: 'Stride',
  EVMOS: 'Evmos',
  IBCX: 'IBC Index',
  IRIS: 'IRISnet',
  ampLUNA: 'Amplified LUNA',
  KUJI: 'Kujira',
  STOSMO: 'Stride Staked OSMO',
  USDC: 'USD Coin',
  axlUSDC: 'Axelar USDC',
  ATOM: 'Cosmos Hub',
  STATOM: 'Stride Staked ATOM',
  OSMO: 'Osmosis',
  rSWTH: 'Staked SWTH',
  STLUNA: 'Stride Staked LUNA',
  LSI: 'Liquid Staking Index',
  OKB: 'OKB',
  OKT: 'OKT Chain',
  SWTH: 'Switcheo',
  USC: 'USC',
  WBTC: 'Wrapped Bitcoin',
  wstETH: 'Wrapped stETH',
  YieldUSD: 'Yield USD',
  ZIL: 'Zilliqa',
};

export async function fetchTokenPrices(): Promise<Token[]> {
  const response = await fetch(PRICE_API_URL);
  const data: TokenPrice[] = await response.json();

  // Get latest price for each currency (some have duplicates)
  const latestPrices = new Map<string, number>();

  data.forEach((item) => {
    if (item.price && item.price > 0) {
      const existing = latestPrices.get(item.currency);
      if (!existing || new Date(item.date) > new Date(existing)) {
        latestPrices.set(item.currency, item.price);
      }
    }
  });

  // Convert to Token array
  const tokens: Token[] = [];

  latestPrices.forEach((price, symbol) => {
    tokens.push({
      symbol,
      name: TOKEN_NAMES[symbol] || symbol,
      price,
      iconUrl: `${ICON_BASE_URL}/${symbol}.svg`,
    });
  });

  // Sort by price descending (major tokens first)
  return tokens.sort((a, b) => b.price - a.price);
}

export function calculateExchangeRate(
  fromToken: Token,
  toToken: Token,
  amount: number
): number {
  if (!fromToken.price || !toToken.price || amount <= 0) {
    return 0;
  }

  const valueInUsd = amount * fromToken.price;
  return valueInUsd / toToken.price;
}

export function formatNumber(num: number, decimals: number = 6): string {
  if (num === 0) return '0';
  if (num < 0.000001) return num.toExponential(2);
  if (num < 1) return num.toFixed(decimals);
  if (num < 1000) return num.toFixed(4);
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
