"""
Generate all 5 images for Onchain Roast Me app.
Uses Pillow to create flame-themed graphics programmatically.
"""

import math
import random
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Colors
DARK_BG = (10, 10, 15)       # #0A0A0F
ORANGE = (249, 115, 22)      # #F97316
DEEP_ORANGE = (234, 88, 12)  # #EA580C
RED = (220, 38, 38)          # #DC2626
DARK_RED_BG = (26, 10, 10)   # #1A0A0A
WHITE = (255, 255, 255)
WARM_YELLOW = (255, 200, 50)


def lerp_color(c1, c2, t):
    """Linearly interpolate between two colors."""
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def draw_radial_glow(draw, cx, cy, radius, color, img_size):
    """Draw a radial glow effect."""
    for r in range(radius, 0, -2):
        alpha = int(80 * (r / radius) ** 0.5)
        glow_color = (*color, alpha)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=glow_color)


def draw_flame_shape(draw, cx, base_y, width, height, color_bottom, color_top, alpha=255):
    """Draw a stylized flame shape using layered ellipses and triangles."""
    # Outer flame body
    steps = 40
    for i in range(steps):
        t = i / steps
        # Flame narrows towards top
        w = width * (1 - t * 0.85)
        h_offset = height * t
        y = base_y - h_offset
        color = lerp_color(color_bottom, color_top, t)
        fill = (*color, alpha) if alpha < 255 else color

        # Ellipse layers getting smaller
        draw.ellipse([cx - w/2, y - w*0.4, cx + w/2, y + w*0.4], fill=fill)

    # Flame tip - pointed top
    tip_w = width * 0.15
    tip_h = height * 0.3
    tip_y = base_y - height
    tip_color = (*WARM_YELLOW, min(alpha, 200)) if alpha < 255 else WARM_YELLOW
    for i in range(20):
        t = i / 20
        w = tip_w * (1 - t)
        y = tip_y - tip_h * t
        draw.ellipse([cx - w, y - w*0.5, cx + w, y + w*0.5], fill=tip_color)


def draw_stylized_flame(img, cx, base_y, size_factor=1.0):
    """Draw a complete stylized flame with glow on an RGBA image."""
    draw = ImageDraw.Draw(img, 'RGBA')

    # Glow behind flame
    glow_radius = int(200 * size_factor)
    for r in range(glow_radius, 0, -3):
        alpha = int(40 * (r / glow_radius))
        glow_color = (234, 88, 12, alpha)
        draw.ellipse([cx - r, base_y - r - int(50 * size_factor),
                       cx + r, base_y - r + int(100 * size_factor) + r], fill=glow_color)

    # Main outer flame (red-orange)
    draw_flame_shape(draw, cx, base_y,
                     width=140 * size_factor, height=280 * size_factor,
                     color_bottom=RED, color_top=DEEP_ORANGE)

    # Middle flame (orange)
    draw_flame_shape(draw, cx, base_y + 10 * size_factor,
                     width=90 * size_factor, height=220 * size_factor,
                     color_bottom=DEEP_ORANGE, color_top=ORANGE)

    # Inner flame (yellow-orange)
    draw_flame_shape(draw, cx, base_y + 20 * size_factor,
                     width=50 * size_factor, height=160 * size_factor,
                     color_bottom=ORANGE, color_top=WARM_YELLOW)

    # Bright core
    core_w = int(25 * size_factor)
    core_h = int(80 * size_factor)
    for i in range(core_h):
        t = i / core_h
        w = core_w * (1 - t * 0.8)
        y = base_y - i + int(10 * size_factor)
        alpha = int(200 * (1 - t * 0.5))
        draw.ellipse([cx - w, y - w*0.3, cx + w, y + w*0.3],
                     fill=(255, 230, 100, alpha))


def draw_ember_particles(draw, width, height, count=30):
    """Draw floating ember particles."""
    random.seed(42)
    for _ in range(count):
        x = random.randint(int(width * 0.1), int(width * 0.9))
        y = random.randint(int(height * 0.1), int(height * 0.7))
        size = random.randint(1, 4)
        alpha = random.randint(80, 200)
        color = lerp_color(ORANGE, WARM_YELLOW, random.random())
        draw.ellipse([x - size, y - size, x + size, y + size],
                     fill=(*color, alpha))


def get_font(size, bold=True):
    """Get a font, falling back to default if needed."""
    font_paths = [
        "C:/Windows/Fonts/impact.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
    ]
    if bold:
        font_paths.insert(0, "C:/Windows/Fonts/arialbd.ttf")
        font_paths.insert(0, "C:/Windows/Fonts/impact.ttf")

    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_gradient_text(draw, text, cx, y, font, color1, color2, img_width):
    """Draw text with a fake horizontal gradient by rendering character by character."""
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    start_x = cx - text_width // 2

    for i, char in enumerate(text):
        t = i / max(len(text) - 1, 1)
        color = lerp_color(color1, color2, t)
        draw.text((start_x, y), char, fill=color, font=font)
        char_bbox = draw.textbbox((0, 0), char, font=font)
        start_x += char_bbox[2] - char_bbox[0]


# ============================================================
# 1. icon.png — 1024x1024
# ============================================================
def generate_icon():
    print("Generating icon.png (1024x1024)...")
    img = Image.new('RGBA', (1024, 1024), (*DARK_BG, 255))
    draw_stylized_flame(img, 512, 680, size_factor=2.5)
    result = Image.new('RGB', (1024, 1024), DARK_BG)
    result.paste(img, (0, 0), img)
    result.save(os.path.join(OUTPUT_DIR, "icon.png"), "PNG")
    print("  ✓ icon.png saved")


