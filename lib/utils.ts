export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getToday(): string {
  return formatDate(new Date());
}

export function getYesterday(): string {
  return formatDate(new Date(Date.now() - 86400000));
}
