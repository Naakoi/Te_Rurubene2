#!/usr/bin/env python3
"""
Uses pty to handle SSH keyboard-interactive authentication.
"""
import pty, os, sys, select, time, subprocess

HOST = "91.99.89.94"
USER = "root"
PASSWORD = "!m3n@!K@!"

with open("/home/user/.ssh/id_ed25519_nopass.pub") as f:
    pubkey = f.read().strip()

COMMANDS = [
    f'mkdir -p /root/.ssh && echo "{pubkey}" >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys',
    "echo 'NEXT_PUBLIC_BACKEND_URL=http://91.99.89.94:8000' > /root/Rurubene2/frontend/.env.local",
    "cat /root/Rurubene2/frontend/.env.local",
    "pm2 list",
    "exit"
]

def run():
    env = os.environ.copy()
    # Unset SSH_ASKPASS so SSH falls back to TTY input
    env.pop("SSH_ASKPASS", None)
    env.pop("SSH_ASKPASS_REQUIRE", None)
    env.pop("DISPLAY", None)
    
    master_fd, slave_fd = pty.openpty()
    
    proc = subprocess.Popen(
        ["ssh", 
         "-o", "StrictHostKeyChecking=no", 
         "-o", "PasswordAuthentication=yes",
         "-o", "PubkeyAuthentication=no",
         "-o", "PreferredAuthentications=keyboard-interactive,password",
         f"{USER}@{HOST}"],
        stdin=slave_fd, stdout=slave_fd, stderr=slave_fd,
        close_fds=True,
        env=env
    )
    
    os.close(slave_fd)
    
    output = b""
    password_sent = False
    cmd_index = 0
    start = time.time()
    last_cmd_time = time.time()
    
    while proc.poll() is None and (time.time() - start) < 90:
        r, _, _ = select.select([master_fd], [], [], 0.5)
        if not r:
            continue
        try:
            data = os.read(master_fd, 4096)
        except OSError:
            break
        
        output += data
        text = data.decode('utf-8', errors='replace')
        sys.stdout.write(text)
        sys.stdout.flush()
        
        # Detect password prompt
        if not password_sent and "assword" in text:
            time.sleep(0.5)
            os.write(master_fd, (PASSWORD + "\r\n").encode())
            password_sent = True
            print("\n[PASSWORD SENT]")
            time.sleep(2)
            continue
        
        # Detect shell prompt
        if password_sent and ("#" in text or "$" in text) and (time.time() - last_cmd_time) > 1.5:
            if cmd_index < len(COMMANDS):
                time.sleep(0.5)
                cmd = COMMANDS[cmd_index]
                print(f"\n>>> [{cmd_index}] {cmd[:80]}")
                os.write(master_fd, (cmd + "\n").encode())
                cmd_index += 1
                last_cmd_time = time.time()
    
    proc.wait()
    print(f"\n\nExit code: {proc.returncode}")

if __name__ == "__main__":
    run()
