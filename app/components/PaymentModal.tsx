import { FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { referralsAPI, transactionsAPI } from '../services/api';
// Using static import ensures the native module is linked at build time

const { width, height } = Dimensions.get('window');

const razorpayPng = require('../../website/public/razorpay-icon.png');

interface PaymentPlan {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  duration: number;
  features: (string | { name?: string; description?: string; isIncluded?: boolean; _id?: string })[];
  description: string;
}

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  plan: PaymentPlan | null;
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
}

export default function PaymentModal({
  visible,
  onClose,
  plan,
  onPaymentSuccess,
  onPaymentError,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'other'>('razorpay');
  const [referralCode, setReferralCode] = useState('');
  const [referralDiscount, setReferralDiscount] = useState<any>(null);
  const [validatingReferral, setValidatingReferral] = useState(false);

  const loadRazorpayScriptIfNeeded = async () => {
    if (typeof document === 'undefined') return false;
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) return true;
    return await new Promise<boolean>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  };

  const validateReferralCode = async () => {
    if (!referralCode.trim() || !plan) return;
    
    setValidatingReferral(true);
    try {
      const response = await referralsAPI.validateReferralCode({
        referralCode: referralCode.trim(),
        amount: plan.price
      });
      
      if (response.success && response.data.isValid) {
        setReferralDiscount(response.data.referral);
      } else {
        setReferralDiscount(null);
        Alert.alert('Invalid Code', response.message || 'Invalid referral code');
      }
    } catch (error) {
      setReferralDiscount(null);
      Alert.alert('Error', 'Failed to validate referral code');
    } finally {
      setValidatingReferral(false);
    }
  };

  const removeReferralCode = () => {
    setReferralCode('');
    setReferralDiscount(null);
  };

  const handlePayment = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      // Create Razorpay order via backend API with referral code if available
      const orderData: any = { planId: (plan.id || plan._id) };
      if (referralDiscount) {
        orderData.referralCode = referralCode.trim();
      }
      
      const orderResp = await transactionsAPI.createOrder(orderData);
      if (!orderResp.success) throw new Error(orderResp.message || 'Failed to create order');
      const { orderId, amount, currency, transactionId } = orderResp.data;

      // Initialize Razorpay
      const resolvedKey =
        (process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID as string) ||
        ((Constants as any)?.expoConfig?.extra?.razorpayKeyId as string) ||
        ((Constants as any)?.manifestExtra?.razorpayKeyId as string) ||
        ((Constants as any)?.manifest?.extra?.razorpayKeyId as string) ||
        '';

      // Debug log for key and order
      // eslint-disable-next-line no-console
      console.log('🔑 Razorpay key resolved:', resolvedKey ? `${resolvedKey.slice(0, 6)}***` : 'EMPTY');
      // eslint-disable-next-line no-console
      console.log('🧾 Razorpay order:', { orderId, amount, currency, transactionId });

      if (!resolvedKey || !resolvedKey.startsWith('rzp_')) {
        throw new Error('Razorpay key not set. Set EXPO_PUBLIC_RAZORPAY_KEY_ID or app.json extra.razorpayKeyId');
      }

      const options: any = {
        key: resolvedKey,
        amount: Math.round((amount || plan.price) * 100),
        currency: currency || 'INR',
        name: 'Aarambh App',
        description: plan.name,
        order_id: orderId,
        prefill: {
          email: 'user@example.com', // Replace with actual user email
          contact: '9999999999', // Replace with actual user contact
        },
        theme: {
          color: '#226cae',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };
      
      // Web checkout uses handler callback
      if (typeof window !== 'undefined') {
        options.handler = async (response: any) => {
          try {
            const verifyData = await transactionsAPI.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              transactionId,
            });
            if (verifyData.success) {
              onPaymentSuccess(verifyData.data);
              onClose();
            } else {
              onPaymentError(verifyData.message || 'Payment verification failed');
            }
          } catch (error) {
            onPaymentError('Payment verification failed');
          }
        };
      }

      // Prefer native Razorpay on RN; fallback to web only on web platform
      if (RazorpayCheckout && typeof RazorpayCheckout.open === 'function') {
        try {
          // eslint-disable-next-line no-console
          console.log('🧭 Opening Razorpay native SDK with options');
          const rnResponse = await RazorpayCheckout.open(options);
          // RN returns { razorpay_payment_id, razorpay_order_id, razorpay_signature }
          const verifyData = await transactionsAPI.verifyPayment({
            razorpayOrderId: rnResponse.razorpay_order_id,
            razorpayPaymentId: rnResponse.razorpay_payment_id,
            razorpaySignature: rnResponse.razorpay_signature,
            transactionId,
          });
          if (verifyData.success) {
            onPaymentSuccess(verifyData.data);
            onClose();
          } else {
            onPaymentError(verifyData.message || 'Payment verification failed');
          }
        } catch (e) {
          setLoading(false);
          // eslint-disable-next-line no-console
          console.log('❌ Razorpay native open error:', e);
          onPaymentError('Payment cancelled or failed');
        }
      } else if (Platform.OS === 'web') {
        if (!(window as any).Razorpay) {
          const loaded = await loadRazorpayScriptIfNeeded();
          if (!loaded) throw new Error('Failed to load Razorpay checkout script');
        }
        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } else {
        Alert.alert('Payment', 'Razorpay native SDK not available. Please run a custom dev client (expo prebuild + expo run:android) to use Razorpay on device.');
      }
    } catch (error) {
      setLoading(false);
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  if (!plan) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Image source={razorpayPng} style={{ width: 16, height: 16 }} contentFit="contain" />
              <ThemedText style={styles.title}>Secure Checkout</ThemedText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome name="times" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.planDetails}>
            <View style={styles.planHeader}>
              <ThemedText style={styles.planName}>{plan.name}</ThemedText>
              <ThemedText style={styles.planPrice}>₹{plan.price}</ThemedText>
            </View>
            <ThemedText style={styles.planDescription}>{plan.description}</ThemedText>
            
            <View style={styles.featuresContainer}>
              <ThemedText style={styles.featuresTitle}>Features included:</ThemedText>
              <View style={styles.featuresChips}>
                {plan.features.map((feature, index) => {
                  const text = typeof feature === 'string' 
                    ? feature 
                    : (feature.name || feature.description || 'Feature');
                  return (
                    <View key={index} style={styles.featureChip}>
                      <ThemedText style={styles.featureChipText}>{text}</ThemedText>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Referral Code Section */}
          <View style={styles.referralContainer}>
            <ThemedText style={styles.referralTitle}>Have a referral code?</ThemedText>
            <View style={styles.referralInputContainer}>
              <TextInput
                style={styles.referralInput}
                placeholder="Enter referral code"
                value={referralCode}
                onChangeText={setReferralCode}
                autoCapitalize="characters"
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={[styles.validateButton, validatingReferral && styles.validateButtonDisabled]}
                onPress={validateReferralCode}
                disabled={validatingReferral || !referralCode.trim()}
              >
                {validatingReferral ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.validateButtonText}>Apply</ThemedText>
                )}
              </TouchableOpacity>
            </View>
            
            {referralDiscount && (
              <View style={styles.discountContainer}>
              
                <View style={styles.discountRow}>
                  <ThemedText style={styles.discountLabel}>Teacher:</ThemedText>
                  <ThemedText style={styles.discountTeacher}>{referralDiscount.teacher?.name}</ThemedText>
                </View>
                <TouchableOpacity onPress={removeReferralCode} style={styles.removeDiscountButton}>
                  <FontAwesome name="times" size={12} color="#dc2929" />
                  <ThemedText style={styles.removeDiscountText}>Remove</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.paymentMethodContainer}>
            <ThemedText style={styles.paymentMethodTitle}>Payment Method</ThemedText>
            <TouchableOpacity
              style={[
                styles.paymentMethodOption,
                paymentMethod === 'razorpay' && styles.selectedPaymentMethod
              ]}
              onPress={() => setPaymentMethod('razorpay')}
            >
              <Image source={razorpayPng} style={{ width: 16, height: 16 }} contentFit="contain" />
              <ThemedText style={styles.paymentMethodText}>Razorpay (Cards, UPI, Net Banking)</ThemedText>
              {paymentMethod === 'razorpay' && (
                <FontAwesome name="check-circle" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>Original Price:</ThemedText>
              <ThemedText style={styles.totalValue}>₹{plan.price}</ThemedText>
            </View>
            
            {referralDiscount && (
              <View style={styles.totalRow}>
                <ThemedText style={styles.totalLabel}>Discount ({referralDiscount.discountPercentage}%):</ThemedText>
                <ThemedText style={[styles.totalValue, styles.discountValue]}>-₹{referralDiscount.discountAmount}</ThemedText>
              </View>
            )}
            
            <View style={[styles.totalRow, styles.finalTotal]}>
              <ThemedText style={styles.finalTotalLabel}>Amount Payable:</ThemedText>
              <ThemedText style={styles.finalTotalValue}>
                ₹{referralDiscount ? referralDiscount.finalAmount : plan.price}
              </ThemedText>
            </View>
          </View>
          <View style={styles.poweredByRow}>
            <ThemedText style={styles.poweredByText}>Powered by Razorpay</ThemedText>
            <Image source={razorpayPng} style={{ width: 16, height: 16 }} contentFit="contain" />
          </View>

          <TouchableOpacity
            style={[styles.payButton, loading && styles.payButtonDisabled]}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                
                <ThemedText style={styles.payButtonText}>
                  Pay ₹{referralDiscount ? referralDiscount.finalAmount : plan.price}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>

         

       
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.95,
    maxHeight: height * 0.84,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  planDetails: {
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#226cae',
  },
  planDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  featuresContainer: {
    marginTop: 6,
  },
  featuresTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  featuresChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  featureChip: {
    backgroundColor: '#F4F7FB',
    borderWidth: 1,
    borderColor: '#E0E8F4',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  featureChipText: {
    fontSize: 10,
    color: '#333',
  },
  paymentMethodContainer: {
    marginBottom: 12,
  },
  paymentMethodTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 6,
  },
  selectedPaymentMethod: {
    borderColor: '#226cae',
    backgroundColor: '#F0F8FF',
  },
  paymentMethodText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  totalContainer: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
  },
  totalValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 6,
    marginTop: 6,
  },
  finalTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  finalTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#226cae',
  },
  payButton: {
    backgroundColor: '#226cae',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  poweredByRow: {
    marginTop: 4,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  poweredByText: {
    fontSize: 10,
    color: '#666',
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    color: '#666',
  },
  referralContainer: {
    marginBottom: 12,
  },
  referralTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  referralInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  referralInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 12,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  validateButton: {
    backgroundColor: '#226cae',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  validateButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  validateButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  discountContainer: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  discountLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  discountTeacher: {
    fontSize: 12,
    color: '#226cae',
    fontWeight: '500',
  },
  removeDiscountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
    gap: 3,
  },
  removeDiscountText: {
    fontSize: 10,
    color: '#dc2929',
    fontWeight: '500',
  },
});
