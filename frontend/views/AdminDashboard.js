// views/AdminDashboard.js
const AdminDashboard = {
  template: `
  <div class="container py-4 fade-in">
    <div class="page-header">
      <h3><i class="bi bi-speedometer2 me-2 text-gradient" style="background:var(--ppa-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;"></i>Admin Dashboard</h3>
      <p class="text-muted mb-0">Overview of your placement portal</p>
    </div>

    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>

    <template v-else>
      <!-- Stat cards -->
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-lg-3" v-for="s in stats" :key="s.label">
          <div class="stat-card d-flex justify-content-between align-items-center">
            <div>
              <div class="stat-value">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
            <i :class="'bi '+s.icon+' stat-icon'"></i>
          </div>
        </div>
      </div>

      <!-- Quick action cards -->
      <div class="row g-3">
        <div class="col-md-4">
          <div class="ppa-card p-4 text-center h-100">
            <i class="bi bi-building fs-2 mb-2" style="color:var(--ppa-secondary);"></i>
            <h5>Pending Companies</h5>
            <p class="display-6 fw-bold" style="color:var(--ppa-warning);">{{ data.pending_companies }}</p>
            <router-link to="/admin/companies" class="btn btn-outline-ppa btn-sm">Manage</router-link>
          </div>
        </div>
        <div class="col-md-4">
          <div class="ppa-card p-4 text-center h-100">
            <i class="bi bi-briefcase fs-2 mb-2" style="color:var(--ppa-accent);"></i>
            <h5>Pending Drives</h5>
            <p class="display-6 fw-bold" style="color:var(--ppa-warning);">{{ data.pending_drives }}</p>
            <router-link to="/admin/drives" class="btn btn-outline-ppa btn-sm">Manage</router-link>
          </div>
        </div>
        <div class="col-md-4">
          <div class="ppa-card p-4 text-center h-100">
            <i class="bi bi-trophy fs-2 mb-2" style="color:var(--ppa-success);"></i>
            <h5>Total Selections</h5>
            <p class="display-6 fw-bold" style="color:var(--ppa-success);">{{ data.total_selected }}</p>
            <router-link to="/admin/reports" class="btn btn-outline-ppa btn-sm">View Reports</router-link>
          </div>
        </div>
      </div>
    </template>
  </div>`,
  data() { return { data: {}, loading: true }; },
  computed: {
    stats() {
      return [
        { label: 'Total Students', value: this.data.total_students || 0, icon: 'bi-people-fill' },
        { label: 'Total Companies', value: this.data.total_companies || 0, icon: 'bi-building' },
        { label: 'Total Drives', value: this.data.total_drives || 0, icon: 'bi-briefcase-fill' },
        { label: 'Applications', value: this.data.total_applications || 0, icon: 'bi-file-earmark-text-fill' },
      ];
    }
  },
  async created() {
    try { this.data = await Api.get('/admin/dashboard'); } catch { }
    this.loading = false;
  }
};
window.AdminDashboard = AdminDashboard;
