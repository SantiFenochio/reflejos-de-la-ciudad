@echo off
cd /d C:\Users\Tino\Desktop\reflejos-de-la-ciudad
"C:\Program Files\nodejs\node.exe" node_modules\astro\bin\astro.mjs build > build_out.txt 2>&1
echo EXIT_CODE:%ERRORLEVEL% >> build_out.txt
