<template>
    <div>
        <p>Connected: {{ connected }}</p>
        <p>Room name: {{ roomName }}</p>
        <p>Players: {{ players }}</p>
        <p>Votes: {{ votes }}</p>
        <p>
            <button type="button" @click="onClearVotesClick">Clear votes</button>
        </p>
    </div>
</template>

<script lang="ts">
import { ClearVotesMessage, WSMessage, WSMessageType } from '../../ws-messages';

export default {
    data: () => ({
        connected: false,
        roomName: null,
        players: [],
        votes: {},
    }),
    mounted() {
        this.socket = new WebSocket('wss://jn2jpcj5o2.execute-api.eu-west-2.amazonaws.com/dev/');
        this.socket.onopen = () => this.socketOpened();
        this.socket.onmessage = event => this.onSocketMessage(event);
    },
    beforeDestroy() {
        this.socket.close();
    },
    methods: {
        socketOpened() {
            this.connected = true;

            this.socket.send(JSON.stringify({
                type: WSMessageType.CREATE_ROOM,
            }));
        },
        onSocketMessage(event: MessageEvent) {
            const message: WSMessage = JSON.parse(event.data);
            switch (message.type) {
                case WSMessageType.ROOM_CREATED:
                    this.roomName = message.roomName;
                    break;
                case WSMessageType.PLAYER_JOINED:
                    this.players = message.allPlayerNames;
                    break;
                case WSMessageType.VOTES_UPDATED:
                    this.votes = message.votes;
                    break;
                case WSMessageType.VOTES_CLEARED:
                    this.votes = {};
                    break;
            }
        },
        onClearVotesClick() {
            const message: ClearVotesMessage = {
                type: WSMessageType.CLEAR_VOTES,
                roomName: this.roomName,
            };
            this.socket.send(JSON.stringify(message));
        },
    },
}
</script>