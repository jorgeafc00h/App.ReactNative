import customerReducer, { addCustomer, updateCustomer, deleteCustomer } from '../customerSlice';
import { seedCustomers } from '../../../data/fixtures';

describe('customerSlice', () => {
  it('should add a customer', () => {
    const initialState = { customers: [...seedCustomers], currentCustomer: null, selectedCustomerId: null, loading: false, error: null, searchTerm: '', filters: {}, lastUpdatedAt: undefined } as any;

    const action = addCustomer({
      firstName: 'Test',
      lastName: 'User',
      nationalId: '0000',
      documentType: 'OTHER' as any,
      email: 'test@example.com',
      phone: '123',
      customerType: 0,
      companyId: '1',
    });

    const next = customerReducer(initialState, action);
    expect(next.customers.length).toBe(initialState.customers.length + 1);
  });

  it('should update a customer', () => {
    const initialState = { customers: [...seedCustomers], currentCustomer: seedCustomers[0], selectedCustomerId: seedCustomers[0].id, loading: false, error: null, searchTerm: '', filters: {}, lastUpdatedAt: undefined } as any;

    const action = updateCustomer({ id: seedCustomers[0].id, firstName: 'Updated' } as any);
    const next = customerReducer(initialState, action);
    const updated = next.customers.find((c: any) => c.id === seedCustomers[0].id);
    expect(updated.firstName).toBe('Updated');
  });

  it('should delete a customer', () => {
    const initialState = { customers: [...seedCustomers], currentCustomer: seedCustomers[0], selectedCustomerId: seedCustomers[0].id, loading: false, error: null, searchTerm: '', filters: {}, lastUpdatedAt: undefined } as any;

    const action = deleteCustomer(seedCustomers[0].id);
    const next = customerReducer(initialState, action);
    expect(next.customers.find((c: any) => c.id === seedCustomers[0].id)).toBeUndefined();
  });
});
