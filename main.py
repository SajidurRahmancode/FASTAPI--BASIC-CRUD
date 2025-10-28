from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector
from mysql.connector import Error
import uvicorn

app = FastAPI()

# React CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#models
class UserCreate(BaseModel):
    email: str
    password: str  


class UserUpdate(BaseModel):
    email: str
    password: str  

class User(BaseModel):
    user_id: int  
    email: str
    password: str


def get_db_connection():
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="fastapidb"
    )
    return connection

@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI with MySQL!"}    

@app.get("/users")

def get_users():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users")
        rows = cursor.fetchall()
        cursor.close()
        connection.close()
        return rows
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}")
def get_user(user_id: int):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        connection.close()
        
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users")
def create_user(user: UserCreate):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO users (email, password) VALUES (%s, %s)",
            (user.email, user.password)
        )
        connection.commit()
        user_id = cursor.lastrowid 
        cursor.close()
        connection.close()
        
        return {"user_id": user_id, "email": user.email, "password": user.password}
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/users/{user_id}")
def update_user(user_id: int, user: UserUpdate):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
        if cursor.fetchone() is None:
            cursor.close()
            connection.close()
            raise HTTPException(status_code=404, detail="User not found")
        
        cursor.execute(
            "UPDATE users SET email = %s, password = %s WHERE user_id = %s",
            (user.email, user.password, user_id)
        )
        connection.commit()
        cursor.close()
        connection.close()
        
        return {"user_id": user_id, "email": user.email, "password": user.password}
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/users/{user_id}")
def delete_user(user_id: int):
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


if __name__=="__main__":
    uvicorn.run(app, host="0.0.0.0",port=8000)
