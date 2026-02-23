#!/usr/bin/env python3
"""
Generate App Store screenshots for Neo Browser (1242 x 2688 px)
Style: Big bold headline top, LARGE phone that extends off bottom edge.
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

W, H = 1242, 2688

# ── Colors ──────────────────────────────────────────────────
CREAM      = (250, 249, 247)
WHITE      = (255, 255, 255)
BLACK      = (0, 0, 0)
GRAY50     = (250, 250, 249)
GRAY100    = (240, 237, 234)
GRAY200    = (229, 226, 221)
GRAY300    = (206, 201, 193)
GRAY400    = (168, 162, 158)
GRAY500    = (120, 113, 108)
GRAY600    = (87, 83, 78)
GRAY700    = (63, 59, 55)
GRAY800    = (30, 27, 24)

BLUE       = (37, 99, 235)
GREEN      = (22, 163, 74)
VPN_GREEN  = (16, 185, 129)
ORANGE     = (234, 88, 12)
PURPLE     = (124, 58, 237)
TEAL       = (13, 148, 136)
RED        = (220, 38, 38)
INDIGO     = (79, 70, 229)

def font(size, weight="Regular"):
    paths = {
        "Regular":  "/Library/Fonts/SF-Pro-Display-Regular.otf",
        "Medium":   "/Library/Fonts/SF-Pro-Display-Medium.otf",
        "Semibold": "/Library/Fonts/SF-Pro-Display-Semibold.otf",
        "Bold":     "/Library/Fonts/SF-Pro-Display-Bold.otf",
        "Heavy":    "/Library/Fonts/SF-Pro-Display-Heavy.otf",
        "Black":    "/Library/Fonts/SF-Pro-Display-Black.otf",
    }
    try:
        return ImageFont.truetype(paths.get(weight, paths["Regular"]), size)
    except:
        return ImageFont.truetype(paths["Regular"], size)

OUT_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(OUT_DIR, exist_ok=True)

# ── Helpers ─────────────────────────────────────────────────
def rounded_rect(draw, xy, fill, radius=20, outline=None, width=0):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)

def circle(draw, center, r, fill):
    x, y = center
    draw.ellipse([x - r, y - r, x + r, y + r], fill=fill)

def text_center_x(draw, text, y, fnt, fill=GRAY800, w=None):
    target_w = w or W
    bbox = draw.textbbox((0, 0), text, font=fnt)
    tw = bbox[2] - bbox[0]
    x = (target_w - tw) // 2
    draw.text((x, y), text, font=fnt, fill=fill)

def draw_phone_frame(img, screen_img, phone_top, phone_w=980):
    """Draw phone bezel. Phone extends off bottom."""
    draw = ImageDraw.Draw(img)
    bezel = 20
    br = 68  # bezel radius
    sr = 52  # screen radius

    cx = W // 2
    px = cx - phone_w // 2
    # Full phone height (extends past canvas)
    phone_h = screen_img.size[1] * phone_w // screen_img.size[0]

    bx1, by1 = px - bezel, phone_top - bezel
    bx2, by2 = px + phone_w + bezel, phone_top + phone_h + bezel

    # Soft shadow
    for i in range(6):
        off = (i + 1) * 3
        a = max(0, 20 - i * 3)
        sl = Image.new('RGBA', img.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(sl)
        sd.rounded_rectangle([bx1 + 2, by1 + off, bx2 + 2, by2 + off], radius=br + i * 2, fill=(0, 0, 0, a))
        sl = sl.filter(ImageFilter.GaussianBlur(14 + i * 4))
        rgba = img.convert('RGBA')
        rgba = Image.alpha_composite(rgba, sl)
        img.paste(rgba.convert('RGB'))

    draw = ImageDraw.Draw(img)
    # Bezel
    draw.rounded_rectangle([bx1, by1, bx2, by2], radius=br, fill=(20, 18, 16))
    # Screen background
    draw.rounded_rectangle([px, phone_top, px + phone_w, phone_top + phone_h], radius=sr, fill=WHITE)

    # Paste screen (clipped to canvas)
    scr = screen_img.resize((phone_w, phone_h), Image.LANCZOS)
    mask = Image.new('L', (phone_w, phone_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, phone_w, phone_h], radius=sr, fill=255)
    # Only paste the visible portion
    visible_h = min(phone_h, H - phone_top)
    if visible_h < phone_h:
        scr = scr.crop((0, 0, phone_w, visible_h))
        mask = mask.crop((0, 0, phone_w, visible_h))
    img.paste(scr, (px, phone_top), mask)

    draw = ImageDraw.Draw(img)
    # Dynamic island
    iw, ih = 190, 50
    ix = cx - iw // 2
    iy = phone_top + 20
    draw.rounded_rectangle([ix, iy, ix + iw, iy + ih], radius=ih // 2, fill=BLACK)

def draw_status_bar(draw, x, y, w):
    draw.text((x + 48, y + 18), "9:41", font=font(34, "Semibold"), fill=BLACK)
    for i in range(4):
        bh = 8 + i * 3
        bx = x + w - 195 + i * 16
        draw.rounded_rectangle([bx, y + 34 - bh, bx + 10, y + 34], radius=2, fill=BLACK)
    bat_x = x + w - 68
    draw.rounded_rectangle([bat_x, y + 18, bat_x + 48, y + 34], radius=5, outline=BLACK, width=2)
    draw.rounded_rectangle([bat_x + 4, y + 21, bat_x + 40, y + 31], radius=3, fill=BLACK)
    draw.rounded_rectangle([bat_x + 48, y + 24, bat_x + 52, y + 30], radius=2, fill=BLACK)


# Phone screen canvas size — tall so it extends past bottom
PW, PH = 980, 2200


# ══════════════════════════════════════════════════════════════
# SCREENSHOT 1 — Home / Search
# ══════════════════════════════════════════════════════════════
def make_screenshot_1():
    img = Image.new('RGB', (W, H), CREAM)
    draw = ImageDraw.Draw(img)

    # Big headlines
    text_center_x(draw, "Search with AI.", 80, font(120, "Black"), BLUE)
    text_center_x(draw, "Browse without ads.", 230, font(120, "Black"), GRAY800)

    # Phone screen
    phone = Image.new('RGB', (PW, PH), CREAM)
    pd = ImageDraw.Draw(phone)
    draw_status_bar(pd, 0, 0, PW)

    # Logo
    logo_y = 280
    neo_f = font(160, "Black")
    bbox = pd.textbbox((0, 0), "neo", font=neo_f)
    neo_w = bbox[2] - bbox[0]
    lx = (PW - neo_w - 32) // 2
    pd.text((lx, logo_y), "neo", font=neo_f, fill=GRAY800)
    circle(pd, (lx + neo_w + 22, logo_y + 124), 20, BLUE)

    # Tagline
    text_center_x(pd, "Search, browse, or build anything", logo_y + 190, font(38, "Regular"), GRAY400, PW)

    # Search bar
    sb_y = logo_y + 290
    mx = 56
    rounded_rect(pd, [mx, sb_y, PW - mx, sb_y + 110], WHITE, radius=30, outline=GRAY200, width=2)
    rounded_rect(pd, [mx + 16, sb_y + 16, mx + 92, sb_y + 92], GRAY100, radius=20)
    pd.text((mx + 36, sb_y + 32), "~", font=font(40, "Bold"), fill=GRAY400)
    pd.text((mx + 108, sb_y + 36), "Search, ask AI, or describe...", font=font(32, "Regular"), fill=GRAY300)

    # Quick links
    ql_y = sb_y + 150
    pd.text((mx, ql_y), "QUICK LINKS", font=font(26, "Semibold"), fill=GRAY400)

    chips = [
        ("YouTube", RED), ("GitHub", GRAY800), ("Reddit", ORANGE),
        ("Twitter", GRAY800), ("HN", ORANGE), ("Gmail", RED),
    ]
    cx = mx
    cy = ql_y + 55
    for name, color in chips:
        cw = len(name) * 22 + 60
        if cx + cw > PW - mx:
            cx = mx
            cy += 68
        rounded_rect(pd, [cx, cy, cx + cw, cy + 56], WHITE, radius=16, outline=GRAY200, width=2)
        circle(pd, (cx + 26, cy + 28), 11, color)
        pd.text((cx + 46, cy + 14), name, font=font(28, "Medium"), fill=GRAY700)
        cx += cw + 16

    # Powered by
    text_center_x(pd, "Powered by Gemini", cy + 110, font(26, "Regular"), GRAY400, PW)

    draw_phone_frame(img, phone, 480)
    return img


# ══════════════════════════════════════════════════════════════
# SCREENSHOT 2 — AI Agent
# ══════════════════════════════════════════════════════════════
def make_screenshot_2():
    img = Image.new('RGB', (W, H), CREAM)
    draw = ImageDraw.Draw(img)

    text_center_x(draw, "Ask anything.", 80, font(120, "Black"), GRAY800)
    text_center_x(draw, "AI finds answers.", 230, font(120, "Black"), INDIGO)

    phone = Image.new('RGB', (PW, PH), WHITE)
    pd = ImageDraw.Draw(phone)
    draw_status_bar(pd, 0, 0, PW)

    # URL bar
    ub_y = 76
    rounded_rect(pd, [24, ub_y, PW - 24, ub_y + 72], GRAY50, radius=20, outline=GRAY100, width=2)
    circle(pd, (56, ub_y + 36), 10, GREEN)
    pd.text((78, ub_y + 18), "google.com/search", font=font(30, "Medium"), fill=GRAY400)

    # Dimmed result
    cr_y = ub_y + 96
    rounded_rect(pd, [28, cr_y, PW - 28, cr_y + 150], GRAY50, radius=22)
    pd.text((52, cr_y + 22), "Best Laptops 2025 — CNET", font=font(34, "Semibold"), fill=GRAY600)
    pd.text((52, cr_y + 66), "We tested 40+ laptops to find the", font=font(28, "Regular"), fill=GRAY400)
    pd.text((52, cr_y + 100), "best options for every budget...", font=font(28, "Regular"), fill=GRAY400)

    # AI Panel
    panel_y = cr_y + 200
    rounded_rect(pd, [0, panel_y, PW, PH], WHITE, radius=40)
    rounded_rect(pd, [PW // 2 - 32, panel_y + 16, PW // 2 + 32, panel_y + 22], GRAY200, radius=3)

    # Agent header
    ah_y = panel_y + 52
    circle(pd, (52, ah_y + 18), 16, (220, 252, 231))
    circle(pd, (52, ah_y + 18), 8, GREEN)
    pd.text((80, ah_y), "Neo Agent", font=font(34, "Semibold"), fill=GRAY800)
    pd.text((80, ah_y + 38), "Agent browsing", font=font(26, "Regular"), fill=GREEN)

    # User bubble
    msg_y = ah_y + 100
    u_text = "Find the best laptop under $1000"
    uf = font(32, "Regular")
    bbox = pd.textbbox((0, 0), u_text, font=uf)
    umw = bbox[2] - bbox[0] + 60
    rounded_rect(pd, [PW - umw - 36, msg_y, PW - 36, msg_y + 72], GRAY800, radius=26)
    pd.text((PW - umw - 6, msg_y + 18), u_text, font=uf, fill=WHITE)

    # AI label
    ai_y = msg_y + 100
    pd.text((40, ai_y), "Gemini", font=font(24, "Semibold"), fill=GRAY400)
    circle(pd, (110, ai_y + 12), 6, BLUE)

    # Response card
    ai_y += 42
    rounded_rect(pd, [40, ai_y, PW - 100, ai_y + 440], GRAY50, radius=26)

    lines = [
        ("Based on my research, here are", "Regular", GRAY700),
        ("the top picks under $1,000:", "Regular", GRAY700),
        ("", None, None),
        ("1. MacBook Air M3 — $899", "Semibold", GRAY800),
        ("   Best overall performance", "Regular", GRAY500),
        ("", None, None),
        ("2. Lenovo ThinkPad E14 — $749", "Semibold", GRAY800),
        ("   Best for productivity", "Regular", GRAY500),
        ("", None, None),
        ("3. Dell Inspiron 16 — $679", "Semibold", GRAY800),
        ("   Best budget pick", "Regular", GRAY500),
    ]
    ly = ai_y + 28
    for text, weight, color in lines:
        if not text:
            ly += 12
            continue
        pd.text((68, ly), text, font=font(28, weight), fill=color)
        ly += 40

    # Step
    step_y = ai_y + 460
    circle(pd, (56, step_y + 12), 6, BLUE)
    pd.text((74, step_y), "Searched 5 review sites", font=font(24, "Regular"), fill=GRAY400)

    # Input
    inp_y = PH - 110
    rounded_rect(pd, [28, inp_y, PW - 28, inp_y + 80], GRAY50, radius=26, outline=GRAY200, width=2)
    pd.text((56, inp_y + 22), "Ask a follow-up...", font=font(30, "Regular"), fill=GRAY300)
    circle(pd, (PW - 68, inp_y + 40), 28, GRAY800)
    pd.text((PW - 80, inp_y + 24), "\u2191", font=font(34, "Bold"), fill=WHITE)

    draw_phone_frame(img, phone, 480)
    return img


# ══════════════════════════════════════════════════════════════
# SCREENSHOT 3 — Privacy Shield
# ══════════════════════════════════════════════════════════════
def make_screenshot_3():
    img = Image.new('RGB', (W, H), CREAM)
    draw = ImageDraw.Draw(img)

    text_center_x(draw, "Block ads.", 80, font(120, "Black"), GREEN)
    text_center_x(draw, "Block trackers.", 230, font(120, "Black"), GRAY800)

    phone = Image.new('RGB', (PW, PH), WHITE)
    pd = ImageDraw.Draw(phone)
    draw_status_bar(pd, 0, 0, PW)

    # Header
    hdr_y = 86
    circle(pd, (76, hdr_y + 38), 36, (220, 252, 231))
    pd.text((56, hdr_y + 16), "S", font=font(40, "Bold"), fill=GREEN)
    pd.text((126, hdr_y + 6), "Privacy Shield", font=font(44, "Bold"), fill=GRAY800)
    pd.text((126, hdr_y + 58), "247 threats blocked", font=font(30, "Regular"), fill=GREEN)

    # Stats
    sy = hdr_y + 130
    sw = (PW - 90) // 3
    stats = [
        ("142", "Ads Blocked", (220, 252, 231)),
        ("89", "Trackers", (219, 234, 254)),
        ("16", "HTTPS", (220, 252, 231)),
    ]
    for i, (num, label, bg) in enumerate(stats):
        sx = 32 + i * (sw + 14)
        rounded_rect(pd, [sx, sy, sx + sw, sy + 130], bg, radius=22)
        pd.text((sx + 24, sy + 18), num, font=font(52, "Bold"), fill=GRAY800)
        pd.text((sx + 24, sy + 82), label, font=font(24, "Medium"), fill=GRAY500)

    # Protection section
    py = sy + 170
    pd.text((40, py), "PROTECTION", font=font(24, "Semibold"), fill=GRAY400)

    toggles = [
        ("Ad Blocking", "Block ads on all websites", GREEN, True),
        ("Tracker Protection", "Prevent cross-site tracking", BLUE, True),
        ("HTTPS Everywhere", "Upgrade to secure connections", GREEN, True),
        ("Fingerprint Protection", "Randomize browser fingerprint", PURPLE, False),
    ]
    ty = py + 52
    for name, desc, color, on in toggles:
        icon_bg = (220, 252, 231) if color == GREEN and on else (219, 234, 254) if color == BLUE and on else (237, 233, 254) if color == PURPLE and on else GRAY100
        rounded_rect(pd, [40, ty, 92, ty + 52], icon_bg, radius=16)
        circle(pd, (66, ty + 26), 10, color if on else GRAY300)
        pd.text((110, ty + 4), name, font=font(30, "Semibold"), fill=GRAY800)
        pd.text((110, ty + 38), desc, font=font(24, "Regular"), fill=GRAY400)
        tw_x = PW - 110
        if on:
            rounded_rect(pd, [tw_x, ty + 8, tw_x + 66, ty + 42], GREEN, radius=18)
            circle(pd, (tw_x + 50, ty + 25), 14, WHITE)
        else:
            rounded_rect(pd, [tw_x, ty + 8, tw_x + 66, ty + 42], GRAY200, radius=18)
            circle(pd, (tw_x + 16, ty + 25), 14, WHITE)
        ty += 94

    # Cookie control
    ck_y = ty + 28
    pd.text((40, ck_y), "COOKIE CONTROL", font=font(24, "Semibold"), fill=GRAY400)
    cy2 = ck_y + 52
    for name, active in [("Allow All", False), ("Block 3rd Party", True), ("Block All", False)]:
        bg = (220, 252, 231) if active else GRAY50
        rounded_rect(pd, [40, cy2, PW - 40, cy2 + 74], bg, radius=20, outline=GREEN if active else GRAY200, width=2)
        pd.text((68, cy2 + 20), name, font=font(30, "Semibold"), fill=GREEN if active else GRAY700)
        if active:
            pd.text((PW - 88, cy2 + 20), "\u2713", font=font(32, "Bold"), fill=GREEN)
        cy2 += 92

    draw_phone_frame(img, phone, 480)
    return img


# ══════════════════════════════════════════════════════════════
# SCREENSHOT 4 — VPN
# ══════════════════════════════════════════════════════════════
def make_screenshot_4():
    img = Image.new('RGB', (W, H), CREAM)
    draw = ImageDraw.Draw(img)

    text_center_x(draw, "Built-in VPN.", 80, font(120, "Black"), VPN_GREEN)
    text_center_x(draw, "One tap. Protected.", 230, font(120, "Black"), GRAY800)

    phone = Image.new('RGB', (PW, PH), WHITE)
    pd = ImageDraw.Draw(phone)
    draw_status_bar(pd, 0, 0, PW)

    # Header
    hdr_y = 86
    circle(pd, (76, hdr_y + 38), 36, (220, 252, 231))
    pd.text((52, hdr_y + 14), "G", font=font(40, "Bold"), fill=VPN_GREEN)
    pd.text((126, hdr_y + 6), "VPN", font=font(44, "Bold"), fill=GRAY800)
    pd.text((126, hdr_y + 58), "Connected \u00b7 Protected", font=font(30, "Regular"), fill=VPN_GREEN)

    # Big power button
    btn_cx, btn_cy = PW // 2, 400

    # Glow
    for r in range(120, 85, -2):
        a = int(28 * (120 - r) / 35)
        gl = Image.new('RGBA', (PW, PH), (0, 0, 0, 0))
        gd = ImageDraw.Draw(gl)
        gd.ellipse([btn_cx - r, btn_cy - r, btn_cx + r, btn_cy + r], fill=(16, 185, 129, a))
        phone = Image.alpha_composite(phone.convert('RGBA'), gl).convert('RGB')
        pd = ImageDraw.Draw(phone)

    circle(pd, (btn_cx, btn_cy), 82, VPN_GREEN)
    pd.arc([btn_cx - 30, btn_cy - 30, btn_cx + 30, btn_cy + 30], 210, 330, fill=WHITE, width=6)
    pd.line([(btn_cx, btn_cy - 38), (btn_cx, btn_cy - 12)], fill=WHITE, width=6)

    text_center_x(pd, "Protected", btn_cy + 110, font(40, "Semibold"), VPN_GREEN, PW)

    # Server pill
    pill_y = btn_cy + 175
    pill_t = "United States \u00b7 12ms"
    pf = font(30, "Medium")
    bbox = pd.textbbox((0, 0), pill_t, font=pf)
    pw2 = bbox[2] - bbox[0] + 64
    px2 = (PW - pw2) // 2
    rounded_rect(pd, [px2, pill_y, px2 + pw2, pill_y + 58], (220, 252, 231), radius=29)
    pd.text((px2 + 32, pill_y + 12), pill_t, font=pf, fill=VPN_GREEN)

    # Servers
    srv_y = pill_y + 100
    pd.text((40, srv_y), "SERVER LOCATIONS", font=font(24, "Semibold"), fill=GRAY400)

    servers = [
        ("US", "United States", "12ms", True),
        ("UK", "United Kingdom", "45ms", False),
        ("DE", "Germany", "38ms", False),
        ("JP", "Japan", "92ms", False),
        ("SG", "Singapore", "78ms", False),
        ("NL", "Netherlands", "41ms", False),
    ]
    sy2 = srv_y + 52
    for code, name, ping, sel in servers:
        bg = (220, 252, 231) if sel else WHITE
        rounded_rect(pd, [32, sy2, PW - 32, sy2 + 76], bg, radius=20)
        circle(pd, (76, sy2 + 38), 24, (187, 247, 208) if sel else GRAY100)
        cf = font(22, "Bold")
        bbox = pd.textbbox((0, 0), code, font=cf)
        cw = bbox[2] - bbox[0]
        pd.text((76 - cw // 2, sy2 + 26), code, font=cf, fill=VPN_GREEN if sel else GRAY600)
        pd.text((116, sy2 + 20), name, font=font(30, "Medium"), fill=GRAY800)
        pd.text((PW - 156, sy2 + 24), ping, font=font(26, "Medium"), fill=GRAY400)
        if sel:
            pd.text((PW - 76, sy2 + 20), "\u2713", font=font(32, "Bold"), fill=VPN_GREEN)
        sy2 += 90

    draw_phone_frame(img, phone, 480)
    return img


# ══════════════════════════════════════════════════════════════
# SCREENSHOT 5 — App Builder
# ══════════════════════════════════════════════════════════════
def make_screenshot_5():
    img = Image.new('RGB', (W, H), CREAM)
    draw = ImageDraw.Draw(img)

    text_center_x(draw, "Describe an app.", 80, font(120, "Black"), GRAY800)
    text_center_x(draw, "AI builds it live.", 230, font(120, "Black"), ORANGE)

    phone = Image.new('RGB', (PW, PH), WHITE)
    pd = ImageDraw.Draw(phone)
    draw_status_bar(pd, 0, 0, PW)

    # URL bar
    ub_y = 76
    rounded_rect(pd, [24, ub_y, PW - 24, ub_y + 72], GRAY50, radius=20, outline=GRAY100, width=2)
    pd.text((50, ub_y + 18), "~", font=font(32, "Bold"), fill=ORANGE)
    pd.text((84, ub_y + 18), "App Builder", font=font(30, "Medium"), fill=GRAY500)

    # Preview card
    prev_y = ub_y + 100
    rounded_rect(pd, [32, prev_y, PW - 32, prev_y + 720], WHITE, radius=26, outline=GRAY200, width=2)

    # App header
    rounded_rect(pd, [32, prev_y, PW - 32, prev_y + 80], BLUE, radius=26)
    pd.rectangle([32, prev_y + 52, PW - 32, prev_y + 80], fill=BLUE)
    pd.text((64, prev_y + 20), "\u2713 My Todo App", font=font(36, "Bold"), fill=WHITE)

    # Todos
    todos = [
        ("Buy groceries", True),
        ("Review pull request", True),
        ("Write blog post", False),
        ("Schedule dentist", False),
        ("Plan weekend trip", False),
    ]
    ty = prev_y + 108
    for text, done in todos:
        if done:
            circle(pd, (80, ty + 24), 20, BLUE)
            pd.text((68, ty + 10), "\u2713", font=font(28, "Bold"), fill=WHITE)
            pd.text((116, ty + 8), text, font=font(32, "Regular"), fill=GRAY400)
            bbox = pd.textbbox((0, 0), text, font=font(32, "Regular"))
            pd.line([(116, ty + 26), (116 + bbox[2] - bbox[0], ty + 26)], fill=GRAY300, width=2)
        else:
            pd.ellipse([60, ty + 4, 100, ty + 44], outline=GRAY300, width=2)
            pd.text((116, ty + 8), text, font=font(32, "Regular"), fill=GRAY800)
        ty += 70

    # Add input
    ty += 20
    rounded_rect(pd, [56, ty, PW - 56, ty + 66], GRAY50, radius=18, outline=GRAY200, width=2)
    pd.text((80, ty + 18), "Add a new task...", font=font(28, "Regular"), fill=GRAY300)
    circle(pd, (PW - 92, ty + 33), 24, BLUE)
    pd.text((PW - 104, ty + 16), "+", font=font(36, "Bold"), fill=WHITE)

    # Builder panel
    builder_y = prev_y + 760
    rounded_rect(pd, [0, builder_y, PW, PH], WHITE, radius=40)
    rounded_rect(pd, [PW // 2 - 32, builder_y + 16, PW // 2 + 32, builder_y + 22], GRAY200, radius=3)

    bh_y = builder_y + 52
    rounded_rect(pd, [40, bh_y, 92, bh_y + 52], (255, 237, 213), radius=16)
    circle(pd, (66, bh_y + 26), 10, ORANGE)
    pd.text((110, bh_y + 4), "App Builder", font=font(32, "Semibold"), fill=GRAY800)
    pd.text((110, bh_y + 40), "Ready to create", font=font(26, "Regular"), fill=GREEN)

    # User bubble
    ub2_y = bh_y + 92
    u_text = "Build a simple todo app"
    uf = font(32, "Regular")
    bbox = pd.textbbox((0, 0), u_text, font=uf)
    umw = bbox[2] - bbox[0] + 60
    rounded_rect(pd, [PW - umw - 40, ub2_y, PW - 40, ub2_y + 72], GRAY800, radius=26)
    pd.text((PW - umw - 10, ub2_y + 18), u_text, font=uf, fill=WHITE)

    # AI response
    ai_y = ub2_y + 100
    pd.text((40, ai_y), "Gemini", font=font(24, "Semibold"), fill=GRAY400)
    circle(pd, (112, ai_y + 12), 6, BLUE)
    ai_y += 40
    rounded_rect(pd, [40, ai_y, PW - 130, ai_y + 110], GRAY50, radius=22)
    pd.text((68, ai_y + 18), "Done! Your todo app is ready.", font=font(30, "Regular"), fill=GRAY800)
    pd.text((68, ai_y + 60), "Tap the preview to try it.", font=font(26, "Regular"), fill=GRAY400)

    draw_phone_frame(img, phone, 480)
    return img


# ══════════════════════════════════════════════════════════════
# SCREENSHOT 6 — YouTube Ad-Free
# ══════════════════════════════════════════════════════════════
def make_screenshot_6():
    img = Image.new('RGB', (W, H), CREAM)
    draw = ImageDraw.Draw(img)

    text_center_x(draw, "YouTube, ad-free.", 80, font(120, "Black"), RED)
    text_center_x(draw, "Privacy built in.", 230, font(120, "Black"), GRAY800)

    phone = Image.new('RGB', (PW, PH), WHITE)
    pd = ImageDraw.Draw(phone)
    draw_status_bar(pd, 0, 0, PW)

    # URL bar
    ub_y = 76
    rounded_rect(pd, [24, ub_y, PW - 24, ub_y + 72], GRAY50, radius=20, outline=GRAY100, width=2)
    circle(pd, (56, ub_y + 36), 16, (220, 252, 231))
    pd.text((44, ub_y + 20), "S", font=font(24, "Bold"), fill=GREEN)
    rounded_rect(pd, [66, ub_y + 12, 90, ub_y + 34], RED, radius=11)
    pd.text((72, ub_y + 12), "5", font=font(20, "Bold"), fill=WHITE)
    pd.text((102, ub_y + 20), "youtube.com", font=font(30, "Medium"), fill=GRAY500)
    # VPN badge removed for v1

    # Video 1
    vt_y = ub_y + 94
    rounded_rect(pd, [28, vt_y, PW - 28, vt_y + 440], GRAY800, radius=22)
    # Play button
    cx2, cy2 = PW // 2, vt_y + 200
    circle(pd, (cx2, cy2), 48, WHITE)
    pd.polygon([(cx2 - 16, cy2 - 22), (cx2 - 16, cy2 + 22), (cx2 + 22, cy2)], fill=GRAY800)
    # Duration
    rounded_rect(pd, [PW - 120, vt_y + 392, PW - 44, vt_y + 424], BLACK, radius=8)
    pd.text((PW - 112, vt_y + 394), "12:34", font=font(24, "Medium"), fill=WHITE)

    # Title
    pd.text((40, vt_y + 460), "How to Build a React App in 2025", font=font(34, "Semibold"), fill=GRAY800)
    vi_y = vt_y + 510
    circle(pd, (58, vi_y + 20), 22, RED)
    pd.text((46, vi_y + 8), "\u25B6", font=font(20, "Bold"), fill=WHITE)
    pd.text((92, vi_y), "Tech Channel", font=font(30, "Semibold"), fill=GRAY800)
    pd.text((92, vi_y + 36), "1.2M views \u00b7 2 days ago", font=font(24, "Regular"), fill=GRAY400)

    # Video 2
    v2_y = vi_y + 86
    rounded_rect(pd, [28, v2_y, PW - 28, v2_y + 440], GRAY700, radius=22)
    rounded_rect(pd, [PW - 120, v2_y + 392, PW - 44, v2_y + 424], BLACK, radius=8)
    pd.text((PW - 112, v2_y + 394), "8:21", font=font(24, "Medium"), fill=WHITE)

    pd.text((40, v2_y + 460), "The Future of AI Browsers", font=font(34, "Semibold"), fill=GRAY800)
    vi2_y = v2_y + 510
    circle(pd, (58, vi2_y + 20), 22, PURPLE)
    pd.text((92, vi2_y), "AI Weekly", font=font(30, "Semibold"), fill=GRAY800)
    pd.text((92, vi2_y + 36), "890K views \u00b7 1 week ago", font=font(24, "Regular"), fill=GRAY400)

    # Privacy card
    card_y = PH - 130
    rounded_rect(pd, [28, card_y, PW - 28, card_y + 104], WHITE, radius=22, outline=(220, 252, 231), width=3)
    circle(pd, (76, card_y + 52), 28, (220, 252, 231))
    pd.text((62, card_y + 34), "S", font=font(30, "Bold"), fill=GREEN)
    pd.text((116, card_y + 18), "Privacy Shield Active", font=font(30, "Semibold"), fill=GRAY800)
    pd.text((116, card_y + 58), "5 ads blocked \u00b7 3 trackers blocked", font=font(24, "Regular"), fill=GRAY400)

    draw_phone_frame(img, phone, 480)
    return img


# ══════════════════════════════════════════════════════════════
# SCREENSHOT 7 — Neo Pro Paywall
# ══════════════════════════════════════════════════════════════
def make_screenshot_7():
    img = Image.new('RGB', (W, H), CREAM)
    draw = ImageDraw.Draw(img)

    text_center_x(draw, "Unlock everything.", 80, font(120, "Black"), BLUE)
    text_center_x(draw, "3 days free.", 230, font(120, "Black"), GRAY800)

    phone = Image.new('RGB', (PW, PH), CREAM)
    pd = ImageDraw.Draw(phone)
    draw_status_bar(pd, 0, 0, PW)

    # Logo + Pro badge
    logo_y = 180
    neo_f = font(120, "Black")
    bbox = pd.textbbox((0, 0), "neo", font=neo_f)
    neo_w = bbox[2] - bbox[0]
    lx = (PW - neo_w - 24) // 2
    pd.text((lx, logo_y), "neo", font=neo_f, fill=GRAY800)
    circle(pd, (lx + neo_w + 16, logo_y + 94), 14, BLUE)

    # Pro badge
    badge_w, badge_h = 120, 44
    badge_x = (PW - badge_w) // 2
    badge_y = logo_y + 150
    rounded_rect(pd, [badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], BLUE, radius=14)
    text_center_x(pd, "Pro", badge_y + 6, font(28, "Bold"), WHITE, PW)

    # Feature cards
    features = [
        ("Ad-Free Browsing", "No ads, anywhere", GREEN),
        ("AI Agent", "Ask anything, AI finds answers", BLUE),
        ("AI Builder", "Describe an app, AI builds it", ORANGE),
        ("AI Search", "Smarter search powered by AI", PURPLE),
    ]
    fy = badge_y + 80
    for label, desc, color in features:
        rounded_rect(pd, [56, fy, PW - 56, fy + 88], WHITE, radius=22)
        icon_bg = color + (24,) if len(color) == 3 else color
        rounded_rect(pd, [76, fy + 18, 128, fy + 70], (*color, 30), radius=16)
        circle(pd, (102, fy + 44), 12, color)
        pd.text((148, fy + 18), label, font=font(30, "Semibold"), fill=GRAY800)
        pd.text((148, fy + 54), desc, font=font(24, "Regular"), fill=GRAY400)
        fy += 100

    # Price text
    fy += 16
    text_center_x(pd, "$9.99/month after 3-day free trial", fy, font(30, "Semibold"), GRAY600, PW)

    # CTA button
    fy += 60
    btn_mx = 56
    rounded_rect(pd, [btn_mx, fy, PW - btn_mx, fy + 86], GRAY800, radius=24)
    text_center_x(pd, "Start Free Trial", fy + 22, font(34, "Bold"), WHITE, PW)

    # Links
    fy += 110
    text_center_x(pd, "Restore Purchases  ·  Use your own API key", fy, font(24, "Medium"), BLUE, PW)

    # Fine print
    fy += 50
    text_center_x(pd, "Payment charged to Apple ID. Auto-renews monthly.", fy, font(22, "Regular"), GRAY400, PW)

    draw_phone_frame(img, phone, 480)
    return img


if __name__ == "__main__":
    shots = [
        ("01_home", make_screenshot_1),
        ("02_ai_agent", make_screenshot_2),
        ("03_privacy", make_screenshot_3),
        ("04_builder", make_screenshot_5),
        ("05_youtube", make_screenshot_6),
        ("06_paywall", make_screenshot_7),
    ]
    for name, fn in shots:
        print(f"Generating {name}...")
        fn().save(os.path.join(OUT_DIR, f"{name}.png"), "PNG")
    print(f"\nDone! {len(shots)} screenshots in {OUT_DIR}/")
