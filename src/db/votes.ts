import Vote from "../models/Vote";
import dynamoDb from "./dynamoDb";

const TABLE_NAME: string = process.env.DYNAMODB_VOTES_TABLE!;

export async function saveVote(vote: Vote): Promise<void> {
    await dynamoDb.put({
        TableName: process.env.DYNAMODB_VOTES_TABLE!,
        Item: vote,
    }).promise();
}

export async function findVotesByRoomName(roomName: string): Promise<Vote[]> {
    const roomVotesResult = await dynamoDb.query({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'room = :roomName',
        ExpressionAttributeValues: {
            ':roomName': roomName,
        },
    }).promise();

    return roomVotesResult.Items as Vote[] || [];
}

export async function deleteVoteByRoomNameAndPlayerNames(
    roomName: string,
    playerNames: string[]
): Promise<void> {
    await Promise.all(playerNames.map(playerName => dynamoDb.delete({
        TableName: TABLE_NAME,
        Key: { room: roomName, user: playerName },
    }).promise()));
}
