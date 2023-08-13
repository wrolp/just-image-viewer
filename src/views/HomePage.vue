<template>
  <div>
    <title-bar
      :title="shortname"
      :can-search="isFolder"
      :withContent="withContent"
      :show="showTitleBar"
      @on-file="displayFileMenu"
      @on-search="displaySearchBar"
      @on-sort="displaySortMenu"/>
    <div class="image-container" :style="{ height: height + 'px' }">
      <img v-for="item in images" :src="item.image" :title="item.filename" :width="width" :key="item.filename"/>
    </div>
    <float-button class="paging-button" :width=80 :height=60 icon="fa fa-chevron-left"
                  :top="flipButtonTop" :left="10" :pageInfo="pageInfo" @click="prev"/>
    <float-button class="paging-button" :width=80 :height=60 icon="fa fa-chevron-right"
                  :top="flipButtonTop" :right="10" :pageInfo="pageInfo" @click="next"/>

    <tippy ref="fileMenuRef"
           @show="handleShowFileMenu"
           @hide="handleHideFileMenu"
           tag="button"
           content-tag="div"
           class="file-menu">
      <template #default></template>
      <template #content>
        <div class="menu-container">
          <div class="menu-item" @click="handleOpenArhcive">
            <font-awesome-icon icon="fa-solid fa-file-zipper" style="color: #28a745" />
            <span style="margin-left: 8px;">Open Archive</span>
          </div>
          <div class="menu-item" @click="handleOpenFolder">
            <font-awesome-icon icon="fa-solid fa-folder" style="color: #007bff" />
            <span style="margin-left: 5px;">Open Folder</span>
          </div>
          <hr class="menu-seperator" />
          <div class="menu-history">
            <div v-for="item in historyItems" class="menu-item" :key="item.shortname"
              @click="handleOpenItem(item.type, item.fullpath)" :title="item.shortname">
              <font-awesome-icon v-if="item.type === 'archive'" size="sm" icon="fa-solid fa-circle-dot" style="color: #28a745" />
              <font-awesome-icon v-else icon="fa-solid fa-list-ul" style="color: #007bff" />
              {{ item.shortname }}
            </div>
          </div>
        </div>
      </template>
    </tippy>

    <tippy ref="searchBarRef"
           @show="handleShowSearch"
           @hide="handleHideSearch"
           tag="button"
           content-tag="div"
           :arrow=false
           class="search-bar">
      <template #default></template>
      <template #content>
        <div class="search-form">
          <input v-model="searchValue" @keyup.enter="handleSearch" style="backgroud: black;" />
        </div>
      </template>
    </tippy>

    <tippy ref="sortMenuRef"
           @show="handleShowSort"
           @hide="handleHideSort"
           tag="button"
           content-tag="div"
           class="sort-menu">
      <template #default></template>
      <template #content>
        <div style="text-align: left; heigth: 24px;">
          <input id="desc" type="radio" name="direction" value="desc" v-model="direction" @change="handleDirection" />
          <label for="desc">desc</label>
        </div>
        <div style="text-align: left; heigth: 24px;">
          <input id="asc" type="radio" name="direction" value="asc" v-model="direction" @change="handleDirection" />
          <label for="asc">asc</label>
        </div>
        <hr class="menu-seperator" />
        <div style="text-align: left; heigth: 24px;">
          <input id="bytime" type="radio" name="sort" value="bytime" v-model="sortType" @change="handleSort" />
          <label for="bytime">sort by time</label>
        </div>
        <div style="text-align: left; heigth: 24px;">
          <input id="byname" type="radio" name="sort" value="byname" v-model="sortType" @change="handleSort" />
          <label for="byname">sort by name</label>
        </div>
      </template>
    </tippy>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { PageInfo, ImgItem } from '@/types/common'
import { ipcRenderer, IpcRendererEvent } from 'electron'
import { debounce } from '@/utils/utils'
import { Path } from '@/config'
import TitleBar from '@/components/TitleBar.vue'
import FloatButton from '@/components/FloatButton.vue'

const images = ref([] as ImgItem[])
const shortname = ref('')
const width = ref(800)
const height = ref(600)
const flipButtonTop = ref(600 / 2)
const pageInfo = ref<PageInfo>()
const fileMenuRef = ref()
const searchBarRef = ref()
const sortMenuRef = ref()
const historyItems = ref<Path[]>([])
const isFolder = ref(false)
const withContent = ref(false)

const resizeDebounce = debounce(() => resize(), 50)

