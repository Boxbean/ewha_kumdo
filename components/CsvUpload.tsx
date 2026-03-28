'use client';

import { useState } from 'react';
import Papa from 'papaparse';

interface CsvRow {
  youtube_url: string;
  date: string;
  angle: string;
  participants: string;
  title: string;
  topic?: string;
}

interface CsvUploadProps {
  onSuccess: () => void;
}

export default function CsvUpload({ onSuccess }: CsvUploadProps) {
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
      const parsed = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });
      if (parsed.errors.length > 0) {
        setError('CSV 파싱 오류: ' + parsed.errors[0].message);
        return;
      }
      setRows(parsed.data);
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
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
          CSV 파일 선택
        </label>
        <p className="text-xs mb-2" style={{ color: '#B9B9B9' }}>
          컬럼 순서: youtube_url, date, angle, participants, title, topic
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="text-sm"
        />
        {fileName && <span className="ml-2 text-sm" style={{ color: '#374151' }}>{fileName}</span>}
      </div>

      {/* 미리보기 */}
      {rows.length > 0 && (
        <div className="mb-3 overflow-x-auto">
          <p className="text-sm mb-1" style={{ color: '#374151' }}>
            미리보기 ({rows.length}개):
          </p>
          <table className="text-xs border-collapse" style={{ minWidth: '400px' }}>
            <thead>
              <tr style={{ backgroundColor: '#FFFDF1' }}>
                {['youtube_url', 'date', 'angle', 'participants', 'title', 'topic'].map((col) => (
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
