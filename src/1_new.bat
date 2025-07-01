@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

@REM D\C\B\A(当前脚本自身所在目录)
set "A=%~dp0"
pushd "%A%" && cd ..
set "B=%CD%"
cd ..
set "C=%CD%"
cd ..
set "D=%CD%"
popd

@REM 确保路径结尾带有 "\"
for %%X in (A B C D) do (
    if not "!%%X:~-1!"=="\" set "%%X=!%%X!\"
)

@REM --------------------------------------------------------------------------------
@REM 初始化变量
set "config_file=%A%config.properties"
set "jar_path=%A%jar\new.jar"
set "jre_path="
set "vscode_path="

@REM 读取 config.properties
for /f "tokens=1,* delims==" %%A in (%config_file%) do (
    if "%%A"=="jre_path" set "jre_path=%%B"
    if "%%A"=="vscode_path" set "vscode_path=%%B"
)

@REM 获取用户输入
set /p title=Enter the title:
if "%title%"=="" (
    echo ERROR: Title cannot be empty!
    pause
    exit /b
)

if exist "%B%html\%title%.html" (
    echo ERROR: File already exists!
    pause
    exit /b
)

set /p category=Enter the category:
if "%category%"=="" (
    echo ERROR: Category cannot be empty!
    pause
    exit /b
)

REM 记录 err.log 初始修改时间
set "log_file=%A%err.log"
for %%F in ("%log_file%") do set "prev_time=%%~tF"

for /f "delims=" %%A in ('powershell -nologo -command "[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('%title%'))"') do set "b64_title=%%A"
for /f "delims=" %%A in ('powershell -nologo -command "[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('%category%'))"') do set "b64_category=%%A"

"%jre_path%" -Dfile.encoding=UTF-8 -jar "%jar_path%" "%b64_title%" "%b64_category%"

timeout /t 2 >nul
REM 检查是否创建了新 HTML 文件
if exist "%B%html\%title%.html" (
    start "" "%vscode_path%" "%B%html\%title%.html"
)

REM 检查日志是否更新
for %%F in ("%log_file%") do set "current_time=%%~tF"
if not "!prev_time!"=="!current_time!" (
    start notepad "%log_file%"
)

exit /b