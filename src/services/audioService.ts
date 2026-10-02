/**
 * Audio Service: Speech-to-Text (STT) and Text-to-Speech (TTS)
 *
 * Implements:
 * 1. Web Speech API Recognition with multi-language locale support (en-IN, hi-IN, te-IN).
 * 2. Web Speech Synthesis for accessible screen-reader-friendly read-aloud of triage results.
 */

export interface SpeechRecognitionHandler {
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

export const AudioService = {
  isRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  },

  createRecognizer(
    lang: 'en' | 'hi' | 'te',
    onResult: (transcript: string) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ): { start: () => void; stop: () => void; isSupported: boolean } {
    if (!this.isRecognitionSupported()) {
      return {
        start: () => onError('Speech recognition not supported in this browser'),
        stop: () => {},
        isSupported: false,
      };
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognizer = new SpeechRecognitionClass();

    recognizer.continuous = false;
    recognizer.interimResults = true;

    // Set locale
    if (lang === 'hi') recognizer.lang = 'hi-IN';
    else if (lang === 'te') recognizer.lang = 'te-IN';
    else recognizer.lang = 'en-IN';

    recognizer.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onResult(finalTranscript);
      }
    };

    recognizer.onerror = (event: any) => {
      onError(event.error || 'Speech error occurred');
    };

    recognizer.onend = () => {
      onEnd();
    };

    return {
      start: () => {
        try {
          recognizer.start();
        } catch {
          // already started or busy
        }
      },
      stop: () => {
        try {
          recognizer.stop();
        } catch {
          // ignore
        }
      },
      isSupported: true,
    };
  },

  speakText(text: string, lang: 'en' | 'hi' | 'te' = 'en'): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any active utterance

    const cleanText = text.replace(/[*#_~[\]]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (lang === 'hi') utterance.lang = 'hi-IN';
    else if (lang === 'te') utterance.lang = 'te-IN';
    else utterance.lang = 'en-US';

    utterance.rate = 0.95; // slightly slower for clinical clarity
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  },

  stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },
};
