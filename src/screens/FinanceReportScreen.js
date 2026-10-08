import React, { useState } from 'react';
import { RefreshControl, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card, PageHeader, QueryState, Screen, SectionTitle, theme, typography } from '../components/ui';
import { FinanceLine, MonthPicker } from '../components/FinanceControls';
import { useAuth } from '../context/AuthContext';
import { EXPENSE_CATEGORIES, currentFinanceMonth, moneyPaise } from '../lib/finance';

export default function FinanceReportScreen({ route }) {
  const { api } = useAuth();
  const { propertyId } = route.params;
  const [month, setMonth] = useState(currentFinanceMonth());
  const query = useQuery({ queryKey: ['financeReport', propertyId, month], queryFn: async () => (await api.get('/finance/reports/monthly', { params: { propertyId, month } })).data.data });
  const r = query.data;
  return <Screen scroll edges={['left', 'right']} refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />}>
    <PageHeader title="Monthly report" subtitle="Actual collections and recorded cash spending." />
    <MonthPicker month={month} onChange={setMonth} />
    <QueryState query={query}>
      {r && <>
        <Card>
          <FinanceLine label="Rent collected" value={moneyPaise(r.rentCollectedPaise)} />
          <FinanceLine label="Paid to staff" value={moneyPaise(r.staffPaidPaise)} />
          <FinanceLine label="Food & groceries" value={moneyPaise(r.foodPaidPaise)} />
          <FinanceLine label="Other paid expenses" value={moneyPaise(r.otherExpensesPaidPaise)} />
          <FinanceLine label="Remaining" value={moneyPaise(r.remainingPaise)} strong />
        </Card>
        <SectionTitle>Pending for this month</SectionTitle>
        <Card>
          <FinanceLine label="Staff" value={moneyPaise(r.pendingStaffPaise)} />
          <FinanceLine label="Unpaid expenses" value={moneyPaise(r.unpaidExpensesPaise)} />
        </Card>
        <Text style={{ ...typography.caption, color: theme.textMuted }}>Staff pending covers {r.recordedStaffPeriods} recorded salary periods. Pending amounts and tenant deposits are excluded from remaining.</Text>
        <SectionTitle>Paid expenses by category</SectionTitle>
        <Card>{EXPENSE_CATEGORIES.map(c => <FinanceLine key={c.value} label={c.label} value={moneyPaise(r.categories[c.value])} />)}</Card>
      </>}
    </QueryState>
  </Screen>;
}
