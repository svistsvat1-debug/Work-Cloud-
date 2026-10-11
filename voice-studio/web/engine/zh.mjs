// Chinese text -> Kokoro v1.1-zh phonemes. A JavaScript port of misaki's ZHG2P(version="1.1")
// (Apache-2.0, adapted from PaddleSpeech). Differences from the original: word segmentation
// comes from the browser (Intl.Segmenter) instead of jieba, there are no part-of-speech tags,
// and pinyin comes from pinyin-pro instead of pypinyin.
import "./pinyin-pro.js";

const { pinyin } = globalThis.pinyinPro;
export const ready = Promise.resolve();

const UNK = "❓";
const PUNC = new Set([..."；：，。！？—…\"()“”", ..."；:,.!?"]);
const FRONT_PUNC = new Set([...';:,.!?—…"()“”']);
const ZH_MAP = { b: "ㄅ", p: "ㄆ", m: "ㄇ", f: "ㄈ", d: "ㄉ", t: "ㄊ", n: "ㄋ", l: "ㄌ", g: "ㄍ", k: "ㄎ", h: "ㄏ", j: "ㄐ", q: "ㄑ", x: "ㄒ",
  zh: "ㄓ", ch: "ㄔ", sh: "ㄕ", r: "ㄖ", z: "ㄗ", c: "ㄘ", s: "ㄙ", a: "ㄚ", o: "ㄛ", e: "ㄜ", ie: "ㄝ", ai: "ㄞ", ei: "ㄟ", ao: "ㄠ",
  ou: "ㄡ", an: "ㄢ", en: "ㄣ", ang: "ㄤ", eng: "ㄥ", er: "ㄦ", i: "ㄧ", u: "ㄨ", v: "ㄩ", ii: "ㄭ", iii: "十", ve: "月", ia: "压",
  ian: "言", iang: "阳", iao: "要", in: "阴", ing: "应", iong: "用", iou: "又", ong: "中", ua: "穵", uai: "外", uan: "万",
  uang: "王", uei: "为", uen: "文", ueng: "瓮", uo: "我", van: "元", vn: "云" };
for (const p of ';:,.!?/—…"()“” 12345R') ZH_MAP[p] = p;

const MUST_ERHUA = new Set(["小院儿", "胡同儿", "范儿", "老汉儿", "撒欢儿", "寻老礼儿", "妥妥儿", "媳妇儿"]);
const NOT_ERHUA = new Set(["虐儿", "为儿", "护儿", "瞒儿", "救儿", "替儿", "有儿", "一儿", "我儿", "俺儿", "妻儿", "拐儿", "聋儿", "乞儿",
  "患儿", "幼儿", "孤儿", "婴儿", "婴幼儿", "连体儿", "脑瘫儿", "流浪儿", "体弱儿", "混血儿", "蜜雪儿", "舫儿", "祖儿", "美儿", "应采儿",
  "可儿", "侄儿", "孙儿", "侄孙儿", "女儿", "男儿", "红孩儿", "花儿", "虫儿", "马儿", "鸟儿", "猪儿", "猫儿", "狗儿", "少儿"]);
