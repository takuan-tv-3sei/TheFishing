const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 画面サイズに応じてCanvasをリサイズ（スマホ/高DPI対応）
const BASE_W = 800;
const BASE_H = 600;

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 4:3 を維持して最大限フィットさせる（縦長スマホでも破綻しにくい）
    const scale = Math.min(vw / BASE_W, vh / BASE_H);
    const cssW = Math.max(1, Math.floor(BASE_W * scale));
    const cssH = Math.max(1, Math.floor(BASE_H * scale));

    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    // CSSピクセル基準で描けるようにする
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 既存オブジェクト位置を画面内に収める
    hookX = clamp(hookX, 0, cssW - hookWidth);
    hookY = clamp(hookY, 0, cssH - 30);
    fishX = clamp(fishX, 0, cssW - (currentFish?.width ?? 0));
    fishY = clamp(fishY, 0, (cssH / 2) - (currentFish?.height ?? 0));
}

window.addEventListener('resize', resizeCanvas);

let hookX = BASE_W / 2;   // 釣り針のX座標（CSSピクセル基準）
let hookY = BASE_H - 30;  // 釣り針のY座標（CSSピクセル基準）
let hookWidth = 100;      // 釣り針の幅
let hookHeight = 30;      // 釣り針の長さ
let hookSpeed = 5;        // 釣り針の移動速度

// 魚の種類を定義する配列
let fishes = [
    { type: 'サバ(森田)', color: '#00CED1', width: 70, height: 30, speedX: 20, speedY: 20, lifetime: 50000 },
    { type: 'イワシ', color: '#FFD700', width: 30, height: 20, speedX: 1.5, speedY: 2, lifetime: 30000 },
    { type: 'サワラ', color: '#FA2034', width: 30, height: 20, speedX: 1.5, speedY: 2, lifetime: 30000 },
    { type: '黒豆', color: '#000000', width: 30, height: 20, speedX: 1.5, speedY: 2, lifetime: 30000, message: "しかし！？！？"},
];

let fishIndex = Math.floor(Math.random() * fishes.length); // ランダムに魚の種類を選択
let currentFish = fishes[fishIndex]; // 選択された魚の情報を取得

let fishX = Math.random() * (canvas.width - currentFish.width); // 魚の初期X座標
let fishY = Math.random() * (canvas.height / 2 - currentFish.height); // 魚の初期Y座標（上半分に制限）
let fishSpawnTime = Date.now(); // 魚が出現した時間

let isCaught = false;           // 魚が釣れたかどうか
let isSpaceDown = false;        // スペースキーが押されているかどうか
let isHookMoving = false;       // 釣り針が移動中かどうか
let caughtFishName = '';        // 釣った魚の名前
let caughtFishDisplayTime = 2000; // 釣った魚の名前を表示する時間
let caughtFishTime = 0;         // 魚が釣れた時刻

// マウスカーソルの位置を取得する関数
function getMousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

// タッチ位置を取得する関数
function getTouchPos(canvas, touch) {
    let rect = canvas.getBoundingClientRect();
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
}

// マウス移動時のイベントリスナー
canvas.addEventListener('mousemove', function(evt) {
    if (!isSpaceDown && !isHookMoving) {
        let mousePos = getMousePos(canvas, evt);
        hookX = mousePos.x - hookWidth / 2; // 釣り針をマウスカーソルに追従
    }
});

// スマホ用：スワイプで釣り針を移動、押してる間だけ釣り針を伸ばす
canvas.addEventListener('touchstart', function(evt) {
    evt.preventDefault();
    if (!isHookMoving) {
        isSpaceDown = true;
        isHookMoving = true;
    }
    const t = evt.touches[0];
    if (t) {
        const pos = getTouchPos(canvas, t);
        hookX = pos.x - hookWidth / 2;
    }
}, { passive: false });

canvas.addEventListener('touchmove', function(evt) {
    evt.preventDefault();
    if (!isSpaceDown && isHookMoving) return;
    const t = evt.touches[0];
    if (t) {
        const pos = getTouchPos(canvas, t);
        hookX = pos.x - hookWidth / 2;
    }
}, { passive: false });

