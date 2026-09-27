import { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import PageLoading from '@/components/PageLoading';
import HomeContent from './HomeContent';

export default function HomePage() {
  return (
    <AppLayout>
      <Suspense
        fallback={<PageLoading />}
      >
        <HomeContent />
      </Suspense>
    </AppLayout>
  );
}
