from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
import jwt
from pydantic import ValidationError
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/core/auth/login"
)

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = payload.get("sub")
        if token_data is None:
            raise credentials_exception
    except (jwt.PyJWTError, ValidationError):
        raise credentials_exception
    # In a real app, we'd fetch the user from DB here
    return {"username": token_data}
