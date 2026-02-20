import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from sqlalchemy import create_engine, Column, Integer, String, Boolean, MetaData, Table, insert, text
from sqlalchemy.orm import sessionmaker, scoped_session

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# --- CONFIGURACIÓN DE RUTAS ---
# Ruta absoluta en PythonAnywhere
BASE_DB_PATH = '/home/kenth1977/myDBs/DBs'

# Asegurar que la carpeta de bases de datos exista físicamente al arrancar
if not os.path.exists(BASE_DB_PATH):
    try:
        os.makedirs(BASE_DB_PATH, exist_ok=True)
    except Exception as e:
        print(f"Error crítico creando directorio: {e}")

# Diccionarios para gestionar las conexiones dinámicas
engines = {}
session_factories = {}

def get_db_session(app_slug):
    """Recupera o crea la conexión a la base de datos de la App específica"""
    # Limpiamos el slug (solo letras y números) para evitar inyecciones en la ruta
    safe_slug = "".join([c for c in app_slug if c.isalnum()])
    db_path = os.path.join(BASE_DB_PATH, f"{safe_slug}.db")
    
    # Comprobamos si el archivo físico existe antes de intentar conectar
    db_exists = os.path.exists(db_path)
    
    if safe_slug not in engines:
        # Crear engine de SQLAlchemy para esta DB en particular
        engine = create_engine(f"sqlite:///{db_path}")
        engines[safe_slug] = engine
        session_factory = sessionmaker(bind=engine)
        session_factories[safe_slug] = scoped_session(session_factory)
        
        # Definir metadatos y tablas localmente para esta conexión
        metadata = MetaData()
        
        user = Table('user', metadata,
            Column('id', Integer, primary_key=True),
            Column('username', String(80), unique=True, nullable=False),
            Column('email', String(120), unique=True, nullable=False),
            Column('password', String(128), nullable=False)
        )
        
        member = Table('member', metadata,
            Column('id', Integer, primary_key=True),
            Column('nombre', String(100)),
            Column('apellido1', String(100)),
            Column('pin', String(20)),
            Column('puntos_totales', Integer, default=0)
        )
        
        event = Table('event', metadata,
            Column('id', Integer, primary_key=True),
            Column('nombre', String(100)),
            Column('fecha', String(50))
        )
        
        # Crear las tablas si no existen
        metadata.create_all(engine)
        
        # SEED de datos iniciales solo si la DB es nueva
        if not db_exists:
            with engine.begin() as conn:
                try:
                    # Insertar usuario administrador por defecto (Seed)
                    hashed_pw = bcrypt.generate_password_hash('admin123').decode('utf-8')
                    conn.execute(user.insert().values(
                        username='admin',
                        email='kenth1977@gmail.com',
                        password=hashed_pw
                    ))
                    print(f"Base de datos {safe_slug}.db creada e inicializada.")
                except Exception as e:
                    print(f"Error insertando seed inicial: {e}")
                    
    return session_factories[safe_slug]()

@app.route('/')
def index():
    """Diagnóstico inicial"""
    try:
        files = [f.replace('.db', '') for f in os.listdir(BASE_DB_PATH) if f.endswith('.db')]
    except:
        files = []
    return jsonify({
        "status": "online",
        "motor": "Universal Multi-App v2.0",
        "apps_activas_en_disco": files,
        "ayuda": "Visita /api/NombreDeTuApp/crear_ahora para generar una nueva base de datos."
    })

@app.route('/api/<app_slug>/crear_ahora')
def forzar_creacion(app_slug):
    """DISPARADOR: Esta ruta es la que físicamente crea el archivo .db"""
    try:
        get_db_session(app_slug)
        return jsonify({
            "status": "ok",
            "mensaje": f"Base de datos para '{app_slug}' lista para usar."
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # En PythonAnywhere esto normalmente es ignorado ya que se usa WSGI,
    # pero es útil si lo corres localmente para pruebas.
    app.run(debug=True, port=5000)