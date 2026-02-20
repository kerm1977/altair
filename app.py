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
    # Limpiamos el slug (solo letras y números)
    safe_slug = "".join([c for c in app_slug if c.isalnum()])
    db_path = os.path.join(BASE_DB_PATH, f"{safe_slug}.db")
    
    # Comprobamos si el archivo físico existe antes de intentar conectar
    db_existe_fisicamente = os.path.exists(db_path)
    
    if safe_slug not in engines:
        # Creamos el motor de base de datos SQLite
        engine = create_engine(f'sqlite:///{db_path}', connect_args={'check_same_thread': False})
        engines[safe_slug] = engine
        session_factories[safe_slug] = scoped_session(sessionmaker(bind=engine))
        
        # SI EL ARCHIVO NO EXISTÍA, ejecutamos la creación de tablas y datos iniciales
        if not db_existe_fisicamente:
            init_db_structure(engine, safe_slug)
        
    return session_factories[safe_slug]()

def init_db_structure(engine, app_slug):
    """Define las tablas y crea datos iniciales (Administradores y un Miembro de Prueba)"""
    metadata = MetaData()
    
    # Tabla de Usuarios (Administradores)
    user_table = Table('user', metadata,
        Column('id', Integer, primary_key=True),
        Column('email', String(150), unique=True, nullable=False),
        Column('password', String(200), nullable=False),
        Column('is_superuser', Boolean, default=False)
    )
    
    # Tabla de Miembros (Ranking)
    member_table = Table('member', metadata,
        Column('id', Integer, primary_key=True),
        Column('nombre', String(100), nullable=False),
        Column('apellido1', String(100)),
        Column('pin', String(50), unique=True),
        Column('puntos_totales', Integer, default=0)
    )
    
    # Tabla de Eventos (Caminatas)
    event_table = Table('event', metadata,
        Column('id', Integer, primary_key=True),
        Column('nombre', String(150), nullable=False),
        Column('fecha', String(50), nullable=False)
    )
    
    # Crea las tablas físicamente en el archivo .db
    metadata.create_all(engine)
    
    # Datos de los administradores maestros
    masters = [
        {"email": "kenth1977@gmail.com", "pass": "CR129x7848n"},
        {"email": "lthikingcr@gmail.com", "pass": "CR129x7848n"}
    ]
    
    with engine.connect() as conn:
        # Insertar los administradores
        for m in masters:
            hashed_pass = bcrypt.generate_password_hash(m['pass']).decode('utf-8')
            conn.execute(insert(user_table).values(
                email=m['email'], 
                password=hashed_pass, 
                is_superuser=True
            ))
        
        # Insertar un miembro inicial de prueba con el nombre de la App
        conn.execute(insert(member_table).values(
            nombre="Guerrero Inicial", 
            apellido1=app_slug, 
            pin="1234", 
            puntos_totales=100
        ))
        
        # Insertar un evento de prueba
        conn.execute(insert(event_table).values(
            nombre=f"Primera Caminata {app_slug}", 
            fecha="2024-12-01"
        ))
        
        conn.commit()

# ==============================================================================
# RUTAS DE LA API (UNIVERSALES)
# ==============================================================================

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

@app.route('/api/<app_slug>/ranking', methods=['GET'])
def api_ranking_movil(app_slug):
    try:
        session = get_db_session(app_slug)
        query = text("SELECT id, nombre, apellido1, pin, puntos_totales FROM member ORDER BY puntos_totales DESC")
        result = session.execute(query).fetchall()
        
        lista = [{
            "id": r[0], "nombre": r[1], "apellido1": r[2], 
            "pin": r[3], "puntos_totales": r[4] or 0
        } for r in result]
        
        return jsonify(lista)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/<app_slug>/eventos', methods=['GET'])
def api_eventos(app_slug):
    try:
        session = get_db_session(app_slug)
        query = text("SELECT id, nombre, fecha FROM event")
        result = session.execute(query).fetchall()
        lista = [{"id": r[0], "nombre": r[1], "fecha": r[2]} for r in result]
        return jsonify(lista)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/<app_slug>/crear_ahora')
def forzar_creacion(app_slug):
    """DISPARADOR: Esta ruta es la que físicamente crea el archivo .db"""
    try:
        get_db_session(app_slug)
        return jsonify({
            "status": "ok", 
            "message": f"¡Éxito! La base de datos '{app_slug}.db' ha sido creada y configurada en el servidor.",
            "proximo_paso": "Ya puedes ver el ranking en /api/" + app_slug + "/ranking"
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    app.run(debug=True)