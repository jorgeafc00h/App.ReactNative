import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store, persistor } from './src/store';
import { StatusBar } from 'expo-status-bar';
import { BaseScreen } from './src/components/common/BaseScreen';
import { LoadingSpinner } from './src/components/common/LoadingSpinner';
import { MainApp } from './src/components/MainApp';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={<LoadingSpinner text="Loading..." />} persistor={persistor}>
          <MainApp />
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
