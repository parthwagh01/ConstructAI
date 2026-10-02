from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    full_name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


class Project(Base):
    __tablename__ = "projects"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    project_name = Column(
        String(200),
        nullable=False
    )

    construction_type = Column(
        String(50),
        nullable=False
    )

    location = Column(
        String(200),
        nullable=False
    )

    state = Column(
        String(100),
        nullable=False
    )

    built_up_area = Column(
        Integer,
        nullable=False
    )

    floors = Column(
        Integer,
        nullable=False
    )

    rooms = Column(
        Integer,
        nullable=False
    )

    duration_months = Column(
        Integer,
        nullable=False
    )

    quality = Column(
        String(50),
        nullable=False
    )

    structure_type = Column(
        String(50),
        nullable=False
    )

    material_grade = Column(
        String(50),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )