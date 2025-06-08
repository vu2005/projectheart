// --- URL Params ---
const urlParams = new URLSearchParams(window.location.search);
const galaxyId = urlParams.get('id');
const isDemo = urlParams.get('demo') === '1';

// --- Demo Data ---
const demoGalaxyData = {
    messages: [
        "I love you so much! ❤️", "Our Anniverasry", "I love you 💖", "25/08/2004",
        "Thank you for being my sunshine ", "Thank you for being my everything 💕",
        "You are my universe ", "There is no other", "You’re amazing",
        "You make my heart smile ", "Love ya! 💖", "Honey bunch, you are my everything! "
    ],
    icons: ["♥", "💖", "❤️", "❤️", "💕", "💕"],
    colors: '#ff6b9d',
    images: ["https://res.cloudinary.com/dtxohfp9j/image/upload/v1711878270/ttlh6obhku93le0ckmic.jpg"],
    song: "eyenoselip.mp3",
    isHeart: true,
    textHeart: "Như Vũ",
    isSave: true,
    createdAt: "2025-05-30T00:00:00.000Z"
};

// --- DOM refs ---
const loadingScreen = document.getElementById('loadingScreen');
const errorScreen = document.getElementById('errorScreen');
const galaxy = document.getElementById('galaxy');
const heartContainer = document.getElementById('heartContainer');

// --- State ---
let galaxyData = null;
let rotationX = 0, rotationY = 0, scale = 1;
let isDragging = false, lastMouseX = 0, lastMouseY = 0;
const activeParticles = new Set();
let galaxyAnimationId, heartAnimationStarted = false;

// --- Responsive ---
const isMobile = window.innerWidth <= 768;
const isSmallMobile = window.innerWidth <= 480;
const maxParticles = isSmallMobile ? 150 : isMobile ? 200 : 300;
const particleInterval = isMobile ? 100 : 120;
const starCount = isSmallMobile ? 250 : isMobile ? 350 : 500;
let particleSpeedMultiplier = 1.3;

// --- Particle speed on drag/touch ---
document.addEventListener('mousedown', () => { particleSpeedMultiplier = 1.7; });
document.addEventListener('mouseup', () => { particleSpeedMultiplier = 1; });
document.addEventListener('touchstart', (e) => { if (e.touches.length === 1) particleSpeedMultiplier = 1.7; });
document.addEventListener('touchend', () => { particleSpeedMultiplier = 1; });

