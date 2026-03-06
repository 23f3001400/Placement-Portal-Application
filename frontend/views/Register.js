// views/Register.js
const RegisterView = {
  template: `
  <div class="auth-container">
    <div class="auth-card fade-in" style="max-width:540px;">
      <div class="text-center mb-4">
        <i class="bi bi-person-plus-fill fs-1" style="background:var(--ppa-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;"></i>
        <h2 class="mt-2">Create Account</h2>
        <p class="text-muted mb-0">Register as a Student or Company</p>
      </div>
      <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
      <div v-if="success" class="alert alert-success py-2 small">{{ success }}</div>

      <!-- Role selector -->
      <div class="d-flex gap-2 mb-3">
        <button class="btn flex-fill py-2" :class="role==='student'?'btn-ppa':'btn-outline-ppa'" @click="role='student'">
          <i class="bi bi-person me-1"></i>Student
        </button>
        <button class="btn flex-fill py-2" :class="role==='company'?'btn-ppa':'btn-outline-ppa'" @click="role='company'">
          <i class="bi bi-building me-1"></i>Company
        </button>
      </div>

      <form @submit.prevent="doRegister">
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" v-model="form.email" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" v-model="form.password" required minlength="6" />
        </div>

        <!-- Student fields -->
        <template v-if="role==='student'">
          <div class="row g-2 mb-3">
            <div class="col-sm-6">
              <label class="form-label">Full Name</label>
              <input class="form-control" v-model="form.name" required />
            </div>
            <div class="col-sm-6">
              <label class="form-label">Phone</label>
              <input class="form-control" v-model="form.phone" />
            </div>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-4">
              <label class="form-label">10th %</label>
              <input type="number" step="0.01" class="form-control" v-model.number="form.tenth_marks" />
            </div>
            <div class="col-4">
              <label class="form-label">12th %</label>
              <input type="number" step="0.01" class="form-control" v-model.number="form.twelfth_marks" />
            </div>
            <div class="col-4">
              <label class="form-label">Grad %</label>
              <input type="number" step="0.01" class="form-control" v-model.number="form.grad_marks" />
            </div>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-sm-6">
              <label class="form-label">Degree</label>
              <input class="form-control" v-model="form.degree" placeholder="B.Tech" />
            </div>
            <div class="col-sm-6">
              <label class="form-label">Branch</label>
              <input class="form-control" v-model="form.branch" placeholder="CSE" />
            </div>
          </div>
          <div class="row g-2 mb-3">
            <div class="col-sm-6">
              <label class="form-label">Graduating Year</label>
              <input type="number" class="form-control" v-model.number="form.graduating_year" placeholder="2026" />
            </div>
            <div class="col-sm-6">
              <label class="form-label">Skills</label>
              <input class="form-control" v-model="form.skills" placeholder="Python, JavaScript, SQL" />
            </div>
          </div>
        </template>

        <!-- Company fields -->
        <template v-if="role==='company'">
          <div class="mb-3">
            <label class="form-label">Company Name</label>
            <input class="form-control" v-model="form.company_name" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Industry</label>
            <input class="form-control" v-model="form.industry" placeholder="IT / Finance / Healthcare" />
          </div>
          <div class="mb-3">
            <label class="form-label">Website</label>
            <input class="form-control" v-model="form.website" placeholder="https://example.com" />
          </div>
          <div class="mb-3">
            <label class="form-label">Description</label>
            <textarea class="form-control" rows="3" v-model="form.description"></textarea>
          </div>
        </template>

        <button type="submit" class="btn btn-ppa w-100 py-2" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading ? 'Registering…' : 'Create Account' }}
        </button>
      </form>
      <p class="text-center mt-3 mb-0 small text-muted">
        Already have an account? <router-link to="/login" class="text-decoration-none" style="color:var(--ppa-secondary);">Sign in</router-link>
      </p>
    </div>
  </div>`,
  data() {
    return {
      role: 'student',
      form: { email: '', password: '', name: '', phone: '', tenth_marks: 0, twelfth_marks: 0, grad_marks: 0, degree: '', branch: '', graduating_year: 0, skills: '', company_name: '', industry: '', website: '', description: '' },
      error: '', success: '', loading: false
    };
  },
  methods: {
    async doRegister() {
      this.error = ''; this.success = '';
      this.loading = true;
      try {
        const payload = { ...this.form, role: this.role };
        await Api.register(payload);
        this.success = 'Registration successful! You can now login.';
        setTimeout(() => this.$router.push('/login'), 1500);
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
window.RegisterView = RegisterView;
