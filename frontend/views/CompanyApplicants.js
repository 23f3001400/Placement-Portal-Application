// views/CompanyApplicants.js
const CompanyApplicants = {
  template: `
  <div class="container py-4 fade-in">
    <div class="page-header">
      <router-link to="/company/drives" class="btn btn-sm btn-outline-ppa mb-2"><i class="bi bi-arrow-left me-1"></i>Back to Drives</router-link>
      <h3><i class="bi bi-people me-2"></i>Applicants</h3>
      <p class="text-muted mb-0">Manage applicants for this placement drive</p>
    </div>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="applicants.length === 0" class="text-center py-5 text-muted">No applicants yet.</div>
    <div v-else class="table-responsive" style="overflow:visible;">
      <table class="table table-ppa align-middle">
        <thead>
          <tr>
            <th>Student</th>
            <th>Email</th>
            <th>Branch</th>
            <th>Resume</th>
            <th>Grad</th>
            <th>Skills</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in applicants" :key="a.application_id">
            <td class="fw-semibold">{{ a.student_name }}</td>
            <td>{{ a.email }}</td>
            <td>{{ a.branch }}</td>
            <td>
              <button v-if="a.resume_path" class="btn btn-sm btn-outline-ppa" @click="viewResume(a)">
                <i class="bi bi-eye me-1"></i>View
              </button>
              <span v-else class="text-muted small">—</span>
            </td>
            <td>{{ a.grad_marks }}</td>
            <td><small>{{ a.skills }}</small></td>
            <td><span :class="'badge-status badge-'+a.status">{{ a.status }}</span></td>
            <td>
              <div v-if="a.status==='selected' || a.status==='rejected'" class="text-muted small">—</div>
              <div v-else class="dropdown">
                <button class="btn btn-sm btn-outline-ppa dropdown-toggle" data-bs-toggle="dropdown" data-bs-display="static">Action</button>
                <ul class="dropdown-menu">
                  <li v-if="a.status==='applied'"><a class="dropdown-item" href="#" @click.prevent="updateStatus(a,'shortlisted')"><i class="bi bi-star me-2"></i>Shortlist</a></li>
                  <li v-if="a.status==='applied' || a.status==='shortlisted'"><a class="dropdown-item" href="#" @click.prevent="scheduleInterview(a)"><i class="bi bi-calendar me-2"></i>Schedule Interview</a></li>
                  <li v-if="a.status==='interview'"><a class="dropdown-item" href="#" @click.prevent="updateStatus(a,'selected')"><i class="bi bi-check-circle me-2"></i>Select</a></li>
                  <li v-if="a.status==='interview'"><hr class="dropdown-divider"></li>
                  <li v-if="a.status==='interview'"><a class="dropdown-item text-danger" href="#" @click.prevent="updateStatus(a,'rejected')"><i class="bi bi-x-circle me-2"></i>Reject</a></li>
                </ul>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Interview scheduling modal -->
    <div v-if="showInterviewModal" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background:rgba(0,0,0,.6);z-index:1050;">
      <div class="ppa-card p-4" style="width:100%;max-width:500px;">
        <h5 class="mb-3">Schedule Interview</h5>
        <p class="text-muted small mb-3">For: {{ interviewTarget?.student_name }}</p>
        <div class="mb-3">
          <label class="form-label">Date & Time</label>
          <input type="datetime-local" class="form-control" v-model="interview.scheduled_at" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Mode</label>
          <select class="form-select" v-model="interview.mode">
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
        <div class="mb-3" v-if="interview.mode === 'online'">
          <label class="form-label">Meeting Link</label>
          <input class="form-control" v-model="interview.link" placeholder="https://meet.google.com/..." />
        </div>
        <div class="mb-3" v-if="interview.mode === 'offline'">
          <label class="form-label">Venue</label>
          <input class="form-control" v-model="interview.venue" />
        </div>
        <div class="mb-3">
          <label class="form-label">Notes</label>
          <textarea class="form-control" rows="2" v-model="interview.notes"></textarea>
        </div>
        <div class="d-flex gap-2 justify-content-end">
          <button class="btn btn-outline-secondary" @click="showInterviewModal = false">Cancel</button>
          <button class="btn btn-ppa" @click="submitInterview" :disabled="!interview.scheduled_at">Schedule</button>
        </div>
      </div>
    </div>
  </div>`,
  data() {
    return {
      applicants: [], loading: true, driveStatus: '',
      showInterviewModal: false, interviewTarget: null,
      interview: { scheduled_at: '', mode: 'online', link: '', venue: '', notes: '' }
    };
  },
  methods: {
    async fetchApplicants() {
      this.loading = true;
      const did = this.$route.params.id;
      try {
        this.applicants = await Api.get('/company/drives/' + did + '/applicants');
        const drives = await Api.get('/company/drives');
        const drive = drives.find(d => d.id == did);
        if (drive) this.driveStatus = drive.status;
      } catch { }
      this.loading = false;
    },
    async updateStatus(a, status) {
      try {
        await Api.put('/company/applications/' + a.application_id, { status });
        a.status = status;
      } catch (e) { alert(e.message); }
    },
    scheduleInterview(a) {
      this.interviewTarget = a;
      this.interview = { scheduled_at: '', mode: 'online', link: '', venue: '', notes: '' };
      this.showInterviewModal = true;
    },
    async submitInterview() {
      try {
        await Api.post('/company/interviews', {
          application_id: this.interviewTarget.application_id,
          ...this.interview
        });
        this.interviewTarget.status = 'interview';
        this.showInterviewModal = false;
      } catch (e) { alert(e.message); }
    },
    async viewResume(a) {
      try {
        const res = await fetch('/api/student/resume/' + a.resume_path, {
          headers: { 'Authentication-Token': Api.getToken() }
        });
        if (!res.ok) throw new Error('Failed to load resume');
        const blob = await res.blob();
        window.open(URL.createObjectURL(blob), '_blank');
      } catch (e) { alert(e.message); }
    }
  },
  created() { this.fetchApplicants(); }
};
window.CompanyApplicants = CompanyApplicants;
