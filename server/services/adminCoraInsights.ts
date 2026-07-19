import { storage } from '../storage';

export type AdminCoriInsight = {
  key: string;
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
  suggestion?: string;
};

function daysBetween(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export async function gatherAdminCoriInsights(): Promise<AdminCoriInsight[]> {
  const now = new Date();
  const [orders, clients, boardTasks, notifications] = await Promise.all([
    storage.getAllWorkshopOrders().catch(() => []),
    storage.getAllClients().catch(() => []),
    storage.getAllBoardTasks().catch(() => []),
    storage.getNotificationsByUser('9ef6c8fc-0021-4766-a6c2-7580a8a3cdc5').catch(() => []),
  ]);

  const insights: AdminCoriInsight[] = [];

  const staleOrders = orders.filter((order: any) => {
    if (!order.createdAt) return false;
    const age = daysBetween(now, new Date(order.createdAt));
    const activeStatus = ['new', 'lead', 'pending', 'open', 'in_progress'].includes(String(order.status || '').toLowerCase());
    return activeStatus && age >= 7;
  });
  if (staleOrders.length) {
    insights.push({
      key: 'stale_orders',
      title: 'Aufträge fără progres recent',
      detail: `${staleOrders.length} Aufträge sunt încă active după cel puțin 7 zile și pot ascunde follow-up-uri pierdute sau blocaje operaționale.`,
      severity: staleOrders.length >= 5 ? 'critical' : 'warning',
      suggestion: 'Merită o revizuire a follow-up-urilor și a statusurilor neactualizate.',
    });
  }

  const ordersWithoutPhone = orders.filter((order: any) => !String(order.customerPhone || '').trim());
  if (ordersWithoutPhone.length) {
    insights.push({
      key: 'orders_missing_phone',
      title: 'Date de contact incomplete',
      detail: `${ordersWithoutPhone.length} Aufträge nu au număr de telefon salvat, ceea ce crește fricțiunea la follow-up și programare.`,
      severity: 'warning',
      suggestion: 'Ar fi util un pas automat de completare/validare a contactului la intake.',
    });
  }

  const unassignedTasks = boardTasks.filter((task: any) => !task.assignedToId && !task.assigneeId);
  if (unassignedTasks.length) {
    insights.push({
      key: 'unassigned_tasks',
      title: 'Taskuri fără responsabil clar',
      detail: `${unassignedTasks.length} taskuri sunt neasignate în board și pot deveni muncă uitată.`,
      severity: unassignedTasks.length >= 5 ? 'warning' : 'info',
      suggestion: 'Cori poate propune asignare sau consolidare pentru taskurile fără owner.',
    });
  }

  const unreadNotifications = notifications.filter((n: any) => !n.isRead);
  if (unreadNotifications.length >= 10) {
    insights.push({
      key: 'notification_overload',
      title: 'Supraîncărcare de notificări',
      detail: `Există ${unreadNotifications.length} notificări necitite pentru admin. Asta poate ascunde semnale importante într-un flux prea zgomotos.`,
      severity: 'warning',
      suggestion: 'Merită triere automată și agregare pe tipuri sau pe urgență.',
    });
  }

  const clientsWithoutRecentContext = clients.filter((client: any) => {
    const status = String(client.status || '').toLowerCase();
    return ['lead', 'active'].includes(status) && !String(client.notes || '').trim() && !String(client.company || '').trim();
  });
  if (clientsWithoutRecentContext.length) {
    insights.push({
      key: 'thin_client_context',
      title: 'CRM cu context prea subțire',
      detail: `${clientsWithoutRecentContext.length} clienți activi/lead au foarte puțin context salvat, ceea ce slăbește memoria pe termen lung și continuitatea.`,
      severity: 'info',
      suggestion: 'Un sumar CRM automat după fiecare interacțiune ar crește mult utilitatea sistemului.',
    });
  }

  if (!insights.length) {
    insights.push({
      key: 'no_major_flags',
      title: 'Nicio fricțiune majoră detectată imediat',
      detail: 'Nu am găsit un semnal mare și evident în setul minim de date verificat acum, dar putem analiza mai adânc pe intake, follow-up, calendar și profitabilitate.',
      severity: 'info',
      suggestion: 'Spune-mi ce zonă vrei să auditez și merg mai adânc.',
    });
  }

  return insights.slice(0, 6);
}
