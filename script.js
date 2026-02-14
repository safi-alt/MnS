/* ============================================================
   Retro Valentine – Puzzle → Envelope → Heart Fill → Message
   ============================================================ */

// ─── Phase management ───────────────────────────────────────
const phases = {
  puzzle: document.getElementById("phase-puzzle"),
  envelope: document.getElementById("phase-envelope"),
  heart: document.getElementById("phase-heart"),
  message: document.getElementById("phase-message"),
};

function goTo(name) {
  Object.values(phases).forEach((el) => el.classList.remove("active"));
  setTimeout(() => phases[name].classList.add("active"), 120);
}

// ─── PHASE 1 : Puzzle ──────────────────────────────────────
const TARGET = "LOVE";
const slots = document.querySelectorAll(".slot");
const tiles = document.querySelectorAll(".tile");
const clearBtn = document.getElementById("clear-btn");
const submitBtn = document.getElementById("submit-btn");
const feedback = document.getElementById("feedback");
let chosen = [];

function renderSlots() {
  slots.forEach((s, i) => {
    s.textContent = chosen[i] || "";
    s.classList.toggle("filled", !!chosen[i]);
  });
}

tiles.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (chosen.length >= TARGET.length) return;
    chosen.push(btn.dataset.letter);
    btn.classList.add("used");
    renderSlots();
  });
});

clearBtn.addEventListener("click", () => {
  chosen = [];
  renderSlots();
  feedback.textContent = "";
  feedback.className = "feedback";
  tiles.forEach((b) => b.classList.remove("used"));
});

submitBtn.addEventListener("click", () => {
  if (chosen.length < TARGET.length) {
    setFeedback("error", "Pick 4 letters first!");
    return;
  }
  if (chosen.join("") === TARGET) {
    setFeedback("success", "Yes! You unlocked it!");
    submitBtn.disabled = true;
    // Go to envelope transition
    setTimeout(() => {
      goTo("envelope");
      triggerEnvelope();
    }, 700);
  } else {
    setFeedback("error", "Not quite — try again!");
    setTimeout(() => {
      chosen = [];
      renderSlots();
      feedback.textContent = "";
      feedback.className = "feedback";
      tiles.forEach((b) => b.classList.remove("used"));
    }, 900);
  }
});

function setFeedback(type, msg) {
  feedback.className = "feedback " + type;
  feedback.textContent = msg;
}

// ─── PHASE 1.5 : Envelope open ─────────────────────────────
const envelope = document.getElementById("envelope");

function triggerEnvelope() {
  // Envelope opens after a beat
  setTimeout(() => {
    envelope.classList.add("open");
    burstHearts(14);
  }, 600);
  // Then proceed to heart fill
  setTimeout(() => {
    goTo("heart");
    startHeartFill();
  }, 2800);
}

// ─── PHASE 2 : Heart dot-fill ──────────────────────────────
const heartCanvas = document.getElementById("heart-canvas");
const hCtx = heartCanvas.getContext("2d");
const fillLabel = document.getElementById("fill-label");

