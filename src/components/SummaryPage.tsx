'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { createObjectCsvWriter } from 'csv-writer';

interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  displayName: string;
  isOwner: boolean;
}

interface Transaction {
  id: string;
  amount: number;
  occurredAt: string;
  note?: string;
  category: Category;
  payer: User;
}

interface SpendingByCategory {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
}

interface SpendingByPayer {
  payerId: string;
  payerName: string;
  amount: number;
}

interface SummaryData {
  period: string;
  from: string;
  to: string;
  totalSpending: number;
  spendingByCategory: SpendingByCategory[];
  spendingByPayer: SpendingByPayer[];
  transactions: Transaction[];
}

export default function SummaryPage() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    period: 'this-month',
    categoryIds: [] as string[],
    payer: '',
    from: '',
    to: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        const user = await response.json();
        setUsers([user]);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('period', filters.period);
      
      if (filters.categoryIds.length > 0) {
        filters.categoryIds.forEach(id => params.append('categoryIds[]', id));
      }
      
      if (filters.payer) {
        params.set('payer', filters.payer);
      }
      
      if (filters.period === 'custom') {
        if (filters.from) params.set('from', filters.from);
        if (filters.to) params.set('to', filters.to);
      }

      const response = await fetch(`/api/summary?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSummaryData(data);
      } else {
        setError('Failed to fetch summary data');
      }
    } catch (error) {
      setError('Failed to fetch summary data');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period: string) => {
    setFilters(prev => ({
      ...prev,
      period,
      from: '',
      to: '',
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSummary();
      } else {
        setError('Failed to delete transaction');
      }
    } catch (error) {
      setError('Failed to delete transaction');
    }
  };

  const handleExportCSV = async () => {
    if (!summaryData) return;

    try {
      const csvWriter = createObjectCsvWriter({
        path: 'expenses-export.csv',
        header: [
          { id: 'date', title: 'Date' },
          { id: 'category', title: 'Category' },
          { id: 'amount', title: 'Amount (ILS)' },
          { id: 'payer', title: 'Payer' },
          { id: 'note', title: 'Note' },
        ],
      });

      const records = summaryData.transactions.map(transaction => ({
        date: format(new Date(transaction.occurredAt), 'yyyy-MM-dd'),
        category: transaction.category.name,
        amount: transaction.amount,
        payer: transaction.payer.displayName,
        note: transaction.note || '',
      }));

      await csvWriter.writeRecords(records);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([records.map(r => 
        `${r.date},${r.category},${r.amount},${r.payer},"${r.note}"`
      ).join('\n')], { type: 'text/csv' }));
      link.download = 'expenses-export.csv';
      link.click();
    } catch (error) {
      setError('Failed to export CSV');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'this-month':
        return format(new Date(), 'MMMM yyyy');
      case 'last-month':
        return format(subMonths(new Date(), 1), 'MMMM yyyy');
      case 'custom':
        return 'Custom Range';
      default:
        return period;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Period
            </label>
            <select
              value={filters.period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {filters.period === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From
                </label>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}

          {/* Payer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payer
            </label>
            <select
              value={filters.payer}
              onChange={(e) => setFilters(prev => ({ ...prev, payer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="owner">Owner</option>
              <option value="partner">Partner</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.categoryIds.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{category.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-lg">Loading summary...</div>
        </div>
      ) : summaryData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">Total Spent</h3>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(summaryData.totalSpending)}
              </p>
              <p className="text-sm text-gray-500">{getPeriodLabel(filters.period)}</p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">Transactions</h3>
              <p className="text-3xl font-bold text-green-600">
                {summaryData.transactions.length}
              </p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">Categories</h3>
              <p className="text-3xl font-bold text-purple-600">
                {summaryData.spendingByCategory.length}
              </p>
            </div>
          </div>

          {/* Spending by Category */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Spending by Category</h3>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transactions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summaryData.spendingByCategory.map((item) => (
                    <tr key={item.categoryId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.categoryName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.percentage.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Spending by Payer */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Spending by Payer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summaryData.spendingByPayer.map((item) => (
                <div key={item.payerId} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{item.payerName}</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction List */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Note
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summaryData.transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(transaction.occurredAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.payer.displayName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.note || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
