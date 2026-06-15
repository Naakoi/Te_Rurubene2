#!/usr/bin/env python3
"""Run the R2 CORS configuration script on the remote server using boto3."""
import os, sys, pty, select, time, termios

HOST = "91.99.89.94"
USER = "root"
PASS = "!m3n@!k@!"

REMOTE_COMMAND = """
pip3 install boto3 -q 2>/dev/null || pip install boto3 -q 2>/dev/null;
python3 - <<'PYEOF'
import boto3
from botocore.config import Config

s3 = boto3.client(
    's3',
    region_name='auto',
    endpoint_url='https://2f4c25dd4f1e4d638d5b7df98598b8c9.r2.cloudflarestorage.com',
    aws_access_key_id='2dcdaf6d572305af232c119a9db1061c',
    aws_secret_access_key='95b344894d87228bfbfa56270112c4577bee74ae62f2b4182d9a471dc347b97a',
    config=Config(signature_version='s3v4')
)

cors_config = {
    'CORSRules': [
        {
            'AllowedOrigins': ['*'],
            'AllowedMethods': ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            'AllowedHeaders': ['*'],
            'ExposeHeaders': ['ETag'],
            'MaxAgeSeconds': 3600
        }
    ]
}

try:
    s3.put_bucket_cors(Bucket='te-rurubene-bucket', CORSConfiguration=cors_config)
    print('SUCCESS: CORS configured on R2 bucket.')
except Exception as e:
    print(f'ERROR: {e}')
PYEOF
"""

def run():
    pid, fd = pty.fork()
    if pid == 0:
        try:
            attrs = termios.tcgetattr(0)
            attrs[6][termios.VKILL] = b'\x15'
            attrs[6][termios.VERASE] = b'\x7f'
            termios.tcsetattr(0, termios.TCSADRAIN, attrs)
        except Exception:
            pass
        os.execvp("ssh", ["ssh", "-o", "StrictHostKeyChecking=no", f"{USER}@{HOST}", REMOTE_COMMAND])
    else:
        buf = ""
        pw_sent = False
        deadline = time.time() + 120
        while time.time() < deadline:
            r, _, _ = select.select([fd], [], [], 1.0)
            if fd in r:
                try:
                    data = os.read(fd, 4096)
                except OSError:
                    break
                if not data:
                    break
                decoded = data.decode("utf-8", errors="ignore")
                sys.stdout.write(decoded)
                sys.stdout.flush()
                buf += decoded
                if not pw_sent and "password:" in buf.lower():
                    time.sleep(0.3)
                    os.write(fd, (PASS + "\n").encode())
                    pw_sent = True
                    buf = ""
            else:
                try:
                    res, _ = os.waitpid(pid, os.WNOHANG)
                    if res != 0:
                        break
                except ChildProcessError:
                    break
        try:
            os.waitpid(pid, 0)
        except Exception:
            pass

if __name__ == "__main__":
    run()
