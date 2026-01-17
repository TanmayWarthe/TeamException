# How to Run BloodConnect

## Prerequisites
- **Java 21** or higher
- **Maven**
- **Node.js** & **npm**
- **PostgreSQL** (Service must be running)

## 1. Database Setup
Ensure your PostgreSQL database is named `blood_connect` and the password matches what is in `backend/src/main/resources/application.properties` (Default: `STW@0427`).

## 2. Start the Backend (Server)
1.  Open a terminal (PowerShell or Command Prompt).
2.  Navigate to the backend directory:
    ```powershell
    cd c:\Desktop\BloodConnect\backend
    ```
3.  Start the Spring Boot application:
    ```powershell
    mvn spring-boot:run
    ```
    *Wait until you see the log message: `Started BloodConnectApplication in ... seconds`.*

## 3. Start the Frontend (UI)
1.  Open a **new** terminal window.
2.  Navigate to the frontend directory:
    ```powershell
    cd c:\Desktop\BloodConnect\frontend
    ```
3.  Start the React dev server:
    ```powershell
    npm run dev
    ```
4.  Control + Click the local URL shown (e.g., `http://localhost:5173`) to open the app in your browser.

## Troubleshooting
- **Port 8080 already in use**: If the backend fails, check if another process is using port 8080.
- **Database Connection Refused**: Ensure PostgreSQL service is running in Windows Services.
