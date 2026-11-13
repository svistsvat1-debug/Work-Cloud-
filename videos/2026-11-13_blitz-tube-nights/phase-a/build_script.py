# Builds script_voice.txt + script_scenes.md from one source of truth.
import re, sys, os
OUT = sys.argv[1]
WPM = 155.0
PAUSE = 0.35  # s between sentences

# (block, title, mood, [beats]) ; beat = (vo, visual, sfx or None)
S = []
def sc(block, title, mood, *beats): S.append((block, title, mood, beats))

# ---------------- HOOK ----------------
sc("HOOK", "Intro card", "tension",
 ("September, nineteen forty. German bombers come back to London every single night.",
  "INTRO CARD: stacked text '57 NIGHTS' (red, biggest, yellow rays near it) / 'UNDER' (black) / 'LONDON' (blue, red double underline) on the left; hero object on the right half: cross-section — a street of terraced houses on top, bombers above with orange/red action rays, a deep tunnel with a platform far below",
  "distant artillery (lib), very low"),
 ("And every evening, thousands of families walk down into the Tube, carrying blankets, bread and their children.",
  "INTRO CARD holds; tiny family figures (outline -> khaki/blue scribble fill) appear walking down the stairs inside the cross-section",
  None),
 ("The government had banned it. So how do you eat, sleep and survive under a burning city for fifty-seven nights?",
  "INTRO CARD holds; red stamp 'BANNED' writes on over the stairs; three icons pop in a row under the title: bun, bunk, helmet",
  "pop (lib)"),
)

# ---------------- QUEST 1: getting in ----------------
sc("QUEST 1", "A Shelter Nobody Was Allowed to Use", "neutral",
 ("In nineteen forty, London already had the perfect bomb shelter: miles of deep railway tunnels under its streets.",
  "title 'The Perfect Shelter' writes on top-left, red underline per word",
  "marker squeak short (lib)"),
 ("Some platforms sat more than twenty metres below the pavement.",
  "main: cross-section REVEALS center — street line on top, soil (khaki scribble), round tunnel with platform deep below | label '<- 20+ m deep' in red",
  None),
)
sc("QUEST 1", "The ban", "tension",
 ("But the government said no.",
  "title 'The Ban' writes on top-left",
  None),
 ("The Tube had to keep moving workers, soldiers and supplies, so the platforms had to stay clear.",
  "main: tube train REVEALS center (outline -> red body scribble, grey windows), small worker + soldier figures with crates beside it",
  None),
 ("Officials also feared that frightened people would go down and simply never come back up.",
  "helper right: small figure sitting on a platform bench with a question mark | yellow rays | label '\"deep shelter mentality\"' in red",
  None),
)
sc("QUEST 1", "The ticket trick", "tension",
 ("So Londoners found a loophole, and it cost them one and a half pence.",
  "title 'The Loophole' writes on top-left",
  None),
 ("They bought the cheapest ticket, walked down to the platform, and refused to leave.",
  "main: a big paper ticket REVEALS center (outline -> khaki fill) with '1½d' written in red | label '<- cheapest ticket'",
  "marker squeak short (lib)"),
 ("Station staff could not throw out thousands of paying passengers, night after night.",
  "helper right: one small station guard figure facing a long crowd row of tiny figures (simple heads), yellow rays",
  None),
)
sc("QUEST 1", "Liverpool Street", "tension",
 ("In the first nights of the Blitz, crowds at Liverpool Street station pushed in as soon as the sirens started.",
  "title 'Liverpool Street' writes on top-left; main: station entrance REVEALS center, a wave of small figures drawn flowing in | helper right: siren icon with yellow rays",
  "radio static (lib), very low"),
 ("The rule from the top said no shelterers. The crowd on the stairs said otherwise.",
  "label: red crossed-out sign 'NO SHELTERING' near the entrance | red arrows of the crowd continue down",
  None),
)
sc("QUEST 1", "Government gives in", "neutral",
 ("Within weeks, the government gave in, and the stations were officially opened as shelters.",
  "title 'They Gave In' writes on top-left; main: station gate REVEALS center, gate doors drawn open | big red check mark",
  None),
)
sc("QUEST 1", "NUMBER CARD 177,000", "reveal",
 ("On the night of September twenty-seventh, one hundred seventy-seven thousand people slept underground.",
  "NUMBER CARD: yellow dashes -> '177,000' red digits -> 'people' blue -> red underline -> caption 'one night: 27 Sept 1940'",
  "pop (lib)"),
 ("But now the Tube had a strange new problem: where do you put a small city every night?",
  "number card holds; small black caption under it writes on: 'Where do they all sleep?'",
  None),
)

