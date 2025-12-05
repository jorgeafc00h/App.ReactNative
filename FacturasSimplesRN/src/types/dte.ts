// DTE (Electronic Tax Document) types matching Swift implementation

// Base DTE structure
export interface DTE_Base {
  identificacion: DTEIdentification;
  documentoRelacionado?: RelatedDocument[];
  emisor: DTEEmisor;
  receptor?: DTEReceptor;
  otrosDocumentos?: OtherDocument[];
  ventaTercero?: ThirdPartySale;
  cuerpoDocumento: DTEBody[];
  resumen: DTESummary;
  extension?: DTEExtension;
  apendice?: DTEAppendix[];
}

// DTE Identification
export interface DTEIdentification {
  version: number;
  ambiente: string; // Environment: 00 = Production, 01 = Test
  tipoDte: string; // Document type code
  numeroControl: string;
  codigoGeneracion: string;
  tipoModelo: number;
  tipoOperacion: number;
  tipoContingencia?: number;
  motivoContin?: string;
  fecEmi: string; // Format: YYYY-MM-DD
  horEmi: string; // Format: HH:mm:ss
  tipoMoneda: string; // Currency code
}

// Related Document (for credit/debit notes)
export interface RelatedDocument {
  tipoDocumento: string;
  tipoGeneracion: number;
  numeroDocumento: string;
  fechaEmision: string;
}

// Issuer (Company)
export interface DTEEmisor {
  nit: string;
  nrc: string;
  nombre: string;
  codActividad: string;
  descActividad: string;
  nombreComercial?: string;
  tipoEstablecimiento: string;
  direccion: DTEAddress;
  telefono: string;
  correo: string;
  codEstableMH?: string;
  codEstable?: string;
  codPuntoVentaMH?: string;
  codPuntoVenta?: string;
}

// Receiver (Customer)
export interface DTEReceptor {
  tipoDocumento?: string;
  numDocumento?: string;
  nrc?: string;
  nombre: string;
  codActividad?: string;
  descActividad?: string;
  nombreComercial?: string;
  direccion?: DTEAddress;
  telefono?: string;
  correo?: string;
}

// Address structure
export interface DTEAddress {
  departamento: string;
  municipio: string;
  complemento: string;
}

// Other documents
export interface OtherDocument {
  codDocAsociado: number;
  descDocumento?: string;
  detalleDocumento?: string;
  medico?: DTEMedico;
}

// Medical professional (for specific document types)
export interface DTEMedico {
  nombre: string;
  nit?: string;
  docIdentificacion?: string;
  tipoServicio?: number;
}

// Third party sales
export interface ThirdPartySale {
  nit: string;
  nombre: string;
}

// DTE Body (Line items)
export interface DTEBody {
  numItem: number;
  tipoItem: number;
  numeroDocumento?: string;
  cantidad: number;
  codigo?: string;
  codTributo?: string;
  uniMedida: number;
  descripcion: string;
  precioUni: number;
  montoDescu: number;
  ventaNoSuj: number;
  ventaExenta: number;
  ventaGravada: number;
  tributos?: DTETribute[];
  psv?: number;
  noGravado?: number;
  ivaItem?: number;
}

// Tribute information
export interface DTETribute {
  codigo: string;
  descripcion: string;
  valor: number;
}

// DTE Summary
export interface DTESummary {
  totalNoSuj: number;
  totalExenta: number;
  totalGravada: number;
  subTotalVentas: number;
  descuNoSuj: number;
  descuExenta: number;
  descuGravada: number;
  porcentajeDescuento: number;
  totalDescu: number;
  tributos?: DTETribute[];
  subTotal: number;
  ivaRete1?: number;
  reteRenta?: number;
  montoTotalOperacion: number;
  totalNoGravado: number;
  totalPagar: number;
  totalLetras: string;
  saldoFavor?: number;
  condicionOperacion: number;
  pagos?: DTEPayment[];
  numPagoElectronico?: string;
}

