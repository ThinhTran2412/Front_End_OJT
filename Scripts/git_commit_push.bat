@echo off
REM ====================================================================
REM Git Commit and Push Script for Front_End
REM Features:
REM   - Add all changes
REM   - Commit with custom message
REM   - Push to remote
REM   - Option to create new branch
REM   - Option to checkout existing branch
REM   - Error logging
REM   - Display git remote URL and branch at each step (from actual git)
REM ====================================================================
setlocal enabledelayedexpansion

REM Change to Front_End directory
cd /d "%~dp0\.."

REM Check if git repository exists in Front_End folder only
if not exist ".git" (
    echo Error: Not a git repository in Front_End!
    echo Current directory: %CD%
    echo Front_End must have its own .git folder.
    exit /b 1
)

REM Front_End is a separate git repository
set GIT_ROOT=%CD%
set IS_SEPARATE_REPO=1

echo.
echo ==============================================================
echo   Git Commit and Push - Front_End
echo ==============================================================
echo.

REM Get current branch and remote info from actual git
cd /d "%GIT_ROOT%"

REM Get current branch
for /f "tokens=*" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set CURRENT_BRANCH=%%b

REM Get remote that current branch is tracking (format: remote/branch)
for /f "tokens=1,* delims=/" %%a in ('git rev-parse --abbrev-ref --symbolic-full-name @{u} 2^>nul') do (
    set TRACKING_REMOTE=%%a
    set TRACKING_BRANCH=%%b
)

REM Get remote name - use tracking remote if available, otherwise get first remote
REM IMPORTANT: REMOTE_NAME must be simple remote name (e.g., "origin"), NOT "origin/branch"
if not "!TRACKING_REMOTE!"=="" (
    set REMOTE_NAME=!TRACKING_REMOTE!
) else (
    REM Get first available remote
    for /f "tokens=*" %%r in ('git remote 2^>nul') do (
        if "!REMOTE_NAME!"=="" (
            set REMOTE_NAME=%%r
        )
    )
)

