<template>
  <div class="header-bar">
    <div class="actions">
      <slot></slot>
    </div>
    <h1 class="room-name">
      <span class="mute">ROOM:</span> {{ roomName }}
      <button
        v-if="roomName"
        :class="{ blink_me: linkCopied }"
        @click="copyLink"
      >
        🔗
      </button>
    </h1>
    <connection-indicator :connected="connected" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import ConnectionIndicator from "./ConnectionIndicator.vue";

const LINK_COPIED_CONFIRMATION_TIME_MS = 2000;

export default Vue.extend({
  components: { ConnectionIndicator },
  props: {
    roomName: { type: String, default: "" },
    connected: { type: Boolean, default: false },
  },
  data() {
    return { linkCopied: false };
  },
  methods: {
    copyLink() {
      if (this.linkCopied) {
        return;
      }
      window.navigator.clipboard.writeText(
        `${getBaseUrl()}/play/${this.roomName}`
      );
      this.linkCopied = true;
      setTimeout(() => {
        this.linkCopied = false;
      }, LINK_COPIED_CONFIRMATION_TIME_MS);
    },
  },
});

function getBaseUrl() {
  return `${window.location.protocol}//${window.location.hostname}${
    location.port ? ":" + location.port : ""
  }`;
}
</script>

<style scoped>
button {
  cursor: pointer;
  border: none;
  background: transparent;
}

.mute {
  color: #808080;
}

.header-bar {
  display: flex;
  width: 100%;
  margin-bottom: 10px;
  align-items: center;
}

.room-name {
  flex: 1;
  margin: 0;
  font-size: 18px;
  text-align: center;
}

.connection-indicator {
  display: block;
  flex-basis: 200px;
  text-align: right;
}

.actions {
  flex-basis: 200px;
}

.blink_me {
  animation: blinker 1s linear infinite;
}

@keyframes blinker {
  50% {
    opacity: 0;
  }
}
</style>