# ---------------- QUEST 2: sleeping ----------------
sc("QUEST 2", "The painted lines", "neutral",
 ("The first answer was paint.",
  "title 'The Painted Lines' writes on top-left",
  "marker squeak short (lib)"),
 ("Staff painted white lines along the platforms, because the trains were still running.",
  "main: platform seen from the side REVEALS center — platform slab (grey scribble), rail on the right, two dashed lines drawn on the slab",
  None),
 ("Until half past seven in the evening, shelterers had to stay eight feet back from the edge.",
  "label: red arrow to the far line '8 ft until 7:30 pm'; tiny sleeping figures appear behind it",
  None),
)
sc("QUEST 2", "Four feet", "tension",
 ("After eight o'clock, they could move up to just four feet from the trains.",
  "same platform layout redrawn fresh (new scene): sleeping figures now up to the near line | label '4 ft after 8 pm' in red",
  None),
 ("Around half past ten, the last trains stopped, the lights were dimmed, and the power in the rails was cut.",
  "helper right: clock REVEALS (outline -> cream face), hands at 10:30, small lightning bolt crossed out in red",
  "clock tick (lib), soft"),
)
sc("QUEST 2", "Sleeping everywhere", "neutral",
 ("Then people slept wherever they could: on platforms, on stairs, in passages, even on escalators that had stopped.",
  "title 'Every Inch' writes on top-left; main: escalator REVEALS center (diagonal, steel-grey fill) with small sleeping figures in blankets on the steps",
  None),
 ("Nobody had pillows. Most people had a coat, a blanket and the cold concrete.",
  "label: red arrow to one figure '<- coat + blanket'; helper right: a folded blanket icon with yellow rays",
  None),
)
sc("QUEST 2", "The queue", "tension",
 ("The best spots went fast. Some families queued from ten in the morning to claim a patch of floor.",
  "title 'The Queue' writes on top-left; main: long line of small figures with bundles REVEALS left->right toward a station entrance | helper right: clock showing 10:00",
  None),
)
sc("QUEST 2", "Black market", "tension",
 ("Soon, a black market appeared: a good place on a platform could be sold for two shillings and sixpence.",
  "title 'Black Market' writes on top-left; main: hand-drawn coin pile REVEALS center (gold scribble) | label '2s 6d' in red pointing at a small rectangle of platform floor",
  "pop (lib)"),
)
sc("QUEST 2", "Shelter tickets", "neutral",
 ("So the authorities brought in a new kind of ticket: not for travel, but for sleeping.",
  "title 'A Ticket to Sleep' writes on top-left; main: shelter ticket REVEALS center (cream card, red border) with 'SHELTER' and 'PLACE No. ___'",
  None),
 ("Regular families got a reserved place. About one spot in ten stayed free for strangers caught in a raid.",
  "label: red arrow '<- reserved' to the ticket; helper right: 10 tiny squares, 9 filled blue, 1 empty with red outline | yellow rays",
  None),
)
sc("QUEST 2", "Aldwych", "neutral",
 ("One short branch line, to Aldwych, was closed to trains completely and handed over to shelterers.",
  "title 'A Line Without Trains' writes on top-left; main: short tunnel stub REVEALS center with a red 'X' over a train icon | label '<- Aldwych branch' in red",
  None),
 ("People could now sleep on the tracks themselves, because no train would ever come.",
  "small sleeping figures appear along the rails inside the tunnel | helper right: crossed-out lightning bolt",
  None),
)
sc("QUEST 2", "Bunks", "neutral",
 ("Then came the bunks: twenty-four thousand of them, fixed along platform walls and tunnels.",
  "title 'Bunks' writes on top-left; main: three-tier steel bunk REVEALS center (grey frame, khaki blankets scribble), a sleeping figure on each level",
  "marker squeak long (lib)"),
)
sc("QUEST 2", "NUMBER CARD 27 miles", "reveal",
 ("Laid end to end, those bunks would have stretched for twenty-seven miles.",
  "NUMBER CARD: dashes -> '27' red -> 'miles' blue -> underline -> caption '24,000 bunks, end to end'",
  "pop (lib)"),
 ("So sleep was solved, more or less. But more than a hundred thousand tired people still needed to eat.",
  "card holds; caption below writes on 'But what about dinner?'",
  None),
)

