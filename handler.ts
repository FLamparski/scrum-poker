import { ApiGatewayManagementApi, DynamoDB } from 'aws-sdk';
import { 
    APIGatewayProxyEvent, 
    APIGatewayProxyResult 
} from 'aws-lambda';
import { sample } from 'lodash';
import { ClearVotesMessage, VoteMessage, WSMessage, WSMessageType } from './ws-messages';

const dynamoDb = new DynamoDB.DocumentClient();

export async function connect(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    return {
        statusCode: 200,
        body: JSON.stringify({ connected: true }),
    };    
}

export async function onmessage(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
    const existingResult = await dynamoDb.get({
        TableName: process.env.DYNAMODB_ROOMS_TABLE!,
        Key: { room: roomName },
    }).promise();
    if (existingResult.Item) {
        return Promise.reject();
    }

    await dynamoDb.put({
        TableName: process.env.DYNAMODB_ROOMS_TABLE!,
        Item: {
            room: roomName,
            createdAt: Date.now(),
            ttl: Math.floor(Date.now() / 1000) + 2 * 60 * 60, // expire 2 hours from now, ish
            connectionId, // holds the connection id of the host
        },
    }).promise();

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
    const roomResult = await dynamoDb.get({
        TableName: process.env.DYNAMODB_ROOMS_TABLE!,
        Key: { room: roomName },
    }).promise();
    if (!roomResult.Item) {
        return Promise.reject();
    }
    const room = roomResult.Item;

    await dynamoDb.put({
        TableName: process.env.DYNAMODB_ROOM_PLAYERS_TABLE!,
        Item: {
            room: roomName,
            player: playerName,
            connectionId: playerConnectionId,
            ttl: Math.floor(Date.now() / 1000) + 2 * 60 * 60, // expire 2 hours from now, ish
        },
    }).promise();

    const allRoomPlayersResult = await dynamoDb.query({
        TableName: process.env.DYNAMODB_ROOM_PLAYERS_TABLE!,
        KeyConditionExpression: 'room = :roomName',
        ExpressionAttributeValues: {
            ':roomName': roomName,
        },
    }).promise();
    const allRoomPlayers = allRoomPlayersResult.Items || [];

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
    const roomPlayerResult = await dynamoDb.get({
        TableName: process.env.DYNAMODB_ROOM_PLAYERS_TABLE!,
        Key: { room: message.roomName, connectionId: playerConnectionId },
    }).promise();
    if (!roomPlayerResult.Item) {
        return Promise.reject();
    }
    const player = roomPlayerResult.Item;

    const roomResult = await dynamoDb.get({
        TableName: process.env.DYNAMODB_ROOMS_TABLE!,
        Key: { room: message.roomName },
    }).promise();
    if (!roomResult.Item) {
        return Promise.reject();
    }
    const room = roomResult.Item;

    await dynamoDb.put({
        TableName: process.env.DYNAMODB_VOTES_TABLE!,
        Item: {
            room: message.roomName,
            user: player.player,
            value: message.value,
        },
    }).promise();

    const roomVotesResult = await dynamoDb.query({
        TableName: process.env.DYNAMODB_VOTES_TABLE!,
        KeyConditionExpression: 'room = :roomName',
        ExpressionAttributeValues: {
            ':roomName': message.roomName,
        },
    }).promise();
    const playerToVote = {};
    for (const { user, value } of roomVotesResult.Items || []) {
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
    const allRoomPlayersResult = await dynamoDb.query({
        TableName: process.env.DYNAMODB_ROOM_PLAYERS_TABLE!,
        KeyConditionExpression: 'room = :roomName',
        ExpressionAttributeValues: {
            ':roomName': message.roomName,
        },
    }).promise();
    const allRoomPlayers = allRoomPlayersResult.Items || [];

    await Promise.all(allRoomPlayers.map(({ player }) => dynamoDb.delete({
        TableName: process.env.DYNAMODB_VOTES_TABLE!,
        Key: { room: message.roomName, user: player },
    }).promise()));

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
