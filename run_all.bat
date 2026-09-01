@echo off
setlocal

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
  if not defined LANIP set LANIP=%%a
)
set LANIP=%LANIP: =%
if not defined LANIP set LANIP=localhost

echo Starting BlastAPI Backend on http://localhost:8000 ...
start "Backend - BlastAPI" cmd /k "cd /d %~dp0blastapi && python -m uvicorn api.main:app --host 0.0.0.0 --port 8000"

echo Starting Frontend on http://localhost:5173 ...
start "Frontend - Vite" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 0.0.0.0"

echo.
echo Both services are starting!
echo.
echo   Frontend : http://localhost:5173      ^| http://%LANIP%:5173
echo   Backend  : http://localhost:8000      ^| http://%LANIP%:8000
echo   API docs : http://localhost:8000/docs ^| http://%LANIP%:8000/docs
echo.
echo Open the Frontend link to use the app.
endlocal
