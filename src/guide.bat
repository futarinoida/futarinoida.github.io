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

for /f "delims=" %%A in (
  'powershell -nologo -command "$uri = [uri]::UnescapeDataString(\"%~1\"); $uri -replace \"^.*:\/\/\", \"\""' 
) do (
    set "params=%%A"
)

for /f "tokens=1,* delims={" %%i in ("!params!") do (
    set "code=%%i"
    set "title=%%j"
)
if "!title:~-1!"=="/" set "title=!title:~0,-1!"

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

for /f "delims=" %%A in ('powershell -nologo -command "[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('%title%'))"') do set "b64=%%A"
"%jre_path%" -Dfile.encoding=UTF-8 -jar "%jar_path%" "%b64%"

for %%F in ("%html_file%") do set "current_time=%%~tF"
if not "!prev_time!"=="!current_time!" (
    start "" "%vscode_path%" "%html_file%"
)

for %%F in ("%log_file%") do set "current_time2=%%~tF"
if not "!prev_time2!"=="!current_time2!" (
    start notepad "%log_file%"
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