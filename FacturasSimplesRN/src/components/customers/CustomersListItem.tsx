import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Customer, CustomerType } from '../../types/customer';
import { useTheme } from '../../hooks/useTheme';

interface CustomersListItemProps {
  customer: Customer;
  onPress: () => void;
}

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const CustomersListItem: React.FC<CustomersListItemProps> = ({ 
  customer, 
  onPress 
}) => {
  const { theme } = useTheme();
  const isBusiness = customer.customerType === CustomerType.Business;
  const displayName = customer.businessName || `${customer.firstName} ${customer.lastName}`;
  
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface.primary }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.nameContainer}>
            <View style={[
              styles.iconContainer, 
              { backgroundColor: isBusiness ? '#3B82F620' : '#10B98120' }
            ]}>
              <Ionicons 
                name={isBusiness ? 'business' : 'person'} 
                size={16} 
                color={isBusiness ? '#3B82F6' : '#10B981'} 
              />
            </View>
            <View style={styles.nameInfo}>
              <Text style={[styles.name, { color: theme.colors.text.primary }]} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={[styles.document, { color: theme.colors.text.secondary }]} numberOfLines={1}>
                {customer.documentType}: {customer.nationalId}
              </Text>
            </View>
          </View>
          
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={14} color={theme.colors.text.tertiary} />
              <Text style={[styles.contactText, { color: theme.colors.text.secondary }]} numberOfLines={1}>
                {customer.email}
              </Text>
            </View>
            {customer.phone && (
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={14} color={theme.colors.text.tertiary} />
                <Text style={[styles.contactText, { color: theme.colors.text.secondary }]} numberOfLines={1}>
                  {customer.phone}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={[
            styles.typeBadge,
            { backgroundColor: isBusiness ? '#3B82F620' : '#10B98120' }
          ]}>
            <Text style={[
              styles.typeText, 
              { color: isBusiness ? '#3B82F6' : '#10B981' }
            ]}>
              {isBusiness ? 'EMP' : 'PER'}
            </Text>
          </View>
          
          <Text style={[styles.updatedDate, { color: theme.colors.text.tertiary }]}>
            {formatDate(customer.updatedAt)}
          </Text>
          
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={theme.colors.text.tertiary} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nameInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  document: {
    fontSize: 14,
    fontWeight: '400',
  },
  contactInfo: {
    paddingLeft: 44, // Align with name text
    gap: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    flex: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  updatedDate: {
    fontSize: 12,
    fontWeight: '400',
  },
});

export default CustomersListItem;