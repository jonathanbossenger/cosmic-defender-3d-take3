import * as THREE from 'three';

const SPAWN_RADIUS = 20;

export class WaveManager {
  constructor(enemyManager) {
    this.enemyManager = enemyManager;
    this.wave = 0;
    this.state = 'idle'; // idle, announcing, spawning, active, complete
    this.stateTimer = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnDelay = 0.5;
    this.totalEnemiesThisWave = 0;
    this.enemiesKilledThisWave = 0;
  }

  reset() {
    this.wave = 0;
    this.state = 'idle';
    this.stateTimer = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.totalEnemiesThisWave = 0;
    this.enemiesKilledThisWave = 0;
  }

  startNextWave() {
    this.wave++;
    this.state = 'announcing';
    this.stateTimer = 2.5; // announcement duration
    this.enemiesKilledThisWave = 0;

    // Build spawn queue based on wave number
    this.spawnQueue = this._buildWaveComposition(this.wave);
    this.totalEnemiesThisWave = this.spawnQueue.length;
    this.spawnTimer = 0;

    return this.wave;
  }

  _buildWaveComposition(wave) {
    const queue = [];

    // Base drone count increases with wave
    const droneCount = Math.min(3 + wave * 2, 20);

    // Soldiers appear from wave 3
    const soldierCount = wave >= 3 ? Math.min(Math.floor((wave - 2) * 1.5), 10) : 0;

    for (let i = 0; i < droneCount; i++) queue.push('drone');
    for (let i = 0; i < soldierCount; i++) queue.push('soldier');

    // Shuffle
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    return queue;
  }

  update(dt) {
    switch (this.state) {
      case 'announcing':
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = 'spawning';
        }
        break;

      case 'spawning':
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.spawnQueue.length > 0) {
          const type = this.spawnQueue.shift();
          this._spawnEnemy(type);
          // Faster spawning in later waves
          this.spawnDelay = Math.max(0.15, 0.5 - this.wave * 0.03);
          this.spawnTimer = this.spawnDelay;
        }
        if (this.spawnQueue.length === 0) {
          this.state = 'active';
        }
        break;

      case 'active':
        // Check if all enemies are dead
        if (this.enemyManager.count === 0) {
          this.state = 'complete';
          this.stateTimer = 2; // pause before next wave
        }
        break;

      case 'complete':
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = 'idle';
        }
        break;
    }
  }

  _spawnEnemy(type) {
    // Random position on arena perimeter
    const angle = Math.random() * Math.PI * 2;
    const pos = new THREE.Vector3(
      Math.cos(angle) * SPAWN_RADIUS,
      1.2,
      Math.sin(angle) * SPAWN_RADIUS,
    );
    this.enemyManager.spawn(type, pos);
  }

  onEnemyKilled() {
    this.enemiesKilledThisWave++;
  }

  get isWaveActive() {
    return this.state === 'spawning' || this.state === 'active';
  }

  get isAnnouncing() {
    return this.state === 'announcing';
  }

  get isComplete() {
    return this.state === 'complete';
  }

  get isIdle() {
    return this.state === 'idle';
  }

  getWaveSubtext() {
    if (this.wave <= 2) return 'Drones incoming';
    if (this.wave <= 5) return 'Soldiers have arrived';
    if (this.wave <= 10) return 'The invasion intensifies';
    return 'Maximum threat level';
  }
}
