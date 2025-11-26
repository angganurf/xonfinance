from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Header, Depends, UploadFile, File
from fastapi.responses import StreamingResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import httpx
import base64

# WIB Timezone (UTC+7)
WIB = timezone(timedelta(hours=7))

def now_wib():
    """Get current datetime in WIB timezone"""
    return datetime.now(WIB)
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    email: str
    username: Optional[str] = None
    name: str
    picture: Optional[str] = None
    role: str  # Primary role or single role (for backward compatibility)
    roles: Optional[List[str]] = []  # Multiple roles support
    password_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: now_wib())

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: now_wib())

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # interior/arsitektur
    description: Optional[str] = None
    contract_date: Optional[datetime] = None
    duration: Optional[int] = None  # days
    location: Optional[str] = None
    project_value: Optional[float] = 0.0  # nilai pekerjaan
    status: str = "active"  # active, waiting, completed
    phase: str = "perencanaan"  # perencanaan, pelaksanaan
    design_progress: Optional[int] = 0  # progress desain 0-100%
    created_by: str
    created_at: datetime = Field(default_factory=lambda: now_wib())

class RAB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: Optional[str] = None  # Will be set when approved
    project_name: str
    project_type: Optional[str] = "interior"  # interior, arsitektur
    client_name: Optional[str] = None
    location: Optional[str] = None
    status: str = "draft"  # draft, bidding_process, approved, rejected
    discount: float = 0.0
    tax: float = 11.0  # percentage
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: now_wib())
    approved_at: Optional[datetime] = None
    rejected_reason: Optional[str] = None

class RABItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rab_id: str
    project_id: str
    category: str  # persiapan, struktur, dinding, finishing, etc (custom)
    description: str
    unit_price: float
    quantity: float
    unit: str  # m³, m, m²
    total: float
    created_at: datetime = Field(default_factory=lambda: now_wib())

class TransactionItem(BaseModel):
    description: str
    quantity: float
    unit: str
    unit_price: float
    total: float
    status: Optional[str] = "receiving"  # receiving or out_warehouse
    supplier: Optional[str] = None  # nama toko/supplier

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    category: str  # upah, bahan, alat, vendor, operasional, kas_masuk, aset, hutang
    description: str
    amount: float
    items: Optional[List[TransactionItem]] = []  # for multiple items (bahan)
    quantity: Optional[float] = None
    unit: Optional[str] = None
    status: Optional[str] = None  # for aset: custom status like "Aktif", "Maintenance", etc
    receipt: Optional[str] = None  # base64 image
    created_by: str
    transaction_date: datetime = Field(default_factory=lambda: now_wib())
    created_at: datetime = Field(default_factory=lambda: now_wib())

class TimeScheduleItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    description: str
    value: float
    duration_days: int
    start_week: int
    created_at: datetime = Field(default_factory=lambda: now_wib())

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    role: Optional[str] = None  # drafter, employee, etc
    status: str = "pending"  # pending, in_progress, completed
    priority: str = "medium"  # low, medium, high
    start_date: datetime = Field(default_factory=lambda: now_wib())
    duration_days: Optional[int] = None  # durasi pengerjaan dalam hari
    due_date: Optional[datetime] = None  # deadline (auto calculated)
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: now_wib())

class WorkReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    employee_id: str
    report: str
    progress: int  # 0-100
    photos: Optional[List[str]] = []  # base64 images
    created_at: datetime = Field(default_factory=lambda: now_wib())

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    type: str  # info, warning, success, error
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: now_wib())

class Inventory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_name: str
    category: str  # bahan, alat
    quantity_in_warehouse: float = 0.0  # Stok di gudang (Receiving)
    quantity_out_warehouse: float = 0.0  # Stok belum sampai gudang (Out Warehouse)
    quantity: float = 0.0  # Total quantity (calculated field for compatibility)
    unit: str
    unit_price: float
    total_value: float
    project_id: str
    project_type: str = "arsitektur"  # interior, arsitektur (dari project type)
    transaction_id: str
    status: str = "Tersedia"  # Status kondisi: Tersedia, Order, Habis, Bagus, Rusak, dll
    created_at: datetime = Field(default_factory=lambda: now_wib())
    updated_at: datetime = Field(default_factory=lambda: now_wib())

class WarehouseTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    inventory_id: str
    item_name: str
    quantity: float
    unit: str
    project_id: str
    project_name: str
    usage_type: str  # production, return, adjustment
    notes: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: now_wib())

# ============= INPUT MODELS =============

class RegisterInput(BaseModel):
    email: str
    username: str
    password: str
    name: str
    role: str  # Primary role
    roles: Optional[List[str]] = []  # Additional roles

class LoginInput(BaseModel):
    email: str  # can be email or username
    password: str

class ProjectInput(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    contract_date: Optional[str] = None
    duration: Optional[int] = None
    location: Optional[str] = None
    project_value: Optional[float] = 0.0

class RABInput(BaseModel):
    project_name: str
    project_type: Optional[str] = "interior"
    client_name: Optional[str] = None
    location: Optional[str] = None

class RABItemInput(BaseModel):
    rab_id: str
    project_id: str
    category: str
    description: str
    unit_price: float
    quantity: float
    unit: str

class RABUpdateInput(BaseModel):
    discount: Optional[float] = None
    tax: Optional[float] = None

class TransactionInput(BaseModel):
    project_id: str
    category: str
    description: str
    amount: float
    items: Optional[List[TransactionItem]] = []
    quantity: Optional[float] = None
    unit: Optional[str] = None
    status: Optional[str] = None
    receipt: Optional[str] = None
    transaction_date: Optional[str] = None

class TimeScheduleInput(BaseModel):
    project_id: str
    description: str
    value: float
    duration_days: int
    start_week: int

class TaskInput(BaseModel):
    project_id: str
    title: str
    description: Optional[str] = None
    assigned_to: str
    due_date: Optional[str] = None

class WorkReportInput(BaseModel):
    task_id: str
    report: str
    progress: int
    photos: Optional[List[str]] = []

class InventoryInput(BaseModel):
    item_name: str
    category: str
    quantity: float
    unit: str
    unit_price: float
    project_id: str
    transaction_id: Optional[str] = None
    status: Optional[str] = "Tersedia"

class InventoryUpdateInput(BaseModel):
    item_name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    status: Optional[str] = None

class WarehouseTransactionInput(BaseModel):
    inventory_id: str
    quantity: float
    project_id: str
    notes: Optional[str] = None
    usage_type: str = "production"  # production, return, adjustment

# ============= AUTH HELPERS =============

async def get_current_user(request: Request, authorization: Optional[str] = Header(None)) -> User:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token and authorization:
        if authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session = await db.user_sessions.find_one({"session_token": session_token})
    if not session or datetime.fromisoformat(session["expires_at"]) < now_wib():
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    # Find user
    user_doc = await db.users.find_one({"id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# ============= AUTH ENDPOINTS =============

@api_router.get("/")
async def root():
    return {"message": "XON Architect API", "status": "online"}

@api_router.post("/auth/register")
async def register(input: RegisterInput):
    # Public registration disabled - only admin can create users
    raise HTTPException(status_code=403, detail="Public registration is disabled. Please contact administrator.")

@api_router.post("/auth/login")
async def login(input: LoginInput, response: Response):
    # Find user by email or username
    user_doc = await db.users.find_one(
        {"$or": [{"email": input.email}, {"username": input.email}]}, 
        {"_id": 0}
    )
    if not user_doc or not user_doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(input.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session_token = str(uuid.uuid4())
    expires_at = now_wib() + timedelta(days=7)
    
    session = UserSession(
        user_id=user_doc["id"],
        session_token=session_token,
        expires_at=expires_at
    )
    
    session_dict = session.model_dump()
    session_dict["expires_at"] = session_dict["expires_at"].isoformat()
    session_dict["created_at"] = session_dict["created_at"].isoformat()
    await db.user_sessions.insert_one(session_dict)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    user = User(**user_doc)
    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        },
        "session_token": session_token,
        "token": session_token
    }

@api_router.post("/auth/google")
async def google_auth(request: Request, response: Response):
    data = await request.json()
    session_id = data.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Get session data from Emergent Auth
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        user_data = auth_response.json()
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": user_data["email"]})
    
    if not user_doc:
        # Create new user with default role
        user = User(
            email=user_data["email"],
            name=user_data["name"],
            picture=user_data.get("picture"),
            role="employee"  # default role
        )
        user_dict = user.model_dump(by_alias=True)
        user_dict["created_at"] = user_dict["created_at"].isoformat()
        await db.users.insert_one(user_dict)
        user_id = user.id
    else:
        user_id = user_doc["id"]
    
    # Create session
    session_token = user_data["session_token"]
    expires_at = now_wib() + timedelta(days=7)
    
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at
    )
    
    session_dict = session.model_dump()
    session_dict["expires_at"] = session_dict["expires_at"].isoformat()
    session_dict["created_at"] = session_dict["created_at"].isoformat()
    await db.user_sessions.insert_one(session_dict)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    user_doc = await db.users.find_one({"_id": user_id})
    user = User(**user_doc)
    
    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "picture": user.picture
        },
        "session_token": session_token
    }

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "picture": user.picture
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ============= PROJECT ENDPOINTS =============

