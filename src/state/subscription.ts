import { useMemo } from 'react';

export type Plan = 'free' | 'pro' | 'max';

export interface SubscriptionFeatures {
  export_epub: boolean;
  export_doc: boolean;
  export_pdf: boolean;
  styles: boolean;
  quick_memo: boolean;
  interviews_per_week: number;
  max_chapters: number;
  ai_generations: number;
  cloud_storage: boolean;
}

export interface SubscriptionState {
  plan: Plan;
  subscriptionStatus: 'active' | 'inactive' | 'expired' | 'trial';
  features: SubscriptionFeatures;
  isFree: boolean;
  isPro: boolean;
  isMax: boolean;
  expiresAt?: string;
  trialDaysLeft?: number;
}

// Temporary stub until real RevenueCat integration
export function useSubscription(): SubscriptionState {
  // Read from a simple in-memory flag or FeatureFlags if available
  // This would normally come from RevenueCat or your subscription service
  const getCurrentPlan = (): Plan => 'free'; // TODO: Replace with actual subscription status
  const plan = getCurrentPlan();
  
  const features: SubscriptionFeatures = useMemo(() => {
    switch (plan) {
      case 'pro':
        return {
          export_epub: true,
          export_doc: true,
          export_pdf: true,
          styles: true,
          quick_memo: true,
          interviews_per_week: 10,
          max_chapters: 50,
          ai_generations: 100,
          cloud_storage: true,
        };
      case 'max':
        return {
          export_epub: true,
          export_doc: true,
          export_pdf: true,
          styles: true,
          quick_memo: true,
          interviews_per_week: -1, // unlimited
          max_chapters: -1, // unlimited
          ai_generations: -1, // unlimited
          cloud_storage: true,
        };
      case 'free':
      default:
        return {
          export_epub: false,
          export_doc: false,
          export_pdf: true,
          styles: false,
          quick_memo: true,
          interviews_per_week: 1,
          max_chapters: 5,
          ai_generations: 10,
          cloud_storage: false,
        };
    }
  }, [plan]);

  return useMemo(() => ({
    plan,
    subscriptionStatus: 'active' as const,
    features,
    isFree: plan === 'free',
    isPro: plan === 'pro',
    isMax: plan === 'max',
  }), [plan, features]);
}

// Hook for checking specific feature access
export function useFeatureAccess(feature: keyof SubscriptionFeatures): boolean {
  const { features } = useSubscription();
  return features[feature] as boolean;
}

// Hook for checking if user can perform an action based on limits
export function useSubscriptionLimits() {
  const { features, plan } = useSubscription();
  
  return useMemo(() => ({
    canCreateChapter: (currentCount: number) => {
      return features.max_chapters === -1 || currentCount < features.max_chapters;
    },
    canUseAI: (currentUsage: number) => {
      return features.ai_generations === -1 || currentUsage < features.ai_generations;
    },
    canExport: (format: 'pdf' | 'epub' | 'doc') => {
      switch (format) {
        case 'pdf': return features.export_pdf;
        case 'epub': return features.export_epub;
        case 'doc': return features.export_doc;
        default: return false;
      }
    },
    getRemainingChapters: (currentCount: number) => {
      return features.max_chapters === -1 ? -1 : Math.max(0, features.max_chapters - currentCount);
    },
    getRemainingAIGenerations: (currentUsage: number) => {
      return features.ai_generations === -1 ? -1 : Math.max(0, features.ai_generations - currentUsage);
    },
  }), [features]);
}
