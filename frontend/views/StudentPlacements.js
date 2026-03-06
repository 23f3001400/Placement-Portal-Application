// views/StudentPlacements.js
const StudentPlacements = {
  template: `
  <div class="container py-4 fade-in">
    <div class="page-header">
      <h3><i class="bi bi-trophy me-2"></i>Placement History</h3>
      <p class="text-muted mb-0">Your successful placements</p>
    </div>
    <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
    <div v-else-if="placements.length === 0" class="text-center py-5">
      <i class="bi bi-trophy fs-1 d-block mb-3" style="color:var(--ppa-border);"></i>
      <p class="text-muted">No placements yet. Keep applying!</p>
    </div>
    <template v-else>
      <!-- Status overview chart -->
      <div class="row g-4 mb-4">
        <div class="col-md-5">
          <div class="ppa-card p-4 h-100">
            <h5 class="mb-3"><i class="bi bi-pie-chart me-2" style="color:var(--ppa-accent);"></i>Application Status Overview</h5>
            <div style="position:relative;max-height:280px;display:flex;justify-content:center;">
              <canvas id="studentStatusPie"></canvas>
            </div>
          </div>
        </div>
        <div class="col-md-7">
          <div class="ppa-card p-4 h-100">
            <h5 class="mb-3"><i class="bi bi-bar-chart-fill me-2" style="color:var(--ppa-secondary);"></i>Package Comparison (LPA)</h5>
            <div style="position:relative;max-height:280px;">
              <canvas id="studentPackageBar"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Placement cards -->
      <div class="row g-3">
        <div class="col-md-6" v-for="p in placements" :key="p.id">
          <div class="ppa-card p-4 h-100" :style="'border-left:4px solid ' + statusColor(p.status)">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="mb-0">{{ p.drive_title }}</h5>
              <span :class="'badge-status badge-'+p.status">{{ p.status }}</span>
            </div>
            <p class="mb-1" style="color:var(--ppa-secondary);"><i class="bi bi-building me-1"></i>{{ p.company_name }}</p>
            <p class="mb-1 text-muted small"><i class="bi bi-briefcase me-1"></i>{{ p.role_offered }}</p>
            <p class="mb-1 text-muted small"><i class="bi bi-geo-alt me-1"></i>{{ p.location || 'Remote' }}</p>
            <p class="mt-2 mb-0 fw-bold" style="font-size:1.2rem;" :style="'color:' + statusColor(p.status)">{{ p.package_lpa ? p.package_lpa + ' LPA' : '' }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>`,
  data() { return { placements: [], loading: true, pieChart: null, barChart: null }; },
  methods: {
    statusColor(s) {
      const map = { selected: 'var(--ppa-success)', rejected: '#e74c3c', applied: 'var(--ppa-accent)', shortlisted: 'var(--ppa-secondary)', interview: '#f39c12' };
      return map[s] || 'var(--ppa-border)';
    },
    renderCharts() {
      this.$nextTick(() => {
        // Pie chart — status distribution
        const pieCtx = document.getElementById('studentStatusPie');
        if (pieCtx && this.placements.length) {
          if (this.pieChart) this.pieChart.destroy();
          const counts = { applied: 0, shortlisted: 0, interview: 0, selected: 0, rejected: 0 };
          this.placements.forEach(p => { if (counts.hasOwnProperty(p.status)) counts[p.status]++; });
          this.pieChart = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
              labels: ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'],
              datasets: [{
                data: [counts.applied, counts.shortlisted, counts.interview, counts.selected, counts.rejected],
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
        // Bar chart — package comparison for each application
        const barCtx = document.getElementById('studentPackageBar');
        const withPkg = this.placements.filter(p => p.package_lpa > 0);
        if (barCtx && withPkg.length) {
          if (this.barChart) this.barChart.destroy();
          const labels = withPkg.map(p => p.company_name.length > 15 ? p.company_name.substring(0, 15) + '…' : p.company_name);
          const colors = withPkg.map(p => {
            const c = { selected: 'rgba(16,185,129,0.7)', rejected: 'rgba(239,68,68,0.6)', shortlisted: 'rgba(139,92,246,0.7)', interview: 'rgba(245,158,11,0.7)', applied: 'rgba(14,165,233,0.7)' };
            return c[p.status] || 'rgba(148,163,184,0.5)';
          });
          this.barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
              labels,
              datasets: [{
                label: 'Package (LPA)',
                data: withPkg.map(p => p.package_lpa),
                backgroundColor: colors,
                borderRadius: 6,
                barPercentage: 0.6,
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: true,
              scales: {
                x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.06)' }, ticks: { font: { family: 'Inter', size: 11 } } },
              },
              plugins: {
                legend: { display: false },
              },
            }
          });
        }
      });
    },
  },
  async created() {
    try { this.placements = await Api.get('/student/placements'); } catch { }
    this.loading = false;
  },
  mounted() { if (!this.loading) this.renderCharts(); },
  updated() { if (!this.loading) this.renderCharts(); },
  beforeUnmount() {
    if (this.pieChart) this.pieChart.destroy();
    if (this.barChart) this.barChart.destroy();
  },
};
window.StudentPlacements = StudentPlacements;
