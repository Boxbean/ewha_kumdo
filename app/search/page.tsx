import { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import PageLoading from '@/components/PageLoading';
import SearchResults from './SearchResults';

// 검색은 홈(/?search=)에서 분리 — 홈은 서버에서 미리 그려 캐시하는데, 주소의 검색어를 읽으면 캐시할 수 없기 때문
// 예전 주소(/?search=)는 next.config.mjs에서 이 페이지로 리다이렉트
export default function SearchPage() {
  return (
    <AppLayout>
      <Suspense fallback={<PageLoading />}>
        <SearchResults />
      </Suspense>
    </AppLayout>
  );
}
