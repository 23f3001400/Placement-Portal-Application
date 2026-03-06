// components/Navbar.js
const AppNavbar = {
  template: `
  <nav class="navbar navbar-expand-lg ppa-navbar sticky-top">
    <div class="container">
      <router-link class="navbar-brand" to="/">
        <i class="bi bi-mortarboard-fill me-2"></i>PPA
      </router-link>
      <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navMain">
        <i class="bi bi-list text-dark fs-4"></i>
      </button>
      <div class="collapse navbar-collapse" id="navMain">
        <ul class="navbar-nav ms-auto align-items-lg-center gap-1">
          <!-- Admin -->
          <template v-if="role === 'admin'">
            <li class="nav-item"><router-link class="nav-link" to="/admin/dashboard"><i class="bi bi-speedometer2 me-1"></i>Dashboard</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/admin/companies"><i class="bi bi-building me-1"></i>Companies</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/admin/students"><i class="bi bi-people me-1"></i>Students</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/admin/drives"><i class="bi bi-briefcase me-1"></i>Drives</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/admin/reports"><i class="bi bi-bar-chart me-1"></i>Reports</router-link></li>
          </template>
          <!-- Company -->
          <template v-if="role === 'company'">
            <li class="nav-item"><router-link class="nav-link" to="/company/dashboard"><i class="bi bi-speedometer2 me-1"></i>Dashboard</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/company/drives"><i class="bi bi-briefcase me-1"></i>Drives</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/company/interviews"><i class="bi bi-calendar-event me-1"></i>Interviews</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/company/reports"><i class="bi bi-bar-chart me-1"></i>Reports</router-link></li>
          </template>
          <!-- Student -->
          <template v-if="role === 'student'">
            <li class="nav-item"><router-link class="nav-link" to="/student/dashboard"><i class="bi bi-speedometer2 me-1"></i>Dashboard</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/student/drives"><i class="bi bi-briefcase me-1"></i>Drives</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/student/applications"><i class="bi bi-file-earmark-text me-1"></i>Applications</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/student/profile"><i class="bi bi-person me-1"></i>Profile</router-link></li>
            <li class="nav-item"><router-link class="nav-link" to="/student/placements"><i class="bi bi-trophy me-1"></i>Placements</router-link></li>
          </template>
          <!-- User info / logout -->
          <li class="nav-item ms-lg-3" v-if="email">
            <span class="nav-link d-flex align-items-center gap-2">
              <span class="badge bg-secondary bg-opacity-25 text-dark" style="font-size:.75rem;">{{ email }}</span>
              <button class="btn btn-sm btn-outline-danger rounded-pill px-3" @click="doLogout"><i class="bi bi-box-arrow-right me-1"></i>Logout</button>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </nav>`,
  computed: {
    role() { return Api.getRole(); },
    email() { return Api.getEmail(); }
  },
  methods: {
    async doLogout() {
      try { await Api.logout(); } catch { }
      Api.clearToken();
      this.$router.push('/login');
    }
  }
};
window.AppNavbar = AppNavbar;
