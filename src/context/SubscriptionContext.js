import React, { createContext, useState, useContext } from 'react';

export const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState('free'); // 'free', 'premium', 'pro'
  const [features, setFeatures] = useState({
    maxChapters: 5,
    aiGenerations: 10,
    exportFormats: ['pdf'],
    cloudStorage: false
  });

  const upgradeSubscription = async (tier) => {
    // Placeholder for subscription upgrade
    console.log(`Upgrading to ${tier}`);
    
    const tierFeatures = {
      premium: {
        maxChapters: 50,
        aiGenerations: 100,
        exportFormats: ['pdf', 'epub'],
        cloudStorage: true
      },
      pro: {
        maxChapters: -1, // unlimited
        aiGenerations: -1, // unlimited
        exportFormats: ['pdf', 'epub', 'docx'],
        cloudStorage: true
      }
    };

    setSubscriptionStatus(tier);
    setFeatures(tierFeatures[tier] || features);
    return true;
  };

  const checkFeatureAccess = (feature) => {
    // Placeholder for feature access checking
    return features[feature] !== undefined;
  };

  const value = {
    subscriptionStatus,
    features,
    upgradeSubscription,
    checkFeatureAccess
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
