<template>
  <div>
    <title-bar :title="zipFileName" />
    <div class="image-container"
      :style="{
        height: height + 'px'
      }">
      <span style="margin-top: 40px;">hello</span>
      <!-- <tippy
        arrow
        interactive
        :hide-on-click="false"
      >
        <template #default="{ state }">
          <div>
            <h1>Tippy!</h1>
            <p>{{ state }}</p>
          </div>
        </template>

        <template #content="{ hide }">
          Hi! <button @click="hide()">X</button>
        </template>
      </tippy>
      <tippy interactive arrow trigger="click">
        <template #default>
          <i class="fa fa-cog"></i>
        </template>
        <template #content>
          <button>ZIP</button>
        </template>
      </tippy> -->
      <img v-for="item in images" :src="item.image" :title="item.filename" :width="width" :key="item.filename"/>
    </div>
    <float-button class="paging-button" width="80" :height="60" icon="fa fa-chevron-left"
                  :top="flipButtonTop" :left="10" @click="prev"/>
    <float-button class="paging-button" :width="80" :height="60" icon="fa fa-chevron-right"
                  :top="flipButtonTop" :right="10" @click="next"/>
  </div>
</template>

<script lang="ts">
  // import {getCurrentInstance} from 'vue'
  import {Options, Vue} from 'vue-class-component'
  import {ipcRenderer, IpcRendererEvent} from 'electron'
  import TitleBar from '@/components/TitleBar.vue'
  import FloatButton from '@/components/FloatButton.vue'

  interface ImgItem {
    filename: string
    image: string
  }

  const debounce: Function = (fn: Function, delay: number): Function => {
    let timer: any = null
    return function (this: any, ...args: any[]) {
      timer && clearTimeout(timer)
      timer = setTimeout(() => fn.apply(this, args), delay)
    }
  }

  @Options({
    components: {
      TitleBar,
      FloatButton
    }
  })
  export default class Home extends Vue {
    images: ImgItem[] = []
    zipFileName: string = ''
    width: number = 800
    height: number = 600
    flipButtonTop: number = this.height / 2

    public mounted(): void {
      // console.log(getCurrentInstance())
      // console.log('mounted')
      ipcRenderer.on('image-content', (event: IpcRendererEvent, arg: ImgItem) => {
        console.log(arg.filename)
        this.images.push(arg)
        this.images = this.images.sort((left, right) => {
          return left.filename.localeCompare(right.filename)
        })
      })
      ipcRenderer.on('zip-filename', (event: IpcRendererEvent, filename: string) => {
        this.zipFileName = filename;
        this.images = []
      })
      this.resize()

      window.addEventListener('resize', debounce(() => this.resize(), 50))
    }

    public closeWindow(): void {
      ipcRenderer.invoke('close-app')
    }

    public prev(): void {
      this.images = []
      ipcRenderer.invoke('show-prev')
    }

    public next(): void {
      this.images = []
      ipcRenderer.invoke('show-next')
    }

    public resize(): void {
      const width = window.innerWidth || document.body.clientWidth || document.documentElement.clientWidth
      this.width = width - 4
      const clientHeight = window.innerHeight || document.body.clientHeight || document.documentElement.clientHeight
      this.height = clientHeight
      this.flipButtonTop = this.height / 2 - 40
    }

    // public hide(): boolean {
    //   return true
    // }

  }
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
</style>
