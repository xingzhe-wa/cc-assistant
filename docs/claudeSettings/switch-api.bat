@echo off
setlocal enabledelayedexpansion
:: 所在目录即“同步目录”
set "DIR=%~dp0"
:: 目标文件
set "TARGET=%DIR%settings.json"

:scan
cls
echo  当前目录：%DIR%
echo  可选配置：
set /a idx=0
for %%f in ("%DIR%settings-*.json") do (
    set /a idx+=1
    set "file[!idx!]=%%~nxf"
    set "base[!idx!]=%%~nf"
    echo   !idx!. %%~nf
)
if %idx%==0 (
    echo  未找到 settings-*.json，按任意键退出...
    pause >nul
    goto :eof
)

:choose
set /p cho=请输入序号（1-%idx%）：
if "%cho%"=="" goto choose
set /a cho=cho
if %cho% lss 1 goto choose
if %cho% gtr %idx% goto choose

:: 拿到选中的文件名
set "src=!file[%cho%]!"
set "base=!base[%cho%]!"

:: 删除旧 settings.json
if exist "%TARGET%" del "%TARGET%"

:: 拷贝并去掉后缀（即生成新的 settings.json）
copy /y "%DIR%!src!" "%TARGET%" >nul

echo.
echo 已切换为：!base!
echo 按任意键退出...
pause >nul