// --- Prevent scroll/zoom ---
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
document.addEventListener('wheel', e => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('gestureend', e => e.preventDefault());

// --- Load galaxy data ---
async function loadGalaxyData() {
    if (isDemo) {
        galaxyData = demoGalaxyData;
        initializeGalaxy();
        return;
    }
    if (!galaxyId) { showError(); return; }
    try {
        const response = await fetch(`https://dearlove-backend.onrender.com/api/galaxies/${galaxyId}`);
        if (!response.ok) { showError(); return; }
        const data = await response.json();
        if (!data) { showError(); return; }
        galaxyData = data.data;
        initializeGalaxy();
    } catch (error) {
        console.error('Error loading galaxy:', error);
        showError();
    }
}
function showError() {
    loadingScreen.style.display = 'none';
    errorScreen.style.display = 'flex';
}

// --- Initialize galaxy ---
function initializeGalaxy() {
    loadingScreen.style.display = 'none';

    // Gán chữ trái tim từ dữ liệu
    const heartTextDiv = document.getElementById('heartText');
    if (heartTextDiv) {
        heartTextDiv.textContent = galaxyData.textHeart || '';
    }

    initializeAudio();
    detectBrowserAndDevice();
    createStars();
    startParticleAnimation();

    // Chỉ show trái tim nếu isHeart === true
    if (galaxyData.isHeart === true) {
        setTimeout(() => {
            if (document.getElementById('doubleClickTip')) return;
            const tip = document.createElement('div');
            tip.id = 'doubleClickTip';
            tip.className = 'double-click-tip';
            tip.textContent = 'click 2 lần vào màn hình nha💖';
            document.body.appendChild(tip);

            setTimeout(() => {
                if (document.body.contains(tip)) tip.remove();
            }, 3000);

            function handleDblClick(event) {
                event.preventDefault();
                event.stopPropagation();
                if (!heartAnimationStarted) {
                    tip.remove();
                    transitionToHeart();
                    window.removeEventListener('dblclick', handleDblClick);
                    window.removeEventListener('touchend', handleTouchDblTap);
                }
            }
            let lastTap = 0;
            function handleTouchDblTap(e) {
                const now = Date.now();
                if (now - lastTap < 500) {
                    handleDblClick(e);
                }
                lastTap = now;
            }
            window.addEventListener('dblclick', handleDblClick);
            window.addEventListener('touchend', handleTouchDblTap);
        }, 8000);
    }
}

// --- Audio ---
let audioInitialized = false, userHasInteracted = false;

function initializeAudio() {
    if (!galaxyData.song) return;
    const audio = document.getElementById('galaxyAudio');
    audio.src = galaxyData.song.startsWith('http') ? galaxyData.song : `songs/${galaxyData.song}`;
    audio.loop = true; audio.preload = 'metadata'; audio.volume = 0.7;

    if (isMobile) {
        function handleUserInteraction() {
            if (!userHasInteracted) {
                userHasInteracted = true;
                audio.play()
                    .then(() => {
                        audioInitialized = true;
                        hideAudioPrompt();
                    })
                    .catch(() => {
                        showManualPlayButton();
                    });
                interactionEvents.forEach(event => document.removeEventListener(event, handleUserInteraction));
            }
        }
        const interactionEvents = ['touchstart', 'touchend', 'click'];
        interactionEvents.forEach(event => document.addEventListener(event, handleUserInteraction, { passive: true }));
        audio.addEventListener('error', showAudioError);
    } else {
        audio.play().catch(() => {
            showManualPlayButton();
        });
    }
}
function showManualPlayButton() {
    if (document.getElementById('manualPlayButton')) return;
    const button = document.createElement('button');
    button.id = 'manualPlayButton';
    button.innerHTML = '🎵 Phát nhạc';
    button.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        z-index: 1001; background: linear-gradient(45deg, #ff6b9d, #4ecdc4);
        color: white; border: none; padding: 12px 24px; border-radius: 25px;
        font-family: 'Orbitron', sans-serif; font-weight: 600; cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3); animation: pulse 2s infinite;
    `;
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: translateX(-50%) scale(1); }
            50% { transform: translateX(-50%) scale(1.05); }
            100% { transform: translateX(-50%) scale(1); }
        }
    `;
    document.head.appendChild(style);
    button.addEventListener('click', async () => {
        try {
            const audio = document.getElementById('galaxyAudio');
            await audio.play();
            button.style.display = 'none';
        } catch (error) {
            button.textContent = '❌ Lỗi phát nhạc';
            button.style.background = '#ff4757';
        }
    });
    document.body.appendChild(button);
    setTimeout(() => {
        if (button.parentNode) {
            button.style.opacity = '0';
            button.style.transition = 'opacity 0.5s';
            setTimeout(() => button.remove(), 500);
        }
    }, 10000);
}
function hideAudioPrompt() {
    const button = document.getElementById('manualPlayButton');
    if (button) button.style.display = 'none';
}
function showAudioError() {
    if (document.getElementById('audioError')) return;
    const errorDiv = document.createElement('div');
    errorDiv.id = 'audioError';
    errorDiv.innerHTML = '⚠️ Không thể tải nhạc';
    errorDiv.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        z-index: 1001; background: rgba(255, 71, 87, 0.9); color: white;
        padding: 8px 16px; border-radius: 15px; font-family: 'Orbitron', sans-serif; font-size: 12px;
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// --- Device detection ---
function detectBrowserAndDevice() {
    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isChrome = /Chrome/i.test(ua);
    const isFirefox = /Firefox/i.test(ua);
    const isSamsung = /SamsungBrowser/i.test(ua);
    // ...handle if needed...
}

// --- Particle helpers ---
function getRandomMessage() {
    return galaxyData.messages[Math.floor(Math.random() * galaxyData.messages.length)];
}
function getRandomIcon() {
    return galaxyData.icons[Math.floor(Math.random() * galaxyData.icons.length)];
}


// --- Create text particle ---
function createTextParticle() {
    if (activeParticles.size >= maxParticles || heartAnimationStarted) return;
    const isIcon = Math.random() > 0.7;
    const element = document.createElement('div');
    
 element.className = 'text-particle'; // chỉ dùng 1 class chung

    if (isIcon) {
        element.textContent = getRandomIcon();
    } else {
        element.textContent = getRandomMessage();
    }
    // Set màu từ dữ liệu
    element.style.color = galaxyData.colors || '#ff6b9d';
    element.style.textShadow = `0 0 15px ${galaxyData.colors || '#ff6b9d'}, 0 0 25px ${galaxyData.colors || '#ff6b9d'}, 2px 2px 6px rgba(0,0,0,0.9)`;

    const xPos = Math.random() * 100;
    const zPos = (Math.random() - 0.5) * (isMobile ? 300 : 500);
    const animationDuration = Math.random() * 2 + (isMobile ? 3 : 3);
    element.style.left = xPos + '%';
    const baseFontSize = isSmallMobile ? 8 : isMobile ? 12 : 18;
    const fontSizeVariation = isSmallMobile ? 4 : isMobile ? 5 : 8;
    element.style.fontSize = (Math.random() * fontSizeVariation + baseFontSize) + 'px';
    const depthOpacity = Math.max(0.4, 1 - Math.abs(zPos) / (isMobile ? 250 : 400));
    element.style.opacity = depthOpacity;
    let startTime = null, startY = -150, endY = window.innerHeight + 150;
    const thisParticleSpeed = particleSpeedMultiplier;
    function animateParticle(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / (animationDuration * 1000 * thisParticleSpeed);
        if (progress < 1 && !heartAnimationStarted) {
            const currentY = startY + (endY - startY) * progress;
            const opacity = progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : depthOpacity;
            element.style.transform = `translate3d(0, ${currentY}px, ${zPos}px)`;
            element.style.opacity = opacity;
            requestAnimationFrame(animateParticle);
        } else {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
                activeParticles.delete(element);
            }
        }
    }
    galaxy.appendChild(element);
    activeParticles.add(element);
    requestAnimationFrame(animateParticle);
}

// --- Create image particle ---
function createImageParticle() {
    if (!galaxyData.images || galaxyData.images.length === 0 || activeParticles.size >= maxParticles) return;
    const img = document.createElement('img');
    img.src = galaxyData.images[Math.floor(Math.random() * galaxyData.images.length)];
    img.className = 'text-particle image-particle';
    img.style.width = (Math.random() * 40 + 60) + 'px';
    img.style.height = 'auto';
    img.style.borderRadius = '15px';
    img.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
    img.style.background = '#fff';
    const xPos = Math.random() * 100;
    const zPos = (Math.random() - 0.5) * (isMobile ? 300 : 500);
    const animationDuration = Math.random() * 2 + (isMobile ? 3 : 3);
    img.style.left = xPos + '%';
    let startTime = null, startY = -150, endY = window.innerHeight + 150;
    const thisParticleSpeed = particleSpeedMultiplier;
    function animateParticle(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / (animationDuration * 1000 * thisParticleSpeed);
        if (progress < 1) {
            const currentY = startY + (endY - startY) * progress;
            const opacity = progress < 0.05 ? progress * 20 : progress > 0.95 ? (1 - progress) * 20 : 1;
            img.style.transform = `translate3d(0, ${currentY}px, ${zPos}px)`;
            img.style.opacity = opacity;
            requestAnimationFrame(animateParticle);
        } else {
            if (img.parentNode) {
                img.parentNode.removeChild(img);
                activeParticles.delete(img);
            }
        }
    }
    galaxy.appendChild(img);
    activeParticles.add(img);
    requestAnimationFrame(animateParticle);
}

// --- Create stars ---
function createStars() {
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const angle = Math.random() * Math.PI * 10;
        const radius = Math.random() * (isMobile ? 800 : 1500) + (isMobile ? 200 : 300);
        const spiralHeight = Math.sin(angle) * (isMobile ? 100 : 150);
        const x = Math.cos(angle) * radius;
        const y = spiralHeight + (Math.random() - 0.5) * (isMobile ? 1000 : 2000);
        const z = Math.sin(angle) * radius * 0.5;
        star.style.left = `calc(50% + ${x}px)`;
        star.style.top = `calc(50% + ${y}px)`;
        star.style.transform = `translateZ(${z}px)`;
        star.style.animationDelay = Math.random() * 3 + 's';
        const depthBrightness = Math.max(0.1, 1 - Math.abs(z) / (isMobile ? 800 : 1200));
        star.style.opacity = depthBrightness;
        galaxy.appendChild(star);
    }
}

