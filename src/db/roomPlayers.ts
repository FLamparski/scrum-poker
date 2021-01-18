import RoomPlayer from '../models/RoomPlayer';
import dynamoDb from './dynamoDb';

const TABLE_NAME: string = process.env.DYNAMODB_ROOM_PLAYERS_TABLE!;
const ROOM_PLAYER_TTL_DEFAULT: number = 2 * 60 * 60;

export async function saveRoomPlayer(player: Partial<RoomPlayer>): Promise<void> {
    await dynamoDb.put({
        TableName: process.env.DYNAMODB_ROOM_PLAYERS_TABLE!,
        Item: {
            ttl: Math.floor(Date.now() / 1000) + ROOM_PLAYER_TTL_DEFAULT,
            ...player,
        },
    }).promise();
}

export async function findPlayersByRoomName(roomName: string): Promise<RoomPlayer[]> {
    const allRoomPlayersResult = await dynamoDb.query({
        TableName: process.env.DYNAMODB_ROOM_PLAYERS_TABLE!,
        KeyConditionExpression: 'room = :roomName',
        ExpressionAttributeValues: {
            ':roomName': roomName,
        },
    }).promise();

    return allRoomPlayersResult.Items as RoomPlayer[] || [];
}

export async function findPlayerByRoomNameAndConnectionId(
    roomName: string,
    connectionId: string
): Promise<RoomPlayer | undefined> {
    const roomPlayerResult = await dynamoDb.get({
        TableName: process.env.DYNAMODB_ROOM_PLAYERS_TABLE!,
        Key: { room: roomName, connectionId },
    }).promise();

    if (roomPlayerResult.Item) {
        return roomPlayerResult.Item as RoomPlayer;
    }
}
