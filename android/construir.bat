@echo off
setlocal enabledelayedexpansion

:: 1. IR AL DIRECTORIO DEL SCRIPT
cd /d "%~dp0"

echo ==========================================
echo   MOTOR COMPILADOR ANDROID (CORE V5 - UI FIX)
echo ==========================================

:: 2. CARGAR VARIABLES DIRECTAMENTE DESDE CAPACITOR (SIN ARCHIVOS PUENTE)
echo [INFO] Leyendo la configuracion real del proyecto...
for /f "delims=" %%I in ('node -p "require('../capacitor.config.json').appName"') do set "CUSTOM_NAME=%%I"
for /f "delims=" %%I in ('node -p "require('../capacitor.config.json').appId"') do set "CUSTOM_APP_ID=%%I"
set "ICON_PATH="

if "!CUSTOM_NAME!"=="" set "CUSTOM_NAME=LaTribu"
if "!CUSTOM_APP_ID!"=="" set "CUSTOM_APP_ID=com.latribu.app"

:: Traductor WSL silencioso
if not "!ICON_PATH!"=="" (
    echo "!ICON_PATH!" | findstr /i /c:"/mnt/" >nul
    if !errorlevel! equ 0 (
        set "ICON_PATH=!ICON_PATH:/mnt/c/=C:\!"
        set "ICON_PATH=!ICON_PATH:/mnt/C/=C:\!"
        set "ICON_PATH=!ICON_PATH:/=\!"
    )
)

:: 3. CONFIGURACION VISUAL Y FIX DE UI OVERLAP
echo [INFO] Preparando nombre visible de la app: !CUSTOM_NAME!
set "STRINGS_FILE=app\src\main\res\values\strings.xml"
if exist "%STRINGS_FILE%" (
    (
        echo ^<?xml version='1.0' encoding='utf-8'?^>
        echo ^<resources^>
        echo     ^<string name="app_name"^>!CUSTOM_NAME!^</string^>
        echo     ^<string name="title_activity_main"^>!CUSTOM_NAME!^</string^>
        echo     ^<string name="package_name"^>!CUSTOM_APP_ID!^</string^>
        echo     ^<string name="custom_url_scheme"^>!CUSTOM_APP_ID!^</string^>
        echo ^</resources^>
    ) > "%STRINGS_FILE%"
)

:: --- NUEVO: FIX DE BARRA DE ESTADO PARA ANDROID 15 ---
:: Forzamos a Android a respetar la ventana y no dibujar debajo de la barra de estado
set "STYLES_FILE=app\src\main\res\values\styles.xml"
if not exist "app\src\main\res\values" mkdir "app\src\main\res\values"
if exist "%STYLES_FILE%" (
    echo [INFO] Inyectando fix de barra de estado en styles.xml...
    powershell -Command "(Get-Content '!STYLES_FILE!') -replace '</style>', '<item name=\"android:windowLayoutInDisplayCutoutMode\">default</item><item name=\"android:windowTranslucentStatus\">false</item><item name=\"android:windowTranslucentNavigation\">false</item></style>' | Set-Content '!STYLES_FILE!' -Encoding ASCII"
) else (
    (
        echo ^<?xml version="1.0" encoding="utf-8"?^>
        echo ^<resources^>
        echo     ^<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.NoActionBar"^>
        echo         ^<item name="android:windowLayoutInDisplayCutoutMode"^>default^</item^>
        echo         ^<item name="android:windowTranslucentStatus"^>false^</item^>
        echo         ^<item name="android:windowTranslucentNavigation"^>false^</item^>
        echo         ^<item name="android:statusBarColor"^>@android:color/transparent^</item^>
        echo     ^</style^>
        echo ^</resources^>
    ) > "%STYLES_FILE%"
)
:: --------------------------------------------------

if not "!ICON_PATH!"=="" if exist "!ICON_PATH!" (
    echo [INFO] Inyectando y optimizando iconos...
    set "FINAL_ICON=!ICON_PATH!"
    echo "!ICON_PATH!" | findstr /i "\.jpg \.jpeg" >nul
    if !errorlevel! equ 0 (
        powershell -Command "Add-Type -AssemblyName System.Drawing; try { [System.Drawing.Image]::FromFile('!ICON_PATH!').Save('icon_temp.png', [System.Drawing.Imaging.ImageFormat]::Png) } catch { exit 1 }"
        if exist "icon_temp.png" set "FINAL_ICON=icon_temp.png"
    )
    for %%D in (mipmap-mdpi mipmap-hdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi) do (
        if exist "app\src\main\res\%%D" (
            copy /y "!FINAL_ICON!" "app\src\main\res\%%D\ic_launcher.png" >nul
            copy /y "!FINAL_ICON!" "app\src\main\res\%%D\ic_launcher_round.png" >nul
            copy /y "!FINAL_ICON!" "app\src\main\res\%%D\ic_launcher_foreground.png" >nul
        )
    )
    if exist "icon_temp.png" del "icon_temp.png"
)

