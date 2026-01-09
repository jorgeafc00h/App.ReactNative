import { Company } from '../types/company';

/**
 * Compute whether API calls should use production.
 *
 * Rules:
 * - Production only when company.environment === 'PRODUCTION'
 * - Test accounts must NEVER route to production
 * - If isTestAccount is missing, default safely to non-production
 */
export const isProductionCompany = (
  company?: Pick<Company, 'environment' | 'isTestAccount'> | null
): boolean => {
  return company?.environment === 'PRODUCTION' && company?.isTestAccount !== true;
};
