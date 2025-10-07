import Layout from '@/components/Layout';
import BudgetsPage from '@/components/BudgetsPage';

export default function Budgets() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Budgets
          </h1>
          <BudgetsPage />
        </div>
      </div>
    </Layout>
  );
}