// --- Galaxy transform ---
function updateGalaxyTransform() {
    requestAnimationFrame(() => {
        galaxy.style.transform = `translate(-50%, -50%) rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale(${scale})`;
    });
}

// --- Particle animation ---
function startParticleAnimation() {
    setInterval(() => {
        if (heartAnimationStarted) return;
        if (galaxyData.images && galaxyData.images.length > 0 && Math.random() < 0.08) {
            createImageParticle();
        } else {
            createTextParticle();
        }
    }, particleInterval);

    const initialParticles = isMobile ? 20 : 15;
    for (let i = 0; i < initialParticles; i++) {
        setTimeout(() => {
            if (galaxyData.images && galaxyData.images.length > 0 && Math.random() < 0.08) {
                createImageParticle();
            } else {
                createTextParticle();
            }
        }, i * (particleInterval * 0.6));
    }

    galaxyAnimationId = setInterval(() => {
        if (!heartAnimationStarted) createTextParticle();
    }, particleInterval);
}

// --- Mouse events (desktop) ---
document.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});
document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        const sensitivity = isMobile ? 0.3 : 0.5;
        rotationY += deltaX * sensitivity;
        rotationX -= deltaY * sensitivity;
        updateGalaxyTransform();
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    }
});
document.addEventListener('mouseup', () => { isDragging = false; });

