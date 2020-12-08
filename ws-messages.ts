export const enum WSMessageType {
    CREATE_ROOM = 'CREATE_ROOM',
    JOIN_ROOM = 'JOIN_ROOM',
    VOTE = 'VOTE',
    CLEAR_VOTES = 'CLEAR_VOTES',

    PLAYER_JOINED = 'PLAYER_JOINED',
    ROOM_CREATED = 'ROOM_CREATED',
    VOTES_CLEARED = 'VOTES_CLEARED',
    VOTES_UPDATED = 'VOTES_UPDATED',
}

export interface CreateRoomMessage {
    type: WSMessageType.CREATE_ROOM;
}

export interface JoinRoomMessage {
    type: WSMessageType.JOIN_ROOM;
    playerName: string;
    roomName: string;
}

export interface VoteMessage {
    type: WSMessageType.VOTE;
    roomName: string;
    value: number;
}

export interface ClearVotesMessage {
    type: WSMessageType.CLEAR_VOTES;
    roomName: string;
}


export interface PlayerJoinedMessage {
    type: WSMessageType.PLAYER_JOINED;
    playerName: string;
    allPlayerNames: string[];
}

export interface RoomCreatedMessage {
    type: WSMessageType.ROOM_CREATED;
    roomName: string;
}

export interface VotesClearedMessage {
    type: WSMessageType.VOTES_CLEARED;
    roomName: string;
}

export interface VotesUpdatedMessage {
    type: WSMessageType.VOTES_UPDATED;
    roomName: string;
    votes: Record<string, number>;
}

export type WSMessage =
    | CreateRoomMessage
    | JoinRoomMessage
    | VoteMessage
    | ClearVotesMessage
    | PlayerJoinedMessage
    | RoomCreatedMessage
    | VotesUpdatedMessage
    | VotesClearedMessage;