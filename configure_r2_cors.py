#!/usr/bin/env python3
"""
Configure CORS on the Cloudflare R2 bucket via the S3-compatible API.
This allows the browser to PUT chunks directly to R2 from any origin.
"""
import urllib.request
import urllib.error
import urllib.parse
import hmac
import hashlib
import datetime
import json

# R2 Credentials
ACCESS_KEY = "2dcdaf6d572305af232c119a9db1061c"
SECRET_KEY = "95b344894d87228bfbfa56270112c4577bee74ae62f2b4182d9a471dc347b97a"
BUCKET     = "te-rurubene-bucket"
ENDPOINT   = "https://2f4c25dd4f1e4d638d5b7df98598b8c9.r2.cloudflarestorage.com"
REGION     = "auto"

CORS_XML = """<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <CORSRule>
    <AllowedOrigin>http://91.99.89.94</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
  <CORSRule>
    <AllowedOrigin>https://91.99.89.94</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
  <CORSRule>
    <AllowedOrigin>http://localhost:3000</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>"""

def sign(key, msg):
    return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()

def get_signature_key(key, date_stamp, region, service):
    k_date    = sign(('AWS4' + key).encode('utf-8'), date_stamp)
    k_region  = sign(k_date, region)
    k_service = sign(k_region, service)
    k_signing = sign(k_service, 'aws4_request')
    return k_signing

def put_cors():
    now    = datetime.datetime.utcnow()
    amz_date   = now.strftime('%Y%m%dT%H%M%SZ')
    date_stamp = now.strftime('%Y%m%d')

    host = f"2f4c25dd4f1e4d638d5b7df98598b8c9.r2.cloudflarestorage.com"
    uri  = f"/{BUCKET}?cors"

    body        = CORS_XML.strip().encode('utf-8')
    payload_hash = hashlib.sha256(body).hexdigest()
    content_md5  = __import__('base64').b64encode(
        __import__('hashlib').md5(body).digest()
    ).decode()

    headers_to_sign = {
        'content-md5': content_md5,
        'content-type': 'application/xml',
        'host': host,
        'x-amz-content-sha256': payload_hash,
        'x-amz-date': amz_date,
    }

    signed_headers = ';'.join(sorted(headers_to_sign.keys()))
    canonical_headers = ''.join(f"{k}:{v}\n" for k, v in sorted(headers_to_sign.items()))
    canonical_request = '\n'.join([
        'PUT', f'/{BUCKET}', 'cors',
        canonical_headers, signed_headers, payload_hash
    ])

    credential_scope = f"{date_stamp}/{REGION}/s3/aws4_request"
    string_to_sign = '\n'.join([
        'AWS4-HMAC-SHA256', amz_date, credential_scope,
        hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()
    ])

    signing_key = get_signature_key(SECRET_KEY, date_stamp, REGION, 's3')
    signature   = hmac.new(signing_key, string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()

    authorization = (
        f"AWS4-HMAC-SHA256 Credential={ACCESS_KEY}/{credential_scope}, "
        f"SignedHeaders={signed_headers}, Signature={signature}"
    )

    url = f"https://{host}/{BUCKET}?cors"
    req = urllib.request.Request(url, data=body, method='PUT')
    req.add_header('Authorization', authorization)
    req.add_header('Content-MD5', content_md5)
    req.add_header('Content-Type', 'application/xml')
    req.add_header('x-amz-content-sha256', payload_hash)
    req.add_header('x-amz-date', amz_date)

    try:
        with urllib.request.urlopen(req) as resp:
            print(f"SUCCESS! Status: {resp.status}")
            print("CORS configured on R2 bucket.")
    except urllib.error.HTTPError as e:
        body_resp = e.read().decode()
        print(f"FAILED! HTTP {e.code}: {body_resp}")

if __name__ == "__main__":
    put_cors()
