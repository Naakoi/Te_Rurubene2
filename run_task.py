#!/usr/bin/env python3
import os
import sys
import pty
import select
import time
import termios

def main():
    host = "91.99.89.94"
    user = "root"
    password = "!m3n@!k@!"
    
    # Read the local seed script
    seed_script_path = "/home/user/Documents/Projects/Rurubene2/seed_data.php"
    if not os.path.exists(seed_script_path):
        print(f"Error: {seed_script_path} does not exist.")
        sys.exit(1)
        
    with open(seed_script_path, "r") as f:
        seed_script = f.read()
        
    write_seed_cmd = f"cat << 'SEEDEOF' > /tmp/seed_data.php\n{seed_script}SEEDEOF"
    
    commands = [
        "echo '=== Uploading seed script ==='",
        write_seed_cmd,
        "echo '=== Running seeder ==='",
        "php /tmp/seed_data.php",
        "echo '=== Seed complete! ==='",
        "exit"
    ]
    
    print(f"Connecting to {user}@{host} via SSH...")
    pid, fd = pty.fork()
    
    if pid == 0:
        # Child process: configure terminal options to prevent '@' from acting as line-kill
        try:
            attrs = termios.tcgetattr(0)
            attrs[6][termios.VKILL] = b'\x15'
            attrs[6][termios.VERASE] = b'\x7f'
            termios.tcsetattr(0, termios.TCSADRAIN, attrs)
        except Exception as e:
            sys.stderr.write(f"Warning: could not set termios attributes: {e}\n")
            
        os.execvp("ssh", ["ssh", "-o", "StrictHostKeyChecking=no", f"{user}@{host}"])
    else:
        # Parent process
        buffer = ""
        password_sent = False
        command_idx = 0
        
        while True:
            r, w, x = select.select([fd], [], [], 1.0)
            if fd in r:
                try:
                    data = os.read(fd, 1024)
                except OSError:
                    break
                if not data:
                    break
                
                decoded = data.decode("utf-8", errors="ignore")
                sys.stdout.write(decoded)
                sys.stdout.flush()
                buffer += decoded
                
                # Check for password prompt
                if not password_sent and ("password:" in buffer.lower()):
                    time.sleep(0.5)
                    os.write(fd, (password + "\n").encode("utf-8"))
                    password_sent = True
                    buffer = ""
                
                # Check for shell prompt
                if password_sent:
                    stripped = buffer.strip()
                    if stripped.endswith("#") or stripped.endswith("$"):
                        if command_idx < len(commands):
                            cmd = commands[command_idx]
                            # Avoid printing the full write_seed_cmd to console, print a summary instead
                            if cmd == write_seed_cmd:
                                print("\n[Running server command]: (uploading seed_data.php to /tmp/)")
                            else:
                                print(f"\n[Running server command]: {cmd}")
                            os.write(fd, (cmd + "\n").encode("utf-8"))
                            command_idx += 1
                            buffer = ""
                            time.sleep(0.5)
            else:
                # Timeout, check if child still alive
                try:
                    pid_res, status = os.waitpid(pid, os.WNOHANG)
                    if pid_res != 0:
                        break
                except ChildProcessError:
                    break

if __name__ == "__main__":
    main()
