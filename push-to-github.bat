@echo off
title Push to GitHub - Cloud Based File Storage System
color 0b
echo ====================================================================
echo  Pushing Project to GitHub:
echo  https://github.com/Namansingh68/cloud-based-file-storage-system
echo ====================================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo ====================================================================
    echo  SUCCESS: All project files successfully pushed to GitHub!
    echo ====================================================================
) else (
    echo ====================================================================
    echo  Git push encountered an error or needs your GitHub authentication.
    echo ====================================================================
)
echo.
pause
