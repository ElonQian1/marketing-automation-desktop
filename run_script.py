import socket
import time

s = socket.socket()
s.settimeout(180)
s.connect(('127.0.0.1', 11451))
s.sendall(b'SCRIPT_EXECUTE_AUTO:84cc6c2b-7d26-4268-9839-4736dac8c850\n')

all_data = b''
start = time.time()
printed_lines = set()

while time.time() - start < 180:
    try:
        chunk = s.recv(4096)
        if chunk:
            all_data += chunk
            decoded = all_data.decode('utf-8', 'replace')
            lines = decoded.strip().split('\n')
            for line in lines:
                if line and line not in printed_lines:
                    print(line)
                    printed_lines.add(line)
            if '"status":"complete"' in decoded or '"status":"success"' in decoded:
                if decoded.rstrip().endswith('}'):
                    break
        else:
            break
    except socket.timeout:
        continue
    except Exception as e:
        print(f"Error: {e}")
        break

s.close()
