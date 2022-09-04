import { createApp } from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import App from './App.vue'
import router from './router'
import VueTippy from 'vue-tippy'
import 'windi.css'
import 'tippy.js/dist/tippy.css'
import {
  faXmark,
  faEllipsisVertical,
  faWindowMinimize,
  faWindowMaximize,
  faWindowRestore
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faXmark,
  faEllipsisVertical,
  faWindowMaximize,
  faWindowMinimize,
  faWindowRestore
)

const app = createApp(App)

app.use(VueTippy, {
  appendTo: () => document.body,
  directive: 'tippy', // => v-tippy
  component: 'tippy', // => <tippy/>
  componentSingleton: 'tippy-singleton', // => <tippy-singleton/>,
  defaultProps: {
    placement: 'bottom',
    allowHTML: true,
    arrow: true,
    trigger: 'click'
  } // => Global default options * see all props
})

app.component('font-awesome-icon', FontAwesomeIcon)

app.use(router).mount('#app')
