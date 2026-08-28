import { API_BASE_URL } from "./apiConfig";

export const aiAssistantService = {
  /**
   * Posts natural language message to AI assistant backend endpoint.
   * @param {string} message 
   */
  async askAIAssistant(message) {
    const response = await fetch(`${API_BASE_URL}/ai-assistant/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.error || `AI assistant request failed with status ${response.status}`);
    }

    return result;
  }
};

export default aiAssistantService;
