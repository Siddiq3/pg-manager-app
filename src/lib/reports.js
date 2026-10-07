// Rent figures for the Rent tab, worked out from the property's bills (each carries its
// payments and its tenant). Months and days are in IST, the way the server dates bills.
const IST_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ist = (date) => new Date(new Date(date).getTime() + IST_MS).toISOString();
const sum = (items, value) => items.reduce((total, item) => total + value(item), 0);
const left = (bill) => Math.max(0, bill.amountDue - bill.amountPaid);

/** '2026-10' and '2026-10-07' for an instant, in IST. */
export const monthKey = (date) => ist(date).slice(0, 7);
export const dayKey = (date) => ist(date).slice(0, 10);

export function addMonths(month, n) {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1 + n, 1)).toISOString().slice(0, 7);
}

/** The due date in a month for a due day, clamped: due on the 31st means the 30th in November. */
function dueDay(month, day) {
  const [year, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return `${month}-${String(Math.min(day, last)).padStart(2, '0')}`;
}

/** Money received in a month: payments dated in it, whichever bill they paid. */
export function collectedIn(bills, month) {
  return sum(bills, (bill) => sum((bill.payments || []).filter((p) => monthKey(p.date) === month), (p) => p.amount));
}

/** A month's bills (a daily stay counts in its check-in month) with billed, still-pending and collected totals. */
export function monthSummary(bills, month) {
  const due = bills.filter((bill) => bill.month === month).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return { bills: due, billed: sum(due, (b) => b.amountDue), pending: sum(due, left), collected: collectedIn(bills, month) };
}

/** Unpaid bills whose due date has passed, oldest first. */
export function overdue(bills, today) {
  return bills.filter((bill) => left(bill) > 0 && dayKey(bill.dueDate) < today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/**
 * What falls due from today through the next `days` days. Open bills come as they are; a
 * monthly tenant's next bill is only created when its month starts, so it is worked out
 * from their due day and rent (`projected`). Daily guests have one bill, so nothing to add.
 */
export function upcoming(bills, today, days = 30) {
  const until = dayKey(Date.parse(today) + days * DAY_MS);
  const items = bills
    .filter((bill) => left(bill) > 0 && dayKey(bill.dueDate) >= today && dayKey(bill.dueDate) <= until)
    .map((bill) => ({ key: bill._id, bill, tenant: bill.tenantId, date: dayKey(bill.dueDate), amount: left(bill) }));

  const billed = new Set(bills.map((bill) => `${bill.tenantId?._id}#${bill.month}`));
  const tenants = new Map(bills.filter((bill) => bill.tenantId?._id).map((bill) => [bill.tenantId._id, bill.tenantId]));
  const thisMonth = today.slice(0, 7);
  for (const tenant of tenants.values()) {
    if (tenant.status !== 'ACTIVE' || tenant.stayType === 'DAILY' || !tenant.rentDueDay) continue;
    for (const month of [thisMonth, addMonths(thisMonth, 1), addMonths(thisMonth, 2)]) {
      // Someone leaving in November still owes November, but nothing after it.
      if (billed.has(`${tenant._id}#${month}`) || (tenant.expectedVacateDate && monthKey(tenant.expectedVacateDate) < month)) continue;
      const date = dueDay(month, tenant.rentDueDay);
      if (date >= today && date <= until) items.push({ key: `${tenant._id}#${month}`, tenant, date, amount: tenant.rentAmount, projected: true });
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

/** Billed and collected for each of the last `months` months (oldest first), with totals. */
export function history(bills, thisMonth, months) {
  const rows = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const month = addMonths(thisMonth, -i);
    const { billed, collected } = monthSummary(bills, month);
    rows.push({ month, billed, collected });
  }
  return { rows, billed: sum(rows, (r) => r.billed), collected: sum(rows, (r) => r.collected) };
}
