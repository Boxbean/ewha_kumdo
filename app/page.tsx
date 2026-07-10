import { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import HomeContent from './HomeContent';

export default function HomePage() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="py-8 text-center" style={{ color: '#B9B9B9' }}>
            로딩 중...
          </div>
        }
      >
        <HomeContent />
      </Suspense>
    </AppLayout>
  );
}
