"""End-to-end check of the deployed site: signs in, runs the connection check, voices a text in every language
through the real page (its text preparation, chunking and checks), downloads the MP3s for evaluate.py."""
import asyncio
import json
import os
import time

from playwright.async_api import async_playwright

SITE = "https://voice-studio-app.svistsvat1.workers.dev/"
texts = json.load(open("texts.json"))
CASES = [("en", "am_michael", "hard_en"), ("de", "de_josef", "hard_de"), ("es", "es_rafael", "hard_es"),
         ("fr", "fr_lucian", "hard_fr"), ("es", "es_diego", "short2_es"), ("fr", "fr_alain", "short2_fr")]


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
            await page.select_option("#lang", lang)
            await page.select_option("#voice", voice)
            await page.fill("#text", texts[key])
            spoken = await page.evaluate("([t, l]) => buildScript(t, {}, 0.8, l, CHUNK_CHARS[voiceOf(document.getElementById('voice').value)[4]]).map((i) => i.spoken).join(' ')", [texts[key], lang])
            takes.clear()
            t = time.time()
            await page.click("#go")
            await page.wait_for_selector("#result:not([hidden])", timeout=300000)
            await page.wait_for_function("document.getElementById('dlWav').textContent === 'Скачати аудіо'", timeout=300000)
            async with page.expect_download() as d:
                await page.click("#dlWav")
            path = f"out/audio/live-{lang}-{voice}.mp3"
            await (await d.value).save_as(path)
            rec = {"id": f"live-{lang}-{voice}", "lang": lang, "model": "site", "chars": len(spoken), "text": spoken, "ok": True,
                   "file": path, "seconds": round(time.time() - t, 2), "takes": list(takes), "result": await page.text_content("#resultText")}
            print("LIVE:", json.dumps({k: rec[k] for k in ("id", "seconds", "takes", "result")}, ensure_ascii=False), "| spoken:", spoken, flush=True)
            results.append(rec)
        print("page errors:", errors)
        json.dump(results, open("out/live.json", "w"), indent=1, ensure_ascii=False)
        await browser.close()

asyncio.run(main())
