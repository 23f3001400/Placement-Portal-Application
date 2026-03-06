// views/AdminReports.js
const AdminReports = {
  template: `
  <div class="container py-4 fade-in">
    <div class="page-header">
      <h3><i class="bi bi-bar-chart me-2"></i>Placement Reports</h3>
      <p class="text-muted mb-0">Placement statistics and analytics</p>
    </div>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>

    <template v-else>
      <!-- Summary stats -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-lg-3" v-for="s in summaryStats" :key="s.label">
          <div class="stat-card">
            <div class="stat-value" :style="{color: s.color}">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <!-- Placement Rate -->
      <div class="ppa-card p-4 mb-4">
        <h5 class="mb-3">Placement Rate</h5>
        <div class="d-flex align-items-center gap-3">
          <div class="progress flex-grow-1" style="height:24px;background:var(--ppa-surface2);border-radius:.5rem;">
            <div class="progress-bar" role="progressbar" :style="{width: data.placement_rate+'%', background:'var(--ppa-gradient)'}" style="border-radius:.5rem;">
              {{ data.placement_rate }}%
            </div>
          </div>
          <span class="fw-bold fs-5">{{ data.placement_rate }}%</span>
        </div>
      </div>

      <!-- Charts row -->
      <div class="row g-4 mb-4">
        <div class="col-md-5">
          <div class="ppa-card p-4 h-100">
            <h5 class="mb-3"><i class="bi bi-pie-chart me-2" style="color:var(--ppa-accent);"></i>Application Status</h5>
            <div style="position:relative;max-height:320px;display:flex;justify-content:center;">
              <canvas id="adminStatusPie"></canvas>
            </div>
          </div>
        </div>
        <div class="col-md-7">
          <div class="ppa-card p-4 h-100">
            <h5 class="mb-3"><i class="bi bi-bar-chart-fill me-2" style="color:var(--ppa-secondary);"></i>Company-wise Selections</h5>
            <div style="position:relative;max-height:320px;">
              <canvas id="adminCompanyBar"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Company-wise stats table -->
      <div class="ppa-card p-4">
        <h5 class="mb-3">Company-wise Breakdown</h5>
        <div v-if="!data.company_stats || data.company_stats.length === 0" class="text-muted">No data yet.</div>
        <div v-else class="table-responsive">
          <table class="table table-ppa mb-0">
            <thead>
              <tr><th>Company</th><th>Drives</th><th>Applications</th><th>Selected</th></tr>
            </thead>
            <tbody>
              <tr v-for="cs in data.company_stats" :key="cs.name">
                <td class="fw-semibold">{{ cs.name }}</td>
                <td>{{ cs.drives }}</td>
                <td>{{ cs.applications }}</td>
                <td><span class="badge-status badge-selected">{{ cs.selected }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>`,
  data() { return { data: {}, loading: true, pieChart: null, barChart: null }; },
  computed: {
    summaryStats() {
      return [
        { label: 'Total Applications', value: this.data.total_applications || 0, color: 'var(--ppa-secondary)' },
        { label: 'Shortlisted', value: this.data.total_shortlisted || 0, color: 'var(--ppa-accent)' },
        { label: 'Selected', value: this.data.total_selected || 0, color: 'var(--ppa-success)' },
        { label: 'Rejected', value: this.data.total_rejected || 0, color: 'var(--ppa-danger)' },
      ];
    }
  },
  methods: {
    renderCharts() {
      this.$nextTick(() => {
        // Pie chart — application status breakdown
        const pieCtx = document.getElementById('adminStatusPie');
        if (pieCtx) {
          if (this.pieChart) this.pieChart.destroy();
          const applied = (this.data.total_applications || 0) - (this.data.total_shortlisted || 0) - (this.data.total_selected || 0) - (this.data.total_rejected || 0) - (this.data.total_interview || 0);
          this.pieChart = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
              labels: ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'],
              datasets: [{
                data: [
                  Math.max(applied, 0),
                  this.data.total_shortlisted || 0,
                  this.data.total_interview || 0,
                  this.data.total_selected || 0,
                  this.data.total_rejected || 0,
                ],
                backgroundColor: ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 8,
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              cutout: '55%',
              plugins: {
                legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { family: 'Inter', size: 12 } } },
              },
            }
          });
        }
        // Bar chart — company-wise selections
        const barCtx = document.getElementById('adminCompanyBar');
        if (barCtx && this.data.company_stats && this.data.company_stats.length) {
          if (this.barChart) this.barChart.destroy();
          const labels = this.data.company_stats.map(c => c.name);
          const apps = this.data.company_stats.map(c => c.applications);
          const selected = this.data.company_stats.map(c => c.selected);
          this.barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
              labels,
              datasets: [
                { label: 'Applications', data: apps, backgroundColor: 'rgba(14,165,233,0.7)', borderRadius: 6, barPercentage: 0.6 },
                { label: 'Selected', data: selected, backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6, barPercentage: 0.6 },
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              scales: {
                x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.06)' }, ticks: { stepSize: 1, font: { family: 'Inter', size: 11 } } },
              },
              plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, font: { family: 'Inter', size: 12 } } },
              },
            }
          });
        }
      });
    },
  },
  async created() {
    try { this.data = await Api.get('/admin/reports'); } catch { }
    this.loading = false;
  },
  mounted() { if (!this.loading) this.renderCharts(); },
  updated() { if (!this.loading) this.renderCharts(); },
  beforeUnmount() {
    if (this.pieChart) this.pieChart.destroy();
    if (this.barChart) this.barChart.destroy();
  },
};
window.AdminReports = AdminReports;