function heartPath(ctx, cx, cy, scale) {
  ctx.beginPath();
  for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.01) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)
    );
    const px = cx + x * scale;
    const py = cy + y * scale - scale * 2;
    if (t === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function startHeartFill() {
  const rect = heartCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  heartCanvas.width = rect.width * dpr;
  heartCanvas.height = rect.height * dpr;
  hCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = rect.width;
  const H = rect.height;
  const cx = W / 2;
  const cy = H / 2;
  const scale = Math.min(W, H) / 38;

  // Retro-warm dot colors
  const colors = [
    "#cc1133",
    "#dd2244",
    "#b8293d",
    "#e83850",
    "#a02038",
    "#d44060",
    "#c43050",
    "#ee5566",
    "#993322",
    "#bb4455",
  ];

  // Offscreen hit-test
  const offscreen = document.createElement("canvas");
  offscreen.width = heartCanvas.width;
  offscreen.height = heartCanvas.height;
  const oCtx = offscreen.getContext("2d");
  oCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  heartPath(oCtx, cx, cy, scale);

  const dots = [];
  const totalDots = 1800;
  let tries = 0;
  while (dots.length < totalDots && tries < totalDots * 8) {
    tries++;
    const x = Math.random() * W;
    const y = Math.random() * H;
    if (oCtx.isPointInPath(x * dpr, y * dpr)) {
      dots.push({
        x,
        y,
        r: 1.6 + Math.random() * 2.4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  dots.sort((a, b) => b.y - a.y);

  const duration = 4500;
  const start = performance.now();

  setTimeout(() => fillLabel.classList.add("visible"), 300);

  function frame(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const target = Math.floor(progress * dots.length);

    hCtx.clearRect(0, 0, W, H);

    // Heart outline glow
    heartPath(hCtx, cx, cy, scale);
    hCtx.strokeStyle = "rgba(196,92,106,0.35)";
    hCtx.lineWidth = 2.5;
    hCtx.shadowColor = "rgba(196,92,106,0.5)";
    hCtx.shadowBlur = 20;
    hCtx.stroke();
    hCtx.shadowBlur = 0;

    for (let i = 0; i < target; i++) {
      const d = dots[i];
      hCtx.beginPath();
      hCtx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      hCtx.fillStyle = d.color;
      hCtx.fill();
    }

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      fillLabel.textContent = "My heart is full because of you";
      burstHearts(36);
      setTimeout(() => {
        goTo("message");
        typeMessage(
          "You are my today, my tomorrow, and my forever. Thank you for filling my world with colour and my heart with love. Happy Valentine's Day, sweetheart."
        );
        burstHearts(24);
        buildTicker();
      }, 1800);
    }
  }

  requestAnimationFrame(frame);
}

// ─── PHASE 3 : Message ─────────────────────────────────────
const loveText = document.getElementById("love-text");
const letterBtn = document.getElementById("letter-btn");
const letterModal = document.getElementById("letter-modal");
const closeModal = document.getElementById("close-modal");

function typeMessage(text) {
  loveText.textContent = "";
  let i = 0;
  const interval = setInterval(() => {
    loveText.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, 30);
}

letterBtn.addEventListener("click", () => {
  letterModal.classList.add("open");
  letterModal.setAttribute("aria-hidden", "false");
  burstHearts(18);
});

closeModal.addEventListener("click", closeModalFn);
letterModal.addEventListener("click", (e) => {
  if (e.target === letterModal) closeModalFn();
});

function closeModalFn() {
  // Blur to avoid aria-hidden focus warning
  if (document.activeElement) document.activeElement.blur();
  letterModal.classList.remove("open");
  letterModal.setAttribute("aria-hidden", "true");
}

// ─── Reasons ticker ─────────────────────────────────────────
const reasons = [
  "Your smile lights up my entire day",
  "You always know how to make me laugh",
  "The way you hold my hand",
  "Your kindness inspires me every day",
  "You make even ordinary days magical",
  "I love how you sing to yourself",
  "You're my favourite notification",
  "The way you look at me",
  "Your laugh is my favourite sound",
  "You make the world a better place",
  "Every moment with you is a gift",
  "You are my home",
];

function buildTicker() {
  const ticker = document.getElementById("ticker");
  // Duplicate list for seamless loop
  const items = [...reasons, ...reasons];
  ticker.innerHTML = items.map((r) => `<span>${r}</span>`).join("");
}

// ─── Heart + envelope + teddy + flower burst effect ─────────
function burstHearts(n = 24) {
  const emojis = [
    "❤️",
    "💖",
    "💕",
    "💌",
    "💗",
    "♥",
    "🧸",
    "🌹",
    "🌸",
    "💐",
    "🌺",
  ];
  for (let i = 0; i < n; i++) {
    const span = document.createElement("span");
    span.className = "burst";
    span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    span.style.left = Math.random() * window.innerWidth + "px";
    span.style.top = window.innerHeight * (0.3 + Math.random() * 0.4) + "px";
    span.style.setProperty("--dx", (Math.random() - 0.5) * 320 + "px");
    span.style.setProperty("--dy", -100 - Math.random() * 300 + "px");
    document.body.appendChild(span);
    setTimeout(() => span.remove(), 1400);
  }
}

// ─── Background: floating hearts + envelopes (canvas) ──────
const bgCanvas = document.getElementById("bg-canvas");
const bgCtx = bgCanvas.getContext("2d");
let floats = [];

function sizeBg() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}

function spawnFloat() {
  // Distribution: 35% hearts, 20% envelopes, 20% teddy bears, 25% flowers
  const roll = Math.random();
  let type, emoji;
  if (roll < 0.35) {
    type = "heart";
  } else if (roll < 0.55) {
    type = "env";
  } else if (roll < 0.75) {
    type = "emoji";
    emoji = "🧸";
  } else {
    type = "emoji";
    const flowers = ["🌹", "🌸", "🌺", "💐"];
    emoji = flowers[Math.floor(Math.random() * flowers.length)];
  }
  floats.push({
    x: Math.random() * bgCanvas.width,
    y: bgCanvas.height + 30,
    s:
      type === "emoji"
        ? 14 + Math.random() * 10
        : type === "env"
        ? 12 + Math.random() * 10
        : 8 + Math.random() * 14,
    vy: 0.25 + Math.random() * 0.8,
    vx: (Math.random() - 0.5) * 0.6,
    a: 0.15 + Math.random() * 0.3,
    type,
    emoji,
    wobble: Math.random() * Math.PI * 2,
  });
}

function drawSmallHeart(x, y, size, alpha) {
  bgCtx.save();
  bgCtx.translate(x, y);
  bgCtx.scale(size / 16, size / 16);
  bgCtx.beginPath();
  bgCtx.moveTo(0, 6);
  bgCtx.bezierCurveTo(0, 0, -8, 0, -8, 6);
  bgCtx.bezierCurveTo(-8, 10, -4, 13, 0, 16);
  bgCtx.bezierCurveTo(4, 13, 8, 10, 8, 6);
  bgCtx.bezierCurveTo(8, 0, 0, 0, 0, 6);
  bgCtx.closePath();
  bgCtx.fillStyle = `rgba(220,100,130,${alpha})`;
  bgCtx.fill();
  bgCtx.restore();
}

function drawSmallEnvelope(x, y, size, alpha) {
  bgCtx.save();
  bgCtx.translate(x, y);
  const w = size;
  const h = size * 0.7;

  // Envelope body
  bgCtx.beginPath();
  bgCtx.rect(-w / 2, -h / 2, w, h);
  bgCtx.fillStyle = `rgba(240,210,170,${alpha})`;
  bgCtx.fill();
  bgCtx.strokeStyle = `rgba(200,160,110,${alpha})`;
  bgCtx.lineWidth = 0.6;
  bgCtx.stroke();

  // Flap (V shape)
  bgCtx.beginPath();
  bgCtx.moveTo(-w / 2, -h / 2);
  bgCtx.lineTo(0, h * 0.1);
  bgCtx.lineTo(w / 2, -h / 2);
  bgCtx.strokeStyle = `rgba(200,160,110,${alpha})`;
  bgCtx.lineWidth = 0.6;
  bgCtx.stroke();

  // Tiny heart seal
  const hs = size * 0.15;
  bgCtx.beginPath();
  bgCtx.moveTo(0, hs * 0.3);
  bgCtx.bezierCurveTo(0, 0, -hs, 0, -hs, hs * 0.4);
  bgCtx.bezierCurveTo(-hs, hs * 0.7, -hs * 0.3, hs, 0, hs * 1.2);
  bgCtx.bezierCurveTo(hs * 0.3, hs, hs, hs * 0.7, hs, hs * 0.4);
  bgCtx.bezierCurveTo(hs, 0, 0, 0, 0, hs * 0.3);
  bgCtx.fillStyle = `rgba(190,50,60,${alpha * 1.2})`;
  bgCtx.fill();

  bgCtx.restore();
}

function drawFloatingEmoji(x, y, size, alpha, emoji) {
  bgCtx.save();
  bgCtx.globalAlpha = alpha;
  bgCtx.font = `${size}px serif`;
  bgCtx.textAlign = "center";
  bgCtx.textBaseline = "middle";
  bgCtx.fillText(emoji, x, y);
  bgCtx.restore();
}

function bgLoop() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  if (Math.random() < 0.32 && floats.length < 80) spawnFloat();

  floats.forEach((f) => {
    f.y -= f.vy;
    f.wobble += 0.015;
    f.x += f.vx + Math.sin(f.wobble) * 0.3;

    if (f.type === "env") {
      drawSmallEnvelope(f.x, f.y, f.s, f.a);
    } else if (f.type === "emoji") {
      drawFloatingEmoji(f.x, f.y, f.s, f.a, f.emoji);
    } else {
      drawSmallHeart(f.x, f.y, f.s, f.a);
    }
  });

  floats = floats.filter((f) => f.y > -40);
  requestAnimationFrame(bgLoop);
}

window.addEventListener("resize", sizeBg);
sizeBg();
bgLoop();

// ─── Sparkle cursor trail ───────────────────────────────────
const sparkleCanvas = document.getElementById("sparkle-canvas");
const spCtx = sparkleCanvas.getContext("2d");
let sparkles = [];
let mouseX = -100;
let mouseY = -100;

function sizeSparkle() {
  sparkleCanvas.width = window.innerWidth;
  sparkleCanvas.height = window.innerHeight;
}

document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  // Spawn a few sparkles on move
  for (let i = 0; i < 2; i++) {
    sparkles.push({
      x: mouseX + (Math.random() - 0.5) * 10,
      y: mouseY + (Math.random() - 0.5) * 10,
      r: 1 + Math.random() * 2.5,
      life: 1,
      decay: 0.015 + Math.random() * 0.02,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2 - 0.5,
      hue: Math.random() > 0.5 ? 0 : 40, // red or gold
    });
  }
});

function sparkleLoop() {
  spCtx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);

  sparkles.forEach((s) => {
    s.x += s.vx;
    s.y += s.vy;
    s.life -= s.decay;
    if (s.life <= 0) return;

    spCtx.beginPath();
    // Draw a small 4-point star
    const r = s.r * s.life;
    spCtx.moveTo(s.x, s.y - r);
    spCtx.lineTo(s.x + r * 0.3, s.y - r * 0.3);
    spCtx.lineTo(s.x + r, s.y);
    spCtx.lineTo(s.x + r * 0.3, s.y + r * 0.3);
    spCtx.lineTo(s.x, s.y + r);
    spCtx.lineTo(s.x - r * 0.3, s.y + r * 0.3);
    spCtx.lineTo(s.x - r, s.y);
    spCtx.lineTo(s.x - r * 0.3, s.y - r * 0.3);
    spCtx.closePath();

    const alpha = s.life * 0.8;
    spCtx.fillStyle =
      s.hue === 0 ? `rgba(255,140,160,${alpha})` : `rgba(220,180,100,${alpha})`;
    spCtx.fill();
  });

  sparkles = sparkles.filter((s) => s.life > 0);
  requestAnimationFrame(sparkleLoop);
}

