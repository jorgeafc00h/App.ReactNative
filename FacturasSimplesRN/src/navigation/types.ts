export type CustomersStackParamList = {
  CustomersList: undefined;
  CustomerDetail: { customerId: string };
  CustomerForm: { mode: 'create' | 'edit'; customerId?: string };
};

export type InvoicesStackParamList = {
  InvoicesList: undefined;
  InvoiceDetail: { invoiceId: string };
  InvoiceForm: { mode: 'create' | 'edit'; invoiceId?: string };
};
