// router.js — Vue Router with role-based navigation guards
const { createRouter, createWebHashHistory } = VueRouter;

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView, meta: { guest: true } },
    { path: '/register', component: RegisterView, meta: { guest: true } },

    // Admin
    { path: '/admin/dashboard', component: AdminDashboard, meta: { role: 'admin' } },
    { path: '/admin/companies', component: AdminCompanies, meta: { role: 'admin' } },
    { path: '/admin/students', component: AdminStudents, meta: { role: 'admin' } },
    { path: '/admin/drives', component: AdminDrives, meta: { role: 'admin' } },
    { path: '/admin/reports', component: AdminReports, meta: { role: 'admin' } },

    // Company
    { path: '/company/dashboard', component: CompanyDashboard, meta: { role: 'company' } },
    { path: '/company/drives', component: CompanyDrives, meta: { role: 'company' } },
    { path: '/company/drives/:id/applicants', component: CompanyApplicants, meta: { role: 'company' } },
    { path: '/company/interviews', component: CompanyInterviews, meta: { role: 'company' } },
    { path: '/company/reports', component: CompanyReports, meta: { role: 'company' } },

    // Student
    { path: '/student/dashboard', component: StudentDashboard, meta: { role: 'student' } },
    { path: '/student/drives', component: StudentDrives, meta: { role: 'student' } },
    { path: '/student/applications', component: StudentApplications, meta: { role: 'student' } },
    { path: '/student/profile', component: StudentProfile, meta: { role: 'student' } },
    { path: '/student/placements', component: StudentPlacements, meta: { role: 'student' } },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

// Navigation guard
router.beforeEach((to, from, next) => {
    const isLoggedIn = Api.isLoggedIn();
    const userRole = Api.getRole();

    // Guest-only pages (login, register)
    if (to.meta.guest) {
        if (isLoggedIn) {
            const dest = { admin: '/admin/dashboard', company: '/company/dashboard', student: '/student/dashboard' };
            return next(dest[userRole] || '/login');
        }
        return next();
    }

    // Protected pages
    if (!isLoggedIn) {
        return next('/login');
    }

    // Role check (skipped in DEMO_MODE)
    if (to.meta.role && to.meta.role !== userRole) {
        const dest = { admin: '/admin/dashboard', company: '/company/dashboard', student: '/student/dashboard' };
        return next(dest[userRole] || '/login');
    }

    next();
});

window.router = router;