// --- Touch events (mobile) ---
let initialDistance = 0, initialScale = 1;
document.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        isDragging = true;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        isDragging = false;
        const [touch1, touch2] = [e.touches[0], e.touches[1]];
        initialDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        initialScale = scale;
    }
}, { passive: false });
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
        const deltaX = e.touches[0].clientX - lastMouseX;
        const deltaY = e.touches[0].clientY - lastMouseY;
        const sensitivity = 0.3;
        rotationY += deltaX * sensitivity;
        rotationX -= deltaY * sensitivity;
        updateGalaxyTransform();
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        const [touch1, touch2] = [e.touches[0], e.touches[1]];
        const currentDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        const scaleChange = currentDistance / initialDistance;
        scale = Math.max(0.5, Math.min(2, initialScale * scaleChange));
        updateGalaxyTransform();
    }
}, { passive: false });
document.addEventListener('touchend', (e) => {
    e.preventDefault();
    isDragging = false;
}, { passive: false });

// --- Orientation change ---
window.addEventListener('orientationchange', () => {
    setTimeout(() => { location.reload(); }, 100);
});

// --- Heart transition ---
function transitionToHeart() {
    heartAnimationStarted = true;
    if (galaxyAnimationId) clearInterval(galaxyAnimationId);

    // Mờ dần từng text-particle và falling-image
    const fallingImages = document.querySelectorAll('.falling-image');
    fallingImages.forEach(img => {
        img.style.transition = 'opacity 1.5s';
        img.style.opacity = '0';
    });
    const particles = document.querySelectorAll('.text-particle');
    particles.forEach(el => {
        el.style.transition = 'opacity 1.5s';
        el.style.opacity = '0';
    });

    setTimeout(() => {
        heartContainer.classList.add('active');
        initializeHeartAnimation();
    }, 1500);
}

