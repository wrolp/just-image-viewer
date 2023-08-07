<template>
  <div class="titlebar">
    <div class="title-drag-region"></div>
    <div class="window-title">{{ props.title }}</div>
    <div class="window-controls-container">
      <div class="window-icon"></div>
      <!-- search -->
      <div class="window-icon" v-if="props.canSearch" @click="search">
        <font-awesome-icon size="lg" icon="fa-solid fa-magnifying-glass" />
      </div>
      <!-- sort -->
      <div class="window-icon" v-if="props.canSearch" @click="sort">
        <font-awesome-icon size="lg" icon="fa-solid fa-sort" />
      </div>
      <!-- open file or folder -->
      <div class="window-icon" @click="openFile">
        <font-awesome-icon size="lg" icon="fa-solid fa-ellipsis-vertical" />
      </div>
      <!-- minimize -->
      <div class="window-icon" @click="minimize">
        <font-awesome-icon size="lg" icon="fa-solid fa-window-minimize" />
      </div>
      <!-- maximized -->
      <div v-if="!maximized" class="window-icon" @click="maximize">
        <font-awesome-icon size="lg" icon="fa-solid fa-window-maximize" />
      </div>
      <!-- restore -->
      <div v-else class="window-icon" @click="restore">
        <font-awesome-icon size="lg" icon="fa-solid fa-window-restore" />
      </div>
      <!-- close -->
      <div class="window-icon window-close" @click="close">
        <font-awesome-icon size="lg" icon="fa-solid fa-xmark" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ipcRenderer, IpcRendererEvent } from 'electron'
import {
  ref,
  onMounted,
  defineProps,
  defineEmits
} from 'vue'

const maximized = ref(false)

const props = defineProps<{ title: string, canSearch: boolean }>()
const emit = defineEmits(['on-search', 'on-file', 'on-sort'])

const search = () => emit('on-search')
const sort = () => emit('on-sort')
const openFile = () => emit('on-file')
const minimize = () => ipcRenderer.invoke('minimize-window')
const maximize = () => ipcRenderer.invoke('maximize-window')
const restore = () => ipcRenderer.invoke('restore-window')
const close = () => ipcRenderer.invoke('close-window')

onMounted(() => {
  ipcRenderer.on('maximized', (event: IpcRendererEvent, value: boolean) => {
    maximized.value = value
  })
})
</script>

<style lang="scss" scoped>
.titlebar {
  box-sizing: border-box;
  width: 100%;
  padding: 0;
  overflow: hidden;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  user-select: none;
  zoom: 1;
  line-height: 22px;
  height: 22px;
  display: flex;
  color: transparent;
  z-index: 6001;
  position: fixed;
  background-color: none;

  &:hover {
    background-color: rgba(0, 0, 0, 0.5);
    color: #f5f5f5;
  }

  .title-drag-region {
    top: 0;
    left: 0;
    display: block;
    position: fixed;
    width: 100%;
    height: 22px;
    z-index: -1;
    line-height: 22px;
    -webkit-app-region: drag;
  }

  .window-title {
    // display: inline;
    // flex: 0 1 auto;
    font-size: 12px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin-left: auto;
    margin-right: auto;
    zoom: 1;
    -webkit-app-region: drag;

    &:hover {
      background-color: rgba(0, 0, 0, 0.5);
      color: #f5f5f5;
    }
  }

  .window-controls-container {
    display: flex;
    flex-grow: 0;
    flex-shrink: 0;
    text-align: center;
    position: relative;
    -webkit-app-region: no-drag;
    height: 100%;
    // margin-left: auto;

    > div {
      display: inline-block;
      line-height: 22px;
      height: 100%;
      width: 30px;
      font-size: 10px;

      &:not(:last-child):hover {
        background-color: rgba(31, 136, 177, 0.459);
      }

      &:last-child:hover {
        background-color: rgba(232, 17, 35, 0.9);
      }
    }

    .window- {
      &cog,
      &close {
        font-size: 14px;
      }
    }
  }
}
</style>