onMounted(() => {
  ipcRenderer.on('image-content', (event: IpcRendererEvent, arg: ImgItem) => {
    isFolder.value = false
    images.value.push(arg)
    images.value = images.value.sort((left, right) => {
      return left.filename.localeCompare(right.filename)
    })
  })
  ipcRenderer.on('image-list', (event: IpcRendererEvent, arg: ImgItem[]) => {
    isFolder.value = true
    images.value = arg
  })
  ipcRenderer.on('shortname', (event: IpcRendererEvent, filename: string) => {
    shortname.value = filename
    withContent.value = true
    images.value = []
  })
  ipcRenderer.on('page-info', (event: IpcRendererEvent, pi: PageInfo) => {
    pageInfo.value = pi
  })
  ipcRenderer.on('update-history', (event: IpcRendererEvent, history: Path[]) => {
    historyItems.value = history
  })

  resize()
  window.addEventListener('resize', resizeDebounce)

  ipcRenderer.invoke('window-ready')
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeDebounce)
})

const closeWindow = () => ipcRenderer.invoke('close-app')
const prev = () => {
  images.value = []
  ipcRenderer.invoke('show-prev')
}
const next = () => {
  images.value = []
  ipcRenderer.invoke('show-next')
}

const resize = () => {
  const w = window.innerWidth || document.body.clientWidth || document.documentElement.clientWidth
  width.value = w - 4
  const clientHeight = window.innerHeight || document.body.clientHeight || document.documentElement.clientHeight
  height.value = clientHeight
  flipButtonTop.value = clientHeight / 2 - 40
}

const displayFileMenu = () => fileMenuRef.value.$el.click()
const displaySearchBar = () => searchBarRef.value.$el.click()
const displaySortMenu = () => sortMenuRef.value.$el.click()

const handleOpenArhcive = () => {
  ipcRenderer.invoke('open-archive')
  fileMenuRef.value.hide()
}

const handleOpenFolder = () => {
  ipcRenderer.invoke('open-folder')
  fileMenuRef.value.hide()
}

const handleOpenItem = (type: string, path: string) => {
  ipcRenderer.invoke('open-history', type, path)
  fileMenuRef.value.hide()
}

const searchValue = ref('')
const handleSearch = () => {
  console.log(searchValue.value)
  images.value = []
  ipcRenderer.invoke('search', searchValue.value)
}

const sortType = ref('bytime')
const handleSort = () => { ipcRenderer.invoke('sort', sortType.value) }
const direction = ref('desc')
const handleDirection = () => { ipcRenderer.invoke('direction', direction.value) }

const showTitleBar = ref(false)
const handleShowFileMenu = () => { showTitleBar.value = true }
const handleHideFileMenu = () => { showTitleBar.value = false }
const handleShowSort = () => { showTitleBar.value = true }
const handleHideSort = () => { showTitleBar.value = false }
const handleShowSearch = () => { showTitleBar.value = true }
const handleHideSearch = () => { showTitleBar.value = false }
</script>

<style lang="scss" scoped>
.body-container {
  color: transparent;
  overflow-y: scroll;
  overflow-x: hidden;
  margin: 0;
}

.app-drag-area {
  -webkit-app-region: drag;
  width: 100%;
  height: 20px;
  background-color: transparent;
  position: fixed;
  top: 1px;
}

.app-drag-area:hover {
  background-color: rgba(0, 0, 0, 0.2)
}

#close-button, #next-button, #prev-button {
  width: 20px;
  height: 20px;
  font-weight: bold;
  cursor: pointer;
  float: right;
  z-index: 2500;
  -webkit-app-region: no-drag;
  margin-right: 10px;
}

#close-button:hover, #next-button:hover, #prev-button:hover {
  color: tomato;
}

#image-container > img {
  display: block;
}

.footer {
  height: 10px;
}

.image-container {
  top: 0;
  left: 0;
  width: 100%;
  position: fixed;
  overflow-y: scroll;
  z-index: 1000;
}

.btn {
  @apply
    px-4 py-1 text-sm text-purple-600 font-semibold
    rounded-full border border-purple-200 dark:border-purple-800
    hover:text-white hover:bg-purple-600 hover:border-transparent
    focus:outline-none focus:ring-2 ring-purple-600 ring-opacity-40;
}

.close-win {
  -webkit-app-region: no-drag;
  &:hover {
    background-color: #ee0000;
  }
}

.paging-button {
  background-color: transparent;
  &:hover {
    background-color: #ee000075;
  }
}

.file-menu {
  position: absolute;
  top: 19px;
  right: 100px;
  z-index: 9999;
  background-color: transparent;
  color: transparent;
}

.sort-menu {
  position: absolute;
  top: 19px;
  right: 130px;
  z-index: 9999;
  background-color: transparent;
  color: transparent;
}

.search-bar {
  position: absolute;
  top: 15px;
  z-index: 9999;
  margin: 0 auto;
  background-color: transparent;
  color: transparent;
}

.menu-container {
  font-size: 12px;
  text-align: left;
  cursor: pointer;

  .menu-item {
    max-width: 250px;
    line-height: 25px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    padding: 0 5px;

    &:hover {
      background-color: #555555;
    }
  }

  .menu-seperator {
    margin: 5px 0;
    border-top: 1px solid #464646;
  }

  .menu-history {
    overflow-x: hidden;
    overflow-y: scroll;
    max-height: 300px;
  }
}
</style>
