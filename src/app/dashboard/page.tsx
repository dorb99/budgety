import Layout from '@/components/Layout';
import AddTransactionForm from '@/components/AddTransactionForm';

export default function DashboardPage() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Add Transaction
          </h1>
          <AddTransactionForm />
        </div>
      </div>
    </Layout>
  );
}
