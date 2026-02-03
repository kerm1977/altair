@echo off
setlocal enabledelayedexpansion

:: Aseguramos que el script trabaje en su propio directorio
cd /d "%~dp0"

echo ==========================================
echo    PERSONALIZACION DE TU APP
echo ==========================================

:: 1. PREGUNTA EL NOMBRE (Para el APK y para el icono en el celular)
set /p CUSTOM_NAME="--> Nombre de tu App (Ej: MiTienda): "
if "%CUSTOM_NAME%"=="" set CUSTOM_NAME=miapp

:: 2. PREGUNTA POR EL ICONO
echo.
echo (Opcional) Arrastra aqui tu imagen .PNG para usarla como icono.
echo Si no pones nada, se usara el logo por defecto de Capacitor.
set /p ICON_PATH="--> Ruta del Icono: "
:: Limpiamos las comillas que Windows pone al arrastrar archivos
set "ICON_PATH=!ICON_PATH:"=!"

echo.
echo ==========================================
echo    APLICANDO CAMBIOS VISUALES
echo ==========================================

:: --- A. CAMBIAR NOMBRE VISIBLE (strings.xml) ---
:: Esto hace que debajo del icono en el celular aparezca el nombre que elegiste
set "STRINGS_FILE=app\src\main\res\values\strings.xml"

if exist "%STRINGS_FILE%" (
    echo [CFG] Configurando nombre visible a: %CUSTOM_NAME%
    (
        echo ^<?xml version='1.0' encoding='utf-8'?^>
        echo ^<resources^>
        echo     ^<string name="app_name"^>%CUSTOM_NAME%^</string^>
        echo     ^<string name="title_activity_main"^>%CUSTOM_NAME%^</string^>
        echo     ^<string name="package_name"^>com.miapp.local^</string^>
        echo     ^<string name="custom_url_scheme"^>com.miapp.local^</string^>
        echo ^</resources^>
    ) > "%STRINGS_FILE%"
) else (
    echo [WARN] No se encontro strings.xml, el nombre interno no cambiara.
)

:: --- B. CAMBIAR ICONOS (Si hay imagen) ---
if not "%ICON_PATH%"=="" (
    if exist "%ICON_PATH%" (
        echo [CFG] Reemplazando iconos con tu imagen...
        
        :: Reemplazamos en todas las calidades (mdpi hasta xxxhdpi)
        set "RES_FOLDERS=mipmap-mdpi mipmap-hdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi"
        
        for %%D in (!RES_FOLDERS!) do (
            set "TARGET_DIR=app\src\main\res\%%D"
            if exist "!TARGET_DIR!" (
                copy /y "%ICON_PATH%" "!TARGET_DIR!\ic_launcher.png" >nul
                copy /y "%ICON_PATH%" "!TARGET_DIR!\ic_launcher_round.png" >nul
                :: Forzamos tambien el foreground para asegurar cambio en versiones nuevas
                copy /y "%ICON_PATH%" "!TARGET_DIR!\ic_launcher_foreground.png" >nul
            )
        )
        echo [OK] Iconos actualizados exitosamente.
    ) else (
        echo [ERROR] No encontre la imagen en esa ruta. Se usara el icono original.
    )
)

echo.
echo ==========================================
echo    BUSCANDO JAVA (PRIORIDAD: 17 LTS)
echo ==========================================

set "JAVA_HOME="
set "DETECTED_VER=0"

:: --- 1. BUSQUEDA PRIORITARIA ---
set "LOCATIONS="C:\Program Files\Eclipse Adoptium" "C:\Program Files\Java" "C:\Program Files\Microsoft""
set "STABLE_VERSIONS=17 21"

for %%V in (%STABLE_VERSIONS%) do (
    for %%L in (%LOCATIONS%) do (
        if not defined JAVA_HOME (
            for /d %%D in ("%%~L\jdk-%%V*") do (
                if exist "%%~fD\bin\javac.exe" (
                    set "JAVA_HOME=%%~fD"
                    echo [AUTO] Encontrado Java %%V: %%~fD
                    goto :VERIFY_VERSION
                )
            )
        )
    )
)

:: --- 2. FALLBACK SISTEMA ---
if not defined JAVA_HOME (
    for /f "delims=" %%i in ('where javac 2^>nul') do set "SYSTEM_JAVAC=%%i"
    if defined SYSTEM_JAVAC (
        for %%F in ("!SYSTEM_JAVAC!\..\..") do set "JAVA_HOME=%%~fF"
    )
)

