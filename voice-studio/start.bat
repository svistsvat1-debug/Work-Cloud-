@echo off
cd /d "%~dp0"
title Voice Studio

if exist ".venv\Scripts\python.exe" goto install

set "PY="
for %%V in (3.12 3.11 3.13 3.10) do (
  if not defined PY (
    py -%%V -c "import sys" >nul 2>&1 && set "PY=py -%%V"
  )
)
if not defined PY (
  python -c "import sys; sys.exit(0 if (3,10) <= sys.version_info[:2] <= (3,13) else 1)" >nul 2>&1 && set "PY=python"
)
if not defined PY (
  echo.
  echo Python 3.10 - 3.13 was not found.
  echo Install Python 3.12 from https://www.python.org/downloads/
  echo During setup tick "Add python.exe to PATH", then run this file again.
  echo.
  pause
  exit /b 1
)
echo Creating a private Python environment, first run only...
%PY% -m venv .venv
if errorlevel 1 goto fail

:install
echo Checking components, the first run downloads them and takes a few minutes...
".venv\Scripts\python.exe" -m pip install --disable-pip-version-check -q -r requirements.txt
if errorlevel 1 goto fail

".venv\Scripts\python.exe" app.py
pause
exit /b 0

:fail
echo.
echo Something went wrong. Check your internet connection and run start.bat again.
pause
exit /b 1
