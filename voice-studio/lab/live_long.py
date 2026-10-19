"""Long-script check of the deployed site: a ~3000-word script (about 17 minutes) per language through the real page.
Every request the page makes is logged with its characters and the seconds of audio it got back, so a voice that
returns cut audio (a request voiced only in part) shows up as far too many characters per second.
Env: LONG_CASES "lang:voice ..." (default: each language's default voice)."""
import asyncio
import json
import os
import time

from playwright.async_api import async_playwright

SITE = "https://voice-studio-app.svistsvat1.workers.dev/"
texts = json.load(open("texts.json"))
CASES = [tuple(c.split(":")) for c in os.environ.get("LONG_CASES", "en:am_michael de:de_max es:es_alex fr:fr_louis").split()]
TARGET = 18000  # characters, about 3000 words


def script(lang):
    """Paragraphs as a long YouTube script has them: some short, some 1000+ characters (two texts in one paragraph)."""
    keys = [k for k in texts if k == lang or k.endswith("_" + lang) and not k.startswith(("hardn_", "hardw_"))]
    paras, i = [], 0
    while sum(map(len, paras)) < TARGET:
        a, b = texts[keys[i % len(keys)]], texts[keys[(i + 1) % len(keys)]]
        paras.append(a + " " + b if i % 3 == 0 else a)
        i += 1
    return "\n\n".join(paras)


async def main():
    os.makedirs("out/long", exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await (await browser.new_context(accept_downloads=True, viewport={"width": 390, "height": 844})).new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.goto(SITE)
        await page.wait_for_selector("#loginBox:not([hidden]), #studio:not([hidden])")
        if await page.is_visible("#loginBox"):
            await page.fill("#password", os.environ["SITE_PASSWORD"].strip())
            await page.click("#loginBox button[type=submit]")
        await page.wait_for_selector("#studio:not([hidden])")
        # log every request: characters sent, seconds of audio back (after the page's trimming and speed)
        await page.evaluate("""() => { window.__log = []; const orig = speak;
            window.speak = async (text, voice, lang, speed, format, signal) => {
              const pcm = await orig(text, voice, lang, speed, format, signal);
              window.__log.push({ chars: text.length, sec: pcm.length / SR, text: text.slice(0, 80) }); return pcm; }; }""")
        summary = []
        for lang, voice in CASES:
            text = script(lang)
            await page.select_option("#lang", lang)
            await page.evaluate("(id) => { pickVoice(voiceOf(id)); updateLabels(); }", voice)
            await page.fill("#text", text)
            await page.evaluate("() => { window.__log = []; }")
            stats = await page.text_content("#stats")
            t = time.time()
            await page.click("#go")
            await page.wait_for_timeout(500)
            if "Натисніть ▶ ще раз" in (await page.text_content("#err") or ""):
                await page.click("#go")
            await page.wait_for_selector("#result:not([hidden])", timeout=1800000)
            await page.wait_for_function("document.getElementById('dlWav').textContent === 'Скачати аудіо'", timeout=600000)
            log = await page.evaluate("window.__log")
            dur = await page.evaluate("document.getElementById('player').duration")
            words = len(text.split())
            cps = sorted(r["chars"] / max(r["sec"], 0.01) for r in log)
            med = cps[len(cps) // 2]
            bad = [r for r in log if r["chars"] / max(r["sec"], 0.01) > 1.8 * med or r["chars"] / max(r["sec"], 0.01) < med / 1.8]
            print(f"LONG {lang} {voice}: {len(text)} chars, {words} words, page estimate '{stats}', audio {dur / 60:.1f} min "
                  f"({words / (dur / 60):.0f} words/min), {len(log)} requests, chars/s median {med:.1f} min {cps[0]:.1f} max {cps[-1]:.1f}, "
                  f"{len(bad)} odd, {time.time() - t:.0f} s", flush=True)
            for r in sorted(bad, key=lambda r: -r["chars"] / max(r["sec"], 0.01))[:12]:
                print(f"   odd: {r['chars']} chars -> {r['sec']:.1f} s ({r['chars'] / max(r['sec'], 0.01):.1f}/s) | {r['text']}", flush=True)
            by_len = {}
            for r in log:
                b = (r["chars"] // 200) * 200
                by_len.setdefault(b, []).append(r["chars"] / max(r["sec"], 0.01))
            print("   chars/s by request length: " + ", ".join(f"{b}-{b + 199}: {sum(v) / len(v):.1f} (n={len(v)})" for b, v in sorted(by_len.items())), flush=True)
            async with page.expect_download() as d:
                await page.click("#dlWav")
            await (await d.value).save_as(f"out/long/{lang}-{voice}.mp3")
            summary.append({"lang": lang, "voice": voice, "chars": len(text), "words": words, "minutes": dur / 60, "requests": log})
        json.dump(summary, open("out/long/log.json", "w"), indent=1, ensure_ascii=False)
        print("page errors:", errors)
        await browser.close()

asyncio.run(main())
