// Local storage helpers for session persistence
const STORAGE_KEYS = {
  BUSINESS_ID: 'fh_business_id',
  LAST_ASSESSMENT: 'fh_last_assessment',
  LANGUAGE: 'fh_language',
};

export const storage = {
  // Business ID
  getBusinessId: () => localStorage.getItem(STORAGE_KEYS.BUSINESS_ID),
  setBusinessId: (id) => localStorage.setItem(STORAGE_KEYS.BUSINESS_ID, id),
  clearBusinessId: () => localStorage.removeItem(STORAGE_KEYS.BUSINESS_ID),

  // Last assessment data
  getLastAssessment: () => {
    const data = localStorage.getItem(STORAGE_KEYS.LAST_ASSESSMENT);
    return data ? JSON.parse(data) : null;
  },
  setLastAssessment: (data) => 
    localStorage.setItem(STORAGE_KEYS.LAST_ASSESSMENT, JSON.stringify(data)),
  clearLastAssessment: () => 
    localStorage.removeItem(STORAGE_KEYS.LAST_ASSESSMENT),

  // Language preference
  getLanguage: () => localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en',
  setLanguage: (lang) => localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang),

  // Clear all data
  clear: () => {
    Object.values(STORAGE_KEYS).forEach(key => 
      localStorage.removeItem(key)
    );
  }
};
