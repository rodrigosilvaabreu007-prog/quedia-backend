git add frontend/perfil.html
if not exist .git\index goto no_git
git commit -m "Fix profile close button dimensions"
if %errorlevel% neq 0 goto commit_failed
firebase deploy --only hosting --project quedia-backend
exit /b 0
:no_git
echo Git repository not found.
exit /b 1
:commit_failed
echo Commit failed or no changes to commit.
exit /b 1