const MUST_NEUTRAL = new Set(("麻烦 麻利 鸳鸯 高粱 骨头 骆驼 马虎 首饰 馒头 馄饨 风筝 难为 队伍 阔气 闺女 门道 锄头 铺盖 铃铛 铁匠 钥匙 里脊 " +
  "里头 部分 那么 道士 造化 迷糊 连累 这么 这个 运气 过去 软和 转悠 踏实 跳蚤 跟头 趔趄 财主 豆腐 讲究 记性 记号 认识 规矩 见识 裁缝 " +
  "补丁 衣裳 衣服 衙门 街坊 行李 行当 蛤蟆 蘑菇 薄荷 葫芦 葡萄 萝卜 荸荠 苗条 苗头 苍蝇 芝麻 舒服 舒坦 舌头 自在 膏药 脾气 脑袋 脊梁 " +
  "能耐 胳膊 胭脂 胡萝 胡琴 胡同 聪明 耽误 耽搁 耷拉 耳朵 老爷 老实 老婆 戏弄 将军 翻腾 罗嗦 罐头 编辑 结实 红火 累赘 糨糊 糊涂 精神 " +
  "粮食 簸箕 篱笆 算计 算盘 答应 笤帚 笑语 笑话 窟窿 窝囊 窗户 稳当 稀罕 称呼 秧歌 秀气 秀才 福气 祖宗 砚台 码头 石榴 石头 石匠 知识 " +
  "眼睛 眯缝 眨巴 眉毛 相声 盘算 白净 痢疾 痛快 疟疾 疙瘩 疏忽 畜生 生意 甘蔗 琵琶 琢磨 琉璃 玻璃 玫瑰 玄乎 狐狸 状元 特务 牲口 牙碜 " +
  "牌楼 爽快 爱人 热闹 烧饼 烟筒 烂糊 点心 炊帚 灯笼 火候 漂亮 滑溜 溜达 温和 清楚 消息 浪头 活泼 比方 正经 欺负 模糊 槟榔 棺材 棒槌 " +
  "棉花 核桃 栅栏 柴火 架势 枕头 枇杷 机灵 本事 木头 木匠 朋友 月饼 月亮 暖和 明白 时候 新鲜 故事 收拾 收成 提防 挖苦 挑剔 指甲 指头 " +
  "拾掇 拳头 拨弄 招牌 招呼 抬举 护士 折腾 扫帚 打量 打算 打扮 打听 打发 扎实 扁担 戒指 懒得 意识 意思 悟性 怪物 思量 怎么 念头 念叨 " +
  "别人 快活 忙活 志气 心思 得罪 张罗 弟兄 开通 应酬 庄稼 干事 帮手 帐篷 希罕 师父 师傅 巴结 巴掌 差事 工夫 岁数 屁股 尾巴 少爷 小气 " +
  "小伙 将就 对头 对付 寡妇 家伙 客气 实在 官司 学问 字号 嫁妆 媳妇 媒人 婆家 娘家 委屈 姑娘 姐夫 妯娌 妥当 妖精 奴才 女婿 头发 太阳 " +
  "大爷 大方 大意 大夫 多少 多么 外甥 壮实 地道 地方 在乎 困难 嘴巴 嘱咐 嘟囔 嘀咕 喜欢 喇嘛 喇叭 商量 唾沫 哑巴 哈欠 哆嗦 咳嗽 和尚 " +
  "告诉 告示 含糊 吓唬 后头 名字 名堂 合同 吆喝 叫唤 口袋 厚道 厉害 千斤 包袱 包涵 匀称 勤快 动静 动弹 功夫 力气 前头 刺猬 刺激 别扭 " +
  "利落 利索 利害 分析 出息 凑合 凉快 冷战 冤枉 冒失 养活 关系 先生 兄弟 便宜 使唤 佩服 作坊 体面 位置 似的 伙计 休息 什么 人家 亲戚 " +
  "亲家 交情 云彩 事情 买卖 主意 丫头 丧气 两口 东西 东家 世故 不由 下水 下巴 上头 上司 丈夫 丈人 一辈 那个 菩萨 父亲 母亲 咕噜 邋遢 " +
  "费用 冤家 甜头 介绍 荒唐 大人 泥鳅 幸福 熟悉 计划 扑腾 蜡烛 姥爷 照顾 喉咙 吉他 弄堂 蚂蚱 凤凰 拖沓 寒碜 糟蹋 倒腾 报复 逻辑 盘缠 " +
  "喽啰 牢骚 咖喱 扫把 惦记").split(" "));
const MUST_NOT_NEUTRAL = new Set(("男子 女子 分子 原子 量子 莲子 石子 瓜子 电子 人人 虎虎 幺幺 干嘛 学子 哈哈 数数 袅袅 局地 以下 娃哈哈 " +
  "花花草草 留得 耕地 想想 熙熙 攘攘 卵子 死死 冉冉 恳恳 佼佼 吵吵 打打 考考 整整 莘莘 落地 算子 家家户户 青青").split(" "));
