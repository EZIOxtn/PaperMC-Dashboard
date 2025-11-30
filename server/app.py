import os
import sys
import subprocess
import threading
import time
import json
import re
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, send
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Socket.IO
socketio = SocketIO(
    app, 
    cors_allowed_origins="*", 
    async_mode='threading',
    logger=False,
    engineio_logger=False,
    ping_timeout=60,
    ping_interval=25
)

# Error handler for Socket.IO
@app.errorhandler(Exception)
def handle_error(e):
    """Handle exceptions"""
    import traceback
    print(f'Error: {e}')
    traceback.print_exc()
    return jsonify({'success': False, 'message': str(e)}), 500

# Configuration
SERVER_PATH = os.getenv('SERVER_PATH', 'C:\\Users\\E Z I O\\AppData\\Roaming\\.minecraft\\')
SERVER_JAR = os.getenv('SERVER_JAR', 'paper-1.21.4-232.jar')
JAVA_PATH = os.getenv('JAVA_PATH', 'java')
SERVER_PORT = 25565
API_PORT = int(os.getenv('PORT', 3001))

server_process = None
server_status = 'stopped'  # stopped, starting, running, stopping
logs = []
max_logs = 1000


def broadcast(data):
    """Broadcast message to all connected WebSocket clients"""
    socketio.emit('message', data, namespace='/')


def add_log(message):
    """Add log entry and broadcast"""
    timestamp = datetime.now().isoformat()
    log_entry = f"[{timestamp}] {message}"
    logs.append(log_entry)
    if len(logs) > max_logs:
        logs.pop(0)
    broadcast({'type': 'log', 'message': log_entry})


