<template>
    <div
        v-if="roomName != null"
        class="player-view">
        <header-bar
            :connected="connected"
            :roomName="roomName" />
        
        <div class="choices">
            <button
                v-for="voteOption in VoteOptions"
                :key="voteOption.key"
                :class="{ 'selected': currentVote === voteOption.key }"
                class="choice"
                type="button"
                @click="onVote(voteOption.key)">
                {{ voteOption.value }}
            </button>
        </div>
    </div>
    <div
        v-else
        class="room-login-view">
        <h1>🃏 join room</h1>
        <fieldset>
            <label for="roomNameInput">Room Code</label>
            <input
                v-model="roomNameInputValue"
                placeholder="XKCD"
                type="text"
                name="roomNameInput"
                id="roomNameInput">
        </fieldset>
        <fieldset>
            <label for="playerNameInput">Your Name</label>
            <input
                v-model="playerNameInputValue"
                placeholder="Mary Shelley"
                type="text"
                name="playerNameInput"
                id="playerNameInput">
        </fieldset>
        <button
            type="button"
            class="join-button"
            :disabled="joinDisabled"
            @click="onJoinRoomClick">Join</button>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { JoinRoomMessage, VoteMessage, WSMessage, WSMessageType } from '../../src/models/ws-messages';
import HeaderBar from '../components/HeaderBar.vue';
import VoteOptions from '../VoteOptions';

export default {
    components: { HeaderBar },
    data: () => ({
        connected: false,
        roomName: null,

        playerNameInputValue: '',
        roomNameInputValue: '',

        currentVote: null,
        VoteOptions,
    }),
    mounted() {
        this.socket = new WebSocket('wss://jn2jpcj5o2.execute-api.eu-west-2.amazonaws.com/dev/');
        this.socket.onopen = () => this.socketOpened();
        this.socket.onmessage = event => this.onSocketMessage(event);
    },
    beforeDestroy() {
        this.socket.close();
    },
    computed: {
        joinDisabled(): boolean {
            return this.playerNameInputValue == '' || this.roomNameInputValue == '';
        },
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
                        this.roomName = this.roomNameInputValue.toUpperCase();
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
                roomName: this.roomNameInputValue.toUpperCase(),
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


<style scoped>
.room-login-view {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
}

.room-login-view > fieldset {
    border: none;
    min-height: 48px;
}

.room-login-view > fieldset + fieldset {
    margin-top: 10px;
}

.room-login-view > fieldset > input {
    display: block;
    font-size: 20px;
    width: 100%;
    margin-top: 5px;
}

.join-button {
    margin-top: 10px;
    height: 48px;
}

.choices {
    display: flex;
    justify-content: center;
}

.choices > .choice {
    width: 48px;
    height: 48px;
    font-size: 20px;
    margin: 0 5px;
}

.choice.selected {
    box-shadow: 0px 0px 5px 2px #3fafaf;
}

#roomNameInput {
    text-transform: uppercase;
}
</style>
