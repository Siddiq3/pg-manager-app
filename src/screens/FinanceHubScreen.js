import React from 'react';
import { PageHeader, Row, Screen } from '../components/ui';

export default function FinanceHubScreen({ navigation, route }) {
  const { propertyId } = route.params;
  return <Screen scroll edges={['left', 'right']}>
    <PageHeader title="Staff & Expenses" subtitle="Staff payments and day-to-day property costs." />
    <Row icon="people-outline" title="Staff" subtitle="Cooks, helpers, cleaners and other staff" onPress={() => navigation.navigate('FinanceStaff', { propertyId })} />
    <Row icon="wallet-outline" title="Staff payments" subtitle="Salaries, daily wages and advances" onPress={() => navigation.navigate('FinanceStaff', { propertyId, paymentsMode: true })} />
    <Row icon="receipt-outline" title="Expenses" subtitle="Paid and unpaid operating costs" onPress={() => navigation.navigate('FinanceExpenses', { propertyId })} />
    <Row icon="calendar-outline" title="Monthly report" subtitle="Collections, spending and pending amounts" onPress={() => navigation.navigate('FinanceReport', { propertyId })} />
  </Screen>;
}
