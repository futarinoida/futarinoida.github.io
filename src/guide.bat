@echo off
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
set "tmp=%systemroot%\temp\1001.txt"
cscript //nologo "%B%js\decodeURI.js" "%1" > "%tmp%"

set /p params=<"%tmp%"
del %tmp%

for /f "tokens=1,* delims=#" %%i in ("%params%") do (
    set "code=%%i"
    set "title=%%j"
)

if "!code!"=="1" goto case_1 @REM edit
if "!code!"=="2" goto case_2 
if "!code!"=="3" goto case_3 
goto end 

:case_1
set "config_file=%A%config.properties"
set "jar_path=%A%jar\stamp.jar"
set "jre_path="
set "vscode_path="
set "log_file=%A%err.log"

for /f "tokens=1,* delims==" %%A in (%config_file%) do (
    if "%%A"=="jre_path" set "jre_path=%%B"
    if "%%A"=="vscode_path" set "vscode_path=%%B"
)
set "html_file=%B%html\%title%.html"
if not exist "%html_file%" (
    echo File not found: %html_file%
    exit /b 1
)

for %%F in ("%html_file%") do set "prev_time=%%~tF"
for %%F in ("%log_file%") do set "prev_time2=%%~tF"

start "" /b "%jre_path%" -Dfile.encoding=UTF-8 -jar "%jar_path%" "%title%"

@REM 等待 Java 进程启动
timeout /t 2 >nul

@REM 检查 Java 进程是否运行
tasklist /FI "IMAGENAME eq javaw.exe" | find /i "javaw.exe" >nul
if %errorlevel% neq 0 (
    for %%F in ("%html_file%") do set "current_time=%%~tF"
    if not "!prev_time!"=="!current_time!" (
        start "" "%vscode_path%" "%html_file%"
    )
    for %%F in ("%log_file%") do set "current_time2=%%~tF"
    if not "!prev_time2!"=="!current_time2!" (
        start notepad "%log_file%"
    )
)
goto end

:case_2
echo Case 2 executed.
goto end

:case_3
echo Case 3 executed.
goto end

:end
exit