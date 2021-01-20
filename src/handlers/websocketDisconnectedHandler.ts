import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ApiGatewayManagementApi } from "aws-sdk";
import { deleteRoomPlayer, findPlayerByConnectionId, findPlayersByRoomName } from "../db/roomPlayers";
import { deleteRoom, findRoomByConnectionId, findRoomByName } from "../db/rooms";
import { deleteVoteByRoomNameAndPlayerName, deleteVoteByRoomNameAndPlayerNames } from "../db/votes";
import Room from "../models/Room";
import RoomPlayer from "../models/RoomPlayer";
import { PlayerLeftMessage, RoomDestroyedMessage, WSMessageType } from "../models/ws-messages";

export default async function (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const connectionId = event.requestContext.connectionId!;

    const client = new ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`,
    });

    // is this a player disconnecting?
    const player = await findPlayerByConnectionId(connectionId);
    if (player) {
        await removePlayer(client, player);
        return { statusCode: 200, body: 'handled' };
    }

    // it's a room disconnecting
    const room = await findRoomByConnectionId(connectionId);
    if (room) {
        await removeRoom(client, room);
        return { statusCode: 200, body: 'handled' };
    }

    // nothing found, probably fine
    return { statusCode: 200, body: 'nothing to do' };
}

async function removePlayer(client: ApiGatewayManagementApi, player: RoomPlayer): Promise<void> {
    await deleteRoomPlayer(player);
    await deleteVoteByRoomNameAndPlayerName(player.room, player.player);

    const room = await findRoomByName(player.room);
    if (room) {
        const roomPlayers = await findPlayersByRoomName(room.room);
        const allPlayerNames = roomPlayers.map(p => p.player);

        const wsMessage: PlayerLeftMessage = {
            type: WSMessageType.PLAYER_LEFT,
            playerName: player.player,
            allPlayerNames,
        };

        await client.postToConnection({
            ConnectionId: room.connectionId,
            Data: JSON.stringify(wsMessage),
        }).promise();
    }
}

async function removeRoom(client: ApiGatewayManagementApi, room: Room): Promise<void> {
    await deleteRoom(room);
    const allRoomPlayers = await findPlayersByRoomName(room.room);
    await deleteVoteByRoomNameAndPlayerNames(room.room, allRoomPlayers.map(p => p.player));
    
    const wsMessage: RoomDestroyedMessage = {
        type: WSMessageType.ROOM_DESTROYED,
        roomName: room.room,
    };
    await Promise.all(allRoomPlayers.map(p => client.postToConnection({
        ConnectionId: p.connectionId,
        Data: JSON.stringify(wsMessage),
    }).promise()));
}
