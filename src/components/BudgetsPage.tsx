'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';

interface BudgetData {
  categoryId: string;
  categoryName: string;
  defaultBudget: number | null;
  overrideBudget: number | null;
  effectiveBudget: number;
  spent: number;
  left: number;
  hasOverride: boolean;
}

interface BudgetsResponse {
  month: string;
  budgets: BudgetData[];
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/budgets?month=${selectedMonth}`);
      if (response.ok) {
        const data: BudgetsResponse = await response.json();
        setBudgets(data.budgets);
      } else {
        setError('Failed to fetch budgets');
      }
    } catch (error) {
      setError('Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (categoryId: string, currentValue: number) => {
    setEditingBudget(categoryId);
    setEditingValue(currentValue.toString());
  };

  const handleEditCancel = () => {
    setEditingBudget(null);
    setEditingValue('');
  };

  const handleEditSave = async (categoryId: string, isDefault: boolean) => {
    try {
      const amount = parseFloat(editingValue);
      if (isNaN(amount) || amount < 0) {
        setError('Please enter a valid amount');
        return;
      }

      const response = await fetch('/api/budgets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: isDefault ? 'default' : 'override',
          categoryId,
          amount,
          month: isDefault ? null : selectedMonth,
        }),
      });

      if (response.ok) {
        setSuccess('Budget updated successfully!');
        setEditingBudget(null);
        setEditingValue('');
        await fetchBudgets();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update budget');
      }
    } catch (error) {
      setError('Failed to update budget');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  const getMonthName = (monthStr: string) => {
    const date = parseISO(monthStr + '-01');
    return format(date, 'MMMM yyyy');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Loading budgets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            Budgets for {getMonthName(selectedMonth)}
          </h2>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Budgets Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {getMonthName(selectedMonth)} Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Left
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {budgets.map((budget) => (
                <tr key={budget.categoryId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {budget.categoryName}
                  </td>
                  
                  {/* Default Budget */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingBudget === `${budget.categoryId}-default` ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditSave(budget.categoryId, true)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditStart(`${budget.categoryId}-default`, budget.defaultBudget || 0)}
                        className="hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        {budget.defaultBudget ? formatCurrency(budget.defaultBudget) : 'Not set'}
                      </button>
                    )}
                  </td>

                  {/* Month Budget */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingBudget === `${budget.categoryId}-month` ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditSave(budget.categoryId, false)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditStart(`${budget.categoryId}-month`, budget.effectiveBudget)}
                        className="hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        {budget.hasOverride ? (
                          <span className="text-blue-600">
                            {formatCurrency(budget.effectiveBudget)} (override)
                          </span>
                        ) : (
                          formatCurrency(budget.effectiveBudget)
                        )}
                      </button>
                    )}
                  </td>

                  {/* Spent */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(budget.spent)}
                  </td>

                  {/* Left */}
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    budget.left < 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(budget.left)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {budgets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No categories found. Add some transactions to see budgets.
        </div>
      )}
    </div>
  );
}
