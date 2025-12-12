import { useState, useEffect, useCallback } from 'react';
import { Room, RoomEvent, RemoteParticipant, RemoteTrackPublication, RemoteTrack, Track } from 'livekit-client';
import { useLiveKitRoom } from '@livekit/components-react';

interface UseLiveKitAudioProps {
    token: string;
    serverUrl: string;
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (error: Error) => void;
}

export function useLiveKitAudio({ token, serverUrl, onConnected, onDisconnected, onError }: UseLiveKitAudioProps) {
    const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
    const [agentAudioLevel, setAgentAudioLevel] = useState(0);

    const { room, isConnecting, state, error } = useLiveKitRoom({
        token,
        serverUrl,
        connect: !!token && !!serverUrl,
        audio: true,
        video: false,
    });

    useEffect(() => {
        if (error && onError) {
            onError(error);
        }
    }, [error, onError]);

    useEffect(() => {
        if (!room) return;

        const handleActiveSpeakers = (speakers: RemoteParticipant[]) => {
            // Check if any speaker is the agent
            const agentSpeaking = speakers.some(p => p.identity.startsWith('agent-'));
            setIsAgentSpeaking(agentSpeaking);
        };

        const handleAudioStream = (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
            if (track.kind === Track.Kind.Audio && participant.identity.startsWith('agent-')) {
                track.attach();
            }
        };

        room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakers);
        room.on(RoomEvent.TrackSubscribed, handleAudioStream);

        if (state === 'connected' && onConnected) {
            onConnected();
        }

        if (state === 'disconnected' && onDisconnected) {
            onDisconnected();
        }

        return () => {
            room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakers);
            room.off(RoomEvent.TrackSubscribed, handleAudioStream);
        };
    }, [room, state, onConnected, onDisconnected]);

    return {
        room,
        isConnecting,
        connectionState: state,
        isAgentSpeaking,
        agentAudioLevel
    };
}
