import os
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from sqlalchemy import create_engine, Column, Integer, String, Boolean, MetaData, Table, insert, text
from sqlalchemy.orm import sessionmaker, scoped_session

app = Flask(__name__)
# Habilitar CORS para todas las rutas
CORS(app)
bcrypt = Bcrypt(app)

# ==========================================
# CONEXIÓN CON EL HIJO (MÓDULO DE CHAT)
# ==========================================
from chat import chat_bp
app.register_blueprint(chat_bp)

# --- CONFIGURACIÓN DE RUTAS ---
# Rutas absolutas en PythonAnywhere
BASE_DB_PATH = '/home/kenth1977/myDBs/DBs'
BASE_UPDATE_PATH = '/home/kenth1977/myDBs/updates'

# Asegurar que las carpetas necesarias existan físicamente al arrancar
for path in [BASE_DB_PATH, BASE_UPDATE_PATH]:
    if not os.path.exists(path):
        try:
            os.makedirs(path, exist_ok=True)
            print(f"[OK] Directorio creado: {path}")
        except Exception as e:
            print(f"[ERROR] No se pudo crear el directorio {path}: {e}")

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
        
        # -- MIGRACIÓN AUTOMÁTICA (Auto-Patch) --
        # Previene el error: "table user has no column named username"
        # Si la BD ya existe, intentamos inyectar la columna que falta.
        if db_exists:
            with engine.begin() as conn:
                try:
                    conn.execute(text("ALTER TABLE user ADD COLUMN username VARCHAR(80)"))
                except Exception:
                    pass # Si falla, significa que la columna ya existe, lo cual está bien.
        
        # SEED de datos iniciales solo si la DB es nueva
        if not db_exists:
            with engine.begin() as conn:
                try:
                    # ========================================================
                    # SUPERUSUARIO 1: kenth1977
                    # ========================================================
                    hashed_pw_1 = bcrypt.generate_password_hash('admin123').decode('utf-8')
                    # Insertar en tabla user (Auth)
                    conn.execute(user.insert().values(
                        username='admin_kenth',
                        email='kenth1977@gmail.com',
                        password=hashed_pw_1
                    ))
                    # Insertar perfil en tabla member (Frontend)
                    conn.execute(member.insert().values(
                        nombre='Administrador',
                        apellido1='Kenth',
                        pin='00000000',
                        puntos_totales=0
                    ))

                    # ========================================================
                    # SUPERUSUARIO 2: lthikingcr
                    # ========================================================
                    hashed_pw_2 = bcrypt.generate_password_hash('CR129x7848n').decode('utf-8')
                    # Insertar en tabla user (Auth)
                    conn.execute(user.insert().values(
                        username='admin_lthiking',
                        email='lthikingcr@gmail.com',
                        password=hashed_pw_2
                    ))
                    # Insertar perfil en tabla member (Frontend)
                    conn.execute(member.insert().values(
                        nombre='Administrador',
                        apellido1='LTHiking',
                        pin='88888888',
                        puntos_totales=0
                    ))

                    print(f"Base de datos {safe_slug}.db creada e inicializada con 2 superusuarios.")
                except Exception as e:
                    print(f"Error insertando seed inicial: {e}")
                    
    return session_factories[safe_slug]()


# --- RUTAS DE LA API ---

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

@app.route('/api/<app_slug>/registro', methods=['POST', 'OPTIONS'])
def registrar_usuario(app_slug):
    """Endpoint para registrar un nuevo usuario manejando CORS preflight"""
    
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    session = None
    try:
        data = request.json
        print(f"[*] Intento de registro en DB '{app_slug}' | Email: {data.get('email')}")
        
        session = get_db_session(app_slug)
        hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        username_interno = data['email']
        
        session.execute(
            text("INSERT INTO user (username, email, password) VALUES (:u, :e, :p)"),
            {"u": username_interno, "e": data['email'], "p": hashed_pw}
        )
        
        session.execute(
            text("INSERT INTO member (nombre, apellido1, pin, puntos_totales) VALUES (:n, :a, :pin, 0)"),
            {"n": data['nombre'], "a": data['apellido1'], "pin": data['pin']}
        )
        
        session.commit()
        print(f"[+] Registro exitoso en '{app_slug}' para {data.get('email')}")
        return jsonify({"status": "ok", "mensaje": "Usuario registrado exitosamente en la nube."})
        
    except Exception as e:
        if session:
            session.rollback()
        print(f"[-] Error en registro '{app_slug}': {e}")
        return jsonify({"error": str(e)}), 400
        
    finally:
        if session:
            session.close()

