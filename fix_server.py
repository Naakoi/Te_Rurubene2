#!/usr/bin/env python3
import subprocess
import sys

HOST = "91.99.89.94"
USER = "root"
PASS = "!m3n@!K@!"

commands = [
    "cat /root/Rurubene2/frontend/.env.local 2>/dev/null || echo 'FILE NOT FOUND'",
    "ls /root/Rurubene2/frontend/ | head -20",
    "pm2 list",
]

for cmd in commands:
    result = subprocess.run(
        ["sshpass", "-p", PASS, "ssh", "-o", "StrictHostKeyChecking=no", f"{USER}@{HOST}", cmd],
        capture_output=True, text=True, timeout=30
    )
    print(f"=== {cmd} ===")
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
    print()