// --- Heart animation ---
 // --- Heart animation ---
        function initializeHeartAnimation() {
            var settings = {
                particles: {
                    length: isMobile ? 5000 : 10000,
                    duration: 4,
                    velocity: isMobile ? 50 : 80,
                    effect: -1.3,
                    size: isMobile ? 6 : 8,
                },
            };
            (function(){var b=0;var c=["ms","moz","webkit","o"];for(var a=0;a<c.length&&!window.requestAnimationFrame;++a){window.requestAnimationFrame=window[c[a]+"RequestAnimationFrame"];window.cancelAnimationFrame=window[c[a]+"CancelAnimationFrame"]||window[c[a]+"CancelRequestAnimationFrame"]}if(!window.requestAnimationFrame){window.requestAnimationFrame=function(h,e){var d=new Date().getTime();var f=Math.max(0,16-(d-b));var g=window.setTimeout(function(){h(d+f)},f);b=d+f;return g}}if(!window.cancelAnimationFrame){window.cancelAnimationFrame=function(d){clearTimeout(d)}}}());
            var Point = (function() {
                function Point(x, y) { this.x = (typeof x !== 'undefined') ? x : 0; this.y = (typeof y !== 'undefined') ? y : 0; }
                Point.prototype.clone = function() { return new Point(this.x, this.y); };
                Point.prototype.length = function(length) {
                    if (typeof length == 'undefined') return Math.sqrt(this.x * this.x + this.y * this.y);
                    this.normalize(); this.x *= length; this.y *= length; return this;
                };
                Point.prototype.normalize = function() {
                    var length = this.length(); this.x /= length; this.y /= length; return this;
                };
                return Point;
            })();
            var Particle = (function() {
                function Particle() { this.position = new Point(); this.velocity = new Point(); this.acceleration = new Point(); this.age = 0; }
                Particle.prototype.initialize = function(x, y, dx, dy) {
                    this.position.x = x; this.position.y = y; this.velocity.x = dx; this.velocity.y = dy;
                    this.acceleration.x = dx * settings.particles.effect; this.acceleration.y = dy * settings.particles.effect; this.age = 0;
                };
                Particle.prototype.update = function(deltaTime) {
                    this.position.x += this.velocity.x * deltaTime; this.position.y += this.velocity.y * deltaTime;
                    this.velocity.x += this.acceleration.x * deltaTime; this.velocity.y += this.acceleration.y * deltaTime;
                    this.age += deltaTime;
                };
                Particle.prototype.draw = function(context, image) {
                    function ease(t) { return (--t) * t * t + 1; }
                    var size = image.width * ease(this.age / settings.particles.duration);
                    context.globalAlpha = 1 - this.age / settings.particles.duration;
                    context.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size, size);
                };
                return Particle;
            })();
            var ParticlePool = (function() {
                var particles, firstActive = 0, firstFree = 0, duration = settings.particles.duration;
                function ParticlePool(length) {
                    particles = new Array(length);
                    for (var i = 0; i < particles.length; i++) particles[i] = new Particle();
                }
                ParticlePool.prototype.add = function(x, y, dx, dy) {
                    particles[firstFree].initialize(x, y, dx, dy);
                    firstFree++; if (firstFree == particles.length) firstFree = 0;
                    if (firstActive == firstFree) firstActive++;
                    if (firstActive == particles.length) firstActive = 0;
                };
                ParticlePool.prototype.update = function(deltaTime) {
                    var i;
                    if (firstActive < firstFree) {
                        for (i = firstActive; i < firstFree; i++) particles[i].update(deltaTime);
                    }
                    if (firstFree < firstActive) {
                        for (i = firstActive; i < particles.length; i++) particles[i].update(deltaTime);
                        for (i = 0; i < firstFree; i++) particles[i].update(deltaTime);
                    }
                    while (particles[firstActive].age >= duration && firstActive != firstFree) {
                        firstActive++; if (firstActive == particles.length) firstActive = 0;
                    }
                };
                ParticlePool.prototype.draw = function(context, image) {
                    var i;
                    if (firstActive < firstFree) {
                        for (i = firstActive; i < firstFree; i++) particles[i].draw(context, image);
                    }
                    if (firstFree < firstActive) {
                        for (i = firstActive; i < particles.length; i++) particles[i].draw(context, image);
                        for (i = 0; i < firstFree; i++) particles[i].draw(context, image);
                    }
                };
                return ParticlePool;
            })();
            (function(canvas) {
                var context = canvas.getContext('2d'),
                    particles = new ParticlePool(settings.particles.length),
                    particleRate = settings.particles.length / settings.particles.duration,
                    time;
                function pointOnHeart(t) {
                    return new Point(
                        160 * Math.pow(Math.sin(t), 3),
                        130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25
                    );
                }
                var image = (function() {
                    var canvas  = document.createElement('canvas'),
                        context = canvas.getContext('2d');
                    canvas.width  = settings.particles.size;
                    canvas.height = settings.particles.size;
                    function to(t) {
                        var point = pointOnHeart(t);
                        point.x = settings.particles.size / 2 + point.x * settings.particles.size / 350;
                        point.y = settings.particles.size / 2 - point.y * settings.particles.size / 350;
                        return point;
                    }
                    context.beginPath();
                    var t = -Math.PI;
                    var point = to(t);
                    context.moveTo(point.x, point.y);
                    while (t < Math.PI) {
                        t += 0.01;
                        point = to(t);
                        context.lineTo(point.x, point.y);
                    }
                    context.closePath();
                    context.fillStyle = '#f50b02';
                    context.fill();
                    var image = new Image();
                    image.src = canvas.toDataURL();
                    return image;
                })();
                function render() {
                    requestAnimationFrame(render);
                    var newTime   = new Date().getTime() / 1000,
                        deltaTime = newTime - (time || newTime);
                    time = newTime;
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    var amount = particleRate * deltaTime;
                    for (var i = 0; i < amount; i++) {
                        var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
                        var dir = pos.clone().length(settings.particles.velocity);
                        particles.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
                    }
                    particles.update(deltaTime);
                    particles.draw(context, image);
                }
                function onResize() {
                    canvas.width  = canvas.clientWidth;
                    canvas.height = canvas.clientHeight;
                }
                window.addEventListener('resize', onResize);
                setTimeout(function() {
                    onResize();
                    render();
                }, 10);
            })(document.getElementById('pinkboard'));
        }

// --- Init ---
loadGalaxyData();