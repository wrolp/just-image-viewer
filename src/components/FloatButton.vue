<template>
  <div class="float-area"
    :style="{
      top: top !== -999999 ? (top + 'px') : undefined,
      left: left !== -999999 ? (left + 'px') : undefined,
      right: right !== -999999 ? (right + 'px') : undefined,
      bottom: bottom != -999999 ? (bottom + 'px') : undefined,
      width: width + 'px',
      height: height + 'px'
    }">
    <i :class="icon"
      style="color: white; font-size: 40px; padding-top: 12px;"></i>
  </div>
</template>

<script lang="ts">
  // import {ipcRenderer, IpcRendererEvent} from 'electron'
  import {
    ref,
    watch,
    onMounted,
    defineComponent
  } from 'vue'

  export default defineComponent({
    name: 'float-button',
    props: {
      top: { type: Number, default: -999999 },
      left: { type: Number, default: -999999 },
      right: { type: Number, default: -999999 },
      bottom: { type: Number, default: -999999 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      icon: { type: String, default: '' }
    },
    setup(props) {
      const top = ref(0)
      const left = ref(0)
      const right = ref(0)
      const bottom = ref(0)
      const width = ref(0)
      const height = ref(0)
      // const icon = ref('')

      watch(() => props.top, () => {
        top.value = props.top
        if (height.value !== 0) {
          top.value = top.value - height.value / 2
        }
      })
      watch(() => props.left, () => { left.value = props.left })
      watch(() => props.right, () => { right.value = props.right })
      watch(() => props.bottom, () => { bottom.value = props.bottom })
      watch(() => props.width, () => { width.value = props.width })
      watch(() => props.height, () => {
        height.value = props.height
        if (top.value !== -999999) {
          top.value = top.value - height.value / 2
        }
      })

      onMounted(() => {
        // icon.value = 'fa fa-' + props.icon
      })

      return {
      }
    }
  })
</script>

<style lang="scss" scoped>
  .float-area {
    position: fixed;
    background-color: rgba(255, 0, 0, 0.493);
    z-index: 8888;
    & > i {
      display: none;
      &:hover {
        display: block;
      }
    }
  }
</style>