// Payment information
export interface DTEPayment {
  codigo: string;
  montoPago: number;
  referencia?: string;
  plazo?: string;
  periodo?: number;
}

// DTE Extension
export interface DTEExtension {
  nombEntrega?: string;
  docuEntrega?: string;
  nombRecibe?: string;
  docuRecibe?: string;
  observaciones?: string;
  placaVehiculo?: string;
}

// DTE Appendix
export interface DTEAppendix {
  campo: string;
  etiqueta: string;
  valor: string;
}

// API Response wrapper
export interface DTEResponseWrapper {
  version: number;
  ambiente: string;
  versionApp: number;
  estado: string;
  codigoGeneracion: string;
  selloRecibido: string;
  fhProcesamiento: string;
  clasificaMsg: string;
  codigoMsg: string;
  descripcionMsg: string;
  observaciones?: string[];
}

// Error response wrapper
export interface DTEErrorResponseWrapper {
  estado: string;
  codigoGeneracion?: string;
  descripcionMsg: string;
  observaciones: string[];
}

// DTE Invalidation Request
export interface DTE_InvalidationRequest {
  identificacion: {
    version: number;
    ambiente: string;
    codigoGeneracion: string;
    fecAnula: string; // Format: YYYY-MM-DD
    horAnula: string; // Format: HH:mm:ss
  };
  emisor: {
    nit: string;
    nombre: string;
    tipoEstablecimiento: string;
    nomEstablecimiento?: string;
    codEstableMH?: string;
    codEstable?: string;
    codPuntoVentaMH?: string;
    codPuntoVenta?: string;
  };
  documento: {
    tipoDte: string;
    codigoGeneracion: string;
    selloRecibido: string;
    numeroControl: string;
    fecEmi: string;
    montoIva: number;
    codigoGeneracionR: string;
    tipoDocumento: string;
    motivoInvalidacion: string;
    nombreResponsable: string;
    tipDocResponsable: string;
    numDocResponsable: string;
    nombreSolicita: string;
    tipDocSolicita: string;
    numDocSolicita: string;
  };
}

// Service credentials for API calls
export interface ServiceCredentials {
  user: string;
  credential: string;
  key: string;
  invoiceNumber: string;
}

// Contingency request
export interface ContingenciaRequest {
  identificacion: {
    version: number;
    ambiente: string;
    codigoGeneracion: string;
    fTransmision: string;
    hTransmision: string;
  };
  emisor: {
    nit: string;
    nombre: string;
    nombreResponsable: string;
    tipoDocResponsable: string;
    numeroDocResponsable: string;
    tipoEstablecimiento: string;
    codEstableMH?: string;
    codEstable?: string;
    codPuntoVentaMH?: string;
    codPuntoVenta?: string;
    telefono: string;
    correo: string;
  };
  detalleDTE: ContingencyDetail[];
}

export interface ContingencyDetail {
  codigoGeneracion: string;
  tipodte: string;
  fechaEmi: string;
  montoImpuesto: number;
  numeroControl: string;
  tipoContingencia: number;
  motivoContingencia: string;
}

// DTE validation types
export interface DTEValidationErrors {
  identificacion?: string[];
  emisor?: string[];
  receptor?: string[];
  cuerpoDocumento?: string[];
  resumen?: string[];
  general?: string[];
}

export interface DTEValidationResult {
  isValid: boolean;
  errors: DTEValidationErrors;
  warnings: string[];
}

// DTE state for Redux
export interface DTEState {
  currentDTE: DTE_Base | null;
  lastResponse: DTEResponseWrapper | null;
  validationResult: DTEValidationResult | null;
  submitting: boolean;
  error: string | null;
}

// DTE generation input
export interface DTEGenerationInput {
  companyId: string;
  invoiceId: string;
  environment: 'PRODUCTION' | 'TEST';
  documentType: string;
  credentials: ServiceCredentials;
}

// DTE PDF upload
export interface DTEPDFUpload {
  pdfData: string; // Base64 encoded
  controlNumber: string;
  companyNit: string;
  environment: 'PRODUCTION' | 'TEST';
}