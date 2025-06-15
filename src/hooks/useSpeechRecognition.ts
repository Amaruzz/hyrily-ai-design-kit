
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isInitialized = useRef(false);

  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  const initializeRecognition = useCallback(() => {
    if (!isSupported || isInitialized.current) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interimTranscriptText = '';
      let finalTranscriptText = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscriptText += transcript + ' ';
        } else {
          interimTranscriptText += transcript;
        }
      }
      
      setInterimTranscript(interimTranscriptText);
      
      if (finalTranscriptText) {
        setFinalTranscript(prev => prev + finalTranscriptText);
        setTranscript(prev => prev + finalTranscriptText);
      }
      
      // Update combined transcript for real-time display
      const combinedTranscript = finalTranscript + finalTranscriptText + interimTranscriptText;
      setTranscript(combinedTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
      
      // Auto-restart on certain errors
      if (event.error === 'aborted' || event.error === 'network') {
        setTimeout(() => {
          if (recognitionRef.current && !isListening) {
            startListening();
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    isInitialized.current = true;
  }, [isSupported, isListening, finalTranscript]);

  useEffect(() => {
    initializeRecognition();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        isInitialized.current = false;
      }
    };
  }, [initializeRecognition]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    
    try {
      setError(null);
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Failed to start speech recognition');
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    
    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
    setError(null);
  }, []);

  return {
    transcript,
    interimTranscript,
    finalTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  };
};
