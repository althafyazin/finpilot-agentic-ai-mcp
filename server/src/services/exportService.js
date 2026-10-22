const Expense = require('../models/Expense');
const Income = require('../models/Income');

/**
 * Utility to escape field value for RFC 4180 CSV compliance
 */
const escapeCsvField = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Service to generate CSV reports for financial records
 */
const exportService = {
  async generateFinancialCsv(userId, options = {}) {
    const { type = 'all', startDate, endDate } = options;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const queryFilter = { user: userId };
    if (startDate || endDate) queryFilter.date = dateFilter;

    let records = [];

    if (type === 'expense' || type === 'all') {
      const expenses = await Expense.find(queryFilter)
        .populate('category', 'name type icon')
        .sort({ date: -1 })
        .lean();

      expenses.forEach((item) => {
        records.push({
          type: 'Expense',
          title: item.title,
          amount: item.amount,
          category: item.category ? item.category.name : 'Uncategorized',
          paymentMethod: item.paymentMethod || 'Cash',
          date: new Date(item.date).toISOString().split('T')[0],
          description: item.description || '',
        });
      });
    }

    if (type === 'income' || type === 'all') {
      const incomes = await Income.find(queryFilter)
        .populate('category', 'name type icon')
        .sort({ date: -1 })
        .lean();

      incomes.forEach((item) => {
        records.push({
          type: 'Income',
          title: item.source,
          amount: item.amount,
          category: item.category ? item.category.name : 'Uncategorized',
          paymentMethod: item.source || 'Direct Deposit',
          date: new Date(item.date).toISOString().split('T')[0],
          description: item.description || '',
        });
      });
    }

    // Sort all records chronologically descending
    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Define CSV Headers
    const headers = ['Transaction Type', 'Title', 'Amount ($)', 'Category', 'Method/Source', 'Date', 'Description'];
    const csvRows = [headers.map(escapeCsvField).join(',')];

    // Build CSV Row Lines
    records.forEach((row) => {
      csvRows.push([
        escapeCsvField(row.type),
        escapeCsvField(row.title),
        escapeCsvField(row.amount.toFixed(2)),
        escapeCsvField(row.category),
        escapeCsvField(row.paymentMethod),
        escapeCsvField(row.date),
        escapeCsvField(row.description),
      ].join(','));
    });

    return '\uFEFF' + csvRows.join('\r\n');
  },
};

module.exports = exportService;
