@echo off
echo ====================================================================
echo  Starting Secure Cloud-Based File Storage and Document Management
echo  BIT Mesra - Project-I (MO-2026)
echo ====================================================================
echo Starting Backend in separate window...
start "CloudVault Backend (Spring Boot)" cmd /c "cd /d %~dp0backend && run-backend.bat"

echo Starting Frontend in separate window...
start "CloudVault Frontend (React Vite)" cmd /c "cd /d %~dp0frontend && run-frontend.bat"

echo.
echo ====================================================================
echo  Services launched:
echo  - Frontend Web UI:  http://localhost:5173
echo  - Backend REST API: http://localhost:8080/api
echo  - Swagger OpenAPI:  http://localhost:8080/swagger-ui.html
echo  - H2 Dev Database:  http://localhost:8080/h2-console
echo ====================================================================
pause
