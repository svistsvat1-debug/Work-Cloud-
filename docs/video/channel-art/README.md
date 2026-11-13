# WARBOARD channel art (2026-11-13)

| File | Size | Where |
|---|---|---|
| `avatar_800x800.png` | 800×800 | YouTube Studio → Customization → Branding → Picture |
| `banner_2560x1440.jpg` | 2560×1440, ~0.5 MB | Branding → Banner image (PNG copy also here) |

Style: The Paint Explainer look (clean cartoon outlines, flat colors, bulging shocked eyes) + the WARBOARD soldier, whiteboard doodles.

## YouTube safe areas used
- Phone (always visible): centred 1546×423 → all text and the soldier live here with ≥ 28 px margin.
- Tablet: 1855×423; Desktop: 2560×423 (side doodles only); TV: the full 2560×1440 (doodles top and bottom).
- Checks: `check_banner_zones.jpg` (frames), `check_banner_devices.jpg` (TV / desktop / tablet / phone crops), `check_avatar_circles.png` (circle at 400 / 176 / 98 / 48 / 32 px).

## How it was made
- Avatar: 1 generation, gpt-image-2.5-sunburst, 1:1, 1K, medium, no reference (~98 credits).
- Banner: gpt-image-2.5-sunburst, 16:9, 2K, medium, no reference. The model ignores pixel sizes in the prompt (two attempts, ~85 credits each, both drew the content too big), so the content block is fitted into the phone safe area **by code**: `video-engine/tools/banner_fit_content.py raw.png out.png 410 380 2210 1040`, then `video-engine/tools/channel_art_check.py` exports and checks.
