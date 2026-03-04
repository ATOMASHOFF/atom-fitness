export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

export const getDaysRemaining = (endDate) => {
  if (!endDate) return -1;
  const today = new Date();
  const end = new Date(endDate);
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
};

export const getSubscriptionStatus = (subscription) => {
  if (!subscription) return { label: 'No Plan', class: 'badge-expired' };
  const days = getDaysRemaining(subscription.end_date);
  if (subscription.status === 'cancelled') return { label: 'Cancelled', class: 'badge-expired' };
  if (days < 0 || subscription.status === 'expired') return { label: 'Expired', class: 'badge-expired' };
  if (days === 0) return { label: 'Expires Today', class: 'badge-pending' };
  if (days <= 7) return { label: `${days}d left`, class: 'badge-pending' };
  return { label: 'Active', class: 'badge-active' };
};

export const getDaysPillClass = (days) => {
  if (days < 0) return 'expired';
  if (days <= 7) return 'warn';
  return 'ok';
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const isExpired = (endDate) => {
  if (!endDate) return true;
  return new Date(endDate) < new Date();
};
