export const enum WSMessageType {
    CREATE_ROOM = 'CREATE_ROOM',
    JOIN_ROOM = 'JOIN_ROOM',
    VOTE = 'VOTE',
    CLEAR_VOTES = 'CLEAR_VOTES',

    PLAYER_JOINED = 'PLAYER_JOINED',
    PLAYER_JOIN_ERROR = 'PLAYER_JOIN_ERROR',
    PLAYER_LEFT = 'PLAYER_LEFT',
    ROOM_CREATED = 'ROOM_CREATED',
    ROOM_DESTROYED = 'ROOM_DESTROYED',
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

export interface PlayerJoinErrorMessage {
    type: WSMessageType.PLAYER_JOIN_ERROR;
    playerName: string;
    error: string;
}

export interface PlayerLeftMessage {
    type: WSMessageType.PLAYER_LEFT;
    playerName: string;
    allPlayerNames: string[];
}

export interface RoomCreatedMessage {
    type: WSMessageType.ROOM_CREATED;
    roomName: string;
}

export interface RoomDestroyedMessage {
    type: WSMessageType.ROOM_DESTROYED;
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
    | PlayerJoinErrorMessage
    | PlayerLeftMessage
    | RoomCreatedMessage
    | RoomDestroyedMessage
    | VotesUpdatedMessage
    | VotesClearedMessage;