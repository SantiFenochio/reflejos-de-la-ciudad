$base1 = Get-Content "C:\Users\Tino\Desktop\reflejos-de-la-ciudad\tmp_img1.b64" -Raw
$base2 = Get-Content "C:\Users\Tino\Desktop\reflejos-de-la-ciudad\tmp_img2.b64" -Raw
[System.IO.File]::WriteAllBytes("C:\Users\Tino\Desktop\reflejos-de-la-ciudad\src\assets\ediciones-anteriores.png", [System.Convert]::FromBase64String($base1.Trim()))
[System.IO.File]::WriteAllBytes("C:\Users\Tino\Desktop\reflejos-de-la-ciudad\src\assets\ultima-edicion.png", [System.Convert]::FromBase64String($base2.Trim()))
Remove-Item "C:\Users\Tino\Desktop\reflejos-de-la-ciudad\tmp_img1.b64"
Remove-Item "C:\Users\Tino\Desktop\reflejos-de-la-ciudad\tmp_img2.b64"
Write-Host "OK: imagenes escritas en src/assets"