# ---------------- QUEST 3: food ----------------
sc("QUEST 3", "Bring your own", "neutral",
 ("At first, families brought their own food: sandwiches, cold tea in a flask, maybe a slice of cake.",
  "title 'Bring Your Own' writes on top-left; main: open bag REVEALS center with sandwich, flask, cake slice drawn one by one",
  None),
 ("And Britain was already on rationing, so every slice of bacon and every spoon of sugar was counted.",
  "helper right: ration book REVEALS (buff cover, black text 'RATION BOOK') with yellow rays | label 'bacon, butter, sugar' in red",
  None),
)
sc("QUEST 3", "Refreshment trains", "neutral",
 ("So London Transport turned its own trains into delivery vans.",
  "title 'Food by Train' writes on top-left; main: tube train REVEALS center, open doors with crates and a big tea urn inside",
  "marker squeak short (lib)"),
 ("They were called Tube Refreshment Specials, and they left their depots every afternoon.",
  "label: red banner on the train 'TUBE REFRESHMENTS SPECIAL' writes on | helper right: clock 6:00 with yellow rays",
  None),
)
sc("QUEST 3", "NUMBER CARD 7 tons", "reveal",
 ("By December nineteen forty, one report said these trains carried seven tons of food every night.",
  "NUMBER CARD: dashes -> '7' red -> 'tons of food' blue -> underline -> caption 'every night, Dec 1940'",
  "pop (lib)"),
 ("That meant around thirty thousand buns, plus endless cups of tea and cocoa.",
  "card holds; under it a row of 5 bun icons + 1 mug icon pop in left->right",
  None),
)
sc("QUEST 3", "Half a million gallons", "neutral",
 ("By the end of the war, London Transport had served over half a million gallons of tea.",
  "title 'Tea, Tea, Tea' writes on top-left; main: giant tea urn REVEALS center (steel grey, steam lines) | label '545,000+ gallons' in red",
  None),
)
sc("QUEST 3", "Canteen points", "neutral",
 ("Staff and volunteers served it from more than a hundred and thirty canteen points on the platforms.",
  "title 'Platform Canteens' writes on top-left; main: canteen counter REVEALS center (wood brown fill), urn on top, a server figure behind it, two figures with mugs in front",
  None),
 ("But food goes in, and it has to come out. And that was the problem nobody had planned for.",
  "helper right: big question mark with yellow rays | small caption 'and then...?' in red",
  None),
)

# ---------------- QUEST 4: toilets & health ----------------
sc("QUEST 4", "No toilets", "tension",
 ("Tube stations were built for passengers who stayed a few minutes, not for families who stayed all night.",
  "title 'Built for Minutes' writes on top-left; main: big clock REVEALS center, a red arc marking only '5 min' of the face",
  None),
)
sc("QUEST 4", "Holborn", "tension",
 ("At Holborn, a station that could hold four thousand six hundred people, there were four chemical toilets.",
  "title 'Holborn' writes on top-left; main: crowd block '4,600' drawn as a grid of tiny heads (fills left->right) | label red arrow '<- 4,600 people'",
  None),
 ("And four buckets.",
  "helper right: 4 toilet icons + 4 bucket icons pop in, steel grey | yellow rays",
  "pop (lib)"),
)
sc("QUEST 4", "Air and disease", "tension",
 ("The air grew hot, heavy and smelly, and doctors feared that one sick person could infect a whole platform.",
  "title 'The Air' writes on top-left; main: tunnel arch REVEALS center, wavy green smell lines rising | helper right: thermometer with red fill rising",
  None),
 ("Lice spread from blanket to blanket.",
  "label: red arrow at a blanket '<- lice' (tiny dots, no gore)",
  None),
)
sc("QUEST 4", "Mosquitoes", "neutral",
 ("And in the warm tunnels, shelterers complained about another enemy: mosquitoes.",
  "title 'Another Enemy' writes on top-left; main: cartoon mosquito REVEALS center (grey body, clear wings), size of a hand",
  "soft whoosh (lib)"),
 ("By early nineteen forty-one, staff were spraying stations, careful to stop while people slept.",
  "helper right: hand pump sprayer REVEALS (steel grey), mist dots | label 'Feb 1941' in red",
  None),
)
sc("QUEST 4", "Improvements", "neutral",
 ("Slowly, things got better, with proper toilets, first aid posts and nurses on duty at the big shelters.",
  "title 'Slowly Better' writes on top-left; main: first aid post REVEALS center (white box, red cross symbol, a nurse figure) | helper right: chemical toilet icon",
  None),
 ("But if the Tube was crowded, dirty and smelly, why did families keep coming back, night after night?",
  "question mark writes on at right, red | yellow rays",
  None),
)

