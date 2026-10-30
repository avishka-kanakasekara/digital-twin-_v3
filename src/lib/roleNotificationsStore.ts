export interface RoleNotification {
  id: string;
  type: 'role_architect_match' | 'team_assembly_invite' | 'marketplace_opening';
  roleTitle: string;
  department: string;
  source: string;
  employeeId?: string;
  employeeName: string;
  fitScore: number;
  matchedSkills: string[];
  skillGaps: string[];
  timestamp: string;
  status: 'unread' | 'read' | 'applied';
  description?: string;
  channels?: string[];
}

const STORAGE_KEY = 'culture_connect_role_notifications';

export const getStoredNotifications = (): RoleNotification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Default initial mock notifications for realistic demo
      return [
        {
          id: 'notif-default-1',
          type: 'role_architect_match',
          roleTitle: 'Senior AI Infrastructure Architect',
          department: 'Engineering & AI',
          source: 'Role Architect AI Engine',
          employeeName: 'Kasun Bandara',
          fitScore: 94,
          matchedSkills: ['Kubernetes', 'Python', 'Distributed Systems', 'Cloud Ops'],
          skillGaps: ['Vector Databases', 'GPU Cluster Optimization'],
          timestamp: 'Just now',
          status: 'unread',
          description: 'You have been identified as the #1 internal match for the newly architected AI Infrastructure Architect position.',
          channels: ['Internal Talent Marketplace', 'LinkedIn Public']
        }
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveNotification = (notification: RoleNotification): void => {
  try {
    const current = getStoredNotifications();
    const updated = [notification, ...current.filter(n => n.id !== notification.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('role_notifications_updated'));
  } catch (err) {
    console.error('Failed to save notification:', err);
  }
};

export const markNotificationApplied = (id: string): void => {
  try {
    const current = getStoredNotifications();
    const updated = current.map(n => n.id === id ? { ...n, status: 'applied' as const } : n);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('role_notifications_updated'));
  } catch (err) {
    console.error('Failed to update notification:', err);
  }
};
