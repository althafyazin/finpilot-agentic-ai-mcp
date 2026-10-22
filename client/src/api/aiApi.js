import axiosInstance from './axiosInstance';

const aiApi = {
  /**
   * Send a natural-language message to the AI assistant.
   * @param {String} message - User's question
   * @returns {Object} { response: string, toolsUsed: string[] }
   */
  chat: (message) => axiosInstance.post('/ai/chat', { message }),
};

export default aiApi;
