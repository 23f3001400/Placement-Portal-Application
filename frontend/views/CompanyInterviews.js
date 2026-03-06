// views/CompanyInterviews.js
const CompanyInterviews = {
  template: `
  <div class="container py-4 fade-in">
    <div class="page-header">
      <h3><i class="bi bi-calendar-event me-2"></i>Scheduled Interviews</h3>
      <p class="text-muted mb-0">All your upcoming and past interviews</p>
    </div>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="interviews.length === 0" class="text-center py-5 text-muted">No interviews scheduled yet.</div>
    <div v-else class="table-responsive">
      <table class="table table-ppa align-middle">
        <thead>
          <tr><th>Student</th><th>Drive</th><th>Date & Time</th><th>Mode</th><th>Link / Venue</th><th>App Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr v-for="i in interviews" :key="i.id">
            <td>
              <div class="fw-semibold">{{ i.student_name }}</div>
              <small class="text-muted">{{ i.student_email }}</small>
            </td>
            <td>{{ i.drive_title }}</td>
            <td>{{ formatDate(i.scheduled_at) }}</td>
            <td><span class="badge bg-secondary bg-opacity-25">{{ i.mode }}</span></td>
            <td>
              <a v-if="i.link" :href="i.link" target="_blank" class="text-decoration-none" style="color:var(--ppa-secondary);">{{ i.link }}</a>
              <span v-else>{{ i.venue || '—' }}</span>
            </td>
            <td><span :class="'badge-status badge-'+i.application_status">{{ i.application_status }}</span></td>
            <td>
              <template v-if="i.application_status==='interview'">
                <button class="btn btn-sm btn-success me-1" @click="updateStatus(i,'selected')">
                  <i class="bi bi-check-circle me-1"></i>Select
                </button>
                <button class="btn btn-sm btn-danger" @click="updateStatus(i,'rejected')">
                  <i class="bi bi-x-circle me-1"></i>Reject
                </button>
              </template>
              <span v-else class="text-muted small">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`,
  data() { return { interviews: [], loading: true }; },
  methods: {
    formatDate(iso) {
      if (!iso) return '—';
      return new Date(iso).toLocaleString();
    },
    async updateStatus(i, status) {
      try {
        await Api.put('/company/applications/' + i.application_id, { status });
        i.application_status = status;
      } catch (e) { alert(e.message); }
    }
  },
  async created() {
    try { this.interviews = await Api.get('/company/interviews'); } catch { }
    this.loading = false;
  }
};
window.CompanyInterviews = CompanyInterviews;
