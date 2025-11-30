@echo off
setlocal

:: --- STEP 1: Access assets folder ---
cd /d "%~dp0paperGUI\src\assets"
echo ================================================
echo extract these split zip manually using 7zip or winrar ...
echo ================================================
pause

:: --- STEP 2: Install & run frontend ---
cd /d "%~dp0paperGUI"
echo Installing frontend node modules...
call npm install

if %errorlevel% neq 0 (
    echo NPM INSTALL FAILED!
    pause
    exit /b
)

echo Starting frontend (npm run dev)...
start cmd /k "npm run dev"

:: --- STEP 3: Install & run backend ---
cd /d "%~dp0server"
echo Installing backend node modules...
call npm install

if %errorlevel% neq 0 (
    echo BACKEND NPM INSTALL FAILED!
    pause
    exit /b
)

echo Starting backend (npm run dev)...
start cmd /k "npm run dev"

echo ================================================
echo Everything started successfully!
echo ================================================
pause
