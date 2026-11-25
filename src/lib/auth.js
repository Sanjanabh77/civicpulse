// UX-only helper. The SERVER is what really enforces roles.
// Replace with Person 1/3's auth context if the project already has one.
export function getCurrentUser() {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return { id: 'mock-user', role: localStorage.getItem('mockRole') || 'admin' }; // set 'mockRole' to citizen/officer/admin to test
  }
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return { id: payload.sub || payload.id, role: payload.role, department: payload.department };
  } catch { return null; }
}
