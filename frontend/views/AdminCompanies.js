// views/AdminCompanies.js
const AdminCompanies = {
  template: `
  <div class="container py-4 fade-in">
    <div class="page-header d-flex flex-wrap justify-content-between align-items-center">
      <div>
        <h3><i class="bi bi-building me-2"></i>Manage Companies</h3>
        <p class="text-muted mb-0">Approve, reject, or blacklist company registrations</p>
      </div>
      <div class="d-flex gap-2 mt-2 mt-md-0">
        <input class="form-control form-control-sm" style="width:200px;" v-model="search" placeholder="Search companies…" @input="fetchCompanies" />
        <select class="form-select form-select-sm" style="width:150px;" v-model="statusFilter" @change="fetchCompanies">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
      </div>
    </div>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="companies.length === 0" class="text-center py-5 text-muted">No companies found.</div>
    <div v-else class="table-responsive">
      <table class="table table-ppa align-middle">
        <thead>
          <tr>
            <th>Company</th>
            <th>Email</th>
            <th>Industry</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in companies" :key="c.id">
            <td>
              <div class="fw-semibold">{{ c.name }}</div>
              <small class="text-muted">{{ c.website }}</small>
            </td>
            <td>{{ c.email }}</td>
            <td>{{ c.industry || '—' }}</td>
            <td><span :class="'badge-status badge-'+c.status">{{ c.status }}</span></td>
            <td>
              <div class="d-flex gap-1 flex-wrap">
                <button v-if="c.status==='pending'" class="btn btn-sm btn-outline-success" @click="update(c,'approved')">
                  <i class="bi bi-check-lg"></i> Approve
                </button>
                <button v-if="c.status==='pending'" class="btn btn-sm btn-outline-warning" @click="update(c,'rejected')">
                  <i class="bi bi-x-lg"></i> Reject
                </button>
                <button v-if="c.status==='approved'" class="btn btn-sm btn-outline-danger" @click="update(c,'blacklisted')">
                  <i class="bi bi-slash-circle"></i> Blacklist
                </button>
                <button v-if="c.status==='blacklisted'" class="btn btn-sm btn-outline-success" @click="update(c,'approved')">
                  <i class="bi bi-check-circle"></i> Unblacklist
                </button>
                <button class="btn btn-sm btn-danger" @click="remove(c)">
                  <i class="bi bi-trash"></i> Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`,
  data() { return { companies: [], search: '', statusFilter: '', loading: true }; },
  methods: {
    async fetchCompanies() {
      this.loading = true;
      try {
        let url = '/admin/companies?q=' + encodeURIComponent(this.search);
        if (this.statusFilter) url += '&status=' + this.statusFilter;
        this.companies = await Api.get(url);
      } catch { }
      this.loading = false;
    },
    async update(c, status) {
      try {
        await Api.put('/admin/companies/' + c.id, { status });
        c.status = status;
      } catch (e) { alert(e.message); }
    },
    async remove(c) {
      if (!confirm('Permanently delete ' + c.name + '? This will also remove all their drives and applications.')) return;
      try {
        await Api.del('/admin/companies/' + c.id);
        await this.fetchCompanies();
      } catch (e) { alert(e.message); }
    }
  },
  created() { this.fetchCompanies(); }
};
window.AdminCompanies = AdminCompanies;
