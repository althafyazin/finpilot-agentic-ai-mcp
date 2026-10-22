const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Budget = require('../models/Budget');

const insightService = {
  async calculateHealthInsights(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // 1. Parallel aggregates for current month's totals
    const [incomeAgg, expenseAgg, budgets, categoryExpenses] = await Promise.all([
      Income.aggregate([
        { $match: { user: userObjectId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { user: userObjectId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Budget.find({ user: userId, month: currentMonth, year: currentYear }).populate('category', 'name'),
      Expense.aggregate([
        { $match: { user: userObjectId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: '$category', amount: { $sum: '$amount' } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
        { $unwind: '$categoryInfo' },
        { $project: { name: '$categoryInfo.name', amount: 1 } },
        { $sort: { amount: -1 } },
      ]),
    ]);

    const totalIncome = incomeAgg[0] ? incomeAgg[0].total : 0;
    const totalExpense = expenseAgg[0] ? expenseAgg[0].total : 0;

    // 2. Savings Rate Calculation
    let savingsRate = 0;
    if (totalIncome > 0) {
      savingsRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
    }

    // 3. Budget Compliance
    let exceededBudgetsCount = 0;
    let totalBudgetsCount = budgets.length;

    budgets.forEach((b) => {
      const catExp = categoryExpenses.find((c) => c.name === b.category?.name);
      const spent = catExp ? catExp.amount : 0;
      if (spent > b.amountLimit) {
        exceededBudgetsCount++;
      }
    });

    const budgetComplianceRate = totalBudgetsCount > 0
      ? Math.round(((totalBudgetsCount - exceededBudgetsCount) / totalBudgetsCount) * 100)
      : 100;

    // 4. Financial Health Score Engine (0 - 100)
    let score = 50; // Base score

    // Savings Component (+30 / -30)
    if (totalIncome > 0) {
      if (savingsRate >= 30) score += 30;
      else if (savingsRate >= 20) score += 20;
      else if (savingsRate >= 10) score += 10;
      else if (savingsRate >= 0) score += 5;
      else score -= 25; // Spending > Income
    }

    // Budget Compliance Component (+20 / -20)
    if (totalBudgetsCount > 0) {
      if (budgetComplianceRate === 100) score += 20;
      else if (budgetComplianceRate >= 75) score += 10;
      else if (budgetComplianceRate < 50) score -= 15;
    }

    // Cap score bounds between 0 and 100
    score = Math.min(100, Math.max(0, score));

    // Determine Health Status Label
    let statusLabel = 'Fair';
    let statusColor = 'yellow';
    if (score >= 80) {
      statusLabel = 'Excellent';
      statusColor = 'emerald';
    } else if (score >= 65) {
      statusLabel = 'Good';
      statusColor = 'blue';
    } else if (score < 50) {
      statusLabel = 'At Risk';
      statusColor = 'red';
    }

    // 5. Generate AI Smart Insights
    const recommendations = [];

    if (totalIncome === 0 && totalExpense > 0) {
      recommendations.push({
        type: 'warning',
        title: 'No Income Recorded',
        message: 'You have expenses logged this month without any income records.',
      });
    }

    if (totalIncome > 0 && totalExpense > totalIncome) {
      recommendations.push({
        type: 'danger',
        title: 'Deficit Alert',
        message: `Your expenses exceed your income by $${(totalExpense - totalIncome).toFixed(2)}. Consider cutting non-essential spending.`,
      });
    } else if (savingsRate >= 20) {
      recommendations.push({
        type: 'success',
        title: 'Healthy Savings Rate',
        message: `Great job! You saved ${savingsRate}% of your income this month. Keep building your emergency fund.`,
      });
    }

    if (exceededBudgetsCount > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Budget Overrun',
        message: `You have exceeded limits on ${exceededBudgetsCount} budget category(ies). Review your budget allocations.`,
      });
    }

    if (categoryExpenses.length > 0 && totalExpense > 0) {
      const topCategory = categoryExpenses[0];
      const topPercentage = Math.round((topCategory.amount / totalExpense) * 100);

      if (topPercentage >= 35) {
        recommendations.push({
          type: 'info',
          title: 'Top Expense Concentration',
          message: `${topCategory.name} accounts for ${topPercentage}% ($${topCategory.amount.toFixed(2)}) of your total expenses this month.`,
        });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        title: 'Balanced Finances',
        message: 'Your spending and budget management are on track for this month.',
      });
    }

    return {
      healthScore: score,
      statusLabel,
      statusColor,
      metrics: {
        totalIncome,
        totalExpense,
        savingsRate,
        budgetComplianceRate,
        exceededBudgetsCount,
        totalBudgetsCount,
      },
      insights: recommendations,
    };
  },
};

module.exports = insightService;
