import os
import sqlite3
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename

chat_bp = Blueprint('chat_api', __name__)

# --- CONFIGURACIÓN ---
BASE_DB_PATH = '/home/kenth1977/myDBs/DBs'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp3', 'wav', 'pdf', 'docx', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_chat_db_path(app_slug):
    safe_slug = "".join([c for c in app_slug if c.isalnum()])
    return os.path.join(BASE_DB_PATH, f"{safe_slug}.db")

def _init_chat_table(cursor):
    """Crea la tabla o la actualiza si es antigua (Auto-Patch)"""
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_message (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_pin TEXT,
            receiver_pin TEXT,
            texto TEXT,
            file_path TEXT,
            file_type TEXT,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Parche por si la tabla existía en su versión global anterior
    try:
        cursor.execute("ALTER TABLE chat_message ADD COLUMN sender_pin TEXT")
        cursor.execute("ALTER TABLE chat_message ADD COLUMN receiver_pin TEXT")
        cursor.execute("ALTER TABLE chat_message ADD COLUMN is_read INTEGER DEFAULT 0")
        cursor.execute("UPDATE chat_message SET sender_pin = pin WHERE sender_pin IS NULL")
    except Exception:
        pass

# ==============================================================================
# RUTAS DE CHAT PRIVADO
# ==============================================================================

@chat_bp.route('/api/<app_slug>/chat/<mi_pin>/<otro_pin>', methods=['GET'])
def obtener_mensajes_privados(app_slug, mi_pin, otro_pin):
    """Obtiene el chat entre 2 personas y marca los recibidos como leídos"""
    db_path = get_chat_db_path(app_slug)
    if not os.path.exists(db_path):
        return jsonify({"error": "Base de datos no existe"}), 404

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        _init_chat_table(cursor)

        # 1. Marcar como leídos los mensajes que 'otro_pin' me envió a mí ('mi_pin')
        cursor.execute('''
            UPDATE chat_message 
            SET is_read = 1 
            WHERE receiver_pin = ? AND sender_pin = ? AND is_read = 0
        ''', (mi_pin, otro_pin))
        conn.commit()

        # 2. Obtener la conversación cruzada
        cursor.execute('''
            SELECT * FROM chat_message 
            WHERE (sender_pin = ? AND receiver_pin = ?) 
               OR (sender_pin = ? AND receiver_pin = ?)
            ORDER BY created_at DESC LIMIT 50
        ''', (mi_pin, otro_pin, otro_pin, mi_pin))
        
        rows = cursor.fetchall()
        conn.close()
        
        mensajes = [dict(row) for row in rows]
        mensajes.reverse()
        
        for m in mensajes:
            if m.get('created_at'):
                try:
                    dt = datetime.strptime(m['created_at'], '%Y-%m-%d %H:%M:%S')
                    m['fecha'] = dt.strftime('%H:%M')
                except:
                    m['fecha'] = str(m['created_at'])[-8:-3]

        return jsonify(mensajes)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chat_bp.route('/api/<app_slug>/chat/enviar', methods=['POST'])
def enviar_mensaje(app_slug):
    """Guarda un mensaje privado y su archivo adjunto"""
    db_path = get_chat_db_path(app_slug)
    if not os.path.exists(db_path):
        return jsonify({"error": "Base de datos no encontrada"}), 404

    try:
        nombre = request.form.get('nombre')
        sender_pin = request.form.get('sender_pin')
        receiver_pin = request.form.get('receiver_pin') # Novedad: Ahora sabe a quién va
        texto = request.form.get('texto')
        
        file_url = None
        f_type = None

        if 'file' in request.files:
            file = request.files['file']
            if file and allowed_file(file.filename):
                filename = secure_filename(f"{app_slug}_{datetime.now().timestamp()}_{file.filename}")
                upload_path = os.path.join(current_app.root_path, 'static', 'uploads', 'chat')
                if not os.path.exists(upload_path): os.makedirs(upload_path)
                
                file.save(os.path.join(upload_path, filename))
                file_url = f"/static/uploads/chat/{filename}"
                
                ext = filename.rsplit('.', 1)[1].lower()
                if ext in ['png', 'jpg', 'jpeg', 'gif']: f_type = 'image'
                elif ext in ['mp3', 'wav']: f_type = 'audio'
                else: f_type = 'doc'

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        _init_chat_table(cursor)
        
        cursor.execute('''
            INSERT INTO chat_message (sender_pin, receiver_pin, texto, file_path, file_type, is_read)
            VALUES (?, ?, ?, ?, ?, 0)
        ''', (sender_pin, receiver_pin, texto, file_url, f_type))
        
        conn.commit()
        conn.close()
        
        return jsonify({"status": "ok", "file_url": file_url})
    except Exception as e:
        print("Error subiendo archivo:", str(e))
        return jsonify({"error": str(e)}), 500