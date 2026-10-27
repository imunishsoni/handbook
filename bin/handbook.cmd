@echo off
REM ============================================================
REM  Handbook — Windows CMD Launcher
REM ============================================================

set "DIR=%~dp0.."

if exist "%DIR%\dist\Handbook-win32-x64\Handbook.exe" (
  start "" "%DIR%\dist\Handbook-win32-x64\Handbook.exe" %*
  exit /b 0
)

if exist "%DIR%\dist\Handbook-win32-arm64\Handbook.exe" (
  start "" "%DIR%\dist\Handbook-win32-arm64\Handbook.exe" %*
  exit /b 0
)

if exist "%DIR%\bin\handbook.js" (
  node "%DIR%\bin\handbook.js" %*
  exit /b 0
)

start "" "%DIR%\node_modules\.bin\electron.cmd" "%DIR%" %*
exit /b 0
