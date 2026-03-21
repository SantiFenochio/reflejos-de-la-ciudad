@echo off
cd /d C:\Users\Tino\Desktop\reflejos-de-la-ciudad
"C:\Program Files\Git\bin\git.exe" add -A
"C:\Program Files\Git\bin\git.exe" commit -m "feat: add sitemap"
"C:\Program Files\Git\bin\git.exe" push origin master
echo GIT_EXIT:%ERRORLEVEL%