const SANDHI_PUNC = "、：，；。？！“”‘’':,;.?!";
const PHRASES = { 开户行: ["kai1", "hu4", "hang2"], 发卡行: ["fa4", "ka3", "hang2"], 放款行: ["fang4", "kuan3", "hang2"],
  茧行: ["jian3", "hang2"], 行号: ["hang2", "hao4"], 各地: ["ge4", "di4"], 借还款: ["jie4", "huan2", "kuan3"],
  时间为: ["shi2", "jian1", "wei2"], 为准: ["wei2", "zhun3"], 色差: ["se4", "cha1"], 掺和: ["chan1", "huo5"] };
const SINGLE = { 嗲: "dia3", 呗: "bei5", 不: "bu4", 咗: "zuo5", 嘞: "lei5" };

// ---------------------------------------------------------------- numbers (cn2an "an2cn")

const DIGITS = "零一二三四五六七八九";
function digitsZh(s) { return [...s].map((d) => DIGITS[+d]).join(""); }
function section(n) { // 0..9999
  const units = ["", "十", "百", "千"];
  let out = "", zero = false;
  const ds = String(n).padStart(4, "0");
  for (let i = 0; i < 4; i++) {
    const d = +ds[i];
    if (d === 0) { if (out) zero = true; continue; }
    if (zero) { out += "零"; zero = false; }
    out += DIGITS[d] + units[3 - i];
  }
  return out;
}
function intZh(numStr) {
  let n = BigInt(numStr);
  if (n === 0n) return "零";
  const big = ["", "万", "亿", "万亿"];
  const parts = [];
  while (n > 0n) { parts.push(Number(n % 10000n)); n /= 10000n; }
  let out = "";
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (p === 0) { if (out && !out.endsWith("零")) out += "零"; continue; }
    if (out && p < 1000 && !out.endsWith("零")) out += "零";
    out += section(p) + big[i];
  }
  out = out.replace(/零+$/, "");
  return out.startsWith("一十") ? out.slice(1) : out;
}
function numZh(s) {
  const neg = s.startsWith("-"), body = neg ? s.slice(1) : s;
  const [i, f] = body.split(".");
  return (neg ? "负" : "") + intZh(i) + (f ? "点" + digitsZh(f) : "");
}
function an2cn(text) {
  return text
    .replace(/(\d+(?:\.\d+)?)\s?%/g, (_, n) => "百分之" + numZh(n))
    .replace(/(\d{4})(?=年)/g, (_, y) => digitsZh(y))
    .replace(/(\d+)\/(\d+)/g, (_, a, b) => numZh(b) + "分之" + numZh(a))
    .replace(/\d{7,}/g, (d) => digitsZh(d)) // phone numbers and codes are read digit by digit
    .replace(/-?\d+(?:\.\d+)?/g, (n) => numZh(n));
}

function mapPunctuation(text) {
  return text.replace(/、/g, ", ").replace(/，/g, ", ").replace(/。/g, ". ").replace(/．/g, ". ").replace(/！/g, "! ")
    .replace(/：/g, ": ").replace(/；/g, "; ").replace(/？/g, "? ").replace(/«/g, " “").replace(/»/g, "” ")
    .replace(/《/g, " “").replace(/》/g, "” ").replace(/「/g, " “").replace(/」/g, "” ").replace(/【/g, " “")
    .replace(/】/g, "” ").replace(/（/g, " (").replace(/）/g, ") ").trim();
}

// ---------------------------------------------------------------- pinyin

const INITIALS = ["zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h", "j", "q", "x", "r", "z", "c", "s"];
const isHan = (ch) => /\p{Script=Han}/u.test(ch);

// "zhong4" -> ["zh", "ong4"], strict finals like pypinyin: you->iou, wei->uei, ju->jv, gui->guei ...
function splitSyllable(syl) {
  let tone = (syl.match(/\d$/) || ["5"])[0];
  if (tone === "0") tone = "5";
  let s = syl.replace(/\d$/, "").replace(/ü/g, "v");
  if (["ng", "n", "m", "hm", "hng"].includes(s)) return ["", "n" + tone];
  let ini = INITIALS.find((i) => s.startsWith(i)) || "";
  let fin = s.slice(ini.length);
  if (!ini && s.startsWith("y")) {
    const rest = s.slice(1);
    fin = rest.startsWith("u") ? "v" + rest.slice(1) : rest.startsWith("i") ? rest : "i" + rest;
  } else if (!ini && s.startsWith("w")) {
    const rest = s.slice(1);
    fin = rest === "u" ? "u" : "u" + rest;
  } else if ("jqx".includes(ini) && fin.startsWith("u")) {
    fin = "v" + fin.slice(1);
  } else if (ini) {
    if (fin === "iu") fin = "iou";
    else if (fin === "ui") fin = "uei";
    else if (fin === "un") fin = "uen";
  }
  return [ini, fin + tone];
}

