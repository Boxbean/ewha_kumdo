import AppLayout from '@/components/AppLayout';
import FeedbackComposer from '@/components/FeedbackComposer';

interface Props {
  searchParams: Promise<{ video?: string }>;
}

// 피드백 요청 작성 화면 — 영상 상세의 "피드백 요청" 버튼에서 오면 ?video=<id>로 영상이 미리 선택됨
export default async function FeedbackNewPage({ searchParams }: Props) {
  const { video } = await searchParams;
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <FeedbackComposer initialVideoId={video || null} />
      </div>
    </AppLayout>
  );
}
