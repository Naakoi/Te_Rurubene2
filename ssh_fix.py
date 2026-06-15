#!/usr/bin/env python3
"""
Uses paramiko to SSH into the Hetzner server and fix the NEXT_PUBLIC_BACKEND_URL.
Run: python3 ssh_fix.py
"""
import socket, subprocess, sys, os

HOST = "91.99.89.94"
PORT = 22
USER = "root"
PASSWORD = "!m3n@!K@!"

# Try using raw socket + subprocess with expect-like approach
# We'll use OpenSSH's SSH_ASKPASS and DISPLAY trick

script = """
set timeout 120

spawn ssh -o StrictHostKeyChecking=no root@91.99.89.94

expect {
    "password:" {
        send "!m3n@!K@!\\r"
        expect "# "
    }
    "# " {}
}

send "echo 'NEXT_PUBLIC_BACKEND_URL=http://91.99.89.94:8000' > /root/Rurubene2/frontend/.env.local\\r"
expect "# "
send "cat /root/Rurubene2/frontend/.env.local\\r"
expect "# "

send "cd /root/Rurubene2/frontend && NODE_ENV=production npm run build 2>&1 | tail -30\\r"
set timeout 300
expect "# "

send "pm2 restart frontend\\r"
expect "# "
send "pm2 list\\r"
expect "# "

send "exit\\r"
expect eof
"""

with open('/tmp/fix_server.expect', 'w') as f:
    f.write(script)

print("Running expect script...")
result = subprocess.run(['expect', '/tmp/fix_server.expect'], capture_output=True, text=True, timeout=600)
print("STDOUT:", result.stdout[-3000:])
print("STDERR:", result.stderr[-1000:])
print("Return code:", result.returncode)
