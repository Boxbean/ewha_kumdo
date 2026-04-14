import os
import csv
import urllib.request
import json
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# ── 설정 ──────────────────────────────────────────────────────────────
SCRIPT_DIR    = os.path.dirname(os.path.abspath(__file__))
CLIENT_SECRET = os.path.join(SCRIPT_DIR, "client_secret.json")
OUTPUT_CSV    = os.path.join(SCRIPT_DIR, "videos_template_fetched.csv")
ENV_FILE      = os.path.join(SCRIPT_DIR, ".env.local")
SCOPES        = ["https://www.googleapis.com/auth/youtube.readonly"]
# ──────────────────────────────────────────────────────────────────────


def load_env(path: str) -> dict:
    """`.env.local` 파일에서 환경변수를 읽어 dict로 반환"""
    env = {}
    if not os.path.exists(path):
        return env
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            env[key.strip()] = val.strip()
    return env


def fetch_existing_dates(supabase_url: str, anon_key: str) -> set:
    """Supabase REST API로 이미 등록된 영상의 날짜 집합을 반환"""
    url = f"{supabase_url}/rest/v1/videos?select=date"
    req = urllib.request.Request(url, headers={
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
    })
    existing_dates = set()
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            existing_dates = {row["date"] for row in data if row.get("date")}
        print(f"기존 등록 날짜 {len(existing_dates)}개 조회 완료")
    except Exception as e:
        print(f"[경고] 기존 날짜 조회 실패: {e}\n중복 체크 없이 진행합니다.")
    return existing_dates


def get_youtube_service():
    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET, SCOPES)
    credentials = flow.run_local_server(port=0)
    return build("youtube", "v3", credentials=credentials)


def fetch_all_videos(youtube):
    videos = []
    page_token = None

    while True:
        request = youtube.search().list(
            part="id",
            forMine=True,
            type="video",
            maxResults=50,
            pageToken=page_token,
        )
        response = request.execute()

        video_ids = [item["id"]["videoId"] for item in response.get("items", [])]
        if video_ids:
            detail_resp = youtube.videos().list(
                part="snippet,status",
                id=",".join(video_ids),
            ).execute()

            for item in detail_resp.get("items", []):
                vid_id    = item["id"]
                snippet   = item["snippet"]
                published = snippet.get("publishedAt", "")[:10]  # YYYY-MM-DD
                title     = snippet.get("title", "")

                videos.append({
                    "youtube_url": f"https://www.youtube.com/watch?v={vid_id}",
                    "published_date": published,
                    "title": title,
                })

        page_token = response.get("nextPageToken")
        if not page_token:
            break

    return videos


def write_csv(videos, existing_dates: set):
    fieldnames = [
        "번호", "링크", "날짜", "앵글", "참가자(선택)", "제목", "주제(선택)", "등록자(선택)",
    ]
    skipped = 0
    written = 0

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        num = 1
        for v in videos:
            if v["published_date"] in existing_dates:
                skipped += 1
                continue
            writer.writerow({
                "번호":        num,
                "링크":        v["youtube_url"],
                "날짜":        v["published_date"],
                "앵글":        "",
                "참가자(선택)": "",
                "제목":        v["title"],
                "주제(선택)":  "",
                "등록자(선택)": "",
            })
            num += 1
            written += 1

    print(f"\n결과: 총 {len(videos)}개 중 {written}개 기록, {skipped}개 중복 날짜로 건너뜀")
    print(f"저장 위치: {OUTPUT_CSV}")


def main():
    # 1. 환경변수 로드
    env = load_env(ENV_FILE)
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    anon_key     = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

    # 2. 기존 등록 날짜 조회
    existing_dates = set()
    if supabase_url and anon_key:
        existing_dates = fetch_existing_dates(supabase_url, anon_key)
    else:
        print("[경고] Supabase 환경변수를 찾지 못했습니다. 중복 체크 없이 진행합니다.")

    # 3. YouTube 인증 & 영상 목록 조회
    print("\nYouTube 계정에 연결 중... 브라우저가 열립니다.")
    youtube = get_youtube_service()
    print("영상 목록을 가져오는 중...")
    videos = fetch_all_videos(youtube)
    print(f"총 {len(videos)}개 영상 발견")

    # 4. CSV 저장 (중복 날짜 제외)
    write_csv(videos, existing_dates)


if __name__ == "__main__":
    main()
