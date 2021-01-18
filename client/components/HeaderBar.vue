<template>
    <div class="header-bar">
        <div class="actions">
            <slot></slot>
        </div>
        <h1 class="room-name"><span class="mute">ROOM:</span> {{ roomName }}</h1>
        <connection-indicator :connected="connected" />
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import ConnectionIndicator from './ConnectionIndicator.vue'
export default Vue.extend({
    components: { ConnectionIndicator },
    props: {
        roomName: { type: String, default: '' },
        connected: { type: Boolean, default: false },
    },
});
</script>

<style scoped>
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
</style>