:: 4. LIMPIEZA DEL ENTORNO
if exist "local.properties" (
    echo [INFO] Limpiando configuraciones antiguas de SDK...
    del /F /Q "local.properties"
)

:: 5. BUSQUEDA INTELIGENTE DEL SDK DE ANDROID
echo.
echo [1/5] Buscando e inyectando SDK de Android...
set "SDK_PATH="

:: Probar ubicaciones comunes
if defined ANDROID_HOME (
    if exist "!ANDROID_HOME!" set "SDK_PATH=!ANDROID_HOME!"
)
if "!SDK_PATH!"=="" if exist "%LOCALAPPDATA%\Android\Sdk" set "SDK_PATH=%LOCALAPPDATA%\Android\Sdk"
if "!SDK_PATH!"=="" if exist "%USERPROFILE%\AppData\Local\Android\Sdk" set "SDK_PATH=%USERPROFILE%\AppData\Local\Android\Sdk"
if "!SDK_PATH!"=="" if exist "C:\Android\Sdk" set "SDK_PATH=C:\Android\Sdk"

:: Si no existe en ningun lado, interaccion con el usuario
:PEDIR_SDK
if "!SDK_PATH!"=="" (
    echo.
    echo [ADVERTENCIA] No se encontro el SDK de Android automaticamente.
    echo Necesitas el SDK para compilar. Si tienes Android Studio, busca la carpeta "Sdk".
    set /p "SDK_INPUT=Por favor, arrastra o escribe la ruta de tu SDK aqui: "
    
    :: Limpiar comillas de la entrada
    set "SDK_INPUT=!SDK_INPUT:"=!"
    
    if exist "!SDK_INPUT!" (
        set "SDK_PATH=!SDK_INPUT!"
    ) else (
        echo [ERROR] La ruta proporcionada no existe. Intenta de nuevo.
        goto PEDIR_SDK
    )
)

:: Guardar la ruta formateada con barras normales (/) que Gradle acepta nativamente sin errores
set "SDK_FWD=!SDK_PATH:\=/!"
echo sdk.dir=!SDK_FWD!> local.properties
set "ANDROID_HOME=!SDK_PATH!"
echo [OK] SDK enlazado exitosamente en: !SDK_PATH!

:: --- AUTO-ACEPTAR LICENCIAS DE GOOGLE ---
echo [INFO] Auto-aceptando terminos y licencias del SDK para evitar interrupciones...
if not exist "!SDK_PATH!\licenses" mkdir "!SDK_PATH!\licenses"

:: Escribir los hashes universales de licencia (Sin espacios adicionales)
echo 24333f8a63b6825ea9c5514f83c2829b004d1fee>"!SDK_PATH!\licenses\android-sdk-license"
echo 84831b9409646a918e30573bab4c9c91346d8abd>>"!SDK_PATH!\licenses\android-sdk-license"
echo d975f751698a77b662f1254ddbeed3901e976f5a>>"!SDK_PATH!\licenses\android-sdk-license"
echo 8933bad161af4178b1185d1a37fbf41ea5269c55>"!SDK_PATH!\licenses\android-sdk-preview-license"

:: Refuerzo intentando presionar 'Yes' automaticamente si existe el comando sdkmanager
if exist "!SDK_PATH!\cmdline-tools\latest\bin\sdkmanager.bat" (
    echo y | call "!SDK_PATH!\cmdline-tools\latest\bin\sdkmanager.bat" --licenses >nul 2>&1
) else if exist "!SDK_PATH!\tools\bin\sdkmanager.bat" (
    echo y | call "!SDK_PATH!\tools\bin\sdkmanager.bat" --licenses >nul 2>&1
)
:: -----------------------------------------------

:: 6. SINCRONIZACION CAPACITOR
echo.
echo [2/5] Sincronizando nucleo Web...
cd ..
if not exist "node_modules\@capacitor\core" (
    echo [INFO] Descargando dependencias Capacitor...
    call npm.cmd install --legacy-peer-deps
)