function wordPinyin(word) {
  if (PHRASES[word]) return PHRASES[word];
  return pinyin(word, { toneType: "num", type: "array", v: true, toneSandhi: false })
    .map((p, i) => SINGLE[word[i]] && word.length === 1 ? SINGLE[word[i]] : p);
}

function finalsOf(word, py) {
  return [...word].map((ch, i) => (ch === "嗯" ? "n2" : isHan(ch) ? splitSyllable(py[i])[1] : "0"));
}

// ---------------------------------------------------------------- tone sandhi

const setTone = (f, t) => f.slice(0, -1) + t;
const allThree = (finals) => finals.every((x) => x.endsWith("3"));
const isNumeric = (ch) => /\p{N}/u.test(ch) || "零一二三四五六七八九十百千万亿两".includes(ch);

const segmenter = new Intl.Segmenter("zh", { granularity: "word" });
function splitWord(word) {
  const parts = [...segmenter.segment(word)].map((s) => s.segment);
  if (parts.length > 1) return [parts[0], word.slice(parts[0].length)];
  return word.length === 3 ? [word.slice(0, 2), word.slice(2)] : [word, ""];
}

function neutralSandhi(word, pos, finals) {
  if (MUST_NOT_NEUTRAL.has(word)) return finals;
  for (let j = 1; j < word.length; j++) if (word[j] === word[j - 1] && "nva".includes(pos[0])) finals[j] = setTone(finals[j], "5");
  const ge = word.indexOf("个"), last = word[word.length - 1];
  if ("吧呢啊呐噻嘛吖嗨呐哦哒滴哩哟喽啰耶喔诶".includes(last)) finals[finals.length - 1] = setTone(finals[finals.length - 1], "5");
  else if ("的地得".includes(last)) finals[finals.length - 1] = setTone(finals[finals.length - 1], "5");
  else if (word.length === 1 && "了着".includes(word)) finals[0] = setTone(finals[0], "5");
  else if (word.length > 1 && "们子".includes(last) && "rn".includes(pos)) finals[finals.length - 1] = setTone(finals[finals.length - 1], "5");
  else if (word.length > 1 && "来去".includes(last) && "上下进出回过起开".includes(word[word.length - 2])) finals[finals.length - 1] = setTone(finals[finals.length - 1], "5");
  else if ((ge >= 1 && (isNumeric(word[ge - 1]) || "几有两半多各整每做是".includes(word[ge - 1]))) || word === "个") finals[ge] = setTone(finals[ge], "5");
  else if (MUST_NEUTRAL.has(word) || MUST_NEUTRAL.has(word.slice(-2))) finals[finals.length - 1] = setTone(finals[finals.length - 1], "5");
  const [a, b] = splitWord(word);
  const lists = [finals.slice(0, a.length), finals.slice(a.length)];
  [a, b].forEach((w, i) => {
    if (w && lists[i].length && (MUST_NEUTRAL.has(w) || MUST_NEUTRAL.has(w.slice(-2)))) lists[i][lists[i].length - 1] = setTone(lists[i][lists[i].length - 1], "5");
  });
  return [...lists[0], ...lists[1]];
}

function buSandhi(word, finals) {
  if (word.length === 3 && word[1] === "不") finals[1] = setTone(finals[1], "5");
  else for (let i = 0; i < word.length; i++) if (word[i] === "不" && i + 1 < word.length && finals[i + 1].endsWith("4")) finals[i] = setTone(finals[i], "2");
  return finals;
}

