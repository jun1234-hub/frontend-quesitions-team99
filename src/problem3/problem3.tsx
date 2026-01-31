
/*
interface WalletBalance {
  currency: string;
  amount: number;
  // ISSUE 1: Missing 'blockchain' property that is used in the code below
}

interface FormattedWalletBalance {
  currency: string;
  amount: number;
  formatted: string;
  // ISSUE 2: Code duplication - this interface repeats WalletBalance properties
  // instead of extending it
}

interface Props extends BoxProps {
  // ISSUE 3: Empty interface extension is unnecessary - just use BoxProps directly
}

const WalletPage: React.FC<Props> = (props: Props) => {
  const { children, ...rest } = props;
  // ISSUE 4: 'children' is destructured but never used - wasted destructuring

  const balances = useWalletBalances();
  const prices = usePrices();

  // ISSUE 5: getPriority is defined inside the component
  // This function is recreated on every render, causing unnecessary memory allocation
  // It should be moved outside the component or memoized with useCallback
  const getPriority = (blockchain: any): number => {
    // ISSUE 6: Using 'any' type defeats TypeScript's purpose
    // Should use a proper union type or enum for blockchain
    switch (blockchain) {
      case 'Osmosis':
        return 100
      case 'Ethereum':
        return 50
      case 'Arbitrum':
        return 30
      case 'Zilliqa':
        return 20
      case 'Neo':
        return 20
      default:
        return -99
    }
  }

  const sortedBalances = useMemo(() => {
    return balances.filter((balance: WalletBalance) => {
      const balancePriority = getPriority(balance.blockchain);
      // ISSUE 7: BUG - 'lhsPriority' is undefined! Should be 'balancePriority'
      // This will cause a ReferenceError at runtime
      if (lhsPriority > -99) {
         // ISSUE 8: LOGIC ERROR - Filter returns true when amount <= 0
         // This KEEPS zero/negative balances instead of filtering them OUT
         // The logic appears inverted - typically we want to show positive balances
         if (balance.amount <= 0) {
           return true;
         }
      }
      return false
    }).sort((lhs: WalletBalance, rhs: WalletBalance) => {
      // ISSUE 9: getPriority is called twice per comparison
      // For n elements, sort does O(n log n) comparisons
      // This means getPriority is called O(2n log n) times unnecessarily
      // Priority should be computed once per balance and cached
      const leftPriority = getPriority(lhs.blockchain);
      const rightPriority = getPriority(rhs.blockchain);
      if (leftPriority > rightPriority) {
        return -1;
      } else if (rightPriority > leftPriority) {
        return 1;
      }
      // ISSUE 10: Missing return statement for equality case
      // When priorities are equal, returns undefined (implicitly)
      // Should explicitly return 0 for stable sorting
    });
  }, [balances, prices]);
  // ISSUE 11: 'prices' is in dependency array but NOT used in the computation
  // This causes unnecessary re-computation when prices change

  // ISSUE 12: formattedBalances is computed on every render
  // It's not memoized, causing unnecessary recalculation
  const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
    return {
      ...balance,
      formatted: balance.amount.toFixed()
    }
  })

  // ISSUE 13: BUG - Uses sortedBalances but types it as FormattedWalletBalance
  // Should use formattedBalances instead!
  // balance.formatted will be undefined, causing display issues
  const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
    const usdValue = prices[balance.currency] * balance.amount;
    return (
      // ISSUE 14: 'WalletRow' component is used but not imported or defined
      <WalletRow
        className={classes.row}
        // ISSUE 15: 'classes' is not defined anywhere in the component
        // ISSUE 16: Using array index as key is an anti-pattern
        // If balances reorder, React won't properly reconcile components
        // Should use a unique identifier like balance.currency or a composite key
        key={index}
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={balance.formatted}
      />
    )
  })

  return (
    <div {...rest}>
      {rows}
    </div>
  )
}
*/

// =============================================================================
// REFACTORED VERSION
// =============================================================================

import React, { useMemo } from 'react';

// Assumed external dependencies (would be imported in a real codebase):
// - BoxProps: UI library component props (e.g., Material-UI, Chakra)
// - WalletRow: Component for rendering individual wallet rows
// - useWalletBalances(): Hook returning WalletBalance[]
// - usePrices(): Hook returning Record<string, number>

// Define blockchain as a union type for type safety
type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo';

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain; // Added missing property
}

// Extend WalletBalance to avoid code duplication
interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

