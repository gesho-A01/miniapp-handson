import React, { useState, useRef, useEffect } from 'react';

const ClickShooter = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // ゲーム状態
  const gameState = useRef({
    player: { 
      x: 0, 
      y: 0, 
      width: 40, 
      height: 40,
      lastMouseX: 0
    },
    bullets: [],
    enemies: [],
    lastEnemySpawnTime: 0,
    lastBulletFireTime: 0
  });

  // 初期化
  const initGame = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;

    // プレイヤーの初期位置
    gameState.current.player.x = canvas.width / 2 - 20;
    gameState.current.player.y = canvas.height - 60;

    // ゲーム状態のリセット
    gameState.current.bullets = [];
    gameState.current.enemies = [];
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  // 弾を発射
  const fireBullet = (x, y) => {
    const now = Date.now();
    if (now - gameState.current.lastBulletFireTime < 200) return; // 連射制限

    gameState.current.bullets.push({
      x: x + 17.5, // プレイヤーの中心に合わせる
      y: y,
      width: 5,
      height: 15,
      speed: 7
    });
    gameState.current.lastBulletFireTime = now;
  };

  // 敵を生成
  const spawnEnemy = () => {
    const now = Date.now();
    if (now - gameState.current.lastEnemySpawnTime < 1000) return; // 敵の生成間隔

    const canvas = canvasRef.current;
    gameState.current.enemies.push({
      x: Math.random() * (canvas.width - 30),
      y: -30,
      width: 30,
      height: 30,
      speed: 2 + Math.random() * 2,
      health: 1 // 敵に耐久値を追加
    });
    gameState.current.lastEnemySpawnTime = now;
  };

  // ゲームループ
  const gameLoop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // プレイヤーの水平移動
    const player = gameState.current.player;
    const mouseX = player.lastMouseX;
    
    // プレイヤーの位置を制限
    player.x = Math.max(0, Math.min(canvas.width - player.width, mouseX - player.width / 2));

    // プレイヤー描画
    ctx.fillStyle = '#3498db';
    ctx.fillRect(
      player.x, 
      player.y, 
      player.width, 
      player.height
    );

    // 弾の更新と描画
    gameState.current.bullets = gameState.current.bullets.filter(bullet => {
      bullet.y -= bullet.speed;
      
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

      return bullet.y > -bullet.height;
    });

    // 敵の更新と描画
    gameState.current.enemies = gameState.current.enemies.filter(enemy => {
      enemy.y += enemy.speed;
      
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

      // ゲームオーバー判定
      if (enemy.y > canvas.height) {
        setGameOver(true);
        return false;
      }

      // 当たり判定
      for (let i = gameState.current.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.current.bullets[i];
        if (
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          // 敵の耐久値を減少
          enemy.health--;
          
          // 弾を削除
          gameState.current.bullets.splice(i, 1);

          // 敵を撃墜
          if (enemy.health <= 0) {
            setScore(prevScore => prevScore + 10);
            return false;
          }
        }
      }

      return true;
    });

    // 敵の生成
    spawnEnemy();
  };

  // マウス移動ハンドラ
  const handleMouseMove = (e) => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // マウスの横方向の位置を保存
    gameState.current.player.lastMouseX = mouseX;
  };

  // クリックハンドラ
  const handleCanvasClick = (e) => {
    if (!gameStarted || gameOver) {
      initGame();
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    fireBullet(gameState.current.player.x, gameState.current.player.y);
  };

  // ゲームループの管理
  useEffect(() => {
    let animationFrameId;
    const canvas = canvasRef.current;

    if (gameStarted && !gameOver) {
      const animate = () => {
        gameLoop();
        animationFrameId = requestAnimationFrame(animate);
      };
      animate();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameStarted, gameOver]);

  return (
    <div className="w-full max-w-xl mx-auto bg-white shadow-md rounded-lg p-4">
      <h2 className="text-2xl font-bold text-center mb-4">クリックシューティングゲーム</h2>
      <div className="text-center mb-4">
        <p className="text-lg">スコア: {score}</p>
        {gameOver && <p className="text-red-500">ゲームオーバー！再開するにはクリック</p>}
        {!gameStarted && <p>開始するにはクリック</p>}
      </div>
      <canvas 
        ref={canvasRef} 
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        className="border-2 border-gray-300 rounded-lg cursor-pointer mx-auto"
      />
    </div>
  );
};

export default ClickShooter;