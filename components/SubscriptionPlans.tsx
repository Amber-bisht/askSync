'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { CheckIcon, StarIcon } from '@heroicons/react/24/outline';

declare global {
  interface Window {
    Razorpay: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
      prefill: { name: string; email: string };
      theme: { color: string };
    }) => {
      open: () => void;
    };
  }
}

export default function SubscriptionPlans() {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Monthly Plan',
      price: '₹299',
      period: 'per month',
      features: [
        '10 Tests per month',
        '10 Forms per month',
        '20 AI Response Gradings per month',
        '100 MCQ Generations per month',
        '100 Question/Answer Generations per month',
        '10 Access Lists per month',
        'Priority Support',
        'Advanced Analytics'
      ],
      popular: false,
      value: 'monthly'
    },
    {
      name: 'Yearly Plan',
      price: '₹3,289',
      period: 'per year',
      features: [
        'Everything in Monthly Plan',
        '1 Month Free (11 months payment)',
        'Save ₹299 annually',
        'Priority Support',
        'Advanced Analytics',
        'Bulk Operations',
        'Custom Branding'
      ],
      popular: true,
      value: 'yearly'
    }
  ];

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!session) return;
    
    // Prevent subscription flow for already paid users
    if (session.user.isPaid) {
      alert('You already have an active subscription!');
      return;
    }
    
    setIsLoading(true);
    try {
      // Create payment order
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Initialize Razorpay payment
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'AskSync',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`,
        order_id: orderData.orderId,
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan,
                paymentType: 'subscription',
              }),
            });

            if (verifyResponse.ok) {
              // Update session
              await update();
              alert('Payment successful! Your subscription is now active.');
              window.location.reload();
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: session.user.name,
          email: session.user.email,
        },
        theme: {
          color: '#3B82F6',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to initiate subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) return null;

  // Calculate days until expiry for paid users
  const getDaysUntilExpiry = () => {
    if (!session?.user?.subscriptionEndDate) return null;
    const expiryDate = new Date(session.user.subscriptionEndDate);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {session?.user?.isPaid ? 'Manage Your Subscription' : 'Choose Your Plan'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {session?.user?.isPaid 
            ? 'Your current plan details and renewal options' 
            : 'Unlock unlimited MCQ generation and advanced features'
          }
        </p>
      </div>

      {/* Plan Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPlan === 'monthly'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedPlan('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPlan === 'yearly'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
              Save 8%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.value}
            className={`relative rounded-lg border-2 p-6 ${
              plan.popular
                ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-gray-800'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-600 dark:bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <StarIcon className="h-4 w-4 mr-1" />
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{plan.name}</h4>
              <div className="mb-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{plan.price}</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">{plan.period}</span>
              </div>
              {plan.value === 'yearly' && (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Save ₹299 annually</p>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="relative group">
              <button
                onClick={() => handleSubscribe(plan.value as 'monthly' | 'yearly')}
                disabled={isLoading || session?.user?.isPaid}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  session?.user?.isPaid
                    ? 'bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600'
                    : 'bg-gray-600 dark:bg-gray-500 text-white hover:bg-gray-700 dark:hover:bg-gray-600'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Processing...' : (session?.user?.isPaid ? 'Already Subscribed' : 'Subscribe Now')}
              </button>
              
              {/* Hover tooltip for paid users */}
              {session?.user?.isPaid && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                  <div className="flex items-center">
                    <CheckIcon className="h-4 w-4 mr-1 text-green-400" />
                    <span>Already a paid user</span>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Current Subscription Status */}
      {session.user.isPaid && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-green-800 dark:text-green-300 font-medium">
                You have an active subscription! 🎉
              </span>
            </div>
            {daysUntilExpiry !== null && (
              <div className="text-right">
                <p className="text-sm text-green-700 dark:text-green-300">
                  {daysUntilExpiry > 0 ? (
                    <>Expires in <span className="font-semibold">{daysUntilExpiry} days</span></>
                  ) : daysUntilExpiry === 0 ? (
                    <span className="font-semibold text-orange-600 dark:text-orange-400">Expires today!</span>
                  ) : (
                    <span className="font-semibold text-red-600 dark:text-red-400">Expired</span>
                  )}
                </p>
                {session.user.subscriptionEndDate && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Until {new Date(session.user.subscriptionEndDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trial Status */}
      {!session.user.isPaid && session.user.isTrialUsed && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center">
            <StarIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            <span className="text-yellow-800 dark:text-yellow-300">
              Your free trial has been used. Subscribe to continue using premium features.
            </span>
          </div>
        </div>
      )}

      {/* Free Usage Status */}
        {!session.user.isPaid && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <StarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-blue-800 dark:text-blue-300 font-medium">Free Plan Usage:</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Tests:</span>
                <span className="text-blue-800 dark:text-blue-200 font-medium">{session.user.testsCreated || 0}/{session.user.testsLimit || 5}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Forms:</span>
                <span className="text-blue-800 dark:text-blue-200 font-medium">{session.user.formsCreated || 0}/{session.user.formsLimit || 5}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">AI Grading:</span>
                <span className="text-blue-800 dark:text-blue-200 font-medium">{session.user.aiGradingUsed || 0}/{session.user.aiGradingLimit || 2}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">MCQ Gen:</span>
                <span className="text-blue-800 dark:text-blue-200 font-medium">{session.user.mcqAiUsed || 0}/{session.user.mcqAiLimit || 10}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Q&A Gen:</span>
                <span className="text-blue-800 dark:text-blue-200 font-medium">{session.user.questionAiUsed || 0}/{session.user.questionAiLimit || 10}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-300">Access Lists:</span>
                <span className="text-blue-800 dark:text-blue-200 font-medium">{session.user.accessListsCreated || 0}/{session.user.accessListsLimit || 1}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
