import asyncio, ssl, sys, json
import edge_tts, edge_tts.communicate as c
c._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
async def main(voice, text, out, rate="+0%"):
    comm = edge_tts.Communicate(text, voice, rate=rate, boundary="SentenceBoundary")
    subs=[]
    with open(out,"wb") as f:
        async for ch in comm.stream():
            if ch["type"]=="audio": f.write(ch["data"])
            elif ch["type"] in("WordBoundary","SentenceBoundary"): subs.append({"o":ch["offset"]/1e7,"d":ch["duration"]/1e7,"t":ch["text"]})
    json.dump(subs, open(out+".json","w"), ensure_ascii=False)
asyncio.run(main(*sys.argv[1:]))
