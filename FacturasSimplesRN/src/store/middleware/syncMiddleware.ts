// Sync middleware for handling data synchronization

import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { setSyncStatus, addNotification } from '../slices/appSlice';

export const syncMiddleware: Middleware = (store) => (next) => (action) => {
  const typedAction = action as AnyAction;
  // Handle sync-related actions
  const result = next(typedAction);

  // Monitor actions that might require sync
  const syncTriggerActions = [
    'invoices/createInvoice/fulfilled',
    'invoices/updateInvoice/fulfilled',
    'customers/createCustomer/fulfilled',
    'customers/updateCustomer/fulfilled',
    'products/createProduct/fulfilled',
    'products/updateProduct/fulfilled',
    'companies/createCompany/fulfilled',
    'companies/updateCompany/fulfilled',
  ];

  if (syncTriggerActions.includes(typedAction.type)) {
    const state = store.getState();
    
    // Only trigger sync if online
    if (state.app.isOnline) {
      // TODO: Implement actual sync logic
      console.log(`Sync triggered by: ${typedAction.type}`);
      
      // For now, just update sync status
      store.dispatch(setSyncStatus('syncing'));
      
      // Simulate sync completion
      setTimeout(() => {
        store.dispatch(setSyncStatus('success'));
      }, 1000);
    } else {
      // Add to pending sync queue when offline
      console.log(`Action ${typedAction.type} added to pending sync queue`);
      
      store.dispatch(addNotification({
        title: 'Offline Changes',
        message: 'Changes will be synced when connection is restored',
        type: 'info',
        read: false,
      }));
    }
  }

  return result;
};