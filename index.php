<?php
session_start();

if (!isset($_SESSION['fruit_slice'])) {
    $_SESSION['fruit_slice'] = [
        'high_score' => 0,
        'best_combo' => 0,
        'games_played' => 0
    ];
}

$stats = $_SESSION['fruit_slice'];
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Fruit Slice — PHP</title>
  <meta name="description" content="A fast fruit slicing arcade game with combos, bombs and PHP session records.">
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
<main class="shell">
  <header class="hero">
    <div>
      <span class="eyebrow">PHP FRUIT SLICE</span>
      <h1>Slice fast.</h1>
      <p>Cut flying fruit with one smooth swipe, build combos and avoid the bombs.</p>
    </div>
    <button id="restart" class="link-button" type="button">Restart</button>
  </header>

  <section class="stats">
    <div><span>Score</span><strong id="score">0</strong></div>
    <div><span>Best</span><strong id="best"><?= (int)$stats['high_score'] ?></strong></div>
    <div><span>Lives</span><strong id="lives">3</strong></div>
    <div><span>Combo</span><strong id="combo">0×</strong></div>
  </section>

  <section class="layout">
    <div class="game-wrap">
      <canvas id="game" width="900" height="700" aria-label="Fruit Slice game canvas"></canvas>

      <div class="overlay" id="overlay">
        <span class="eyebrow" id="overlay-kicker">READY</span>
        <h2 id="overlay-title">Slice the fruit.</h2>
        <p id="overlay-copy">Hold and swipe across fruit. Missing fruit costs a life. Bombs end the run.</p>
        <button id="start" type="button">Start game</button>
      </div>
    </div>

    <aside class="side">
      <section class="panel">
        <span class="eyebrow">STATUS</span>
        <strong id="status-title">Ready</strong>
        <p id="status-copy">Slice several fruits in one gesture for a combo bonus.</p>
      </section>

      <section class="legend">
        <div><i class="fruit-mark"></i><span>Fruit</span><strong>slice</strong></div>
        <div><i class="combo-mark"></i><span>Multi-slice</span><strong>combo</strong></div>
        <div><i class="bomb-mark"></i><span>Bomb</span><strong>avoid</strong></div>
      </section>

      <section class="actions">
        <button id="pause" type="button">Pause</button>
      </section>
    </aside>
  </section>

  <footer>
    <span>Canvas arcade · swipe slicing · PHP sessions</span>
    <span>fruit-slice</span>
  </footer>
</main>

<script>
window.FRUIT_STATS = <?= json_encode([
  'highScore' => (int)$stats['high_score'],
  'bestCombo' => (int)$stats['best_combo'],
  'gamesPlayed' => (int)$stats['games_played']
]) ?>;
</script>
<script src="assets/app.js"></script>
</body>
</html>
