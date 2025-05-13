interface ApiConfig {
  key: string;
  model: string;
  parameters: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
  };
}

export const API_CONFIG: ApiConfig = {
  key: 'AIzaSyAKwgv4Wn6tcGplmJWsPZA3zhQOgr16nlI',
  model: 'gemini-2.0-flash',
  parameters: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024
  }
};

export const getApiConfig = (): ApiConfig => {
  return API_CONFIG;
};

// For backward compatibility
export const getNextAvailableApiConfig = (): ApiConfig => {
  return getApiConfig();
};

export const incrementApiUsage = async (tokenCount: number = 0): Promise<void> => {
  // No-op since we removed rate limits
  return Promise.resolve();
}; 