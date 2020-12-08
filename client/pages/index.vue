<template>
  <div class="menu">
    <nuxt-link to="/host">Host Game</nuxt-link>
    <nuxt-link to="/play">Play</nuxt-link>
  </div>
</template>

<script lang="ts">
  export default {
    data: () => ({
      roomName: null,
      creatingRoom: false,
    }),
    methods: {
      async createRoom() {
        this.creatingRoom = true;
        try {
          const { roomName } = await fetch('/dev/api/rooms/new', { method: 'POST' }).then(res => res.json());
          this.roomName = roomName;
        }
        finally {
          this.creatingRoom = false;
        }
      },
    },
  };
</script>

<style scoped>
  .menu {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .menu > a {
    display: block;
    flex: 1;
    padding: 15px;
    margin: 5px;
    background-color: #d1d1d1;
    text-align: center;
  }
  .menu > a:hover {
    background-color: #ffc583;
  }
</style>

<style>
  * {
    box-sizing: border-box;
  }

  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
  }

  body {
    padding: 15px;
  }
</style>
