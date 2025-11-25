/**
 * Voice Preview Component
 * Voice recording and playback
 */

import { useState, useEffect } from 'react';
import { Mic, Square, Volume2, AlertCircle } from 'lucide-react';
import { useVoiceRecording } from '../../../hooks/useVoiceRecording';
import { AgentService } from '../../../services/agentService';

interface VoicePreviewProps {
  agentId: string;
  sessionId: string;
}

export function VoicePreview({ agentId, sessionId }: VoicePreviewProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    startRecording,
    stopRecording,
    isRecording,
    audioBlob,
    isSupported,
    clearAudio,
  } = useVoiceRecording();

  // Send audio to agent when recording stops
  useEffect(() => {
    if (audioBlob) {
      sendAudioToAgent(audioBlob);
    }
  }, [audioBlob]);

  const sendAudioToAgent = async (blob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const audioResponseBlob = await AgentService.processVoice(
        agentId,
        blob,
        sessionId
      );

      // Create URL for playback
      const url = URL.createObjectURL(audioResponseBlob);
      setAudioUrl(url);

      // Auto-play response
      const audio = new Audio(url);
      audio.play();
    } catch (err) {
      console.error('Failed to process voice:', err);
      setError('Failed to process voice input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      setError(null);
      clearAudio();
      await startRecording();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  if (!isSupported) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Voice recording not supported
        </h3>
        <p className="text-gray-600">
          Your browser doesn't support voice recording. Please use a modern
          browser like Chrome, Firefox, or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Recording Controls */}
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <button
              onClick={isRecording ? stopRecording : handleStartRecording}
              disabled={isProcessing}
              className={`h-32 w-32 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
            >
              {isRecording ? (
                <Square className="h-12 w-12 text-white" />
              ) : (
                <Mic className="h-12 w-12 text-white" />
              )}
            </button>

            {isRecording && (
              <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping" />
            )}
          </div>

          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">
              {isRecording
                ? 'Recording... Click to stop'
                : isProcessing
                ? 'Processing...'
                : 'Click to start recording'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Speak naturally, the agent will respond with voice
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Audio Playback */}
        {audioUrl && (
          <div className="border-t pt-6">
            <div className="flex items-center space-x-4 bg-gray-50 rounded-lg p-4">
              <Volume2 className="h-6 w-6 text-gray-600 flex-shrink-0" />
              <audio src={audioUrl} controls className="flex-1" />
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="font-medium text-blue-900 mb-3">
            Voice Testing Tips:
          </h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Speak clearly and at a normal pace</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Wait for the agent's response before speaking again</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Test different scenarios and questions</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Check voice quality and response accuracy</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
