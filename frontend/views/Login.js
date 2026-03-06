// views/Login.js
const LoginView = {
    template: `
  <div class="auth-container">
    <div class="auth-card fade-in">
      <div class="text-center mb-4">
        <i class="bi bi-mortarboard-fill fs-1 text-gradient" style="background:var(--ppa-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;"></i>
        <h2 class="mt-2">Welcome Back</h2>
        <p class="text-muted mb-0">Sign in to your Placement Portal account</p>
      </div>
      <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>
      <form @submit.prevent="doLogin">
        <div class="mb-3">
          <label class="form-label">Email address</label>
          <div class="input-group">
            <span class="input-group-text bg-transparent border-end-0" style="border-color:var(--ppa-border);color:var(--ppa-text-muted);"><i class="bi bi-envelope"></i></span>
            <input type="email" class="form-control border-start-0" v-model="email" placeholder="you@example.com" required />
          </div>
        </div>
        <div class="mb-4">
          <label class="form-label">Password</label>
          <div class="input-group">
            <span class="input-group-text bg-transparent border-end-0" style="border-color:var(--ppa-border);color:var(--ppa-text-muted);"><i class="bi bi-lock"></i></span>
            <input type="password" class="form-control border-start-0" v-model="password" placeholder="••••••••" required />
          </div>
        </div>
        <button type="submit" class="btn btn-ppa w-100 py-2" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>
      <p class="text-center mt-3 mb-0 small text-muted">
        Don't have an account? <router-link to="/register" class="text-decoration-none" style="color:var(--ppa-secondary);">Register here</router-link>
      </p>
    </div>
  </div>`,
    data() { return { email: '', password: '', error: '', loading: false }; },
    methods: {
        async doLogin() {
            this.error = '';
            this.loading = true;
            try {
                const res = await Api.login(this.email, this.password);
                Api.setToken(res.token);
                Api.setRole(res.role);
                Api.setEmail(res.email);
                const dest = { admin: '/admin/dashboard', company: '/company/dashboard', student: '/student/dashboard' };
                this.$router.push(dest[res.role] || '/');
            } catch (e) {
                this.error = e.message;
            } finally {
                this.loading = false;
            }
        }
    }
};
window.LoginView = LoginView;
