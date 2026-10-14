/* Walking-in-the-heat route-choice survey (1011v1).
 * Content (images, maps, route metrics) comes from content.json, built by build_content.py.
 * Every item is required. Route sides (A/B) and situation order are randomised per respondent;
 * the true labels (shortest / coolest) are stored alongside each answer.
 * Progress is kept in localStorage so a reload resumes where the respondent left off. */
(() => {
  'use strict';
  const VERSION = '1014v41';
  const STORE = 'shadewalk_survey_' + VERSION;
  const DONE = 'shadewalk_survey_done';       // 本设备已完成标记:不随版本号变化,问卷更新后也不能重复作答
  const REVIEW = 'shadewalk_survey_review';   // 提交后的只读答案快照(同样不随版本号变化)
  const CFG = window.SURVEY_CONFIG || {};                 // config.js:提交地址(Google Apps Script Web App)与联系方式
  const API = CFG.submitUrl || '';
  const CONTACT = CFG.contact || { en: '', zh: '' };   // optional researcher contact / ethics line shown on the intro screen

  const I18N = {
    brand: { en: 'Walking in the shade', zh: '炎热天气下的步行' },
    next: { en: 'Next', zh: '下一题' },
    start: { en: 'Start', zh: '开始' },
    submit: { en: 'Submit', zh: '提交' },
    needAll: { en: 'Please answer every item to continue.', zh: '请回答本页所有题目后继续。' },
    back: { en: 'Back', zh: '上一题' },
    lockedNote: { en: 'Your answer to the previous question is saved and can no longer be changed.', zh: '上一题的答案已保存，不能再修改。' },
    step: { en: (a, b) => `${a} / ${b}`, zh: (a, b) => `${a} / ${b}` },
    tapZoom: { en: 'Tap to enlarge', zh: '点击放大' },
    chooseRoute: { en: (x) => `Choose route ${x}`, zh: (x) => `选择路线 ${x}` },
    chosen: { en: (x) => `Route ${x} chosen ✓`, zh: (x) => `已选路线 ${x} ✓` },
    route: { en: (x) => `Route ${x}`, zh: (x) => `路线 ${x}` },
    start_: { en: 'Start', zh: '起点' },
    dest: { en: 'Destination', zh: '目的地' },

    introTitle: { en: 'Walking in the shade: how do you choose your route?', zh: '炎热天气下的步行：你会怎么选路？' },
    introLead: {
      en: 'We are researchers studying how people in Singapore walk on hot days, and how shade facilities (arcades / five-foot ways, covered linkways, covered overhead bridges and inter-building corridors) and trees affect which way they go.',
      zh: '我们正在研究新加坡居民在炎热天气中的步行方式，以及骑楼（五脚基）、有顶连廊、有顶人行天桥、楼间连廊等遮荫设施和行道树如何影响人们的路线选择。' },
    introList: {
      en: ['About 5 minutes, 8 questions', 'Anonymous: we do not collect your name, contact details or location with your answers', 'At the end you may leave a PayNow mobile number to receive SGD 5 (optional; stored separately from your answers)', 'Participation is voluntary. You may stop at any time by closing this page; unfinished answers are not submitted.', 'Every question needs an answer; you can go back to change earlier answers'],
      zh: ['约 5 分钟，共 8 题', '匿名作答：答案中不收集姓名、联系方式或位置', '答完后可选填 PayNow 手机号领取 5 新币报酬（号码与答案分开保存）', '参与完全自愿，你可以随时关闭页面退出，未完成的答案不会提交。', '每题必答；可以返回上一题修改答案'] },
    consent: { en: 'You must be 21 years or older to take part. By tapping Start, you confirm that you are 21 or older and agree that your anonymous answers may be used for academic research.', zh: '参与者须年满 21 岁。点击「开始」即表示你确认已年满 21 岁，并同意我们将你的匿名答案用于学术研究。' },
    resumed: { en: 'Welcome back — continuing where you left off.', zh: '欢迎回来，已从上次中断处继续。' },

    part1: { en: 'Part 1 · About you and shade facilities', zh: '第一部分 · 个人信息与遮荫设施' },
    q0Title: { en: 'About you', zh: '关于你' },
    gender: { en: 'Gender', zh: '性别' },
    genderOpts: { en: ['Male', 'Female', 'Prefer not to say'], zh: ['男', '女', '不愿透露'] },
    age: { en: 'Age', zh: '年龄' },
    ageOpts: { en: ['21–24', '25–34', '35–44', '45–54', '55–64', '65+'], zh: ['21–24', '25–34', '35–44', '45–54', '55–64', '65 岁及以上'] },
    resident: { en: 'Do you currently live in Singapore?', zh: '你目前是否居住在新加坡？' },
    residentOpts: { en: ['Yes', 'No'], zh: ['是', '否'] },
    residentShort: { en: 'Lives in Singapore: ', zh: '居住在新加坡：' },

    q1Title: { en: 'On your usual commute, how often do you come across or use shade facilities like these?', zh: '你平时通勤出行时，大约多频繁会经过或使用这类遮荫设施？' },
    q1Lead: { en: 'Shade facilities: the four types shown below. Tap a photo to enlarge.', zh: '遮荫设施（shade facility）指下面四类。点击照片可放大。' },
    q1Opts: { en: ['On every trip', 'On more than half of my trips', 'On less than half of my trips', 'Almost never'], zh: ['每次出行都会遇到', '一半以上的出行会遇到', '不到一半的出行会遇到', '几乎遇不到'] },

    q2Title: { en: 'When you walk, especially in the hottest hours, do you notice shade facilities like these?', zh: '步行时（尤其在最热的时段），你会注意到这些遮荫设施吗？' },
    q2Opts: { en: ['Yes — I actively look for them', 'Yes — I notice them, but don’t look for them', 'No — I rarely notice them'], zh: ['会——我会主动寻找它们', '会注意到，但不会刻意寻找', '基本不会注意到'] },

    q3Title: { en: 'Are shade facilities like these important for keeping you out of the sun?', zh: '你觉得这些遮荫设施对遮挡阳光重要吗？' },
    q3Opts: { en: ['Important — under them I’m out of the sun', 'Not important — I still get sun'], zh: ['重要——在它们下面不晒', '不重要——在它们下面还是晒'] },

    q4Title: { en: 'Do you ever deliberately take a longer way to avoid the sun?', zh: '你平时会为了避晒而主动绕路吗？' },
    q4Opts: { en: ['Yes', 'No'], zh: ['会', '不会'] },

    part2: { en: 'Part 2 · Choosing a route', zh: '第二部分 · 选择路线' },
    q5Title: { en: 'Based on these descriptions, which route would you take?', zh: '根据以下描述，你会选择哪条路线？' },
    q5Scene: { en: '<b>About 2 pm on a sunny day, with strong sunshine.</b> You are walking to your destination. Two routes lead there:', zh: '<b>晴天，阳光强烈，下午 2 点左右。</b>你正步行前往目的地，有两条路线可以到达：' },
    q5Short: {
      en: 'The most direct way. Most of it runs along an open footpath beside the main road, with only a short covered stretch.',
      zh: '最直接的路线。大部分路段沿着大马路旁的露天人行道走，只有很短一段有遮盖。' },
    q5Cool: {
      en: 'A slightly longer way. Most of it runs under the shophouse five-foot ways (arcades) and a covered linkway.',
      zh: '稍微绕一点的路线。大部分路段走在店屋的五脚基（骑楼）和有顶连廊下面。' },

    q6Title: { en: 'A navigation app shows the same trip. Which route would you take?', zh: '导航软件显示了同一段行程。你会选择哪条路线？' },
    q6Scene: { en: '<b>Same trip as the previous question.</b> The app shows each route on the map with this information:', zh: '<b>与上一题是同一段行程。</b>导航软件在地图上显示了两条路线，并给出以下信息：' },
    mTime: { en: 'Walking time', zh: '步行时间' },
    mDist: { en: 'Distance', zh: '距离' },
    mShade: { en: 'Shade coverage', zh: '遮荫率' },
    mSun: { en: 'Distance in the sun', zh: '暴晒距离' },
    mLong: { en: 'Longest stretch in the sun', zh: '最长连续暴晒' },
    mMin: { en: (x) => `${x} min`, zh: (x) => `${x} 分钟` },
    mExtra: { en: (m, p) => `+${m} m (+${p}%)`, zh: (m, p) => `+${m} 米（+${p}%）` },
    vsA: { en: 'vs. Route A', zh: '较路线 A' },
    unitMin: { en: ' min', zh: ' 分钟' }, unitM: { en: ' m', zh: ' 米' }, unitPP: { en: ' pp', zh: ' 个百分点' },
    shaded: { en: 'shaded', zh: '有遮荫' },
    sunny: { en: 'in the sun', zh: '暴晒' },
    shadedStretch: { en: 'Shaded stretch (2 pm)', zh: '遮荫路段（下午 2 点）' },
    q6Note: { en: 'Shade coverage = share of the route that is in shade at 2 pm.', zh: '遮荫率 = 下午 2 点时路线上处于阴影中的长度占比。' },

    part3: { en: (k, n) => `Part 3 · Situation ${k} of ${n} · step 1 of 2: the start`, zh: (k, n) => `第三部分 · 情境 ${k}/${n} · 第 1 步：起点` },
    q7Title: { en: 'Which way do you go?', zh: '你会走哪条路？' },
    q7Scene: {
      en: (o) => `<b>${o} About 2 pm, sunny.</b> Two routes lead to your destination. The map shows both routes and their lengths, but you can only see what each route looks like <b>at the start</b>.`,
      zh: (o) => `<b>${o}下午 2 点左右，天气晴热。</b>有两条路线可以到达目的地。地图上显示了两条路线及其长度，但你只能看到每条路线<b>起点</b>处的样子。` },
    origin: {
      en: { bus: 'You have just got off the bus.', mrt: 'You have just come out of an MRT station exit.', hdb: 'You are setting off on foot from an HDB block.', other: 'You are setting off on foot.' },
      zh: { bus: '你刚下巴士，', mrt: '你刚走出地铁站出口，', hdb: '你正从一栋组屋步行出发，', other: '你正步行出发，' } },
    q7Cap: { en: 'View at the start of the route', zh: '路线起点处的景象' },
    p3Kicker: { en: 'Part 3 · Three real situations', zh: '第三部分 · 三个真实情境' },
    p3Title: { en: 'Before you look at the photos', zh: '看照片之前' },
    pedView: {
      en: '<b>Look at the photos as a pedestrian.</b> They were taken from the road; imagine yourself walking on the footpath beside it. <b>Do not judge by the shadows in the photos</b>, which depend on when each photo was taken. Instead, look at whether trees or shade facilities along the footpath would shade you as you walk. White outlines mark nearby trees and shade facilities (e.g. covered linkways, bus shelters, arcades). To make them easier to see, shade facilities are outlined in the photos, but not all of them necessarily serve the footpath. <b>Based on the walking distance and how much of each route is shaded, choose the route you personally prefer.</b>',
      zh: '<b>请以行人的视角看照片。</b>照片是从马路上拍摄的，请想象自己正走在路边的人行道上。<b>不要根据照片里的影子判断</b>（影子取决于拍摄时间），而要看走在人行道上时，有没有树木或遮荫设施能为你遮阳。白色轮廓线标出了近处的树木和遮荫设施（如有顶连廊、候车亭、骑楼）。为了便于观察，图中遮荫设施已经标出，但是它们未必都能为人行道服务。<b>根据所需要的步行长度和路段遮荫情况，主观选择你所偏好的路径。</b>' },

    part3b: { en: (k, n) => `Part 3 · Situation ${k} of ${n} · step 2 of 2: whole route`, zh: (k, n) => `第三部分 · 情境 ${k}/${n} · 第 2 步：全程` },
    q8Title: { en: 'Now that you can see the whole route, which way do you go?', zh: '现在你能看到整条路线，你会走哪条路？' },
    q8Scene: {
      en: (x) => `<b>Same situation as the previous question.</b> From the start view you chose <b>Route ${x}</b> (this answer is saved). Now you can see each route from start to destination: photos in walking order, about one every 120 m, numbered on the map.<br><b>Please look through all the photos of both routes, and weigh them against the route lengths, before you choose.</b>`,
      zh: (x) => `<b>与上一题是同一情境。</b>只看起点时你选择了<b>路线 ${x}</b>（该答案已保存）。现在你可以看到每条路线从起点到目的地的全程：照片按步行顺序排列，约每 120 米一张，编号与地图上的点对应。<br><b>请先把两条路线的照片全部看完，再结合路线长度做选择。</b>` },
    viewed: { en: (a, n) => `Viewed ${a} / ${n}`, zh: (a, n) => `已看 ${a} / ${n} 张` },
    viewAll: { en: 'Swipe through all photos of both routes to unlock the choice.', zh: '左右滑动看完两条路线的全部照片后才能选择。' },
    mapTag: { en: (m, t) => `${m} m · ≈${t} min`, zh: (m, t) => `${m} 米 · 约 ${t} 分钟` },
    lenTime: { en: (m, t) => `${m} m · ≈ ${t} min walk`, zh: (m, t) => `${m} 米 · 步行约 ${t} 分钟` },
    photoN: { en: (i, n) => (i === 1 ? `1 / ${n} · start` : `${i} / ${n}`), zh: (i, n) => (i === 1 ? `1 / ${n} · 起点` : `${i} / ${n}`) },
    nPhotos: { en: (n) => `${n} photos`, zh: (n) => `${n} 张照片` },

    part4: { en: (k, n) => `Part 3 · Detour or sun? · example ${k} of ${n}`, zh: (k, n) => `第三部分 · 绕路还是晒太阳？· 例子 ${k}/${n}` },   // 1013v37 删去原第三部分(情境题)后顺延为第三部分
    q9Title: { en: 'Compared with walking in the sun and making a detour, which do you prefer?', zh: '你觉得相比于暴晒距离和绕路，你更喜欢哪个？' },
    q9Scene: {
      en: (d) => `<b>Imagine a scorching midday, around 1 pm.</b> The sun is fierce and it is hard to keep walking in it. You need to walk to a place about <b>${d} m</b> away by the shortest route. A navigation app offers 7 routes: towards the left you walk farther (more detour) but more of the way is shaded; towards the right the route is shorter but more of it is in the sun.`,
      zh: (d) => `<b>设想一个酷热的中午（约下午 1 点）。</b>太阳很毒，在太阳下很难走下去。你要步行去一个最短约 <b>${d} 米</b>外的地方。导航软件给出 7 条路线：越往左，绕路越多，但更多路段有遮荫；越往右，路越短，但暴晒距离越长。` },
    schShade: { en: 'shaded', zh: '有遮荫' }, schSun: { en: 'in the sun', zh: '暴晒' },
    q9How: { en: 'Tap or slide along the scale to compare the options, then leave it on the one you would choose.', zh: '点击或拖动刻度比较各个方案，最后停在你会选择的那一档。' },
    q9Left: { en: (m) => `← More detour (up to +${m} m)`, zh: (m) => `← 多绕路（最多 +${m} 米）` },
    q9Right: { en: (m) => `More sun (up to ${m} m) →`, zh: (m) => `多暴晒（最多 ${m} 米）→` },
    q9Empty: { en: 'Tap the scale to see an option.', zh: '点击刻度查看方案。' },
    q9Option: { en: (k) => `Option ${k} of 7`, zh: (k) => `方案 ${k}/7` },
    q9Detour: { en: 'Extra walking (detour)', zh: '多走的路（绕行）' },
    q9Sun: { en: 'Distance in the sun', zh: '暴晒距离' },
    q9Shade: { en: 'Shade coverage', zh: '遮荫率' },
    q9Time: { en: 'Walking time', zh: '步行时间' },
    q9DetourRate: { en: 'Detour rate', zh: '绕行率' },
    q9Shortest: { en: 'shortest route', zh: '最短路线' },
    q9vsShort: { en: (d) => `${d} vs. shortest`, zh: (d) => `较最短路线 ${d}` },
    q9Bars: { en: ['Detour', 'In the sun', 'Length'], zh: ['绕行', '暴晒', '总长度'] },

    sending: { en: 'Submitting your answers…', zh: '正在提交答案……' },
    payKicker: { en: 'Optional · participant payment', zh: '选填 · 参与报酬' },
    payTitle: { en: 'Receive SGD 5 via PayNow', zh: '通过 PayNow 领取 5 新币报酬' },
    payLead: { en: 'If you would like to receive SGD 5 for taking part, enter the mobile number registered with PayNow. Payment normally arrives within one week.', zh: '如需领取 5 新币参与报酬，请填写已绑定 PayNow 的手机号，报酬预计 1 周内到账。' },
    payLabel: { en: 'PayNow mobile number (optional)', zh: 'PayNow 手机号（选填）' },
    payPlaceholder: { en: 'e.g. 9123 4567', zh: '例如 9123 4567' },
    payNote: { en: 'Providing a number is voluntary; leave it blank if you do not want payment. Your answers are saved either way. The number is stored separately from your answers and cannot be linked to them; it is used only for the payment and deleted within 30 days after payment.', zh: '填写完全自愿，不需要报酬可留空，答案照样有效。号码与你的答案分开保存、无法对应，只用于付款，付款后 30 天内删除。' },
    payInvalid: { en: 'Please enter an 8-digit Singapore mobile number starting with 8 or 9, or leave it blank.', zh: '请填写以 8 或 9 开头的 8 位新加坡手机号，或留空。' },
    paySending: { en: 'Sending your PayNow number…', zh: '正在提交 PayNow 号码……' },
    payOk: { en: 'Your PayNow number has been received. Payment normally arrives within one week.', zh: '已收到你的 PayNow 号码，报酬预计 1 周内到账。' },
    payFail: { en: 'Your answers are saved, but the PayNow number could not be sent. Please check your connection and tap “Try again”.', zh: '答案已保存，但 PayNow 号码未提交成功，请检查网络后点「重试」。' },
    sendFail: { en: 'Your answers could not be saved yet. They are kept on this device — please check your connection and tap “Try again”.', zh: '答案暂未保存成功（已暂存在本机）。请检查网络后点「重试」。' },
    retry: { en: 'Try again', zh: '重试' },
    thanks: { en: 'Thank you!', zh: '谢谢参与！' },
    thanksLead: { en: 'Your answers have been saved.', zh: '你的答案已保存。' },
    reviewBtn: { en: 'View my answers', zh: '查看我的回答' },
    reviewHide: { en: 'Hide my answers', zh: '收起我的回答' },
    reviewTitle: { en: 'Your answers (view only — they can no longer be changed)', zh: '你的回答（仅供查看，不能修改）' },
    code: { en: 'Response code', zh: '答卷编号' },
    already: { en: 'You have already completed this survey on this device. Thank you!', zh: '你已在本设备上完成过本问卷，谢谢！' },
    loadFail: { en: 'The survey could not be loaded. Please refresh the page.', zh: '问卷加载失败，请刷新页面。' },
  };

  const Q1V = ['every', 'half', 'lesshalf', 'never'], Q2V = ['seek', 'notice', 'rarely'], Q3V = ['yes', 'no'], Q4V = ['yes', 'no'];
  const SHADE_BLOCK = '#16A34A';                          // 第 7 题地图遮荫色块(半透明绿)
  const GENDER = ['male', 'female', 'na'], AGE = ['21-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  const RESIDENT = ['yes', 'no'];                          // 筛选题:选"否"只做标记,不结束问卷

  let C = null;      // content.json
  let S = null;      // respondent state
  let screens = [];
  const $ = (id) => document.getElementById(id);
  const main = $('screen');
  const put = (...xs) => main.append(...xs.flat(2).filter((x) => x != null && x !== false));

  // ---------- helpers ----------
  const now = () => Date.now();
  function tr(key, ...a) {
    const e = I18N[key]; if (!e) return key;
    const v = e[S ? S.lang : 'en'] ?? e.en;
    return typeof v === 'function' ? v(...a) : v;
  }
  function el(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(c));
    return n;
  }
  const svgEl = (tag, attrs = {}) => { const n = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const coin = () => (Math.random() < 0.5 ? 'short' : 'cool');
  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { /* storage unavailable: survey still works */ } }
  function load() { try { return JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { return null; } }
  function isDone() { try { return localStorage.getItem(DONE) === '1'; } catch (e) { return false; } }
  function setDone() {
    try {
      localStorage.setItem(REVIEW, JSON.stringify({ rid: S.rid, answers: S.answers, assignA: S.assignA, order7: S.order7, q9order: S.q9order }));
      localStorage.setItem(DONE, '1'); localStorage.removeItem(STORE);
    } catch (e) { }
  }
  function loadReview() { try { return JSON.parse(localStorage.getItem(REVIEW) || 'null'); } catch (e) { return null; } }
  const fmt = (x) => Math.round(x).toLocaleString(S.lang === 'zh' ? 'zh-CN' : 'en-SG');

  function newState() {
    const lang = (navigator.language || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en';
    const sids = C.scenarios.map((s) => s.sid);
    const A = { q56: coin() };
    for (const s of sids) A[s] = coin();
    return {
      v: VERSION, rid: uuid(), lang, idx: 0, started: new Date().toISOString(), langSwitches: 0,
      assignA: A,                        // which true route is shown as "A"
      order7: shuffle(sids),                                // 情境题(1013v37 起 content.json 无情境,第三部分整体删去;代码保留,情境为空时不出现)
      q9order: shuffle(C.q9s.map((e) => e.eid)),            // 第 9 题(显示第 8 题)各例子随机顺序;1013v39 起 3 个例子(加 E3:最大绕行约 30%)
      answers: { q0: {}, q7: {}, q8: {}, q9: {} }, q9visits: {}, seen8: {},
      timing: {},
    };
  }

  // ---------- screens ----------
  function buildScreens() {
    screens = [
      { id: 'intro', render: rIntro, ok: () => true, label: 'start' },
      { id: 'q0', render: rQ0, ok: () => S.answers.q0.resident && S.answers.q0.gender && S.answers.q0.age },
      { id: 'q1', render: rQ1, ok: () => !!S.answers.q1 },
      { id: 'q2', render: rQ2, ok: () => !!S.answers.q2 },
      { id: 'q3', render: rQ3, ok: () => !!S.answers.q3 },
      { id: 'q4', render: rQ4, ok: () => !!S.answers.q4 },
      { id: 'q5', render: rQ5, ok: () => !!S.answers.q5 },
      { id: 'q6', render: rQ6, ok: () => !!S.answers.q6 },
      // 同一情境配对:先只看起点(Q7),答案锁定后才显示全程(Q8)
      ...(S.order7.length ? [{ id: 'p3intro', render: rP3Intro, ok: () => true }] : []),   // 情境题说明页(不计题号):以行人视角看照片;无情境时不出现
      ...S.order7.flatMap((sid, k) => [
        { id: 'q7_' + sid, sid, k: k + 1, n: S.order7.length, render: rQ7, ok: () => !!S.answers.q7[sid] },
        { id: 'q8_' + sid, sid, k: k + 1, n: S.order7.length, render: rQ8, ok: () => !!S.answers.q8[sid] }]),
      ...S.q9order.map((eid, k) => ({ id: 'q9_' + eid, eid, k: k + 1, n: S.q9order.length, render: rQ9, ok: () => !!S.answers.q9[eid] })),
      { id: 'pay', render: rPay, ok: payValid, label: 'submit' },   // 选填 PayNow(不计题号);号码不进答卷
      { id: 'end', render: rEnd, ok: () => false, final: true },
    ];
  }
  // 显示题号:q0–q6 = 1–7;有情境时 q7/q8/q9 = 8/9/10,无情境(1013v37 起)时 q9 = 8;q9 的各例子同属一题
  const qnum = (id) => { const m = /^q(\d)/.exec(id); if (!m) return 0; const k = Number(m[1]); return k <= 6 || C.scenarios.length ? k + 1 : k - 1; };
  const nQuestions = () => Math.max(...screens.map((s) => qnum(s.id)));

  function render() {
    const sc = screens[S.idx];
    document.documentElement.lang = S.lang === 'zh' ? 'zh-CN' : 'en';
    document.title = tr('brand');
    $('brand').textContent = tr('brand');
    document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === S.lang)));
    const qi = qnum(sc.id), nq = nQuestions();
    $('step').textContent = qi ? tr('step', qi, nq) : '';
    $('barFill').style.width = `${(sc.final ? 1 : Math.max(0, S.idx - 1) / (screens.length - 2)) * 100}%`;
    main.replaceChildren();
    sc.render(sc);
    $('bottom').hidden = !!sc.final;
    $('next').textContent = tr(sc.label || 'next');
    (S.reached || (S.reached = {}))[sc.id] = 1;
    $('back').textContent = tr('back');
    $('back').hidden = backTarget() < 0;
    updateNext();
    const t = S.timing[sc.id] || (S.timing[sc.id] = { ms: 0, first: null, views: 0 });
    t.views += 1; t._enter = now();
    save();
  }
  function updateNext() {
    const sc = screens[S.idx];
    const ok = !!sc.ok();
    $('next').disabled = !ok;
    const lockedPrev = (sc.id === 'q6' || sc.id.startsWith('q8_')) && ok;
    $('hint').textContent = ok ? (lockedPrev ? tr('lockedNote') : '') : (sc.id === 'intro' ? '' : sc.id === 'pay' ? tr('payInvalid') : tr('needAll'));
  }
  function answered() {
    const sc = screens[S.idx]; const t = S.timing[sc.id];
    if (t && t.first == null && t._enter) t.first = now() - t._enter;
    save(); updateNext();
  }
  function leave() {
    const sc = screens[S.idx]; const t = S.timing[sc.id];
    if (t && t._enter) { t.ms += now() - t._enter; t._enter = null; }
  }
  // 信息递进的前一题在看到后一题后锁定:进入 Q6 后 Q5 锁定,进入 Q8 后 Q7 锁定;前进/返回都跳过锁定题
  function isLocked(sc) {
    const R = S.reached || {};
    return (sc.id === 'q5' && !!R.q6) || (sc.id.startsWith('q7_') && !!R['q8_' + sc.sid]);
  }
  function backTarget() {
    let t = S.idx - 1;
    while (t >= 1 && isLocked(screens[t])) t -= 1;
    return t >= 1 && !screens[S.idx].final ? t : -1;
  }
  function go(t) {
    leave(); S.idx = t; render();
    window.scrollTo(0, 0); main.focus({ preventScroll: true });
    preloadAhead();
  }
  function next() {
    const sc = screens[S.idx];
    if (!sc.ok()) return;
    let t = Math.min(S.idx + 1, screens.length - 1);
    while (t < screens.length - 1 && isLocked(screens[t])) t += 1;
    go(t);
  }
  function back() { const t = backTarget(); if (t >= 0) go(t); }

  // ---------- reusable widgets ----------
  function radios(options, values, current, onPick, row = false) {
    const g = el('div', { class: 'opts' + (row ? ' row' : ''), role: 'radiogroup' });
    options.forEach((label, i) => {
      const b = el('button', { type: 'button', class: 'opt', role: 'radio', 'aria-checked': String(current === values[i]) }, label);
      b.addEventListener('click', () => {
        g.querySelectorAll('.opt').forEach((x) => x.setAttribute('aria-checked', 'false'));
        b.setAttribute('aria-checked', 'true');
        onPick(values[i]); answered();
      });
      g.append(b);
    });
    return g;
  }
  function head(kicker, title, lead) {
    return [kicker ? el('p', { class: 'kicker' }, kicker) : null, el('h2', {}, title), lead ? el('p', { class: 'lead' }, lead) : null];
  }
  const sideOf = (assign, letter) => (letter === 'A' ? assign : assign === 'short' ? 'cool' : 'short');
  const letterOf = (assign, route) => (assign === route ? 'A' : 'B');

  function routeCard(letter, selected, body, onPick, locked, sub) {
    const card = el('section', { class: 'route', role: 'radio', 'aria-checked': String(selected) },
      el('div', { class: 'rhead' }, el('span', { class: 'badge ' + letter }, letter), el('span', { class: 'rtitle' }, tr('route', letter)), sub ? el('span', { class: 'rsub' }, sub) : null),
      body,
      el('button', { type: 'button', class: 'pick', disabled: locked }, selected ? tr('chosen', letter) : tr('chooseRoute', letter)));
    card.querySelector('.pick').addEventListener('click', () => onPick(letter));
    return card;
  }
  function routePair(key, store, assign, bodyFor, opt = {}) {
    const wrap = el('div', { class: 'routes', role: 'radiogroup' });
    const draw = () => {
      wrap.replaceChildren(...['A', 'B'].map((L) => routeCard(L, store[key] === L, bodyFor(L, sideOf(assign, L)), (x) => { store[key] = x; answered(); draw(); },
        opt.locked ? opt.locked() : false, opt.sub ? opt.sub(L, sideOf(assign, L)) : null)));
    };
    draw(); wrap.redraw = draw;
    return wrap;
  }
  function shot(src, cap, gallery, i) {
    const d = el('div', { class: 'shot' }, el('img', { src, alt: cap, loading: 'lazy', decoding: 'async' }), el('span', { class: 'zoom' }, tr('tapZoom')));
    d.addEventListener('click', () => openLB(gallery || [{ src, cap }], i || 0));
    return d;
  }

  // ---------- map ----------
  function mapView(map, lines, od) {
    const box = el('div', { class: 'map' }, el('img', { src: map.img, alt: '', width: map.w, height: map.h }));
    const svg = svgEl('svg', { viewBox: `0 0 ${map.w} ${map.h}`, 'aria-hidden': 'true' });
    for (const ln of lines) {                                      // 1) 路线(白描边 + 线)
      const pts = ln.path.map((p) => p.join(',')).join(' ');
      if (ln.halo) svg.append(svgEl('polyline', { points: pts, fill: 'none', stroke: '#fff', 'stroke-width': ln.w + 6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.9 }));
      svg.append(svgEl('polyline', { points: pts, fill: 'none', stroke: ln.color, 'stroke-width': ln.w, 'stroke-linejoin': 'round', 'stroke-linecap': ln.cap || 'round', 'stroke-dasharray': ln.dash || '', opacity: ln.op ?? 1 }));
    }
    for (const mk of (lines.marks || [])) {                      // 2) 照片位置编号点
      const g = svgEl('g', { transform: `translate(${mk.p[0]},${mk.p[1]})` });
      g.append(svgEl('circle', { r: 17, fill: mk.color, stroke: '#fff', 'stroke-width': 4 }));
      const tx = svgEl('text', { 'text-anchor': 'middle', dy: 8, fill: '#fff', 'font-size': 22, 'font-weight': 700, 'font-family': 'Arial, sans-serif' }); tx.textContent = mk.n;
      g.append(tx); svg.append(g);
    }
    if (od) {                                                      // 3) 起点 / 目的地
      const [o, d] = od;
      svg.append(svgEl('circle', { cx: o[0], cy: o[1], r: 16, fill: '#fff', stroke: '#111', 'stroke-width': 7 }));
      const sq = svgEl('rect', { x: d[0] - 16, y: d[1] - 16, width: 32, height: 32, rx: 5, fill: '#111', stroke: '#fff', 'stroke-width': 4 }); svg.append(sq);
      for (const [p, txt] of [[o, tr('start_')], [d, tr('dest')]]) {
        const above = p[1] > 60;
        const t = svgEl('text', { x: p[0], y: p[1] + (above ? -30 : 58), 'text-anchor': 'middle', 'font-size': 34, 'font-weight': 700, 'font-family': 'Arial, sans-serif', fill: '#111', stroke: '#fff', 'stroke-width': 9, 'paint-order': 'stroke' });
        t.textContent = txt; svg.append(t);
      }
    }
    // 4) 路线字母 + 长度/时间胶囊,最后画(压在编号点上面);位置在路线上自动挑:避开编号点、起终点和已放的标签,尽量靠近默认位置
    const obst = [...(lines.marks || []).map((m) => m.p), ...(od || [])], placed = [];
    const ptRect = (p, r) => Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[2]), Math.max(r[1] - p[1], 0, p[1] - r[3]));
    const rectRect = (a, b) => Math.hypot(Math.max(a[0] - b[2], b[0] - a[2], 0), Math.max(a[1] - b[3], b[1] - a[3], 0));
    for (const ln of lines) {
      if (!ln.label) continue;
      const fs = 34, th = 54, tw = ln.tag ? [...ln.tag].reduce((a, ch) => a + (ch.charCodeAt(0) > 0x2e80 ? fs : 0.56 * fs), 0) + 30 : 0;
      const f0 = ln.labelAt || 0.5, fr = [f0];
      for (let f = 0.2; f <= 0.81; f += 0.05) fr.push(Math.round(f * 100) / 100);
      let best = null;
      for (const f of fr) {
        const mid = ln.path[Math.min(ln.path.length - 1, Math.floor(ln.path.length * f))];
        for (const right of (tw ? [true, false] : [true])) {
          const r = right ? [mid[0] - 26, mid[1] - th / 2 - 2, mid[0] + 30 + tw, mid[1] + th / 2 + 2] : [mid[0] - 30 - tw, mid[1] - th / 2 - 2, mid[0] + 26, mid[1] + th / 2 + 2];
          if (r[0] < 4 || r[2] > map.w - 4 || r[1] < 4 || r[3] > map.h - 4) continue;
          const clear = Math.min(120, ...obst.map((p) => ptRect(p, r)), ...placed.map((q) => rectRect(q, r)));
          const score = clear - 60 * Math.abs(f - f0) - (right ? 0 : 3);
          if (!best || score > best.score) best = { score, mid, right, r };
        }
      }
      if (!best) { const mid = ln.path[Math.floor(ln.path.length * f0)]; best = { mid, right: mid[0] + 30 + tw <= map.w - 8, r: [0, 0, 0, 0] }; }
      placed.push(best.r);
      const { mid, right } = best;
      const g = svgEl('g', { transform: `translate(${mid[0]},${mid[1]})` });
      if (tw) {
        const x = right ? 30 : -30 - tw;
        g.append(svgEl('rect', { x, y: -th / 2, width: tw, height: th, rx: th / 2, fill: ln.color, stroke: '#fff', 'stroke-width': 4 }));
        const tt = svgEl('text', { x: x + tw / 2, 'text-anchor': 'middle', dy: 12, fill: '#fff', 'font-size': fs, 'font-weight': 700, 'font-family': 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif' }); tt.textContent = ln.tag;
        g.append(tt);
      }
      g.append(svgEl('circle', { r: 24, fill: ln.color, stroke: '#fff', 'stroke-width': 5 }));
      const tx = svgEl('text', { 'text-anchor': 'middle', dy: 10, fill: '#fff', 'font-size': 30, 'font-weight': 700, 'font-family': 'Arial, sans-serif' }); tx.textContent = ln.label;
      g.append(tx); svg.append(g);
    }
    box.append(svg);
    return box;
  }

  // ---------- intro ----------
  function rIntro() {
    put(
      el('h1', {}, tr('introTitle')),
      el('p', { class: 'lead' }, tr('introLead')),
      el('ul', { class: 'plain' }, ...tr('introList').map((x) => el('li', {}, x))),
      el('p', { class: 'note' }, tr('consent')),
      CONTACT[S.lang] ? el('p', { class: 'note' }, CONTACT[S.lang]) : null,
      S._resumed ? el('p', { class: 'note' }, tr('resumed')) : null);
  }

  function rQ0() {
    const a = S.answers.q0;
    put(...head(tr('part1'), tr('q0Title')),
      el('div', { class: 'field' }, el('span', { class: 'label' }, tr('resident')), radios(tr('residentOpts'), RESIDENT, a.resident, (v) => { a.resident = v; }, true)),
      el('div', { class: 'field' }, el('span', { class: 'label' }, tr('gender')), radios(tr('genderOpts'), GENDER, a.gender, (v) => { a.gender = v; }, true)),
      el('div', { class: 'field' }, el('span', { class: 'label' }, tr('age')), radios(tr('ageOpts'), AGE, a.age, (v) => { a.age = v; }, true)));
  }

  // 四类遮荫设施:2 列 × 2 行,图下标英文名(中文界面再加一行中文);点击放大
  const facLabel = (f) => (S.lang === 'zh' ? `${f.name.en} · ${f.name.zh}` : f.name.en);
  const facSrc = (f, hl) => (hl && f.img_hl ? f.img_hl : f.img);       // hl:设施彩色、其余黑白(Q2)
  function facGallery(hl) { return C.facilities.map((f) => ({ src: facSrc(f, hl), cap: `${facLabel(f)} — ${f.desc[S.lang]}` })); }
  function facGrid(hl) {
    return el('div', { class: 'fac-grid' }, ...C.facilities.map((f, i) => {
      const fig = el('figure', {}, el('img', { src: facSrc(f, hl), alt: f.name.en }),
        el('figcaption', {}, el('b', {}, f.name.en), S.lang === 'zh' ? el('span', {}, f.name.zh) : null));
      fig.querySelector('img').addEventListener('click', () => openLB(facGallery(hl), i));
      return fig;
    }));
  }
  function rQ1() { put(...head(tr('part1'), tr('q1Title'), tr('q1Lead')), facGrid(), radios(tr('q1Opts'), Q1V, S.answers.q1, (v) => { S.answers.q1 = v; })); }
  function rQ2() { put(...head(tr('part1'), tr('q2Title')), facGrid(true), radios(tr('q2Opts'), Q2V, S.answers.q2, (v) => { S.answers.q2 = v; })); }
  function rQ3() { put(...head(tr('part1'), tr('q3Title')), facGrid(), radios(tr('q3Opts'), Q3V, S.answers.q3, (v) => { S.answers.q3 = v; })); }
  function rQ4() { put(...head(tr('part1'), tr('q4Title')), radios(tr('q4Opts'), Q4V, S.answers.q4, (v) => { S.answers.q4 = v; }, true)); }


  // ---------- Q5 / Q6 ----------
  function rQ5() {
    put(...head(tr('part2'), tr('q5Title')), el('div', { class: 'scene', html: tr('q5Scene') }),
      routePair('q5', S.answers, S.assignA.q56, (L, side) => el('p', { class: 'rtext' }, side === 'short' ? tr('q5Short') : tr('q5Cool'))));
  }
  // ref = 路线 A 的指标:给路线 B 的每个指标显示相对 A 的变化量(按显示值相减,保证与页面数字一致)
  function metricBody(m, ref) {
    const shadePct = Math.max(0, Math.min(100, m.sigma));
    const sgn = (d) => (d > 0 ? '+' : d < 0 ? '−' : '±');
    const dl = (d, unit, extra) => (ref ? el('div', { class: 'delta' }, `${tr('vsA')} ${sgn(d)}${fmt(Math.abs(d))}${tr(unit)}${extra || ''}`) : null);
    const tA = ref ? Math.round(ref.min) : 0, tB = Math.round(m.min);
    const dLen = ref ? m.len - ref.len : 0;
    const pct = ref && ref.len ? Math.round((100 * dLen) / ref.len) : 0;
    const cell = (k, v, d) => el('div', {}, el('span', { class: 'k' }, tr(k)), el('span', { class: 'v' }, v), d);
    return [
      el('div', { class: 'mgrid' },
        cell('mTime', tr('mMin', tB), ref && dl(tB - tA, 'unitMin')),
        cell('mDist', `${fmt(m.len)} m`, ref && dl(dLen, 'unitM', S.lang === 'zh' ? `（${sgn(pct)}${Math.abs(pct)}%）` : ` (${sgn(pct)}${Math.abs(pct)}%)`)),
        cell('mShade', `${m.sigma}%`, ref && dl(m.sigma - ref.sigma, 'unitPP')),
        cell('mSun', `${fmt(m.sun)} m`, ref && dl(m.sun - ref.sun, 'unitM')),
        cell('mLong', `${fmt(m.lsun)} m`, ref && dl(m.lsun - ref.lsun, 'unitM'))),
      el('div', { class: 'shadebar', role: 'img', 'aria-label': `${tr('mShade')} ${m.sigma}%` }, el('i', { style: `width:${shadePct}%` })),
      el('div', { class: 'shadekey' }, el('span', {}, el('i', { style: 'background:#6E8FA8' }), tr('shaded')), el('span', {}, el('i', { style: 'background:#F2C46B' }), tr('sunny'))),
    ];
  }
  function rQ6() {
    const q = C.q56, A = S.assignA.q56;
    // 遮荫路段(逐边 14:00 遮荫率 ≥ 0.5):半透明蓝色块垫在路线下面
    // 绘制顺序:路线白描边 → 遮荫色块 → 路线(否则白描边会盖住色块)
    const halo = ['B', 'A'].map((L) => ({ path: q.routes[sideOf(A, L)].path, color: '#fff', w: 15, op: 0.9 }));
    const shade = ['B', 'A'].flatMap((L) => (q.routes[sideOf(A, L)].shade || []).map((seg) => ({ path: seg, color: SHADE_BLOCK, w: 32, op: 0.5, cap: 'butt' })));
    const lines = [...halo, ...shade, ...['B', 'A'].map((L) => ({ path: q.routes[sideOf(A, L)].path, color: L === 'A' ? '#7C3AED' : '#1F2937', w: 9, label: L, labelAt: L === 'A' ? 0.45 : 0.6 }))];
    const p0 = q.routes.short.path;
    put(...head(tr('part2'), tr('q6Title')), el('div', { class: 'scene', html: tr('q6Scene') }),
      mapView(q.map, lines, [p0[0], p0[p0.length - 1]]),
      el('div', { class: 'legend' }, ...['A', 'B'].map((L) => el('span', {}, el('i', { style: `background:${L === 'A' ? '#7C3AED' : '#1F2937'}` }), tr('route', L))),
        el('span', {}, el('i', { class: 'block', style: `background:${SHADE_BLOCK}` }), tr('shadedStretch'))),
      routePair('q6', S.answers, A, (L, side) => metricBody(q.routes[side].m, L === 'B' ? q.routes[sideOf(A, 'A')].m : null)),
      el('p', { class: 'note' }, tr('q6Note')));
  }

  // ---------- Q7 / Q8 ----------
  const scen = (sid) => C.scenarios.find((s) => s.sid === sid);
  function originText(s) { const m = I18N.origin[S.lang]; return m[(s.od && s.od.from_) || 'other'] || m.other; }
  const RC = { A: '#7C3AED', B: '#1F2937' };
  function scenMap(s, A, withMarks) {
    const lines = ['B', 'A'].map((L) => { const m = s.routes[sideOf(A, L)].m; return { path: s.routes[sideOf(A, L)].path, color: RC[L], w: 9, halo: true, label: L, tag: tr('mapTag', fmt(m.len), Math.round(m.min)), labelAt: L === 'A' ? 0.45 : 0.6 }; });
    if (withMarks) lines.marks = ['B', 'A'].flatMap((L) => s.routes[sideOf(A, L)].marks.map((p, i) => ({ p, n: i + 1, color: RC[L] })));
    const p0 = s.routes.short.path;
    return [mapView(s.map, lines, [p0[0], p0[p0.length - 1]]),
      el('div', { class: 'legend' }, ...['A', 'B'].map((L) => { const m = s.routes[sideOf(A, L)].m; return el('span', {}, el('i', { style: `background:${RC[L]}` }), `${tr('route', L)} · ${tr('lenTime', fmt(m.len), Math.round(m.min))}`); }))];
  }
  const lenSub = (s) => (L, side) => tr('lenTime', fmt(s.routes[side].m.len), Math.round(s.routes[side].m.min));
  function rP3Intro() { put(...head(tr('p3Kicker'), tr('p3Title')), el('p', { class: 'pedview big', html: tr('pedView') })); }
  function rQ7(sc) {
    const s = scen(sc.sid), A = S.assignA[sc.sid];
    const gal = ['A', 'B'].map((L) => ({ src: s.routes[sideOf(A, L)].start, cap: `${tr('route', L)} — ${tr('q7Cap')}` }));
    put(...head(tr('part3', sc.k, sc.n), tr('q7Title')), el('div', { class: 'scene', html: tr('q7Scene', originText(s)) }), ...scenMap(s, A, false),
      routePair(sc.sid, S.answers.q7, A, (L, side) => shot(s.routes[side].start, tr('q7Cap'), gal, L === 'A' ? 0 : 1), { sub: lenSub(s) }));
  }
  function rQ8(sc) {
    const s = scen(sc.sid), A = S.assignA[sc.sid];
    const n = { A: s.routes[sideOf(A, 'A')].seq.length, B: s.routes[sideOf(A, 'B')].seq.length };
    const seen = S.seen8[sc.sid] || (S.seen8[sc.sid] = { A: [], B: [] });
    const allSeen = () => ['A', 'B'].every((L) => new Set(seen[L]).size >= n[L]);
    const counters = {};
    const hint = el('p', { class: 'note viewall' }, allSeen() ? '' : tr('viewAll'));
    let pair = null;
    const markSeen = (L, i) => {                                   // 照片在屏幕上露出 ≥60% 或在放大视图里打开过,即算看过
      if (seen[L].includes(i)) return;
      const was = allSeen(); seen[L].push(i); save();
      if (counters[L]) counters[L].textContent = tr('viewed', new Set(seen[L]).size, n[L]);
      if (!was && allSeen()) { hint.textContent = ''; if (pair) pair.redraw(); }
    };
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((ents) => ents.forEach((e) => {
      if (e.isIntersecting && e.intersectionRatio >= 0.6) markSeen(e.target.dataset.l, Number(e.target.dataset.i));
    }), { threshold: [0.6] }) : null;
    pair = routePair(sc.sid, S.answers.q8, A, (L, side) => {
      const seq = s.routes[side].seq, nn = seq.length;
      const gal = seq.map((src, i) => ({ src, cap: `${tr('route', L)} · ${tr('photoN', i + 1, nn)}`, onShow: () => markSeen(L, i) }));
      counters[L] = el('span', { class: 'seen' }, tr('viewed', new Set(seen[L]).size, nn));
      return [el('div', { class: 'strip-hint' }, tr('nPhotos', nn), ' · ', counters[L]),
        el('div', { class: 'strip' }, ...seq.map((src, i) => {
          const fig = el('figure', { 'data-l': L, 'data-i': i }, el('img', { src, alt: gal[i].cap, loading: i < 2 ? 'eager' : 'lazy', decoding: 'async' }), el('figcaption', {}, tr('photoN', i + 1, nn)));
          fig.querySelector('img').addEventListener('click', () => openLB(gal, i));
          if (io) io.observe(fig); else markSeen(L, i);
          return fig;
        }))];
    }, { locked: () => !allSeen(), sub: lenSub(s) });
    put(...head(tr('part3b', sc.k, sc.n), tr('q8Title')), el('div', { class: 'scene', html: tr('q8Scene', S.answers.q7[sc.sid]) }), ...scenMap(s, A, true), hint, pair);
  }

  // ---------- Q9 ----------
  // 假设情境示意图:7 条弧线(灰),选中一条:橙色底 + 蓝灰虚线段(占比 = 遮荫率,沿线均匀分布)
  function schematicView(q, k) {
    const sc = q.schematic, box = el('div', { class: 'map schematic' });
    const svg = svgEl('svg', { viewBox: `0 0 ${sc.w} ${sc.h + 40}`, role: 'img', 'aria-label': 'route options' });
    svg.style.position = 'static'; svg.style.display = 'block';
    q.levels.forEach((lv, i) => svg.append(svgEl('path', { d: lv.svg, fill: 'none', stroke: '#C9C3B8', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: k && i + 1 === k ? 0 : 1 })));
    if (k) {
      const lv = q.levels[k - 1], sg = Math.max(0, Math.min(100, lv.m.sigma));
      svg.append(svgEl('path', { d: lv.svg, fill: 'none', stroke: '#fff', 'stroke-width': 16, 'stroke-linecap': 'round' }));
      svg.append(svgEl('path', { d: lv.svg, fill: 'none', stroke: '#E8A33D', 'stroke-width': 10, 'stroke-linecap': 'butt' }));
      svg.append(svgEl('path', { d: lv.svg, fill: 'none', stroke: '#6E8FA8', 'stroke-width': 10, 'stroke-linecap': 'butt', pathLength: 100, 'stroke-dasharray': `${sg / 10} ${10 - sg / 10}` }));
    }
    const [sx, sy] = sc.start, [dx, dy] = sc.dest;
    svg.append(svgEl('circle', { cx: sx, cy: sy, r: 11, fill: '#fff', stroke: '#111', 'stroke-width': 5 }));
    svg.append(svgEl('rect', { x: dx - 11, y: dy - 11, width: 22, height: 22, rx: 3, fill: '#111' }));
    for (const [x, txt] of [[sx, tr('start_')], [dx, tr('dest')]]) {
      const t = svgEl('text', { x, y: sy + 36, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, 'font-family': 'Arial, sans-serif', fill: '#111' }); t.textContent = txt; svg.append(t);
    }
    const lg = svgEl('g', { transform: `translate(${sc.w / 2 - 110},${sc.h + 26})` });
    lg.append(svgEl('rect', { x: 0, y: -12, width: 26, height: 10, fill: '#6E8FA8' }));
    const t1 = svgEl('text', { x: 32, y: -2, 'font-size': 16, fill: '#646B76', 'font-family': 'Arial, sans-serif' }); t1.textContent = tr('schShade'); lg.append(t1);
    lg.append(svgEl('rect', { x: 120, y: -12, width: 26, height: 10, fill: '#E8A33D' }));
    const t2 = svgEl('text', { x: 152, y: -2, 'font-size': 16, fill: '#646B76', 'font-family': 'Arial, sans-serif' }); t2.textContent = tr('schSun'); lg.append(t2);
    svg.append(lg);
    box.append(svg);
    return box;
  }
  function rQ9(sc) {
    const q = C.q9s.find((e) => e.eid === sc.eid), lv = q.levels, N = lv.length, eid = sc.eid;
    const visits = S.q9visits[eid] || (S.q9visits[eid] = []);
    const shortest = lv[N - 1].m, maxExtra = lv[0].m.extra, maxSun = shortest.sun, maxLen = Math.max(...lv.map((x) => x.m.len));
    const mapBox = el('div');
    const panel = el('div', { class: 'panel' });
    const barsBox = el('div', { class: 'q9bars' });
    const drawBars = (k) => {                                      // 滑块正下方的"绕行 / 暴晒 / 总长度"柱状图
      const m = k ? lv[k - 1].m : null;
      barsBox.replaceChildren(...[[tr('q9Bars')[0], m && m.extra, maxExtra, '#6E8FA8'], [tr('q9Bars')[1], m && m.sun, maxSun, '#E8A33D'], [tr('q9Bars')[2], m && m.len, maxLen, '#5F6670']].map(([lab, v, mx, col]) =>
        el('div', { class: 'q9bar' },
          el('span', { class: 'lab' }, lab),
          el('span', { class: 'track' }, el('i', { style: `width:${m && mx ? (100 * v) / mx : 0}%;background:${col}` })),
          el('span', { class: 'val' }, m ? `${fmt(v)} m` : '–'))));
    };
    const drawMap = (k) => {
      if (q.hypo) { mapBox.replaceChildren(schematicView(q, k)); return; }
      const lines = lv.map((x, i) => ({ path: x.path, color: '#8F877A', w: 5, op: 0.45 }));
      if (k) lines.push({ path: lv[k - 1].path, color: '#7C3AED', w: 10, halo: true });
      const p0 = lv[N - 1].path;
      mapBox.replaceChildren(mapView(q.map, lines, [p0[0], p0[p0.length - 1]]));
    };
    const drawPanel = (k) => {
      if (!k) { panel.className = 'panel empty'; panel.replaceChildren(tr('q9Empty')); return; }
      const m = lv[k - 1].m; panel.className = 'panel';
      const sunDelta = m.sun - shortest.sun, shDelta = m.sigma - shortest.sigma;
      const rows = [
        [tr('q9Detour'), m.extra > 0 ? `+${fmt(m.extra)} m` : `0 m · ${tr('q9Shortest')}`],
        [tr('q9Sun'), `${fmt(m.sun)} m`, sunDelta ? tr('q9vsShort', `${sunDelta > 0 ? '+' : '−'}${fmt(Math.abs(sunDelta))} m`) : ''],
        [tr('q9Shade'), `${m.sigma}%`, shDelta ? tr('q9vsShort', `${shDelta > 0 ? '+' : '−'}${Math.abs(shDelta)}${S.lang === 'zh' ? ' 个百分点' : ' pp'}`) : ''],
        [tr('q9DetourRate'), `+${m.extra_pct}%`, m.extra > 0 ? '' : tr('q9Shortest')],
        [tr('q9Time'), tr('mMin', Math.round(m.min))],
      ];
      panel.replaceChildren(el('h3', {}, tr('q9Option', k)),
        ...rows.map(([k_, v, d]) => el('div', { class: 'row' }, el('span', {}, k_), el('span', { class: 'v' }, v, d ? el('div', { class: 'delta' }, d) : null))));
    };
    // slider
    const track = el('div', { class: 'track' }, el('div', { class: 'rail' }));
    const stops = lv.map((x, i) => {
      const b = el('button', { type: 'button', class: 'stop', role: 'radio', 'aria-label': tr('q9Option', i + 1), 'aria-checked': String(S.answers.q9[eid] === i + 1), style: `left:calc(14px + (100% - 28px) * ${i / (N - 1)})` });
      b.addEventListener('click', () => choose(i + 1));
      track.append(b); return b;
    });
    const choose = (k) => {
      if (S.answers.q9[eid] === k) return;
      S.answers.q9[eid] = k; visits.push([k, now()]);
      stops.forEach((b, i) => b.setAttribute('aria-checked', String(i + 1 === k)));
      drawMap(k); drawBars(k); drawPanel(k); answered();
    };
    const fromX = (x) => { const r = track.getBoundingClientRect(); const f = (x - r.left - 14) / (r.width - 28); return Math.max(1, Math.min(N, Math.round(f * (N - 1)) + 1)); };
    let drag = false;
    track.addEventListener('pointerdown', (e) => { drag = true; try { track.setPointerCapture(e.pointerId); } catch (_) { } choose(fromX(e.clientX)); });
    track.addEventListener('pointermove', (e) => { if (drag) choose(fromX(e.clientX)); });
    track.addEventListener('pointerup', () => { drag = false; });
    track.addEventListener('pointercancel', () => { drag = false; });
    track.addEventListener('keydown', (e) => {
      const k = S.answers.q9[eid] || Math.ceil(N / 2);
      if (e.key === 'ArrowLeft') { choose(Math.max(1, k - 1)); e.preventDefault(); }
      if (e.key === 'ArrowRight') { choose(Math.min(N, k + 1)); e.preventDefault(); }
    });
    const slider = el('div', { class: 'slider', role: 'radiogroup' }, track,
      el('div', { class: 'ends' }, el('span', {}, tr('q9Left', fmt(maxExtra))), el('span', {}, tr('q9Right', fmt(maxSun)))));
    put(...head(tr('part4', sc.k, sc.n), tr('q9Title')), el('div', { class: 'scene', html: tr('q9Scene', fmt(q.L0 || lv[N - 1].m.len)) }), mapBox, el('p', { class: 'note' }, tr('q9How')), slider, barsBox, panel);
    drawMap(S.answers.q9[eid]); drawBars(S.answers.q9[eid]); drawPanel(S.answers.q9[eid]);
  }

  // ---------- PayNow(选填;号码只在本页和单独的付款请求里出现,不进答卷、不进答案快照) ----------
  const payNorm = (x) => String(x || '').replace(/[\s-]/g, '').replace(/^\+?65(?=\d{8}$)/, '');
  function payValid() { const m = payNorm(S.pay); return m === '' || /^[89]\d{7}$/.test(m); }
  function rPay() {
    const inp = el('input', { type: 'tel', inputmode: 'numeric', autocomplete: 'tel-national', maxlength: 14, class: 'payin', placeholder: tr('payPlaceholder'), value: S.pay || '' });
    inp.addEventListener('input', () => { S.pay = inp.value; save(); updateNext(); });
    put(...head(tr('payKicker'), tr('payTitle'), tr('payLead')), el('label', { class: 'field' }, el('span', { class: 'label' }, tr('payLabel')), inp), el('p', { class: 'note' }, tr('payNote')));
  }
  async function sendPay(m, st) {
    st.replaceChildren(el('p', { class: 'center note' }, tr('paySending')));
    try {
      const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ type: 'pay', mobile: m }) });   // 不带答卷编号、时间等任何答卷信息
      const j = await res.json();
      if (!res.ok || !j || j.ok !== true) throw new Error((j && j.error) || 'HTTP ' + res.status);
      st.replaceChildren(el('p', { class: 'center pay-ok' }, tr('payOk')));
    } catch (e) {
      st.replaceChildren(el('p', { class: 'err' }, tr('payFail')), el('p', { class: 'center' }, el('button', { type: 'button', class: 'next', onclick: () => sendPay(m, st) }, tr('retry'))));
    }
  }

  // ---------- submit / end ----------
  function payload() {
    const A = S.assignA, a = S.answers;
    const pick = (assign, letter) => (letter ? sideOf(assign, letter) : null);
    const out = {
      v: VERSION, rid: S.rid, lang: S.lang, langSwitches: S.langSwitches, started: S.started, finished: new Date().toISOString(),
      ua: navigator.userAgent, screen: [screen.width, screen.height, window.devicePixelRatio || 1], tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      q0: a.q0, q1: a.q1, q2: a.q2, q3: a.q3, q4: a.q4,
      q5: { letter: a.q5, route: pick(A.q56, a.q5), A: A.q56 },
      q6: { letter: a.q6, route: pick(A.q56, a.q6), A: A.q56 },
      q9: Object.fromEntries(C.q9s.map((e) => [e.eid, { level: a.q9[e.eid], lam: a.q9[e.eid] ? e.levels[a.q9[e.eid] - 1].lam : null,
        lam_lo: a.q9[e.eid] ? e.levels[a.q9[e.eid] - 1].lam_lo : null, lam_hi: a.q9[e.eid] ? e.levels[a.q9[e.eid] - 1].lam_hi : null, trip_m: e.L0 || null,
        pos: S.q9order.indexOf(e.eid) + 1, visits: (S.q9visits[e.eid] || []).length, path: (S.q9visits[e.eid] || []).map((x) => x[0]) }])),
      q8seen: Object.fromEntries(Object.entries(S.seen8).map(([sid, v]) => [sid, { A: new Set(v.A).size, B: new Set(v.B).size }])),
      timing: Object.fromEntries(Object.entries(S.timing).map(([k, t]) => [k, { ms: t.ms, first: t.first, views: t.views }])),
    };
    out.q7 = {}; out.q8 = {};
    for (const sc of C.scenarios) {
      const sid = sc.sid, Ax = A[sid], pos = S.order7.indexOf(sid) + 1;
      out.q7[sid] = { letter: a.q7[sid], route: pick(Ax, a.q7[sid]), A: Ax, cls: sc.cls, pos };
      out.q8[sid] = { letter: a.q8[sid], route: pick(Ax, a.q8[sid]), A: Ax, cls: sc.cls, pos };
    }
    return out;
  }
  async function submit(box) {
    box.replaceChildren(el('p', { class: 'center lead' }, tr('sending')));
    try {
      if (!API) throw new Error('submitUrl not configured');
      // text/plain = "simple" request: no CORS preflight, which Google Apps Script cannot answer
      const body = JSON.stringify(payload()), opt = { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body };
      const res = await fetch(API, opt);                     // 必须读到回执 {"ok":true} 才算保存成功
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      if (!j || j.ok !== true) throw new Error((j && j.error) || 'not saved');
      const m = payNorm(S.pay); delete S.pay;                  // 号码先从本机状态里移除,再单独发送
      S._sent = true; setDone(); thanks(box);
      if (m) { const st = el('div', { class: 'pay-status' }); box.insertBefore(st, box.children[3] || null); sendPay(m, st); }
    } catch (e) {
      box.replaceChildren(el('p', { class: 'err' }, tr('sendFail')), el('p', { class: 'note' }, `(${String((e && e.message) || e).slice(0, 120)})`),
        el('button', { type: 'button', class: 'next', onclick: () => submit(box) }, tr('retry')));
    }
  }
  function thanks(box) {
    box.replaceChildren(el('div', { class: 'done-icon' }, '✓'), el('h1', { class: 'center' }, tr('thanks')), el('p', { class: 'center lead' }, tr('thanksLead')),
      el('p', { class: 'center note' }, `${tr('code')}: `, el('span', { class: 'code' }, S.rid.slice(0, 8).toUpperCase())),
      reviewToggle(loadReview() || { rid: S.rid, answers: S.answers, assignA: S.assignA, order7: S.order7, q9order: S.q9order }));
  }
  // 只读回答清单
  function reviewToggle(snap) {
    if (!snap || !snap.answers) return null;
    const wrap = el('div', { class: 'review-wrap' });
    const list = el('div', { class: 'review', hidden: true });
    const btn = el('button', { type: 'button', class: 'back review-btn' }, tr('reviewBtn'));
    btn.addEventListener('click', () => {
      const show = list.hidden;
      if (show && !list.childNodes.length) list.append(...reviewItems(snap));
      list.hidden = !show; btn.textContent = tr(show ? 'reviewHide' : 'reviewBtn');
    });
    wrap.append(el('p', { class: 'center' }, btn), list);
    return wrap;
  }
  function reviewItems(snap) {
    const a = snap.answers, A = snap.assignA || {}, out = [el('h3', {}, tr('reviewTitle'))];
    const item = (q, title, ans) => out.push(el('div', { class: 'ritem' }, el('div', { class: 'rq' }, el('b', {}, q + ' '), title), el('div', { class: 'ra' }, ans || '—')));
    const opt = (key, vals, v) => { const i = vals.indexOf(v); return i >= 0 ? tr(key)[i] : null; };
    const q0 = a.q0 || {};
    const res = opt('residentOpts', RESIDENT, q0.resident);
    item('1.', tr('q0Title'), [res ? `${tr('residentShort')}${res}` : null, opt('genderOpts', GENDER, q0.gender), opt('ageOpts', AGE, q0.age)].filter(Boolean).join(' · '));
    item('2.', tr('q1Title'), opt('q1Opts', Q1V, a.q1));
    item('3.', tr('q2Title'), opt('q2Opts', Q2V, a.q2));
    item('4.', tr('q3Title'), opt('q3Opts', Q3V, a.q3));
    item('5.', tr('q4Title'), opt('q4Opts', Q4V, a.q4));
    if (a.q5) item('6.', tr('q5Title'), `${tr('route', a.q5)} — ${sideOf(A.q56, a.q5) === 'short' ? tr('q5Short') : tr('q5Cool')}`);
    if (a.q6) { const m = C.q56.routes[sideOf(A.q56, a.q6)].m; item('7.', tr('q6Title'), `${tr('route', a.q6)} — ${tr('mDist')} ${fmt(m.len)} m · ${tr('mShade')} ${m.sigma}%`); }
    const order = snap.order7 || C.scenarios.map((x) => x.sid), n = order.length;
    order.forEach((sid, k) => {
      const sc = scen(sid); if (!sc) return;
      for (const [qn, key, ttl, part] of [[`${qnum('q7')}.`, 'q7', 'q7Title', 'part3'], [`${qnum('q8')}.`, 'q8', 'q8Title', 'part3b']]) {
        const L = (a[key] || {})[sid]; if (!L) continue;
        const m = sc.routes[sideOf(A[sid], L)].m;
        item(qn, `${tr(part, k + 1, n)} — ${tr(ttl)}`, `${tr('route', L)} — ${tr('lenTime', fmt(m.len), Math.round(m.min))}`);
      }
    });
    const q9o = snap.q9order || C.q9s.map((e) => e.eid);
    q9o.forEach((eid, k) => {
      const e = C.q9s.find((x) => x.eid === eid), lvl = (a.q9 || {})[eid]; if (!e || !lvl) return;
      const m = e.levels[lvl - 1].m;
      item(`${qnum('q9')}.`, `${tr('part4', k + 1, q9o.length)} — ${tr('q9Title')}`, `${tr('q9Option', lvl)} — ${tr('q9Detour')} +${fmt(m.extra)} m (${tr('q9DetourRate')} +${m.extra_pct}%) · ${tr('q9Shade')} ${m.sigma}%`);
    });
    return out;
  }
  function rEnd() { const box = el('div'); put(box); if (S._sent) thanks(box); else submit(box); }
  function rAlready() {
    $('bottom').hidden = true;
    main.replaceChildren(el('div', { class: 'done-icon' }, '✓'), el('p', { class: 'center' }, tr('already')),
      ...[reviewToggle(loadReview())].filter(Boolean));            // 只能查看自己的答案,不提供重新作答入口
  }

  // ---------- lightbox ----------
  let LB = null;
  function openLB(gallery, i) { LB = { g: gallery, i }; showLB(); $('lightbox').hidden = false; }
  function showLB() {
    const { g, i } = LB; $('lbImg').src = g[i].src; $('lbImg').alt = g[i].cap; $('lbCap').textContent = g[i].cap;
    if (g[i].onShow) g[i].onShow();
    $('lbPrev').hidden = i === 0; $('lbNext').hidden = i === g.length - 1;
  }
  $('lbClose').addEventListener('click', () => { $('lightbox').hidden = true; });
  $('lbPrev').addEventListener('click', (e) => { e.stopPropagation(); if (LB.i > 0) { LB.i--; showLB(); } });
  $('lbNext').addEventListener('click', (e) => { e.stopPropagation(); if (LB.i < LB.g.length - 1) { LB.i++; showLB(); } });
  $('lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox' || e.target.id === 'lbImg') $('lightbox').hidden = true; });
  let tx0 = null;
  $('lightbox').addEventListener('touchstart', (e) => { tx0 = e.touches[0].clientX; }, { passive: true });
  $('lightbox').addEventListener('touchend', (e) => {
    if (tx0 == null || !LB) return; const dx = e.changedTouches[0].clientX - tx0; tx0 = null;
    if (Math.abs(dx) > 50) { if (dx < 0 && LB.i < LB.g.length - 1) LB.i++; else if (dx > 0 && LB.i > 0) LB.i--; showLB(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('lightbox').hidden = true; });

  // ---------- preload ----------
  function imgsFor(sc) {
    if (!sc) return [];
    if (sc.id.startsWith('q7_')) { const s = scen(sc.sid); return [s.map.img, s.routes.short.start, s.routes.cool.start]; }
    if (sc.id.startsWith('q8_')) { const s = scen(sc.sid); return [...s.routes.short.seq.slice(0, 2), ...s.routes.cool.seq.slice(0, 2)]; }
    if (sc.id === 'q6') return [C.q56.map.img];
    if (sc.id.startsWith('q9_')) { const e = C.q9s.find((x) => x.eid === sc.eid); return e.map ? [e.map.img] : []; }
    if (sc.id === 'q1') return C.facilities.map((f) => f.img);
    if (sc.id === 'q2') return C.facilities.map((f) => f.img_hl || f.img);
    return [];
  }
  function preloadAhead() {
    for (const sc of screens.slice(S.idx + 1, S.idx + 3)) {
      if (sc.id.startsWith('q8_')) continue;   // 全程照片只在进入 Q8 后才加载,Q7 作答时浏览器里没有任何全程图片
      for (const src of imgsFor(sc)) { const im = new Image(); im.src = src; }
    }
  }

  // ---------- boot ----------
  $('next').addEventListener('click', next);
  $('back').addEventListener('click', back);
  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
    if (!S || S.lang === b.dataset.lang) return;
    S.lang = b.dataset.lang; S.langSwitches += 1; leave(); render();
  }));
  history.pushState({ s: 1 }, '', location.href);
  window.addEventListener('popstate', () => { history.pushState({ s: 1 }, '', location.href); if (S && screens.length) back(); });   // 手机返回键 = 上一题

  async function boot(fresh) {
    if (!C) {
      try { const r = await fetch('content.json?v=' + VERSION, { cache: 'no-cache' }); C = await r.json(); }
      catch (e) { main.replaceChildren(el('p', { class: 'err' }, I18N.loadFail.en + ' / ' + I18N.loadFail.zh)); $('bottom').hidden = true; return; }
    }
    const old = fresh ? null : load();
    if (old && old.v === VERSION && old.rid) { S = old; S._resumed = S.idx > 0; }
    else { S = newState(); }
    if (!fresh && !old && isDone()) { S = newState(); $('brand').textContent = tr('brand'); rAlready(); return; }
    buildScreens();
    if (S.idx >= screens.length - 1) S.idx = screens.length - 1;   // resume on the submit screen -> retries submission
    render(); preloadAhead();
  }
  boot(false);
})();