# ---------------- QUEST 5: life underground ----------------
sc("QUEST 5", "The quiet", "calm",
 ("Because down there, it was quieter. The bombs above sounded like distant thuds instead of screaming whistles.",
  "title 'Down Here, Quiet' writes on top-left; main: cross-section REVEALS — bombs/explosion puffs on the street line top, deep platform with sleeping figures; small 'thud' text in grey near the tunnel",
  "distant artillery (lib), low"),
)
sc("QUEST 5", "Children", "calm",
 ("At the peak, around twenty-five thousand children spent the night in the stations.",
  "title 'The Children' writes on top-left; main: two child figures on a blanket REVEAL center, one reading a book | label '~25,000 a night' in red",
  None),
 ("They played, did their homework, and slept between strangers who soon became neighbours.",
  "helper right: small open exercise book + pencil with yellow rays",
  None),
)
sc("QUEST 5", "A town underground", "calm",
 ("Some shelters got lending libraries, concerts, film shows and even evening lectures.",
  "title 'A Town Underground' writes on top-left; main: platform REVEALS with three small icons along it: bookshelf, gramophone, film projector",
  None),
 ("For many families, the platform stopped being a shelter and became a kind of home.",
  "helper right: small house icon drawn under the tunnel arch | yellow rays",
  None),
)
sc("QUEST 5", "A typical evening", "calm",
 ("Picture a typical evening for a mother in the East End of London.",
  "title 'Every Evening' writes on top-left; main: mother figure REVEALS center (blue coat, headscarf), holding a child's hand",
  None),
 ("She finishes work, collects the children, grabs the blankets and the shelter ticket, and walks to the station.",
  "label: four small icons appear along a red dotted path: factory, school, blanket, ticket | helper right: station entrance with yellow rays",
  None),
 ("In the morning, she climbs back up to see if her house is still standing.",
  "small house outline at top-right with a red question mark (4th element)",
  None),
)
sc("QUEST 5", "63 million", "reveal",
 ("Over the whole war, London Transport counted about sixty-three million visits by shelterers.",
  "NUMBER CARD: dashes -> '63' red -> 'million' blue -> underline -> caption 'shelter visits, 1940–1945'",
  "pop (lib)"),
)
sc("QUEST 5", "Feeling safe", "tension",
 ("Underground, people felt safe. But they were about to learn that the Tube was not bombproof.",
  "title 'Safe?' writes on top-left, the '?' in red; main: a single platform sign REVEALS center, then a crack line draws across the ceiling above it",
  "tension riser (lib), short"),
)

