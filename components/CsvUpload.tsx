'use client';

import { useRef, useState } from 'react';
import Papa from 'papaparse';

interface CsvRow {
  youtube_url: string;
  date: string;
  angle: string;
  participants: string;
  title: string;
  topic?: string;
  uploader?: string;
}

// 한글 컬럼명 → 내부 필드명 매핑
const COLUMN_MAP: Record<string, keyof CsvRow> = {
  youtube_url: 'youtube_url',
  링크: 'youtube_url',
  date: 'date',
  날짜: 'date',
  angle: 'angle',
  앵글: 'angle',
  participants: 'participants',
  '참가자(선택)': 'participants',
  참가자: 'participants',
  title: 'title',
  제목: 'title',
  topic: 'topic',
  '주제(선택)': 'topic',
  주제: 'topic',
  uploader: 'uploader',
  '등록자(선택)': 'uploader',
  등록자: 'uploader',
};

interface CsvUploadProps {
  onSuccess: () => void;
}

export default function CsvUpload({ onSuccess }: CsvUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    setResult('');

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
      if (parsed.errors.length > 0) {
        setError('CSV 파싱 오류: ' + parsed.errors[0].message);
        return;
      }
      // 한글/영문 컬럼명 → 내부 필드명 변환
      const mapped = parsed.data.map((raw) => {
        const row: Partial<CsvRow> = {};
        Object.entries(raw).forEach(([col, val]) => {
          const key = COLUMN_MAP[col.trim()];
          if (key) (row as Record<string, string>)[key] = val;
        });
        return row as CsvRow;
      });
      setRows(mapped);
    };
    reader.readAsText(file, 'utf-8');
  }

  async function handleUpload() {
    if (rows.length === 0) return;
    setLoading(true);
    setError('');
    setResult('');
    try {
      const csv = Papa.unparse(rows);
      const password = sessionStorage.getItem('admin_pwd');
      if (!password) throw new Error('세션이 만료되었습니다. 페이지를 새로고침 후 다시 로그인해주세요.');

      const res = await fetch('/api/videos/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ csv }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '업로드 실패');
      setResult(`${json.count}개 영상이 등록되었습니다.`);
      setRows([]);
      setFileName('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* 가이드 텍스트 */}
      <div
        className="rounded-lg p-4 mb-5 text-sm"
        style={{ backgroundColor: '#F8FBF9', border: '1px solid #d1e8dc' }}
      >
        <p className="font-semibold mb-2" style={{ color: '#00462A' }}>
          CSV 파일 영상 일괄 등록 가이드
        </p>
        <p className="mb-2" style={{ color: '#374151' }}>
          CSV 파일을 사용해서 여러 개의 영상을 일괄적으로 등록할 수 있습니다.
        </p>
        <p className="font-medium mb-1" style={{ color: '#374151' }}>— 사용방법 —</p>
        <ol className="space-y-1 pl-1" style={{ color: '#374151' }}>
          <li>1. 아래 템플릿을 다운받고, 엑셀 프로그램 혹은 구글 스프레드시트에서 열어주세요.</li>
          <li>2. 양식에 맞춰 업로드할 영상의 정보를 적어주세요. <span style={{ color: '#B9B9B9' }}>(참가자, 주제, 등록자 열은 선택사항입니다.)</span></li>
          <li>3. CSV 파일 형식으로 저장 후, &lsquo;파일 업로드하기&rsquo;를 눌러 업로드해주세요.</li>
          <li>4. 등록 완료!</li>
        </ol>
      </div>

      {/* 버튼 영역 */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* 템플릿 다운로드 버튼 */}
        <a
          href="/videos_template.csv"
          download="videos_template.csv"
          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded border"
          style={{ borderColor: '#00462A', color: '#00462A', backgroundColor: '#fff' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          템플릿 다운로드
        </a>

        {/* 파일 업로드 버튼 */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-medium rounded border"
          style={{ borderColor: '#00462A', color: '#00462A', backgroundColor: '#fff' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          파일 업로드하기
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {/* 선택된 파일명 */}
      {fileName && (
        <p className="text-xs mb-3" style={{ color: '#374151' }}>
          선택된 파일: <span className="font-medium">{fileName}</span>
        </p>
      )}

      {/* 미리보기 */}
      {rows.length > 0 && (
        <div className="mb-3 overflow-x-auto">
          <p className="text-sm mb-1" style={{ color: '#374151' }}>
            미리보기 ({rows.length}개):
          </p>
          <table className="text-xs border-collapse" style={{ minWidth: '400px' }}>
            <thead>
              <tr style={{ backgroundColor: '#FFFDF1' }}>
                {['링크', '날짜', '앵글', '참가자', '제목', '주제', '등록자'].map((col) => (
                  <th
                    key={col}
                    className="border px-2 py-1 text-left font-medium"
                    style={{ borderColor: '#e0e0e0', color: '#374151' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((row, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1 max-w-[120px] truncate" style={{ borderColor: '#e0e0e0' }}>
                    {row.youtube_url}
                  </td>
                  <td className="border px-2 py-1" style={{ borderColor: '#e0e0e0' }}>{row.date}</td>
                  <td className="border px-2 py-1" style={{ borderColor: '#e0e0e0' }}>{row.angle}</td>
                  <td className="border px-2 py-1" style={{ borderColor: '#e0e0e0' }}>{row.participants}</td>
                  <td className="border px-2 py-1" style={{ borderColor: '#e0e0e0' }}>{row.title}</td>
                  <td className="border px-2 py-1" style={{ borderColor: '#e0e0e0' }}>{row.topic}</td>
                  <td className="border px-2 py-1" style={{ borderColor: '#e0e0e0' }}>{row.uploader}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 5 && (
            <p className="text-xs mt-1" style={{ color: '#B9B9B9' }}>
              외 {rows.length - 5}개...
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      {result && <p className="text-sm text-green-600 mb-2">{result}</p>}

      {rows.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="h-9 px-5 text-sm font-semibold rounded text-white"
          style={{ backgroundColor: '#00462A', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '업로드 중...' : `${rows.length}개 업로드`}
        </button>
      )}
    </div>
  );
}
