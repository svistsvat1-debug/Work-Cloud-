"""End-to-end check of the deployed site: signs in, runs the connection check, voices a text in every language
through the real page (its text preparation, chunking and checks), downloads the MP3s for evaluate.py."""
import asyncio
import json
import os
import time

from playwright.async_api import async_playwright

SITE = "https://voice-studio-app.svistsvat1.workers.dev/"
texts = json.load(open("texts.json"))
CASES = [  # every cheap voice: the defaults on the "hard" text (dates, prices, abbreviations) or a long story, the rest short
    ("en", "am_michael", "hard_en"), ("en", "af_heart", "long_en"),
    ("de", "de_lukas", "hard_de"), ("de", "de_anna", "long_de"), ("de", "de_max", "short2_de"), ("de", "de_lena", "short2_de"),
    ("es", "es_alex", "hard_es"), ("es", "es_lucia", "long_es"), ("es", "es_mateo", "short2_es"), ("es", "es_dora", "short2_es"),
    ("es", "es_valentina", "short2_es"),
    ("fr", "fr_louis", "hard_fr"), ("fr", "fr_camille", "long_fr"), ("fr", "fr_hugo", "short2_fr"), ("fr", "fr_siwis", "short2_fr")]
ONLY = os.environ.get("LIVE_LANGS", "").split()  # e.g. "en": only those languages
if os.environ.get("LIVE_CASES"):  # "lang:voice:text_key ..." instead of the list above
    CASES = [tuple(c.split(":")) for c in os.environ["LIVE_CASES"].split()]


async def main():
    os.makedirs("out/audio", exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await (await browser.new_context(accept_downloads=True, viewport={"width": 390, "height": 844})).new_page()
        errors, takes = [], []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("response", lambda r: takes.append(r.headers.get("x-voice-takes")) if "/api/tts" in r.url else None)
        await page.goto(SITE)
        await page.wait_for_selector("#loginBox:not([hidden]), #studio:not([hidden])")
        if await page.is_visible("#loginBox"):
            await page.fill("#password", os.environ["SITE_PASSWORD"].strip())
            await page.click("#loginBox button[type=submit]")
        await page.wait_for_selector("#studio:not([hidden])")
        await page.click("#openSettings")
        await page.click("#check")
        await page.wait_for_function("document.getElementById('checkMsg').textContent && document.getElementById('checkMsg').textContent !== 'Перевіряю...'", timeout=120000)
        print("CHECK:", await page.text_content("#checkMsg"), flush=True)
        await page.click("#closeSettings")
        results = []
        for lang, voice, key in CASES:
            if ONLY and lang not in ONLY:
                continue
            await page.select_option("#lang", lang)
            await page.evaluate("(id) => { pickVoice(voiceOf(id)); updateLabels(); }", voice)  # sets the accent and sex chips too
            assert await page.input_value("#voice") == voice, voice
            await page.fill("#text", texts[key])
            spoken = await page.evaluate("""([t, l]) => { const e = voiceOf(document.getElementById('voice').value).engine;
                return buildScript(t, {}, 0.8, l, CHUNK_CHARS[e], e).map((i) => i.spoken).join(' '); }""", [texts[key], lang])
            takes.clear()
            t = time.time()
            await page.click("#go")
            await page.wait_for_selector("#result:not([hidden])", timeout=300000)
            await page.wait_for_function("document.getElementById('dlWav').textContent === 'Скачати аудіо'", timeout=300000)
            async with page.expect_download() as d:
                await page.click("#dlWav")
            path = f"out/audio/live-{lang}-{voice}-{key}.mp3"
            await (await d.value).save_as(path)
            rec = {"id": f"live-{lang}-{voice}-{key}", "lang": lang, "model": "site", "chars": len(spoken), "text": spoken, "ok": True,
                   "file": path, "seconds": round(time.time() - t, 2), "takes": list(takes), "result": await page.text_content("#resultText")}
            print("LIVE:", json.dumps({k: rec[k] for k in ("id", "seconds", "takes", "result")}, ensure_ascii=False), "| spoken:", spoken, flush=True)
            results.append(rec)
            if os.environ.get("LIVE_FRAGMENT") and len(results) == 1:  # fix one fragment on the live site
                await page.click("#fragsToggle")
                await page.click('.frag[data-i="0"] [data-edit]')
                await page.fill('.frag[data-i="0"] textarea', "Quick update: we just hit fifteen hundred subscribers. Thank you!")
                await page.click('.frag[data-i="0"] [data-redo]')
                await page.wait_for_function("document.getElementById('resultText').textContent.startsWith('Фрагмент оновлено')", timeout=120000)
                rows = await page.eval_on_selector_all(".frag p", "els => els.map(e => e.textContent)")
                print("FRAGMENT:", await page.text_content("#resultText"), "| rows:", rows, flush=True)
                await page.click("#openSettings")
                await page.click('[data-subs-set="short"]')
                await page.click("#closeSettings")
                async with page.expect_download() as d:
                    await page.click("#dlSrt")
                await (await d.value).save_as("out/short.srt")
                print("SHORT SRT:", open("out/short.srt").read()[:400].replace("\n", " / "), flush=True)
        print("page errors:", errors)
        json.dump(results, open("out/live.json", "w"), indent=1, ensure_ascii=False)
        await browser.close()

asyncio.run(main())
