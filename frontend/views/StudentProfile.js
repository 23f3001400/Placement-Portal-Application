// views/StudentProfile.js
const StudentProfile = {
  template: `
  <div class="container py-4 fade-in">
    <div class="page-header">
      <h3><i class="bi bi-person me-2"></i>My Profile</h3>
      <p class="text-muted mb-0">Update your profile and upload resume</p>
    </div>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <template v-else>
      <div v-if="success" class="alert alert-success py-2 small">{{ success }}</div>
      <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

      <div class="row g-4">
        <!-- Profile form -->
        <div class="col-lg-8">
          <div class="ppa-card p-4">
            <h5 class="mb-3">Personal Information</h5>
            <form @submit.prevent="saveProfile">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Full Name</label>
                  <input class="form-control" v-model="form.name" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Phone</label>
                  <input class="form-control" v-model="form.phone" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">10th Marks (%)</label>
                  <input type="number" step="0.01" class="form-control" v-model.number="form.tenth_marks" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">12th Marks (%)</label>
                  <input type="number" step="0.01" class="form-control" v-model.number="form.twelfth_marks" />
                </div>
                <div class="col-md-4">
                  <label class="form-label">Graduation Marks (%)</label>
                  <input type="number" step="0.01" class="form-control" v-model.number="form.grad_marks" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Degree</label>
                  <input class="form-control" v-model="form.degree" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Branch</label>
                  <input class="form-control" v-model="form.branch" />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Graduating Year</label>
                  <input type="number" class="form-control" v-model.number="form.graduating_year" placeholder="2026" />
                </div>
                <div class="col-12">
                  <label class="form-label">Skills</label>
                  <textarea class="form-control" rows="2" v-model="form.skills" placeholder="Python, JavaScript, SQL, React"></textarea>
                </div>
              </div>
              <button type="submit" class="btn btn-ppa mt-3" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                Save Changes
              </button>
            </form>
          </div>
        </div>

        <!-- Resume upload -->
        <div class="col-lg-4">
          <div class="ppa-card p-4">
            <h5 class="mb-3">Resume</h5>
            <div v-if="form.resume_path" class="mb-3 p-3 rounded text-center" style="background:var(--ppa-surface2);">
              <i class="bi bi-file-earmark-pdf fs-1 d-block mb-2" style="color:var(--ppa-accent);"></i>
              <p class="small mb-1">{{ form.resume_path }}</p>
              <span class="badge-status badge-approved">Uploaded</span>
              <button class="btn btn-sm btn-outline-ppa w-100 mt-2" @click="viewResume">
                <i class="bi bi-eye me-1"></i>View Resume
              </button>
            </div>
            <div v-else class="mb-3 p-3 rounded text-center" style="background:var(--ppa-surface2);">
              <i class="bi bi-cloud-upload fs-1 d-block mb-2 text-muted"></i>
              <p class="small text-muted mb-0">No resume uploaded yet</p>
            </div>
            <input type="file" class="form-control form-control-sm" @change="onFileChange" accept=".pdf,.doc,.docx" />
            <button class="btn btn-outline-ppa btn-sm w-100 mt-2" @click="uploadResume" :disabled="!selectedFile || uploading">
              <span v-if="uploading" class="spinner-border spinner-border-sm me-1"></span>
              {{ uploading ? 'Uploading…' : 'Upload Resume' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>`,
  data() {
    return {
      form: {}, loading: true, saving: false, uploading: false,
      selectedFile: null, success: '', error: ''
    };
  },
  methods: {
    async fetchProfile() {
      try { this.form = await Api.get('/student/profile'); } catch { }
      this.loading = false;
    },
    async saveProfile() {
      this.success = ''; this.error = '';
      this.saving = true;
      try {
        await Api.put('/student/profile', this.form);
        this.success = 'Profile updated successfully!';
      } catch (e) { this.error = e.message; }
      this.saving = false;
    },
    onFileChange(e) { this.selectedFile = e.target.files[0]; },
    async viewResume() {
      try {
        const res = await fetch('/api/student/resume/' + this.form.resume_path, {
          headers: { 'Authentication-Token': Api.getToken() }
        });
        if (!res.ok) throw new Error('Failed to load resume');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch (e) { alert(e.message); }
    },
    async uploadResume() {
      if (!this.selectedFile) return;
      this.uploading = true;
      this.success = ''; this.error = '';
      try {
        const fd = new FormData();
        fd.append('resume', this.selectedFile);
        const res = await Api.upload('/student/resume', fd);
        this.form.resume_path = res.filename;
        this.success = 'Resume uploaded!';
        this.selectedFile = null;
      } catch (e) { this.error = e.message; }
      this.uploading = false;
    }
  },
  created() { this.fetchProfile(); }
};
window.StudentProfile = StudentProfile;
