import { Room, RoomEvent, RemoteParticipant, RemoteTrackPublication, RemoteTrack } from 'livekit-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class LiveKitService {
    /**
     * Get a LiveKit token from the backend
     */
    static async getToken(roomName: string, participantName: string): Promise<string> {
        const response = await fetch(`${API_URL}/api/voice/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                room_name: roomName,
                participant_name: participantName,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch LiveKit token');
        }

        const data = await response.json();
        return data.token;
    }

    /**
     * Connect to a LiveKit room
     */
    static async connectToRoom(token: string, url: string): Promise<Room> {
        const room = new Room({
            adaptiveStream: true,
            dynacast: true,
        });

        await room.connect(url, token);
        return room;
    }
}
