@echo off
setlocal
echo === Threat-Zone Estimator: first-time setup ===
echo.

where python >nul 2>&1
if errorlevel 1 (
  echo [X] Python not found on PATH.
  echo     Install Python 3.10+ from https://python.org and tick
  echo     "Add Python to PATH" during installation.
  goto :fail
)
for /f "tokens=*" %%v in ('python --version') do echo [OK] %%v

where npm >nul 2>&1
if errorlevel 1 (
  echo [X] Node.js/npm not found on PATH.
  echo     Install Node 18+ from https://nodejs.org
  goto :fail
)
for /f "tokens=*" %%v in ('node --version') do echo [OK] Node %%v

echo.
echo Installing backend dependencies...
python -m pip install --quiet --disable-pip-version-check -r "%~dp0requirements.txt"
if errorlevel 1 (
  echo [X] pip install failed.
  goto :fail
)
echo [OK] Backend dependencies installed.

echo.
echo Installing frontend dependencies (this can take a minute)...
pushd "%~dp0frontend"
call npm install --no-fund --no-audit
if errorlevel 1 (
  popd
  echo [X] npm install failed.
  goto :fail
)
popd
echo [OK] Frontend dependencies installed.

echo.
echo === Setup complete. Run run_all.bat to start the app. ===
endlocal
exit /b 0

:fail
echo.
echo Setup did not complete. Fix the issue above and run setup.bat again.
endlocal
exit /b 1
