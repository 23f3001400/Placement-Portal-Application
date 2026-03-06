// views/StudentDrives.js
const StudentDrives = {
  template: `
  <div class="container py-4 fade-in">
    <div class="page-header d-flex flex-wrap justify-content-between align-items-center">
      <div>
        <h3><i class="bi bi-briefcase me-2"></i>Placement Drives</h3>
        <p class="text-muted mb-0">Browse and apply to approved placement drives</p>
      </div>
      <div class="d-flex gap-2 mt-2 mt-md-0">
        <input class="form-control form-control-sm" style="width:200px;" v-model="search" @input="fetchDrives" placeholder="Search drives…" />
        <div class="form-check form-switch d-flex align-items-center ms-2">
          <input class="form-check-input" type="checkbox" v-model="eligibleOnly" @change="fetchDrives" id="eligibleSwitch" />
          <label class="form-check-label ms-1 small text-muted" for="eligibleSwitch">Eligible only</label>
        </div>
      </div>
    </div>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="drives.length === 0" class="text-center py-5 text-muted">No drives found.</div>
    <div v-else class="row g-3">
      <div class="col-md-6 col-xl-4" v-for="d in drives" :key="d.id">
        <div class="ppa-card p-4 h-100 d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="mb-0">{{ d.title }}</h5>
            <span v-if="d.eligible" class="badge-status badge-approved">Eligible</span>
            <span v-else class="badge-status badge-rejected">Not Eligible</span>
          </div>
          <p class="mb-1 small" style="color:var(--ppa-secondary);">{{ d.company_name }}</p>
          <p class="text-muted small mb-2">{{ d.role_offered }} · {{ d.location || 'Remote' }}</p>
          <p class="small flex-grow-1" style="color:var(--ppa-text-muted);">{{ d.description ? d.description.substring(0,100) + '…' : '' }}</p>
          <div class="d-flex justify-content-between align-items-center mt-auto pt-2" style="border-top:1px solid var(--ppa-border);">
            <span class="fw-bold" style="color:var(--ppa-success);">{{ d.package_lpa ? d.package_lpa + ' LPA' : '—' }}</span>
            <button v-if="d.eligible && !d.already_applied" class="btn btn-sm btn-ppa" @click="apply(d)">
              <i class="bi bi-send me-1"></i>Apply
            </button>
            <span v-else-if="d.already_applied" class="badge-status badge-applied">Applied</span>
            <span v-else class="small text-muted">Not eligible</span>
          </div>
        </div>
      </div>
    </div>
  </div>`,
  data() { return { drives: [], search: '', eligibleOnly: false, loading: true }; },
  methods: {
    async fetchDrives() {
      this.loading = true;
      try {
        let url = '/student/drives?q=' + encodeURIComponent(this.search);
        if (this.eligibleOnly) url += '&eligible=1';
        this.drives = await Api.get(url);
      } catch { }
      this.loading = false;
    },
    async apply(d) {
      try {
        await Api.post('/student/applications', { drive_id: d.id });
        d.already_applied = true;
      } catch (e) { alert(e.message); }
    }
  },
  created() { this.fetchDrives(); }
};
window.StudentDrives = StudentDrives;