function yiSandhi(word, finals) {
  if (word.includes("一") && [...word].every((ch) => ch === "一" || isNumeric(ch))) return finals;
  if (word.length === 3 && word[1] === "一" && word[0] === word[2]) finals[1] = setTone(finals[1], "5");
  else if (word.startsWith("第一")) finals[1] = setTone(finals[1], "1");
  else {
    for (let i = 0; i < word.length; i++) {
      if (word[i] === "一" && i + 1 < word.length) {
        if (/[45]$/.test(finals[i + 1])) finals[i] = setTone(finals[i], "2");
        else if (!SANDHI_PUNC.includes(word[i + 1])) finals[i] = setTone(finals[i], "4");
      }
    }
  }
  return finals;
}

function threeSandhi(word, finals) {
  if (word.length === 2 && allThree(finals)) finals[0] = setTone(finals[0], "2");
  else if (word.length === 3) {
    const [a] = splitWord(word);
    if (allThree(finals)) {
      if (a.length === 2) { finals[0] = setTone(finals[0], "2"); finals[1] = setTone(finals[1], "2"); }
      else if (a.length === 1) finals[1] = setTone(finals[1], "2");
    } else {
      const lists = [finals.slice(0, a.length), finals.slice(a.length)];
      lists.forEach((sub, i) => {
        if (allThree(sub) && sub.length === 2) sub[0] = setTone(sub[0], "2");
        else if (i === 1 && sub.length && !allThree(sub) && sub[0].endsWith("3") && lists[0].length && lists[0][lists[0].length - 1].endsWith("3")) {
          lists[0][lists[0].length - 1] = setTone(lists[0][lists[0].length - 1], "2");
        }
      });
      finals = [...lists[0], ...lists[1]];
    }
  } else if (word.length === 4) {
    const out = [];
    for (const sub of [finals.slice(0, 2), finals.slice(2)]) { if (allThree(sub)) sub[0] = setTone(sub[0], "2"); out.push(...sub); }
    finals = out;
  }
  return finals;
}

// Join words the segmenter split where sandhi needs them together
function preMerge(seg) {
  const X = (pos) => pos === "x";
  let out = [];
  seg.forEach(([w, pos], i) => {
    if (!X(pos) && i > 0 && seg[i - 1][0] === "不") w = "不" + w;
    const nextPos = i + 1 < seg.length ? seg[i + 1][1] : null;
    if (w !== "不" || nextPos === null || X(nextPos)) out.push([w, pos]);
  });
  seg = out; out = [];
  for (let i = 0; i < seg.length; i++) {
    const [w, pos] = seg[i];
    if (i > 0 && w === "一" && i + 1 < seg.length && seg[i - 1][0] === seg[i + 1][0] && seg[i - 1][0].length === 1 && !X(seg[i + 1][1])) {
      out[out.length - 1] = [out[out.length - 1][0] + "一" + seg[i + 1][0], out[out.length - 1][1]];
      i++;
    } else out.push([w, pos]);
  }
  seg = out; out = [];
  for (const [w, pos] of seg) {
    if (out.length && out[out.length - 1][0] === "一" && !X(pos)) out[out.length - 1] = ["一" + w, out[out.length - 1][1]];
    else out.push([w, pos]);
  }
  seg = out; out = [];
  for (const [w, pos] of seg) {
    if (out.length && w === out[out.length - 1][0] && !X(pos)) out[out.length - 1][0] += w;
    else out.push([w, pos]);
  }
  for (const second of [false, true]) {
    seg = out; out = [];
    const finals = seg.map(([w, pos]) => (X(pos) ? ["0"] : finalsOf(w, wordPinyin(w))));
    const merged = seg.map(() => false);
    seg.forEach(([w, pos], i) => {
      const prev = finals[i - 1], cur = finals[i];
      const ok = !X(pos) && i > 0 && !merged[i - 1] && (second
        ? prev[prev.length - 1].endsWith("3") && cur[0].endsWith("3")
        : allThree(prev) && allThree(cur));
      const redup = i > 0 && seg[i - 1][0].length === 2 && seg[i - 1][0][0] === seg[i - 1][0][1];
      if (ok && !redup && seg[i - 1][0].length + w.length <= 3) { out[out.length - 1][0] += w; merged[i] = true; }
      else out.push([w, pos]);
    });
  }
  seg = out; out = [];
  seg.forEach(([w, pos], i) => {
    if (i > 0 && w === "儿" && out.length && !X(out[out.length - 1][1])) out[out.length - 1][0] += w;
    else out.push([w, pos]);
  });
  return out;
}

