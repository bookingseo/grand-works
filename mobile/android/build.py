"""Build a signed offline APK using the installed Android SDK and JDK (no network)."""
import os
from pathlib import Path
import secrets
import subprocess
import tempfile
from zipfile import ZIP_STORED, ZipFile

module = Path(__file__).resolve().parent
root = module.parents[1]
sdk = Path(os.environ.get('ANDROID_HOME') or os.environ.get('ANDROID_SDK_ROOT') or Path.home() / 'Library/Android/sdk')
android = sdk / 'platforms/android-36/android.jar'
tools = sdk / 'build-tools/36.0.0'
if not android.exists() or not (tools / 'aapt2').exists():
    raise SystemExit('Set ANDROID_HOME to an SDK with platform 36 and build-tools 36.0.0.')
env = os.environ.copy()
if env.get('JAVA_HOME'):
    env['PATH'] = str(Path(env['JAVA_HOME']) / 'bin') + os.pathsep + env['PATH']

def run(*args):
    subprocess.run(args, env=env, check=True)

assets = Path(subprocess.check_output(['node', root / 'studio.mjs', 'build'], text=True).strip())
out = root / 'out/mobile'
out.mkdir(parents=True, exist_ok=True)
release = 'GRAND_WORKS_KEYSTORE' in env
keys = root / '.mobile-signing'
if release:
    key = Path(env['GRAND_WORKS_KEYSTORE']).resolve()
    if not key.is_file() or not env.get('GRAND_WORKS_STORE_PASS'):
        raise SystemExit('Provide a keystore and GRAND_WORKS_STORE_PASS for release signing.')
else:
    keys.mkdir(mode=0o700, exist_ok=True)
    key = keys / 'development.p12'
    password = keys / 'development.pass'
    if not password.exists():
        with os.fdopen(os.open(password, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), 'w') as f:
            f.write(secrets.token_urlsafe(32))
    env['GRAND_WORKS_STORE_PASS'] = password.read_text().strip()
    if not key.exists():
        run('keytool', '-genkeypair', '-storetype', 'PKCS12', '-keystore', key, '-storepass:env', 'GRAND_WORKS_STORE_PASS', '-alias', 'workshop', '-keyalg', 'RSA', '-keysize', '3072', '-validity', '10000', '-dname', 'CN=Grand Works Development')

with tempfile.TemporaryDirectory(prefix='apk-', dir=out) as scratch:
    work = Path(scratch)
    classes = work / 'classes'
    classes.mkdir()
    run(tools / 'aapt2', 'compile', '--dir', module / 'res', '-o', work / 'res.zip')
    run(tools / 'aapt2', 'link', '-o', work / 'base.apk', '-I', android, '--manifest', module / 'AndroidManifest.xml', '-A', assets, work / 'res.zip')
    run('javac', '--release', '8', '-cp', android, '-d', classes, *module.rglob('*.java'))
    run(tools / 'd8', '--lib', android, '--min-api', '28', '--output', work, *classes.rglob('*.class'))
    with ZipFile(work / 'base.apk', 'a') as apk:
        apk.write(work / 'classes.dex', 'classes.dex', compress_type=ZIP_STORED)
    run(tools / 'zipalign', '-p', '4', work / 'base.apk', work / 'aligned.apk')
    run(tools / 'apksigner', 'sign', '--ks', key, '--ks-pass', 'env:GRAND_WORKS_STORE_PASS', '--out', work / 'signed.apk', work / 'aligned.apk')
    run(tools / 'apksigner', 'verify', '--verbose', work / 'signed.apk')
    target = out / ('Grand-Works-1.0.apk' if release else 'Grand-Works-dev.apk')
    (work / 'signed.apk').replace(target)
print(target)
