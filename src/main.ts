import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueTippy from 'vue-tippy'
import 'windi.css'
import 'font-awesome/css/font-awesome.min.css'
import 'tippy.js/dist/tippy.css'

const app = createApp(App)

app.use(VueTippy, {
  appendTo: () => document.body,
  directive: 'tippy', // => v-tippy
  component: 'tippy', // => <tippy/>
  componentSingleton: 'tippy-singleton', // => <tippy-singleton/>,
  defaultProps: {
    placement: 'bottom',
    allowHTML: true
  } // => Global default options * see all props
})

app.use(router).mount('#app')
