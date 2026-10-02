from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional

from database import Base, engine, get_db
from models import User, Project
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="ConstructAI API",
    description="Construction cost and material estimation platform",
    version="2.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProjectRequest(BaseModel):
    project_name: str
    construction_type: str
    location: str
    state: str
    built_up_area: int
    floors: int
    rooms: int
    duration_months: int
    quality: str
    structure_type: str
    material_grade: str


class EstimationRequest(BaseModel):
    project_id: int


# ============================================================
# AUTHENTICATION HELPER
# ============================================================

def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization token is required.",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization format.",
        )

    token = authorization.replace("Bearer ", "", 1).strip()

    user_id = decode_access_token(token)

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token.",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found.",
        )

    return user


# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
def root():
    return {
        "message": "ConstructAI API is running",
        "version": "2.0.0",
        "status": "online",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ConstructAI",
    }


# ============================================================
# SIGNUP
# ============================================================

@app.post("/api/auth/signup")
def signup(
    data: SignupRequest,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == data.email.lower())
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists.",
        )

    if len(data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters.",
        )

    user = User(
        full_name=data.full_name.strip(),
        email=data.email.lower(),
        password_hash=hash_password(data.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Account created successfully.",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
        },
    }


# ============================================================
# LOGIN
# ============================================================

@app.post("/api/auth/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == data.email.lower())
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    if not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    token = create_access_token(user.id)

    return {
        "message": "Login successful.",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
        },
    }


# ============================================================
# CURRENT USER
# ============================================================

@app.get("/api/auth/me")
def get_me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
    }


# ============================================================
# CREATE PROJECT
# ============================================================

@app.post("/api/projects")
def create_project(
    data: ProjectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    if data.built_up_area <= 0:
        raise HTTPException(
            status_code=400,
            detail="Built-up area must be greater than zero.",
        )

    if data.floors <= 0:
        raise HTTPException(
            status_code=400,
            detail="Number of floors must be greater than zero.",
        )

    if data.rooms <= 0:
        raise HTTPException(
            status_code=400,
            detail="Number of rooms must be greater than zero.",
        )

    if data.duration_months <= 0:
        raise HTTPException(
            status_code=400,
            detail="Duration must be greater than zero.",
        )

    project = Project(
        user_id=current_user.id,
        project_name=data.project_name.strip(),
        construction_type=data.construction_type.strip(),
        location=data.location.strip(),
        state=data.state.strip(),
        built_up_area=data.built_up_area,
        floors=data.floors,
        rooms=data.rooms,
        duration_months=data.duration_months,
        quality=data.quality.strip(),
        structure_type=data.structure_type.strip(),
        material_grade=data.material_grade.strip(),
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return {
        "message": "Project created successfully.",
        "project": {
            "id": project.id,
            "project_name": project.project_name,
            "construction_type": project.construction_type,
            "location": project.location,
            "state": project.state,
            "built_up_area": project.built_up_area,
            "floors": project.floors,
            "rooms": project.rooms,
            "duration_months": project.duration_months,
            "quality": project.quality,
            "structure_type": project.structure_type,
            "material_grade": project.material_grade,
            "created_at": project.created_at,
        },
    }


# ============================================================
# GET ALL PROJECTS
# ============================================================

@app.get("/api/projects")
def get_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    projects = (
        db.query(Project)
        .filter(Project.user_id == current_user.id)
        .order_by(Project.id.desc())
        .all()
    )

    return {
        "projects": [
            {
                "id": project.id,
                "project_name": project.project_name,
                "construction_type": project.construction_type,
                "location": project.location,
                "state": project.state,
                "built_up_area": project.built_up_area,
                "floors": project.floors,
                "rooms": project.rooms,
                "duration_months": project.duration_months,
                "quality": project.quality,
                "structure_type": project.structure_type,
                "material_grade": project.material_grade,
                "created_at": project.created_at,
            }
            for project in projects
        ]
    }


# ============================================================
# GET SINGLE PROJECT
# ============================================================

@app.get("/api/projects/{project_id}")
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found.",
        )

    return {
        "id": project.id,
        "project_name": project.project_name,
        "construction_type": project.construction_type,
        "location": project.location,
        "state": project.state,
        "built_up_area": project.built_up_area,
        "floors": project.floors,
        "rooms": project.rooms,
        "duration_months": project.duration_months,
        "quality": project.quality,
        "structure_type": project.structure_type,
        "material_grade": project.material_grade,
        "created_at": project.created_at,
    }


# ============================================================
# DELETE PROJECT
# ============================================================

@app.delete("/api/projects/{project_id}")
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found.",
        )

    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully.",
    }


# ============================================================
# COSTING ENGINE
# ============================================================

