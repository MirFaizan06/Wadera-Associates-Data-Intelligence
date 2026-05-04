import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import type { Dataset, User } from '@/types';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Props {
  dataset: Dataset;
  user: User | null;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function PaymentModal({ dataset, user, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load Razorpay'));
          document.head.appendChild(s);
        });
      }

      const res = await api.post<{ success: boolean; data: { orderId: string; amount: number; currency: string; keyId: string; datasetName: string } }>(
        '/user/payments/order',
        { timeSeriesId: dataset.id }
      );

      const { orderId, amount, currency, keyId } = res.data.data;

      const rz = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'ARW Analytics',
        description: dataset.name,
        order_id: orderId,
        prefill: {
          email: user!.email,
          name: user!.fullName || undefined,
        },
        theme: { color: '#2B6CB0' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await api.post<{ success: boolean; data: { downloadUrl: string } }>(
              '/user/payments/verify',
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }
            );
            onClose();
            navigate(`/download/${verifyRes.data.data.downloadUrl.split('/').pop()}`);
          } catch {
            setError('Payment verified but download setup failed. Please check your email.');
          }
        },
      });
      rz.open();
    } catch {
      setError('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="payment-title">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 id="payment-title" className="text-lg font-semibold text-gray-900">Complete Purchase</h2>
            <p className="text-sm text-gray-500 mt-1">{dataset.name}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Close">
            <X className="h-5 w-5 text-gray-500" aria-hidden />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Dataset</span>
            <span className="font-medium">{dataset.name}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-600">Total</span>
            <span className="font-bold text-brand-navy text-lg">{formatAmount(dataset.priceINR)}</span>
          </div>
        </div>

        {!user ? (
          <div className="text-center py-2">
            <p className="text-gray-600 mb-4">Sign in to complete your purchase.</p>
            <Button asChild className="w-full" size="lg">
              <Link to="/auth/login" onClick={onClose}>
                <LogIn className="h-4 w-4 mr-2" aria-hidden />
                Sign In to Purchase
              </Link>
            </Button>
            <p className="text-sm text-gray-500 mt-3">
              No account?{' '}
              <Link to="/auth/register" onClick={onClose} className="text-brand-blue hover:underline">
                Create one for free
              </Link>
            </p>
          </div>
        ) : (
          <>
            {error && <p className="text-sm text-red-600 mb-4" role="alert">{error}</p>}
            <Button className="w-full" size="lg" onClick={handlePay} loading={loading}>
              Pay {formatAmount(dataset.priceINR)} Securely
            </Button>
            <p className="text-xs text-gray-400 text-center mt-3">
              256-bit SSL encryption &middot; Powered by Razorpay
            </p>
          </>
        )}
      </div>
    </div>
  );
}
