import RoomPlayer from '../models/RoomPlayer';
import dynamoDb from './dynamoDb';

const TABLE_NAME: string = process.env.DYNAMODB_ROOM_PLAYERS_TABLE!;
const ROOM_PLAYER_TTL_DEFAULT: number = 2 * 60 * 60;

export async function saveRoomPlayer(player: Partial<RoomPlayer>): Promise<void> {
    await dynamoDb.put({
        TableName: TABLE_NAME,
        Item: {
            ttl: Math.floor(Date.now() / 1000) + ROOM_PLAYER_TTL_DEFAULT,
            ...player,
        },
    }).promise();
}

export async function deleteRoomPlayer(player: Partial<RoomPlayer>): Promise<void> {
    await dynamoDb.delete({
        TableName: TABLE_NAME,
        Key: { room: player.room, connectionId: player.connectionId },
    }).promise();
}

export async function findPlayersByRoomName(roomName: string): Promise<RoomPlayer[]> {
    const allRoomPlayersResult = await dynamoDb.query({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'room = :roomName',
        ExpressionAttributeValues: {
            ':roomName': roomName,
        },
    }).promise();

    return allRoomPlayersResult.Items as RoomPlayer[] || [];
}

export async function findPlayerByConnectionId(
    connectionId: string
): Promise<RoomPlayer | undefined> {
    const result = await dynamoDb.scan({
        TableName: TABLE_NAME,
        FilterExpression: 'connectionId = :connectionId',
        ExpressionAttributeValues: {
            ':connectionId': connectionId,
        },
    }).promise();

    if (result.Count == null) {
        return;
    }
    else if (result.Count > 1) {
        return Promise.reject(new Error('findPlayerByConnectionId returned more than one player'));
    }
    else if (result.Count == 1) {
        return result.Items![0] as RoomPlayer;
    }
}

export async function findPlayerByRoomNameAndConnectionId(
    roomName: string,
    connectionId: string
): Promise<RoomPlayer | undefined> {
    const roomPlayerResult = await dynamoDb.get({
        TableName: TABLE_NAME,
        Key: { room: roomName, connectionId },
    }).promise();

    if (roomPlayerResult.Item) {
        return roomPlayerResult.Item as RoomPlayer;
    }
}
