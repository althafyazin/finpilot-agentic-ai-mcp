const test = require('node:test');
const assert = require('node:assert');
const { createToolsForUser } = require('../services/aiTools');
const expenseService = require('../services/expenseService');
const incomeService = require('../services/incomeService');
const Category = require('../models/Category');
const Budget = require('../models/Budget');

test('AI Phase 2 - Advanced Tool Factory & Schemas', async (t) => {
  const userId = '60d5ecb8b392d7001f5f3e99';
  const tools = createToolsForUser(userId);

  await t.test('createToolsForUser exports 7 tools including compare_periods and simulate_budget_change', () => {
    assert.strictEqual(tools.length, 7);
    const names = tools.map((t) => t.name);
    assert.ok(names.includes('compare_periods'));
    assert.ok(names.includes('simulate_budget_change'));
  });

  await t.test('compare_periods schema validation', () => {
    const compareTool = tools.find((t) => t.name === 'compare_periods');

    // Valid inputs
    assert.strictEqual(compareTool.schema.safeParse({}).success, true, 'Default arguments should be valid');
    assert.strictEqual(
      compareTool.schema.safeParse({ baseMonth: 5, baseYear: 2026, targetMonth: 6, targetYear: 2026 }).success,
      true
    );

    // Invalid month
    assert.strictEqual(compareTool.schema.safeParse({ targetMonth: 13 }).success, false);
    assert.strictEqual(compareTool.schema.safeParse({ baseMonth: 0 }).success, false);

    // Invalid year
    assert.strictEqual(compareTool.schema.safeParse({ targetYear: 2019 }).success, false);
  });

  await t.test('simulate_budget_change schema validation', () => {
    const simTool = tools.find((t) => t.name === 'simulate_budget_change');

    // Valid inputs
    assert.strictEqual(
      simTool.schema.safeParse({ categoryName: 'Dining Out', proposedAmountLimit: 250 }).success,
      true
    );
    assert.strictEqual(
      simTool.schema.safeParse({ categoryName: 'Food', percentageChange: -15, monthsToAnalyze: 6 }).success,
      true
    );

    // Invalid: negative proposed limit
    assert.strictEqual(
      simTool.schema.safeParse({ categoryName: 'Food', proposedAmountLimit: -50 }).success,
      false
    );

    // Invalid: missing categoryName
    assert.strictEqual(simTool.schema.safeParse({ proposedAmountLimit: 200 }).success, false);
  });
});

test('AI Phase 2 - compare_periods Deterministic Calculations', async (t) => {
  const userId = '60d5ecb8b392d7001f5f3e99';
  const tools = createToolsForUser(userId);
  const compareTool = tools.find((t) => t.name === 'compare_periods');

  await t.test('Calculates exact delta, percentage, and category shifts between two periods', async () => {
    const origGetExpenses = expenseService.getExpenses;
    const origGetIncomes = incomeService.getIncomes;

    // Mock Base Period (Aug 2026): Expense = 1000, Income = 3000
    // Mock Target Period (Sep 2026): Expense = 1250, Income = 3500
    expenseService.getExpenses = async (uid, params) => {
      const isBase = params.startDate.includes('2026-08');
      if (isBase) {
        return {
          expenses: [
            { title: 'Dining', amount: 300, category: { name: 'Dining Out' } },
            { title: 'Groceries', amount: 700, category: { name: 'Groceries' } },
          ],
          summary: { totalExpenseAmount: 1000 },
        };
      }
      return {
        expenses: [
          { title: 'Dining', amount: 450, category: { name: 'Dining Out' } },
          { title: 'Groceries', amount: 600, category: { name: 'Groceries' } },
          { title: 'Gadgets', amount: 200, category: { name: 'Shopping' } },
        ],
        summary: { totalExpenseAmount: 1250 },
      };
    };

    incomeService.getIncomes = async (uid, params) => {
      const isBase = params.startDate.includes('2026-08');
      return {
        summary: { totalIncomeAmount: isBase ? 3000 : 3500 },
      };
    };

    try {
      const resultJson = await compareTool.invoke({
        baseMonth: 8,
        baseYear: 2026,
        targetMonth: 9,
        targetYear: 2026,
      });

      const parsed = JSON.parse(resultJson);

      assert.strictEqual(parsed.basePeriod, 'Aug 2026');
      assert.strictEqual(parsed.targetPeriod, 'Sep 2026');

      // Expense arithmetic
      assert.strictEqual(parsed.comparison.expense.baseAmount, 1000);
      assert.strictEqual(parsed.comparison.expense.targetAmount, 1250);
      assert.strictEqual(parsed.comparison.expense.difference, 250);
      assert.strictEqual(parsed.comparison.expense.percentageChange, 25.0);
      assert.strictEqual(parsed.comparison.expense.direction, 'increased');

      // Income arithmetic
      assert.strictEqual(parsed.comparison.income.baseAmount, 3000);
      assert.strictEqual(parsed.comparison.income.targetAmount, 3500);
      assert.strictEqual(parsed.comparison.income.difference, 500);
      assert.strictEqual(parsed.comparison.income.percentageChange, 16.7);
      assert.strictEqual(parsed.comparison.income.direction, 'increased');

      // Savings arithmetic (Income - Expense)
      // Base: 3000 - 1000 = 2000
      // Target: 3500 - 1250 = 2250
      assert.strictEqual(parsed.comparison.netSavings.baseSavings, 2000);
      assert.strictEqual(parsed.comparison.netSavings.targetSavings, 2250);
      assert.strictEqual(parsed.comparison.netSavings.difference, 250);
      assert.strictEqual(parsed.comparison.netSavings.direction, 'improved');

      // Category shift breakdown check
      assert.ok(Array.isArray(parsed.topCategoryShifts));
      const diningShift = parsed.topCategoryShifts.find((s) => s.category === 'Dining Out');
      assert.ok(diningShift, 'Dining Out should be in shifts');
      assert.strictEqual(diningShift.difference, 150);
      assert.strictEqual(diningShift.percentageChange, 50.0);
    } finally {
      expenseService.getExpenses = origGetExpenses;
      incomeService.getIncomes = origGetIncomes;
    }
  });
});

