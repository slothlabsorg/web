#!/usr/bin/env python3
"""Crop the SlothLabs asset sheet: astronaut (left) already saved from reference;
   crop the rest of the sheet into separate images without overwriting existing files."""
from PIL import Image
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "images")
SHEET_PATH = os.path.expanduser(
    "/Users/dany/.cursor/projects/Users-dany-dev-aws-switch-site/assets/"
    "openart-image_1773458621216_a9d0fc56_1773458621326_9b57091d-65b905c8-afc0-4706-95c7-0ebee98b2160.png"
)

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    im = Image.open(SHEET_PATH)
    if im.mode != "RGBA":
        im = im.convert("RGBA")
    w, h = im.size

    # Left side = astronaut (already saved from reference). Right side 512..1024: split into 3 cols x 2 rows = 6 images.
    x_start = 512
    y_mid = h // 2
    col_w = (w - x_start) // 3

    crops = [
        ("sloth-sheet-right-top-left.png", (x_start, 0, x_start + col_w, y_mid)),
        ("sloth-sheet-right-top-center.png", (x_start + col_w, 0, x_start + 2 * col_w, y_mid)),
        ("sloth-sheet-right-top-right.png", (x_start + 2 * col_w, 0, w, y_mid)),
        ("sloth-sheet-right-bottom-left.png", (x_start, y_mid, x_start + col_w, h)),
        ("sloth-sheet-right-bottom-center.png", (x_start + col_w, y_mid, x_start + 2 * col_w, h)),
        ("sloth-sheet-right-bottom-right.png", (x_start + 2 * col_w, y_mid, w, h)),
    ]

    for name, box in crops:
        out_path = os.path.join(OUT_DIR, name)
        if os.path.exists(out_path):
            continue
        cropped = im.crop(box)
        cropped.save(out_path, "PNG")
        print("Saved", out_path)

if __name__ == "__main__":
    main()
