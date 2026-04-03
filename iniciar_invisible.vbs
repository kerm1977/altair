Set WshShell = CreateObject("WScript.Shell")

' 1. DETENER TODO PRIMERO (Evita puertos bloqueados matando procesos zombis invisibles)
' El "True" al final hace que espere a que mueran antes de continuar.
WshShell.Run "cmd /c taskkill /F /IM node.exe /T", 0, True
WshShell.Run "cmd /c taskkill /F /IM pocketbase.exe /T", 0, True

' 2. RUTA ABSOLUTA FORZADA (Evita que Windows se pierda)
WshShell.CurrentDirectory = "C:\Users\MINIOS\Desktop\altair"

' 3. Iniciar el Backend (PocketBase y Tailscale) y guardar el registro
WshShell.Run "cmd /c node runserver.js > backend_log.txt 2>&1", 0, False

' 4. Iniciar el Frontend forzando el puerto 8081 y guardar el registro
WshShell.Run "cmd /c npx http-server www -c-1 -p 8081 > frontend_log.txt 2>&1", 0, False

' 5. Esperar 8 segundos completos para garantizar que ambos motores arranquen en limpio
WScript.Sleep 8000

' 6. Abrir automáticamente el navegador en el puerto correcto (8081)
WshShell.Run "http://127.0.0.1:8081/base.html"