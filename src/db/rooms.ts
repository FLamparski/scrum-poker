import Room from '../models/Room';
import dynamoDb from './dynamoDb';

const TABLE_NAME: string = process.env.DYNAMODB_ROOMS_TABLE!;
const ROOM_TTL_DEFAULT: number = 2 * 60 * 60;

export async function findRoomByName(roomName: string): Promise<Room | undefined> {
    const result = await dynamoDb.get({
        TableName: TABLE_NAME,
        Key: { room: roomName },
    }).promise();

    if (result.Item) {
        return result.Item as Room;
    }
}

export async function saveRoom(room: Partial<Room>): Promise<void> {
    await dynamoDb.put({
        TableName: process.env.DYNAMODB_ROOMS_TABLE!,
        Item: {
            createdAt: Date.now(),
            ttl: Math.floor(Date.now() / 1000) + ROOM_TTL_DEFAULT,
            ...room,
        },
    }).promise();
}