canvas.addEventListener('touchend', function(evt) {
    evt.preventDefault();
    isSpaceDown = false;
}, { passive: false });

// スペースキーが押されたときのイベントリスナー
window.addEventListener('keydown', function(evt) {
    if (evt.key === ' ' && !isSpaceDown && !isHookMoving) {
        isSpaceDown = true; // スペースキーが押されているフラグをセット
        isHookMoving = true; // 釣り針が移動中フラグをセット
    }
});

// スペースキーが離されたときのイベントリスナー
window.addEventListener('keyup', function(evt) {
    if (evt.key === ' ' && isSpaceDown) {
        isSpaceDown = false; // スペースキーが離されたらフラグをリセット
    }
});

// 魚のランダムな挙動を制御する関数
function updateFishBehavior() {
    if (Math.random() < 0.05) {
        currentFish.speedX = Math.random() * 4 - 2; // -2から2のランダムな速度
        currentFish.speedY = Math.random() * 2 + 1; // 1から3のランダムな速度
    }
}

// 新しい魚をスポーンさせる関数
function spawnNewFish() {
    fishIndex = Math.floor(Math.random() * fishes.length); // ランダムに魚の種類を選択
    currentFish = fishes[fishIndex]; // 選択された魚の情報を取得
    fishX = Math.random() * (canvas.clientWidth - currentFish.width); // 新しい魚の位置をランダムに設定
    fishY = Math.random() * (canvas.clientHeight / 2 - currentFish.height); // 新しい魚の位置をランダムに設定（上半分に制限）
    fishSpawnTime = Date.now(); // 新しい魚の出現時間を更新
}

// ゲームループ
function gameLoop() {
    // clientWidth/clientHeight（CSSピクセル）基準で描画する
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.clearRect(0, 0, w, h); // Canvasをクリア

    updateFishBehavior(); // 魚のランダムな挙動を更新

    // 魚の移動
    fishX += currentFish.speedX;
    fishY += currentFish.speedY;

    // 魚が画面端に到達したら反転させる
    if (fishX <= 0 || fishX + currentFish.width >= w) {
        currentFish.speedX = -currentFish.speedX;
    }
    if (fishY <= 0 || fishY + currentFish.height >= h / 2) {
        currentFish.speedY = -currentFish.speedY;
    }

    // 魚の描画
    ctx.fillStyle = currentFish.color;
    ctx.fillRect(fishX, fishY, currentFish.width, currentFish.height);

    // 釣り針の描画
    ctx.fillStyle = '#000';
    ctx.fillRect(hookX, hookY, hookWidth, hookHeight);

    // スペースキーが押されている間は釣り針を伸ばす
    if (isSpaceDown && hookY > 0) {
        hookY -= hookSpeed;
    } else if (hookY < h - 30) {
        hookY += hookSpeed; // スペースキーが離されたら釣り針を戻す
    }

    // 釣り針が元の位置に戻ったら移動中フラグをリセット
    if (!isSpaceDown && hookY >= h - 30) {
        hookY = h - 30;
        isHookMoving = false;
    }

    // 魚を釣ったか判定
    if (hookX < fishX + currentFish.width &&
        hookX + hookWidth > fishX &&
        hookY < fishY + currentFish.height &&
        hookY + hookHeight > fishY) {
        isCaught = true;
        caughtFishName = currentFish.type; // 釣った魚の名前を設定
        caughtFishTime = Date.now(); // 魚が釣れた時間を設定
    }

    // 魚を釣った場合の処理
    if (isCaught || Date.now() - fishSpawnTime > currentFish.lifetime) {
        spawnNewFish(); // 新しい魚をスポーンさせる
        isCaught = false;
    }

    // 魚が釣れたら名前を表示
    if (caughtFishName && Date.now() - caughtFishTime < caughtFishDisplayTime) {
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.fillText(currentFish.message == null ? caughtFishName + "を釣った！" : currentFish.message, 10, h - 10);
    }

    requestAnimationFrame(gameLoop); // 次のフレームをリクエスト
}

// ゲーム開始
resizeCanvas();
spawnNewFish();
gameLoop()
