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
)

@REM 获取zip路径
set /p zip_file=zip path: 

@REM 去除路径前后的双引号
set "zip_file=%zip_file:"=%"

@REM 检查路径是否存在
if not exist "%zip_file%" (
    echo [ERROR] File not found: "%zip_file%"
    pause
    exit /b
)

@REM 获取不带扩展名的文件夹名
for %%F in ("%zip_file%") do (
    set "zip_name=%%~nF"
    set "zip_dir=%%~dpF"
)

set "extract_path=%zip_dir%%zip_name%"

powershell -Command "Expand-Archive -Force '%zip_file%' '%extract_path%'"

@REM 拼接最终的keep路径
set "keep_path=%extract_path%\Takeout\Keep"

if not exist "%keep_path%" (
    echo [ERROR] not existed: %keep_path%
    pause
    exit /b
)

@REM 替换路径中的\为/ 并确保结尾/
set "keep_path=%keep_path:\=/%"
if not "!keep_path:~-1!"=="/" set "keep_path=!keep_path!/"

echo %keep_path%

set /p label=label: 

@REM 记录 err.log 初始修改时间
set "log_file=%A%err.log"
for %%F in ("%log_file%") do set "prev_time=%%~tF"

@REM 启动 Java 进程
start "" /b "%jre_path%" -Dfile.encoding=UTF-8 -jar "%jar_path%" "%keep_path%" "%label%"

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

@REM 检查note.txt是否生成，并用记事本打开
set "note_file=%keep_path%____notes____.txt"
if exist "%note_file%" (
    start notepad "%note_file%"
) else (
    echo [ERROR] note.txt not found in %keep_path%
    pause
)

exit