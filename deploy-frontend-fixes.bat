git add frontend/perfil.html frontend/meus-eventos.js frontend/meus-eventos.html
if not exist .git\index goto no_git
git commit -m "Deploy square close buttons and meus-eventos fixes"
if %errorlevel% neq 0 goto commit_failed
firebase deploy --only hosting --project quedia-bd2fb
exit /b 0
:no_git
echo Git repository not found.
exit /b 1
:commit_failed
echo Commit failed or no changes to commit.
exit /b 1
