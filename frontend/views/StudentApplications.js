// views/StudentApplications.js
const StudentApplications = {
  template: `
  <div class="container py-4 fade-in">
    <div class="page-header">
      <h3><i class="bi bi-file-earmark-text me-2"></i>My Applications</h3>
      <p class="text-muted mb-0">Track the status of all your applications</p>
    </div>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="applications.length === 0" class="text-center py-5 text-muted">You haven't applied to any drives yet.</div>
    <div v-else class="row g-3">
      <div class="col-lg-6" v-for="a in applications" :key="a.id">
        <div class="ppa-card p-4 h-100">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 class="mb-0">{{ a.drive_title }}</h5>
              <p class="mb-0 small" style="color:var(--ppa-secondary);">{{ a.company_name }}</p>
            </div>
            <span :class="'badge-status badge-'+a.status">{{ a.status }}</span>
          </div>
          <p class="text-muted small mb-2">{{ a.role_offered }} · {{ a.package_lpa ? a.package_lpa + ' LPA' : '' }}</p>
          <p class="small text-muted mb-2"><i class="bi bi-calendar3 me-1"></i>Applied: {{ formatDate(a.applied_at) }}</p>

          <button v-if="a.status==='applied'" class="btn btn-sm btn-outline-danger" @click="withdraw(a)">
            <i class="bi bi-x-circle me-1"></i>Withdraw Application
          </button>

          <!-- Interviews -->
          <div v-if="a.interviews && a.interviews.length" class="mt-3 pt-3" style="border-top:1px solid var(--ppa-border);">
            <p class="small fw-semibold mb-2"><i class="bi bi-camera-video me-1"></i>Interviews:</p>
            <div v-for="iv in a.interviews" :key="iv.id" class="mb-2 p-2 rounded" style="background:var(--ppa-surface2);">
              <div class="small"><strong>{{ formatDate(iv.scheduled_at) }}</strong> · {{ iv.mode }}</div>
              <div v-if="iv.link" class="small"><a :href="iv.link" target="_blank" style="color:var(--ppa-secondary);">{{ iv.link }}</a></div>
              <div v-if="iv.venue" class="small text-muted">{{ iv.venue }}</div>
              <div v-if="iv.notes" class="small text-muted">{{ iv.notes }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`,
  data() { return { applications: [], loading: true }; },
  methods: {
    formatDate(iso) { return iso ? new Date(iso).toLocaleString() : '—'; },
    async fetchApplications() {
      this.loading = true;
      try { this.applications = await Api.get('/student/applications'); } catch { }
      this.loading = false;
    },
    async withdraw(a) {
      if (!confirm('Withdraw your application for "' + a.drive_title + '"?')) return;
      try {
        await Api.del('/student/applications/' + a.id);
        await this.fetchApplications();
      } catch (e) { alert(e.message); }
    }
  },
  created() { this.fetchApplications(); }
};
window.StudentApplications = StudentApplications;
