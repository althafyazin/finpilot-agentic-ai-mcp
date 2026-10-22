const aiService = require('../services/aiService');
const { sendSuccess } = require('../utils/response');

/**
 * AI Chat Controller
 * Thin controller — delegates all logic to aiService.
 */
const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    const result = await aiService.chat(req.user._id, message);
    return sendSuccess(res, 200, 'AI response generated successfully', result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chat,
};
