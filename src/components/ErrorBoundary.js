import React from 'react';
import { Text, View } from 'react-native';
import { Button, theme, typography } from './ui';

export default class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error, info) { console.error('PG Manager UI error', error, info); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: theme.bg }}>
      <Text style={{ ...typography.h2, color: theme.text, textAlign: 'center' }}>Something went wrong</Text>
      <Text style={{ ...typography.body, color: theme.muted, textAlign: 'center' }}>The app hit an unexpected problem. Your data is safe. Try opening this screen again.</Text>
      <Button onPress={() => this.setState({ failed: false })}>Try again</Button>
    </View>;
  }
}