:VERIFY_VERSION
if not defined JAVA_HOME (
    echo [ERROR] No se encontro Java 17.
    pause
    exit
)

set PATH=%JAVA_HOME%\bin;%PATH%
for /f "tokens=3" %%g in ('java -version 2^>^&1 ^| findstr "version"') do set "JAVA_VER_RAW=%%g"
set "JAVA_VER_RAW=!JAVA_VER_RAW:"=!"
for /f "delims=." %%v in ("!JAVA_VER_RAW!") do set "DETECTED_VER=%%v"

echo [OK] Usando Java %DETECTED_VER% en: %JAVA_HOME%

:: --- 3. REPARAR VARIABLES.GRADLE (SDK 35 / JAVA 17) ---
if exist variables.gradle (
    echo [CFG] Asegurando variables.gradle correcto...
    echo ext { > variables.gradle
    echo     minSdkVersion = 24 >> variables.gradle
    echo     compileSdkVersion = 35 >> variables.gradle
    echo     targetSdkVersion = 35 >> variables.gradle
    echo     javaVersion = 17 >> variables.gradle
    echo     androidxActivityVersion = '1.9.0' >> variables.gradle
    echo     androidxAppCompatVersion = '1.6.1' >> variables.gradle
    echo     androidxCoordinatorLayoutVersion = '1.2.0' >> variables.gradle
    echo     androidxCoreVersion = '1.13.1' >> variables.gradle
    echo     androidxFragmentVersion = '1.7.1' >> variables.gradle
    echo     coreSplashScreenVersion = '1.0.1' >> variables.gradle
    echo     androidxWebkitVersion = '1.11.0' >> variables.gradle
    echo     junitVersion = '4.13.2' >> variables.gradle
    echo     androidxJunitVersion = '1.1.5' >> variables.gradle
    echo     androidxEspressoCoreVersion = '3.5.1' >> variables.gradle
    echo     cordovaAndroidVersion = '13.0.0' >> variables.gradle
    echo } >> variables.gradle
)

:: --- 4. GENERAR SCRIPT DE FORZADO ---
echo [CFG] Creando script de anulacion de version Java y correccion Kotlin...

echo allprojects { > force_compat.gradle
echo     afterEvaluate { project -^> >> force_compat.gradle
echo         if (project.hasProperty("android")) { >> force_compat.gradle
echo             android { >> force_compat.gradle
echo                 compileOptions { >> force_compat.gradle
echo                     sourceCompatibility = JavaVersion.VERSION_17 >> force_compat.gradle
echo                     targetCompatibility = JavaVersion.VERSION_17 >> force_compat.gradle
echo                 } >> force_compat.gradle
echo             } >> force_compat.gradle
echo         } >> force_compat.gradle
echo     } >> force_compat.gradle
echo     configurations.all { >> force_compat.gradle
echo         resolutionStrategy { >> force_compat.gradle
echo             force 'org.jetbrains.kotlin:kotlin-stdlib:1.8.22' >> force_compat.gradle
echo             force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.8.22' >> force_compat.gradle
echo             force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22' >> force_compat.gradle
echo         } >> force_compat.gradle
echo     } >> force_compat.gradle
echo } >> force_compat.gradle

echo ==========================================
echo    LIMPIANDO DEMONIOS...
echo ==========================================
call gradlew.bat --stop

echo ==========================================
echo    COMPILANDO APK...
echo ==========================================

call gradlew.bat assembleDebug -Dorg.gradle.java.home="%JAVA_HOME%" --init-script force_compat.gradle --no-daemon

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo    EXITO - MOVIENDO A CARPETA LIMPIA
    echo ==========================================
    
    set "SOURCE_FILE=app\build\outputs\apk\debug\app-debug.apk"
    set "TARGET_DIR=..\apks"
    set "TARGET_FILE=!TARGET_DIR!\%CUSTOM_NAME%.apk"
    
    if not exist "!TARGET_DIR!" (
        echo [INFO] Creando carpeta apks...
        mkdir "!TARGET_DIR!"
    )
    
    if exist "!TARGET_FILE!" del "!TARGET_FILE!"
    
    move /y "!SOURCE_FILE!" "!TARGET_FILE!" >nul
    del force_compat.gradle
    
    echo.
    echo [OK] LISTO! Tu APK esta en: miapp\apks\%CUSTOM_NAME%.apk
    explorer "!TARGET_DIR!"
) else (
    echo.
    echo [ERROR] Fallo la compilacion. Revisa los errores.
)

pause