@api_router.post("/projects")
async def create_project(input: ProjectInput, user: User = Depends(get_current_user)):
    """
    Create new project
    - Planning team creates 'perencanaan' phase projects
    - Other roles create 'pelaksanaan' phase projects
    """
    # Get user roles
    user_roles = user.roles if isinstance(user.roles, list) else [user.roles] if user.roles else []
    
    # Determine phase based on role
    phase = "perencanaan" if 'project_planning_team' in user_roles else "pelaksanaan"
    
    project = Project(
        name=input.name,
        type=input.type,
        description=input.description,
        contract_date=datetime.fromisoformat(input.contract_date) if input.contract_date else None,
        duration=input.duration,
        location=input.location,
        project_value=input.project_value,
        phase=phase,
        created_by=user.id
    )
    
    project_dict = project.model_dump()
    project_dict["created_at"] = project_dict["created_at"].isoformat()
    if project_dict["contract_date"]:
        project_dict["contract_date"] = project_dict["contract_date"].isoformat()
    
    await db.projects.insert_one(project_dict)
    
    # Create notification for site supervisors
    supervisors = await db.users.find({"role": "site_supervisor"}).to_list(100)
    for supervisor in supervisors:
        notif = Notification(
            user_id=supervisor["id"],
            title="Proyek Baru",
            message=f"Proyek baru '{project.name}' telah dibuat",
            type="info"
        )
        notif_dict = notif.model_dump()
        notif_dict["created_at"] = notif_dict["created_at"].isoformat()
        await db.notifications.insert_one(notif_dict)
    
    return {"message": "Project created", "id": project.id}

@api_router.get("/projects")
async def get_projects(phase: Optional[str] = None, user: User = Depends(get_current_user)):
    """
    Get projects filtered by phase and user role
    - project_planning_team: only see 'perencanaan' projects
    - other roles (accounting, supervisor, etc): only see 'pelaksanaan' projects
    - admin: see all projects
    """
    query = {}
    
    # Get user roles
    user_roles = user.roles if isinstance(user.roles, list) else [user.roles] if user.roles else []
    
    # Filter by phase based on role
    if 'admin' not in user_roles:
        if 'project_planning_team' in user_roles:
            # Planning team only sees perencanaan projects
            query["phase"] = "perencanaan"
        else:
            # Other roles only see pelaksanaan projects
            query["phase"] = "pelaksanaan"
    
    # Allow manual phase filter if provided
    if phase:
        query["phase"] = phase
    
    projects = await db.projects.find(query, {"_id": 0}).to_list(1000)
    for p in projects:
        if isinstance(p.get("created_at"), str):
            p["created_at"] = datetime.fromisoformat(p["created_at"])
        if p.get("contract_date") and isinstance(p["contract_date"], str):
            p["contract_date"] = datetime.fromisoformat(p["contract_date"])
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, user: User = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if isinstance(project.get("created_at"), str):
        project["created_at"] = datetime.fromisoformat(project["created_at"])
    if project.get("contract_date") and isinstance(project["contract_date"], str):
        project["contract_date"] = datetime.fromisoformat(project["contract_date"])
    
    return project

