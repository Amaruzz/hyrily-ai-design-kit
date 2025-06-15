
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Play, Square } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface VoiceRecorderProps {
  onAudioReady: (audioBlob: Blob) => void;
  onTranscriptReady: (transcript: string) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
}

const VoiceRecorder = ({ onAudioReady, onTranscriptReady, isRecording, setIsRecording }: VoiceRecorderProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition();

  const startRecording = async () => {
    try {
      resetTranscript();
      
      // Start audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        onAudioReady(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start speech recognition if supported
      if (isSupported) {
        startListening();
      }
      
      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop speech recognition
      if (isListening) {
        stopListening();
      }
      
      // Send transcript if available
      if (transcript.trim()) {
        onTranscriptReady(transcript);
      }
      
      toast({
        title: "Recording Stopped",
        description: "Audio recorded successfully!",
      });
    }
  };

  const playRecording = () => {
    if (recordedAudio) {
      const audioUrl = URL.createObjectURL(recordedAudio);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
      setIsPlaying(true);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center space-x-4">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            className="bg-red-500 hover:bg-red-600 text-white"
            size="lg"
          >
            <Mic className="w-5 h-5 mr-2" />
            Start Recording
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 text-white animate-pulse"
            size="lg"
          >
            <MicOff className="w-5 h-5 mr-2" />
            Stop Recording
          </Button>
        )}
        
        {recordedAudio && !isRecording && (
          <>
            {!isPlaying ? (
              <Button onClick={playRecording} variant="outline">
                <Play className="w-4 h-4 mr-2" />
                Play Recording
              </Button>
            ) : (
              <Button onClick={stopPlayback} variant="outline">
                <Square className="w-4 h-4 mr-2" />
                Stop Playback
              </Button>
            )}
          </>
        )}
      </div>
      
      {isRecording && (
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-500 font-medium">Recording in progress...</span>
          </div>
          <p className="text-sm text-medium-gray mt-2">
            Speak clearly and take your time to answer the question
          </p>
          {transcript && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Live Transcript:</p>
              <p className="text-sm">{transcript}</p>
            </div>
          )}
        </div>
      )}
      
      {recordedAudio && !isRecording && (
        <div className="text-center">
          <p className="text-green-600 font-medium">✓ Audio recorded successfully!</p>
          <p className="text-sm text-medium-gray">
            You can play it back to review or submit your response
          </p>
          {transcript && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Transcription:</p>
              <p className="text-sm text-gray-700">{transcript}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