@app.route('/api/<app_slug>/login', methods=['POST', 'OPTIONS'])
def login_usuario(app_slug):
    """Endpoint real para iniciar sesión y recuperar datos"""
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200
        
    session = None
    try:
        data = request.json
        session = get_db_session(app_slug)
        
        # 1. Buscar el usuario por email en tabla 'user'
        user_record = session.execute(
            text("SELECT * FROM user WHERE email = :e"), 
            {"e": data['email']}
        ).mappings().fetchone()
        
        if not user_record:
            return jsonify({"error": "Credenciales incorrectas (Usuario no encontrado)"}), 401
            
        # 2. Verificar contraseña cifrada
        if not bcrypt.check_password_hash(user_record['password'], data['password']):
            return jsonify({"error": "Credenciales incorrectas (Contraseña inválida)"}), 401
            
        # 3. Obtener los datos del perfil en la tabla 'member'
        member_record = session.execute(
            text("SELECT * FROM member WHERE id = :id"),
            {"id": user_record['id']}
        ).mappings().fetchone()
        
        if not member_record:
            return jsonify({"error": "Perfil de usuario incompleto"}), 404
            
        # 4. Empaquetar los datos para el frontend
        usuario_data = {
            "nombre": f"{member_record['nombre']} {member_record['apellido1']}",
            "email": user_record['email'],
            "pin": member_record['pin'],
            "puntos": member_record['puntos_totales']
        }
        
        return jsonify({"status": "ok", "usuario": usuario_data})
        
    except Exception as e:
        print(f"[-] Error en login '{app_slug}': {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if session:
            session.close()

@app.route('/api/<app_slug>/editar_perfil', methods=['POST', 'OPTIONS'])
def editar_perfil(app_slug):
    """Endpoint real para actualizar datos del perfil"""
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    session = None
    try:
        data = request.json
        session = get_db_session(app_slug)
        
        # 1. Buscamos la ID del usuario usando su correo (que es único)
        user_record = session.execute(
            text("SELECT id FROM user WHERE email = :e"), 
            {"e": data['email']}
        ).mappings().fetchone()
        
        if not user_record:
            return jsonify({"error": "Usuario no encontrado"}), 404
            
        user_id = user_record['id']
        
        # 2. Actualizamos la tabla 'member' en la nube
        # Concatenamos los dos apellidos para que calcen en la columna apellido1 de tu BD actual
        apellidos_completos = data.get('apellido1', '') + " " + data.get('apellido2', '')
        
        session.execute(
            text("""
                UPDATE member 
                SET nombre = :n, apellido1 = :a, pin = :pin 
                WHERE id = :id
            """),
            {
                "n": data['nombre'], 
                "a": apellidos_completos.strip(), 
                "pin": data['pin'], 
                "id": user_id
            }
        )
        
        session.commit()
        return jsonify({"status": "ok", "mensaje": "Perfil actualizado en la nube"})
        
    except Exception as e:
        if session:
            session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if session:
            session.close()

# ==============================================================================
# RUTA PARA OBTENER LA LISTA DE CONTACTOS
# ==============================================================================
@app.route('/api/<app_slug>/contactos/<mi_pin>', methods=['GET'])
def obtener_contactos(app_slug, mi_pin):
    """Devuelve la lista de usuarios y la cantidad de mensajes sin leer"""
    session = None
    try:
        # Usamos tu motor dinámico existente en lugar de sqlite3 crudo
        session = get_db_session(app_slug)
        
        # 1. Obtenemos todos los miembros excepto nosotros mismos
        miembros = session.execute(
            text("SELECT id, nombre, apellido1, pin FROM member WHERE pin != :pin"),
            {"pin": mi_pin}
        ).mappings().fetchall()
        
        contactos = []
        for m in miembros:
            # Evitamos que salga "None" si el usuario no tiene apellido
            apellido = m['apellido1'] if m['apellido1'] else ''
            nombre_completo = f"{m['nombre']} {apellido}".strip()
            
            # 2. Contamos cuántos mensajes nos ha enviado que no hemos leído
            try:
                res = session.execute(
                    text("""
                        SELECT COUNT(*) as no_leidos 
                        FROM chat_message 
                        WHERE sender_pin = :sender AND receiver_pin = :receiver AND is_read = 0
                    """),
                    {"sender": m['pin'], "receiver": mi_pin}
                ).mappings().fetchone()
                no_leidos = res['no_leidos']
            except Exception:
                # Si la tabla de chat no existe aún, son 0
                no_leidos = 0 
                
            contactos.append({
                "pin": m['pin'],
                "nombre": nombre_completo,
                "no_leidos": no_leidos
            })
            
        return jsonify({"contactos": contactos})
    except Exception as e:
        print(f"Error cargando contactos para {app_slug}: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if session:
            session.close()

# ==============================================================================
# RUTA PUENTE PARA DESCARGAR ACTUALIZACIONES DESDE CARPETA PRIVADA
# ==============================================================================
@app.route('/descargas_ota/<path:filename>')
def descargar_ota(filename):
    """Sirve los archivos ZIP de actualización desde la carpeta protegida"""
    return send_from_directory(BASE_UPDATE_PATH, filename)

# ==============================================================================
# NUEVO: RUTA PARA ACTUALIZACIONES OTA (Over-The-Air)
# ==============================================================================
@app.route('/api/<app_slug>/check_update', methods=['GET', 'OPTIONS'])
def check_update(app_slug):
    """Endpoint para que el Frontend sepa si hay una nueva versión de HTML/CSS/JS"""
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    try:
        # Apuntamos la URL al nuevo 'puente' que acabamos de crear arriba
        # IMPORTANTE: Cambia este número de versión cada vez que subas un ZIP nuevo
        update_data = {
            "version": "2.0.0", 
            "url": f"https://kenth1977.pythonanywhere.com/descargas_ota/{app_slug}_v2.zip"
        }
        
        return jsonify(update_data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)