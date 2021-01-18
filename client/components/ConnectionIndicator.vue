<template>
    <span class="connection-indicator">
        {{ connected ? '📶 Connected' : '🟥 Not connected' }}
    </span>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
    props: {
        connected: { type: Boolean, default: false },
    },
});
</script>
