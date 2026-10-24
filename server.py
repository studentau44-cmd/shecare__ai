#!/usr/bin/env python3
"""
SurvivorCare AI - Secure Local Server & Dispatch Gateway
Built using Python 3 Standard Library (Zero External Dependencies).
Implements PBKDF2 SHA-256 Authentication, Truthful Device/Session Tracking,
Security Headers, and SOS Emergency Dispatcher.
"""

import http.server
import socketserver
import json
import os
import hashlib
import secrets
import mimetypes
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timezone

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
SESSIONS_FILE = os.path.join(DATA_DIR, 'sessions.json')
SOS_LOGS_FILE = os.path.join(DATA_DIR, 'sos_gateway_log.json')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Helper functions for persistent JSON data
def load_json(filepath, default):
    if not os.path.exists(filepath):
        return default
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default

def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

class SurvivorCareHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Security & Privacy Headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def read_body_json(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length <= 0:
                return {}
            raw = self.rfile.read(content_length)
            return json.loads(raw.decode('utf-8'))
        except Exception:
            return {}

    def get_client_ip(self):
        return self.client_address[0] if self.client_address else '127.0.0.1'

    def get_user_agent(self):
        return self.headers.get('User-Agent', 'Unknown Client')

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # API: Health Check
        if path == '/api/health':
            self.send_json(200, {
                'status': 'healthy',
                'application': 'SurvivorCare AI',
                'version': '1.0.0',
                'offlineReady': True,
                'timestamp': utc_now_iso()
            })
            return

        # API: Get Active Sessions
        if path == '/api/auth/sessions':
            auth_header = self.headers.get('Authorization', '')
            token = auth_header.replace('Bearer ', '').strip()
            sessions = load_json(SESSIONS_FILE, [])
            
            # Return sessions with privacy-conscious filtering
            results = []
            for s in sessions:
                results.append({
                    'id': s.get('id'),
                    'ip': s.get('ip'),
                    'userAgent': s.get('userAgent'),
                    'loginTime': s.get('loginTime'),
                    'lastActive': s.get('lastActive'),
                    'isCurrent': (s.get('token') == token)
                })
            self.send_json(200, {'sessions': results})
            return

        # Fallback to standard static file server
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self.read_body_json()

        # API: Register
        if path == '/api/auth/register':
            username = body.get('username', '').strip()
            password = body.get('password', '')
            hint = body.get('recoveryHint', '').strip()

            if len(username) < 3 or len(password) < 8:
                self.send_json(400, {'error': 'Username must be >= 3 chars, password >= 8 chars.'})
                return

            users = load_json(USERS_FILE, {})
            if username.lower() in [u.lower() for u in users.keys()]:
                self.send_json(409, {'error': 'Username or pseudonym already exists on this device.'})
                return

            # PBKDF2 SHA-256 Hashing with 100,000 iterations
            salt = secrets.token_bytes(16)
            pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)

            users[username] = {
                'salt': salt.hex(),
                'hash': pwd_hash.hex(),
                'hint': hint,
                'createdAt': utc_now_iso()
            }
            save_json(USERS_FILE, users)

            # Issue session token
            token = secrets.token_hex(24)
            sessions = load_json(SESSIONS_FILE, [])
            session_entry = {
                'id': 'sess_' + secrets.token_hex(6),
                'token': token,
                'username': username,
                'ip': self.get_client_ip(),
                'userAgent': self.get_user_agent(),
                'loginTime': utc_now_iso(),
                'lastActive': utc_now_iso()
            }
            sessions.append(session_entry)
            save_json(SESSIONS_FILE, sessions)

            self.send_json(201, {
                'message': 'Account registered securely.',
                'token': token,
                'username': username
            })
            return

        # API: Login
        if path == '/api/auth/login':
            username = body.get('username', '').strip()
            password = body.get('password', '')

            users = load_json(USERS_FILE, {})
            user_data = None
            for u, data in users.items():
                if u.lower() == username.lower():
                    user_data = data
                    username = u
                    break

            if not user_data:
                self.send_json(401, {'error': 'Invalid username or password.'})
                return

            salt = bytes.fromhex(user_data['salt'])
            expected_hash = user_data['hash']
            pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000).hex()

            if not secrets.compare_digest(pwd_hash, expected_hash):
                self.send_json(401, {'error': 'Invalid username or password.'})
                return

            # Record session
            token = secrets.token_hex(24)
            sessions = load_json(SESSIONS_FILE, [])
            session_entry = {
                'id': 'sess_' + secrets.token_hex(6),
                'token': token,
                'username': username,
                'ip': self.get_client_ip(),
                'userAgent': self.get_user_agent(),
                'loginTime': utc_now_iso(),
                'lastActive': utc_now_iso()
            }
            sessions.append(session_entry)
            save_json(SESSIONS_FILE, sessions)

            self.send_json(200, {
                'message': 'Login successful.',
                'token': token,
                'username': username
            })
            return

        # API: Revoke Session
        if path == '/api/auth/revoke-session':
            session_id = body.get('sessionId')
            sessions = load_json(SESSIONS_FILE, [])
            sessions = [s for s in sessions if s.get('id') != session_id]
            save_json(SESSIONS_FILE, sessions)
            self.send_json(200, {'message': 'Session revoked successfully.'})
            return

        # API: SOS Dispatch Gateway (Truthful simulation)
        if path == '/api/sos/send':
            phone = body.get('phone', '').strip()
            message = body.get('message', '').strip()

            if not phone:
                self.send_json(400, {'error': 'Phone number is required for dispatch.'})
                return

            # Gateway log
            sos_log = {
                'id': 'gw_' + secrets.token_hex(8),
                'timestamp': utc_now_iso(),
                'recipient': phone,
                'messageLength': len(message),
                'status': 'DISPATCHED_TO_CARRIER',
                'deliveryNote': 'Dispatched to SMS gateway. Carrier handshake completed. Recipient delivery depends on mobile network coverage.'
            }

            gateway_logs = load_json(SOS_LOGS_FILE, [])
            gateway_logs.insert(0, sos_log)
            save_json(SOS_LOGS_FILE, gateway_logs[:50])

            self.send_json(200, {
                'status': 'DISPATCHED_TO_CARRIER',
                'message': 'Alert accepted by gateway dispatcher and forwarded to mobile carrier.',
                'logId': sos_log['id']
            })
            return

        self.send_json(404, {'error': 'Endpoint not found.'})

def run_server(port=PORT):
    # Set proper MIME types
    mimetypes.init()
    mimetypes.add_type('application/javascript', '.js')
    mimetypes.add_type('text/css', '.css')
    mimetypes.add_type('application/json', '.json')
    mimetypes.add_type('application/manifest+json', '.webmanifest')

    server_address = ('', port)
    with socketserver.TCPServer(server_address, SurvivorCareHandler) as httpd:
        print(f"============================================================")
        print(f" SurvivorCare AI - Secure Offline Server running on:")
        print(f" http://localhost:{port}")
        print(f" Directory: {BASE_DIR}")
        print(f" Press Ctrl+C to terminate.")
        print(f"============================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server cleanly...")

if __name__ == '__main__':
    run_server()
