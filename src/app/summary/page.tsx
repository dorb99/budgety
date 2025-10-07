import Layout from '@/components/Layout';
import SummaryPage from '@/components/SummaryPage';

export default function Summary() {
  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Expenses Summary
          </h1>
          <SummaryPage />
        </div>
      </div>
    </Layout>
  );
}
