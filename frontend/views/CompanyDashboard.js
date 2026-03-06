// views/CompanyDashboard.js
const CompanyDashboard = {
  template: `
  <div class="container py-4 fade-in">
    <div class="page-header">
      <h3><i class="bi bi-speedometer2 me-2"></i>Company Dashboard</h3>
      <p class="text-muted mb-0">Welcome back, {{ profile.name || '' }}</p>
    </div>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <template v-else>
      <!-- Company status alert -->
      <div v-if="profile.status === 'pending'" class="alert alert-warning d-flex align-items-center gap-2 py-2">
        <i class="bi bi-clock-history fs-5"></i>
        <div>Your company registration is <strong>pending admin approval</strong>. You can create drives once approved.</div>
      </div>
      <div v-if="profile.status === 'rejected'" class="alert alert-danger d-flex align-items-center gap-2 py-2">
        <i class="bi bi-x-octagon fs-5"></i>
        <div>Your company registration has been <strong>rejected</strong>. Please contact the admin.</div>
      </div>

      <!-- Company details card -->
      <div class="ppa-card p-4 mb-4">
        <h5 class="mb-3">Company Profile</h5>
        <div class="row">
          <div class="col-md-6">
            <p class="mb-1"><span class="text-muted">Name:</span> <strong>{{ profile.name }}</strong></p>
            <p class="mb-1"><span class="text-muted">Email:</span> {{ profile.email }}</p>
            <p class="mb-1"><span class="text-muted">Industry:</span> {{ profile.industry || '—' }}</p>
          </div>
          <div class="col-md-6">
            <p class="mb-1"><span class="text-muted">Website:</span> {{ profile.website || '—' }}</p>
            <p class="mb-1"><span class="text-muted">Status:</span> <span :class="'badge-status badge-'+profile.status">{{ profile.status }}</span></p>
          </div>
        </div>
        <p class="mt-2 mb-0 text-muted small">{{ profile.description }}</p>
      </div>

      <!-- Drives summary -->
      <div class="ppa-card p-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0">Your Placement Drives</h5>
          <router-link to="/company/drives" class="btn btn-ppa btn-sm">
            <i class="bi bi-plus-lg me-1"></i>Manage Drives
          </router-link>
        </div>
        <div v-if="drives.length === 0" class="text-muted">No drives created yet.</div>
        <div v-else class="table-responsive">
          <table class="table table-ppa mb-0">
            <thead><tr><th>Title</th><th>Status</th><th>Applicants</th></tr></thead>
            <tbody>
              <tr v-for="d in drives" :key="d.id">
                <td class="fw-semibold">{{ d.title }}</td>
                <td><span :class="'badge-status badge-'+d.status">{{ d.status }}</span></td>
                <td>{{ d.applicants_count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>`,
  data() { return { profile: {}, drives: [], loading: true }; },
  async created() {
    try { this.profile = await Api.get('/company/profile'); } catch { }
    try { this.drives = await Api.get('/company/drives'); } catch { }
    this.loading = false;
  }
};
window.CompanyDashboard = CompanyDashboard;