@api_router.patch("/projects/{project_id}")
async def update_project(project_id: str, updates: dict, user: User = Depends(get_current_user)):
    result = await db.projects.update_one({"id": project_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project updated"}

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: User = Depends(get_current_user)):
    # Delete related data
    await db.rab_items.delete_many({"project_id": project_id})
    await db.rabs.delete_many({"project_id": project_id})
    await db.transactions.delete_many({"project_id": project_id})
    await db.schedule_items.delete_many({"project_id": project_id})
    await db.tasks.delete_many({"project_id": project_id})
    
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted"}

@api_router.patch("/projects/{project_id}/design-progress")
async def update_design_progress(project_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update project design progress (0-100%)"""
    progress = data.get("progress", 0)
    if progress < 0 or progress > 100:
        raise HTTPException(status_code=400, detail="Progress must be between 0 and 100")
    
    result = await db.projects.update_one(
        {"id": project_id},
        {"$set": {"design_progress": progress}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"message": "Design progress updated", "progress": progress}

@api_router.get("/planning/overview")
async def get_planning_overview(user: User = Depends(get_current_user)):
    """Get planning team overview: projects, RAB, schedules - Only perencanaan phase"""
    # Get only perencanaan projects
    projects = await db.projects.find({"phase": "perencanaan"}, {"_id": 0}).to_list(1000)
    
    # Get RAB info for each project
    rabs = await db.rabs.find({}, {"_id": 0}).to_list(1000)
    rab_by_project = {}
    for rab in rabs:
        if rab.get("project_id"):
            rab_by_project[rab["project_id"]] = rab
    
    # Get schedule info
    schedules = await db.schedules.find({}, {"_id": 0}).to_list(1000)
    schedule_by_project = {}
    for schedule in schedules:
        schedule_by_project[schedule["project_id"]] = schedule
    
    # Combine data
    result = []
    for project in projects:
        rab_info = rab_by_project.get(project["id"])
        schedule_info = schedule_by_project.get(project["id"])
        
        result.append({
            "project": project,
            "rab": rab_info,
            "schedule": schedule_info,
            "design_progress": project.get("design_progress", 0)
        })
    
    return result

# ============= RAB ENDPOINTS =============

@api_router.post("/rabs")
async def create_rab(input: RABInput, user: User = Depends(get_current_user)):
    rab = RAB(
        project_name=input.project_name,
        project_type=input.project_type or "interior",
        client_name=input.client_name,
        location=input.location,
        created_by=user.email,
        status="draft"
    )
    
    rab_dict = rab.model_dump()
    rab_dict["created_at"] = rab_dict["created_at"].isoformat()
    await db.rabs.insert_one(rab_dict)
    
    return {"message": "RAB created", "id": rab.id}

@api_router.get("/rabs")
async def get_all_rabs(user: User = Depends(get_current_user)):
    rabs = await db.rabs.find({}, {"_id": 0}).to_list(1000)
    return rabs

@api_router.get("/rabs/{rab_id}")
async def get_rab(rab_id: str, user: User = Depends(get_current_user)):
    rab = await db.rabs.find_one({"id": rab_id}, {"_id": 0})
    if not rab:
        raise HTTPException(status_code=404, detail="RAB not found")
    return rab

@api_router.patch("/rabs/{rab_id}")
async def update_rab(rab_id: str, input: RABUpdateInput, user: User = Depends(get_current_user)):
    updates = {}
    if input.discount is not None:
        updates["discount"] = input.discount
    if input.tax is not None:
        updates["tax"] = input.tax
    
    result = await db.rabs.update_one({"id": rab_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="RAB not found")
    return {"message": "RAB updated"}

@api_router.patch("/rabs/{rab_id}/status")
async def update_rab_status(rab_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update RAB status and create/delete project accordingly"""
    rab = await db.rabs.find_one({"id": rab_id}, {"_id": 0})
    if not rab:
        raise HTTPException(status_code=404, detail="RAB not found")
    
    old_status = rab.get("status")
    new_status = data.get("status")
    if new_status not in ["draft", "bidding_process", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    updates = {"status": new_status}
    
    # If changing FROM approved TO other status, delete the associated project
    if old_status == "approved" and new_status != "approved":
        project_id = rab.get("project_id")
        if project_id:
            # Delete project and related data
            await db.projects.delete_one({"id": project_id})
            # Also delete transactions related to this project
            await db.transactions.delete_many({"project_id": project_id})
            # Delete inventory related to this project
            await db.inventory.delete_many({"project_id": project_id})
            # Delete schedules and tasks
            await db.schedules.delete_many({"project_id": project_id})
            await db.tasks.delete_many({"project_id": project_id})
            
            updates["project_id"] = None
            updates["approved_at"] = None
    
    # If changing TO approved, create project automatically
    if new_status == "approved":
        # Calculate total from RAB items
        rab_items = await db.rab_items.find({"rab_id": rab_id}, {"_id": 0}).to_list(1000)
        subtotal = sum(item.get("total", 0) for item in rab_items)
        discount = rab.get("discount", 0)
        tax_percent = rab.get("tax", 11)
        
        after_discount = subtotal - discount
        tax_amount = after_discount * (tax_percent / 100)
        grand_total = after_discount + tax_amount
        
        # Create project with phase = pelaksanaan (approved RAB = execution phase)
        project = Project(
            name=rab["project_name"],
            type=rab.get("project_type", "interior"),
            description=f"Project from RAB: {rab['project_name']}",
            location=rab.get("location"),
            project_value=grand_total,
            status="active",
            phase="pelaksanaan",  # Project pelaksanaan after RAB approved
            created_by=user.email
        )
        
        project_dict = project.model_dump()
        project_dict["created_at"] = project_dict["created_at"].isoformat()
        if project_dict.get("contract_date"):
            project_dict["contract_date"] = project_dict["contract_date"].isoformat()
        
        await db.projects.insert_one(project_dict)
        
        # Update RAB with project_id and approved timestamp
        updates["project_id"] = project.id
        updates["approved_at"] = now_wib().isoformat()
    
    # If rejected, store reason
    if new_status == "rejected":
        updates["rejected_reason"] = data.get("rejected_reason", "")
    
    # Update RAB
    await db.rabs.update_one({"id": rab_id}, {"$set": updates})
    
    if new_status == "approved":
        return {"message": "RAB approved and project created", "project_id": project.id}
    elif old_status == "approved" and new_status != "approved":
        return {"message": f"RAB status updated to {new_status} and project deleted"}
    
    return {"message": f"RAB status updated to {new_status}"}

@api_router.post("/rabs/{rab_id}/approve")
async def approve_rab(rab_id: str, user: User = Depends(get_current_user)):
    """Legacy endpoint - redirects to update_rab_status"""
    return await update_rab_status(rab_id, {"status": "approved"}, user)

@api_router.delete("/rabs/{rab_id}")
async def delete_rab(rab_id: str, user: User = Depends(get_current_user)):
    # Delete all items first
    await db.rab_items.delete_many({"rab_id": rab_id})
    
    result = await db.rabs.delete_one({"id": rab_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="RAB not found")
    return {"message": "RAB deleted"}

@api_router.post("/rab-items")
async def create_rab_item(input: RABItemInput, user: User = Depends(get_current_user)):
    total = input.unit_price * input.quantity
    rab_item = RABItem(
        rab_id=input.rab_id,
        project_id=input.project_id,
        category=input.category,
        description=input.description,
        unit_price=input.unit_price,
        quantity=input.quantity,
        unit=input.unit,
        total=total
    )
    
    rab_dict = rab_item.model_dump()
    rab_dict["created_at"] = rab_dict["created_at"].isoformat()
    await db.rab_items.insert_one(rab_dict)
    
    return {"message": "RAB item created", "id": rab_item.id}

@api_router.get("/rab-items/{rab_id}")
async def get_rab_items(rab_id: str, user: User = Depends(get_current_user)):
    items = await db.rab_items.find({"rab_id": rab_id}, {"_id": 0}).to_list(1000)
    return items

@api_router.patch("/rab-items/{item_id}")
async def update_rab_item(item_id: str, updates: dict, user: User = Depends(get_current_user)):
    # Recalculate total if unit_price or quantity changed
    if "unit_price" in updates or "quantity" in updates:
        item = await db.rab_items.find_one({"id": item_id})
        if item:
            unit_price = updates.get("unit_price", item["unit_price"])
            quantity = updates.get("quantity", item["quantity"])
            updates["total"] = unit_price * quantity
    
    result = await db.rab_items.update_one({"id": item_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="RAB item not found")
    return {"message": "RAB item updated"}

@api_router.delete("/rab-items/{item_id}")
async def delete_rab_item(item_id: str, user: User = Depends(get_current_user)):
    result = await db.rab_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="RAB item not found")
    return {"message": "RAB item deleted"}

@api_router.get("/rabs/{rab_id}/export")
async def export_rab_pdf(rab_id: str, user: User = Depends(get_current_user)):
    # Get RAB
    rab = await db.rabs.find_one({"id": rab_id}, {"_id": 0})
    if not rab:
        raise HTTPException(status_code=404, detail="RAB not found")
    
    # Get project
    project = await db.projects.find_one({"id": rab["project_id"]}, {"_id": 0})
    
    # Get RAB items
    items = await db.rab_items.find({"rab_id": rab_id}, {"_id": 0}).to_list(1000)
    
    # Create PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    elements.append(Paragraph(f"RAB - {project['name']}", title_style))
    elements.append(Spacer(1, 12))
    
    # Project Info
    info_style = styles['Normal']
    elements.append(Paragraph(f"<b>Tipe:</b> {project.get('type', '-')}", info_style))
    elements.append(Paragraph(f"<b>Lokasi:</b> {project.get('location', '-')}", info_style))
    elements.append(Paragraph(f"<b>Durasi:</b> {project.get('duration', '-')} hari", info_style))
    elements.append(Spacer(1, 20))
    
    # RAB Table
    if items:
        # Group by category
        categories = {}
        for item in items:
            cat = item['category']
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(item)
        
        # Build table data
        table_data = [['No', 'Uraian Pekerjaan', 'Satuan', 'Volume', 'Harga Satuan', 'Jumlah']]
        
        total_all = 0
        no = 1
        for cat, cat_items in categories.items():
            # Category header
            table_data.append([cat.upper(), '', '', '', '', ''])
            
            cat_total = 0
            for item in cat_items:
                table_data.append([
                    str(no),
                    item['description'],
                    item['unit'],
                    f"{item['quantity']:.2f}",
                    f"Rp {item['unit_price']:,.0f}",
                    f"Rp {item['total']:,.0f}"
                ])
                cat_total += item['total']
                no += 1
            
            # Category subtotal
            table_data.append(['', f'Subtotal {cat}', '', '', '', f"Rp {cat_total:,.0f}"])
            total_all += cat_total
        
        # Subtotal, Discount, Tax, Grand Total
        table_data.append(['', 'SUBTOTAL', '', '', '', f"Rp {total_all:,.0f}"])
        
        discount = rab.get('discount', 0)
        tax_rate = rab.get('tax', 11)
        
        if discount > 0:
            discount_amount = total_all * (discount / 100)
            table_data.append(['', f'DISKON ({discount}%)', '', '', '', f"Rp -{discount_amount:,.0f}"])
            total_after_discount = total_all - discount_amount
        else:
            total_after_discount = total_all
        
        tax_amount = total_after_discount * (tax_rate / 100)
        table_data.append(['', f'PAJAK ({tax_rate}%)', '', '', '', f"Rp {tax_amount:,.0f}"])
        
        grand_total = total_after_discount + tax_amount
        table_data.append(['', 'TOTAL', '', '', '', f"Rp {grand_total:,.0f}"])
        
        # Create table
        table = Table(table_data, colWidths=[20*mm, 70*mm, 20*mm, 25*mm, 35*mm, 35*mm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e0e7ff')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        
        elements.append(table)
    else:
        elements.append(Paragraph("Tidak ada data RAB", styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=RAB_{project['name']}.pdf"}
    )

# ============= TRANSACTION ENDPOINTS =============

@api_router.post("/transactions")
async def create_transaction(input: TransactionInput, user: User = Depends(get_current_user)):
    transaction = Transaction(
        project_id=input.project_id,
        category=input.category,
        description=input.description,
        amount=input.amount,
        items=input.items,
        quantity=input.quantity,
        unit=input.unit,
        status=input.status,
        receipt=input.receipt,
        transaction_date=datetime.fromisoformat(input.transaction_date) if input.transaction_date else now_wib(),
        created_by=user.id
    )
    
    trans_dict = transaction.model_dump()
    trans_dict["transaction_date"] = trans_dict["transaction_date"].isoformat()
    trans_dict["created_at"] = trans_dict["created_at"].isoformat()
    await db.transactions.insert_one(trans_dict)
    
    # Auto-create inventory for 'bahan' or 'alat' category
    if input.category in ['bahan', 'alat']:
        # Get project type
        project = await db.projects.find_one({"id": input.project_id}, {"_id": 0, "type": 1})
        project_type = project.get("type", "arsitektur") if project else "arsitektur"
        
        if input.items and len(input.items) > 0:
            # Handle multiple items (for 'bahan' with items array)
            for item in input.items:
                # Get item status (receiving or out_warehouse)
                item_status = item.status if hasattr(item, 'status') and item.status else 'receiving'
                
                # Check if item already exists in inventory
                existing = await db.inventory.find_one({
                    "item_name": item.description,
                    "category": input.category,
                    "project_id": input.project_id
                })
                
                if existing:
                    # Update existing inventory quantity based on status
                    if item_status == 'receiving':
                        new_qty_in_warehouse = existing.get("quantity_in_warehouse", 0) + item.quantity
                        new_qty_out_warehouse = existing.get("quantity_out_warehouse", 0)
                    else:  # out_warehouse
                        new_qty_in_warehouse = existing.get("quantity_in_warehouse", 0)
                        new_qty_out_warehouse = existing.get("quantity_out_warehouse", 0) + item.quantity
                    
                    new_total_quantity = new_qty_in_warehouse + new_qty_out_warehouse
                    new_total_value = new_total_quantity * item.unit_price
                    
                    await db.inventory.update_one(
                        {"id": existing["id"]},
                        {"$set": {
                            "quantity_in_warehouse": new_qty_in_warehouse,
                            "quantity_out_warehouse": new_qty_out_warehouse,
                            "quantity": new_total_quantity,
                            "total_value": new_total_value,
                            "unit_price": item.unit_price,
                            "updated_at": now_wib().isoformat()
                        }}
                    )
                else:
                    # Create new inventory item
                    qty_in_warehouse = item.quantity if item_status == 'receiving' else 0
                    qty_out_warehouse = item.quantity if item_status == 'out_warehouse' else 0
                    
                    inventory = Inventory(
                        item_name=item.description,
                        category=input.category,
                        quantity_in_warehouse=qty_in_warehouse,
                        quantity_out_warehouse=qty_out_warehouse,
                        quantity=item.quantity,
                        unit=item.unit,
                        unit_price=item.unit_price,
                        total_value=item.total,
                        project_id=input.project_id,
                        project_type=project_type,
                        transaction_id=transaction.id,
                        status="Tersedia"
                    )
                    inv_dict = inventory.model_dump()
                    inv_dict["created_at"] = inv_dict["created_at"].isoformat()
                    inv_dict["updated_at"] = inv_dict["updated_at"].isoformat()
                    await db.inventory.insert_one(inv_dict)
        elif input.quantity and input.unit:
            # Handle single item (for 'alat' or simple 'bahan')
            # Use status from input (default to receiving if not provided)
            item_status = input.status if input.status else 'receiving'
            
            existing = await db.inventory.find_one({
                "item_name": input.description,
                "category": input.category,
                "project_id": input.project_id
            })
            
            unit_price = input.amount / input.quantity if input.quantity > 0 else input.amount
            
            if existing:
                # Update existing inventory quantity based on status
                if item_status == 'receiving':
                    new_qty_in_warehouse = existing.get("quantity_in_warehouse", 0) + input.quantity
                    new_qty_out_warehouse = existing.get("quantity_out_warehouse", 0)
                else:  # out_warehouse
                    new_qty_in_warehouse = existing.get("quantity_in_warehouse", 0)
                    new_qty_out_warehouse = existing.get("quantity_out_warehouse", 0) + input.quantity
                
                new_total_quantity = new_qty_in_warehouse + new_qty_out_warehouse
                new_total_value = new_total_quantity * unit_price
                
                await db.inventory.update_one(
                    {"id": existing["id"]},
                    {"$set": {
                        "quantity_in_warehouse": new_qty_in_warehouse,
                        "quantity_out_warehouse": new_qty_out_warehouse,
                        "quantity": new_total_quantity,
                        "total_value": new_total_value,
                        "unit_price": unit_price,
                        "updated_at": now_wib().isoformat()
                    }}
                )
            else:
                # Create new inventory item
                qty_in_warehouse = input.quantity if item_status == 'receiving' else 0
                qty_out_warehouse = input.quantity if item_status == 'out_warehouse' else 0
                
                inventory = Inventory(
                    item_name=input.description,
                    category=input.category,
                    quantity_in_warehouse=qty_in_warehouse,
                    quantity_out_warehouse=qty_out_warehouse,
                    quantity=input.quantity,
                    unit=input.unit,
                    unit_price=unit_price,
                    total_value=input.amount,
                    project_id=input.project_id,
                    project_type=project_type,
                    transaction_id=transaction.id,
                    status="Tersedia"
                )
                inv_dict = inventory.model_dump()
                inv_dict["created_at"] = inv_dict["created_at"].isoformat()
                inv_dict["updated_at"] = inv_dict["updated_at"].isoformat()
                await db.inventory.insert_one(inv_dict)
    
    # Notify accounting
    accountants = await db.users.find({"role": "accounting"}).to_list(100)
    for acc in accountants:
        notif = Notification(
            user_id=acc["id"],
            title="Transaksi Baru",
            message=f"Transaksi {input.category} sebesar Rp {input.amount:,.0f}",
            type="info"
        )
        notif_dict = notif.model_dump()
        notif_dict["created_at"] = notif_dict["created_at"].isoformat()
        await db.notifications.insert_one(notif_dict)
    
    return {"message": "Transaction created", "id": transaction.id}

@api_router.get("/transactions")
async def get_transactions(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    query = {"project_id": project_id} if project_id else {}
    transactions = await db.transactions.find(query, {"_id": 0}).to_list(1000)
    return transactions

@api_router.get("/transactions/recent")
async def get_recent_transactions(user: User = Depends(get_current_user)):
    transactions = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    
    # Enrich each transaction with project name
    for trans in transactions:
        project = await db.projects.find_one({"id": trans.get("project_id")}, {"_id": 0, "name": 1})
        trans["project_name"] = project.get("name") if project else "Unknown Project"
    
    return transactions

@api_router.patch("/transactions/{transaction_id}")
async def update_transaction(transaction_id: str, updates: dict, user: User = Depends(get_current_user)):
    result = await db.transactions.update_one({"id": transaction_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction updated"}

@api_router.put("/transactions/{transaction_id}/item-status")
async def update_transaction_item_status(
    transaction_id: str, 
    item_index: int,
    new_status: str,
    user: User = Depends(get_current_user)
):
    """Update status of a specific item in transaction and sync with inventory"""
    # Get transaction
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if not transaction.get("items") or item_index >= len(transaction["items"]):
        raise HTTPException(status_code=400, detail="Item index out of range")
    
    item = transaction["items"][item_index]
    old_status = item.get("status", "receiving")
    
    # Update transaction item status
    await db.transactions.update_one(
        {"id": transaction_id},
        {"$set": {f"items.{item_index}.status": new_status}}
    )
    
    # Sync with inventory
    inventory_item = await db.inventory.find_one({
        "item_name": item["description"],
        "category": transaction["category"],
        "project_id": transaction["project_id"]
    })
    
    if inventory_item:
        quantity = item["quantity"]
        
        # Calculate new quantities based on status change
        if old_status == "receiving" and new_status == "out_warehouse":
            # Move from in_warehouse to out_warehouse
            new_in_warehouse = inventory_item.get("quantity_in_warehouse", 0) - quantity
            new_out_warehouse = inventory_item.get("quantity_out_warehouse", 0) + quantity
        elif old_status == "out_warehouse" and new_status == "receiving":
            # Move from out_warehouse to in_warehouse
            new_in_warehouse = inventory_item.get("quantity_in_warehouse", 0) + quantity
            new_out_warehouse = inventory_item.get("quantity_out_warehouse", 0) - quantity
        else:
            # No change needed
            return {"message": "Status updated"}
        
        # Update inventory
        final_in_warehouse = max(0, new_in_warehouse)
        final_out_warehouse = max(0, new_out_warehouse)
        final_total = final_in_warehouse + final_out_warehouse
        
        await db.inventory.update_one(
            {"id": inventory_item["id"]},
            {"$set": {
                "quantity_in_warehouse": final_in_warehouse,
                "quantity_out_warehouse": final_out_warehouse,
                "quantity": final_total,
                "updated_at": now_wib().isoformat()
            }}
        )
    
    return {"message": "Item status updated and inventory synced"}

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, user: User = Depends(get_current_user)):
    # Delete related inventory items
    await db.inventory.delete_many({"transaction_id": transaction_id})
    
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted"}

# ============= INVENTORY ENDPOINTS =============

@api_router.get("/inventory/item-names")
async def get_inventory_item_names(category: Optional[str] = None, project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    """Get unique item names from inventory for autocomplete"""
    query = {}
    if category:
        query["category"] = category
    if project_id:
        query["project_id"] = project_id
    
    # Get distinct item names
    item_names = await db.inventory.distinct("item_name", query)
    
    return {"item_names": sorted(item_names)}

@api_router.get("/inventory/suppliers")
async def get_suppliers(user: User = Depends(get_current_user)):
    """Get unique supplier names for autocomplete"""
    # Get all transactions with items
    transactions = await db.transactions.find(
        {"category": {"$in": ["bahan", "alat"]}, "items": {"$exists": True}},
        {"_id": 0, "items": 1}
    ).to_list(10000)
    
    # Extract unique suppliers
    suppliers = set()
    for trans in transactions:
        for item in trans.get("items", []):
            supplier = item.get("supplier")
            if supplier:
                suppliers.add(supplier)
    
    return {"suppliers": sorted(list(suppliers))}

@api_router.get("/inventory/price-comparison")
async def get_price_comparison(
    item_name: Optional[str] = None, 
    project_type: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Get price comparison for items across suppliers"""
    # Get all transactions with items
    query = {"category": "bahan", "items": {"$exists": True}}
    transactions = await db.transactions.find(query, {"_id": 0}).to_list(10000)
    
    # If project_type filter is provided, get project IDs of that type
    project_ids_filter = None
    if project_type:
        projects = await db.projects.find({"type": project_type}, {"_id": 0, "id": 1}).to_list(1000)
        project_ids_filter = {p["id"] for p in projects}
        # If project_type is provided but no projects found, return empty results
        if not project_ids_filter:
            return []
    
    # Build price comparison data
    comparison = {}
    
    for trans in transactions:
        # Filter by project_type if provided
        if project_ids_filter is not None and trans.get("project_id") not in project_ids_filter:
            continue
            
        for item in trans.get("items", []):
            item_desc = item.get("description")
            supplier = item.get("supplier", "Tidak ada nama toko")
            unit_price = item.get("unit_price", 0)
            unit = item.get("unit", "")
            
            # Filter by item_name if provided
            if item_name and item_desc != item_name:
                continue
            
            if item_desc not in comparison:
                comparison[item_desc] = {
                    "item_name": item_desc,
                    "unit": unit,
                    "suppliers": {}
                }
            
            if supplier not in comparison[item_desc]["suppliers"]:
                comparison[item_desc]["suppliers"][supplier] = {
                    "supplier": supplier,
                    "prices": []
                }
            
            comparison[item_desc]["suppliers"][supplier]["prices"].append({
                "price": unit_price,
                "date": trans.get("transaction_date")
            })
    
    # Calculate average and latest price for each supplier
    result = []
    for item_desc, data in comparison.items():
        suppliers_data = []
        for supplier, supplier_info in data["suppliers"].items():
            prices = supplier_info["prices"]
            avg_price = sum(p["price"] for p in prices) / len(prices)
            latest_price = sorted(prices, key=lambda x: x["date"], reverse=True)[0]["price"]
            
            suppliers_data.append({
                "supplier": supplier,
                "latest_price": latest_price,
                "average_price": avg_price,
                "transaction_count": len(prices)
            })
        
        result.append({
            "item_name": item_desc,
            "unit": data["unit"],
            "suppliers": sorted(suppliers_data, key=lambda x: x["latest_price"])
        })
    
    return sorted(result, key=lambda x: x["item_name"])

@api_router.get("/inventory")
async def get_inventory(category: Optional[str] = None, user: User = Depends(get_current_user)):
    query = {}
    if category and category != "all":
        query["category"] = category
    
    inventory_items = await db.inventory.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich with project name
    for item in inventory_items:
        project = await db.projects.find_one({"id": item.get("project_id")}, {"_id": 0, "name": 1})
        item["project_name"] = project.get("name") if project else "Unknown Project"
    
    return inventory_items

@api_router.get("/inventory/{inventory_id}")
async def get_inventory_item(inventory_id: str, user: User = Depends(get_current_user)):
    item = await db.inventory.find_one({"id": inventory_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Enrich with project name
    project = await db.projects.find_one({"id": item.get("project_id")}, {"_id": 0, "name": 1})
    item["project_name"] = project.get("name") if project else "Unknown Project"
    
    return item

@api_router.get("/inventory/{inventory_id}/breakdown-by-supplier")
async def get_inventory_breakdown_by_supplier(inventory_id: str, user: User = Depends(get_current_user)):
    """Get inventory breakdown by supplier/store"""
    # Get inventory item
    item = await db.inventory.find_one({"id": inventory_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Find all transactions for this item
    transactions = await db.transactions.find({
        "category": item["category"],
        "project_id": item["project_id"]
    }, {"_id": 0}).to_list(1000)
    
    # Build breakdown by supplier
    breakdown = {}
    
    for trans in transactions:
        if trans.get("items"):
            # Handle items array
            for trans_item in trans["items"]:
                if trans_item["description"] == item["item_name"]:
                    supplier = trans_item.get("supplier") or "Tidak ada nama toko"
                    status = trans_item.get("status", "receiving")
                    quantity = trans_item["quantity"]
                    
                    if supplier not in breakdown:
                        breakdown[supplier] = {
                            "in_warehouse": 0,
                            "out_warehouse": 0,
                            "total": 0
                        }
                    
                    if status == "receiving":
                        breakdown[supplier]["in_warehouse"] += quantity
                    else:
                        breakdown[supplier]["out_warehouse"] += quantity
                    
                    breakdown[supplier]["total"] += quantity
    
    # Convert to list
    result = [
        {
            "supplier": supplier,
            "in_warehouse": data["in_warehouse"],
            "out_warehouse": data["out_warehouse"],
            "total": data["total"]
        }
        for supplier, data in breakdown.items()
    ]
    
    return {
        "item_name": item["item_name"],
        "total_in_warehouse": item.get("quantity_in_warehouse", 0),
        "total_out_warehouse": item.get("quantity_out_warehouse", 0),
        "total_quantity": item.get("quantity", 0),
        "breakdown": result
    }

@api_router.post("/inventory")
async def create_inventory(input: InventoryInput, user: User = Depends(get_current_user)):
    total_value = input.quantity * input.unit_price
    
    inventory = Inventory(
        item_name=input.item_name,
        category=input.category,
        quantity=input.quantity,
        unit=input.unit,
        unit_price=input.unit_price,
        total_value=total_value,
        project_id=input.project_id,
        transaction_id=input.transaction_id or "",
        status=input.status
    )
    
    inv_dict = inventory.model_dump()
    inv_dict["created_at"] = inv_dict["created_at"].isoformat()
    inv_dict["updated_at"] = inv_dict["updated_at"].isoformat()
    await db.inventory.insert_one(inv_dict)
    
    return {"message": "Inventory item created", "id": inventory.id}

@api_router.put("/inventory/{inventory_id}")
async def update_inventory(inventory_id: str, input: InventoryUpdateInput, user: User = Depends(get_current_user)):
    existing = await db.inventory.find_one({"id": inventory_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    updates = {}
    if input.item_name is not None:
        updates["item_name"] = input.item_name
    if input.quantity is not None:
        updates["quantity"] = input.quantity
    if input.unit is not None:
        updates["unit"] = input.unit
    if input.unit_price is not None:
        updates["unit_price"] = input.unit_price
    if input.status is not None:
        updates["status"] = input.status
    
    # Recalculate total_value if quantity or unit_price changed
    if "quantity" in updates or "unit_price" in updates:
        quantity = updates.get("quantity", existing["quantity"])
        unit_price = updates.get("unit_price", existing["unit_price"])
        updates["total_value"] = quantity * unit_price
    
    updates["updated_at"] = now_wib().isoformat()
    
    await db.inventory.update_one({"id": inventory_id}, {"$set": updates})
    
    return {"message": "Inventory item updated"}

@api_router.delete("/inventory/{inventory_id}")
async def delete_inventory(inventory_id: str, user: User = Depends(get_current_user)):
    result = await db.inventory.delete_one({"id": inventory_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return {"message": "Inventory item deleted"}

# ============= WAREHOUSE TRANSACTION ENDPOINTS =============

@api_router.post("/inventory/warehouse-transaction")
async def create_warehouse_transaction(input: WarehouseTransactionInput, user: User = Depends(get_current_user)):
    """Create warehouse transaction for production usage"""
    # Get inventory item
    inventory = await db.inventory.find_one({"id": input.inventory_id}, {"_id": 0})
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Check if enough stock in warehouse
    if inventory.get("quantity_in_warehouse", 0) < input.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Stok tidak cukup. Tersedia: {inventory.get('quantity_in_warehouse', 0)}, Diminta: {input.quantity}"
        )
    
    # Get project name
    project = await db.projects.find_one({"id": input.project_id}, {"_id": 0, "name": 1})
    project_name = project.get("name") if project else "Unknown Project"
    
    # Create warehouse transaction record
    warehouse_trans = WarehouseTransaction(
        inventory_id=input.inventory_id,
        item_name=inventory["item_name"],
        quantity=input.quantity,
        unit=inventory["unit"],
        project_id=input.project_id,
        project_name=project_name,
        usage_type=input.usage_type,
        notes=input.notes,
        created_by=user.id
    )
    
    trans_dict = warehouse_trans.model_dump()
    trans_dict["created_at"] = trans_dict["created_at"].isoformat()
    await db.warehouse_transactions.insert_one(trans_dict)
    
    # Update inventory - reduce quantity in warehouse
    new_qty_in_warehouse = inventory.get("quantity_in_warehouse", 0) - input.quantity
    new_total_qty = new_qty_in_warehouse + inventory.get("quantity_out_warehouse", 0)
    
    await db.inventory.update_one(
        {"id": input.inventory_id},
        {"$set": {
            "quantity_in_warehouse": new_qty_in_warehouse,
            "quantity": new_total_qty,
            "updated_at": now_wib().isoformat()
        }}
    )
    
    return {"message": "Warehouse transaction created", "id": warehouse_trans.id}

@api_router.get("/inventory/usage-report")
async def get_inventory_usage_report(
    project_id: Optional[str] = None,
    category: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Get inventory usage report by project"""
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    # Get all warehouse transactions
    transactions = await db.warehouse_transactions.find(query, {"_id": 0}).to_list(10000)
    
    # Group by project and item
    report = {}
    for trans in transactions:
        proj_id = trans["project_id"]
        proj_name = trans["project_name"]
        item_name = trans["item_name"]
        
        if proj_id not in report:
            report[proj_id] = {
                "project_id": proj_id,
                "project_name": proj_name,
                "items": {}
            }
        
        if item_name not in report[proj_id]["items"]:
            report[proj_id]["items"][item_name] = {
                "item_name": item_name,
                "total_quantity": 0,
                "unit": trans["unit"],
                "usage_type": trans["usage_type"],
                "transactions": []
            }
        
        report[proj_id]["items"][item_name]["total_quantity"] += trans["quantity"]
        report[proj_id]["items"][item_name]["transactions"].append({
            "quantity": trans["quantity"],
            "notes": trans.get("notes"),
            "created_at": trans["created_at"]
        })
    
    # Convert to list format
    result = []
    for proj_id, proj_data in report.items():
        result.append({
            "project_id": proj_data["project_id"],
            "project_name": proj_data["project_name"],
            "items": list(proj_data["items"].values())
        })
    
    return result

# ============= FINANCIAL ENDPOINTS =============

@api_router.get("/financial/summary")
async def get_financial_summary(user: User = Depends(get_current_user)):
    # Get all transactions
    all_transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    
    # Calculate totals from transactions
    total_income = 0  # Kas Masuk
    total_cogs = 0
    total_opex = 0
    total_assets = 0  # Pembelian Aset
    total_liabilities = 0  # Hutang
    
    for trans in all_transactions:
        amount = trans.get('amount', 0)
        category = trans.get('category', '')
        
        if category in ['kas_masuk', 'uang_masuk']:
            total_income += amount
        elif category == 'bahan':
            total_cogs += amount
        elif category in ['upah', 'alat']:
            total_cogs += amount
        elif category in ['operasional', 'vendor']:
            total_opex += amount
        elif category == 'aset':
            total_assets += amount
        elif category == 'hutang':
            total_liabilities += amount
    
    # Get all projects and sum project values
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    total_project_value = 0
    for project in projects:
        total_project_value += project.get('project_value', 0)
    
    # Total Revenue = Project Values + Kas Masuk + Hutang
    total_revenue = total_project_value + total_income + total_liabilities
    
    # Saldo Kas = Kas Masuk + Hutang - Pengeluaran - Aset
    cash_balance = total_income + total_liabilities - total_cogs - total_opex - total_assets
    
    # Laba Bersih = Total Revenue - Total Pengeluaran - Aset
    net_profit = total_revenue - total_cogs - total_opex - total_assets
    
    # Total Aset = Aset yang dibeli + Cash Balance (jika positif)
    total_assets_value = total_assets + (cash_balance if cash_balance > 0 else 0)
    
    return {
        "cash_balance": cash_balance,
        "net_profit": net_profit,
        "total_assets": total_assets_value,
        "total_revenue": total_revenue,
        "total_income": total_income,
        "total_project_value": total_project_value,
        "total_cogs": total_cogs,
        "total_opex": total_opex,
        "total_assets_purchased": total_assets,
        "total_liabilities": total_liabilities
    }

@api_router.get("/financial/monthly")
async def get_monthly_financial(user: User = Depends(get_current_user)):
    # Get transactions for last 6 months
    six_months_ago = now_wib() - timedelta(days=180)
    transactions = await db.transactions.find({
        "transaction_date": {"$gte": six_months_ago.isoformat()}
    }, {"_id": 0}).to_list(10000)
    
    # Group by month
    monthly_data = {}
    for trans in transactions:
        trans_date = datetime.fromisoformat(trans['transaction_date']) if isinstance(trans['transaction_date'], str) else trans['transaction_date']
        month_key = trans_date.strftime('%Y-%m')
        
        if month_key not in monthly_data:
            monthly_data[month_key] = {
                'revenue': 0,
                'income': 0,
                'cogs': 0,
                'opex': 0,
                'net_profit': 0
            }
        
        amount = trans.get('amount', 0)
        category = trans.get('category', '')
        
        if category in ['kas_masuk', 'uang_masuk']:
            monthly_data[month_key]['income'] += amount
            monthly_data[month_key]['revenue'] += amount
        elif category in ['bahan', 'upah', 'alat']:
            monthly_data[month_key]['cogs'] += amount
        elif category in ['operasional', 'vendor']:
            monthly_data[month_key]['opex'] += amount
    
    # Calculate net profit for each month
    for month in monthly_data:
        monthly_data[month]['net_profit'] = monthly_data[month]['revenue'] - monthly_data[month]['cogs'] - monthly_data[month]['opex']
    
    return monthly_data

@api_router.get("/financial/project-allocation")
async def get_project_allocation(user: User = Depends(get_current_user)):
    projects = await db.projects.find({"status": "active"}, {"_id": 0}).to_list(1000)
    
    allocation = []
    for project in projects:
        transactions = await db.transactions.find({"project_id": project['id']}, {"_id": 0}).to_list(1000)
        total = sum(t.get('amount', 0) for t in transactions)
        
        allocation.append({
            "name": project['name'],
            "value": total
        })
    
    return allocation

@api_router.get("/financial/projects-progress")
async def get_projects_progress(user: User = Depends(get_current_user)):
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    
    projects_progress = []
    for project in projects:
        project_value = project.get('project_value', 0)
        
        # Get transactions for this project
        transactions = await db.transactions.find({"project_id": project['id']}, {"_id": 0}).to_list(1000)
        
        # Calculate income and expenses
        income = 0
        expenses = 0
        
        for trans in transactions:
            amount = trans.get('amount', 0)
            category = trans.get('category', '')
            
            if category in ['kas_masuk', 'uang_masuk']:
                income += amount
            else:
                expenses += amount
        
        # Calculate percentages
        income_percentage = (income / project_value * 100) if project_value > 0 else 0
        expenses_percentage = (expenses / project_value * 100) if project_value > 0 else 0
        remaining_percentage = 100 - income_percentage if income_percentage <= 100 else 0
        
        projects_progress.append({
            "project_id": project['id'],
            "project_name": project['name'],
            "project_value": project_value,
            "income": income,
            "expenses": expenses,
            "balance": income - expenses,
            "income_percentage": round(income_percentage, 1),
            "expenses_percentage": round(expenses_percentage, 1),
            "remaining_percentage": round(remaining_percentage, 1),
            "status": project.get('status', 'active')
        })
    
    return projects_progress

@api_router.get("/financial/project/{project_id}")
async def get_project_financial(project_id: str, user: User = Depends(get_current_user)):
    # Get project
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get transactions
    transactions = await db.transactions.find({"project_id": project_id}, {"_id": 0}).to_list(10000)
    
    total_income = 0
    total_expense = 0
    
    for trans in transactions:
        amount = trans.get('amount', 0)
        category = trans.get('category', '')
        
        if category in ['uang_masuk', 'kas_masuk']:
            total_income += amount
        else:
            total_expense += amount
    
    net = total_income - total_expense
    
    return {
        "project": project,
        "total_income": total_income,
        "total_expense": total_expense,
        "net": net,
        "transactions": transactions
    }

# ============= TIME SCHEDULE ENDPOINTS =============

@api_router.post("/schedule")
async def create_schedule_item(input: TimeScheduleInput, user: User = Depends(get_current_user)):
    item = TimeScheduleItem(
        project_id=input.project_id,
        description=input.description,
        value=input.value,
        duration_days=input.duration_days,
        start_week=input.start_week
    )
    
    item_dict = item.model_dump()
    item_dict["created_at"] = item_dict["created_at"].isoformat()
    await db.schedule_items.insert_one(item_dict)
    
    return {"message": "Schedule item created", "id": item.id}

@api_router.get("/schedule/{project_id}")
async def get_schedule_items(project_id: str, user: User = Depends(get_current_user)):
    items = await db.schedule_items.find({"project_id": project_id}, {"_id": 0}).to_list(1000)
    return items

# ============= TASK ENDPOINTS =============

@api_router.post("/tasks")
async def create_task(input: TaskInput, user: User = Depends(get_current_user)):
    from datetime import timedelta
    
    # Start date is now (WIB)
    start_date = now_wib()
    
    # Calculate due_date if duration_days is provided
    due_date = None
    if hasattr(input, 'duration_days') and input.duration_days:
        due_date = start_date + timedelta(days=input.duration_days)
    elif input.due_date:
        due_date = datetime.fromisoformat(input.due_date)
    
    task = Task(
        project_id=input.project_id if hasattr(input, 'project_id') else None,
        title=input.title,
        description=input.description if hasattr(input, 'description') else None,
        assigned_to=input.assigned_to if hasattr(input, 'assigned_to') else None,
        role=input.role if hasattr(input, 'role') else None,
        priority=input.priority if hasattr(input, 'priority') else "medium",
        start_date=start_date,
        duration_days=input.duration_days if hasattr(input, 'duration_days') else None,
        due_date=due_date
    )
    
    task_dict = task.model_dump()
    task_dict["created_at"] = task_dict["created_at"].isoformat()
    task_dict["start_date"] = task_dict["start_date"].isoformat()
    if task_dict.get("due_date"):
        task_dict["due_date"] = task_dict["due_date"].isoformat()
    await db.tasks.insert_one(task_dict)
    
    # Notify assigned employee if assigned_to is provided
    if input.assigned_to:
        notif = Notification(
            user_id=input.assigned_to,
            title="Tugas Baru",
            message=f"Anda mendapat tugas: {input.title}",
            type="info"
        )
        notif_dict = notif.model_dump()
        notif_dict["created_at"] = notif_dict["created_at"].isoformat()
        await db.notifications.insert_one(notif_dict)
    
    return {"message": "Task created", "id": task.id}

@api_router.get("/tasks")
async def get_tasks(assigned_to: Optional[str] = None, user: User = Depends(get_current_user)):
    query = {"assigned_to": assigned_to} if assigned_to else {}
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    return tasks

@api_router.patch("/tasks/{task_id}")
async def update_task(task_id: str, updates: dict, user: User = Depends(get_current_user)):
    if updates.get('status') == 'completed' and 'completed_at' not in updates:
        updates['completed_at'] = now_wib().isoformat()
    
    result = await db.tasks.update_one({"id": task_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task updated"}

@api_router.patch("/tasks/{task_id}/status")
async def update_task_status(task_id: str, data: dict, user: User = Depends(get_current_user)):
    """Update task status"""
    updates = {"status": data.get("status")}
    if data.get("status") == "completed":
        updates["completed_at"] = now_wib().isoformat()
    
    result = await db.tasks.update_one({"id": task_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task status updated"}

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: User = Depends(get_current_user)):
    """Delete task"""
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

@api_router.post("/tasks/{task_id}/report")
async def create_work_report(task_id: str, input: WorkReportInput, user: User = Depends(get_current_user)):
    report = WorkReport(
        task_id=task_id,
        employee_id=user.id,
        report=input.report,
        progress=input.progress,
        photos=input.photos
    )
    
    report_dict = report.model_dump()
    report_dict["created_at"] = report_dict["created_at"].isoformat()
    await db.work_reports.insert_one(report_dict)
    
    # Update task progress
    await db.tasks.update_one(
        {"id": task_id},
        {"$set": {"status": "in_progress" if input.progress < 100 else "completed"}}
    )
    
    return {"message": "Work report created", "id": report.id}

@api_router.get("/tasks/{task_id}/reports")
async def get_work_reports(task_id: str, user: User = Depends(get_current_user)):
    reports = await db.work_reports.find({"task_id": task_id}, {"_id": 0}).to_list(1000)
    return reports

# ============= NOTIFICATION ENDPOINTS =============

@api_router.get("/notifications")
async def get_notifications(user: User = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": user.id}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return notifications

@api_router.patch("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user: User = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notif_id, "user_id": user.id},
        {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@api_router.get("/notifications/unread/count")
async def get_unread_count(user: User = Depends(get_current_user)):
    count = await db.notifications.count_documents({"user_id": user.id, "read": False})
    return {"count": count}

# ============= USER ENDPOINTS =============

@api_router.get("/users")
async def get_users(role: Optional[str] = None, user: User = Depends(get_current_user)):
    query = {"role": role} if role else {}
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

# ============= ADMIN MEMBER MANAGEMENT ENDPOINTS =============

@api_router.get("/admin/members")
async def get_all_members(user: User = Depends(get_current_user)):
    # Only admin can access
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.post("/admin/members")
async def create_member(input: RegisterInput, user: User = Depends(get_current_user)):
    # Only admin can create users
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    # Check if email exists
    existing = await db.users.find_one({"email": input.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username exists
    existing_username = await db.users.find_one({"username": input.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user
    new_user = User(
        email=input.email,
        username=input.username,
        name=input.name,
        role=input.role,
        password_hash=hash_password(input.password)
    )
    
    user_dict = new_user.model_dump(by_alias=False)
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    await db.users.insert_one(user_dict)
    
    return {"message": "User created successfully", "id": new_user.id}

@api_router.patch("/admin/members/{user_id}")
async def update_member(user_id: str, update_data: dict, user: User = Depends(get_current_user)):
    # Only admin can update users
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    # Find user
    existing_user = await db.users.find_one({"id": user_id})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prepare update data
    update_fields = {}
    if "name" in update_data:
        update_fields["name"] = update_data["name"]
    if "email" in update_data:
        # Check if email already used by another user
        email_check = await db.users.find_one({"email": update_data["email"], "id": {"$ne": user_id}})
        if email_check:
            raise HTTPException(status_code=400, detail="Email already used by another user")
        update_fields["email"] = update_data["email"]
    if "username" in update_data:
        # Check if username already used by another user
        username_check = await db.users.find_one({"username": update_data["username"], "id": {"$ne": user_id}})
        if username_check:
            raise HTTPException(status_code=400, detail="Username already used by another user")
        update_fields["username"] = update_data["username"]
    if "role" in update_data:
        update_fields["role"] = update_data["role"]
    if "roles" in update_data:
        update_fields["roles"] = update_data["roles"]
    if "password" in update_data and update_data["password"]:
        update_fields["password_hash"] = hash_password(update_data["password"])
    
    if update_fields:
        await db.users.update_one({"id": user_id}, {"$set": update_fields})
    
    return {"message": "User updated successfully"}

@api_router.delete("/admin/members/{user_id}")
async def delete_member(user_id: str, user: User = Depends(get_current_user)):
    # Only admin can delete users
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    # Prevent admin from deleting themselves
    if user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    # Find and delete user
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete user sessions
    await db.user_sessions.delete_many({"user_id": user_id})
    
    return {"message": "User deleted successfully"}

@api_router.post("/admin/members/bulk-delete")
async def bulk_delete_members(request: Request, user: User = Depends(get_current_user)):
    # Only admin can delete users
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    # Get user_ids from request body
    data = await request.json()
    user_ids = data if isinstance(data, list) else data.get("user_ids", [])
    
    if not user_ids:
        raise HTTPException(status_code=400, detail="No user IDs provided")
    
    # Prevent admin from deleting themselves
    if user.id in user_ids:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    # Delete users
    result = await db.users.delete_many({"id": {"$in": user_ids}})
    
    # Delete user sessions
    await db.user_sessions.delete_many({"user_id": {"$in": user_ids}})
    
    return {"message": f"{result.deleted_count} users deleted successfully", "deleted_count": result.deleted_count}

@api_router.patch("/admin/members/bulk-update")
async def bulk_update_members(data: dict, user: User = Depends(get_current_user)):
    # Only admin can update users
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    user_ids = data.get("user_ids", [])
    update_fields = data.get("update_fields", {})
    
    if not user_ids or not update_fields:
        raise HTTPException(status_code=400, detail="user_ids and update_fields are required")
    
    # Update users
    result = await db.users.update_many(
        {"id": {"$in": user_ids}},
        {"$set": update_fields}
    )
    
    return {"message": f"{result.modified_count} users updated successfully", "modified_count": result.modified_count}

# ============= BACKUP & RESTORE ENDPOINTS =============

@api_router.post("/admin/backup")
async def create_backup(user: User = Depends(get_current_user)):
    """Create a backup of all database collections"""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    try:
        # Get all data from collections
        collections_to_backup = ['projects', 'transactions', 'users', 'inventory', 'rabs', 'rab_items', 'schedules', 'tasks']
        backup_data = {}
        
        for collection_name in collections_to_backup:
            collection = db[collection_name]
            data = await collection.find({}, {"_id": 0}).to_list(10000)
            backup_data[collection_name] = data
        
        # Create backup document
        backup_doc = {
            "id": str(uuid.uuid4()),
            "timestamp": now_wib().isoformat(),
            "created_by": user.email,
            "data": backup_data,
            "collections_count": {name: len(backup_data[name]) for name in collections_to_backup}
        }
        
        # Store backup in database
        await db.backups.insert_one(backup_doc)
        
        return {
            "id": backup_doc["id"],
            "timestamp": backup_doc["timestamp"],
            "created_by": backup_doc["created_by"],
            "collections_count": backup_doc["collections_count"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

@api_router.get("/admin/backups")
async def list_backups(user: User = Depends(get_current_user)):
    """List all available backups"""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    try:
        backups = await db.backups.find({}, {"_id": 0, "data": 0}).to_list(1000)
        # Sort by timestamp descending (newest first)
        backups.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return backups
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list backups: {str(e)}")

@api_router.post("/admin/restore/{backup_id}")
async def restore_backup(backup_id: str, user: User = Depends(get_current_user)):
    """Restore database from a specific backup"""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    try:
        # Get backup document
        backup = await db.backups.find_one({"id": backup_id}, {"_id": 0})
        if not backup:
            raise HTTPException(status_code=404, detail="Backup not found")
        
        backup_data = backup.get("data", {})
        
        # Clear existing data (except backups and user sessions)
        collections_to_restore = ['projects', 'transactions', 'inventory', 'rabs', 'rab_items', 'schedules', 'tasks']
        
        for collection_name in collections_to_restore:
            await db[collection_name].delete_many({})
        
        # Restore data
        restored_count = {}
        for collection_name, data in backup_data.items():
            if collection_name in collections_to_restore and data:
                collection = db[collection_name]
                if len(data) > 0:
                    await collection.insert_many(data)
                restored_count[collection_name] = len(data)
        
        # Don't restore users to prevent locking out current admin
        # But track the count
        restored_count['users'] = f"Skipped (current users preserved)"
        
        return {
            "message": "Restore completed successfully",
            "backup_id": backup_id,
            "backup_timestamp": backup.get("timestamp"),
            "restored_count": restored_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")

@api_router.delete("/admin/backups/{backup_id}")
async def delete_backup(backup_id: str, user: User = Depends(get_current_user)):
    """Delete a specific backup"""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    try:
        result = await db.backups.delete_one({"id": backup_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Backup not found")
        
        return {"message": "Backup deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete backup: {str(e)}")

@api_router.post("/admin/clear-all-data")
async def clear_all_data(user: User = Depends(get_current_user)):
    """Clear all data from database (except users and backups)"""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    try:
        collections_to_clear = ['projects', 'transactions', 'inventory', 'rabs', 'rab_items', 'schedules', 'tasks']
        
        deleted_count = {}
        for collection_name in collections_to_clear:
            result = await db[collection_name].delete_many({})
            deleted_count[collection_name] = result.deleted_count
        
        return {
            "message": "All data cleared successfully",
            "deleted_count": deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear data: {str(e)}")

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()