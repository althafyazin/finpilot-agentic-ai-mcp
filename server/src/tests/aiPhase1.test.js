const test = require('node:test');
const assert = require('node:assert');
const { createToolsForUser } = require('../services/aiTools');
const aiService = require('../services/aiService');
const Category = require('../models/Category');
const expenseService = require('../services/expenseService');

test('AI Tools - Factory and Registration', async (t) => {
  await t.test('createToolsForUser includes all foundational required tools', () => {
    const userId = '60d5ecb8b392d7001f5f3e99';
    const tools = createToolsForUser(userId);

    assert.ok(tools.length >= 5);
    const names = tools.map((t) => t.name);
    const foundational = [
      'get_expenses',
      'get_income',
      'get_financial_summary',
      'get_budget_status',
      'get_category_breakdown',
    ];
    for (const name of foundational) {
      assert.ok(names.includes(name), `Should include ${name}`);
    }
  });

  await t.test('Tool schemas validate parameters strictly', () => {
    const userId = '60d5ecb8b392d7001f5f3e99';
    const tools = createToolsForUser(userId);
    const getExpenses = tools.find((t) => t.name === 'get_expenses');

    // Valid parameters
    const valid = getExpenses.schema.safeParse({ month: 5, year: 2026, categoryName: 'Food' });
    assert.strictEqual(valid.success, true);

    // Invalid month (> 12)
    const invalidMonth = getExpenses.schema.safeParse({ month: 13, year: 2026 });
    assert.strictEqual(invalidMonth.success, false);

    // Invalid year (< 2020)
    const invalidYear = getExpenses.schema.safeParse({ month: 5, year: 2019 });
    assert.strictEqual(invalidYear.success, false);
  });
});

test('AI Tools - Category Filtering and Resolution', async (t) => {
  const userId = '60d5ecb8b392d7001f5f3e99';
  const tools = createToolsForUser(userId);
  const getExpenses = tools.find((t) => t.name === 'get_expenses');

  await t.test('Resolves existing category and passes categoryId to expenseService', async () => {
    const originalFindOne = Category.findOne;
    const originalGetExpenses = expenseService.getExpenses;

    const mockCategoryId = '60d5ecb8b392d7001f5f3e01';
    let passedCategoryId = null;

    Category.findOne = () => ({
      _id: mockCategoryId,
      name: 'Groceries',
      type: 'expense',
    });

    expenseService.getExpenses = async (uid, params) => {
      passedCategoryId = params.categoryId;
      return {
        expenses: [
          {
            title: 'Weekly grocery run',
            amount: 120,
            category: { name: 'Groceries' },
            date: new Date('2026-10-05'),
          },
        ],
        pagination: { totalRecords: 1 },
        summary: { totalExpenseAmount: 120 },
      };
    };

    try {
      const resultJson = await getExpenses.invoke({ month: 10, year: 2026, categoryName: 'groceries' });
      const parsed = JSON.parse(resultJson);

      assert.strictEqual(passedCategoryId, mockCategoryId, 'Should pass categoryId to expenseService');
      assert.strictEqual(parsed.category, 'Groceries');
      assert.strictEqual(parsed.totalExpenseAmount, 120);
      assert.strictEqual(parsed.expenseCount, 1);
    } finally {
      Category.findOne = originalFindOne;
      expenseService.getExpenses = originalGetExpenses;
    }
  });

  await t.test('Handles unknown category gracefully without returning unfiltered data', async () => {
    const originalFindOne = Category.findOne;
    const originalFind = Category.find;
    const originalGetExpenses = expenseService.getExpenses;

    let expenseServiceCalled = false;

    Category.findOne = () => null; // Category not found
    Category.find = () => ({
      select: () => [{ name: 'Food' }, { name: 'Transport' }, { name: 'Utilities' }],
    });

    expenseService.getExpenses = async () => {
      expenseServiceCalled = true;
      return { expenses: [], pagination: { totalRecords: 0 }, summary: { totalExpenseAmount: 0 } };
    };

    try {
      const resultJson = await getExpenses.invoke({ month: 10, year: 2026, categoryName: 'Spaceship Fuel' });
      const parsed = JSON.parse(resultJson);

      assert.strictEqual(expenseServiceCalled, false, 'Should not query expenses if category is unknown');
      assert.strictEqual(parsed.matched, false);
      assert.strictEqual(parsed.totalExpenseAmount, 0);
      assert.ok(parsed.message.includes('No expense category named "Spaceship Fuel" was found'));
      assert.ok(parsed.message.includes('Food, Transport, Utilities'));
    } finally {
      Category.findOne = originalFindOne;
      Category.find = originalFind;
      expenseService.getExpenses = originalGetExpenses;
    }
  });
});

test('AI Service - Input Validation and Key Handling', async (t) => {
  const userId = '60d5ecb8b392d7001f5f3e99';

  await t.test('Rejects empty or whitespace messages', async () => {
    await assert.rejects(
      async () => aiService.chat(userId, ''),
      (err) => err.statusCode === 400 && err.message.includes('Message is required')
    );

    await assert.rejects(
      async () => aiService.chat(userId, '   '),
      (err) => err.statusCode === 400 && err.message.includes('Message is required')
    );
  });

  await t.test('Rejects messages exceeding 2000 characters', async () => {
    const longMessage = 'a'.repeat(2001);
    await assert.rejects(
      async () => aiService.chat(userId, longMessage),
      (err) => err.statusCode === 400 && err.message.includes('too long')
    );
  });

  await t.test('Fails fast with 503 if API key is not configured', async () => {
    // If GOOGLE_GEMINI_API_KEY is not set in env, it should throw a 503 AppError
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      await assert.rejects(
        async () => aiService.chat(userId, 'What is my budget?'),
        (err) => err.statusCode === 503 && err.message.includes('GOOGLE_GEMINI_API_KEY')
      );
    }
  });
});
