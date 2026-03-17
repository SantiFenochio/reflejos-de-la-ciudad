import base64, re, sys

def decode_and_save(b64_file, out_file):
    with open(b64_file, 'r', encoding='utf-8') as f:
        raw = f.read()
    # Limpiar cualquier whitespace/saltos de linea
    raw = re.sub(r'\s+', '', raw)
    # Arreglar padding
    raw += '=' * ((-len(raw)) % 4)
    data = base64.b64decode(raw)
    with open(out_file, 'wb') as f:
        f.write(data)
    print(f"OK: {out_file} ({len(data)} bytes)")

base_dir = r"C:\Users\Tino\Desktop\reflejos-de-la-ciudad"
assets_dir = base_dir + r"\src\assets"

decode_and_save(base_dir + r"\tmp_img1.b64", assets_dir + r"\ediciones-anteriores.png")
decode_and_save(base_dir + r"\tmp_img2.b64", assets_dir + r"\ultima-edicion.png")

import os
for f in [base_dir + r"\tmp_img1.b64", base_dir + r"\tmp_img2.b64", base_dir + r"\decode_imgs.ps1"]:
    try:
        os.remove(f)
    except:
        pass

print("Limpieza completada.")
