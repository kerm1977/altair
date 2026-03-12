# ==============================================================================
# ARCHIVO: app.py (Versión Refactorizada y Segura)
# ROL: EL ABUELO (Master Gateway de PythonAnywhere) - Versión Modular
# DESCRIPCIÓN: Puerta de entrada principal. Habilita CORS globalmente, 
#              gestiona autenticación con JWT y usa ORM universal (db.py).
# ==============================================================================

if __name__ == '__main__':
    print("[OK] Gateway Maestro iniciado. Arquitectura Unificada ORM v3.0")
    app.run(debug=True, host='0.0.0.0', port=5000)