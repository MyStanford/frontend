import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Workflow from '../views/Workflow.vue'
import Pricing from '../views/Pricing.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/workflow',
        name: 'Workflow',
        component: Workflow
    },
    {
        path: '/pricing',
        name: 'Pricing',
        component: Pricing
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router 