// Intermediate type for balances with cached priority
interface WalletBalanceWithPriority extends WalletBalance {
  priority: number;
}

// Move getPriority outside component - it's a pure function with no dependencies
// This prevents recreation on every render
const BLOCKCHAIN_PRIORITY: Record<Blockchain, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const getPriority = (blockchain: Blockchain): number => {
  return BLOCKCHAIN_PRIORITY[blockchain] ?? -99;
};

// Use BoxProps directly instead of empty extending interface
const WalletPage: React.FC<BoxProps> = (props) => {
  // Removed unused 'children' from destructuring
  const { ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  // Combine filter, sort, and format into a single memoized operation
  // This reduces the number of array iterations from 4 to 1
  const formattedBalances = useMemo((): FormattedWalletBalance[] => {
    // First, add priority to each balance to avoid recomputing during sort
    const balancesWithPriority: WalletBalanceWithPriority[] = balances
      .map((balance: WalletBalance): WalletBalanceWithPriority => ({
        ...balance,
        priority: getPriority(balance.blockchain),
      }));

    return balancesWithPriority
      // Fixed filter logic: keep balances with valid priority AND positive amount
      .filter((balance: WalletBalanceWithPriority) => balance.priority > -99 && balance.amount > 0)
      // Sort by cached priority - no repeated getPriority calls
      .sort((lhs: WalletBalanceWithPriority, rhs: WalletBalanceWithPriority) => rhs.priority - lhs.priority)
      // Format in the same pass
      .map((balance: WalletBalanceWithPriority): FormattedWalletBalance => ({
        currency: balance.currency,
        amount: balance.amount,
        blockchain: balance.blockchain,
        formatted: balance.amount.toFixed(2), // Added decimal places for currency
      }));
  }, [balances]); // Removed 'prices' - not used in this computation

  // Memoize rows to prevent recalculation when only prices change
  const rows = useMemo(() => {
    return formattedBalances.map((balance: FormattedWalletBalance) => {
      const usdValue = prices[balance.currency] * balance.amount;
      return (
        <WalletRow
          // Use currency as key - assuming currencies are unique
          // If not unique, use a composite key: `${balance.blockchain}-${balance.currency}`
          key={balance.currency}
          amount={balance.amount}
          usdValue={usdValue}
          formattedAmount={balance.formatted}
        />
      );
    });
  }, [formattedBalances, prices]); // Now prices is correctly in dependencies

  return <div {...rest}>{rows}</div>;
};

export default WalletPage;

// =============================================================================
// SUMMARY OF ISSUES AND FIXES
// =============================================================================

/**
 * BUGS IDENTIFIED:
 * 1. Undefined variable 'lhsPriority' - should be 'balancePriority'
 * 2. Filter logic inverted - keeps amount <= 0 instead of > 0
 * 3. Uses sortedBalances but accesses .formatted (undefined) - should use formattedBalances
 * 4. Missing return 0 in sort comparator for equal priorities
 *
 * TYPE ISSUES:
 * 5. 'blockchain: any' - loses type safety
 * 6. WalletBalance missing 'blockchain' property
 * 7. FormattedWalletBalance duplicates instead of extends
 * 8. Empty Props interface is unnecessary
 *
 * PERFORMANCE ISSUES:
 * 9.  getPriority defined inside component - recreated every render
 * 10. getPriority called multiple times per element during sort - O(2n log n) calls
 * 11. 'prices' in useMemo deps but unused - causes unnecessary recomputation
 * 12. formattedBalances not memoized - recalculated every render
 * 13. Multiple array iterations (filter + sort + map + map) instead of combined
 *
 * ANTI-PATTERNS:
 * 14. 'WalletRow' component used but not imported or defined
 * 15. 'classes.row' used but 'classes' undefined
 * 16. Using array index as React key - causes reconciliation issues on reorder
 * 17. Destructuring 'children' but never using it
 *
 * FIXES APPLIED:
 * - Moved getPriority outside component with lookup object for O(1) access
 * - Added Blockchain union type for type safety
 * - Extended WalletBalance in FormattedWalletBalance
 * - Combined filter/sort/map into single memoized operation
 * - Cache priority per balance to avoid repeated computation during sort
 * - Fixed filter logic to keep positive balances with valid priority
 * - Used currency as unique key instead of array index
 * - Removed unused 'prices' from first useMemo dependencies
 * - Added separate useMemo for rows that correctly depends on prices
 */