REM Get remote URL from actual git
REM Ensure REMOTE_NAME is simple name (no slash), then get URL
if not "!REMOTE_NAME!"=="" (
    REM Remove any branch part if accidentally included (shouldn't happen, but safety check)
    for /f "tokens=1 delims=/" %%n in ("!REMOTE_NAME!") do set REMOTE_NAME=%%n
    for /f "tokens=*" %%u in ('git remote get-url !REMOTE_NAME! 2^>nul') do set REMOTE_URL=%%u
)

cd /d "%~dp0\.."

echo [Git Info - From Actual Git Repository]
echo   Remote: !REMOTE_NAME! - !REMOTE_URL!
echo   Current Branch: !CURRENT_BRANCH!
if not "!TRACKING_REMOTE!"=="" (
    echo   Tracking: !TRACKING_REMOTE!/!TRACKING_BRANCH!
)
echo.

REM ====================================================================
REM Step 1: Branch Management
REM ====================================================================
echo [Step 1/5] Branch Management
echo   Remote: !REMOTE_NAME! - !REMOTE_URL!
echo   Current Branch: !CURRENT_BRANCH!
if not "!TRACKING_REMOTE!"=="" (
    echo   Tracking: !TRACKING_REMOTE!/!TRACKING_BRANCH!
)
echo.
echo Options:
echo   1. Stay on current branch (!CURRENT_BRANCH!)
echo   2. Checkout existing branch
echo   3. Create and checkout new branch
echo.
set /p BRANCH_OPTION="Select option (1-3): "

if "%BRANCH_OPTION%"=="1" (
    set TARGET_BRANCH=!CURRENT_BRANCH!
    echo   [OK] Staying on branch: !TARGET_BRANCH!
) else if "%BRANCH_OPTION%"=="2" (
    echo.
    echo Available branches:
    cd /d "%GIT_ROOT%"
    git branch -a
    echo.
    set /p TARGET_BRANCH="Enter branch name to checkout: "
    if "!TARGET_BRANCH!"=="" (
        echo   [ERROR] Branch name cannot be empty
        exit /b 1
    )
    echo   Checking out branch: !TARGET_BRANCH!...
    git checkout !TARGET_BRANCH! 2>error.log
    if %ERRORLEVEL% neq 0 (
        echo   [ERROR] Failed to checkout branch: !TARGET_BRANCH!
        echo   Error details:
        type error.log
        del error.log 2>nul
        exit /b 1
    )
    echo   [OK] Checked out branch: !TARGET_BRANCH!
    
    REM Update tracking info after checkout - keep REMOTE_NAME as simple remote name
    for /f "tokens=1,* delims=/" %%a in ('git rev-parse --abbrev-ref --symbolic-full-name @{u} 2^>nul') do (
        set TRACKING_REMOTE=%%a
        set TRACKING_BRANCH=%%b
    )
    REM Only update REMOTE_NAME if not already set, keep it as simple remote name
    if not "!TRACKING_REMOTE!"=="" (
        if "!REMOTE_NAME!"=="" (
            set REMOTE_NAME=!TRACKING_REMOTE!
        )
        if not "!REMOTE_NAME!"=="" (
            for /f "tokens=*" %%u in ('git remote get-url !REMOTE_NAME! 2^>nul') do set REMOTE_URL=%%u
        )
    )
) else if "%BRANCH_OPTION%"=="3" (
    echo.
    set /p NEW_BRANCH="Enter new branch name: "
    if "!NEW_BRANCH!"=="" (
        echo   [ERROR] Branch name cannot be empty
        exit /b 1
    )
    echo   Creating new branch: !NEW_BRANCH!...
    cd /d "%GIT_ROOT%"
    git checkout -b !NEW_BRANCH! 2>error.log
    if %ERRORLEVEL% neq 0 (
        echo   [ERROR] Failed to create branch: !NEW_BRANCH!
        echo   Error details:
        type error.log
        del error.log 2>nul
        exit /b 1
    )
    set TARGET_BRANCH=!NEW_BRANCH!
    echo   [OK] Created and checked out branch: !TARGET_BRANCH!
) else (
    echo   [ERROR] Invalid option
    exit /b 1
)
echo.

REM ====================================================================
REM Step 2: Check Git Status (only Front_End files)
REM ====================================================================
cd /d "%GIT_ROOT%"

REM Refresh git info - keep REMOTE_NAME as simple remote name (origin), not origin/branch
for /f "tokens=*" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set CURRENT_BRANCH=%%b
for /f "tokens=1,* delims=/" %%a in ('git rev-parse --abbrev-ref --symbolic-full-name @{u} 2^>nul') do (
    set TRACKING_REMOTE=%%a
    set TRACKING_BRANCH=%%b
)
REM Only refresh REMOTE_URL, don't change REMOTE_NAME (keep it as simple remote name)
REM Safety check: ensure REMOTE_NAME doesn't contain "/"
if not "!REMOTE_NAME!"=="" (
    for /f "tokens=1 delims=/" %%n in ("!REMOTE_NAME!") do set REMOTE_NAME=%%n
    for /f "tokens=*" %%u in ('git remote get-url !REMOTE_NAME! 2^>nul') do set REMOTE_URL=%%u
) else (
    REM If REMOTE_NAME is empty, set it from tracking
    if not "!TRACKING_REMOTE!"=="" (
        set REMOTE_NAME=!TRACKING_REMOTE!
        for /f "tokens=*" %%u in ('git remote get-url !REMOTE_NAME! 2^>nul') do set REMOTE_URL=%%u
    )
)

echo [Step 2/5] Checking git status for Front_End...
echo   Remote: !REMOTE_NAME! - !REMOTE_URL!
echo   Branch: !TARGET_BRANCH!
if not "!TRACKING_REMOTE!"=="" (
    echo   Tracking: !TRACKING_REMOTE!/!TRACKING_BRANCH!
)
echo.
echo Git Status:
if !IS_SEPARATE_REPO! equ 1 (
    REM Front_End is separate repo, check all files
    git status --short 2>error.log
    git status --short >status.log 2>error.log
) else (
    REM Front_End is part of parent repo, check only Front_End files
    git status --short OJT_Laboratory_Project\Front_End\ 2>error.log
    git status --short OJT_Laboratory_Project\Front_End\ >status.log 2>error.log
)

if %ERRORLEVEL% neq 0 (
    echo   [ERROR] Failed to check git status
    echo   Error details:
    type error.log
    del error.log 2>nul
    del status.log 2>nul
    exit /b 1
)

for /f %%i in ('find /c /v "" ^< status.log 2^>nul') do set FILE_COUNT=%%i
if !FILE_COUNT! equ 0 (
    echo   [WARNING] No changes in Front_End to commit
    del status.log 2>nul
    del error.log 2>nul
    echo   Nothing to commit. Exiting...
    exit /b 0
)

echo.
echo   [OK] Found !FILE_COUNT! file(s) with changes in Front_End
del status.log 2>nul
del error.log 2>nul
echo.

REM ====================================================================
REM Step 3: Add Changes (only Front_End)
REM ====================================================================
echo [Step 3/5] Adding Front_End changes...
echo   Remote: !REMOTE_NAME! - !REMOTE_URL!
echo   Branch: !TARGET_BRANCH!
if not "!TRACKING_REMOTE!"=="" (
    echo   Tracking: !TRACKING_REMOTE!/!TRACKING_BRANCH!
)
echo.

if !IS_SEPARATE_REPO! equ 1 (
    REM Front_End is separate repo, add all
    git add . 2>error.log
) else (
    REM Front_End is part of parent repo, add only Front_End
    git add OJT_Laboratory_Project\Front_End\ 2>error.log
)

if %ERRORLEVEL% neq 0 (
    echo   [ERROR] Failed to add changes
    echo   Error details:
    type error.log
    del error.log 2>nul
    exit /b 1
)
echo   [OK] Front_End changes added to staging
echo   Staged files:
if !IS_SEPARATE_REPO! equ 1 (
    git diff --cached --name-only 2>nul
) else (
    git diff --cached --name-only OJT_Laboratory_Project\Front_End\ 2>nul
)
echo.

REM ====================================================================
REM Step 4: Commit
REM ====================================================================
echo [Step 4/5] Committing changes...
echo   Remote: !REMOTE_NAME! - !REMOTE_URL!
echo   Branch: !TARGET_BRANCH!
if not "!TRACKING_REMOTE!"=="" (
    echo   Tracking: !TRACKING_REMOTE!/!TRACKING_BRANCH!
)
echo.
set /p COMMIT_MESSAGE="Enter commit message: "
if "!COMMIT_MESSAGE!"=="" (
    echo   [ERROR] Commit message cannot be empty
    exit /b 1
)

echo   Committing with message: !COMMIT_MESSAGE!...
git commit -m "[Front_End] !COMMIT_MESSAGE!" 2>error.log
if %ERRORLEVEL% neq 0 (
    echo   [ERROR] Failed to commit
    echo   Error details:
    type error.log
    del error.log 2>nul
    exit /b 1
)
echo   [OK] Changes committed successfully
echo   Commit details:
git log -1 --oneline 2>nul
echo.

REM ====================================================================
REM Step 5: Push
REM ====================================================================
echo [Step 5/5] Pushing to remote...
echo   Remote: !REMOTE_NAME! - !REMOTE_URL!
echo   Branch: !TARGET_BRANCH!
if not "!TRACKING_REMOTE!"=="" (
    echo   Tracking: !TRACKING_REMOTE!/!TRACKING_BRANCH!
)
echo.

if "!REMOTE_NAME!"=="" (
    echo   [WARNING] No remote repository configured
    echo   Skipping push...
    goto :summary
)

REM Check if branch exists on remote
git ls-remote --heads !REMOTE_NAME! !TARGET_BRANCH! >nul 2>error.log
set REMOTE_EXISTS=%ERRORLEVEL%

if !REMOTE_EXISTS! equ 0 (
    REM Branch exists on remote, use normal push
    echo   Pushing to !REMOTE_NAME!/!TARGET_BRANCH!...
    git push !REMOTE_NAME! !TARGET_BRANCH! 2>error.log
    if %ERRORLEVEL% neq 0 (
        echo   [ERROR] Failed to push to remote
        echo   Error details:
        type error.log
        del error.log 2>nul
        exit /b 1
    )
    echo   [OK] Pushed to !REMOTE_NAME!/!TARGET_BRANCH!
) else (
    REM Branch doesn't exist on remote, set upstream
    echo   Branch !TARGET_BRANCH! doesn't exist on remote
    echo   Setting upstream and pushing...
    git push -u !REMOTE_NAME! !TARGET_BRANCH! 2>error.log
    if %ERRORLEVEL% neq 0 (
        echo   [ERROR] Failed to push to remote
        echo   Error details:
        type error.log
        del error.log 2>nul
        exit /b 1
    )
    echo   [OK] Pushed to !REMOTE_NAME!/!TARGET_BRANCH! (upstream set)
)
del error.log 2>nul
echo.

:summary
REM ====================================================================
REM Summary
REM ====================================================================
echo ==============================================================
echo   Summary - Front_End
echo ==============================================================
echo   Service: Front_End
echo   Remote: !REMOTE_NAME! - !REMOTE_URL!
echo   Branch: !TARGET_BRANCH!
if not "!TRACKING_REMOTE!"=="" (
    echo   Tracking: !TRACKING_REMOTE!/!TRACKING_BRANCH!
)
echo   Commit: [Front_End] !COMMIT_MESSAGE!
echo ==============================================================
echo   [OK] All operations completed successfully!
echo ==============================================================
echo.

REM Clean up error log if exists
if exist error.log del error.log 2>nul

exit /b 0