:: Auto-Instalación del plugin de barra de estado
if not exist "node_modules\@capacitor\status-bar" (
    echo [INFO] Instalando plugin de Barra de Estado para corregir diseño solapado...
    call npm.cmd install @capacitor/status-bar --legacy-peer-deps
)

call npx.cmd cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Sincronizacion de Capacitor fallida. Deteniendo proceso.
    cd android
    pause
    exit /b 1
)
cd android

:: 7. PARCHE PLUGIN CAPGO
set "BAD_JAVA=..\node_modules\@capgo\capacitor-updater\android\src\main\java\ee\forgr\capacitor_updater\DelayUpdateUtils.java"
if exist "!BAD_JAVA!" (
    powershell -Command "(Get-Content '!BAD_JAVA!') -replace 'case DelayUntilNext\.', 'case ' | Set-Content '!BAD_JAVA!' -Encoding ASCII"
)

:: 8. DETECCION DE JAVA
echo.
echo [3/5] Buscando Java de forma segura...
set "JAVA_HOME="
if exist "C:\Program Files\Android\Android Studio\jbr\bin\javac.exe" (
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
) else (
    for /d %%D in ("C:\Program Files\Microsoft\jdk-17*") do if exist "%%~fD\bin\javac.exe" set "JAVA_HOME=%%~fD"
    if not defined JAVA_HOME for /d %%D in ("C:\Program Files\Eclipse Adoptium\jdk-17*") do if exist "%%~fD\bin\javac.exe" set "JAVA_HOME=%%~fD"
    if not defined JAVA_HOME for /d %%D in ("C:\Program Files\Java\jdk-17*") do if exist "%%~fD\bin\javac.exe" set "JAVA_HOME=%%~fD"
)

if not defined JAVA_HOME (
    echo [ERROR CRITICO] No se detecto JDK 17.
    pause
    exit /b 1
)
echo [OK] Usando nucleo Java: !JAVA_HOME!

:: 9. INYECCION FORZADA DE COMPATIBILIDAD GRADLE
echo.
echo [4/5] Aplicando reglas de SDK 35 y Java 17...
(
    echo ext {
        echo     minSdkVersion = 24
        echo     compileSdkVersion = 35
        echo     targetSdkVersion = 35
        echo     javaVersion = 17
        echo     androidxActivityVersion = '1.9.0'
        echo     androidxAppCompatVersion = '1.6.1'
        echo     androidxCoordinatorLayoutVersion = '1.2.0'
        echo     androidxCoreVersion = '1.13.1'
        echo     androidxFragmentVersion = '1.7.1'
        echo     coreSplashScreenVersion = '1.0.1'
        echo     androidxWebkitVersion = '1.11.0'
        echo     junitVersion = '4.13.2'
        echo     androidxJunitVersion = '1.1.5'
        echo     androidxEspressoCoreVersion = '3.5.1'
        echo     cordovaAndroidVersion = '13.0.0'
    echo }
) > variables.gradle

(
    echo allprojects {
    echo     afterEvaluate { project -^>
    echo         if (project.hasProperty("android"^)^) {
    echo             android {
    echo                 compileOptions {
    echo                     sourceCompatibility = JavaVersion.VERSION_17
    echo                     targetCompatibility = JavaVersion.VERSION_17
    echo                 }
    echo             }
    echo         }
    echo     }
    echo     configurations.all {
    echo         resolutionStrategy {
    echo             force 'org.jetbrains.kotlin:kotlin-stdlib:1.8.22'
    echo             force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22'
    echo             force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22'
    echo         }
    echo     }
    echo }
) > force_compat.gradle

:: 10. COMPILACION FINAL
echo.
echo [5/5] Construyendo APK...
call gradlew.bat --stop >nul 2>&1
call gradlew.bat clean -Dorg.gradle.java.home="%JAVA_HOME%"
call gradlew.bat assembleDebug -Dorg.gradle.java.home="%JAVA_HOME%" --init-script force_compat.gradle --no-daemon

:: 11. LIMPIEZA
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo    EXITO TOTAL - Moviendo a \apks
    echo ==========================================
    if not exist "..\apks" mkdir "..\apks"
    if exist "..\apks\!CUSTOM_NAME!.apk" del "..\apks\!CUSTOM_NAME!.apk"
    move /y "app\build\outputs\apk\debug\app-debug.apk" "..\apks\!CUSTOM_NAME!.apk" >nul
    del force_compat.gradle
    
    echo [OK] El motor compilo tu app con exito.
    explorer "..\apks"
) else (
    echo.
    echo [ERROR] Gradle fallo en la construccion del APK.
)
pause