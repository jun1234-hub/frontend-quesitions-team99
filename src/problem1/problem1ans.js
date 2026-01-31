// # Task

// Provide 3 unique implementations of the following function in JavaScript.

// **Input**: `n` - any integer

// *Assuming this input will always produce a result lesser than `Number.MAX_SAFE_INTEGER`*.

// **Output**: `return` - summation to `n`, i.e. `sum_to_n(5) === 1 + 2 + 3 + 4 + 5 === 15`.


var sum_to_n_a = function(n) {
    // APPROACH: Gauss's Formula
    // Time: O(1) | Space: O(1)
    //
    // Formula: n * (n + 1) / 2
    // Example: n=5 -> 5 * 6 / 2 = 15
    // no iteration or recursion needed, constant time
   
    if (n <= 0) return 0;
    return n * (n + 1) / 2;
};

var sum_to_n_b = function(n) {
    // APPROACH: Iterative Loop
    // Time: O(n) | Space: O(1)
    //
    // Add each number from 1 to n sequentially
    // Example: 0 + 1 + 2 + 3 + 4 + 5 = 15
    //
    // Pros: Simple, readable, no stack overflow risk
    // Cons: Linear time for large n

    if (n <= 0) return 0;
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
};

var sum_to_n_c = function(n) {
    // APPROACH: Recursion
    // Time: O(n) | Space: O(n) - call stack
    //
    // sum(n) = n + sum(n-1), base case: n <= 0 returns 0
    // Example: 5 + 4 + 3 + 2 + 1 + 0 = 15
    //
    // Pros: Elegant, mirrors math definition
    // Cons: Stack overflow risk for large n (~10,000+ calls)

    if (n <= 0) return 0;
    return n + sum_to_n_c(n - 1);
};


// Test all implementations
console.log("sum_to_n_a(5):", sum_to_n_a(5)); // 15
console.log("sum_to_n_b(5):", sum_to_n_b(5)); // 15
console.log("sum_to_n_c(5):", sum_to_n_c(5)); // 15
console.log("Edge case n=0:", sum_to_n_a(0), sum_to_n_b(0), sum_to_n_c(0)); // 0, 0, 0
console.log("Edge case n=-3:", sum_to_n_a(-3), sum_to_n_b(-3), sum_to_n_c(-3)); // 0, 0, 0 


// TIME COMPLEXITY RANKING (best to worst):
//
// 1. sum_to_n_a - O(1)  : Gauss formula, instant calculation
// 2. sum_to_n_b - O(n)  : Iterative, n operations
// 3. sum_to_n_c - O(n)  : Recursive, n calls + O(n) stack space
//
// For n = 1,000,000:
//   a: 1 operation
//   b: 1,000,000 iterations
//   c: 1,000,000 calls (likely stack overflow)


// WHEN TO USE RECURSION:
//
// Recursion is best for naturally recursive problems where breaking into
// smaller subproblems makes code simpler than iteration.
//
// Good use cases:
//   - Tree/graph traversal (binary trees, DOM, file systems)
//   - Nested/hierarchical data (JSON parsing, folder structures)
//   - Divide and conquer algorithms (merge sort, quicksort)
//   - Backtracking problems (sudoku, permutations, maze solving)
//
// Rule of thumb:
//   - Linear problems (like sum 1 to n) -> use iteration
//   - Branching/tree problems -> recursion is cleaner
//   - Deep recursion risk -> convert to iteration with explicit stack
//
// For this problem, recursion is overkill - it demonstrates the concept
// but iteration or formula would be preferred in production code.
