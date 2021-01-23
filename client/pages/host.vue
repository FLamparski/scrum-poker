<template>
    <div class="host-view">
        <header-bar
            :room-name="roomName"
            :connected="connected">
            <button
                type="button"
                @click="() => cardsRevealed = !cardsRevealed">
                {{ cardsRevealed ? 'Hide' : 'Reveal' }} Votes
            </button>
            <button
                type="button"
                @click="onClearVotesClick">
                Clear
            </button>
        </header-bar>

        <div class="cards-layout">
            <card
                v-for="playerName in players"
                :key="playerName"
                :player-name="playerName"
                :value="votes[playerName]"
                :revealed="cardsRevealed" />
        </div>
    </div>
</template>

<script lang="ts">
import { ClearVotesMessage, WSMessage, WSMessageType } from '../../src/models/ws-messages';
import Card from '../components/Card.vue';
import HeaderBar from '../components/HeaderBar.vue';

export default {
    components: {
        HeaderBar,
        Card,
    },
    data: () => ({
        connected: false,
        roomName: null,
        players: [],
        votes: {},
        cardsRevealed: false,
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
                case WSMessageType.PLAYER_LEFT:
                    this.players = message.allPlayerNames;
                    for (const playerName in this.votes) {
                        if (!message.allPlayerNames.includes(playerName)) {
                            delete this.votes[playerName];
                        }
                    }
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

            this.cardsRevealed = false;
        },
    },
}
</script>

<style scoped>
.host-view {
    height: 100%;
}

.cards-layout {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: calc(100% - 30px);
}

.cards-layout > .card-group {
    flex: 0 0 240px;
    margin: 0 10px;
}
</style>
