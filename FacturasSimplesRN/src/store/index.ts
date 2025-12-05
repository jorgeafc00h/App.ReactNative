// Redux store configuration

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

// Persistence
import { rootReducer, createPersistor } from './persistence';

// Middleware
import { networkMiddleware } from './middleware/networkMiddleware';
import { syncMiddleware } from './middleware/syncMiddleware';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: [
          FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['app.notifications'],
      },
      immutableCheck: {
        warnAfter: 128,
      },
    })
    .concat(networkMiddleware)
    .concat(syncMiddleware),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for React components
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Selectors
export * from './selectors/authSelectors';
export * from './selectors/companySelectors';
export * from './selectors/invoiceSelectors';
export * from './selectors/customerSelectors';
export * from './selectors/productSelectors';
export * from './selectors/catalogSelectors';
export * from './selectors/appSelectors';

export default store;