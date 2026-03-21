@echo off
cd /d C:\Users\Tino\Desktop\reflejos-de-la-ciudad
"C:\Program Files\Git\bin\git.exe" add -A
"C:\Program Files\Git\bin\git.exe" commit -m "chore: remove temp build scripts and logs"
"C:\Program Files\Git\bin\git.exe" push origin master
echo DONE:%ERRORLEVEL%
