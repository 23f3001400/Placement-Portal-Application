// views/StudentDashboard.js
const StudentDashboard = {
  template: `
  <div class="container py-4 fade-in">
    <div class="page-header">
      <h3><i class="bi bi-speedometer2 me-2"></i>Student Dashboard</h3>
      <p class="text-muted mb-0">Welcome back, {{ profile.name || '' }}</p>
    </div>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <template v-else>
      <!-- Quick stats -->
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-value" style="color:var(--ppa-secondary);">{{ drives.length }}</div>
            <div class="stat-label">Available Drives</div>
          </div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-value" style="color:var(--ppa-accent);">{{ applications.length }}</div>
            <div class="stat-label">My Applications</div>
          </div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-value" style="color:var(--ppa-warning);">{{ shortlisted }}</div>
            <div class="stat-label">Shortlisted</div>
          </div>
        </div>
        <div class="col-sm-6 col-lg-3">
          <div class="stat-card">
            <div class="stat-value" style="color:var(--ppa-success);">{{ selected }}</div>
            <div class="stat-label">Selected</div>
          </div>
        </div>
      </div>

      <!-- Drives preview -->
      <div class="ppa-card p-4 mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0">Recent Approved Drives</h5>
          <router-link to="/student/drives" class="btn btn-outline-ppa btn-sm">View All</router-link>
        </div>
        <div v-if="drives.length === 0" class="text-muted">No drives available right now.</div>
        <div v-else class="table-responsive">
          <table class="table table-ppa mb-0">
            <thead><tr><th>Title</th><th>Company</th><th>Package</th><th>Eligible</th><th></th></tr></thead>
            <tbody>
              <tr v-for="d in drives.slice(0,5)" :key="d.id">
                <td class="fw-semibold">{{ d.title }}</td>
                <td>{{ d.company_name }}</td>
                <td>{{ d.package_lpa ? d.package_lpa + ' LPA' : '—' }}</td>
                <td>
                  <span v-if="d.eligible" class="badge-status badge-approved">Eligible</span>
                  <span v-else class="badge-status badge-rejected">Not Eligible</span>
                </td>
                <td>
                  <button v-if="d.eligible && !d.already_applied" class="btn btn-sm btn-ppa" @click="applyToDrive(d)">Apply</button>
                  <span v-else-if="d.already_applied" class="badge-status badge-applied">Applied</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Applications preview -->
      <div class="ppa-card p-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0">My Applications</h5>
          <router-link to="/student/applications" class="btn btn-outline-ppa btn-sm">View All</router-link>
        </div>
        <div v-if="applications.length === 0" class="text-muted">You haven't applied to any drives yet.</div>
        <div v-else class="table-responsive">
          <table class="table table-ppa mb-0">
            <thead><tr><th>Drive</th><th>Company</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="a in applications.slice(0,5)" :key="a.id">
                <td>{{ a.drive_title }}</td>
                <td>{{ a.company_name }}</td>
                <td><span :class="'badge-status badge-'+a.status">{{ a.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>`,
  data() { return { profile: {}, drives: [], applications: [], loading: true }; },
  computed: {
    shortlisted() { return this.applications.filter(a => a.status === 'shortlisted' || a.status === 'interview').length; },
    selected() { return this.applications.filter(a => a.status === 'selected').length; }
  },
  methods: {
    async applyToDrive(d) {
      try {
        await Api.post('/student/applications', { drive_id: d.id });
        d.already_applied = true;
        this.applications = await Api.get('/student/applications');
      } catch (e) { alert(e.message); }
    }
  },
  async created() {
    try {
      const [p, d, a] = await Promise.all([
        Api.get('/student/profile'),
        Api.get('/student/drives'),
        Api.get('/student/applications')
      ]);
      this.profile = p;
      this.drives = d;
      this.applications = a;
    } catch { }
    this.loading = false;
  }
};
window.StudentDashboard = StudentDashboard;
