import React from 'react';
import { List, PageHeader, Row, Screen } from '../components/ui';

export default function FinanceHubScreen({ navigation, route }) {
  const { propertyId } = route.params;
  return <Screen scroll edges={['left', 'right']}>
    <PageHeader title="Staff & Expenses" />
    <List>
    <Row icon="people-outline" title="Staff" subtitle="Cooks, helpers and cleaners" onPress={() => navigation.navigate('FinanceStaff', { propertyId })} />
    <Row icon="wallet-outline" title="Staff payments" subtitle="Salaries, daily wages and advances" onPress={() => navigation.navigate('FinanceStaff', { propertyId, paymentsMode: true })} />
    <Row icon="receipt-outline" title="Expenses" subtitle="Paid and unpaid operating costs" onPress={() => navigation.navigate('FinanceExpenses', { propertyId })} />
    <Row icon="calendar-outline" title="Monthly report" subtitle="Collections and spending" onPress={() => navigation.navigate('FinanceReport', { propertyId })} />
    </List>
  </Screen>;
}
