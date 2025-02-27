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
@REM 初始化变量
set "config_file=%A%config.properties"
set "jar_path=%A%jar\keep.jar"
set "jre_path="

@REM 读取 config.properties
for /f "tokens=1,* delims==" %%A in (%config_file%) do (
    if "%%A"=="jre_path" set "jre_path=%%B"
    if "%%A"=="keep_path" set "keep_path=%%B"
)

set "keep_path=%keep_path:\=/%"
if not "!keep_path:~-1!"=="/" set "keep_path=!keep_path!/"

REM 记录 err.log 初始修改时间
set "log_file=%A%err.log"
for %%F in ("%log_file%") do set "prev_time=%%~tF"

@REM 启动 Java 进程
start "" /b "%jre_path%" -Dfile.encoding=UTF-8 -jar "%jar_path%" "%keep_path%"

@REM 等待 Java 进程启动
timeout /t 2 >nul

@REM 检查 Java 进程是否运行
tasklist /FI "IMAGENAME eq javaw.exe" | find /i "javaw.exe" >nul
if %errorlevel% neq 0 (
    for %%F in ("%log_file%") do set "current_time=%%~tF"
    if not "!prev_time!"=="!current_time!" (
        start notepad "%log_file%"
    )
)

exit