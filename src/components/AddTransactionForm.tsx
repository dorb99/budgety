'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  displayName: string;
  isOwner: boolean;
}

export default function AddTransactionForm() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    newCategory: '',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchCategories();
    fetchUser();
  }, []);

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

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let categoryId = formData.categoryId;

      // Create new category if needed
      if (formData.newCategory.trim()) {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: formData.newCategory.trim() }),
        });

        if (response.ok) {
          const newCategory = await response.json();
          categoryId = newCategory.id;
          setCategories(prev => [...prev, newCategory]);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create category');
        }
      }

      // Create transaction
      const transactionResponse = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          categoryId,
          note: formData.note.trim() || null,
          occurredAt: new Date(formData.date).toISOString(),
        }),
      });

      if (transactionResponse.ok) {
        setSuccess('Transaction added successfully!');
        setFormData({
          amount: '',
          categoryId: '',
          newCategory: '',
          note: '',
          date: format(new Date(), 'yyyy-MM-dd'),
        });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await transactionResponse.json();
        throw new Error(errorData.error || 'Failed to add transaction');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear new category when selecting existing category
    if (field === 'categoryId' && value) {
      setFormData(prev => ({ ...prev, newCategory: '' }));
    }
    
    // Clear existing category when typing new category
    if (field === 'newCategory' && value) {
      setFormData(prev => ({ ...prev, categoryId: '' }));
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount (ILS)
          </label>
          <input
            type="number"
            id="amount"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <div className="space-y-2">
            <select
              value={formData.categoryId}
              onChange={(e) => handleInputChange('categoryId', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select existing category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="text-sm text-gray-500">OR</div>
            <input
              type="text"
              value={formData.newCategory}
              onChange={(e) => handleInputChange('newCategory', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type new category name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="payer" className="block text-sm font-medium text-gray-700">
            Payer
          </label>
          <input
            type="text"
            id="payer"
            value={user?.displayName || ''}
            disabled
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700">
            Note (optional)
          </label>
          <textarea
            id="note"
            value={formData.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add a note..."
          />
        </div>

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

        <div>
          <button
            type="submit"
            disabled={loading || !formData.amount || (!formData.categoryId && !formData.newCategory.trim())}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding Transaction...' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}
