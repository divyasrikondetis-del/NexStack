const { translateText, isSupportedTranslationLanguage } = require("../utils/translation");

const translate = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ message: "Both text and targetLanguage are required." });
    }

    if (!isSupportedTranslationLanguage(targetLanguage)) {
      return res.status(400).json({ message: "Unsupported translation language." });
    }

    const translatedText = await translateText(text, targetLanguage);

    res.status(200).json({ translatedText });
  } catch (error) {
    res.status(500).json({ message: error.message || "Translation failed." });
  }
};

const translateBatch = async (req, res) => {
  try {
    const { texts, targetLanguage } = req.body;

    if (!Array.isArray(texts) || texts.length === 0 || !targetLanguage) {
      return res.status(400).json({ message: "Both texts and targetLanguage are required." });
    }

    if (!isSupportedTranslationLanguage(targetLanguage)) {
      return res.status(400).json({ message: "Unsupported translation language." });
    }

    const translatedTexts = [];
    for (const text of texts) {
      const translatedText = await translateText(text, targetLanguage);
      translatedTexts.push(translatedText);
    }

    res.status(200).json({ translatedTexts });
  } catch (error) {
    res.status(500).json({ message: error.message || "Batch translation failed." });
  }
};

module.exports = {
  translate,
  translateBatch,
};
