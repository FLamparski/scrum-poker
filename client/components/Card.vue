<template>
    <div class="card-group">
        <div class="card" :class="{ 'card-hidden': !revealed }">{{ displayValue }}</div>
        <p class="player-name">{{ playerName }}</p>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VoteOptions from '../VoteOptions';

export default Vue.extend({
    props: {
        value: { type: Number, default: null },
        revealed: { type: Boolean, default: false },
        playerName: { type: String, default: '' },
    },
    computed: {
        displayValue(): string {
            if (!this.revealed) {
                return '...';
            }

            return VoteOptions.find(({ key }) => key === this.value)?.value || '?';
        }
    }
});
</script>

<style scoped>
    .card-group {
        display: flex;
        flex-direction: column;
        width: 240px;
        padding: 10px;

        border-radius: 5px;
        background-color: #e8e8e8;
    }

    .card {
        background-color: #ffffff;
        border: 1px solid #222222;
        font-size: 64px;
        border-radius: 5px;
        text-align: center;
        padding: 100px 0;
    }

    .card.card-hidden {
        background-color: #8f8f8f;
    }

    .player-name {
        margin: 5px 0;
    }
</style>