// ---------------------------------------------------------------- frontend

function mergeErhua(initials, finals, word, pos) {
  for (let i = 0; i < finals.length; i++) if (i === finals.length - 1 && word[i] === "儿" && finals[i] === "er1") finals[i] = "er2";
  if (!MUST_ERHUA.has(word) && (NOT_ERHUA.has(word) || ["a", "j", "nr"].includes(pos))) return [initials, finals];
  if (finals.length !== word.length) return [initials, finals];
  const ni = [], nf = [];
  finals.forEach((f, i) => {
    if (i === finals.length - 1 && word[i] === "儿" && (f === "er2" || f === "er5") && !NOT_ERHUA.has(word.slice(-2)) && nf.length) {
      nf[nf.length - 1] = nf[nf.length - 1].slice(0, -1) + "R" + nf[nf.length - 1].slice(-1);
    } else { ni.push(initials[i]); nf.push(f); }
  });
  return [ni, nf];
}

function frontend(text) {
  let seg = [];
  for (const { segment } of segmenter.segment(text)) {
    const pos = [...segment].some(isHan) ? "n" : "x";
    seg.push([segment, pos]);
  }
  seg = preMerge(seg);
  const tokens = [];
  for (let [word, pos] of seg) {
    if (pos !== "x" && FRONT_PUNC.has(word)) pos = "x";
    if (pos === "x") {
      if (word.trim()) {
        // Runs like ", " can arrive as one segment: keep each punctuation mark, attach spaces
        for (const ch of word) {
          if (/\s/.test(ch)) { if (tokens.length) tokens[tokens.length - 1].ws += ch; continue; }
          tokens.push({ tag: "x", ph: FRONT_PUNC.has(ch) ? ch : null, ws: "" });
        }
      } else if (tokens.length) tokens[tokens.length - 1].ws += word;
      continue;
    }
    if (tokens.length && tokens[tokens.length - 1].tag !== "x" && !tokens[tokens.length - 1].ws) tokens[tokens.length - 1].ws = "/";
    const py = wordPinyin(word);
    let initials = [], finals = [];
    [...word].forEach((ch, i) => {
      let [c, v] = ch === "嗯" ? ["", "n2"] : isHan(ch) ? splitSyllable(py[i]) : ["", ""];
      if (/^i\d$/.test(v)) {
        if (["z", "c", "s"].includes(c)) v = "ii" + v.slice(1);
        else if (["zh", "ch", "sh", "r"].includes(c)) v = "iii" + v.slice(1);
      }
      initials.push(c); finals.push(v);
    });
    finals = threeSandhi(word, neutralSandhi(word, pos, yiSandhi(word, buSandhi(word, finals))));
    [initials, finals] = mergeErhua(initials, finals, word, pos);
    const phones = [];
    initials.forEach((c, i) => { const v = finals[i]; if (c) phones.push(c); if (v && (!PUNC.has(v) || v !== c)) phones.push(v); });
    const joined = phones.join("_").replaceAll("_eR", "_er").replaceAll("R", "_R").replace(/(?=\d)/g, "_");
    tokens.push({ tag: pos, ph: joined.split("_").filter(Boolean).map((p) => ZH_MAP[p] ?? UNK).join(""), ws: "" });
  }
  return tokens.map((t) => (t.ph ?? UNK) + t.ws).join("");
}

// Chinese with English words mixed in: English goes to `english` (espeak), the rest to the frontend
export async function phonemize(text, english) {
  if (!text.trim()) return "";
  text = mapPunctuation(an2cn(text));
  const out = [];
  for (const m of text.matchAll(/([A-Za-z '-]*[A-Za-z][A-Za-z '-]*)|([^A-Za-z]+)/g)) {
    const en = (m[1] || "").trim(), zh = (m[2] || "").trim();
    if (zh) out.push(frontend(zh));
    else if (en) out.push(await english(en));
  }
  return out.join(" ");
}

export const _test = { an2cn, frontend, splitSyllable };
