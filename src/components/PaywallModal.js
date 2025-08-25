import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../context/SubscriptionContext';

export default function PaywallModal({ visible, onClose }) {
  const { upgradeSubscription } = useSubscription();

  const plans = [
    {
      id: 'premium',
      name: 'Premium',
      price: '$9.99',
      period: 'month',
      features: [
        '50 chapters',
        '100 AI generations',
        'PDF & ePub export',
        'Cloud storage',
        'Priority support'
      ],
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19.99',
      period: 'month',
      features: [
        'Unlimited chapters',
        'Unlimited AI generations',
        'All export formats',
        'Cloud storage',
        'Priority support',
        'Advanced editing tools'
      ],
      popular: false
    }
  ];

  const handleUpgrade = async (planId) => {
    try {
      await upgradeSubscription(planId);
      onClose();
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">
              Upgrade to Premium
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <Text className="text-gray-600 mt-2">
            Unlock the full potential of Life Legacy AI
          </Text>
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {/* Benefits */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Why upgrade?
            </Text>
            <View className="space-y-3">
              {[
                'Create unlimited life story chapters',
                'Export in multiple formats (PDF, ePub, DOCX)',
                'Advanced AI writing assistance',
                'Cloud backup and sync',
                'Priority customer support'
              ].map((benefit, index) => (
                <View key={index} className="flex-row items-center">
                  <View className="w-6 h-6 bg-green-100 rounded-full justify-center items-center">
                    <Ionicons name="checkmark" size={16} color="#10b981" />
                  </View>
                  <Text className="ml-3 text-gray-700">{benefit}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Plans */}
          <View className="space-y-4">
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                onPress={() => handleUpgrade(plan.id)}
                className={`border-2 rounded-xl p-4 ${
                  plan.popular 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <View className="absolute -top-2 left-4">
                    <View className="bg-blue-500 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs font-medium">
                        Most Popular
                      </Text>
                    </View>
                  </View>
                )}

                <View className="flex-row items-center justify-between mb-3">
                  <View>
                    <Text className="text-xl font-bold text-gray-900">
                      {plan.name}
                    </Text>
                    <View className="flex-row items-baseline">
                      <Text className="text-2xl font-bold text-gray-900">
                        {plan.price}
                      </Text>
                      <Text className="text-gray-600 ml-1">
                        /{plan.period}
                      </Text>
                    </View>
                  </View>
                  <View className={`w-12 h-12 rounded-full justify-center items-center ${
                    plan.popular ? 'bg-blue-500' : 'bg-gray-200'
                  }`}>
                    <Ionicons 
                      name="star" 
                      size={24} 
                      color={plan.popular ? 'white' : '#6b7280'} 
                    />
                  </View>
                </View>

                <View className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <View key={index} className="flex-row items-center">
                      <Ionicons name="checkmark" size={16} color="#10b981" />
                      <Text className="ml-2 text-gray-700">{feature}</Text>
                    </View>
                  ))}
                </View>

                <View className={`mt-4 py-3 rounded-lg ${
                  plan.popular ? 'bg-blue-500' : 'bg-gray-800'
                }`}>
                  <Text className="text-white text-center font-semibold">
                    Choose {plan.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Free Trial Info */}
          <View className="mt-6 p-4 bg-yellow-50 rounded-xl">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#f59e0b" />
              <View className="ml-2 flex-1">
                <Text className="font-medium text-yellow-800">
                  7-Day Free Trial
                </Text>
                <Text className="text-yellow-700 text-sm mt-1">
                  Try any plan free for 7 days. Cancel anytime before the trial ends and you won't be charged.
                </Text>
              </View>
            </View>
          </View>

          {/* Terms */}
          <Text className="text-center text-gray-500 text-sm mt-6">
            By subscribing, you agree to our Terms of Service and Privacy Policy. 
            Subscriptions auto-renew unless cancelled.
          </Text>
        </ScrollView>

        {/* Bottom Actions */}
        <View className="px-6 py-4 border-t border-gray-200">
          <TouchableOpacity
            onPress={onClose}
            className="w-full py-3 bg-gray-100 rounded-xl"
          >
            <Text className="text-center text-gray-700 font-medium">
              Continue with Free Plan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
