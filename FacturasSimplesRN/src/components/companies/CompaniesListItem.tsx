import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Company, CompanyEnvironment } from '../../types/company';
import { useTheme } from '../../hooks/useTheme';

interface CompaniesListItemProps {
  company: Company;
  isSelected: boolean;
  onPress: () => void;
}

export const CompaniesListItem: React.FC<CompaniesListItemProps> = ({ 
  company, 
  isSelected,
  onPress 
}) => {
  const { theme } = useTheme();
  // Standardize environment checking to match other components (CompanyDetailsScreen, HomeScreen)
  const isTestAccount = company.isTestAccount ?? (company.environment === CompanyEnvironment.Development);
  const isProduction = !isTestAccount;
  
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface.primary }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Main icon */}
        <View style={[
          styles.companyIcon,
          { backgroundColor: isSelected ? '#F59E0B' : '#1E40AF' }
        ]}>
          <Ionicons 
            name={isTestAccount ? 'flask' : 'business'} 
            size={32} 
            color="white" 
          />
        </View>
        
        {/* Selection indicator */}
        <View style={[
          styles.selectionIndicator,
          { backgroundColor: isSelected ? '#3B82F6' : 'transparent' }
        ]} />
        
        {/* Company information */}
        <View style={styles.companyInfo}>
          {/* Company name and commercial name */}
          <View style={styles.nameSection}>
            <Text style={[styles.companyName, { color: theme.colors.text.primary }]} numberOfLines={1}>
              {company.nombre}
            </Text>
            <Text style={[styles.commercialName, { color: theme.colors.text.secondary }]} numberOfLines={1}>
              {company.nombreComercial}
            </Text>
          </View>
          
          {/* Environment badge */}
          <View style={styles.environmentContainer}>
            <View style={[
              styles.environmentBadge,
              { backgroundColor: isTestAccount ? '#F59E0B20' : '#10B98120' }
            ]}>
              <Text style={[
                styles.environmentText,
                { color: isTestAccount ? '#F59E0B' : '#10B981' }
              ]}>
                {isProduction ? 'Producción' : 'Desarrollo'}
              </Text>
            </View>
            
            <Ionicons 
              name={isTestAccount ? 'warning' : 'checkmark-circle'} 
              size={14} 
              color={isTestAccount ? '#F59E0B' : '#10B981'} 
            />
          </View>
          
          {/* Contact information (matching iOS version) */}
          {(company.nit || company.telefono) && (
            <View style={styles.contactContainer}>
              <View style={styles.divider} />
              <View style={styles.contactInfo}>
                {company.nit && (
                  <View style={styles.contactItem}>
                    <Ionicons name="business" size={12} color={theme.colors.text.tertiary} />
                    <Text style={[styles.contactText, { color: theme.colors.text.tertiary }]}>
                      {company.nit}
                    </Text>
                  </View>
                )}
                {company.telefono && (
                  <View style={styles.contactItem}>
                    <Ionicons name="call" size={12} color={theme.colors.text.tertiary} />
                    <Text style={[styles.contactText, { color: theme.colors.text.tertiary }]}>
                      {company.telefono}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  companyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectionIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  companyInfo: {
    flex: 1,
  },
  nameSection: {
    marginBottom: 8,
  },
  companyName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  commercialName: {
    fontSize: 15,
    fontWeight: '400',
  },
  environmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  environmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  environmentText: {
    fontSize: 13,
    fontWeight: '500',
  },
  contactContainer: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: 12,
    fontWeight: '400',
  },
});

export default CompaniesListItem;