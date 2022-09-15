<template>
  <div v-if="roomName != null" class="player-view">
    <header-bar :connected="connected" :roomName="roomName" />
    <div v-if="alertMsg" class="alert">{{ alertMsg }}</div>

    <div class="choices">
      <button
        v-for="voteOption in VoteOptions"
        :key="voteOption.key"
        :class="{ selected: currentVote === voteOption.key }"
        class="choice"
        type="button"
        @click="onVote(voteOption.key)"
      >
        {{ voteOption.value }}
      </button>
    </div>
  </div>

  <div class="room-login-view" v-else>
    <h1>🃏 join room</h1>
    <div v-if="alertMsg" class="alert">{{ alertMsg }}</div>
    <form class="room-login-form" @submit.prevent="onJoinRoomClick">
      <fieldset>
        <label for="roomNameInput">Room Code</label>
        <input
          v-model="roomNameInputValue"
          placeholder="XKCD"
          type="text"
          name="roomNameInput"
          id="roomNameInput"
          ref="roomNameInput"
        />
      </fieldset>
      <fieldset>
        <label for="playerNameInput">Your Name</label>
        <input
          v-model="playerNameInputValue"
          placeholder="Mary Shelley"
          type="text"
          name="playerNameInput"
          id="playerNameInput"
        />
      </fieldset>
      <button
        type="submit"
        class="join-button"
        :disabled="joinDisabled"
      >
        Join
      </button>
    </form>
  </div>
</template>

<script lang="ts">
import {
  JoinRoomMessage,
  VoteMessage,
  WSMessage,
  WSMessageType,
} from "../../../src/models/ws-messages";
import HeaderBar from "../../components/HeaderBar.vue";
import VoteOptions from "../../VoteOptions";
import socketService from '../../lib/socketService';
const STORAGE_KEY = "scrum-poker/playerName";

export default {
  components: { HeaderBar },
  data() {
    return {
      connected: false,
      roomName: null,

      alertMsg: "",
      playerNameInputValue: "",
      roomNameInputValue: (this as any).$route.params.roomName || "",

      currentVote: null,
      VoteOptions,
    };
  },
  mounted() {
    socketService.connect(
        this.$config.websocketUrl,
        () => this.socketOpened(),
        message => this.onSocketMessage(message),
    );

    this.playerNameInputValue = loadName();
    this.focusInput();
  },
  beforeDestroy() {
    socketService.close();
  },
  computed: {
    joinDisabled(): boolean {
      return this.playerNameInputValue == "" || this.roomNameInputValue == "";
    },
  },
  methods: {
    focusInput() {
      this.$refs.roomNameInput.focus();
    },
    socketOpened() {
      this.connected = true;
    },
    onSocketMessage(message: WSMessage) {
      switch (message.type) {
        case WSMessageType.PLAYER_JOINED:
          if (message.playerName === this.playerNameInputValue) {
            this.roomName = this.roomNameInputValue.toUpperCase();
            window.history.replaceState(
              {},
              `LOL Scrum Poker ${this.roomName}`,
              `/play/${this.roomName}`
            );
          }
          break;
        case WSMessageType.PLAYER_JOIN_ERROR:
          this.alertMsg = message.error;
          break;
        case WSMessageType.VOTES_CLEARED:
          this.currentVote = null;
          break;
        case WSMessageType.ROOM_DESTROYED:
          this.roomName = null;
          this.roomNameInputValue = "";
          this.alertMsg =
            "The host has disconnected and the room is now closed";
          break;
      }
    },
    onJoinRoomClick() {
      const message: JoinRoomMessage = {
        type: WSMessageType.JOIN_ROOM,
        playerName: this.playerNameInputValue,
        roomName: this.roomNameInputValue.toUpperCase(),
      };
      socketService.send(message);
      saveName(this.playerNameInputValue);
    },
    onVote(value: number) {
      this.currentVote = value;
      const message: VoteMessage = {
        type: WSMessageType.VOTE,
        roomName: this.roomName,
        value,
      };
      socketService.send(message);
    },
  },
};

function loadName(): string | undefined {
  if (window.localStorage) {
    return window.localStorage[STORAGE_KEY];
  }
}

function saveName(participantName: string) {
  if (window.localStorage) {
    window.localStorage[STORAGE_KEY] = participantName;
  }
}
</script>

<style scoped>
.room-login-view, .room-login-form {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.room-login-form > fieldset {
  border: none;
  min-height: 48px;
  padding: 10px 0;
}

.room-login-form > fieldset + fieldset {
  margin-top: 10px;
}

.room-login-form > fieldset > input {
  display: block;
  font-size: 20px;
  width: 100%;
  margin-top: 5px;
}

.join-button {
  margin-top: 10px;
  height: 48px;
}

#roomNameInput {
  text-transform: uppercase;
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

@media screen and (max-width: 480px) {
  .choices {
    flex-direction: column;
  }

  .choices > .choice {
    width: 100%;
    margin: 5px 0;
  }
}

.alert {
  color: #cc0808;
  border: 1px solid #cc0808;
  padding: 15px 10px;
}
</style>
