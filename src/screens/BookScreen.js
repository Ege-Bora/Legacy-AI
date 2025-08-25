import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useI18n';
import { Screen } from '../components/layout/Screen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ChapterCardSkeleton } from '../components/skeleton/ChapterCardSkeleton';
import { api } from '../services/api';
import PaywallModal from '../components/PaywallModal';
import { useSubscription } from '../state/subscription';

export default function BookScreen() {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { subscriptionStatus, features, isFree } = useSubscription();
  const theme = useTheme();
  const { t } = useI18n();

  // Safe feature access with defaults
  const canExportDoc = !!(features?.export_doc);
  const canExportEpub = !!(features?.export_epub);
  const canExportPdf = !!(features?.export_pdf);

  useEffect(() => {
    loadBookProgress();
  }, []);

  const loadBookProgress = async () => {
    try {
      // Mock book progress for now
      console.log('[BookScreen] Loading book progress (mocked)');
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(65); // Mock 65% progress
    } catch (error) {
      console.error('Failed to load book progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBook = async (format) => {
    try {
      setIsGenerating(true);
      console.log(`[BookScreen] Starting ${format} export...`);
      
      // Use the mock API service
      const result = await api.generateBook(format);
      
      Alert.alert(
        'Export Started',
        `Your ${format.toUpperCase()} export has been started. Job ID: ${result.jobId}`,
        [{ text: 'OK' }]
      );
      
      console.log(`[BookScreen] Export job created:`, result.jobId);
      
    } catch (error) {
      console.error(`[BookScreen] Export failed:`, error);
      Alert.alert(
        'Export Failed', 
        'Failed to start the export. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Screen scroll={true}>
        {/* Header */}
        <View style={{
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
        }}>
          <Text style={{
            fontSize: theme.fontSizes.h1,
            fontWeight: theme.fontWeights.bold,
            color: theme.colors.text
          }}>
            {t('book.title')}
          </Text>
          <Text style={{
            fontSize: theme.fontSizes.md,
            color: theme.colors.textDim,
            marginTop: theme.spacing.xs
          }}>
            {t('common.loading')}
          </Text>
        </View>

        <ChapterCardSkeleton count={3} />
      </Screen>
    );
  }

  return (
    <Screen scroll={true}>
      {/* Header */}
      <View style={{
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
      }}>
        <Text style={{
          fontSize: theme.fontSizes.h1,
          fontWeight: theme.fontWeights.bold,
          color: theme.colors.text
        }}>
          {t('book.title')}
        </Text>
        <Text style={{
          fontSize: theme.fontSizes.md,
          color: theme.colors.textDim,
          marginTop: theme.spacing.xs
        }}>
          {t('book.subtitle')}
        </Text>
      </View>
          {/* Progress Overview */}
          <Card style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: theme.fontSizes.lg,
              fontWeight: theme.fontWeights.semibold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md
            }}>
              Book Progress
            </Text>
            
            <View style={{ marginBottom: theme.spacing.md }}>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.sm
              }}>
                <Text style={{
                  fontSize: theme.fontSizes.md,
                  color: theme.colors.textDim
                }}>
                  Completion
                </Text>
                <Text style={{
                  fontSize: theme.fontSizes.md,
                  fontWeight: theme.fontWeights.medium,
                  color: theme.colors.text
                }}>
                  {progress?.completionPercentage || 0}%
                </Text>
              </View>
              <ProgressBar 
                progress={(progress?.completionPercentage || 0) / 100}
                height={12}
              />
            </View>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: theme.fontSizes.h2,
                  fontWeight: theme.fontWeights.bold,
                  color: theme.colors.primary
                }}>
                  {progress?.totalChapters || 0}
                </Text>
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.textDim
                }}>
                  Chapters
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: theme.fontSizes.h2,
                  fontWeight: theme.fontWeights.bold,
                  color: theme.colors.success
                }}>
                  {progress?.estimatedPages || 0}
                </Text>
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.textDim
                }}>
                  Pages
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: theme.fontSizes.h2,
                  fontWeight: theme.fontWeights.bold,
                  color: theme.colors.secondary
                }}>
                  {progress?.completionPercentage || 0}%
                </Text>
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.textDim
                }}>
                  Complete
                </Text>
              </View>
            </View>
          </Card>

          {/* Export Options */}
          <Card style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: theme.fontSizes.lg,
              fontWeight: theme.fontWeights.semibold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md
            }}>
              Export Your Book
            </Text>
            
            <View style={{ gap: theme.spacing.sm }}>
              {/* PDF Export */}
              <Card 
                onPress={() => handleGenerateBook('pdf')}
                disabled={isGenerating}
                variant="surface"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    backgroundColor: `${theme.colors.error}20`,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Ionicons name="document-text" size={20} color={theme.colors.error} />
                  </View>
                  <View style={{ marginLeft: theme.spacing.md }}>
                    <Text style={{
                      fontSize: theme.fontSizes.md,
                      fontWeight: theme.fontWeights.medium,
                      color: theme.colors.text
                    }}>
                      PDF Book
                    </Text>
                    <Text style={{
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.textDim
                    }}>
                      Perfect for printing and sharing
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {features?.exportFormats?.includes('pdf') && (
                    <View style={{
                      backgroundColor: `${theme.colors.success}20`,
                      paddingHorizontal: theme.spacing.sm,
                      paddingVertical: theme.spacing.xs,
                      borderRadius: theme.spacing.xs,
                      marginRight: theme.spacing.sm
                    }}>
                      <Text style={{
                        fontSize: theme.fontSizes.xs,
                        color: theme.colors.success,
                        fontWeight: theme.fontWeights.medium
                      }}>
                        FREE
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textDim} />
                </View>
              </Card>

              {/* ePub Export */}
              <Card 
                onPress={() => handleGenerateBook('epub')}
                disabled={isGenerating}
                variant="surface"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    backgroundColor: `${theme.colors.primary}20`,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Ionicons name="library" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={{ marginLeft: theme.spacing.md }}>
                    <Text style={{
                      fontSize: theme.fontSizes.md,
                      fontWeight: theme.fontWeights.medium,
                      color: theme.colors.text
                    }}>
                      ePub Book
                    </Text>
                    <Text style={{
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.textDim
                    }}>
                      For e-readers and tablets
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {!features?.exportFormats?.includes('epub') && (
                    <View style={{
                      backgroundColor: `${theme.colors.warning}20`,
                      paddingHorizontal: theme.spacing.sm,
                      paddingVertical: theme.spacing.xs,
                      borderRadius: theme.spacing.xs,
                      marginRight: theme.spacing.sm
                    }}>
                      <Text style={{
                        fontSize: theme.fontSizes.xs,
                        color: theme.colors.warning,
                        fontWeight: theme.fontWeights.medium
                      }}>
                        PRO
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textDim} />
                </View>
              </Card>

              {/* DOCX Export */}
              <Card 
                onPress={() => handleGenerateBook('docx')}
                disabled={isGenerating}
                variant="surface"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    backgroundColor: `${theme.colors.secondary}20`,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Ionicons name="document" size={20} color={theme.colors.secondary} />
                  </View>
                  <View style={{ marginLeft: theme.spacing.md }}>
                    <Text style={{
                      fontSize: theme.fontSizes.md,
                      fontWeight: theme.fontWeights.medium,
                      color: theme.colors.text
                    }}>
                      Word Document
                    </Text>
                    <Text style={{
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.textDim
                    }}>
                      For further editing and customization
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {!features?.exportFormats?.includes('docx') && (
                    <View style={{
                      backgroundColor: `${theme.colors.warning}20`,
                      paddingHorizontal: theme.spacing.sm,
                      paddingVertical: theme.spacing.xs,
                      borderRadius: theme.spacing.xs,
                      marginRight: theme.spacing.sm
                    }}>
                      <Text style={{
                        fontSize: theme.fontSizes.xs,
                        color: theme.colors.warning,
                        fontWeight: theme.fontWeights.medium
                      }}>
                        PRO
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textDim} />
                </View>
              </Card>
            </View>
          </Card>

          {/* Book Preview */}
          <Card style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: theme.fontSizes.lg,
              fontWeight: theme.fontWeights.semibold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md
            }}>
              Book Preview
            </Text>
            
            <View style={{
              backgroundColor: theme.colors.surfaceSecondary,
              borderRadius: theme.spacing.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md
            }}>
              <Text style={{
                fontSize: theme.fontSizes.md,
                fontWeight: theme.fontWeights.medium,
                color: theme.colors.text,
                marginBottom: theme.spacing.sm
              }}>
                Table of Contents
              </Text>
              <View style={{ gap: theme.spacing.xs }}>
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.textDim
                }}>
                  • Introduction
                </Text>
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.textDim
                }}>
                  • Childhood Memories
                </Text>
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.textDim
                }}>
                  • First Day of School
                </Text>
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.textDim
                }}>
                  • Family Traditions
                </Text>
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.textDim
                }}>
                  • Life Lessons
                </Text>
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.textDim
                }}>
                  • Conclusion
                </Text>
              </View>
            </View>

            <Button
              title="Preview Full Book"
              onPress={() => Alert.alert('Preview', 'Book preview coming soon')}
              variant="primary"
              accessibilityLabel="Preview the full book"
            />
          </Card>

          {/* Tips */}
          <Card 
            variant="surface"
            style={{
              backgroundColor: `${theme.colors.primary}10`,
              borderColor: `${theme.colors.primary}20`,
              marginBottom: theme.spacing.lg
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons 
                name="information-circle" 
                size={24} 
                color={theme.colors.primary} 
              />
              <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
                <Text style={{
                  fontSize: theme.fontSizes.md,
                  fontWeight: theme.fontWeights.semibold,
                  color: theme.colors.primary,
                  marginBottom: theme.spacing.xs
                }}>
                  Book Generation Tips
                </Text>
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.text,
                  lineHeight: theme.fontSizes.sm * 1.4
                }}>
                  • Add more chapters to increase your book length{"\n"}
                  • Include photos and media for a richer experience{"\n"}
                  • Use the AI enhancement feature to improve your writing{"\n"}
                  • Consider upgrading for additional export formats
                </Text>
              </View>
            </View>
          </Card>
      {/* Export Buttons */}
      {!isGenerating && (
        <View style={{
          paddingVertical: theme.spacing.md,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          marginTop: theme.spacing.xl,
          gap: theme.spacing.md
        }}>
          <Text style={{
            fontSize: theme.fontSizes.lg,
            fontWeight: theme.fontWeights.semibold,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: theme.spacing.sm
          }}>
            {t('book.exportOptions')}
          </Text>
          
          <Button
            title={t('book.exportPDF')}
            onPress={() => handleGenerateBook('pdf')}
            variant="primary"
            size="lg"
            accessibilityLabel={t('book.exportPDF')}
          />
          
          <Button
            title={t('book.exportEPUB')}
            onPress={() => handleGenerateBook('epub')}
            variant="secondary"
            size="lg"
            accessibilityLabel={t('book.exportEPUB')}
          />
          
          <Button
            title={t('book.exportDOC')}
            onPress={() => handleGenerateBook('doc')}
            variant="secondary"
            size="lg"
            accessibilityLabel={t('book.exportDOC')}
          />
        </View>
      )}

      {isGenerating && (
        <View style={{
          paddingVertical: theme.spacing.md,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          marginTop: theme.spacing.xl
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ActivityIndicator 
              size="small" 
              color={theme.colors.primary} 
              style={{ marginRight: theme.spacing.sm }}
            />
            <Text style={{
              fontSize: theme.fontSizes.md,
              color: theme.colors.textDim
            }}>
              {t('book.generating')}
            </Text>
          </View>
        </View>
      )}

      <PaywallModal 
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </Screen>
  );
}
