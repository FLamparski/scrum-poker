<template>
    <div>
        <p>Connected: {{ connected }}</p>
        <p>Room name: {{ roomName }}</p>
        <div v-if="!roomName">
            <label for="playerNameInput">Enter player name</label>
            <input type="text" id="playerNameInput" v-model="playerNameInputValue">

            <label for="roomNameInput">Enter room  name:</label>
            <input type="text" id="roomNameInput" v-model="roomNameInputValue">
            
            <button type="button" @click="onJoinRoomClick">Join room</button>
        </div>
        <div v-else>
            <p>Current vote: {{ currentVote }}</p>
            <p>
                <button
                    v-for="option in VOTE_OPTIONS"
                    :key="option.key"
                    type="button"
                    @click="onVote(option.key)">
                    {{ option.value }}
                </button>
            </p>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { JoinRoomMessage, VoteMessage, WSMessage, WSMessageType } from '../../ws-messages';

const VOTE_OPTIONS = [
    { key: 0, value: 0 },
    { key: 1, value: 1 },
    { key: 2, value: 2 },
    { key: 3, value: 3 },
    { key: 5, value: 5 },
    { key: 8, value: 8 },
    { key: 13, value: 13 },
];

export default {
    data: () => ({
        connected: false,
        roomName: null,

        playerNameInputValue: '',
        roomNameInputValue: '',

        currentVote: null,
        VOTE_OPTIONS,
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
        },
        onSocketMessage(event: MessageEvent) {
            const message: WSMessage = JSON.parse(event.data);
            switch (message.type) {
                case WSMessageType.PLAYER_JOINED:
                    if (message.playerName === this.playerNameInputValue) {
                        this.roomName = this.roomNameInputValue;
                    }
                    break;
                case WSMessageType.VOTES_CLEARED:
                    this.currentVote = null;
                    break;
            }
        },
        onJoinRoomClick() {
            const message: JoinRoomMessage = {
                type: WSMessageType.JOIN_ROOM,
                playerName: this.playerNameInputValue,
                roomName: this.roomNameInputValue,
            };
            this.socket.send(JSON.stringify(message));
        },
        onVote(value: number) {
            this.currentVote = value;
            const message: VoteMessage = {
                type: WSMessageType.VOTE,
                roomName: this.roomName,
                value,
            };
            this.socket.send(JSON.stringify(message));
        },
    },
};
</script>
