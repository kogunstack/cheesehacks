from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import Client, create_client

# ─── Config ──────────────────────────────────────────────────────────────────

load_dotenv()


def _env(key: str, *fallback_keys: str) -> str:
    for k in (key, *fallback_keys):
        val = os.environ.get(k)
        if val:
            return val
    raise RuntimeError(f"Missing env var: {key}")


SUPABASE_URL = _env("SUPABASE_URL", "VITE_SUPABASE_URL")
SUPABASE_ANON_KEY = _env("SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = _env("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = _env("SUPABASE_JWT_SECRET")

# ─── Supabase clients ────────────────────────────────────────────────────────

_service: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def _anon_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


# ─── Pydantic models ─────────────────────────────────────────────────────────


class AuthCredentials(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    user_id: str
    email: str


class Profile(BaseModel):
    id: str
    email: str
    display_name: str | None = None
    avatar_emoji: str = "\U0001f476\U0001f3ff"
    created_at: str


class CommunityCreate(BaseModel):
    name: str
    description: str = ""
    is_public: bool = True


class Community(BaseModel):
    id: str
    user_id: str
    name: str
    description: str
    is_public: bool
    created_at: str


class GoalCreate(BaseModel):
    text: str


class CommunityGoal(BaseModel):
    id: str
    community_id: str
    text: str
    completed: bool
    created_at: str


class FriendRequestCreate(BaseModel):
    to_user_id: str


class FriendRequest(BaseModel):
    id: str
    from_user_id: str
    to_user_id: str
    status: str
    created_at: str


class FriendRequestWithProfile(FriendRequest):
    from_profile: Profile | None = None
    to_profile: Profile | None = None


class Friend(BaseModel):
    id: str
    profile: Profile
    friends_since: str


# ─── FastAPI app ──────────────────────────────────────────────────────────────

app = FastAPI(title="Cheesehacks API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Auth dependency ─────────────────────────────────────────────────────────


async def get_current_user_id(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization.removeprefix("Bearer ")
    try:
        resp = _service.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    if resp is None or resp.user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return resp.user.id


# ─── Helpers ──────────────────────────────────────────────────────────────────


def _profile_from_row(row: dict) -> Profile:
    return Profile(
        id=row["id"],
        email=row["email"],
        display_name=row.get("display_name"),
        avatar_emoji=row.get("avatar_emoji", "\U0001f476\U0001f3ff"),
        created_at=row["created_at"],
    )


# ─── Health ───────────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    return {"status": "ok"}


# ═══════════════════════════════════════════════════════════════════════════════
#  AUTH
# ═══════════════════════════════════════════════════════════════════════════════


@app.post("/auth/signup", response_model=AuthResponse)
async def signup(creds: AuthCredentials):
    client = _anon_client()
    resp = client.auth.sign_up({"email": creds.email, "password": creds.password})
    if resp.user is None:
        raise HTTPException(status_code=400, detail="Signup failed")
    if resp.session is None:
        raise HTTPException(
            status_code=400,
            detail="Signup succeeded but no session returned (email confirmation may be required)",
        )
    return AuthResponse(
        access_token=resp.session.access_token,
        user_id=resp.user.id,
        email=resp.user.email or creds.email,
    )


@app.post("/auth/login", response_model=AuthResponse)
async def login(creds: AuthCredentials):
    client = _anon_client()
    resp = client.auth.sign_in_with_password(
        {"email": creds.email, "password": creds.password}
    )
    if resp.user is None or resp.session is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return AuthResponse(
        access_token=resp.session.access_token,
        user_id=resp.user.id,
        email=resp.user.email or creds.email,
    )


@app.post("/auth/logout")
async def logout(user_id: str = Depends(get_current_user_id)):
    return {"ok": True}


# ═══════════════════════════════════════════════════════════════════════════════
#  FRIENDS
# ═══════════════════════════════════════════════════════════════════════════════


@app.get("/friends", response_model=list[Friend])
async def list_friends(user_id: str = Depends(get_current_user_id)):
    resp = (
        _service.table("friend_requests")
        .select(
            "*, "
            "from_profile:profiles!friend_requests_from_user_id_fkey(*), "
            "to_profile:profiles!friend_requests_to_user_id_fkey(*)"
        )
        .eq("status", "accepted")
        .or_(f"from_user_id.eq.{user_id},to_user_id.eq.{user_id}")
        .execute()
    )
    friends: list[Friend] = []
    for row in resp.data or []:
        profile_row = (
            row["to_profile"] if row["from_user_id"] == user_id else row["from_profile"]
        )
        friends.append(
            Friend(
                id=row["id"],
                profile=_profile_from_row(profile_row),
                friends_since=row["created_at"],
            )
        )
    return friends


@app.get("/friends/requests/incoming", response_model=list[FriendRequestWithProfile])
async def incoming_requests(user_id: str = Depends(get_current_user_id)):
    resp = (
        _service.table("friend_requests")
        .select("*, from_profile:profiles!friend_requests_from_user_id_fkey(*)")
        .eq("to_user_id", user_id)
        .eq("status", "pending")
        .execute()
    )
    results: list[FriendRequestWithProfile] = []
    for row in resp.data or []:
        from_profile = _profile_from_row(row.pop("from_profile"))
        results.append(FriendRequestWithProfile(**row, from_profile=from_profile))
    return results


@app.get("/friends/requests/outgoing", response_model=list[FriendRequestWithProfile])
async def outgoing_requests(user_id: str = Depends(get_current_user_id)):
    resp = (
        _service.table("friend_requests")
        .select("*, to_profile:profiles!friend_requests_to_user_id_fkey(*)")
        .eq("from_user_id", user_id)
        .eq("status", "pending")
        .execute()
    )
    results: list[FriendRequestWithProfile] = []
    for row in resp.data or []:
        to_profile = _profile_from_row(row.pop("to_profile"))
        results.append(FriendRequestWithProfile(**row, to_profile=to_profile))
    return results


@app.get("/friends/search", response_model=list[Profile])
async def search_users(
    q: str = Query(..., min_length=2),
    user_id: str = Depends(get_current_user_id),
):
    resp = (
        _service.table("profiles")
        .select("*")
        .neq("id", user_id)
        .or_(f"email.ilike.%{q}%,display_name.ilike.%{q}%")
        .limit(10)
        .execute()
    )
    return [_profile_from_row(r) for r in resp.data or []]


@app.post("/friends/requests", status_code=201)
async def send_friend_request(
    body: FriendRequestCreate,
    user_id: str = Depends(get_current_user_id),
):
    resp = (
        _service.table("friend_requests")
        .insert({"from_user_id": user_id, "to_user_id": body.to_user_id})
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=400, detail="Failed to send friend request")
    return resp.data[0]


@app.patch("/friends/requests/{request_id}/accept")
async def accept_request(
    request_id: str,
    user_id: str = Depends(get_current_user_id),
):
    resp = (
        _service.table("friend_requests")
        .update({"status": "accepted"})
        .eq("id", request_id)
        .eq("to_user_id", user_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Request not found")
    return resp.data[0]


@app.patch("/friends/requests/{request_id}/decline")
async def decline_request(
    request_id: str,
    user_id: str = Depends(get_current_user_id),
):
    resp = (
        _service.table("friend_requests")
        .update({"status": "declined"})
        .eq("id", request_id)
        .eq("to_user_id", user_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Request not found")
    return resp.data[0]


@app.delete("/friends/{request_id}", status_code=204)
async def remove_friend(
    request_id: str,
    user_id: str = Depends(get_current_user_id),
):
    _service.table("friend_requests").delete().eq("id", request_id).or_(
        f"from_user_id.eq.{user_id},to_user_id.eq.{user_id}"
    ).execute()


# ═══════════════════════════════════════════════════════════════════════════════
#  COMMUNITIES
# ═══════════════════════════════════════════════════════════════════════════════


@app.get("/communities", response_model=list[Community])
async def list_my_communities(user_id: str = Depends(get_current_user_id)):
    resp = (
        _service.table("communities")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data or []


@app.get("/communities/public", response_model=list[Community])
async def list_public_communities(user_id: str = Depends(get_current_user_id)):
    resp = (
        _service.table("communities")
        .select("*")
        .eq("is_public", True)
        .neq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data or []


@app.post("/communities", response_model=Community, status_code=201)
async def create_community(
    body: CommunityCreate,
    user_id: str = Depends(get_current_user_id),
):
    resp = (
        _service.table("communities")
        .insert({
            "user_id": user_id,
            "name": body.name,
            "description": body.description,
            "is_public": body.is_public,
        })
        .select()
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=400, detail="Failed to create community")
    return resp.data


@app.delete("/communities/{community_id}", status_code=204)
async def delete_community(
    community_id: str,
    user_id: str = Depends(get_current_user_id),
):
    _service.table("communities").delete().eq("id", community_id).eq(
        "user_id", user_id
    ).execute()


# ─── Community Goals ──────────────────────────────────────────────────────────


@app.get("/communities/{community_id}/goals", response_model=list[CommunityGoal])
async def list_goals(
    community_id: str,
    _user_id: str = Depends(get_current_user_id),
):
    resp = (
        _service.table("community_goals")
        .select("*")
        .eq("community_id", community_id)
        .execute()
    )
    return resp.data or []


@app.post("/communities/goals/batch", response_model=dict[str, list[CommunityGoal]])
async def batch_goals(
    community_ids: list[str],
    _user_id: str = Depends(get_current_user_id),
):
    if not community_ids:
        return {}
    resp = (
        _service.table("community_goals")
        .select("*")
        .in_("community_id", community_ids)
        .execute()
    )
    grouped: dict[str, list[CommunityGoal]] = {}
    for row in resp.data or []:
        cid = row["community_id"]
        if cid not in grouped:
            grouped[cid] = []
        grouped[cid].append(CommunityGoal(**row))
    return grouped


@app.post("/communities/{community_id}/goals", response_model=CommunityGoal, status_code=201)
async def add_goal(
    community_id: str,
    body: GoalCreate,
    _user_id: str = Depends(get_current_user_id),
):
    resp = (
        _service.table("community_goals")
        .insert({"community_id": community_id, "text": body.text})
        .select()
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=400, detail="Failed to add goal")
    return resp.data


@app.patch("/communities/{community_id}/goals/{goal_id}/toggle", response_model=CommunityGoal)
async def toggle_goal(
    community_id: str,
    goal_id: str,
    _user_id: str = Depends(get_current_user_id),
):
    current = (
        _service.table("community_goals")
        .select("completed")
        .eq("id", goal_id)
        .eq("community_id", community_id)
        .single()
        .execute()
    )
    if not current.data:
        raise HTTPException(status_code=404, detail="Goal not found")

    resp = (
        _service.table("community_goals")
        .update({"completed": not current.data["completed"]})
        .eq("id", goal_id)
        .select()
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=400, detail="Failed to toggle goal")
    return resp.data
