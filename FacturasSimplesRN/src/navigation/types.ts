export type TabNavigatorParamList = {
  Home: undefined;
  Invoices: undefined;
  Customers: undefined;
  Products: undefined;
  Settings: undefined;
};

export type CustomersStackParamList = {
  CustomersList: undefined;
  CustomerDetail: { customerId: string };
  CustomerForm: { mode: 'create' | 'edit'; customerId?: string };
};

export type InvoicesStackParamList = {
  InvoicesList: undefined;
  InvoiceDetail: { invoiceId: string };
  InvoiceForm: { mode: 'create' | 'edit'; invoiceId?: string };
  AddInvoice: undefined;
  EditInvoice: { invoiceId: string };
};

export type ProductsStackParamList = {
  ProductsList: undefined;
  ProductDetail: { productId: string };
  AddProduct: undefined;
  EditProduct: { productId: string };
};
