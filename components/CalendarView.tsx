'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Video } from '@/lib/types';
import AngleBadge from './AngleBadge';

interface CalendarViewProps {
  videos: Video[];
  initialYear: number;
  initialMonth: number; // 0-indexed
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const CELL_H = 90; // px — 모든 칸 고정 높이

export default function CalendarView({ videos, initialYear, initialMonth }: CalendarViewProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(initialYear);

  const today = new Date();

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function openPicker() {
    setPickerYear(year);
    setShowPicker(true);
  }

  // 이 달의 영상만 필터링 (date 앞 10자리만 사용해 타임스탬프 suffix 방어)
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthVideos = videos.filter((v) => v.date.slice(0, 7) === monthStr);

  // 날짜별 영상 맵 (키: YYYY-MM-DD 10자리로 정규화)
  const videosByDate = new Map<string, Video[]>();
  monthVideos.forEach((v) => {
    const key = v.date.slice(0, 10);
    const list = videosByDate.get(key) || [];
    list.push(v);
    videosByDate.set(key, list);
  });

  // 달력 계산
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // 마지막 날짜가 있는 주까지만 — 잉여 행 없음
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-8 h-8 rounded hover:bg-black/5 flex items-center justify-center text-lg"
        >
          ‹
        </button>

        {/* 년/월 — 클릭 시 피커 팝업 */}
        <div className="relative">
          <button
            onClick={openPicker}
            className="font-bold text-base px-4 py-1.5 rounded-full"
            style={{ backgroundColor: '#00462A', color: '#FFFDF1' }}
          >
            {year}년 {month + 1}월
          </button>

          {showPicker && (
            <>
              {/* 바깥 클릭 시 닫기 */}
              <div className="fixed inset-0 z-[9]" onClick={() => setShowPicker(false)} />
              <div
                className="absolute z-10 bg-white border rounded-xl shadow-lg p-3 top-full mt-2 left-1/2"
                style={{ transform: 'translateX(-50%)', minWidth: '210px', borderColor: '#e0e0e0' }}
              >
                {/* 피커 내 년도 선택 */}
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setPickerYear(y => y - 1)}
                    className="w-7 h-7 rounded hover:bg-black/5 flex items-center justify-center"
                  >
                    ‹
                  </button>
                  <span className="text-sm font-bold" style={{ color: '#00462A' }}>
                    {pickerYear}년
                  </span>
                  <button
                    onClick={() => setPickerYear(y => y + 1)}
                    className="w-7 h-7 rounded hover:bg-black/5 flex items-center justify-center"
                  >
                    ›
                  </button>
                </div>
                {/* 월 그리드 3×4 */}
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 12 }, (_, i) => {
                    const isSelected = pickerYear === year && i === month;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setYear(pickerYear);
                          setMonth(i);
                          setShowPicker(false);
                        }}
                        className="h-8 text-sm rounded-lg transition-colors"
                        style={{
                          backgroundColor: isSelected ? '#00462A' : 'transparent',
                          color: isSelected ? '#FFFDF1' : '#374151',
                        }}
                      >
                        {i + 1}월
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={nextMonth}
          className="w-8 h-8 rounded hover:bg-black/5 flex items-center justify-center text-lg"
        >
          ›
        </button>
      </div>

      {/* 달력 테이블 — tableLayout fixed + 고정 높이 */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '320px', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {DAY_LABELS.map((d, i) => (
                <th
                  key={d}
                  className="text-xs font-semibold py-1 text-center"
                  style={{ color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#B9B9B9' }}
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((day, di) => {
                  const isToday =
                    day !== null &&
                    today.getFullYear() === year &&
                    today.getMonth() === month &&
                    today.getDate() === day;
                  const dateStr =
                    day !== null
                      ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      : null;
                  const dayVideos = dateStr ? videosByDate.get(dateStr) || [] : [];

                  return (
                    <td
                      key={di}
                      className="border p-0"
                      style={{ borderColor: '#e0e0e0', width: `${100 / 7}%` }}
                    >
                      {/* 고정 높이 + 배지 넘침 숨김 */}
                      <div style={{ height: CELL_H, overflow: 'hidden', padding: '4px' }}>
                        {day !== null && (
                          <>
                            <div className="flex justify-center mb-1">
                              <span
                                className="w-6 h-6 flex items-center justify-center text-xs rounded-full font-medium"
                                style={{
                                  backgroundColor: isToday ? '#00462A' : 'transparent',
                                  color: isToday
                                    ? '#ffffff'
                                    : di === 0
                                    ? '#ef4444'
                                    : di === 6
                                    ? '#3b82f6'
                                    : '#374151',
                                }}
                              >
                                {day}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              {dayVideos.map((v) => (
                                <Link key={v.id} href={`/video/${v.id}`} className="block">
                                  <AngleBadge
                                    angle={v.angle}
                                    className="block w-full text-center cursor-pointer hover:opacity-80"
                                  />
                                </Link>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
