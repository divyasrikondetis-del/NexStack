const axios = require("axios");

const SUPPORTED_LANGUAGES = ["en", "es", "hi", "pt", "zh", "fr"];
const TRANSLATION_API_URL = process.env.TRANSLATION_API_URL || "https://libretranslate.com/translate";
const FALLBACK_TRANSLATION_URL = "https://api.mymemory.translated.net/get";

const isSupportedTranslationLanguage = (languageCode) =>
  SUPPORTED_LANGUAGES.includes(languageCode);

const fallbackTranslateText = async (text, targetLanguage) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  if (!isSupportedTranslationLanguage(targetLanguage) || targetLanguage === "en") {
    return text;
  }

  const response = await axios.get(FALLBACK_TRANSLATION_URL, {
    params: {
      q: text,
      langpair: `en|${targetLanguage}`,
      mt: 1,
      onlyprivate: 0,
    },
    timeout: 15000,
  });

  return response?.data?.responseData?.translatedText || text;
};

const translateText = async (text, targetLanguage) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  if (!isSupportedTranslationLanguage(targetLanguage)) {
    targetLanguage = "en";
  }

  const payload = {
    q: text,
    source: "auto",
    target: targetLanguage,
    format: "text",
  };

  if (process.env.TRANSLATION_API_KEY) {
    payload.api_key = process.env.TRANSLATION_API_KEY;
  }

  try {
    const response = await axios.post(TRANSLATION_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    if (response?.data?.translatedText) {
      return response.data.translatedText;
    }

    throw new Error("Translation service did not return translated text.");
  } catch (error) {
    console.error("Primary translation service failed, using fallback:", error.message || error);
    return fallbackTranslateText(text, targetLanguage);
  }
};

module.exports = {
  isSupportedTranslationLanguage,
  translateText,
};