def find_java_executable():
    """Find Java executable"""
    # If explicitly set and is absolute path, verify it exists
    if os.path.isabs(JAVA_PATH):
        if os.path.exists(JAVA_PATH):
            return JAVA_PATH
        add_log(f'WARNING: Java not found at {JAVA_PATH}, searching...')
    
    # If JAVA_PATH is 'java', try to find it
    if JAVA_PATH == 'java':
        # On Windows, use 'where' command
        if sys.platform == 'win32':
            try:
                result = subprocess.run(['where', 'java'], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    java_path = result.stdout.strip().split('\n')[0].strip()
                    print(java_path)
                    if java_path and os.path.exists(java_path):
                        return java_path
            except Exception as e:
                pass
            
            # Try common Java locations on Windows
            common_paths = [
                'C:\\Program Files\\Java\\jdk-21\\bin\\java.exe',
                'C:\\Program Files\\Java\\jdk-20\\bin\\java.exe',
                'C:\\Program Files\\jdk-17\\bin\\java.exe',
                'C:\\Program Files\\Java\\jdk-11\\bin\\java.exe',
                'C:\\Program Files\\Java\\jre1.8.0_51\\bin\\java.exe',
                'C:\\Program Files\\Java\\jre-21\\bin\\java.exe',
                'C:\\Program Files\\Java\\jre-17\\bin\\java.exe',
                'C:\\Program Files\\Java\\jre-11\\bin\\java.exe',
            ]
            
            java_home = os.getenv('JAVA_HOME')
            if java_home:
                common_paths.insert(0, os.path.join(java_home, 'bin', 'java.exe'))
            
            for java_path in common_paths:
                if os.path.exists(java_path):
                    return java_path
    
    # Fallback to whatever JAVA_PATH is set to
    return JAVA_PATH


def read_process_output(process):
    """Read server stdout & stderr and broadcast logs through socket.io"""
    def stream_output(stream, label):
        while True:
            line = stream.readline()
            if not line:
                break

            try:
                text = line.decode("utf-8", errors="replace").rstrip()
            except:
                text = str(line)

            # Save in internal log buffer
            add_log(text)

            # Send through WebSocket
            broadcast({
                "type": "log",
                "source": label,
                "line": text
            })

    # Read both stdout & stderr in background threads
    threading.Thread(target=stream_output, args=(process.stdout, "stdout"), daemon=True).start()
    threading.Thread(target=stream_output, args=(process.stderr, "stderr"), daemon=True).start()
    """Read stdout and stderr from process"""
    def read_stdout():
        if process.stdout:
            buffer = b''
            while True:
                if process.poll() is not None:
                    # Process has ended, read remaining data
                    remaining = process.stdout.read()
                    if remaining:
                        buffer += remaining
                        lines = buffer.decode('utf-8', errors='replace').split('\n')
                        buffer = lines[-1].encode('utf-8') if lines else b''
                        for line in lines[:-1]:
                            if line.strip():
                                add_log(line.strip())
                    break
                
                try:
                    chunk = process.stdout.read(4096)
                    if not chunk:
                        time.sleep(0.1)
                        continue
                    
                    buffer += chunk
                    # Split by newlines
                    while b'\n' in buffer:
                        line, buffer = buffer.split(b'\n', 1)
                        line_str = line.decode('utf-8', errors='replace').strip()
                        if line_str:
                            add_log(line_str)
                except Exception as e:
                    add_log(f'[ERROR] Error reading stdout: {str(e)}')
                    break
    
    def read_stderr():
        if process.stderr:
            buffer = b''
            while True:
                if process.poll() is not None:
                    # Process has ended, read remaining data
                    remaining = process.stderr.read()
                    if remaining:
                        buffer += remaining
                        lines = buffer.decode('utf-8', errors='replace').split('\n')
                        buffer = lines[-1].encode('utf-8') if lines else b''
                        for line in lines[:-1]:
                            if line.strip():
                                add_log(f'[STDERR] {line.strip()}')
                    break
                
                try:
                    chunk = process.stderr.read(4096)
                    if not chunk:
                        time.sleep(0.1)
                        continue
                    
                    buffer += chunk
                    # Split by newlines
                    while b'\n' in buffer:
                        line, buffer = buffer.split(b'\n', 1)
                        line_str = line.decode('utf-8', errors='replace').strip()
                        if line_str:
                            add_log(f'[STDERR] {line_str}')
                except Exception as e:
                    add_log(f'[ERROR] Error reading stderr: {str(e)}')
                    break
    
    threading.Thread(target=read_stdout, daemon=True).start()
    threading.Thread(target=read_stderr, daemon=True).start()


def start_server():
    """Start PaperMC server"""
    global server_process, server_status
    
    if server_process or server_status != 'stopped':
        return {'success': False, 'message': 'Server is already running or starting'}
    
    try:
        server_status = 'starting'
        broadcast({'type': 'status', 'status': server_status})
        add_log('Starting PaperMC server...')
        
        # Find Java executable
        java_executable = find_java_executable()
        add_log(f'Using Java: {java_executable}')
        print(java_executable)
        
        # Normalize and validate server directory
        server_dir = os.path.abspath(os.path.expanduser(SERVER_PATH))
        add_log(f'Server directory: {server_dir}')
        
        # Check if SERVER_JAR is an absolute path
        if os.path.isabs(SERVER_JAR):
            jar_path = SERVER_JAR
        else:
            jar_path = os.path.join(server_dir, SERVER_JAR)
        
        # Check if server jar exists
        if not os.path.exists(jar_path):
            add_log(f'ERROR: Server jar not found at {jar_path}')
            server_status = 'stopped'
            broadcast({'type': 'status', 'status': server_status})
            return {'success': False, 'message': 'Server jar not found'}
        
        # Determine working directory - use JAR's directory if server_dir doesn't exist
        if not os.path.exists(server_dir):
            add_log(f'WARNING: Server directory does not exist: {server_dir}')
            # Try to create it
            try:
                os.makedirs(server_dir, exist_ok=True)
                add_log(f'Created server directory: {server_dir}')
            except Exception as e:
                # If we can't create it, use JAR's directory as fallback
                if os.path.isabs(SERVER_JAR):
                    server_dir = os.path.dirname(SERVER_JAR)
                    add_log(f'Using JAR directory as working directory: {server_dir}')
                else:
                    error_msg = f'Server directory does not exist and cannot be created: {server_dir}'
                    add_log(f'ERROR: {error_msg}')
                    server_status = 'stopped'
                    broadcast({'type': 'status', 'status': server_status})
                    return {'success': False, 'message': error_msg}
        
        # Verify server_dir is actually a directory
        if not os.path.isdir(server_dir):
            error_msg = f'Server path is not a directory: {server_dir}'
            add_log(f'ERROR: {error_msg}')
            server_status = 'stopped'
            broadcast({'type': 'status', 'status': server_status})
            return {'success': False, 'message': error_msg}
        
        # Normalize paths for Windows
        server_dir = os.path.normpath(server_dir)
        jar_path = os.path.normpath(jar_path)
        
        add_log(f'Working directory: {server_dir}')
        
        # Start server process
        java_args = [
            '-Xmx8G',
            '-Xms8G',
            '-jar',
            jar_path
        ]
        
        add_log(f'Starting with command: {java_executable} {" ".join(java_args)}')
        
        try:
            # Use the hardcoded path if it exists, otherwise use found java
            java_to_use = "C:\\ProgramData\\Oracle\\Java\\javapath\\java.exe"
            if not os.path.exists(java_to_use):
                java_to_use = java_executable
            
            java_to_use = os.path.normpath(java_to_use)
            
            server_process = subprocess.Popen(
                [java_to_use] + java_args,
                cwd=server_dir,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=0,  # Unbuffered for binary mode
                universal_newlines=False
            )
            
            # Read output in background threads
            read_process_output(server_process)
            
            # Monitor process exit
            def monitor_process():
                global server_process, server_status
                server_process.wait()
                server_status = 'stopped'
                broadcast({'type': 'status', 'status': server_status})
                add_log(f'Server stopped with code {server_process.returncode}')
                server_process = None
            
            threading.Thread(target=monitor_process, daemon=True).start()
            
            # Wait a bit to see if server starts successfully
            def check_started():
                global server_process, server_status
                time.sleep(2)
                if server_process and server_process.poll() is None:
                    server_status = 'running'
                    broadcast({'type': 'status', 'status': server_status})
                    add_log('Server started successfully!')
            
            threading.Thread(target=check_started, daemon=True).start()
            
            return {'success': True, 'message': 'Server starting'}
            
        except FileNotFoundError as e:
            error_msg = f'Java executable not found at "{java_executable}". Please install Java or set JAVA_PATH environment variable to the full path'
            add_log(f'ERROR: {error_msg}')
            server_status = 'stopped'
            broadcast({'type': 'status', 'status': server_status})
            return {'success': False, 'message': error_msg}
        except Exception as e:
            error_msg = f'Failed to start server: {str(e)}'
            add_log(f'ERROR: {error_msg}')
            server_status = 'stopped'
            broadcast({'type': 'status', 'status': server_status})
            return {'success': False, 'message': error_msg}
            
    except Exception as error:
        server_status = 'stopped'
        broadcast({'type': 'status', 'status': server_status})
        add_log(f'ERROR: {str(error)}')
        return {'success': False, 'message': str(error)}


def stop_server():
    """Stop server"""
    global server_process, server_status
    
    if not server_process or server_status == 'stopped':
        return {'success': False, 'message': 'Server is not running'}
    
    try:
        server_status = 'stopping'
        broadcast({'type': 'status', 'status': server_status})
        add_log('Stopping server...')
        
        # Send stop command to server
        if server_process.stdin:
            try:
                server_process.stdin.write('stop\n'.encode())
                server_process.stdin.flush()
            except:
                pass
        
        # Force kill after 10 seconds if still running
        def force_kill():
            time.sleep(10)
            if server_process and server_process.poll() is None:
                server_process.terminate()
                time.sleep(2)
                if server_process.poll() is None:
                    server_process.kill()
        
        threading.Thread(target=force_kill, daemon=True).start()
        
        return {'success': True, 'message': 'Server stopping'}
    except Exception as error:
        add_log(f'ERROR: {str(error)}')
        return {'success': False, 'message': str(error)}


def restart_server():
    """Restart server"""
    result = stop_server()
    if result['success']:
        time.sleep(3)
        return start_server()
    return result


def execute_command(command):
    """Execute command on server"""
    global server_process, server_status
    
    if not server_process or server_status != 'running':
        return {'success': False, 'message': 'Server is not running'}
    
    try:
        if server_process.stdin:
            server_process.stdin.write(f'{command}\n'.encode())
            server_process.stdin.flush()
            add_log(f'[COMMAND] {command}')
            return {'success': True, 'message': 'Command executed'}
        return {'success': False, 'message': 'Cannot write to server stdin'}
    except Exception as error:
        return {'success': False, 'message': str(error)}


def get_server_properties():
    """Read server.properties"""
    try:
        props_path = os.path.join(SERVER_PATH, 'server.properties')
        with open(props_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        properties = {}
        for line in content.split('\n'):
            line = line.strip()
            if line and not line.startswith('#'):
                parts = line.split('=', 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    value = parts[1].strip()
                    properties[key] = value
        
        return {'success': True, 'properties': properties}
    except Exception as error:
        return {'success': False, 'message': str(error), 'properties': {}}


def update_server_properties(updates):
    """Update server.properties"""
    try:
        props_path = os.path.join(SERVER_PATH, 'server.properties')
        
        # Read existing content
        with open(props_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Track which properties exist
        existing_keys = set()
        updated_lines = []
        
        for line in lines:
            line_stripped = line.strip()
            if line_stripped and not line_stripped.startswith('#'):
                parts = line_stripped.split('=', 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    existing_keys.add(key)
                    if key in updates:
                        updated_lines.append(f'{key}={updates[key]}\n')
                        continue
            updated_lines.append(line)
        
        # Add new properties
        for key, value in updates.items():
            if key not in existing_keys:
                updated_lines.append(f'{key}={value}\n')
        
        # Write back
        with open(props_path, 'w', encoding='utf-8') as f:
            f.writelines(updated_lines)
        
        return {'success': True, 'message': 'Properties updated'}
    except Exception as error:
        return {'success': False, 'message': str(error)}


def get_plugins():
    """Get plugins list"""
    try:
        plugins_dir = os.path.join(SERVER_PATH, 'plugins')
        if not os.path.exists(plugins_dir):
            return {'success': True, 'plugins': []}
        
        files = os.listdir(plugins_dir)
        plugins = []
        for file in files:
            if file.endswith('.jar'):
                plugins.append({
                    'name': file.replace('.jar', ''),
                    'file': file,
                    'enabled': True
                })
        
        return {'success': True, 'plugins': plugins}
    except Exception as error:
        return {'success': True, 'plugins': []}


def get_players():
    """Get players list"""
    if server_status != 'running':
        return {'success': False, 'players': [], 'message': 'Server is not running'}
    
    # In a real implementation, you'd use RCON or a plugin to query players
    return {'success': True, 'players': [], 'message': 'RCON not configured. Install a plugin for player list.'}


def get_tps():
    """Get TPS (Ticks Per Second)"""
    if server_status != 'running':
        return {'success': False, 'tps': 0, 'message': 'Server is not running'}
    
    # TPS monitoring requires a plugin like spark or via RCON
    return {'success': True, 'tps': 20.0, 'message': 'Install spark plugin for accurate TPS monitoring'}


def get_logs(lines=100):
    """Read latest.log"""
    try:
        logs_path = os.path.join(SERVER_PATH, 'logs', 'latest.log')
        with open(logs_path, 'r', encoding='utf-8', errors='replace') as f:
            log_lines = [line.strip() for line in f.readlines() if line.strip()]
        
        return {
            'success': True,
            'logs': log_lines[-lines:] if len(log_lines) > lines else log_lines,
            'totalLines': len(log_lines)
        }
    except Exception as error:
        return {'success': False, 'logs': [], 'message': str(error)}

@socketio.on('connect')
def handle_connect(auth=None):
    """Handle WebSocket connection"""
    try:
        add_log('Client connected to WebSocket')

        # Send server status
        emit('status', {
            'status': server_status
        })

        # Send last logs
        recent_logs = logs[-50:]
        for log in recent_logs:
            emit('log', {
                'line': log
            })

    except Exception as e:
        print("Error in handle_connect:", e)


@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnect"""
    try:
        add_log('Client disconnected from WebSocket')
    except Exception as e:
        print(f'Error in handle_disconnect: {e}')


# API Routes

# Server control
@app.route('/api/server/start', methods=['POST'])
def api_start_server():
    result = start_server()
    return jsonify(result)


@app.route('/api/server/stop', methods=['POST'])
def api_stop_server():
    result = stop_server()
    return jsonify(result)


@app.route('/api/server/restart', methods=['POST'])
def api_restart_server():
    result = restart_server()
    return jsonify(result)


@app.route('/api/server/status', methods=['GET'])
def api_get_status():
    return jsonify({'status': server_status})


# Command execution
@app.route('/api/server/command', methods=['POST'])
def api_execute_command():
    data = request.get_json()
    if not data or 'command' not in data:
        return jsonify({'success': False, 'message': 'Command is required'}), 400
    
    result = execute_command(data['command'])
    return jsonify(result)


# Server properties
@app.route('/api/server/properties', methods=['GET'])
def api_get_properties():
    result = get_server_properties()
    return jsonify(result)


@app.route('/api/server/properties', methods=['POST'])
def api_update_properties():
    data = request.get_json()
    if not data or 'properties' not in data:
        return jsonify({'success': False, 'message': 'Properties object is required'}), 400
    
    result = update_server_properties(data['properties'])
    return jsonify(result)


# Plugins
@app.route('/api/plugins', methods=['GET'])
def api_get_plugins():
    result = get_plugins()
    return jsonify(result)


# Players
@app.route('/api/players', methods=['GET'])
def api_get_players():
    result = get_players()
    return jsonify(result)


# TPS
@app.route('/api/tps', methods=['GET'])
def api_get_tps():
    result = get_tps()
    return jsonify(result)


# Logs
@app.route('/api/logs', methods=['GET'])
def api_get_logs():
    lines = request.args.get('lines', 100, type=int)
    result = get_logs(lines)
    return jsonify(result)


# Health check
@app.route('/api/health', methods=['GET'])
def api_health():
    return jsonify({'status': 'ok', 'serverStatus': server_status})


if __name__ == '__main__':
    print(f'PaperMC Dashboard API server running on http://localhost:{API_PORT}')
    print(f'Configure SERVER_PATH environment variable to point to your PaperMC server directory')
    add_log(f'API server started on port {API_PORT}')
    try:
        socketio.run(app, host='0.0.0.0', port=API_PORT, debug=False, allow_unsafe_werkzeug=True)
    except Exception as e:
        print(f'Error starting server: {e}')
        import traceback
        traceback.print_exc()

