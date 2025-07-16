/* Corrida de Desviar - Lucas */
(() => {
  const startScreen = document.getElementById('startScreen');
  const gameUI = document.getElementById('gameUI');
  const winScreen = document.getElementById('winScreen');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const startBtn = document.getElementById('startBtn');
  const restartBtns = document.querySelectorAll('.restartBtn');
  const timeDisplay = document.getElementById('timeDisplay');
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const upBtn = document.getElementById('upBtn');
  const downBtn = document.getElementById('downBtn');

  const GAME_DURATION = 50_000; // ms
  const CAR_WIDTH = 60;
  const CAR_HEIGHT = 30;
  const CAR_SPEED = 300; // px/s vertical
  const OBSTACLE_MIN_INTERVAL = 600; // ms
  const OBSTACLE_MAX_INTERVAL = 1300; // ms
  const OBSTACLE_SPEED = 300; // px/s horizontal
  const OBSTACLE_WIDTH = 40;
  const OBSTACLE_HEIGHT = 40;

  let lastTime = 0;
  let elapsed = 0;
  let running = false;
  let carY = 0;
  let carX = 60;
  let inputDir = 0; // -1 up, +1 down
  let obstacles = [];
  let nextObstacleIn = 0;

  // resize canvas to device pixel ratio while preserving CSS size
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize', resizeCanvas);

  function showScreen(scr) {
    [startScreen, gameUI, winScreen, gameOverScreen].forEach(s => s.classList.remove('active'));
    scr.classList.add('active');
  }

  function resetGame() {
    elapsed = 0;
    running = true;
    obstacles = [];
    nextObstacleIn = randRange(OBSTACLE_MIN_INTERVAL, OBSTACLE_MAX_INTERVAL);
    carY = (canvas.height/ (window.devicePixelRatio||1) - CAR_HEIGHT)/2;
  }

  function startGame() {
    resizeCanvas();
    resetGame();
    showScreen(gameUI);
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function winGame() {
    running = false;
    showScreen(winScreen);
  }

  function gameOver() {
    running = false;
    showScreen(gameOverScreen);
  }

  function randRange(min,max){
    return Math.random()*(max-min)+min;
  }

  function spawnObstacle() {
    // random y within canvas
    const maxY = (canvas.height/(window.devicePixelRatio||1)) - OBSTACLE_HEIGHT;
    const y = Math.random()*maxY;
    obstacles.push({x:(canvas.width/(window.devicePixelRatio||1))+OBSTACLE_WIDTH, y});
  }

  function update(dt) {
    if(!running) return;
    elapsed += dt;
    const remaining = Math.max(0, (GAME_DURATION - elapsed)/1000);
    timeDisplay.textContent = remaining.toFixed(1);

    // Move car
    carY += inputDir * CAR_SPEED * dt/1000;
    const maxY = (canvas.height/(window.devicePixelRatio||1)) - CAR_HEIGHT;
    if(carY < 0) carY = 0;
    if(carY > maxY) carY = maxY;

    // spawn obstacles
    nextObstacleIn -= dt;
    if(nextObstacleIn <= 0){
      spawnObstacle();
      nextObstacleIn = randRange(OBSTACLE_MIN_INTERVAL, OBSTACLE_MAX_INTERVAL);
    }

    // move obstacles
    const speed = OBSTACLE_SPEED * dt/1000;
    for(const o of obstacles){
      o.x -= speed;
    }
    // remove offscreen
    obstacles = obstacles.filter(o => o.x + OBSTACLE_WIDTH > 0);

    // collision
    for(const o of obstacles){
      if(!(carX > o.x + OBSTACLE_WIDTH ||
           carX + CAR_WIDTH < o.x ||
           carY > o.y + OBSTACLE_HEIGHT ||
           carY + CAR_HEIGHT < o.y)){
        gameOver();
        return;
      }
    }

    // win?
    if(elapsed >= GAME_DURATION){
      winGame();
    }
  }

  function render() {
    const w = canvas.width/(window.devicePixelRatio||1);
    const h = canvas.height/(window.devicePixelRatio||1);
    ctx.clearRect(0,0,w,h);

    // road background stripes
    ctx.fillStyle = '#303030';
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 4;
    ctx.setLineDash([20,20]);
    ctx.beginPath();
    ctx.moveTo(w/2,0);
    ctx.lineTo(w/2,h);
    ctx.stroke();
    ctx.setLineDash([]);

    // car
    ctx.fillStyle = '#ff004c';
    ctx.fillRect(carX,carY,CAR_WIDTH,CAR_HEIGHT);
    // wheels
    ctx.fillStyle = '#000';
    ctx.fillRect(carX+5,carY-4,10,4);
    ctx.fillRect(carX+CAR_WIDTH-15,carY-4,10,4);
    ctx.fillRect(carX+5,carY+CAR_HEIGHT,10,4);
    ctx.fillRect(carX+CAR_WIDTH-15,carY+CAR_HEIGHT,10,4);

    // obstacles
    ctx.fillStyle = '#00d8ff';
    for(const o of obstacles){
      ctx.fillRect(o.x,o.y,OBSTACLE_WIDTH,OBSTACLE_HEIGHT);
    }
  }

  function loop(ts) {
    const dt = ts - lastTime;
    lastTime = ts;
    update(dt);
    render();
    if(running) requestAnimationFrame(loop);
  }

  // Input handling
  function handlePress(dir){
    inputDir = dir;
  }
  function clearPress(dir){
    if(inputDir === dir) inputDir = 0;
  }

  upBtn.addEventListener('mousedown', ()=>handlePress(-1));
  downBtn.addEventListener('mousedown', ()=>handlePress(1));
  document.addEventListener('mouseup', ()=>inputDir=0);

  upBtn.addEventListener('touchstart', e=>{e.preventDefault();handlePress(-1);},{passive:false});
  downBtn.addEventListener('touchstart', e=>{e.preventDefault();handlePress(1);},{passive:false});
  document.addEventListener('touchend', e=>{e.preventDefault();inputDir=0;},{passive:false});

  // keyboard
  document.addEventListener('keydown', e=>{
    if(e.code === 'ArrowUp' || e.code === 'KeyW') handlePress(-1);
    if(e.code === 'ArrowDown' || e.code === 'KeyS') handlePress(1);
  });
  document.addEventListener('keyup', e=>{
    if(e.code === 'ArrowUp' || e.code === 'KeyW') clearPress(-1);
    if(e.code === 'ArrowDown' || e.code === 'KeyS') clearPress(1);
  });

  startBtn.addEventListener('click', startGame);
  restartBtns.forEach(btn => btn.addEventListener('click', ()=>{
    showScreen(startScreen);
  }));

  // ensure initial time display
  timeDisplay.textContent = (GAME_DURATION/1000).toFixed(1);
})();