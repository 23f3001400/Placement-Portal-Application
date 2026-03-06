// views/CompanyReports.js
const CompanyReports = {
    template: `
  <div class="container py-4 fade-in">
    <div class="page-header">
      <h3><i class="bi bi-bar-chart me-2"></i>Recruitment Reports</h3>
      <p class="text-muted mb-0">Your recruitment statistics and analytics</p>
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

      <!-- Charts row -->
      <div class="row g-4 mb-4">
        <div class="col-md-5">
          <div class="ppa-card p-4 h-100">
            <h5 class="mb-3"><i class="bi bi-pie-chart me-2" style="color:var(--ppa-accent);"></i>Application Status</h5>
            <div v-if="hasApplications" style="position:relative;max-height:320px;display:flex;justify-content:center;">
              <canvas id="companyStatusPie"></canvas>
            </div>
            <p v-else class="text-muted mb-0 text-center py-4">No applications yet.</p>
          </div>
        </div>
        <div class="col-md-7">
          <div class="ppa-card p-4 h-100">
            <h5 class="mb-3"><i class="bi bi-bar-chart-fill me-2" style="color:var(--ppa-secondary);"></i>Applications per Drive</h5>
            <div v-if="data.drive_stats && data.drive_stats.length" style="position:relative;max-height:320px;">
              <canvas id="companyDriveBar"></canvas>
            </div>
            <p v-else class="text-muted mb-0 text-center py-4">No drives yet.</p>
          </div>
        </div>
      </div>

      <!-- Drive-wise table -->
      <div class="ppa-card p-4">
        <h5 class="mb-3">Drive-wise Breakdown</h5>
        <div v-if="!data.drive_stats || data.drive_stats.length === 0" class="text-muted">No data yet.</div>
        <div v-else class="table-responsive">
          <table class="table table-ppa mb-0">
            <thead>
              <tr><th>Drive</th><th>Applications</th><th>Shortlisted</th><th>Interview</th><th>Selected</th><th>Rejected</th></tr>
            </thead>
            <tbody>
              <tr v-for="ds in data.drive_stats" :key="ds.title">
                <td class="fw-semibold">{{ ds.title }}</td>
                <td>{{ ds.applications }}</td>
                <td><span class="badge-status badge-shortlisted">{{ ds.shortlisted }}</span></td>
                <td><span class="badge-status badge-interview">{{ ds.interview }}</span></td>
                <td><span class="badge-status badge-selected">{{ ds.selected }}</span></td>
                <td><span class="badge-status badge-rejected">{{ ds.rejected }}</span></td>
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
                { label: 'Total Drives', value: this.data.total_drives || 0, color: 'var(--ppa-primary)' },
                { label: 'Applications', value: this.data.total_applications || 0, color: 'var(--ppa-secondary)' },
                { label: 'Selected', value: this.data.total_selected || 0, color: 'var(--ppa-success)' },
                { label: 'Rejected', value: this.data.total_rejected || 0, color: 'var(--ppa-danger)' },
            ];
        },
        hasApplications() {
            return (this.data.total_applications || 0) > 0;
        },
    },
    methods: {
        renderCharts() {
            this.$nextTick(() => {
                // Pie chart — status breakdown
                const pieCtx = document.getElementById('companyStatusPie');
                if (pieCtx && this.hasApplications) {
                    if (this.pieChart) this.pieChart.destroy();
                    const applied = (this.data.total_applications || 0) - (this.data.total_shortlisted || 0) - (this.data.total_selected || 0) - (this.data.total_rejected || 0) - (this.data.total_interview || 0);
                    this.pieChart = new Chart(pieCtx, {
                        type: 'doughnut',
                        data: {
                            labels: ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'],
                            datasets: [{
                                data: [Math.max(applied, 0), this.data.total_shortlisted || 0, this.data.total_interview || 0, this.data.total_selected || 0, this.data.total_rejected || 0],
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
                // Bar chart — per-drive applications
                const barCtx = document.getElementById('companyDriveBar');
                if (barCtx && this.data.drive_stats && this.data.drive_stats.length) {
                    if (this.barChart) this.barChart.destroy();
                    const labels = this.data.drive_stats.map(d => d.title.length > 20 ? d.title.substring(0, 20) + '…' : d.title);
                    this.barChart = new Chart(barCtx, {
                        type: 'bar',
                        data: {
                            labels,
                            datasets: [
                                { label: 'Applications', data: this.data.drive_stats.map(d => d.applications), backgroundColor: 'rgba(14,165,233,0.7)', borderRadius: 6, barPercentage: 0.5 },
                                { label: 'Selected', data: this.data.drive_stats.map(d => d.selected), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6, barPercentage: 0.5 },
                                { label: 'Rejected', data: this.data.drive_stats.map(d => d.rejected), backgroundColor: 'rgba(239,68,68,0.6)', borderRadius: 6, barPercentage: 0.5 },
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
        try { this.data = await Api.get('/company/reports'); } catch { }
        this.loading = false;
    },
    mounted() { if (!this.loading) this.renderCharts(); },
    updated() { if (!this.loading) this.renderCharts(); },
    beforeUnmount() {
        if (this.pieChart) this.pieChart.destroy();
        if (this.barChart) this.barChart.destroy();
    },
};
window.CompanyReports = CompanyReports;
