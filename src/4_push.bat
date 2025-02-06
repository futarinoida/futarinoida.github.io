@echo off
setlocal
cd ..
set /p msg=commit: 
git add .
git commit -m "%msg%"
git push
pause