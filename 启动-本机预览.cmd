@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo 本机预览需要 Node.js 24，请先按 README 的说明安装。
 pause
 exit /b 1
)
set PORT=8080
set HOST=127.0.0.1
set APP_ORIGIN=http://localhost:8080
echo 请在浏览器打开 http://localhost:8080 并保留本窗口。
node server.mjs
pause
