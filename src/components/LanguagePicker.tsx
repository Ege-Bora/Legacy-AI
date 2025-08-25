import React, { useState } from 'react';
import { View, Text, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../hooks/useI18n';
import { useTheme } from '../hooks/useTheme';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { LANGUAGE_OPTIONS, getStoredLanguage } from '../i18n';

interface LanguagePickerProps {
  compact?: boolean;
}

export const LanguagePicker: React.FC<LanguagePickerProps> = ({ compact = false }) => {
  const { t, language, setLanguage, isRTL } = useI18n();
  const theme = useTheme();
  const [currentSelection, setCurrentSelection] = React.useState<string>('system');
  const [showRTLModal, setShowRTLModal] = useState(false);

  React.useEffect(() => {
    const getCurrentSelection = async () => {
      const stored = await getStoredLanguage();
      if (stored) {
        setCurrentSelection(stored);
      } else {
        setCurrentSelection('system');
      }
    };
    getCurrentSelection();
  }, [language]);

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      // Check if switching to RTL language
      const selectedOption = LANGUAGE_OPTIONS.find(opt => opt.code === languageCode);
      const willBeRTL = selectedOption && 'rtl' in selectedOption ? selectedOption.rtl : false;
      const currentlyRTL = isRTL;
      
      if (languageCode === 'system') {
        await setLanguage('system');
      } else {
        await setLanguage(languageCode as 'en' | 'tr' | 'es' | 'fr' | 'de' | 'it' | 'ar');
      }
      setCurrentSelection(languageCode);
      
      // Show RTL modal if switching to/from RTL
      if (willBeRTL !== currentlyRTL && willBeRTL) {
        setShowRTLModal(true);
      } else {
        // Show confirmation toast for non-RTL changes
        Alert.alert(
          t('settings.languageUpdated'),
          undefined,
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      console.error('Failed to change language:', error);
      Alert.alert(
        t('common.error'),
        t('errors.generic'),
        [{ text: t('common.ok') }]
      );
    }
  };

  if (compact) {
    return (
      <>
        <View style={{ gap: theme.spacing.sm }}>
          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = currentSelection === option.code;
            return (
              <View key={option.code} style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                gap: theme.spacing.sm 
              }}>
                <Button
                  title={option.nativeLabel}
                  variant={isSelected ? 'primary' : 'secondary'}
                  onPress={() => handleLanguageSelect(option.code)}
                  accessibilityLabel={`Select ${option.label} language${isSelected ? ' (selected)' : ''}`}
                  style={{
                    flex: 1,
                    justifyContent: 'flex-start',
                    paddingHorizontal: theme.spacing.md,
                  }}
                />
                {isSelected && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={theme.colors.primary} 
                  />
                )}
              </View>
            );
          })}
        </View>
        {showRTLModal && (
          <RTLModal 
            visible={showRTLModal} 
            onClose={() => setShowRTLModal(false)}
            theme={theme}
            t={t}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Card>
        <Text style={{
          fontSize: theme.fontSizes.lg,
          fontWeight: theme.fontWeights.semibold,
          color: theme.colors.text,
          marginBottom: theme.spacing.md,
        }}>
          {t('settings.language')}
        </Text>
        
        <View style={{ gap: theme.spacing.sm }}>
          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = currentSelection === option.code;
            
            return (
              <View key={option.code} style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                gap: theme.spacing.sm 
              }}>
                <Button
                  title={option.nativeLabel}
                  variant={isSelected ? 'primary' : 'secondary'}
                  onPress={() => handleLanguageSelect(option.code)}
                  accessibilityLabel={`Select ${option.label} language${isSelected ? ' (selected)' : ''}`}
                  style={{
                    flex: 1,
                    justifyContent: 'flex-start',
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.md,
                  }}
                />
                {isSelected && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                )}
              </View>
            );
          })}
        </View>
        
        <Text style={{
          fontSize: theme.fontSizes.sm,
          color: theme.colors.textDim,
          marginTop: theme.spacing.md,
          lineHeight: theme.fontSizes.sm * 1.4,
        }}>
          {currentSelection === 'system' 
            ? `${t('settings.systemDefault')} (${language.toUpperCase()})`
            : `${t('settings.language')}: ${LANGUAGE_OPTIONS.find(opt => opt.code === currentSelection)?.nativeLabel}`
          }
        </Text>
        
        <Text style={{
          fontSize: theme.fontSizes.xs,
          color: theme.colors.textDim,
          marginTop: theme.spacing.sm,
          fontStyle: 'italic',
        }}>
          You can change this anytime.
        </Text>
      </Card>
      
      {showRTLModal && (
        <RTLModal 
          visible={showRTLModal} 
          onClose={() => setShowRTLModal(false)}
          theme={theme}
          t={t}
        />
      )}
    </>
  );
};

// RTL Modal Component
interface RTLModalProps {
  visible: boolean;
  onClose: () => void;
  theme: any;
  t: (key: string) => string;
}

const RTLModal: React.FC<RTLModalProps> = ({ visible, onClose, theme, t }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
      }}>
        <Card style={{
          width: '100%',
          maxWidth: 400,
          alignItems: 'center',
        }}>
          <View style={{
            width: 48,
            height: 48,
            backgroundColor: `${theme.colors.primary}20`,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: theme.spacing.md,
          }}>
            <Ionicons 
              name="swap-horizontal" 
              size={24} 
              color={theme.colors.primary} 
            />
          </View>
          
          <Text style={{
            fontSize: theme.fontSizes.lg,
            fontWeight: theme.fontWeights.semibold,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: theme.spacing.sm,
          }}>
            Right-to-Left Layout
          </Text>
          
          <Text style={{
            fontSize: theme.fontSizes.md,
            color: theme.colors.textDim,
            textAlign: 'center',
            lineHeight: theme.fontSizes.md * 1.4,
            marginBottom: theme.spacing.lg,
          }}>
            To fully apply RTL layout, please restart the app. The language has been changed successfully.
          </Text>
          
          <Button
            title="Restart Later"
            onPress={onClose}
            variant="primary"
            style={{ width: '100%' }}
            accessibilityLabel="Close RTL notification"
          />
        </Card>
      </View>
    </Modal>
  );
};

export default LanguagePicker;
