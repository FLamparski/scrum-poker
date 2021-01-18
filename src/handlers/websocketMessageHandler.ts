import { ApiGatewayManagementApi } from 'aws-sdk';
import { 
    APIGatewayProxyEvent, 
    APIGatewayProxyResult 
} from 'aws-lambda';
import { ClearVotesMessage, VoteMessage, WSMessage, WSMessageType } from '../models/ws-messages';
import { saveRoomPlayer, findPlayersByRoomName, findPlayerByRoomNameAndConnectionId } from '../db/roomPlayers';
import { findRoomByName, saveRoom } from '../db/rooms';
import { saveVote, findVotesByRoomName, deleteVoteByRoomNameAndPlayerNames } from '../db/votes';
import { sample } from 'lodash';

export default async function (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const client = new ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
    });

    const message: WSMessage = JSON.parse(event.body!);

    switch(message.type) {
        case WSMessageType.CREATE_ROOM:
            const roomName = await createRoom(event.requestContext.connectionId!);
            return respondToWebsocket(client, event, {
                type: WSMessageType.ROOM_CREATED,
                roomName,
            });
        case WSMessageType.JOIN_ROOM:
            await joinRoom(client, message.playerName, event.requestContext.connectionId!, message.roomName);
            return { statusCode: 200, body: 'handled' };
        case WSMessageType.VOTE:
            await vote(client, message, event.requestContext.connectionId!);
            return { statusCode: 200, body: 'handled' };
        case WSMessageType.CLEAR_VOTES:
            await clearVotes(client, message, event.requestContext.connectionId!);
            return { statusCode: 200, body: 'handled' };
        default:
            return respondToWebsocket(client, event, {
                error: `Unknown message type: ${message.type}`
            });
    }
}

async function createRoom(connectionId: string): Promise<string> {
    const roomName = getRoomName();
    const existingRoom = await findRoomByName(roomName);
    if (existingRoom) {
        return Promise.reject();
    }

    await saveRoom({
        room: roomName,
        connectionId,
    });

    return roomName;
}

function getRoomName(): string {
    const ID_CHARS = 'QWERTYUIOPASDFGHJKLZXCVBNM'.split('');
    let name = '';
    for (let n = 0; n < 4; n++) {
        name += sample(ID_CHARS);
    }
    return name;
}

async function joinRoom(client: ApiGatewayManagementApi, playerName: string, playerConnectionId: string, roomName: string): Promise<void> {
    const room = await findRoomByName(roomName);
    if (!room) {
        return Promise.reject();
    }

    await saveRoomPlayer({
        room: roomName,
        player: playerName,
        connectionId: playerConnectionId,
    });

    const allRoomPlayers = await findPlayersByRoomName(roomName);

    const allPlayerNames = allRoomPlayers.map(({ player }) => player);
    await client.postToConnection({
        ConnectionId: playerConnectionId,
        Data: JSON.stringify({
            type: WSMessageType.PLAYER_JOINED,
            playerName,
            allPlayerNames: [],
        }),
    }).promise();

    await client.postToConnection({
        ConnectionId: room.connectionId,
        Data: JSON.stringify({
            type: WSMessageType.PLAYER_JOINED,
            playerName,
            allPlayerNames,
        }),
    }).promise();
}

async function vote(client: ApiGatewayManagementApi, message: VoteMessage, playerConnectionId: string): Promise<void> {
    const player = await findPlayerByRoomNameAndConnectionId(message.roomName, playerConnectionId);
    if (!player) {
        return Promise.reject();
    }

    const room = await findRoomByName(message.roomName);
    if (!room) {
        return Promise.reject();
    }

    await saveVote({
        room: message.roomName,
        user: player.player,
        value: message.value,
    });

    const roomVotes = await findVotesByRoomName(message.roomName);
    const playerToVote = {};
    for (const { user, value } of roomVotes || []) {
        playerToVote[user] = value;
    }

    await client.postToConnection({
        ConnectionId: room.connectionId,
        Data: JSON.stringify({
            type: WSMessageType.VOTES_UPDATED,
            roomName: message.roomName,
            votes: playerToVote,
        }),
    }).promise();
}

async function clearVotes(client: ApiGatewayManagementApi, message: ClearVotesMessage, roomConnectionId: string): Promise<void> {
    const allRoomPlayers = await findPlayersByRoomName(message.roomName);

    await deleteVoteByRoomNameAndPlayerNames(
        message.roomName,
        allRoomPlayers.map(({ player }) => player)
    );

    const clearedMessage = { type: WSMessageType.VOTES_CLEARED, roomName: message.roomName };
    await Promise.all(allRoomPlayers.map(({ connectionId }) => client.postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(clearedMessage),
    }).promise()));

    await client.postToConnection({
        ConnectionId: roomConnectionId,
        Data: JSON.stringify(clearedMessage),
    }).promise();
}

async function respondToWebsocket(client: ApiGatewayManagementApi, event: APIGatewayProxyEvent, wsMessage: any): Promise<APIGatewayProxyResult> {
    await client.postToConnection({
        ConnectionId: event.requestContext.connectionId!,
        Data: JSON.stringify(wsMessage),
    }).promise();

    return {
        statusCode: 200,
        body: 'handled',
    };
}