def calculate_estimation(project: Project):

    area = float(project.built_up_area)

    construction_type = (
        project.construction_type or "residential"
    ).strip().lower()

    quality = (
        project.quality or "standard"
    ).strip().lower()

    structure_type = (
        project.structure_type or "rcc"
    ).strip().lower()

    material_grade = (
        project.material_grade or "standard"
    ).strip().lower()

    # --------------------------------------------------------
    # QUALITY RATES
    # Approximate planning rates per sq.ft.
    # --------------------------------------------------------

    quality_rates = {
        "basic": 1400,
        "standard": 1700,
        "premium": 2100,
        "luxury": 2600,
    }

    base_rate = quality_rates.get(
        quality,
        1700,
    )

    # --------------------------------------------------------
    # CONSTRUCTION TYPE
    # --------------------------------------------------------

    construction_factors = {
        "residential": 1.00,
        "commercial": 1.15,
        "industrial": 1.20,
        "institutional": 1.10,
    }

    construction_factor = construction_factors.get(
        construction_type,
        1.00,
    )

    # --------------------------------------------------------
    # MATERIAL GRADE
    # --------------------------------------------------------

    material_factors = {
        "basic": 0.97,
        "standard": 1.00,
        "premium": 1.06,
        "luxury": 1.12,
    }

    material_factor = material_factors.get(
        material_grade,
        1.00,
    )

    # --------------------------------------------------------
    # STRUCTURE
    # --------------------------------------------------------

    structure_factors = {
        "rcc": 1.00,
        "steel": 1.08,
        "steel structure": 1.08,
    }

    structure_factor = structure_factors.get(
        structure_type,
        1.00,
    )

    # --------------------------------------------------------
    # FINAL RATE
    # --------------------------------------------------------

    rate_per_sqft = (
        base_rate
        * construction_factor
        * material_factor
        * structure_factor
    )

    total_cost = area * rate_per_sqft

    # --------------------------------------------------------
    # COST BREAKDOWN
    # --------------------------------------------------------

    material_cost = total_cost * 0.50
    labour_cost = total_cost * 0.25
    electrical_plumbing_cost = total_cost * 0.10
    finishing_cost = total_cost * 0.08
    contingency_cost = total_cost * 0.07

    # --------------------------------------------------------
    # MATERIAL QUANTITIES
    # --------------------------------------------------------

    cement_bags = area * 0.38

    if structure_type in [
        "steel",
        "steel structure",
    ]:
        steel_kg = area * 3.8
    else:
        steel_kg = area * 4.0

    sand_cft = area * 1.25

    bricks = area * 8

    aggregate_cft = area * 0.90

    # --------------------------------------------------------
    # PLANNING MATERIAL RATES
    # These are assumptions, NOT live market prices.
    # --------------------------------------------------------

    cement_price = 420
    steel_price = 65
    sand_price = 65
    brick_price = 10
    aggregate_price = 55

    cement_material_cost = (
        cement_bags * cement_price
    )

    steel_material_cost = (
        steel_kg * steel_price
    )

    sand_material_cost = (
        sand_cft * sand_price
    )

    brick_material_cost = (
        bricks * brick_price
    )

    aggregate_material_cost = (
        aggregate_cft * aggregate_price
    )

    estimated_material_subtotal = (
        cement_material_cost
        + steel_material_cost
        + sand_material_cost
        + brick_material_cost
        + aggregate_material_cost
    )

    # --------------------------------------------------------
    # BUDGET RANGE
    # --------------------------------------------------------

    lower_budget = total_cost * 0.95
    upper_budget = total_cost * 1.05

    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return {

        "built_up_area": round(
            area,
            2,
        ),

        "rate_per_sqft": round(
            rate_per_sqft,
            2,
        ),

        "total_cost": round(
            total_cost,
            2,
        ),

        "budget_range": {

            "minimum": round(
                lower_budget,
                2,
            ),

            "maximum": round(
                upper_budget,
                2,
            ),
        },

        "cost_breakdown": {

            "materials": round(
                material_cost,
                2,
            ),

            "labour": round(
                labour_cost,
                2,
            ),

            "electrical_plumbing": round(
                electrical_plumbing_cost,
                2,
            ),

            "finishing": round(
                finishing_cost,
                2,
            ),

            "contingency": round(
                contingency_cost,
                2,
            ),
        },

        "materials": {

            "cement_bags": round(
                cement_bags,
                0,
            ),

            "steel_kg": round(
                steel_kg,
                0,
            ),

            "sand_cft": round(
                sand_cft,
                0,
            ),

            "bricks": round(
                bricks,
                0,
            ),

            "aggregate_cft": round(
                aggregate_cft,
                0,
            ),
        },

        "material_price_assumptions": {

            "cement_per_bag": cement_price,

            "steel_per_kg": steel_price,

            "sand_per_cft": sand_price,

            "brick_each": brick_price,

            "aggregate_per_cft": aggregate_price,
        },

        "estimated_material_subtotal": round(
            estimated_material_subtotal,
            2,
        ),

        "estimate_type":
            "Preliminary planning estimate",

        "disclaimer":
            "This is a preliminary planning estimate. "
            "Actual construction cost depends on location, "
            "design, structural drawings, current material "
            "prices, labour rates, site conditions and "
            "project specifications.",
    }


# ============================================================
# CREATE ESTIMATION
# ============================================================

@app.post("/api/estimation")
def create_estimation(
    data: EstimationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    project = (
        db.query(Project)
        .filter(
            Project.id == data.project_id,
            Project.user_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found.",
        )

    estimation = calculate_estimation(project)

    return {
        "project": {
            "id": project.id,
            "project_name": project.project_name,
            "construction_type":
                project.construction_type,
            "location":
                project.location,
            "state":
                project.state,
            "built_up_area":
                project.built_up_area,
            "floors":
                project.floors,
            "rooms":
                project.rooms,
            "duration_months":
                project.duration_months,
            "quality":
                project.quality,
            "structure_type":
                project.structure_type,
            "material_grade":
                project.material_grade,
        },

        "estimation": estimation,
    }


# ============================================================
# GET ESTIMATION FOR PROJECT
# ============================================================

@app.get("/api/estimation/{project_id}")
def get_estimation(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found.",
        )

    estimation = calculate_estimation(project)

    return {
        "project": {
            "id": project.id,
            "project_name": project.project_name,
            "construction_type":
                project.construction_type,
            "location":
                project.location,
            "state":
                project.state,
            "built_up_area":
                project.built_up_area,
            "floors":
                project.floors,
            "rooms":
                project.rooms,
            "duration_months":
                project.duration_months,
            "quality":
                project.quality,
            "structure_type":
                project.structure_type,
            "material_grade":
                project.material_grade,
        },

        "estimation": estimation,
    }