# ---------------- QUEST 6: the Tube is hit ----------------
sc("QUEST 6", "First hits", "tension",
 ("The first warning came in September, when a bomb hit the subway at Marble Arch and killed twenty people.",
  "title 'Not Bombproof' writes on top-left; main: subway passage cross-section REVEALS, cartoon puff above | label '20' in red",
  None),
 ("In October, Trafalgar Square and Bounds Green were hit too.",
  "helper right: small map pins (red) labelled 'Trafalgar Sq.' and 'Bounds Green'",
  None),
)
sc("QUEST 6", "Balham", "tension",
 ("On October fourteenth, nineteen forty, a heavy bomb hit the road above Balham station.",
  "title 'Balham, 14 Oct 1940' writes on top-left; main: street cross-section REVEALS, cartoon explosion puff (orange/yellow, no gore) on the road",
  "single impact/boom (lib), low"),
 ("The crater was so big that a double-decker bus drove straight into it.",
  "main: red double-decker bus REVEALS tilted nose-down into a crater | label '<- crater' in red",
  None),
)
sc("QUEST 6", "The flood", "tension",
 ("Water mains and sewers burst, and the tunnel below began to fill with water and gravel.",
  "title 'The Flood' writes on top-left; main: tunnel cross-section REVEALS, blue water scribble fills bottom->top to one third",
  None),
 ("Sixty-eight people died that night, most of them shelterers, four of them railway staff.",
  "helper right: number '68' in red with a small simple memorial wreath outline | no figures",
  None),
)
sc("QUEST 6", "Bank", "tension",
 ("Three months later, a bomb fell through the road onto the booking hall at Bank station.",
  "title 'Bank, Jan 1941' writes on top-left; main: station booking hall cross-section REVEALS, cartoon puff on top",
  None),
 ("More than fifty people were killed, and the crater was so large the army built a bridge across it.",
  "label: red '50+' near hall | helper right: small army bridge (steel grey truss) REVEALS over a gap, yellow rays",
  None),
)
sc("QUEST 6", "Deep shelters", "neutral",
 ("So the government finally ordered new, deeper shelters, dug far below the existing Tube lines.",
  "title 'Go Deeper' writes on top-left; main: cross-section REVEALS — old tunnel high, a new larger double tunnel much deeper | red arrow down",
  None),
 ("Eight of them were finished. But they were not ready until the worst of the Blitz was over.",
  "label: '8 built' in red | helper right: calendar REVEALS showing '1942' with yellow rays",
  None),
)
sc("QUEST 6", "Paint and luck", "tension",
 ("So for those fifty-seven nights, Londoners trusted old railway tunnels, painted lines, and luck.",
  "title 'Paint + Luck' writes on top-left; main: three icons in a row: tunnel arch, painted line, four-leaf clover",
  None),
 ("Which leaves the real question: how much did the Tube actually save London?",
  "big red question mark writes on right | yellow rays",
  None),
)

# ---------------- FINAL BOSS ----------------
sc("FINAL BOSS", "The count", "reveal",
 ("In November nineteen forty, officials counted where Londoners were really spending their nights.",
  "title 'The Night Count' writes on top-left; main: clipboard REVEALS center with tally marks being drawn",
  "marker squeak short (lib)"),
)
sc("FINAL BOSS", "NUMBER CARD 4%", "reveal",
 ("The result surprised them. Only about four percent were sheltering in the Tube.",
  "NUMBER CARD: dashes -> '4' red -> '%' blue -> underline -> caption 'in the Tube (Nov 1940 count)'",
  "pop (lib)"),
)
sc("FINAL BOSS", "Where everyone else was", "reveal",
 ("Nine percent used big public shelters, and twenty-seven percent slept in small shelters at home.",
  "title 'Everyone Else' writes on top-left; main: bar strip REVEALS left->right: 4% blue (Tube), 9% olive (public), 27% orange (home shelters) segments, labels in red",
  None),
 ("The rest, more than half of London, simply stayed in their own houses and hoped.",
  "the strip completes with a big grey segment '~60% at home' | helper right: house icon with yellow rays",
  None),
)
sc("FINAL BOSS", "The real answer", "reveal",
 ("So the Tube did not save London by being big. It saved the people inside it by being organised.",
  "title 'The Real Answer' writes on top-left; main: four icons pop in a 2x2 grid center: ticket, painted line, train with urn, guard figure",
  None),
 ("Tickets, painted lines, food trains, and staff who kept a hundred thousand strangers calm.",
  "each icon gets a red check mark in turn",
  None),
)
sc("FINAL BOSS", "Bethnal Green", "tension",
 ("The proof came in March nineteen forty-three, at Bethnal Green station.",
  "title 'Bethnal Green, 1943' writes on top-left; main: a dark stairwell REVEALS center (19 steps, steel grey), one dim lamp",
  None),
 ("During an alert, a new anti-aircraft rocket battery nearby fired, with a sound few people recognised.",
  "helper right: rocket launcher silhouette with yellow rays, small sound waves | label 'new, unfamiliar noise' in red",
  None),
)
sc("FINAL BOSS", "The crush", "tension",
 ("Crowds hurried down the dark stairs, and a woman near the bottom fell.",
  "same stairwell, red arrows pour down the steps from the top; one small red x near the bottom step",
  None),
 ("In seconds, people piled on top of each other. One hundred seventy-three died, and no bomb ever hit the station.",
  "number '173' in red writes on top-center with a simple memorial wreath outline; caption 'no bomb fell on the station' in black",
  None),
)
sc("FINAL BOSS", "The lesson", "reveal",
 ("That was the real lesson of the Tube. Underground, the biggest danger was not the bombs. It was panic.",
  "title 'The Lesson' writes on top-left; main: word 'PANIC' writes big center in red, crossed bomb icon small at right",
  None),
)
sc("FINAL BOSS", "The last night", "calm",
 ("The government kept the Bethnal Green report quiet until the war was nearly over.",
  "title 'Kept Quiet' writes on top-left; main: folder REVEALS center with red 'SECRET' stamp",
  None),
 ("And on the sixth of May, nineteen forty-five, the last three hundred forty-four shelterers climbed back up into the daylight.",
  "helper right: sun with yellow rays over a station entrance | label '344, 6 May 1945' in red",
  None),
)
sc("FINAL BOSS", "Answer", "calm",
 ("So how did Londoners eat, sleep and survive fifty-seven nights underground?",
  "title 'How They Survived' writes on top-left",
  None),
 ("With a cheap ticket, a painted line and tea from a train. And above all, by staying calm in a crowd.",
  "main: four objects REVEAL in a row: ticket '1½d', painted line, mug of tea, linked hands icon | red underline under the row",
  None),
)

