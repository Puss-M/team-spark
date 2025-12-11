@echo off
chcp 65001 >nul
echo ==========================================
echo      Team Spark GitHub Auto-Pusher
echo ==========================================

echo [1/3] Adding all changes...
git add .

echo.
set /p msg="Please enter commit message (Press Enter for 'Update'): "
if "%msg%"=="" set msg=Update

echo.
echo [2/3] Committing changes...
git commit -m "%msg%"

echo.
echo [3/3] Pushing to remote repository...
git push origin main

echo.
if %errorlevel% equ 0 (
    echo [SUCCESS] Push completed successfully!
) else (
    echo [ERROR] Something went wrong. Please check the output above.
)

echo.
pause
