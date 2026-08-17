const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'pt', label: 'Português' },
  { code: 'zh', label: '中文' },
  { code: 'fr', label: 'Français' },
];

const getRequiredVerification = (languageCode) => {
  return { method: 'email', channel: 'email' };
};

const getLanguageLabel = (languageCode) => {
  const language = SUPPORTED_LANGUAGES.find((item) => item.code === languageCode);
  return language ? language.label : 'English';
};

const isSupportedLanguage = (languageCode) =>
  SUPPORTED_LANGUAGES.some((item) => item.code === languageCode);

module.exports = {
  SUPPORTED_LANGUAGES,
  getRequiredVerification,
  getLanguageLabel,
  isSupportedLanguage,
};