# ============================================================
# 2. splash.png — 200x200
# ============================================================
def generate_splash():
    print("Generating splash.png (200x200)...")
    img = Image.new('RGBA', (200, 200), (*DARK_BG, 255))
    draw_stylized_flame(img, 100, 140, size_factor=0.5)
    result = Image.new('RGB', (200, 200), DARK_BG)
    result.paste(img, (0, 0), img)
    result.save(os.path.join(OUTPUT_DIR, "splash.png"), "PNG")
    print("  ✓ splash.png saved")


# ============================================================
# 3. preview.png — 1200x630
# ============================================================
def generate_preview():
    print("Generating preview.png (1200x630)...")
    img = Image.new('RGBA', (1200, 630), (*DARK_BG, 255))
    draw = ImageDraw.Draw(img, 'RGBA')

    # Flame in center
    draw_stylized_flame(img, 600, 360, size_factor=1.5)

    # "ROAST ME" text
    font_large = get_font(80, bold=True)
    draw_gradient_text(draw, "ROAST ME", 600, 400, font_large, WHITE, ORANGE, 1200)

    # Tagline
    font_small = get_font(28, bold=False)
    bbox = draw.textbbox((0, 0), "AI-powered roasts on Base", font=font_small)
    tw = bbox[2] - bbox[0]
    draw.text((600 - tw // 2, 500), "AI-powered roasts on Base",
              fill=(*ORANGE, 200), font=font_small)

    result = Image.new('RGB', (1200, 630), DARK_BG)
    result.paste(img, (0, 0), img)
    result.save(os.path.join(OUTPUT_DIR, "preview.png"), "PNG")
    print("  ✓ preview.png saved")


# ============================================================
# 4. hero.png — 1200x630
# ============================================================
def generate_hero():
    print("Generating hero.png (1200x630)...")
    img = Image.new('RGBA', (1200, 630), (*DARK_BG, 255))
    draw = ImageDraw.Draw(img, 'RGBA')

    # Gradient background
    for y in range(630):
        t = y / 630
        color = lerp_color(DARK_BG, DARK_RED_BG, t)
        draw.line([(0, y), (1200, y)], fill=(*color, 255))

    # Multiple flames rising from bottom
    random.seed(123)
    flame_positions = [150, 350, 600, 850, 1050]
    flame_sizes = [0.8, 1.2, 1.8, 1.2, 0.8]
    for fx, fs in zip(flame_positions, flame_sizes):
        draw_stylized_flame(img, fx, 600, size_factor=fs)

    # Ember particles
    draw_ember_particles(draw, 1200, 630, count=50)

    # "ROAST ME" text
    font_title = get_font(90, bold=True)
    draw_gradient_text(draw, "ROAST ME", 600, 250, font_title, ORANGE, RED, 1200)

    # Subtitle
    font_sub = get_font(24, bold=False)
    subtitle = "Get roasted by AI. Pay with crypto. Flex the burn."
    bbox = draw.textbbox((0, 0), subtitle, font=font_sub)
    tw = bbox[2] - bbox[0]
    draw.text((600 - tw // 2, 370), subtitle,
              fill=(*WHITE, 180), font=font_sub)

    result = Image.new('RGB', (1200, 630), DARK_BG)
    result.paste(img, (0, 0), img)
    result.save(os.path.join(OUTPUT_DIR, "hero.png"), "PNG")
    print("  ✓ hero.png saved")


# ============================================================
# 5. og.png — 1200x630
# ============================================================
def generate_og():
    print("Generating og.png (1200x630)...")
    img = Image.new('RGBA', (1200, 630), (*DARK_BG, 255))
    draw = ImageDraw.Draw(img, 'RGBA')

    # Central flame with strong glow
    draw_stylized_flame(img, 600, 350, size_factor=1.5)

    # "ONCHAIN ROAST ME" title
    font_title = get_font(72, bold=True)
    draw_gradient_text(draw, "ONCHAIN ROAST ME", 600, 380, font_title, WHITE, ORANGE, 1200)

    # Subtitle
    font_sub = get_font(30, bold=False)
    subtitle = "AI roasts your Farcaster profile"
    bbox = draw.textbbox((0, 0), subtitle, font=font_sub)
    tw = bbox[2] - bbox[0]
    draw.text((600 - tw // 2, 470), subtitle,
              fill=ORANGE, font=font_sub)

    # "Built on Base" in bottom right
    font_badge = get_font(20, bold=True)
    badge_text = "Built on Base"
    bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    # Badge background
    bx = 1200 - tw - 50
    by = 630 - th - 40
    padding = 10
    draw.rounded_rectangle([bx - padding, by - padding,
                            bx + tw + padding, by + th + padding],
                           radius=8, fill=(30, 30, 50, 180))
    draw.text((bx, by), badge_text, fill=(100, 150, 255), font=font_badge)

    result = Image.new('RGB', (1200, 630), DARK_BG)
    result.paste(img, (0, 0), img)
    result.save(os.path.join(OUTPUT_DIR, "og.png"), "PNG")
    print("  ✓ og.png saved")


# ============================================================
# Run all
# ============================================================
if __name__ == "__main__":
    print(f"Output directory: {OUTPUT_DIR}")
    print("=" * 50)
    generate_icon()
    generate_splash()
    generate_preview()
    generate_hero()
    generate_og()
    print("=" * 50)
    print("All 5 images generated successfully!")
