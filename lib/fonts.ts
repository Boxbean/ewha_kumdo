// Pretendard 가변 폰트 단일 파일(PretendardVariable.woff2)은 한글 전체 글리프가 들어 있어 약 2MB —
// 모바일에서 첫 로딩 대역폭 대부분을 차지하던 원인이라, 공식 "dynamic subset" 빌드로 교체함.
// 글자 범위(unicode-range)별로 90여 개 조각으로 나뉘어 있어 브라우저가 화면에 실제로 쓰인 글자가 속한 조각만 받음.
// @font-face 선언은 app/layout.tsx에서 CSS로 import
export const PRETENDARD_FAMILY = "'Pretendard Variable'";
