import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';

const { width, height } = Dimensions.get('window');

interface PaymentPlan {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
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

  const handlePayment = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      // Create Razorpay order
      const orderResponse = await fetch('http://localhost:5000/api/transactions/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Replace with your token storage
        },
        body: JSON.stringify({
          planId: (plan.id || plan._id),
          amount: plan.price * 100, // Convert to paise
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      // Initialize Razorpay
      const options = {
        key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_1234567890', // Replace with your key
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'Aarambh App',
        description: plan.name,
        order_id: orderData.order.id,
        prefill: {
          email: 'user@example.com', // Replace with actual user email
          contact: '9999999999', // Replace with actual user contact
        },
        theme: {
          color: '#226cae',
        },
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('http://localhost:5000/api/transactions/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                planId: (plan.id || plan._id),
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              onPaymentSuccess(verifyData.transaction);
              onClose();
            } else {
              onPaymentError(verifyData.message || 'Payment verification failed');
            }
          } catch (error) {
            onPaymentError('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      // For React Native, you would use a different Razorpay integration
      // This is a placeholder for the web version
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } else {
        // For React Native, you would use react-native-razorpay
        Alert.alert('Payment', 'Razorpay integration for React Native would be implemented here');
        setLoading(false);
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
            <ThemedText style={styles.title}>Complete Payment</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.planDetails}>
            <ThemedText style={styles.planName}>{plan.name}</ThemedText>
            <ThemedText style={styles.planPrice}>₹{plan.price}</ThemedText>
            <ThemedText style={styles.planDescription}>{plan.description}</ThemedText>
            
            <View style={styles.featuresContainer}>
              <ThemedText style={styles.featuresTitle}>Features included:</ThemedText>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <FontAwesome name="check" size={14} color="#4CAF50" />
                  <ThemedText style={styles.featureText}>{feature}</ThemedText>
                </View>
              ))}
            </View>
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
              <FontAwesome name="credit-card" size={20} color="#226cae" />
              <ThemedText style={styles.paymentMethodText}>Razorpay (Cards, UPI, Net Banking)</ThemedText>
              {paymentMethod === 'razorpay' && (
                <FontAwesome name="check-circle" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>Plan Price:</ThemedText>
              <ThemedText style={styles.totalValue}>₹{plan.price}</ThemedText>
            </View>
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>GST (18%):</ThemedText>
              <ThemedText style={styles.totalValue}>₹{(plan.price * 0.18).toFixed(2)}</ThemedText>
            </View>
            <View style={[styles.totalRow, styles.finalTotal]}>
              <ThemedText style={styles.finalTotalLabel}>Total Amount:</ThemedText>
              <ThemedText style={styles.finalTotalValue}>₹{(plan.price * 1.18).toFixed(2)}</ThemedText>
            </View>
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
                <FontAwesome name="credit-card" size={16} color="#FFFFFF" />
                <ThemedText style={styles.payButtonText}>
                  Pay ₹{(plan.price * 1.18).toFixed(2)}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>

          <ThemedText style={styles.securityNote}>
            <FontAwesome name="lock" size={12} color="#4CAF50" /> Your payment is secure and encrypted
          </ThemedText>
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
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  planDetails: {
    marginBottom: 20,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#226cae',
    marginBottom: 10,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  featuresContainer: {
    marginTop: 10,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  paymentMethodContainer: {
    marginBottom: 20,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedPaymentMethod: {
    borderColor: '#226cae',
    backgroundColor: '#F0F8FF',
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  totalContainer: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    marginTop: 8,
  },
  finalTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  finalTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#226cae',
  },
  payButton: {
    backgroundColor: '#226cae',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  payButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  securityNote: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
  },
});
