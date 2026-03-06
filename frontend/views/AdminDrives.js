// views/AdminDrives.js
const AdminDrives = {
  template: `
  <div class="container py-4 fade-in">
    <div class="page-header d-flex flex-wrap justify-content-between align-items-center">
      <div>
        <h3><i class="bi bi-briefcase me-2"></i>Manage Placement Drives</h3>
        <p class="text-muted mb-0">Approve or reject placement drives created by companies</p>
      </div>
      <select class="form-select form-select-sm mt-2 mt-md-0" style="width:150px;" v-model="statusFilter" @change="fetchDrives">
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="completed">Completed</option>
      </select>
    </div>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="drives.length === 0" class="text-center py-5 text-muted">No drives found.</div>
    <div v-else class="table-responsive">
      <table class="table table-ppa align-middle">
        <thead>
          <tr>
            <th>Drive</th>
            <th>Company</th>
            <th>Package</th>
            <th>Applicants</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in drives" :key="d.id">
            <td>
              <div class="fw-semibold">{{ d.title }}</div>
              <small class="text-muted">{{ d.role_offered }} · {{ d.location }}</small>
            </td>
            <td>{{ d.company_name }}</td>
            <td>{{ d.package_lpa ? d.package_lpa + ' LPA' : '—' }}</td>
            <td><span class="badge bg-secondary bg-opacity-25">{{ d.applicants_count }}</span></td>
            <td><span :class="'badge-status badge-'+d.status">{{ d.status }}</span></td>
            <td>
              <div class="d-flex gap-1 flex-wrap">
                <button v-if="d.status==='pending'" class="btn btn-sm btn-outline-success" @click="update(d,'approved')"><i class="bi bi-check-lg"></i> Approve</button>
                <button v-if="d.status==='pending'" class="btn btn-sm btn-outline-danger" @click="update(d,'rejected')"><i class="bi bi-x-lg"></i> Reject</button>
                <button v-if="d.status==='approved'" class="btn btn-sm btn-outline-secondary" @click="update(d,'completed')"><i class="bi bi-check-all"></i> Complete</button>
                <button class="btn btn-sm btn-danger" @click="remove(d)"><i class="bi bi-trash"></i></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`,
  data() { return { drives: [], statusFilter: '', loading: true }; },
  methods: {
    async fetchDrives() {
      this.loading = true;
      try {
        let url = '/admin/drives';
        if (this.statusFilter) url += '?status=' + this.statusFilter;
        this.drives = await Api.get(url);
      } catch { }
      this.loading = false;
    },
    async update(d, status) {
      try {
        await Api.put('/admin/drives/' + d.id, { status });
        d.status = status;
      } catch (e) { alert(e.message); }
    },
    async remove(d) {
      if (!confirm('Permanently delete drive "' + d.title + '"? This will also remove all its applications.')) return;
      try {
        await Api.del('/admin/drives/' + d.id);
        await this.fetchDrives();
      } catch (e) { alert(e.message); }
    }
  },
  created() { this.fetchDrives(); }
};
window.AdminDrives = AdminDrives;
