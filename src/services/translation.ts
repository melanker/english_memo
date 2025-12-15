const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

export interface TranslationResult {
  success: boolean;
  translation: string;
  error?: string;
}

export const translateToHebrew = async (englishWord: string): Promise<TranslationResult> => {
  try {
    const response = await fetch(
      `${MYMEMORY_API}?q=${encodeURIComponent(englishWord)}&langpair=en|he`
    );
    
    if (!response.ok) {
      throw new Error('Translation API error');
    }
    
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return {
        success: true,
        translation: data.responseData.translatedText
      };
    }
    
    return {
      success: false,
      translation: '',
      error: 'לא נמצא תרגום'
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      success: false,
      translation: '',
      error: 'שגיאה בתרגום - נא להזין תרגום ידנית'
    };
  }
};

export const speakWord = (word: string, lang: string = 'en-US'): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = lang;
    utterance.rate = 0.8;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
};

