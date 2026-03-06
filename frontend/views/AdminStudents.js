// views/AdminStudents.js
const AdminStudents = {
  template: `
  <div class="container py-4 fade-in">
    <div class="page-header d-flex flex-wrap justify-content-between align-items-center">
      <div>
        <h3><i class="bi bi-people me-2"></i>Manage Students</h3>
        <p class="text-muted mb-0">View and manage registered students</p>
      </div>
      <div class="d-flex gap-2 mt-2 mt-md-0">
        <input class="form-control form-control-sm" style="width:200px;" v-model="search" placeholder="Search name/branch…" @input="fetchStudents" />
        <select class="form-select form-select-sm" style="width:150px;" v-model="statusFilter" @change="fetchStudents">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
      </div>
    </div>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="students.length === 0" class="text-center py-5 text-muted">No students found.</div>
    <div v-else class="table-responsive">
      <table class="table table-ppa align-middle">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Branch</th>
            <th>Grad Year</th>
            <th>10th</th>
            <th>12th</th>
            <th>Grad</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in students" :key="s.id">
            <td class="fw-semibold">{{ s.name }}</td>
            <td>{{ s.email }}</td>
            <td>{{ s.branch || '—' }}</td>
            <td>{{ s.graduating_year || '—' }}</td>
            <td>{{ s.tenth_marks }}</td>
            <td>{{ s.twelfth_marks }}</td>
            <td>{{ s.grad_marks }}</td>
            <td><span :class="'badge-status badge-'+s.status">{{ s.status }}</span></td>
            <td>
              <div class="d-flex gap-1 flex-wrap">
                <button v-if="s.status==='active'" class="btn btn-sm btn-outline-danger" @click="toggle(s,'blacklisted')">
                  <i class="bi bi-slash-circle"></i> Blacklist
                </button>
                <button v-else class="btn btn-sm btn-outline-success" @click="toggle(s,'active')">
                  <i class="bi bi-check-circle"></i> Activate
                </button>
                <button class="btn btn-sm btn-danger" @click="remove(s)">
                  <i class="bi bi-trash"></i> Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>`,
  data() { return { students: [], search: '', statusFilter: '', loading: true }; },
  methods: {
    async fetchStudents() {
      this.loading = true;
      try {
        let url = '/admin/students?q=' + encodeURIComponent(this.search);
        if (this.statusFilter) url += '&status=' + this.statusFilter;
        this.students = await Api.get(url);
      } catch { }
      this.loading = false;
    },
    async toggle(s, status) {
      try {
        await Api.put('/admin/students/' + s.id, { status });
        s.status = status;
      } catch (e) { alert(e.message); }
    },
    async remove(s) {
      if (!confirm('Permanently delete student ' + s.name + '? This will also remove all their applications.')) return;
      try {
        await Api.del('/admin/students/' + s.id);
        await this.fetchStudents();
      } catch (e) { alert(e.message); }
    }
  },
  created() { this.fetchStudents(); }
};
window.AdminStudents = AdminStudents;

