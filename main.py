from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import mysql.connector
from mysql.connector import Error
import uvicorn
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, List

app = FastAPI()

# Authentication configuration
SECRET_KEY = "My-secret-key-here-in-development"  
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security scheme for JWT token
security = HTTPBearer()

# React CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Models
class UserRegister(BaseModel):
    """Model for user registration"""
    email: str
    password: str

class UserLogin(BaseModel):
    """Model for user login"""
    email: str
    password: str

class Token(BaseModel):
    """Model for JWT token response"""
    access_token: str
    token_type: str
    user_id: int
    email: str

class TokenData(BaseModel):
    """Model for token data"""
    email: Optional[str] = None

# CRUD Models
class UserCreate(BaseModel):
    """Model for creating a new user"""
    email: str
    password: str  

class UserUpdate(BaseModel):
    """Model for updating user information"""
    email: str
    password: str  

class User(BaseModel):
    """Model for user data"""
    user_id: int  
    email: str
    password: str

class UserResponse(BaseModel):
    """Model for user response (without password)"""
    user_id: int
    email: str


# Database connection
def get_db_connection():
    """Establish connection to MySQL database"""
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="fastapidb",
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci',
            autocommit=False
        )
        return connection
    except Error as e:
        print(f"Database connection error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Database connection failed: {str(e)}"
        )

# Authentication helper functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_email(email: str):
    """Get user from database by email"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        connection.close()
        return user
    except Error:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = get_user_by_email(email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

# Root endpoint
@app.get("/")
def read_root():
    """Root endpoint - welcome message"""
    return {"message": "Welcome to FastAPI with MySQL CRUD and Authentication!"}

# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint to test database connectivity"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        cursor.close()
        connection.close()
        
        return {
            "status": "healthy",
            "database": "connected",
            "message": "All systems operational"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

# Authentication reg/login and others
@app.post("/register", response_model=Token)
def register_user(user: UserRegister):
    """Register a new user account"""
    try:
        # Check if user already exists
        existing_user = get_user_by_email(user.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hashing password
        hashed_password = hash_password(user.password)
        
        # Create new user in database
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO users (email, password) VALUES (%s, %s)",
            (user.email, hashed_password)
        )
        connection.commit()
        user_id = cursor.lastrowid
        cursor.close()
        connection.close()
        
        # Create new jwt access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user_id,
            "email": user.email
        }
        
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login", response_model=Token)
def login_user(user: UserLogin):
    """Login user and return JWT"""
    try:
        # Get user from db
        db_user = get_user_by_email(user.email)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(user.password, db_user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": db_user["user_id"],
            "email": db_user["email"]
        }
        
    except HTTPException:
        raise
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"]
    }    

# Protected CRUD endpoints 
@app.get("/users", response_model=List[UserResponse])
def get_users(current_user: dict = Depends(get_current_user)):
    """Get all users (protected endpoint)"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        # Query to get valid users only, filtering out empty or invalid user_ids
        cursor.execute("""
            SELECT user_id, email FROM users 
            WHERE user_id IS NOT NULL 
            AND user_id != '' 
            AND user_id != '0'
            AND email IS NOT NULL 
            AND email != ''
            ORDER BY CAST(user_id AS UNSIGNED)
        """)
        rows = cursor.fetchall()
        cursor.close()
        connection.close()
        
        # Convert to proper response format, filtering out invalid entries
        users = []
        for row in rows:
            try:
                # Skip rows with empty or invalid user_id
                if row['user_id'] is None or row['user_id'] == '' or row['user_id'] == 0:
                    continue
                    
                user_id = int(row['user_id'])
                email = str(row['email'])
                
                # Skip if email is empty
                if not email or email.strip() == '':
                    continue
                    
                users.append({
                    'user_id': user_id,
                    'email': email
                })
            except (ValueError, TypeError) as e:
                # Skip invalid entries and log them
                print(f"Skipping invalid user entry: {row}, Error: {e}")
                continue
        
        return users
    except Error as e:
        print(f"Database error in get_users: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        print(f"Server error in get_users: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, current_user: dict = Depends(get_current_user)):
    """Get a specific user by ID (protected endpoint)"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT user_id, email FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        connection.close()
        
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            'user_id': int(user['user_id']),
            'email': str(user['email'])
        }
            
    except Error as e:
        print(f"Database error in get_user: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        print(f"Server error in get_user: {e}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, current_user: dict = Depends(get_current_user)):
    """Create a new user (protected endpoint)"""
    try:
        # Hash the password before storing
        hashed_password = hash_password(user.password)
        
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO users (email, password) VALUES (%s, %s)",
            (user.email, hashed_password)
        )
        connection.commit()
        user_id = cursor.lastrowid 
        cursor.close()
        connection.close()
        
        return {"user_id": user_id, "email": user.email}  # Don't return password
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Update an existing user (protected endpoint)"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
        if cursor.fetchone() is None:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="User not found")
        
        # Hash the password before updating
        hashed_password = hash_password(user.password)
        
        cursor.execute(
            "UPDATE users SET email = %s, password = %s WHERE user_id = %s",
            (user.email, hashed_password, user_id)
        )
        connection.commit()
        cursor.close()
        connection.close()
        
        return {"user_id": user_id, "email": user.email}  # Don't return password
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: dict = Depends(get_current_user)):
    """Delete a user (protected endpoint)"""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
        if cursor.fetchone() is None:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="User not found")
        
        cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
        connection.commit()
        cursor.close()
        connection.close()
        
        return {"message": "User deleted successfully"}
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))


# Start the application
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
