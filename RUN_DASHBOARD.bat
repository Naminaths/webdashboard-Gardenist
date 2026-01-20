@echo off
echo Memulai Server Smart Garden...
echo Mohon jangan tutup jendela ini selama menggunakan dashboard.
echo.
echo Membuka Browser...
start http://localhost:8000
python -m http.server 8000 --directory public
