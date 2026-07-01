"""
이미 Supabase에 잘못 저장된 참가자 정보를 수정합니다.
참가자 배열 내 공백·쉼표 등이 포함된 항목을 개별 이름으로 분리합니다.

실행:
    python fix_participants.py
"""

import os
import re
import json
import urllib.request
import urllib.parse

# ── 설정 ─────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_FILE   = os.path.join(SCRIPT_DIR, ".env.local")
SEP        = re.compile(r"[\s,\-\/|·]+")
# ──────────────────────────────────────────────────────────


def load_env(path: str) -> dict:
    env = {}
    if not os.path.exists(path):
        return env
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()
    return env


def supabase_request(url: str, anon_key: str, method="GET", body=None):
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw.strip() else None


def split_names(names: list[str]) -> list[str]:
    """이미 배열이지만 개별 항목 내에 구분자가 남아있는 경우 다시 분리"""
    result = []
    for name in names:
        parts = [p.strip() for p in SEP.split(name) if p.strip()]
        result.extend(parts)
    # 중복 제거 (순서 유지)
    seen = set()
    deduped = []
    for p in result:
        if p not in seen:
            seen.add(p)
            deduped.append(p)
    return deduped


def main():
    env = load_env(ENV_FILE)
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    anon_key     = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

    if not supabase_url or not anon_key:
        print("오류: .env.local에서 Supabase 정보를 찾을 수 없습니다.")
        return

    # 1. 전체 영상 조회 (id + participants)
    print("Supabase에서 영상 목록 조회 중...")
    videos = supabase_request(
        f"{supabase_url}/rest/v1/videos?select=id,participants",
        anon_key,
    )
    print(f"총 {len(videos)}개 영상 조회됨")

    # 2. 수정이 필요한 영상 필터링 (참가자 항목 중 공백이 포함된 것)
    to_fix = []
    for v in videos:
        original = v.get("participants") or []
        if not original:
            continue
        fixed = split_names(original)
        if fixed != original:
            to_fix.append({"id": v["id"], "original": original, "fixed": fixed})

    if not to_fix:
        print("수정이 필요한 영상이 없습니다.")
        return

    print(f"\n수정 대상: {len(to_fix)}개")
    for item in to_fix[:5]:
        print(f"  {item['id'][:8]}... | {item['original']} → {item['fixed']}")
    if len(to_fix) > 5:
        print(f"  ... 외 {len(to_fix) - 5}개")

    # 3. 확인 후 업데이트
    confirm = input(f"\n위 {len(to_fix)}개 영상의 참가자 정보를 수정할까요? (y/n): ").strip().lower()
    if confirm != "y":
        print("취소됨")
        return

    success = 0
    fail = 0
    for item in to_fix:
        try:
            supabase_request(
                f"{supabase_url}/rest/v1/videos?id=eq.{item['id']}",
                anon_key,
                method="PATCH",
                body={"participants": item["fixed"]},
            )
            success += 1
        except Exception as e:
            print(f"  [실패] {item['id']}: {e}")
            fail += 1

    print(f"\n완료: {success}개 수정, {fail}개 실패")


if __name__ == "__main__":
    main()
