import os
from livekit import api
from datetime import timedelta
from typing import Optional

# Environment variables
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "wss://your-project.livekit.cloud")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

class LiveKitService:
    @staticmethod
    def get_token(
        room_name: str, 
        participant_identity: str, 
        participant_name: str,
        can_publish: bool = True,
        can_subscribe: bool = True
    ) -> str:
        """
        Generate a LiveKit access token for a participant.
        """
        if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
            raise ValueError("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set")

        grant = api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=can_publish,
            can_subscribe=can_subscribe,
        )

        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
            .with_identity(participant_identity) \
            .with_name(participant_name) \
            .with_grants(grant) \
            .with_ttl(timedelta(hours=1))
        
        return token.to_jwt()

    @staticmethod
    async def create_sip_participant(
        sip_trunk_id: str, 
        phone_number: str, 
        room_name: str,
        agent_id: str
    ):
        """
        Programmatically create a SIP participant (Outbound).
        For Inbound, LiveKit SIP Ingress handles this automatically via config.
        """
        # This requires the LiveKit SIP API (Egress/Ingress) to be configured
        # For now, we'll just log it as a placeholder for future implementation
        print(f"Creating SIP participant for {phone_number} in room {room_name}")
        pass

    @staticmethod
    def verify_webhook(request_body: str, auth_token: str) -> bool:
        """
        Verify incoming LiveKit webhooks
        """
        receiver = api.WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        try:
            receiver.receive(request_body, auth_token)
            return True
        except Exception:
            return False
