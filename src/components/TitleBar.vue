<template>
    <div class="titlebar">
        <div class="title-drag-region"></div>
        <a class="window-appicon">JIV</a>
        <div class="menubar"></div>
        <div class="window-title">{{title}}</div>
        <div class="window-controls-container">
            <div class="window-icon window-minimize" @click="minimize">
                <i class="fa fa-window-minimize"></i>
            </div>
            <div v-if="!maximized" class="window-icon window-maximize" @click="maximize">
                <i class="fa fa-window-maximize"></i>
            </div>
            <div v-else class="window-icon window-restore" @click="restore">
                <i class="fa fa-window-restore"></i>
            </div>
            <div class="window-icon window-close" @click="close">
                <i class="fa fa-close"></i>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import {ipcRenderer, IpcRendererEvent} from 'electron'
    import {
        ref,
        watch,
        onMounted,
        defineComponent
    } from 'vue'

    export default defineComponent({
        name: 'title-bar',
        props: {
            title: {type: String, default: ''}
        },
        setup(props) {
            const title = ref('')
            const maximized = ref(false)

            watch(() => props.title, () => {title.value = props.title})

            const minimize = () => {ipcRenderer.invoke('minimize-window')}
            const maximize = () => {ipcRenderer.invoke('maximize-window')}
            const restore = () => {ipcRenderer.invoke('restore-window')}
            const close = () => {ipcRenderer.invoke('close-window')}

            onMounted(() => {
                ipcRenderer.on('maximized', (event: IpcRendererEvent, value: boolean) => {
                    maximized.value = value
                    console.log('is maximized', value)
                })
            })

            return {
                maximized,
                minimize,
                maximize,
                restore,
                close
            }
        }
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
        color: #f5f5f5;

        .title-drag-region {
            top: 0;
            left: 0;
            display: block;
            position: absolute;
            width: 100%;
            height: 22px;
            z-index: -1;
            line-height: 22px;
            -webkit-app-region: drag;
        }

        .window-appicon {
            width: 60px;
            height: 100%;
            position: relative;
            z-index: 3000;
            text-align: center;
            font-size: 14px;
            // background-repeat: no-repeat;
            // background-position: center center;
            // background-size: 16px;
            flex-shrink: 0;
            -webkit-app-region: drag;
        }

        .window-title {
            flex: 0 1 auto;
            font-size: 12px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            margin-left: auto;
            margin-right: auto;
            zoom: 1;
            -webkit-app-region: drag;
        }

        .window-controls-container {
            display: flex;
            flex-grow: 0;
            flex-shrink: 0;
            text-align: center;
            position: relative;
            z-index: 3000;
            -webkit-app-region: no-drag;
            height: 100%;
            width: 90px;
            margin-left: auto;

            .window-icon {
                display: inline-block;
                line-height: 22px;
                height: 100%;
                width: 30px;
                font-size: 10px;

                &:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
            }

            .window-close:hover {
                background-color: rgba(232, 17, 35, 0.9);
            }

            .window- {
                &close {
                    font-size: 14px;
                }
            }
        }
    }
</style>
