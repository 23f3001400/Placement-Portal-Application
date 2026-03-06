// views/CompanyDrives.js
const CompanyDrives = {
  template: `
  <div class="container py-4 fade-in">
    <div class="page-header d-flex flex-wrap justify-content-between align-items-center">
      <div>
        <h3><i class="bi bi-briefcase me-2"></i>Placement Drives</h3>
        <p class="text-muted mb-0">Create and manage your placement drives</p>
      </div>
      <button class="btn btn-ppa mt-2 mt-md-0" @click="showForm = !showForm">
        <i class="bi bi-plus-lg me-1"></i>{{ showForm ? 'Cancel' : 'New Drive' }}
      </button>
    </div>

    <!-- Create form -->
    <div v-if="showForm" class="ppa-card p-4 mb-4">
      <h5 class="mb-3">{{ editId ? 'Edit Drive' : 'Create New Drive' }}</h5>
      <div v-if="formError" class="alert alert-danger py-2 small">{{ formError }}</div>
      <form @submit.prevent="saveDrive">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Title *</label>
            <input class="form-control" v-model="form.title" required />
          </div>
          <div class="col-md-6">
            <label class="form-label">Role Offered</label>
            <input class="form-control" v-model="form.role_offered" />
          </div>
          <div class="col-12">
            <label class="form-label">Description</label>
            <textarea class="form-control" rows="3" v-model="form.description"></textarea>
          </div>
          <div class="col-md-4">
            <label class="form-label">Package (LPA)</label>
            <input type="number" step="0.1" class="form-control" v-model.number="form.package_lpa" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Location</label>
            <input class="form-control" v-model="form.location" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Eligible Branches</label>
            <input class="form-control" v-model="form.eligibility_branches" placeholder="CSE, ECE, IT" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Eligible Grad Years</label>
            <input class="form-control" v-model="form.eligibility_graduating_years" placeholder="2026, 2027" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Min 10th %</label>
            <input type="number" step="0.01" class="form-control" v-model.number="form.eligibility_tenth" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Min 12th %</label>
            <input type="number" step="0.01" class="form-control" v-model.number="form.eligibility_twelfth" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Min Grad %</label>
            <input type="number" step="0.01" class="form-control" v-model.number="form.eligibility_grad" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Drive Date</label>
            <input type="datetime-local" class="form-control" v-model="form.drive_date" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Last Date to Apply</label>
            <input type="datetime-local" class="form-control" v-model="form.last_date_to_apply" />
          </div>
        </div>
        <button type="submit" class="btn btn-ppa mt-3" :disabled="saving">
          <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
          {{ editId ? 'Update Drive' : 'Create Drive' }}
        </button>
      </form>
    </div>

    <!-- Drives list -->
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="drives.length === 0" class="text-center py-5 text-muted">No drives yet. Create your first one!</div>
    <div v-else class="row g-3">
      <div class="col-lg-6" v-for="d in drives" :key="d.id">
        <div class="ppa-card p-4 h-100">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="mb-0">{{ d.title }}</h5>
            <span :class="'badge-status badge-'+d.status">{{ d.status }}</span>
          </div>
          <p class="text-muted small mb-2">{{ d.role_offered }} · {{ d.location || 'Remote' }} · {{ d.package_lpa ? d.package_lpa+' LPA' : '' }}</p>
          <p class="small mb-3" style="color:var(--ppa-text-muted);">{{ d.description ? d.description.substring(0,120) + '…' : '' }}</p>
          <div class="d-flex justify-content-between align-items-center">
            <span class="small text-muted"><i class="bi bi-people me-1"></i>{{ d.applicants_count }} applicant{{ d.applicants_count !== 1 ? 's' : '' }}</span>
            <div class="d-flex gap-1">
              <button v-if="d.status!=='closed'" class="btn btn-sm btn-outline-ppa" @click="editDrive(d)"><i class="bi bi-pencil"></i></button>
              <button v-if="d.status==='approved'" class="btn btn-sm btn-outline-danger" @click="closeDrive(d)" title="Close Drive">
                <i class="bi bi-x-circle"></i>
              </button>
              <button class="btn btn-sm btn-danger" @click="deleteDrive(d)" title="Delete Drive">
                <i class="bi bi-trash"></i>
              </button>
              <router-link :to="'/company/drives/'+d.id+'/applicants'" class="btn btn-sm btn-ppa">
                <i class="bi bi-eye me-1"></i>Applicants
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`,
  data() {
    return {
      drives: [], loading: true, showForm: false, saving: false,
      editId: null, formError: '',
      form: { title: '', description: '', role_offered: '', package_lpa: 0, location: '', eligibility_tenth: 0, eligibility_twelfth: 0, eligibility_grad: 0, eligibility_branches: '', eligibility_graduating_years: '', drive_date: '', last_date_to_apply: '' }
    };
  },
  methods: {
    async fetchDrives() {
      this.loading = true;
      try { this.drives = await Api.get('/company/drives'); } catch { }
      this.loading = false;
    },
    resetForm() {
      this.editId = null;
      this.form = { title: '', description: '', role_offered: '', package_lpa: 0, location: '', eligibility_tenth: 0, eligibility_twelfth: 0, eligibility_grad: 0, eligibility_branches: '', drive_date: '', last_date_to_apply: '' };
    },
    editDrive(d) {
      this.editId = d.id;
      this.form = { ...d, drive_date: d.drive_date ? d.drive_date.substring(0, 16) : '', last_date_to_apply: d.last_date_to_apply ? d.last_date_to_apply.substring(0, 16) : '' };
      this.showForm = true;
    },
    async saveDrive() {
      this.formError = '';
      this.saving = true;
      try {
        if (this.editId) {
          await Api.put('/company/drives/' + this.editId, this.form);
        } else {
          await Api.post('/company/drives', this.form);
        }
        this.showForm = false;
        this.resetForm();
        await this.fetchDrives();
      } catch (e) { this.formError = e.message; }
      this.saving = false;
    },
    async closeDrive(d) {
      if (!confirm('Close this drive? Students will no longer be able to apply.')) return;
      try {
        await Api.put('/company/drives/' + d.id + '/close');
        d.status = 'closed';
      } catch (e) { alert(e.message); }
    },
    async deleteDrive(d) {
      if (!confirm('Permanently delete drive "' + d.title + '"? This will also remove all its applications.')) return;
      try {
        await Api.del('/company/drives/' + d.id);
        await this.fetchDrives();
      } catch (e) { alert(e.message); }
    }
  },
  created() { this.fetchDrives(); }
};
window.CompanyDrives = CompanyDrives;
