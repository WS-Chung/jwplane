/*
  하늘 친구들 - 화면 그리기와 화면 이동
  주소 뒤 # 로 화면을 나눠요.
    #/                 처음 화면
    #/fighters         전투기 목록,  #/fighters/kf21  전투기 자세히
    #/airliners        여객기 목록,  #/airliners/a380 여객기 자세히
    #/job/pilot/2      직업 (pilot, controller, mechanic) 의 2번째 장
    #/size/3           크기 비교 3번째 비행기
    #/size/vs/f16/b747 골라서 비교하기 (고른 비행기 2대)
*/
(function () {
  "use strict";

  const P = window.PLANES;
  const C = window.COUNTRIES;
  const J = window.JOBS;
  const META = window.IMAGE_META || { canvas: { w: 1600, h: 800 }, planes: {} };

  const app = document.getElementById("app");
  const titleEl = document.getElementById("page-title");
  const speakBtn = document.getElementById("speak-btn");

  // 아이에게 익숙한 것과 비교하기 위한 기준값
  const CAR_SPEED = 100;    // 고속도로 자동차 시속 100km
  const SOUND_SPEED = 1225; // 소리 빠르기 시속 약 1,225km
  const BUS_SEATS = 45;     // 버스 한 대 = 45명
  const BUS_LENGTH = 12;    // 버스 한 대 길이 = 12m
  const FLOOR_HEIGHT = 2.8; // 아파트 한 층 높이 = 2.8m
  // 크기 비교 화면 활주로 위에 나란히 서 있는 아이들 (이 페이지를 보는 아이 이름과 키)
  const KIDS = [
    { name: "정우", height: 1.2, cls: "boy", svg: "" },   // 남자아이 120cm
    { name: "정연", height: 1.1, cls: "girl", svg: "" },  // 여자아이 110cm
  ];
  const MAX_SPEED = Math.max(...Object.values(P).map((p) => p.speed));
  const JOB_KEYS = ["pilot", "controller", "mechanic"];

  let nav = null;     // 지금 화면의 ◀ ▶ 동작 (키보드·밀기에서 사용)
  let cleanup = null; // 화면을 떠날 때 정리할 일

  // ───────── 작은 도우미 ─────────
  const imgSrc = (id, thumb) => `images/planes/${thumb ? "thumbs/" : ""}${id}.png`;
  const fmt = (n) => n.toLocaleString("ko-KR");
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const flag = (code) => `<img class="flag" src="${C[code].flag}" alt="${C[code].name} 국기">`;
  const countryName = (p) => p.countryText || p.country.map((c) => C[c].name).join("·");
  const listOf = (kind) => (kind === "fighters" ? window.FIGHTERS : window.AIRLINERS);
  const box = (id) => META.planes[id] || { x: 0, y: 0, w: META.canvas.w, h: META.canvas.h };

  // 1600x800 캔버스 중 기체가 있는 부분만 보이게 잘라서 그리기 (원본 그림은 그대로, 보여주는 크기만 다르게)
  function planeImg(id, { thumb = false, alt = "", width = "", cls = "" } = {}) {
    const b = box(id);
    const cw = META.canvas.w;
    const r = (b.w / b.h).toFixed(4);
    const imgStyle = `width:${(cw / b.w) * 100}%;left:${(-b.x / b.w) * 100}%;top:${(-b.y / b.h) * 100}%`;
    return `<span class="crop ${cls}" style="--r:${r};${width ? `width:${width}` : ""}">` +
      `<img src="${imgSrc(id, thumb)}" alt="${alt}" style="${imgStyle}"></span>`;
  }

  function setTitle(t) {
    titleEl.textContent = t;
    document.title = t === "하늘 친구들" ? "하늘 친구들 ✈️" : `${t} - 하늘 친구들`;
  }

  // ───────── 읽어주기 ─────────
  // 1순위: 미리 만들어 둔 MeloTTS 음성 파일 (audio/<key>.mp3, 목록은 js/voice.js). 여러 조각을 차례로 이어서 재생.
  // 2순위: 음성 파일이 없는 문장만 브라우저 내장 음성(Web Speech)으로 읽기.
  // 문장 내용은 아래 "읽어주기 문장"의 lineText(key)에서 만들어요.
  const VOICE = window.VOICE || { base: "audio/", clips: {} };
  const Speech = {
    web: "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
    voice: null,
    keys: [],      // 🔊 버튼을 누르면 읽을 문장 조각들
    queue: [],     // 재생을 기다리는 음성 파일 조각
    current: null,
    audio: null,
    init() {
      if (!Object.keys(VOICE.clips).length && !this.web) { speakBtn.hidden = true; return; }
      if (this.web) {
        const pick = () => {
          const ko = speechSynthesis.getVoices().filter((v) => /^ko/i.test(v.lang));
          // 더 자연스러운 목소리(Natural/Online)가 있으면 먼저 고름
          this.voice = ko.find((v) => /natural|online|neural/i.test(v.name)) || ko[0] || null;
        };
        pick();
        speechSynthesis.addEventListener("voiceschanged", pick);
      }
      speakBtn.addEventListener("click", () => {
        if (speakBtn.classList.contains("speaking")) this.stop();
        else this.say(this.keys);
      });
      // 휴대폰(특히 아이폰)은 화면을 누른 순간에만 소리를 낼 수 있어요. 고르기 우승처럼 조금 뒤에 저절로 나오는
      // 소리도 나도록, 처음 화면을 누를 때 재생기를 소리 없이 한 번 깨워 둠
      const unlock = () => {
        document.removeEventListener("pointerdown", unlock, true);
        const first = Object.keys(VOICE.clips)[0];
        if (!first || this.current) return;
        const a = this.audio || (this.audio = new Audio());
        const token = (this.unlocking = {});
        a.muted = true;
        a.src = `${VOICE.base}${first}.mp3?v=${VOICE.clips[first]}`;
        // 그사이 진짜 읽어주기가 시작됐으면(token이 바뀜) 건드리지 않음
        a.play().then(() => { if (this.unlocking === token) a.pause(); }).catch(() => {})
          .finally(() => { if (this.unlocking === token) { a.muted = false; this.unlocking = null; } });
      };
      document.addEventListener("pointerdown", unlock, true);
    },
    clean(t) {
      return t
        .replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, "")
        .replace(/[‘’“”"]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    },
    has: (k) => !!VOICE.clips[k],
    say(keys) {
      keys = [].concat(keys || []).filter(Boolean);
      if (!keys.length) return;
      this.stop();
      if (keys.every(this.has)) this.playClips(keys);
      else this.speakWeb(keys.map(lineText).join(" "));
    },
    playClips(keys) {
      const a = this.audio || (this.audio = new Audio());
      this.unlocking = null;
      this.queue = keys.slice();
      const done = () => { this.current = null; speakBtn.classList.remove("speaking"); };
      const next = () => {
        this.current = this.queue.shift();
        if (!this.current) { done(); return; }
        a.src = `${VOICE.base}${this.current}.mp3?v=${VOICE.clips[this.current]}`;
        a.muted = false;
        a.play().catch(() => { this.queue = []; done(); }); // 자동 재생이 막히면 조용히 멈춤
      };
      a.onended = next;
      a.onerror = () => {
        // 파일을 못 불러오면 남은 조각은 브라우저 음성으로
        const rest = [this.current, ...this.queue].filter(Boolean);
        this.queue = [];
        done();
        this.speakWeb(rest.map(lineText).join(" "));
      };
      speakBtn.classList.add("speaking");
      next();
    },
    speakWeb(t) {
      if (!this.web || !t) return;
      if (!this.voice && speechSynthesis.getVoices().length) {
        toast("이 컴퓨터에는 한국어 읽어주기 목소리가 없어요 😢");
        return;
      }
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(this.clean(t));
      u.lang = "ko-KR";
      if (this.voice) u.voice = this.voice;
      u.rate = 0.95;
      u.pitch = 1.1;
      u.onstart = () => speakBtn.classList.add("speaking");
      u.onend = u.onerror = () => speakBtn.classList.remove("speaking");
      speechSynthesis.speak(u);
    },
    stop() {
      this.queue = [];
      this.current = null;
      if (this.audio) { this.audio.onended = this.audio.onerror = null; this.audio.pause(); }
      if (this.web) speechSynthesis.cancel();
      speakBtn.classList.remove("speaking");
    },
    set(keys) { this.keys = [].concat(keys || []); },
  };

  // ───────── 약속 도장 저장 (브라우저에 보관) ─────────
  const Store = {
    key: "skyfriends.promises.v1",
    get() {
      try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch { return {}; }
    },
    set(v) {
      try { localStorage.setItem(this.key, JSON.stringify(v)); } catch { /* 저장이 안 되는 환경이면 무시 */ }
    },
  };
  const hasBadge = (key, done = Store.get()) => (done[key] || []).length >= J[key].promises.length;

  function toast(msg) {
    const t = document.createElement("div");
    t.className = "celebrate";
    t.innerHTML = `<div class="celebrate-box"><p>${msg}</p><button class="big-btn">알겠어요</button></div>`;
    t.querySelector("button").addEventListener("click", () => t.remove());
    document.body.appendChild(t);
    t.querySelector("button").focus();
  }

  function confetti(n = 36) {
    const items = ["🎉", "✨", "⭐", "🎈", "✈️", "💙"];
    for (let k = 0; k < n; k++) {
      const s = document.createElement("span");
      s.className = "confetti";
      s.textContent = items[k % items.length];
      s.style.left = Math.random() * 100 + "vw";
      s.style.animationDuration = 2.2 + Math.random() * 2 + "s";
      s.style.animationDelay = Math.random() * 0.8 + "s";
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 5200);
    }
  }

  // ───────── 처음 화면 ─────────
  function menuCard(href, accent, art, title, sub, artClass = "") {
    return `<a class="menu-card" href="${href}" style="--accent:${accent}">
      <span class="menu-art ${artClass}" aria-hidden="true">${art}</span>
      <span class="menu-title">${title}</span>
      <span class="menu-sub">${sub}</span>
    </a>`;
  }

  function viewHome() {
    setTitle("하늘 친구들");
    const done = Store.get();
    const jobCards = JOB_KEYS.map((k) =>
      menuCard(`#/job/${k}`, J[k].color, `<span class="emoji">${J[k].emoji}</span>`, J[k].easy, `${J[k].title}가 하는 일`)
    ).join("");
    app.innerHTML = `
      <section class="home">
        <div class="hero">
          <span class="hero-plane" aria-hidden="true">✈️</span>
          <h2>하늘 친구들</h2>
          <p>어디로 날아가 볼까요?</p>
        </div>
        <div class="menu-group">
          <h3 class="menu-group-title">✈️ 비행기랑 놀기</h3>
          <nav class="menu-grid" aria-label="비행기 메뉴">
            ${menuCard("#/fighters", "var(--c-fighter)", planeImg("t50b", { thumb: true }), "하늘을 지키는 비행기", "전투기 구경")}
            ${menuCard("#/airliners", "var(--c-airliner)", planeImg("a380", { thumb: true }), "사람을 태우는 비행기", "여객기 구경")}
            ${menuCard("#/size", "var(--c-size)", planeImg("c172", { thumb: true, width: "16%" }) + planeImg("a380", { thumb: true, width: "72%" }), "누가 누가 클까?", "비행기 크기 비교", "size-art")}
            ${menuCard("#/cup", "var(--c-cup)", vsArt("f16", "a380", true), "최고의 비행기 고르기", "누가 더 멋있나?", "vs-art")}
          </nav>
        </div>
        <div class="menu-group">
          <h3 class="menu-group-title">🧑‍✈️ 하늘에서 일하는 사람들을 알아봐요</h3>
          <nav class="menu-grid" aria-label="직업 메뉴">${jobCards}</nav>
        </div>
        <div class="badge-shelf" aria-label="내 배지">
          <h3>🏅 내 배지</h3>
          ${JOB_KEYS.map((k) => `
            <div class="badge ${hasBadge(k, done) ? "earned" : ""}">
              <span class="medal" aria-hidden="true">${J[k].badge.emoji}</span>
              <span>${hasBadge(k, done) ? J[k].badge.name : "아직 없어요"}</span>
            </div>`).join("")}
        </div>
      </section>`;
    Speech.set("w/home");
  }

  // 비행기 두 대가 마주 보는 "VS" 그림 (왼쪽 비행기는 오른쪽을 보도록 뒤집음)
  function vsArt(leftId, rightId, thumb = false) {
    return planeImg(leftId, { thumb, cls: "mirror", width: "42%" }) +
      `<b class="vs-mark" aria-hidden="true">VS</b>` +
      planeImg(rightId, { thumb, width: "42%" });
  }

  // ───────── 비행기 목록 ─────────
  function viewGallery(kind) {
    const fighter = kind === "fighters";
    const title = fighter ? "하늘을 지키는 비행기" : "사람을 태우는 비행기";
    setTitle(title);
    app.innerHTML = `
      <section>
        <h2 class="section-title">${fighter ? "🛡️" : "✈️"} ${title} <small>${fighter ? "전투기" : "여객기"}</small></h2>
        <div class="card-grid">
          ${listOf(kind).map((id) => `
            <a class="plane-card" href="#/${kind}/${id}">
              <span class="thumb-box">${planeImg(id, { thumb: true })}</span>
              <span class="name">${flag(P[id].country[0])} ${P[id].name}</span>
            </a>`).join("")}
        </div>
      </section>`;
    Speech.set(`w/gallery-${kind}`);
  }

  // ───────── 비행기 자세히 ─────────
  function peopleFact(p, fighter) {
    if (p.cargo) {
      return { icons: "🧑‍✈️🧑‍✈️📦", big: `조종사 ${p.people}명`, small: "사람 대신 커다란 짐을 실어요",
        say: `조종사 ${p.people}명이 타고, 사람 대신 커다란 짐을 실어요.` };
    }
    if (fighter || p.people <= 4) {
      const who = fighter ? "조종사" : "";
      return { icons: (fighter ? "🧑‍✈️" : "🧑").repeat(p.people), big: `${who} ${p.people}명`.trim(), small: "",
        say: `${who} ${p.people}명이 타요.`.trim() };
    }
    const bus = Math.max(1, Math.round(p.people / BUS_SEATS));
    // 정확한 좌석 수 대신 10명 단위 어림수로 (예: 407 → 410명, 189 → 190명). "약"은 붙이지 않음
    const n = Math.round(p.people / 10) * 10;
    return { icons: "🚌".repeat(Math.min(bus, 10)), big: `${fmt(n)}명`, small: `버스 ${bus}대에 탄 사람만큼`,
      say: `${n}명이 탈 수 있어요. 버스 ${bus}대에 탄 사람만큼이에요.` };
  }

  function speedFact(p) {
    const times = Math.max(1, Math.round(p.speed / CAR_SPEED));
    const sonic = p.speed > SOUND_SPEED;
    return {
      big: `자동차보다 ${times}배 빨라요`,
      small: `시속 ${fmt(p.speed)}km`,
      sonic,
      say: `자동차보다 ${times}배 빨라요.${sonic ? " 소리보다도 빨라요!" : ""}`,
    };
  }

  function viewDetail(kind, id) {
    const list = listOf(kind);
    const i = list.indexOf(id);
    if (i < 0) { location.replace(`#/${kind}`); return; }
    const p = P[id];
    const prevId = list[(i - 1 + list.length) % list.length];
    const nextId = list[(i + 1) % list.length];
    setTitle(p.name);

    app.innerHTML = `
      <section class="detail">
        <button class="nav-arrow prev" aria-label="앞 비행기">◀</button>
        <article class="detail-card">${detailCardHtml(kind, id)}</article>
        <button class="nav-arrow next" aria-label="다음 비행기">▶</button>
        <div class="detail-counter">${i + 1} / ${list.length} · <a href="#/${kind}">목록으로</a></div>
      </section>`;

    // 20대 중 설명이 가장 긴 비행기에 맞춰 카드 높이를 고정 (◀ ▶ 버튼이 흔들리지 않게)
    const card = app.querySelector(".detail-card");
    const lock = () => lockHeight(card, `detail/${kind}`, () => list.map((x) => detailCardHtml(kind, x)));
    lock();
    whenFontsReady(lock);
    window.addEventListener("resize", lock);
    cleanup = () => window.removeEventListener("resize", lock);

    // 빠르기 막대가 쭉 늘어나는 효과
    requestAnimationFrame(() => requestAnimationFrame(() => {
      app.querySelectorAll(".bar").forEach((b) => { b.style.width = Math.max(2, +b.dataset.w) + "%"; });
    }));
    // 다음/앞 비행기 사진 미리 불러오기
    [prevId, nextId].forEach((n) => { new Image().src = imgSrc(n); });

    nav = {
      prev: () => location.replace(`#/${kind}/${prevId}`),
      next: () => location.replace(`#/${kind}/${nextId}`),
    };
    app.querySelector(".prev").addEventListener("click", nav.prev);
    app.querySelector(".next").addEventListener("click", nav.next);

    Speech.set(`detail/${id}`);
  }

  // 자세히 보기 카드 안쪽 (사진, 이름, 몇 명·빠르기·나라, 특징)
  function detailCardHtml(kind, id) {
    const p = P[id];
    const people = peopleFact(p, kind === "fighters");
    const speed = speedFact(p);
    const chips = [
      p.airline ? `<span class="chip">✈️ ${p.airline}</span>` : "",
      p.tag ? `<span class="chip hot">⭐ ${p.tag}</span>` : "",
    ].join("");
    return `
          <div class="detail-photo">${planeImg(id, { alt: `${p.name} 사진` })}</div>
          <h2 class="detail-name">${p.name}</h2>
          <p class="detail-nick">${p.nick}</p>
          ${chips ? `<div class="chips">${chips}</div>` : ""}
          <div class="facts">
            <div class="fact">
              <div class="fact-q">👥 몇 명이 타요?</div>
              <div class="fact-icons" aria-hidden="true">${people.icons}</div>
              <div class="fact-big">${people.big}</div>
              ${people.small ? `<div class="fact-small">${people.small}</div>` : ""}
            </div>
            <div class="fact">
              <div class="fact-q">⚡ 얼마나 빨라요?</div>
              <div class="speed-race" aria-hidden="true">
                <span class="who">🚗</span><span class="track"><span class="bar car" data-w="${(CAR_SPEED / MAX_SPEED) * 100}"></span></span>
                <span class="who">✈️</span><span class="track"><span class="bar" data-w="${(p.speed / MAX_SPEED) * 100}"></span></span>
              </div>
              <div class="fact-big">${speed.big}</div>
              <div class="fact-small">${speed.small}</div>
              ${speed.sonic ? `<span class="sonic">💨 소리보다 빨라요!</span>` : ""}
            </div>
            <div class="fact">
              <div class="fact-q">🌏 어느 나라에서 만들었어요?</div>
              <div class="fact-flags">${p.country.map(flag).join("")}</div>
              <div class="fact-big">${countryName(p)}</div>
            </div>
          </div>
          <p class="detail-feature">⭐ ${p.feature}</p>`;
  }

  function detailSay(id) {
    const p = P[id];
    const people = peopleFact(p, window.FIGHTERS.includes(id));
    return `${p.name}. ${p.nick}. ${people.say} ${speedFact(p).say} ${countryName(p)}에서 만들었어요. ${p.feature}`;
  }

  // ───────── 넘기기 화면 카드 높이 고정 ─────────
  // 장마다 글 길이가 달라 카드 높이가 바뀌면 ◀ ▶ 버튼이 위아래로 흔들려요. 그래서 같은 화면의 모든 장을
  // 보이지 않는 곳에 한 번씩 그려 보고, 가장 긴 장의 높이를 카드의 최소 높이로 정해요.
  // (화면 폭·높이·글꼴 준비 상태마다 한 번만 재고 기억해 둠)
  const heightCache = new Map();
  function lockHeight(el, key, variants) {
    if (!el || !el.isConnected) return;
    const w = el.offsetWidth; // 커지는 애니메이션(transform) 영향을 받지 않는 실제 폭
    const ck = `${key}|${w}|${innerHeight}|${document.fonts ? document.fonts.status : ""}`;
    if (!heightCache.has(ck)) {
      const probe = el.cloneNode(false);
      probe.removeAttribute("id");
      probe.setAttribute("aria-hidden", "true");
      Object.assign(probe.style, { position: "absolute", left: "-10000px", top: "0", width: `${w}px`,
        minHeight: "", visibility: "hidden", pointerEvents: "none", animation: "none" });
      el.parentNode.appendChild(probe);
      let max = 0;
      for (const html of variants()) {
        // 재기만 하는 그림은 내려받지 않게 (크기는 CSS가 정함)
        probe.innerHTML = html.replace(/ src="images\/planes\/[^"]*"/g, "");
        max = Math.max(max, probe.offsetHeight);
      }
      probe.remove();
      heightCache.set(ck, max);
    }
    el.style.minHeight = `${heightCache.get(ck)}px`;
  }
  function whenFontsReady(fn) {
    if (document.fonts && document.fonts.status !== "loaded") document.fonts.ready.then(fn);
  }

  // ───────── 넘기기 화면 공통 (점, 화살표) ─────────
  function slideNav(count) {
    return `<div class="slide-nav">
      <button class="nav-arrow prev" aria-label="앞 장">◀</button>
      <div class="dots">${Array.from({ length: count }, (_, k) => `<button class="dot" data-k="${k}" aria-label="${k + 1}번째 장"></button>`).join("")}</div>
      <button class="nav-arrow next" aria-label="다음 장">▶</button>
    </div>`;
  }

  function bindSlideNav(root, count, show, getIndex) {
    const prev = root.querySelector(".slide-nav .prev");
    const next = root.querySelector(".slide-nav .next");
    const dots = [...root.querySelectorAll(".dot")];
    prev.addEventListener("click", () => show(getIndex() - 1));
    next.addEventListener("click", () => show(getIndex() + 1));
    dots.forEach((d) => d.addEventListener("click", () => show(+d.dataset.k)));
    return (i) => {
      prev.disabled = i <= 0;
      next.disabled = i >= count - 1;
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
    };
  }

  // ───────── 직업 ─────────
  const jobSlides = (key) => [
    { type: "intro" },
    ...J[key].scenes.map((s, n) => ({ type: "scene", s, n })),
    { type: "promise" }, // 나도 될래요! (학교·시험 같은 어른 이야기 대신 오늘부터 할 수 있는 약속만)
  ];
  function jobSay(key, i) {
    const j = J[key];
    const sl = jobSlides(key)[i];
    if (sl.type === "intro") return `${j.title}. ${j.easy}. ${j.intro}`;
    if (sl.type === "scene") return `${sl.s.title}. ${sl.s.text}`;
    return `${j.title}가 되고 싶다면 이렇게 약속해요. ${j.promises.map((pr) => `${pr.title}. ${pr.text}`).join(" ")}`;
  }

  function viewJob(key, start) {
    const j = J[key];
    const slides = jobSlides(key);
    let i = clamp(start, 0, slides.length - 1);
    setTitle(`${j.title} · ${j.easy}`);
    app.innerHTML = `<section class="slides" style="--accent:${j.color}"><div id="slide"></div>${slideNav(slides.length)}</section>`;
    const holder = app.querySelector("#slide");
    const updateNav = bindSlideNav(app, slides.length, (n) => show(n), () => i);

    function render(sl) {
      if (sl.type === "intro") {
        return {
          html: `<div class="slide-kicker">누구예요?</div>
            ${j.photo
              ? `<figure class="job-photo">
                  <img src="${j.photo}" alt="${j.photoCaption}">
                  <span class="job-photo-emoji" aria-hidden="true">${j.emoji}</span>
                  <figcaption>${j.photoCaption}</figcaption>
                </figure>`
              : `<div class="slide-emoji" aria-hidden="true">${j.emoji}</div>`}
            <h2 class="slide-title">${j.title}</h2>
            <p class="slide-sub">${j.easy}</p>
            <p class="slide-text">${j.intro}</p>`,
        };
      }
      if (sl.type === "scene") {
        return {
          html: `<div class="slide-kicker">이럴 때 이런 일을 해요 (${sl.n + 1}/${j.scenes.length})</div>
            <div class="slide-emoji" aria-hidden="true">${sl.s.emoji}</div>
            <h2 class="slide-title">${sl.s.title}</h2>
            <p class="slide-text">${sl.s.text}</p>`,
        };
      }
      const done = Store.get()[key] || [];
      return {
        html: `<div class="slide-kicker">나도 될래요!</div>
          <h2 class="slide-title">${j.title}가 되고 싶다면!</h2>
          <p class="promise-hint">약속할 수 있으면 눌러서 도장을 꾹 찍어요 👆</p>
          <div class="promise-grid">
            ${j.promises.map((pr, n) => `
              <button class="promise ${done.includes(n) ? "done" : ""}" data-n="${n}" aria-pressed="${done.includes(n)}">
                <span class="p-emoji" aria-hidden="true">${pr.emoji}</span>
                <span><span class="p-title">${pr.title}</span>${pr.text}</span>
                <span class="stamp" aria-hidden="true">약속!</span>
              </button>`).join("")}
          </div>`,
      };
    }

    function bindPromises() {
      holder.querySelectorAll(".promise").forEach((btn) => {
        btn.addEventListener("click", () => {
          const n = +btn.dataset.n;
          const all = Store.get();
          const had = hasBadge(key, all);
          const set = new Set(all[key] || []);
          if (set.has(n)) set.delete(n); else set.add(n);
          all[key] = [...set];
          Store.set(all);
          const on = set.has(n);
          btn.classList.toggle("done", on);
          btn.setAttribute("aria-pressed", on);
          if (on) Speech.say(`promise/${key}/${n}`);
          if (!had && hasBadge(key, all)) celebrate(key);
        });
      });
    }

    function show(n) {
      i = clamp(n, 0, slides.length - 1);
      const r = render(slides[i]);
      holder.innerHTML = `<div class="slide-card">${r.html}</div>`;
      lock();
      if (slides[i].type === "promise") bindPromises();
      updateNav(i);
      history.replaceState(null, "", `#/job/${key}/${i}`);
      Speech.stop();
      Speech.set(`job/${key}/${i}`);
    }
    // 이 직업의 모든 장 중 가장 긴 장에 맞춰 카드 높이 고정 (◀ ▶ 버튼이 흔들리지 않게)
    const lock = () => lockHeight(holder.firstElementChild, `job/${key}`, () => slides.map((sl) => render(sl).html));

    nav = { prev: () => show(i - 1), next: () => show(i + 1) };
    show(i);
    whenFontsReady(lock);
    window.addEventListener("resize", lock);
    cleanup = () => window.removeEventListener("resize", lock);
  }

  function celebrate(key) {
    const j = J[key];
    confetti();
    const box = document.createElement("div");
    box.className = "celebrate";
    box.style.setProperty("--accent", j.color);
    box.innerHTML = `<div class="celebrate-box" role="dialog" aria-label="배지 받기">
      <div class="medal-big" aria-hidden="true">${j.badge.emoji}</div>
      <h2>${j.badge.name}를 받았어요!</h2>
      <p>약속을 모두 지키면 멋진 ${j.title}가 될 수 있어요.</p>
      <button class="big-btn">고마워요!</button>
    </div>`;
    box.querySelector("button").addEventListener("click", () => box.remove());
    document.body.appendChild(box);
    box.querySelector("button").focus();
    Speech.say(`badge/${key}`);
  }

  // ───────── 누가 누가 클까? (크기 비교) ─────────
  const SIZE_NOTES = {
    c172: "제일 작은 비행기부터 출발! 활주로 위에 서 있는 정우와 정연이도 찾아보세요.",
    atr72: "이제부터는 사람을 태우는 비행기예요!",
    concorde: "길쭉하고 날씬하죠? 그래서 키는 작아요.",
    b747: "엄청 크죠? 그런데 아직 하나 더 남았어요!",
    a380: "짜잔! 사람을 태우는 비행기 중에서 세상에서 제일 커요. 747과 길이는 비슷하지만 키가 훨씬 크고, 2층이에요!",
  };

  // 아이 그림 (가로 40 × 세로 100 칸). 정우: 짧은 머리·파란 티셔츠, 정연: 양갈래 머리·분홍 원피스
  KIDS[0].svg = `<svg viewBox="0 0 40 100" preserveAspectRatio="none" aria-hidden="true">
      <rect x="10.5" y="60" width="8" height="36" rx="4" fill="#3d5a80"/>
      <rect x="21.5" y="60" width="8" height="36" rx="4" fill="#3d5a80"/>
      <ellipse cx="14" cy="97" rx="5.5" ry="3" fill="#2b2b2b"/>
      <ellipse cx="26" cy="97" rx="5.5" ry="3" fill="#2b2b2b"/>
      <path d="M8 34 Q20 24 32 34 L30 63 L10 63 Z" fill="#4f8ef7"/>
      <rect x="3.5" y="34" width="5" height="22" rx="2.5" fill="#ffcf9e" transform="rotate(8 6 34)"/>
      <rect x="31.5" y="34" width="5" height="22" rx="2.5" fill="#ffcf9e" transform="rotate(-8 34 34)"/>
      <circle cx="20" cy="14" r="11" fill="#ffcf9e"/>
      <path d="M8.8 13 Q9 2 20 2 Q31 2 31.2 13 Q27 7.5 20 8.5 Q13 7.5 8.8 13 Z" fill="#3b2a20"/>
      <circle cx="16" cy="15" r="1.4" fill="#2b2b2b"/><circle cx="24" cy="15" r="1.4" fill="#2b2b2b"/>
      <path d="M16.5 19 Q20 21.5 23.5 19" stroke="#c0573e" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    </svg>`;
  KIDS[1].svg = `<svg viewBox="0 0 40 100" preserveAspectRatio="none" aria-hidden="true">
      <rect x="13" y="64" width="5" height="32" rx="2.5" fill="#ffcf9e"/>
      <rect x="22" y="64" width="5" height="32" rx="2.5" fill="#ffcf9e"/>
      <ellipse cx="15" cy="97" rx="5" ry="3" fill="#c2185b"/>
      <ellipse cx="25" cy="97" rx="5" ry="3" fill="#c2185b"/>
      <path d="M11 33 Q20 25 29 33 L36 68 L4 68 Z" fill="#ff7eb6"/>
      <rect x="4.5" y="34" width="4.5" height="20" rx="2.2" fill="#ffcf9e" transform="rotate(12 7 34)"/>
      <rect x="31" y="34" width="4.5" height="20" rx="2.2" fill="#ffcf9e" transform="rotate(-12 33 34)"/>
      <circle cx="5.5" cy="17" r="4.5" fill="#3b2a20"/><circle cx="34.5" cy="17" r="4.5" fill="#3b2a20"/>
      <circle cx="20" cy="15" r="11" fill="#ffcf9e"/>
      <path d="M8.8 15 Q8 2.5 20 3 Q32 2.5 31.2 15 Q29 9 24 8 Q21 11 14 10 Q10 11 8.8 15 Z" fill="#3b2a20"/>
      <circle cx="29" cy="6.5" r="3" fill="#ff4f9a"/>
      <circle cx="16" cy="16" r="1.4" fill="#2b2b2b"/><circle cx="24" cy="16" r="1.4" fill="#2b2b2b"/>
      <circle cx="13.5" cy="19.5" r="1.8" fill="#ffa4a4" opacity=".7"/><circle cx="26.5" cy="19.5" r="1.8" fill="#ffa4a4" opacity=".7"/>
      <path d="M17 20 Q20 22.5 23 20" stroke="#c0573e" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    </svg>`;

  // 크기 비교 화면 위쪽: 제목 + "차례대로 보기 / 골라서 비교하기" 바꾸기 버튼 (+ 화면별 도구)
  function sizeTop(mode, extra = "") {
    const tab = (m, href, label) =>
      `<a class="mode-btn" href="${href}" ${mode === m ? 'aria-current="page"' : ""}>${label}</a>`;
    return `
      <div class="size-top">
        <h2 class="section-title">📏 누가 누가 클까? <small>비행기 크기 비교</small></h2>
        <div class="size-tools">
          <nav class="size-modes" aria-label="크기 비교 방법">
            ${tab("order", "#/size/0", "📏 차례대로 보기")}
            ${tab("vs", "#/size/vs", "👆 골라서 비교하기")}
          </nav>
          ${extra}
        </div>
      </div>`;
  }

  // 무대 크기와 비행기 목록으로 축척(1m = ppm px)을 정함. 목록에서 가장 큰 비행기가 무대에 꼭 맞도록
  function stageScale(stage, ids) {
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const groundH = Math.max(30, Math.round(H * 0.09));
    stage.style.setProperty("--ground-h", groundH + "px");
    const groundY = H - Math.round(groundH * 0.55);
    const usableH = groundY - 64; // 위쪽에 안내 문구 자리
    let ppm = Infinity;
    ids.forEach((id) => {
      const b = box(id);
      const L = viewLength(id);
      ppm = Math.min(ppm, (W * 0.94) / L, usableH / ((L * b.h) / b.w));
    });
    return { W, groundY, ppm };
  }

  // 크기 비교 그림에서만 쓰는 '보이는 크기' 예외.
  // 747은 실제 길이가 A380과 비슷하지만(70.7m, 72.7m) 꼬리가 높고 머리 위 혹이 커서 A380보다 커 보이는 착시가 있어요.
  // 그래서 크기 비교 그림(차례대로 보기·골라서 비교하기)에서만 88% 크기로 그려요.
  // 화면에 적는 길이·높이 숫자, 설명 문장, 자세히 보기 화면은 실제 값 그대로예요.
  const SIZE_VIEW_SCALE = { b747: 0.88 };
  const viewLength = (id) => P[id].length * (SIZE_VIEW_SCALE[id] || 1);

  // 비행기 그림(1600x800 캔버스)을 실제 길이 비율 크기로 무대 가운데 땅 위에 놓음. 기체 부분의 왼쪽 끝·폭을 돌려줌
  function placePlane(els, id, { W, groundY, ppm }) {
    const b = box(id);
    const cw = META.canvas.w;
    const ch = META.canvas.h;
    const planeW = viewLength(id) * ppm;      // 화면에서 기체 길이(px)
    const w = (planeW * cw) / b.w;            // 이미지 전체 폭(px)
    const h = (w * ch) / cw;
    const left = W / 2 - ((b.x + b.w / 2) / cw) * w;
    const top = groundY - ((b.y + b.h) / ch) * h;
    els.forEach((el) => {
      el.style.left = left + "px";
      el.style.top = top + "px";
      el.style.width = w + "px";
      el.style.height = h + "px";
    });
    return { left: left + (b.x / cw) * w, width: planeW };
  }

  // 활주로 위 어린이(정우·정연)를 비행기와 같은 축척으로 나란히 그림
  function kidsHtml(hidden = false) {
    return `<div class="kids" id="kids" ${hidden ? "hidden" : ""}>
      <span class="kids-label">${KIDS.map((k) => k.name).join(" · ")}</span>
      ${KIDS.map((k) => `<div class="kid ${k.cls}"><span class="kid-label">${k.name}</span>${k.svg}</div>`).join("")}
    </div>`;
  }
  function sizeKids(el, { groundY, ppm }) {
    const tallest = Math.max(...KIDS.map((k) => k.height)) * ppm;
    [...el.querySelectorAll(".kid svg")].forEach((svg, n) => {
      const h = KIDS[n].height * ppm;
      svg.style.height = h + "px";
      svg.style.width = h * 0.4 + "px";   // 그림 비율(40x100) 그대로
    });
    const gap = Math.max(2, 0.12 * ppm);  // 두 아이 사이 12cm
    el.style.gap = gap + "px";
    el.style.top = groundY - tallest + "px";
    el.style.height = tallest + "px";
    // 아이 그림이 작아서 이름표 두 개가 겹치면 "정우 · 정연" 하나로
    el.classList.toggle("tiny", (0.4 * 1.15 * ppm + gap) < 44);
  }
  function kidsBeside(el, planeLeft) {
    const left = Math.max(6, planeLeft - el.offsetWidth - 10);
    el.style.left = left + "px";
    el.classList.toggle("edge", left < 30); // 무대 왼쪽 끝이면 이름표가 잘리지 않게 오른쪽으로
  }

  // 차례대로 보기 i번째 장의 설명 (화면 글씨와 읽어주기에서 함께 씀)
  function sizeFacts(i) {
    const order = window.SIZE_ORDER;
    const id = order[i];
    const p = P[id];
    const prev = i > 0 ? P[order[i - 1]] : null;
    const buses = p.length < BUS_LENGTH ? "버스보다 짧아요" : `버스 ${Math.round(p.length / BUS_LENGTH)}대 길이`;
    const floors = Math.max(1, Math.round(p.height / FLOOR_HEIGHT));
    let note = SIZE_NOTES[id] || "";
    if (!note && prev) {
      const r = p.length / prev.length;
      note = r >= 1.75 ? `앞 비행기보다 ${Math.round(r)}배쯤 길어요!` : r >= 1.2 ? "앞 비행기보다 훨씬 길어요!" : "앞 비행기보다 조금 더 길어요.";
    }
    return { id, p, prev, buses, floors, note };
  }
  function sizeSay(i) {
    const { p, buses, floors, note } = sizeFacts(i);
    return `${p.name}. 길이는 ${p.length}미터, ${buses}. 높이는 아파트 ${floors}층만큼이에요. ${note}`;
  }

  function viewSize(start) {
    const order = window.SIZE_ORDER;
    const last = order.length - 1;
    let i = clamp(start, 0, last);
    let showAll = false;
    setTitle("누가 누가 클까?");

    app.innerHTML = `
      <section class="size" style="--accent:var(--c-size)">
        ${sizeTop("order", `<label class="toggle"><input type="checkbox" id="show-all"> 앞 비행기 모두 보기</label>`)}
        <div class="stage" id="stage" role="img" aria-label="비행기를 실제 크기 비율로 겹쳐 그린 그림">
          <div class="ground"></div>
          ${order.map((id) => `
            <div class="plane-layer" data-id="${id}"><img src="${imgSrc(id)}" alt=""></div>
            <div class="plane-layer outline" data-id="${id}"><img src="${imgSrc(id)}" alt=""></div>`).join("")}
          ${kidsHtml()}
          <div id="finale"></div>
        </div>
        <p class="rotate-hint">📱 휴대폰을 옆으로 돌리면 더 크게 보여요</p>
        <div class="size-info">
          <div class="size-text" id="size-text"></div>
          ${slideNav(order.length)}
        </div>
      </section>`;
    const text = app.querySelector("#size-text");
    const lockText = () => lockHeight(text, "size", () => order.map((_, n) => sizeTextHtml(n)));

    const stage = app.querySelector("#stage");
    const layers = [...stage.querySelectorAll(".plane-layer")];
    const kids = stage.querySelector("#kids");
    const pos = {};
    const updateNav = bindSlideNav(app, order.length, (n) => update(n), () => i);

    // 모든 비행기를 같은 축척(1m = 몇 px)으로 배치. 가장 큰 A380이 무대에 꼭 맞도록 축척을 정함
    function layout() {
      const sc = stageScale(stage, order);
      order.forEach((id) => {
        pos[id] = placePlane(layers.filter((el) => el.dataset.id === id), id, sc);
      });
      sizeKids(kids, sc);
      placeKid();
    }

    function placeKid() {
      const p = pos[order[i]];
      if (p) kidsBeside(kids, p.left);
    }

    function update(n) {
      i = clamp(n, 0, last);
      layers.forEach((el) => {
        const k = order.indexOf(el.dataset.id);
        const outline = el.classList.contains("outline");
        el.classList.remove("current", "ghost", "show", "old", "old-show");
        if (k === i && !outline) el.classList.add("current");
        else if (k === i - 1) el.classList.add(outline ? "show" : "ghost");
        else if (k < i - 1 && showAll) el.classList.add(outline ? "old-show" : "old");
      });
      placeKid();

      const { p } = sizeFacts(i);
      text.innerHTML = sizeTextHtml(i);
      const again = app.querySelector("#again");
      if (again) again.addEventListener("click", () => update(0));

      const finale = app.querySelector("#finale");
      if (i === last) {
        finale.innerHTML = `<div class="finale-msg">🎉 짜잔! 제일 큰 비행기 ${flag("kr")} ${p.airline} A380!</div>`;
        confetti(28);
      } else {
        finale.innerHTML = "";
      }

      updateNav(i);
      history.replaceState(null, "", `#/size/${i}`);
      Speech.stop();
      Speech.set(`size/${i}`);
    }

    app.querySelector("#show-all").addEventListener("change", (e) => { showAll = e.target.checked; update(i); });
    const onResize = () => { layout(); lockText(); };
    window.addEventListener("resize", onResize);
    cleanup = () => window.removeEventListener("resize", onResize);

    nav = { prev: () => update(i - 1), next: () => update(i + 1) };
    layout();
    update(i);
    lockText();
    whenFontsReady(lockText);
  }

  // 차례대로 보기 아래 설명 칸 (이름·길이·높이·한마디·흐릿한 비행기)
  function sizeTextHtml(i) {
    const order = window.SIZE_ORDER;
    const last = order.length - 1;
    const { p, prev, buses, floors, note } = sizeFacts(i);
    return `
      <div class="size-name">${flag(p.country[0])} ${p.name} ${p.airline ? `<span class="chip">✈️ ${p.airline}</span>` : ""} <span class="count">${i + 1} / ${order.length}</span></div>
      <div class="size-facts"><span class="chip">📏 길이 ${p.length}m · 🚌 ${buses}</span><span class="chip">🏢 높이 ${p.height}m · 아파트 ${floors}층</span></div>
      <div class="size-note">${note}${i === last ? ` <button class="big-btn" id="again" style="font-size:18px;padding:8px 18px">🔁 처음부터</button>` : ""}</div>
      <div class="size-ghost-name">${prev ? `흐릿하게 보이는 비행기: ${prev.name}` : ""}</div>`;
  }

  // ───────── 골라서 비교하기 (아이가 고른 비행기 2대만 겹쳐서 크기 비교) ─────────
  // 두 비행기 모두 투명도 75%(불투명도 0.25)로 겹쳐 그리고, 1번은 주황·2번은 파랑 테두리로 구별해요.
  const VS_SLOTS = [{ color: "#ff8a00", mark: "🟠" }, { color: "#2f80ed", mark: "🔵" }];
  const comparable = (id) => !!(P[id] && P[id].length && META.planes[id]);

  function viewCompare(first, second) {
    setTitle("누가 누가 클까?");
    const sel = [first, second].map((id) => (comparable(id) ? id : null));
    if (sel[0] && sel[0] === sel[1]) sel[1] = null;
    let active = null; // 다음에 고를 칸 (null이면 비어 있는 칸, 다 찼으면 2번)
    const extras = window.SIZE_ORDER.filter((id) => !window.FIGHTERS.includes(id) && !window.AIRLINERS.includes(id));
    const groups = [
      ["🛡️ 하늘을 지키는 비행기", window.FIGHTERS],
      ["✈️ 사람을 태우는 비행기", window.AIRLINERS],
      ["🛩️ 작은 프로펠러 비행기", extras],
    ];

    app.innerHTML = `
      <section class="size compare" style="--accent:var(--c-size)">
        ${sizeTop("vs")}
        <div class="stage" id="stage" role="img" aria-label="고른 비행기 두 대를 실제 크기 비율로 겹쳐 그린 그림">
          <div class="ground"></div>
          ${VS_SLOTS.map((s, k) => `
            <div class="plane-layer vs-layer" data-slot="${k}"><img alt=""></div>
            <div class="plane-layer vs-outline" data-slot="${k}"><img alt="" style="filter:url(#vs-outline-${k})"></div>`).join("")}
          ${kidsHtml(true)}
          <div class="stage-msg" id="stage-msg"></div>
        </div>
        <p class="rotate-hint">📱 휴대폰을 옆으로 돌리면 더 크게 보여요</p>
        <div class="size-info vs-info">
          <div>
            <div class="vs-slots">
              ${VS_SLOTS.map((s, k) => `${k ? '<span class="vs-mark" aria-hidden="true">VS</span>' : ""}
                <button class="vs-slot" data-slot="${k}" style="--slot:${s.color}"></button>`).join("")}
            </div>
            <div class="size-facts" id="vs-facts"></div>
            <div class="size-note" id="vs-note"></div>
          </div>
          <button class="small-btn" id="vs-reset">🔁 다시 고르기</button>
        </div>
        <div class="vs-picker">
          <h3 class="vs-picker-title" id="vs-picker-title"></h3>
          <p class="vs-picker-hint" id="vs-picker-hint" hidden>다른 쪽을 바꾸고 싶으면 위의 1번이나 2번 칸을 눌러요</p>
          ${groups.map(([label, ids]) => `
            <div class="pick-group-title">${label}</div>
            <div class="pick-grid">
              ${ids.filter(comparable).map((id) => `
                <button class="pick-plane" data-id="${id}" aria-label="${P[id].name}">
                  ${planeImg(id, { thumb: true })}<span>${P[id].name}</span><b class="pick-num" aria-hidden="true"></b>
                </button>`).join("")}
            </div>`).join("")}
        </div>
      </section>`;

    const stage = app.querySelector("#stage");
    const kids = stage.querySelector("#kids");
    const slotLayers = (k) => [...stage.querySelectorAll(`.plane-layer[data-slot="${k}"]`)];

    // 다음에 채울 칸: 직접 누른 칸 → 비어 있는 1번 → 그 밖에는 2번 (첫 번째로 고른 비행기와 계속 비교해 보기 좋게)
    const nextSlot = () => (active !== null ? active : sel[0] ? 1 : 0);

    function layout() {
      const ids = sel.filter(Boolean);
      kids.hidden = !ids.length;
      stage.classList.toggle("both", ids.length === 2);
      sel.forEach((id, k) => slotLayers(k).forEach((el) => el.classList.toggle("on", !!id)));
      if (!ids.length) return;
      const sc = stageScale(stage, ids);
      let minLeft = Infinity;
      // 긴 비행기를 뒤에, 짧은 비행기를 앞에
      const longFirst = ids.slice().sort((x, y) => P[y].length - P[x].length);
      sel.forEach((id, k) => {
        const els = slotLayers(k);
        if (!id) return;
        els.forEach((el) => {
          const img = el.querySelector("img");
          if (img.getAttribute("src") !== imgSrc(id)) img.src = imgSrc(id);
          el.style.zIndex = (el.classList.contains("vs-outline") ? 4 : 2) + longFirst.indexOf(id);
        });
        minLeft = Math.min(minLeft, placePlane(els, id, sc).left);
      });
      sizeKids(kids, sc);
      kidsBeside(kids, minLeft);
    }

    // 화면에 보일 설명(text)과 읽어주기 조각(keys). 읽어주기는 미리 만든 음성 조각을 이어 붙여서 말해요.
    function compareParts(ia, ib) {
      const [a, b] = [P[ia], P[ib]];
      const [il, is] = a.length >= b.length ? [ia, ib] : [ib, ia];
      const [long, short] = [P[il], P[is]];
      const r = long.length / short.length;
      const times = Math.min(VS_MAX_TIMES, Math.round(r));
      const lenText = r < 1.05 ? "두 비행기 길이가 거의 똑같아요!"
        : `더 길쭉한 비행기는 ${long.name}! ${short.name}보다 ${r >= 1.75 ? `${Math.round(r)}배쯤 더 길쭉해요` : r >= 1.2 ? "훨씬 더 길어요" : "조금 더 길어요"}.`;
      const lenKeys = r < 1.05 ? ["w/vs-same"]
        : ["w/vs-longer", `name/${il}`, r >= 1.75 ? `w/vs-times-${times}` : r >= 1.2 ? "w/vs-much" : "w/vs-bit"];
      const it = a.height >= b.height ? ia : ib;
      const tall = P[it];
      const low = P[it === ia ? ib : ia];
      const sameH = tall.height / low.height < 1.05;
      const tallToo = !sameH && it === il && r >= 1.05;
      const hText = sameH ? "높이는 거의 같아요." : tallToo ? "높이도 더 높아요." : `더 높은 비행기는 ${tall.name}!`;
      const hKeys = sameH ? ["w/vs-height-same"] : tallToo ? ["w/vs-taller-too"] : ["w/vs-taller", `name/${it}`];
      return { text: `${lenText} ${hText}`, keys: [...lenKeys, ...hKeys] };
    }

    function render() {
      sel.forEach((id, k) => {
        const btn = app.querySelector(`.vs-slot[data-slot="${k}"]`);
        const s = VS_SLOTS[k];
        btn.classList.toggle("active", nextSlot() === k);
        btn.classList.toggle("empty", !id);
        btn.innerHTML = id
          ? `<span class="slot-num">${s.mark} ${k + 1}번</span>${planeImg(id, { thumb: true })}<span class="slot-name">${P[id].name}</span>`
          : `<span class="slot-num">${s.mark} ${k + 1}번</span><span class="slot-name">골라요 👇</span>`;
        btn.setAttribute("aria-label", `${k + 1}번 비행기${id ? `: ${P[id].name}` : ""}. 눌러서 바꾸기`);
      });
      app.querySelectorAll(".pick-plane").forEach((b) => {
        const k = sel.indexOf(b.dataset.id);
        b.classList.toggle("picked", k >= 0);
        b.setAttribute("aria-pressed", k >= 0);
        b.style.setProperty("--slot", k >= 0 ? VS_SLOTS[k].color : "transparent");
        b.querySelector(".pick-num").textContent = k >= 0 ? k + 1 : "";
      });
      const k = nextSlot();
      const title = app.querySelector("#vs-picker-title");
      title.style.setProperty("--slot", VS_SLOTS[k].color);
      title.textContent = sel[k] && sel[1 - k]
        ? `${VS_SLOTS[k].mark} ${k + 1}번 비행기를 바꿔 볼까요?`
        : `${VS_SLOTS[k].mark} ${k + 1}번 비행기를 골라요`;
      app.querySelector("#vs-picker-hint").hidden = !(sel[0] && sel[1]);

      const [a, b] = sel.map((id) => id && P[id]);
      const msg = app.querySelector("#stage-msg");
      msg.textContent = !a && !b ? "비교하고 싶은 비행기 2대를 골라요 👇" : a && b ? "" : "하나 더 골라요 👇";
      msg.hidden = !msg.textContent;
      msg.classList.toggle("top", !!(a || b)); // 비행기가 있으면 가리지 않게 위쪽으로
      app.querySelector("#vs-facts").innerHTML = sel.map((id, n) => id
        ? `<span class="chip" style="--slot:${VS_SLOTS[n].color}">${VS_SLOTS[n].mark} 📏 ${P[id].length}m · 🏢 높이 ${P[id].height}m</span>` : "").join("");
      const cmp = a && b ? compareParts(sel[0], sel[1]) : null;
      const note = cmp ? cmp.text : "";
      app.querySelector("#vs-note").textContent = note;
      app.querySelector("#vs-reset").hidden = !a && !b;
      layout();

      history.replaceState(null, "", `#/size/vs${sel[0] || sel[1] ? `/${sel[0] || "-"}` : ""}${sel[1] ? `/${sel[1]}` : ""}`);
      Speech.set(cmp ? [`name/${sel[0]}`, "w/and", `name/${sel[1]}`, ...cmp.keys] : "w/vs-idle");
    }

    app.querySelectorAll(".pick-plane").forEach((btn) => btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const k = nextSlot();
      if (sel[1 - k] === id) return; // 다른 칸에 이미 있는 비행기는 그대로
      sel[k] = id;
      active = null;
      render();
      // 두 대가 다 골라지면 비교 무대가 보이도록 위로
      if (sel[0] && sel[1]) stage.scrollIntoView({ behavior: "smooth", block: "center" });
    }));
    app.querySelectorAll(".vs-slot").forEach((btn) => btn.addEventListener("click", () => {
      active = +btn.dataset.slot;
      render();
      app.querySelector(".vs-picker").scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    app.querySelector("#vs-reset").addEventListener("click", () => {
      sel[0] = sel[1] = null;
      active = null;
      render();
    });

    const onResize = () => layout();
    window.addEventListener("resize", onResize);
    cleanup = () => window.removeEventListener("resize", onResize);
    render();
  }

  // ───────── 최고의 비행기 고르기 (이상형 월드컵) ─────────
  // 전투기·여객기 40대를 섞어 무작위로 32대를 뽑고, 두 대씩 겨뤄서 고른 비행기만 다음 판으로 올라가요. (32강 → 결승, 31번 고르기)
  const CUP_SIZE = 32;
  const CupStore = {
    key: "skyfriends.cup.v1",
    get() {
      try { return (JSON.parse(localStorage.getItem(this.key)) || []).filter((id) => P[id]); } catch { return []; }
    },
    add(id) {
      const list = [id, ...this.get().filter((x) => x !== id)].slice(0, 8);
      try { localStorage.setItem(this.key, JSON.stringify(list)); } catch { /* 저장 안 되는 환경이면 무시 */ }
    },
  };
  const kindOf = (id) => (window.FIGHTERS.includes(id) ? "fighters" : "airliners");
  const CUP_STAGE = { first: "첫 대결", next: "다음 대결", last: "🏆 결승" };

  function shuffle(list) {
    const a = list.slice();
    for (let k = a.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [a[k], a[j]] = [a[j], a[k]];
    }
    return a;
  }

  function viewCup() {
    setTitle("최고의 비행기 고르기");
    const pool = [...window.FIGHTERS, ...window.AIRLINERS];
    let st = null;       // 진행 상태 { entrants, winners, m, played, total, semis, finalPair }
    let history = [];    // "다시 고를래요"를 위한 이전 상태들
    let busy = false;    // 고른 뒤 다음 대결로 넘어가는 동안 두 번 눌림 방지
    let timer = null;
    cleanup = () => clearTimeout(timer);

    function startScreen() {
      nav = null;
      const past = CupStore.get();
      app.innerHTML = `
        <section class="slides cup-start" style="--accent:var(--c-cup)">
          <div class="slide-card">
            <div class="slide-kicker">최고의 비행기 고르기</div>
            <div class="vs-art big" aria-hidden="true">${vsArt("kf21", "b747")}</div>
            <h2 class="slide-title">누가 더 멋있나?</h2>
            <p class="slide-text">두 비행기 중에서 더 멋진 비행기를 골라요.<br>끝까지 남은 비행기가 최고의 비행기!</p>
            <div class="cup-sizes">
              <button class="cup-size" id="cup-start"><span>▶️ 시작하기</span><small>비행기 ${CUP_SIZE}대</small></button>
            </div>
            ${past.length ? `
              <div class="cup-history">
                <div class="cup-history-title">🏆 지난번에 뽑은 최고의 비행기</div>
                <div class="cup-history-list">
                  ${past.map((id) => `<a class="mini-plane" href="#/${kindOf(id)}/${id}">${planeImg(id, { thumb: true })}<span>${P[id].name}</span></a>`).join("")}
                </div>
              </div>` : ""}
          </div>
        </section>`;
      app.querySelector("#cup-start").addEventListener("click", start);
      Speech.stop();
      Speech.set("w/cup-start");
    }

    function start() {
      const n = CUP_SIZE;
      st = { entrants: shuffle(pool).slice(0, n), winners: [], m: 0, played: 0, total: n - 1, semis: [], finalPair: null };
      history = [];
      match();
    }

    function card(id, side) {
      const p = P[id];
      return `<button class="cup-card ${side === 0 ? "left" : "right"}" data-side="${side}" aria-label="${p.name} 고르기">
        <span class="cup-photo">${planeImg(id, { alt: "" })}</span>
        <span class="cup-name">${flag(p.country[0])} ${p.name}</span>
        <span class="cup-kind">${window.FIGHTERS.includes(id) ? "🛡️ 하늘을 지키는 비행기" : "✈️ 사람을 태우는 비행기"}</span>
        <span class="pick-badge" aria-hidden="true">멋져요! 👍</span>
      </button>`;
    }

    function match() {
      const size = st.entrants.length;
      const a = st.entrants[st.m * 2];
      const b = st.entrants[st.m * 2 + 1];
      // 아이에게 "32강·16강"은 어려워서 첫 대결 → 다음 대결 → … → 결승 으로만 알려줘요
      const stage = size === 2 ? "last" : st.played === 0 ? "first" : "next";
      app.innerHTML = `
        <section class="cup" style="--accent:var(--c-cup)">
          <div class="cup-head">
            <span class="cup-round new ${stage}">${CUP_STAGE[stage]}</span>
          </div>
          <h2 class="cup-q">어떤 비행기가 더 멋있어요?</h2>
          <div class="cup-arena">
            ${card(a, 0)}
            <div class="vs" aria-hidden="true">VS</div>
            ${card(b, 1)}
          </div>
          <div class="cup-tools">
            <button class="small-btn" id="cup-undo" ${history.length ? "" : "disabled"}>↩️ 다시 고를래요</button>
            <button class="small-btn" id="cup-quit">⏹️ 그만할래요</button>
          </div>
          <div class="cup-progress" aria-label="${st.played}번 골랐어요, 모두 ${st.total}번"><span style="width:${(st.played / st.total) * 100}%"></span></div>
        </section>`;
      app.querySelectorAll(".cup-card").forEach((c) => c.addEventListener("click", () => pick(+c.dataset.side)));
      app.querySelector("#cup-undo").addEventListener("click", undo);
      app.querySelector("#cup-quit").addEventListener("click", startScreen);
      // 다음 대결 사진 미리 불러오기
      st.entrants.slice(st.m * 2 + 2, st.m * 2 + 4).forEach((id) => { new Image().src = imgSrc(id); });
      nav = { prev: () => pick(0), next: () => pick(1), noSwipe: true }; // ← → 키로도 고르기
      Speech.stop();
      Speech.set([`w/cup-${stage}`, `name/${a}`, "w/and", `name/${b}`, "w/cup-q"]);
    }

    function pick(side) {
      if (busy || !st) return;
      busy = true;
      history.push(JSON.parse(JSON.stringify(st)));
      const size = st.entrants.length;
      const winner = st.entrants[st.m * 2 + side];
      const loser = st.entrants[st.m * 2 + 1 - side];
      if (size === 4) st.semis = st.entrants.slice();
      if (size === 2) st.finalPair = { winner, loser };
      st.winners.push(winner);
      st.m += 1;
      st.played += 1;
      const cards = app.querySelectorAll(".cup-card");
      cards[side].classList.add("picked");
      cards[1 - side].classList.add("lost");
      timer = setTimeout(() => {
        busy = false;
        if (st.m * 2 >= st.entrants.length) { // 이번 판이 끝나면 이긴 비행기들로 다음 판
          st.entrants = st.winners;
          st.winners = [];
          st.m = 0;
        }
        if (st.entrants.length === 1) finalScreen();
        else match();
      }, 750);
    }

    function undo() {
      if (busy || !history.length) return;
      st = history.pop();
      match();
    }

    function finalScreen() {
      nav = null;
      const champ = st.entrants[0];
      const p = P[champ];
      const runner = st.finalPair ? P[st.finalPair.loser] : null;
      CupStore.add(champ);
      app.innerHTML = `
        <section class="slides cup-final" style="--accent:var(--c-cup)">
          <div class="slide-card">
            <div class="trophy" aria-hidden="true">🏆</div>
            <div class="slide-kicker">내가 고른 최고의 비행기</div>
            <div class="champion">${planeImg(champ, { alt: `${p.name} 사진` })}</div>
            <h2 class="slide-title">${flag(p.country[0])} ${p.name}</h2>
            ${runner ? `<p class="slide-sub">결승에서 만난 ${runner.name}도 멋졌지만, 내 마음속 1등은 이 비행기!</p>` : ""}
            ${st.semis.length ? `
              <div class="cup-semis" aria-label="마지막까지 남은 비행기 4대">
                ${st.semis.map((id) => `<span class="mini-plane ${id === champ ? "gold" : ""}">${id === champ ? `<span class="crown" aria-label="1등">👑</span>` : ""}${planeImg(id, { thumb: true })}<span>${P[id].name}</span></span>`).join("")}
              </div>` : ""}
            <div class="cup-actions">
              <a class="big-btn" href="#/${kindOf(champ)}/${champ}">🔍 자세히 보기</a>
              <button class="big-btn alt" id="cup-again">🔁 다시 하기</button>
            </div>
          </div>
        </section>`;
      app.querySelector("#cup-again").addEventListener("click", startScreen);
      confetti(40);
      Speech.set(["w/cup-final", `name/${champ}`, "w/cup-final-end"]);
      Speech.say(["w/cup-champ", `name/${champ}`]);
    }

    startScreen();
  }

  // ───────── 읽어주기 문장 ─────────
  // 화면에서 읽어주는 모든 문장은 key로 불러요. tools/melo_voice.py가 window.SkyVoice.script()로 전체 목록을 받아서
  // MeloTTS 음성 파일(audio/<key>.mp3)과 목록(js/voice.js)을 미리 만들어요. 문장을 고친 뒤 그 도구를 다시 돌리면
  // 바뀐 문장만 새로 만들어요. 비교하기·고르기처럼 조합이 많은 문장은 짧은 조각(w/…, name/…)을 이어서 말해요.
  const VS_MAX_TIMES = 12;
  const WORDS = {
    home: "하늘 친구들에 온 걸 환영해요! 보고 싶은 것을 눌러 보세요. 하늘을 지키는 비행기, 사람을 태우는 비행기, 누가 누가 큰지 비교하기, 최고의 비행기 고르기, 그리고 조종사와 관제사와 정비사가 하는 일을 볼 수 있어요.",
    "gallery-fighters": "우리 하늘을 든든하게 지키는 비행기들이에요. 이런 비행기를 전투기라고 불러요. 궁금한 비행기를 눌러 보세요.",
    "gallery-airliners": "손님을 태우고 먼 곳까지 데려다주는 비행기들이에요. 이런 비행기를 여객기라고 불러요. 궁금한 비행기를 눌러 보세요.",
    and: "그리고",
    "vs-idle": "비교하고 싶은 비행기 두 대를 골라 보세요. 고른 두 비행기를 같은 크기 비율로 겹쳐서 보여줘요.",
    "vs-same": "두 비행기 길이가 거의 똑같아요!",
    "vs-longer": "더 길쭉한 비행기는", // "더 긴"은 "더 핀"처럼 들릴 때가 있어서
    "vs-much": "훨씬 더 길어요.",
    "vs-bit": "조금 더 길어요.",
    // "키"는 MeloTTS가 "피"처럼 읽을 때가 있어서 비교하기에서는 "높이"로 말해요
    "vs-taller": "더 높은 비행기는",
    "vs-taller-too": "높이도 더 높아요.",
    "vs-height-same": "높이는 거의 같아요.",
    "cup-start": "최고의 비행기 고르기! 두 비행기 중에서 더 멋진 비행기를 골라요. 끝까지 남은 비행기가 최고의 비행기예요. 시작하기를 눌러 보세요.",
    "cup-q": "어떤 비행기가 더 멋있어요?",
    "cup-final": "짜잔! 내가 고른 최고의 비행기는",
    "cup-final-end": "정말 멋진 비행기예요!",
    "cup-champ": "짜잔! 최고의 비행기는",
  };
  for (let n = 2; n <= VS_MAX_TIMES; n++) WORDS[`vs-times-${n}`] = `${n}배쯤 더 길쭉해요.`;
  // 고르기 대결 머리말 (32강·16강 대신)
  Object.assign(WORDS, { "cup-first": "첫 대결!", "cup-next": "다음 대결!", "cup-last": "결승 대결이에요!" });

  function lineText(key) {
    const [kind, a, b] = String(key).split("/");
    if (kind === "w") return WORDS[a] || "";
    if (kind === "name") return P[a] ? P[a].name : "";
    if (kind === "detail") return detailSay(a);
    if (kind === "job") return jobSay(a, +b);
    if (kind === "promise") return `${J[a].promises[+b].title}! 약속!`;
    if (kind === "badge") return `축하해요! ${J[a].badge.name}를 받았어요!`;
    if (kind === "size") return sizeSay(+a);
    return "";
  }

  function allLineKeys() {
    return [
      ...Object.keys(WORDS).map((w) => `w/${w}`),
      ...Object.keys(P).map((id) => `name/${id}`),
      ...[...window.FIGHTERS, ...window.AIRLINERS].map((id) => `detail/${id}`),
      ...JOB_KEYS.flatMap((k) => jobSlides(k).map((_, i) => `job/${k}/${i}`)),
      ...JOB_KEYS.flatMap((k) => J[k].promises.map((_, n) => `promise/${k}/${n}`)),
      ...JOB_KEYS.map((k) => `badge/${k}`),
      ...window.SIZE_ORDER.map((_, i) => `size/${i}`),
    ];
  }

  // 음성 파일 만드는 도구와 자동 검사에서 씀
  window.SkyVoice = {
    script: () => allLineKeys().map((key) => ({ key, text: Speech.clean(lineText(key)) })),
    current: () => Speech.keys.slice(),
    state: () => ({ clip: Speech.current, queue: Speech.queue.slice(), src: Speech.audio ? Speech.audio.src : "",
      speaking: speakBtn.classList.contains("speaking") }),
  };

  // ───────── 화면 이동 ─────────
  function route() {
    Speech.stop();
    nav = null;
    if (cleanup) { cleanup(); cleanup = null; }
    document.querySelectorAll(".celebrate").forEach((el) => el.remove());

    const [a, b, c, d] = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    if ((a === "fighters" || a === "airliners") && b) viewDetail(a, b);
    else if (a === "fighters" || a === "airliners") viewGallery(a);
    else if (a === "job" && J[b]) viewJob(b, parseInt(c, 10) || 0);
    else if (a === "size" && b === "vs") viewCompare(c, d);
    else if (a === "size") viewSize(parseInt(b, 10) || 0);
    else if (a === "cup") viewCup();
    else viewHome();

    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  // 손가락으로 옆으로 밀면 ◀ ▶
  let sx = 0;
  let sy = 0;
  app.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  app.addEventListener("touchend", (e) => {
    if (!nav || nav.noSwipe) return; // 고르기 화면에서는 밀기로 잘못 고르지 않게 막음
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? nav.next : nav.prev)();
  }, { passive: true });

  // 키보드 ← → 로도 넘기기
  document.addEventListener("keydown", (e) => {
    if (!nav || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowRight") { e.preventDefault(); nav.next(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); nav.prev(); }
  });

  Speech.init();
  window.addEventListener("hashchange", route);
  route();
})();
