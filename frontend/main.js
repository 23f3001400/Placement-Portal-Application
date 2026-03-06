// main.js — Vue 3 application entry
const { createApp } = Vue;

const app = createApp({
    computed: {
        showNavbar() {
            const route = this.$route;
            // Hide navbar on login/register pages
            return route && route.path !== '/login' && route.path !== '/register';
        }
    }
});

app.component('app-navbar', AppNavbar);
app.use(router);
app.mount('#app');