test('AI Phase 2 - simulate_budget_change Deterministic Calculations', async (t) => {
  const userId = '60d5ecb8b392d7001f5f3e99';
  const tools = createToolsForUser(userId);
  const simTool = tools.find((t) => t.name === 'simulate_budget_change');

  await t.test('Simulates proposed budget limit with historical compliance and annual savings', async () => {
    const origFindOneCat = Category.findOne;
    const origFindOneBud = Budget.findOne;
    const origGetExpenses = expenseService.getExpenses;

    const mockCatId = '60d5ecb8b392d7001f5f3e01';
    Category.findOne = () => ({
      _id: mockCatId,
      name: 'Dining Out',
      type: 'expense',
    });

    // Existing budget: $400/month
    Budget.findOne = () => ({
      sort: () => ({ amountLimit: 400 }),
    });

    // Mock 3 months of expenses: 350, 250, 450
    // Proposed limit: $300
    // Breaches: 350 > 300 (yes), 250 > 300 (no), 450 > 300 (yes) -> 2 out of 3 (66.7%)
    let callIdx = 0;
    const historyAmounts = [350, 250, 450];
    expenseService.getExpenses = async () => {
      const amount = historyAmounts[callIdx % historyAmounts.length];
      callIdx++;
      return {
        summary: { totalExpenseAmount: amount },
      };
    };

    try {
      const resultJson = await simTool.invoke({
        categoryName: 'Dining Out',
        proposedAmountLimit: 300,
        monthsToAnalyze: 3,
      });

      const parsed = JSON.parse(resultJson);

      assert.strictEqual(parsed.category, 'Dining Out');
      assert.strictEqual(parsed.currentBudgetLimit, 400);
      assert.strictEqual(parsed.proposedBudgetLimit, 300);
      assert.strictEqual(parsed.changeAmount, -100);
      assert.strictEqual(parsed.percentageChange, -25.0);

      // Historical analysis
      assert.strictEqual(parsed.historicalAnalysis.monthsAnalyzed, 3);
      assert.strictEqual(parsed.historicalAnalysis.averageMonthlySpent, 350); // (350+250+450)/3 = 350
      assert.strictEqual(parsed.historicalAnalysis.monthsExceededCount, 2);
      assert.strictEqual(parsed.historicalAnalysis.breachRate, '66.7%');

      // Projections (400 - 300 = 100/month saved -> 1200/year)
      assert.strictEqual(parsed.projection.monthlyDifference, 100);
      assert.strictEqual(parsed.projection.projectedAnnualImpact, 1200);
      assert.strictEqual(parsed.projection.impactType, 'annual savings');
      assert.ok(parsed.projection.feasibilityAssessment.includes('challenging'));
    } finally {
      Category.findOne = origFindOneCat;
      Budget.findOne = origFindOneBud;
      expenseService.getExpenses = origGetExpenses;
    }
  });

  await t.test('Handles unknown category gracefully in simulation', async () => {
    const origFindOneCat = Category.findOne;
    const origFindCat = Category.find;

    Category.findOne = () => null;
    Category.find = () => ({
      select: () => [{ name: 'Food' }, { name: 'Rent' }],
    });

    try {
      const resultJson = await simTool.invoke({
        categoryName: 'NonExistentCategory',
        proposedAmountLimit: 200,
      });

      const parsed = JSON.parse(resultJson);
      assert.strictEqual(parsed.matched, false);
      assert.ok(parsed.message.includes('No expense category named "NonExistentCategory"'));
      assert.ok(parsed.message.includes('Food, Rent'));
    } finally {
      Category.findOne = origFindOneCat;
      Category.find = origFindCat;
    }
  });
});
