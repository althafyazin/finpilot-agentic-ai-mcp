const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

class BudgetService {
  /**
   * Creates or updates a budget target for a category in a specific month/year.
   * @param {String} userId - Mongo ObjectId of user
   * @param {Object} budgetData - { category, amountLimit, month, year }
   * @returns {Object} Created or updated populated budget document
   */
  async createOrUpdateBudget(userId, budgetData) {
    const { category, amountLimit, month, year } = budgetData;

    if (!category || !amountLimit || !month || !year) {
      throw new AppError('Category, amount limit, month, and year are required.', 400);
    }

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      throw new AppError('Specified category does not exist.', 404);
    }

    const budget = await Budget.findOneAndUpdate(
      { user: userId, category, month: parseInt(month, 10), year: parseInt(year, 10) },
      { amountLimit: parseFloat(amountLimit) },
      { upsert: true, new: true, runValidators: true }
    ).populate('category', 'name icon color type');

    return budget;
  }

  /**
   * Retrieves user budgets for a specified month/year with real-time expense spending metrics.
   * @param {String} userId - Mongo ObjectId of user
   * @param {Number} [month] - Month number (1-12)
   * @param {Number} [year] - Year number (e.g. 2026)
   * @returns {Object} { budgets, summary }
   */
  async getBudgetsWithProgress(userId, month, year) {
    const now = new Date();
    const targetMonth = parseInt(month, 10) || now.getMonth() + 1;
    const targetYear = parseInt(year, 10) || now.getFullYear();

    // Calculate month start & end dates for expense matching
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    // 1. Fetch User Budgets for the given month & year
    const budgets = await Budget.find({
      user: userId,
      month: targetMonth,
      year: targetYear,
    }).populate('category', 'name icon color type');

    // 2. Aggregate Actual Monthly Expenses grouped by Category
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const expenseAggregates = await Expense.aggregate([
      {
        $match: {
          user: userObjectId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    // Create a fast lookup map for spent amounts per category ID
    const spentMap = {};
    expenseAggregates.forEach((item) => {
      spentMap[item._id.toString()] = item.totalSpent;
    });

    let totalBudgeted = 0;
    let totalSpentInBudgets = 0;

    // 3. Map Budgets with Real-Time Progress Metrics
    const enrichedBudgets = await Promise.all(
      budgets.map(async (b) => {
        const spentAmount = spentMap[b.category._id.toString()] || 0;
        const remainingAmount = Math.max(0, b.amountLimit - spentAmount);
        const percentageUsed = Number(((spentAmount / b.amountLimit) * 100).toFixed(1));

        let status = 'normal';
        if (percentageUsed >= 100) {
          status = 'exceeded';
        } else if (percentageUsed >= 80) {
          status = 'warning';
        }

        totalBudgeted += b.amountLimit;
        totalSpentInBudgets += spentAmount;

        // Generate automated notification if limit warning or exceeded
        if (status === 'warning' || status === 'exceeded') {
          const alertType = status === 'exceeded' ? 'budget_exceeded' : 'budget_warning';
          const alertMessage =
            status === 'exceeded'
              ? `Alert: You have exceeded your ${b.category.name} budget for ${targetMonth}/${targetYear}! Spent: $${spentAmount.toFixed(2)} / Limit: $${b.amountLimit.toFixed(2)}`
              : `Warning: You have used ${percentageUsed}% of your ${b.category.name} budget for ${targetMonth}/${targetYear}.`;

          // Check if alert already logged for this user & category this month to avoid spam
          const existingNotification = await Notification.findOne({
            user: userId,
            type: alertType,
            message: { $regex: b.category.name, $options: 'i' },
          });

          if (!existingNotification) {
            await Notification.create({
              user: userId,
              type: alertType,
              message: alertMessage,
            });
          }
        }

        return {
          _id: b._id,
          category: b.category,
          amountLimit: b.amountLimit,
          month: b.month,
          year: b.year,
          spentAmount: Number(spentAmount.toFixed(2)),
          remainingAmount: Number(remainingAmount.toFixed(2)),
          percentageUsed,
          status,
        };
      })
    );

    const overallPercentageUsed =
      totalBudgeted > 0 ? Number(((totalSpentInBudgets / totalBudgeted) * 100).toFixed(1)) : 0;

    return {
      budgets: enrichedBudgets,
      summary: {
        totalBudgeted: Number(totalBudgeted.toFixed(2)),
        totalSpentInBudgets: Number(totalSpentInBudgets.toFixed(2)),
        overallPercentageUsed,
      },
    };
  }

  /**
   * Updates an existing budget's limit.
   * @param {String} userId - Mongo ObjectId of user
   * @param {String} budgetId - Mongo ObjectId of budget
   * @param {Number} amountLimit - New target limit
   * @returns {Object} Updated budget document
   */
  async updateBudget(userId, budgetId, amountLimit) {
    if (!amountLimit || amountLimit < 1) {
      throw new AppError('Amount limit must be at least 1.', 400);
    }

    const updatedBudget = await Budget.findOneAndUpdate(
      { _id: budgetId, user: userId },
      { amountLimit },
      { new: true, runValidators: true }
    ).populate('category', 'name icon color type');

    if (!updatedBudget) {
      throw new AppError('Budget record not found or unauthorized.', 404);
    }

    return updatedBudget;
  }

  /**
   * Deletes a budget record owned by user.
   * @param {String} userId - Mongo ObjectId of user
   * @param {String} budgetId - Mongo ObjectId of budget
   */
  async deleteBudget(userId, budgetId) {
    const deletedBudget = await Budget.findOneAndDelete({ _id: budgetId, user: userId });

    if (!deletedBudget) {
      throw new AppError('Budget record not found or unauthorized.', 404);
    }
  }
}

module.exports = new BudgetService();