window.addEventListener("resize", sizeSparkle);
sizeSparkle();
sparkleLoop();

// ─── Music player (YouTube IFrame API) ─────────────────────
const musicBtn = document.getElementById("music-btn");
const vinyl = document.getElementById("vinyl");
const musicStatus = document.getElementById("music-status");
let ytPlayer = null;
let musicPlaying = false;
let hasUnmuted = false;

const SONG_ID = "bhoybya39QU"; // Dave ft. Tems – Raindance (Lyrics)
const SONG_ALT = "suMbSVepWvs"; // Alternate lyrics video

// Called automatically by the YouTube IFrame API script
window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player("yt-player", {
    width: "280",
    height: "160",
    videoId: SONG_ID,
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      loop: 1,
      playlist: SONG_ID,
      start: 55,
      modestbranding: 1,
      rel: 0,
    },
    events: {
      onReady: function (event) {
        event.target.mute();
        event.target.playVideo();
        vinyl.classList.add("spinning");
        musicStatus.textContent = "♪";
        musicPlaying = true;
      },
      onError: function () {
        // Fallback to alternate video if primary fails
        if (ytPlayer && ytPlayer.loadVideoById) {
          ytPlayer.loadVideoById({ videoId: SONG_ALT, startSeconds: 55 });
        }
      },
    },
  });
};

// Unmute on first user interaction (click/tap anywhere)
function tryUnmute() {
  if (hasUnmuted) return;
  if (ytPlayer && typeof ytPlayer.unMute === "function") {
    ytPlayer.unMute();
    ytPlayer.setVolume(85);
    hasUnmuted = true;
  }
}
document.addEventListener("click", tryUnmute, { once: false });
document.addEventListener("touchstart", tryUnmute, { once: false });

// Toggle play/pause with the music button
musicBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!ytPlayer || typeof ytPlayer.playVideo !== "function") return;
  tryUnmute();

  if (musicPlaying) {
    ytPlayer.pauseVideo();
    vinyl.classList.remove("spinning");
    musicStatus.textContent = "▶";
    musicPlaying = false;
  } else {
    ytPlayer.playVideo();
    vinyl.classList.add("spinning");
    musicStatus.textContent = "♪";
    musicPlaying = true;
  }
});
