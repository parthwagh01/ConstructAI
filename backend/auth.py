import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from jose import JWTError, jwt

# Load environment variables from .env
load_dotenv()

# Production secret key from .env
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "development-only-secret-key"
)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def hash_password(password: str) -> str:
    salt = os.urandom(16)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        310000
    )

    return (
        "pbkdf2_sha256$310000$"
        + base64.b64encode(salt).decode("utf-8")
        + "$"
        + base64.b64encode(password_hash).decode("utf-8")
    )


def verify_password(plain_password: str, stored_password: str) -> bool:
    try:
        algorithm, iterations, salt_b64, hash_b64 = stored_password.split("$")

        if algorithm != "pbkdf2_sha256":
            return False

        salt = base64.b64decode(salt_b64)
        expected_hash = base64.b64decode(hash_b64)

        actual_hash = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt,
            int(iterations)
        )

        return hmac.compare_digest(
            actual_hash,
            expected_hash
        )

    except Exception:
        return False


def create_access_token(
    user_id: int,
    expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES
) -> str:

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes
    )

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def decode_access_token(token: str):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            return None

        return int(user_id)

    except (JWTError, ValueError):
        return None