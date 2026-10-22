const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const expenseService = require('./expenseService');
const incomeService = require('./incomeService');
const budgetService = require('./budgetService');
const dashboardService = require('./dashboardService');

/**
 * AI Tool Definitions for FinanceFlow.
 *
 * Architecture Decision: Each tool is a thin wrapper around an existing service method.
 * The userId is NOT a tool parameter — it is injected by the caller (aiService) from
 * the authenticated JWT session. This prevents the LLM from accessing other users' data.
 *
 * Why this pattern matters (for interviews):
 * - Zero business logic duplication: tools call existing services
 * - Security by construction: userId comes from auth middleware, not LLM output
 * - Testable: each tool can be tested independently with a mock userId
 * - LangChain compatible: uses the `tool()` factory with Zod schemas
 */

/**
 * Creates all AI tools bound to a specific authenticated user.
 * This factory function is called per-request so each tool is scoped to req.user._id.
 *
 * @param {String} userId - Authenticated user's MongoDB ObjectId (from JWT)
 * @returns {Array} Array of LangChain tool instances
 */
function createToolsForUser(userId) {
  // ─── Tool 1: Get Monthly Expenses ───────────────────────────────────
  const getExpensesTool = tool(
    async ({ month, year, categoryName }) => {
      try {
        const now = new Date();
        const targetMonth = month || now.getMonth() + 1;
        const targetYear = year || now.getFullYear();

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const periodStr = `${monthNames[targetMonth - 1]} ${targetYear}`;

        // Build date range for the target month (anchored to UTC)
        const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

        let categoryId = undefined;
        let matchedCategoryName = undefined;

        if (categoryName && typeof categoryName === 'string' && categoryName.trim()) {
          const trimmed = categoryName.trim();
          const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const categoryDoc = await Category.findOne({
            name: { $regex: new RegExp(`^${escaped}$`, 'i') },
            $or: [{ user: null }, { user: userId }],
            type: 'expense',
          });

          if (!categoryDoc) {
            const availableCategories = await Category.find({
              $or: [{ user: null }, { user: userId }],
              type: 'expense',
            }).select('name');
            const availableNames = availableCategories.map((c) => c.name);

            return JSON.stringify({
              period: periodStr,
              filterCategory: trimmed,
              matched: false,
              message: `No expense category named "${trimmed}" was found. Available expense categories: ${availableNames.join(', ')}`,
              totalExpenseAmount: 0,
              expenseCount: 0,
              topExpenses: [],
            });
          }

          categoryId = categoryDoc._id;
          matchedCategoryName = categoryDoc.name;
        }

        const result = await expenseService.getExpenses(userId, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          categoryId,
          limit: 100, // Retrieve all for the month (reasonable upper bound)
          sortBy: 'amount',
          sortOrder: 'desc',
        });

        return JSON.stringify({
          period: periodStr,
          category: matchedCategoryName || 'All',
          totalExpenseAmount: result.summary.totalExpenseAmount,
          expenseCount: result.pagination.totalRecords,
          topExpenses: result.expenses.slice(0, 10).map(e => ({
            title: e.title,
            amount: e.amount,
            category: e.category?.name || 'Uncategorized',
            date: e.date,
          })),
        });
      } catch (error) {
        return JSON.stringify({ error: error.message });
      }
    },
    {
      name: 'get_expenses',
      description: 'Retrieves the user\'s expense transactions for a specific month and year, including total amount and top expenses by amount. Can be filtered by category name. Defaults to the current month if month/year not specified.',
      schema: z.object({
        month: z.number().min(1).max(12).optional().describe('Month number (1-12). Defaults to current month.'),
        year: z.number().min(2020).max(2030).optional().describe('Year (e.g., 2026). Defaults to current year.'),
        categoryName: z.string().optional().describe('Optional category name to filter by (e.g., "Food", "Entertainment", "Housing")'),
      }),
    }
  );

  // ─── Tool 2: Get Monthly Income ─────────────────────────────────────
  const getIncomeTool = tool(
    async ({ month, year }) => {
      try {
        const now = new Date();
        const targetMonth = month || now.getMonth() + 1;
        const targetYear = year || now.getFullYear();

        const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

        const result = await incomeService.getIncomes(userId, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 100,
          sortBy: 'amount',
          sortOrder: 'desc',
        });

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        return JSON.stringify({
          period: `${monthNames[targetMonth - 1]} ${targetYear}`,
          totalIncomeAmount: result.summary.totalIncomeAmount,
          incomeCount: result.pagination.totalRecords,
          incomeSources: result.incomes.slice(0, 10).map(i => ({
            source: i.source,
            amount: i.amount,
            category: i.category?.name || 'Uncategorized',
            date: i.date,
          })),
        });
      } catch (error) {
        return JSON.stringify({ error: error.message });
      }
    },
    {
      name: 'get_income',
      description: 'Retrieves the user\'s income records for a specific month and year, including total amount and income sources. Defaults to the current month.',
      schema: z.object({
        month: z.number().min(1).max(12).optional().describe('Month number (1-12). Defaults to current month.'),
        year: z.number().min(2020).max(2030).optional().describe('Year (e.g., 2026). Defaults to current year.'),
      }),
    }
  );

  // ─── Tool 3: Get Financial Summary ──────────────────────────────────
  const getFinancialSummaryTool = tool(
    async () => {
      try {
        const summary = await dashboardService.getFinancialSummary(userId);
        return JSON.stringify(summary);
      } catch (error) {
        return JSON.stringify({ error: error.message });
      }
    },
    {
      name: 'get_financial_summary',
      description: 'Retrieves the user\'s overall financial summary including lifetime totals (income, expense, net savings, savings rate), current month figures, and month-over-month growth percentages. Use this for broad financial overview questions.',
      schema: z.object({}),
    }
  );

  // ─── Tool 4: Get Budget Status ──────────────────────────────────────
  const getBudgetStatusTool = tool(
    async ({ month, year }) => {
      try {
        const result = await budgetService.getBudgetsWithProgress(userId, month, year);

        return JSON.stringify({
          period: `${month || new Date().getMonth() + 1}/${year || new Date().getFullYear()}`,
          budgets: result.budgets.map(b => ({
            category: b.category?.name || 'Unknown',
            amountLimit: b.amountLimit,
            spentAmount: b.spentAmount,
            remainingAmount: b.remainingAmount,
            percentageUsed: b.percentageUsed,
            status: b.status,
          })),
          summary: result.summary,
        });
      } catch (error) {
        return JSON.stringify({ error: error.message });
      }
    },
    {
      name: 'get_budget_status',
      description: 'Retrieves the user\'s budget targets and real-time spending progress for a specific month/year. Shows each budget category\'s limit, amount spent, remaining amount, percentage used, and status (normal/warning/exceeded). Defaults to current month.',
      schema: z.object({
        month: z.number().min(1).max(12).optional().describe('Month number (1-12). Defaults to current month.'),
        year: z.number().min(2020).max(2030).optional().describe('Year (e.g., 2026). Defaults to current year.'),
      }),
    }
  );

  // ─── Tool 5: Get Category Breakdown ─────────────────────────────────
  const getCategoryBreakdownTool = tool(
    async ({ monthsBack }) => {
      try {
        const chartData = await dashboardService.getChartData(userId, monthsBack || 1);

        return JSON.stringify({
          categoryBreakdown: chartData.categoryBreakdown.map(c => ({
            name: c.name,
            totalAmount: c.totalAmount,
            percentage: c.percentage,
          })),
          monthlyTrends: chartData.monthlyTrends,
        });
      } catch (error) {
        return JSON.stringify({ error: error.message });
      }
    },
    {
      name: 'get_category_breakdown',
      description: 'Retrieves expense breakdown by category (showing each category\'s total amount and percentage of total spending) and monthly income vs expense trends. Use this to understand WHERE money is being spent.',
      schema: z.object({
        monthsBack: z.number().min(1).max(12).optional().describe('Number of months to include in the trend data (default: 1, max: 12).'),
      }),
    }
  );

  // ─── Tool 6: Compare Financial Periods ─────────────────────────────
  const comparePeriodsTool = tool(
    async ({ baseMonth, baseYear, targetMonth, targetYear }) => {
      try {
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Target period defaults to current month
        const tMonth = targetMonth || now.getMonth() + 1;
        const tYear = targetYear || now.getFullYear();

        // Base period defaults to previous month relative to target
        let bMonth = baseMonth;
        let bYear = baseYear;
        if (!bMonth || !bYear) {
          if (tMonth === 1) {
            bMonth = 12;
            bYear = tYear - 1;
          } else {
            bMonth = tMonth - 1;
            bYear = tYear;
          }
        }

        const baseStart = new Date(Date.UTC(bYear, bMonth - 1, 1, 0, 0, 0, 0));
        const baseEnd = new Date(Date.UTC(bYear, bMonth, 0, 23, 59, 59, 999));

        const targetStart = new Date(Date.UTC(tYear, tMonth - 1, 1, 0, 0, 0, 0));
        const targetEnd = new Date(Date.UTC(tYear, tMonth, 0, 23, 59, 59, 999));

        // Fetch Base & Target data in parallel
        const [baseExpenses, baseIncomes, targetExpenses, targetIncomes] = await Promise.all([
          expenseService.getExpenses(userId, {
            startDate: baseStart.toISOString(),
            endDate: baseEnd.toISOString(),
            limit: 500,
          }),
          incomeService.getIncomes(userId, {
            startDate: baseStart.toISOString(),
            endDate: baseEnd.toISOString(),
            limit: 500,
          }),
          expenseService.getExpenses(userId, {
            startDate: targetStart.toISOString(),
            endDate: targetEnd.toISOString(),
            limit: 500,
          }),
          incomeService.getIncomes(userId, {
            startDate: targetStart.toISOString(),
            endDate: targetEnd.toISOString(),
            limit: 500,
          }),
        ]);

        const baseTotalExp = baseExpenses.summary.totalExpenseAmount || 0;
        const targetTotalExp = targetExpenses.summary.totalExpenseAmount || 0;
        const expDiff = Number((targetTotalExp - baseTotalExp).toFixed(2));
        const expPctChange = baseTotalExp > 0
          ? Number((((targetTotalExp - baseTotalExp) / baseTotalExp) * 100).toFixed(1))
          : (targetTotalExp > 0 ? 100 : 0);

        const baseTotalInc = baseIncomes.summary.totalIncomeAmount || 0;
        const targetTotalInc = targetIncomes.summary.totalIncomeAmount || 0;
        const incDiff = Number((targetTotalInc - baseTotalInc).toFixed(2));
        const incPctChange = baseTotalInc > 0
          ? Number((((targetTotalInc - baseTotalInc) / baseTotalInc) * 100).toFixed(1))
          : (targetTotalInc > 0 ? 100 : 0);

        const baseSavings = Number((baseTotalInc - baseTotalExp).toFixed(2));
        const targetSavings = Number((targetTotalInc - targetTotalExp).toFixed(2));
        const savingsDiff = Number((targetSavings - baseSavings).toFixed(2));

        // Group expenses by category
        const baseCatMap = {};
        for (const exp of (baseExpenses.expenses || [])) {
          const catName = exp.category?.name || 'Uncategorized';
          baseCatMap[catName] = (baseCatMap[catName] || 0) + exp.amount;
        }

        const targetCatMap = {};
        for (const exp of (targetExpenses.expenses || [])) {
          const catName = exp.category?.name || 'Uncategorized';
          targetCatMap[catName] = (targetCatMap[catName] || 0) + exp.amount;
        }

        const allCategories = new Set([...Object.keys(baseCatMap), ...Object.keys(targetCatMap)]);
        const categoryShifts = [];

        for (const catName of allCategories) {
          const bAmount = Number((baseCatMap[catName] || 0).toFixed(2));
          const tAmount = Number((targetCatMap[catName] || 0).toFixed(2));
          const diff = Number((tAmount - bAmount).toFixed(2));
          const pct = bAmount > 0
            ? Number((((tAmount - bAmount) / bAmount) * 100).toFixed(1))
            : (tAmount > 0 ? 100 : 0);

          categoryShifts.push({
            category: catName,
            baseAmount: bAmount,
            targetAmount: tAmount,
            difference: diff,
            percentageChange: pct,
          });
        }

        // Sort by largest absolute spending shift
        categoryShifts.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

        return JSON.stringify({
          basePeriod: `${monthNames[bMonth - 1]} ${bYear}`,
          targetPeriod: `${monthNames[tMonth - 1]} ${tYear}`,
          comparison: {
            expense: {
              baseAmount: baseTotalExp,
              targetAmount: targetTotalExp,
              difference: expDiff,
              percentageChange: expPctChange,
              direction: expDiff > 0 ? 'increased' : (expDiff < 0 ? 'decreased' : 'unchanged'),
            },
            income: {
              baseAmount: baseTotalInc,
              targetAmount: targetTotalInc,
              difference: incDiff,
              percentageChange: incPctChange,
              direction: incDiff > 0 ? 'increased' : (incDiff < 0 ? 'decreased' : 'unchanged'),
            },
            netSavings: {
              baseSavings,
              targetSavings,
              difference: savingsDiff,
              direction: savingsDiff > 0 ? 'improved' : (savingsDiff < 0 ? 'declined' : 'unchanged'),
            },
          },
          topCategoryShifts: categoryShifts.slice(0, 5),
        });
      } catch (error) {
        return JSON.stringify({ error: error.message });
      }
    },
    {
      name: 'compare_periods',
      description: 'Compares income, expenses, net savings, and category spending shifts between two distinct periods (months/years). Defaults to comparing the current month against the previous month if arguments are omitted.',
      schema: z.object({
        baseMonth: z.number().min(1).max(12).optional().describe('Base period month number (1-12). Defaults to previous month.'),
        baseYear: z.number().min(2020).max(2030).optional().describe('Base period year (e.g., 2026).'),
        targetMonth: z.number().min(1).max(12).optional().describe('Target period month number (1-12). Defaults to current month.'),
        targetYear: z.number().min(2020).max(2030).optional().describe('Target period year (e.g., 2026).'),
      }),
    }
  );

  // ─── Tool 7: Simulate Budget Change ────────────────────────────────
  const simulateBudgetChangeTool = tool(
    async ({ categoryName, proposedAmountLimit, percentageChange, monthsToAnalyze }) => {
      try {
        if (!categoryName || typeof categoryName !== 'string' || !categoryName.trim()) {
          return JSON.stringify({ error: 'A valid categoryName is required for budget simulation.' });
        }

        const trimmed = categoryName.trim();
        const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const categoryDoc = await Category.findOne({
          name: { $regex: new RegExp(`^${escaped}$`, 'i') },
          $or: [{ user: null }, { user: userId }],
          type: 'expense',
        });

        if (!categoryDoc) {
          const availableCategories = await Category.find({
            $or: [{ user: null }, { user: userId }],
            type: 'expense',
          }).select('name');
          const availableNames = availableCategories.map((c) => c.name);

          return JSON.stringify({
            matched: false,
            message: `No expense category named "${trimmed}" was found. Available categories: ${availableNames.join(', ')}`,
          });
        }

        const categoryId = categoryDoc._id;
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // 1. Check existing budget for this category
        const existingBudget = await Budget.findOne({
          user: userId,
          category: categoryId,
        }).sort({ year: -1, month: -1 });

        const currentLimit = existingBudget ? existingBudget.amountLimit : null;

        // 2. Calculate proposed limit
        let targetLimit;
        if (proposedAmountLimit !== undefined && proposedAmountLimit !== null) {
          targetLimit = Number(Number(proposedAmountLimit).toFixed(2));
        } else if (percentageChange !== undefined && percentageChange !== null && currentLimit !== null) {
          targetLimit = Number((currentLimit * (1 + percentageChange / 100)).toFixed(2));
        } else {
          return JSON.stringify({
            error: 'You must specify either proposedAmountLimit (e.g. 300) or percentageChange (e.g. -15 for 15% reduction).',
          });
        }

        if (targetLimit <= 0) {
          return JSON.stringify({ error: 'Proposed budget limit must be greater than 0.' });
        }

        // 3. Analyze historical actual spending across past N months (default 3, min 1, max 12)
        const monthsCount = Math.min(Math.max(monthsToAnalyze || 3, 1), 12);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const historicalRecords = [];
        let totalHistoricalSpent = 0;
        let monthsExceededCount = 0;

        for (let i = 0; i < monthsCount; i++) {
          const d = new Date(currentYear, currentMonth - 1 - i, 1);
          const m = d.getMonth() + 1;
          const y = d.getFullYear();
          const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
          const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

          const result = await expenseService.getExpenses(userId, {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            categoryId,
            limit: 500,
          });

          const spent = result.summary.totalExpenseAmount || 0;
          totalHistoricalSpent += spent;
          const exceeded = spent > targetLimit;
          if (exceeded) monthsExceededCount++;

          historicalRecords.push({
            period: `${monthNames[m - 1]} ${y}`,
            actualSpent: spent,
            exceededProposedLimit: exceeded,
            variance: Number((targetLimit - spent).toFixed(2)),
          });
        }

        const avgMonthlySpent = Number((totalHistoricalSpent / monthsCount).toFixed(2));
        const breachRate = Number(((monthsExceededCount / monthsCount) * 100).toFixed(1));

        // Projected monthly and annual financial impact
        const monthlyDiff = currentLimit !== null
          ? Number((currentLimit - targetLimit).toFixed(2)) // Positive = savings relative to current budget
          : Number((avgMonthlySpent - targetLimit).toFixed(2)); // Positive = savings relative to past spending

        const projectedAnnualSavings = Number((monthlyDiff * 12).toFixed(2));

        let feasibility = 'comfortable';
        if (breachRate >= 60) {
          feasibility = 'challenging (spending frequently exceeded this target in past months)';
        } else if (breachRate >= 30) {
          feasibility = 'moderate (requires noticeable spending adjustments)';
        } else {
          feasibility = 'comfortable (historical spending rarely or never exceeded this target)';
        }

        return JSON.stringify({
          category: categoryDoc.name,
          currentBudgetLimit: currentLimit,
          proposedBudgetLimit: targetLimit,
          changeAmount: currentLimit !== null ? Number((targetLimit - currentLimit).toFixed(2)) : null,
          percentageChange: currentLimit !== null ? Number((((targetLimit - currentLimit) / currentLimit) * 100).toFixed(1)) : null,
          historicalAnalysis: {
            monthsAnalyzed: monthsCount,
            averageMonthlySpent: avgMonthlySpent,
            monthsExceededCount,
            breachRate: `${breachRate}%`,
            monthlyHistory: historicalRecords,
          },
          projection: {
            monthlyDifference: monthlyDiff,
            projectedAnnualImpact: projectedAnnualSavings,
            impactType: projectedAnnualSavings >= 0 ? 'annual savings' : 'annual increased spending',
            feasibilityAssessment: feasibility,
          },
        });
      } catch (error) {
        return JSON.stringify({ error: error.message });
      }
    },
    {
      name: 'simulate_budget_change',
      description: 'Simulates the historical impact and projected annual savings/deficit of modifying a category budget limit (by specifying a new amount or a percentage change). Evaluates past compliance and feasibility without altering any database records.',
      schema: z.object({
        categoryName: z.string().describe('The expense category to simulate (e.g., "Food", "Entertainment", "Dining Out")'),
        proposedAmountLimit: z.number().positive().optional().describe('Proposed new monthly limit amount in dollars/currency (e.g. 250).'),
        percentageChange: z.number().optional().describe('Percentage change relative to current budget (e.g., -15 for a 15% reduction, +10 for a 10% increase).'),
        monthsToAnalyze: z.number().min(1).max(12).optional().describe('Number of past months of actual spending history to evaluate against (default: 3).'),
      }),
    }
  );

  return [
    getExpensesTool,
    getIncomeTool,
    getFinancialSummaryTool,
    getBudgetStatusTool,
    getCategoryBreakdownTool,
    comparePeriodsTool,
    simulateBudgetChangeTool,
  ];
}

module.exports = { createToolsForUser };
