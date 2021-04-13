import json
from typing import Optional, Union

from dataclasses import dataclass, field

@dataclass
class PubSubMessage:
    """
    Just a container for handling a message as it comes fresh off of
    Redis pubsub
    """
    type: str
    pattern: Optional[str]
    channel: bytes
    data: Union[bytes, int]
    payload: Optional[dict] = field(init=False)

    def __post_init__(self):
        if self.is_message:
            self.payload = json.loads(self.data)
        else:
            self.payload = self.data

    @property
    def is_message(self):
        """
        This refers to Redis PubSub message type, not the Chat message
        event type
        """
        return self.type == "message" or self.type == "pmessage"
