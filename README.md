# fruit-slice

A fast fruit slicing arcade game built with PHP sessions and vanilla JavaScript.

Fruit flies up from the bottom of the arena. Hold the pointer and swipe across it to slice. Multi-fruit swipes create combo bonuses. Bombs must be avoided.

## Features

- mouse slicing
- touch slicing
- continuous swipe collision detection
- visible blade trail
- multiple fruit types
- fruit particles
- sliced fruit halves
- fruit physics
- bombs
- 3 lives
- combo system
- multi-slice bonus
- increasing difficulty
- pause / restart
- score
- PHP session high score
- best combo tracking
- no framework
- no database

## Requirements

PHP 8.1+

## Run

```bash
php -S localhost:8000
```

Open:

```text
http://localhost:8000
```

## Controls

```text
Hold + swipe     slice fruit
Touch + swipe    slice fruit
P                pause
Space            start
```

## Rules

- slicing fruit gives points
- slicing several fruits in one gesture gives a combo bonus
- missing a fruit costs one life
- the player has 3 lives
- slicing a bomb ends the run immediately
- spawn speed gradually increases

## Project structure

```text
fruit-slice/
├── index.php
├── score.php
├── assets/
│   ├── app.js
│   └── style.css
└── README.md
```

## Architecture

### JavaScript

Canvas and JavaScript handle:

- projectile physics
- slicing
- swipe interpolation
- fruit collision detection
- particles
- sliced halves
- bombs
- combos
- difficulty scaling

### PHP

PHP sessions store:

- high score
- best combo
- games played

The score endpoint validates submitted results before updating the session.

## Hosting

GitHub can host the source code, but GitHub Pages cannot execute PHP.

Use PHP-capable hosting, a VPS or the built-in PHP development server.

## License

MIT
