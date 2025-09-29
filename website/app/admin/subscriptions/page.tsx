'use client';

import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Plan {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  durationType: 'days' | 'weeks' | 'months' | 'years';
  features: Array<{
    name: string;
    description: string;
    isIncluded: boolean;
    _id: string;
  }>;
  isActive: boolean;
  isPopular: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  plan: {
    _id: string;
    name: string;
    price: number;
  };
  amount: number;
  finalAmount: number;
  discountAmount?: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  referralCode?: string;
  createdAt: string;
  updatedAt: string;
}

interface PlanFormData {
  name: string;
  description: string;
  price: number;
  duration: number;
  durationType: 'days' | 'weeks' | 'months' | 'years';
  features: Array<{
    name: string;
    description: string;
    isIncluded: boolean;
  }>;
  isActive: boolean;
  isPopular: boolean;
}

export default function SubscriptionManagement() {
  const [activeTab, setActiveTab] = useState<'plans' | 'transactions'>('plans');
  
  // Plans state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  
  // Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  
  // Common state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal states
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [showViewTransactionModal, setShowViewTransactionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Filters
  const [transactionFilters, setTransactionFilters] = useState({
    status: '',
    search: ''
  });
  
  // Form data
  const [planFormData, setPlanFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    price: 0,
    duration: 1,
    durationType: 'months',
    features: [],
    isActive: true,
    isPopular: false
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://aarambh-english-learning-app-1.onrender.com';

  useEffect(() => {
    if (activeTab === 'plans') {
      fetchPlans();
    } else {
      fetchTransactions();
    }
  }, [activeTab, currentPage, transactionFilters]);

  const getToken = () => {
    return localStorage.getItem('adminToken');
  };

  // Plans API calls
  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await fetch(`${backendUrl}/admin/plans`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      const data = await response.json();
      setPlans(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plans');
    } finally {
      setPlansLoading(false);
    }
  };

  const createPlan = async (planData: PlanFormData) => {
    try {
      const response = await fetch(`${backendUrl}/admin/plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create plan');
      }

      setSuccess('Plan created successfully');
      setShowCreatePlanModal(false);
      resetPlanForm();
      fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
    }
  };

  const updatePlan = async (planId: string, planData: PlanFormData) => {
    try {
      const response = await fetch(`${backendUrl}/admin/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update plan');
      }

      setSuccess('Plan updated successfully');
      setShowEditPlanModal(false);
      resetPlanForm();
      fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plan');
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) {
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/admin/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete plan');
      }

      setSuccess('Plan deleted successfully');
      fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan');
    }
  };

  // Transactions API calls
  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(transactionFilters.status && { status: transactionFilters.status }),
        ...(transactionFilters.search && { search: transactionFilters.search })
      });

      const response = await fetch(`${backendUrl}/admin/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.data.transactions || []);
      setTotalPages(data.data.pagination?.pages || 1);
      setTotalTransactions(data.data.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Helper functions
  const resetPlanForm = () => {
    setPlanFormData({
      name: '',
      description: '',
      price: 0,
      duration: 1,
      durationType: 'months',
      features: [],
      isActive: true,
      isPopular: false
    });
  };

  const openEditPlanModal = (plan: Plan) => {
    setSelectedPlan(plan);
    setPlanFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      duration: plan.duration,
      durationType: plan.durationType,
      features: plan.features.map(f => ({
        name: f.name,
        description: f.description,
        isIncluded: f.isIncluded
      })),
      isActive: plan.isActive,
      isPopular: plan.isPopular
    });
    setShowEditPlanModal(true);
  };

  const openViewTransactionModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowViewTransactionModal(true);
  };

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showEditPlanModal && selectedPlan) {
      updatePlan(selectedPlan._id, planFormData);
    } else {
      createPlan(planFormData);
    }
  };

  const addFeature = () => {
    setPlanFormData({
      ...planFormData,
      features: [...planFormData.features, { name: '', description: '', isIncluded: true }]
    });
  };

  const removeFeature = (index: number) => {
    setPlanFormData({
      ...planFormData,
      features: planFormData.features.filter((_, i) => i !== index)
    });
  };

  const updateFeature = (index: number, field: keyof PlanFormData['features'][0], value: any) => {
    const updatedFeatures = [...planFormData.features];
    updatedFeatures[index] = { ...updatedFeatures[index], [field]: value };
    setPlanFormData({ ...planFormData, features: updatedFeatures });
  };

  const handleTransactionFilterChange = (key: string, value: string) => {
    setTransactionFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage subscription plans and view transactions
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearMessages} className="text-red-500 hover:text-red-700">
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={clearMessages} className="text-green-500 hover:text-green-700">
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('plans')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'plans'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Subscription Plans
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transactions
          </button>
        </nav>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                resetPlanForm();
                setShowCreatePlanModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Plan</span>
            </button>
          </div>

          {plansLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan._id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                      {plan.isPopular && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900">
                        {formatCurrency(plan.price)}
                      </div>
                      <div className="text-sm text-gray-500">
                        for {plan.duration} {plan.durationType}
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                    <div className="space-y-2 mb-6">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            feature.isIncluded ? 'bg-green-400' : 'bg-gray-300'
                          }`}></span>
                          <span className={feature.isIncluded ? 'text-gray-900' : 'text-gray-500'}>
                            {feature.name}
                          </span>
                        </div>
                      ))}
                      {plan.features.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{plan.features.length - 3} more features
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditPlanModal(plan)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => deletePlan(plan._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by user, email..."
                    value={transactionFilters.search}
                    onChange={(e) => handleTransactionFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={transactionFilters.status}
                  onChange={(e) => handleTransactionFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setTransactionFilters({ status: '', search: '' });
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Transactions ({totalTransactions})</h2>
            </div>

            {transactionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{transaction.user.name}</div>
                            <div className="text-sm text-gray-500">{transaction.user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{transaction.plan.name}</div>
                          <div className="text-sm text-gray-500">{formatCurrency(transaction.plan.price)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(transaction.finalAmount)}</div>
                          {transaction.discountAmount && transaction.discountAmount > 0 && (
                            <div className="text-sm text-green-600">
                              -{formatCurrency(transaction.discountAmount)} discount
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openViewTransactionModal(transaction)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Plan Modal */}
      {(showCreatePlanModal || showEditPlanModal) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {showEditPlanModal ? 'Edit Plan' : 'Create New Plan'}
              </h3>
              
              <form onSubmit={handlePlanSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                    <input
                      type="text"
                      required
                      value={planFormData.name}
                      onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={planFormData.price}
                      onChange={(e) => setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={planFormData.duration}
                      onChange={(e) => setPlanFormData({ ...planFormData, duration: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration Type *</label>
                    <select
                      required
                      value={planFormData.durationType}
                      onChange={(e) => setPlanFormData({ ...planFormData, durationType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={planFormData.description}
                    onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Features */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Features</label>
                    <button
                      type="button"
                      onClick={addFeature}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Add Feature
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {planFormData.features.map((feature, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                        <div className="md:col-span-4">
                          <input
                            type="text"
                            placeholder="Feature name"
                            value={feature.name}
                            onChange={(e) => updateFeature(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="md:col-span-5">
                          <input
                            type="text"
                            placeholder="Feature description"
                            value={feature.description}
                            onChange={(e) => updateFeature(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2 flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={feature.isIncluded}
                              onChange={(e) => updateFeature(index, 'isIncluded', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Included</span>
                          </label>
                        </div>
                        <div className="md:col-span-1">
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={planFormData.isActive}
                      onChange={(e) => setPlanFormData({ ...planFormData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={planFormData.isPopular}
                      onChange={(e) => setPlanFormData({ ...planFormData, isPopular: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Popular</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreatePlanModal(false);
                      setShowEditPlanModal(false);
                      resetPlanForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    {showEditPlanModal ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Transaction Modal */}
      {showViewTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Details</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedTransaction._id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                      {selectedTransaction.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.user.name}</p>
                    <p className="text-sm text-gray-500">{selectedTransaction.user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.plan.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Original Amount</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Final Amount</label>
                    <p className="text-sm text-gray-900 font-semibold">{formatCurrency(selectedTransaction.finalAmount)}</p>
                  </div>
                  {selectedTransaction.discountAmount && selectedTransaction.discountAmount > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Discount</label>
                      <p className="text-sm text-green-600">{formatCurrency(selectedTransaction.discountAmount)}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.paymentMethod}</p>
                  </div>
                  {selectedTransaction.referralCode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Referral Code</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedTransaction.referralCode}</p>
                    </div>
                  )}
                  {selectedTransaction.razorpayOrderId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Razorpay Order ID</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedTransaction.razorpayOrderId}</p>
                    </div>
                  )}
                  {selectedTransaction.razorpayPaymentId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Razorpay Payment ID</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedTransaction.razorpayPaymentId}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedTransaction.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Updated</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedTransaction.updatedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowViewTransactionModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
