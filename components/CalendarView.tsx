'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Video, Angle } from '@/lib/types';
import AngleBadge from './AngleBadge';

interface CalendarViewProps {
  videos: Video[];
  initialYear: number;
  initialMonth: number; // 0-indexed
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarView({ videos, initialYear, initialMonth }: CalendarViewProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const today = new Date();

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  // 이 달의 영상만 필터링
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthVideos = videos.filter((v) => v.date.startsWith(monthStr));

  // 날짜별 영상 맵: "YYYY-MM-DD" → Video[]
  const videosByDate = new Map<string, Video[]>();
  monthVideos.forEach((v) => {
    const list = videosByDate.get(v.date) || [];
    list.push(v);
    videosByDate.set(v.date, list);
  });

  // 달력 계산
  const firstDay = new Date(year, month, 1).getDay(); // 0=일
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // 6주 채우기
  while (cells.length < 42) cells.push(null);

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
        <h2 className="font-bold text-lg" style={{ color: '#00462A' }}>
          {year}년 {month + 1}월
        </h2>
        <button
          onClick={nextMonth}
          className="w-8 h-8 rounded hover:bg-black/5 flex items-center justify-center text-lg"
        >
          ›
        </button>
      </div>

      {/* 범례 */}
      <div className="flex gap-3 mb-3 flex-wrap">
        {(['전면', '후면', '기타'] as Angle[]).map((a) => (
          <div key={a} className="flex items-center gap-1 text-xs" style={{ color: '#374151' }}>
            <AngleBadge angle={a} />
            <span>{a}</span>
          </div>
        ))}
      </div>

      {/* 달력 테이블 */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '320px' }}>
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
                      className="align-top p-1 border"
                      style={{
                        borderColor: '#e0e0e0',
                        minHeight: '64px',
                        verticalAlign: 'top',
                      }}
                    >
                      {day !== null && (
                        <>
                          {/* 날짜 숫자 */}
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
                          {/* 앵글 배지 */}
                          <div className="flex flex-col gap-0.5">
                            {dayVideos.map((v) => (
                              <Link key={v.id} href={`/video/${v.id}`}>
                                <AngleBadge
                                  angle={v.angle}
                                  className="w-full text-center cursor-pointer hover:opacity-80"
                                />
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
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
