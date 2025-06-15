
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
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      console.log('Speech recognition started - Hyrily is listening');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';
      
      // Process all results
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;
        
        if (result.isFinal) {
          finalText += transcriptText + ' ';
        } else {
          interimText += transcriptText;
        }
      }
      
      // Update interim transcript immediately for real-time display
      setInterimTranscript(interimText);
      
      // Update final transcript when speech segments are complete
      if (finalText) {
        setFinalTranscript(prev => prev + finalText);
        console.log('New final transcript:', finalText);
      }
      
      // Combine final and interim for complete real-time display
      const combinedTranscript = finalTranscript + finalText + interimText;
      setTranscript(combinedTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'no-speech') {
        console.log('No speech detected, continuing to listen...');
        return; // Don't treat as fatal error
      }
      
      if (event.error === 'audio-capture') {
        setError('Microphone access denied or not available');
        setIsListening(false);
        return;
      }
      
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied');
        setIsListening(false);
        return;
      }
      
      // For network errors or aborted, try to restart automatically
      if (event.error === 'network' || event.error === 'aborted') {
        console.log('Network/abort error, will restart listening...');
        if (isListening) {
          restartTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && isListening) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log('Failed to restart recognition:', e);
              }
            }
          }, 1000);
        }
      } else {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      
      // Auto-restart if we were supposed to be listening
      if (isListening && !error) {
        console.log('Auto-restarting speech recognition...');
        restartTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.log('Failed to restart recognition:', e);
            }
          }
        }, 500);
      }
    };

    recognitionRef.current = recognition;
    isInitialized.current = true;
  }, [isSupported, isListening, finalTranscript, error]);

  useEffect(() => {
    initializeRecognition();
    
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
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
      console.log('Starting continuous speech recognition for Hyrily...');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Failed to start speech recognition');
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      console.log('Stopping speech recognition...');
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    console.log('Resetting transcript...');
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