# ---------------- OUTRO ----------------
sc("OUTRO", "Next episode", "calm",
 ("But what about the people who never went underground? Next, we open the tin shelter in the back garden that millions trusted with their lives.",
  "main: small garden shelter REVEALS center (corrugated arch, steel grey, soil on top, green grass) | label 'NEXT' in red with arrow",
  None),
 ("Subscribe so you don't miss it.",
  "small caption 'Subscribe' writes on under it, red underline",
  None),
)

# ---------------- render ----------------
def words(s): return len(re.findall(r"[A-Za-z0-9'’\-]+", s))
t = 0.0
def fmt(x): return f"{int(x//60)}:{int(x%60):02d}"
md = ["# script_scenes.md — How Londoners Ate, Slept & Survived 57 Nights Underground", "",
      "Timings are estimates (155 wpm + 0.35 s per sentence). Real timings come from your am_puck voice file in Phase B.",
      "Grammar: 1 sentence = 1 visual beat; a scene = 1–3 sentences; elements accumulate; HARD CUT to an empty board between scenes.",
      "Static camera, flat #FAF8F3 board, no hand sprite. [VERIFY Vx] = see verify.md.", ""]
voice = []
total_w = 0; nsc = 0
for i, (block, title, mood, beats) in enumerate(S, 1):
    start = t
    for vo, vis, sfx in beats:
        w = words(vo); total_w += w; t += w / WPM * 60 + PAUSE
    md.append(f"[SCENE {i:02d} | {block} | {title} | ~{fmt(start)}–{fmt(t)} | MUSIC MOOD: {mood}]")
    for j, (vo, vis, sfx) in enumerate(beats, 1):
        md.append(f"B{j} VO: \"{vo}\"")
        md.append(f"   VISUAL: {vis}")
        md.append(f"   SFX: {sfx or 'none'}")
    md.append("-> HARD CUT"); md.append("")
    voice.append(" ".join(b[0] for b in beats))
    nsc += 1
md.append(f"Total: {nsc} scenes, {sum(len(s[3]) for s in S)} beats, {total_w} words, estimated {fmt(t)}.")
open(os.path.join(OUT, "script_scenes.md"), "w").write("\n".join(md) + "\n")
open(os.path.join(OUT, "script_voice.txt"), "w").write("\n\n".join(voice) + "\n")
print(nsc, "scenes", sum(len(s[3]) for s in S), "beats", total_w, "words", fmt(t))
