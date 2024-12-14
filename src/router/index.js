import {createRouter, createWebHistory} from 'vue-router'

import HelloWorld from '../components/HelloWorld.vue'

const routes = [
    {
        path: import.meta.env.BASE_URL,
        name: 'Home',
        component: HelloWorld,
        props: {msg: 'Smartphone Crash Simulator', showDebug: false},
    },
    {
        path: import.meta.env.BASE_URL + 'debug',
        name: 'Debug',
        component: HelloWorld,
        props: {msg: 'Debug Crasher', showDebug: true},
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
