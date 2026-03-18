/* =============================================
   RUNE TRIBE - Main Application v2
   Navigation, Members, Profile, Chat (cooldown),
   Effects System, Admin Panel
   ============================================= */

(function () {
  'use strict';

  /* ===== EFFECTS REGISTRY ===== */
  // rarity: 'free' = always available, 'drop' = rare drop only, 'shop' = buy in shop, 'admin' = admin only, 'omega' = admin-gifted legendary
  const EFFECTS = [
    // FREE - always available to everyone
    { id: 'none',       name: 'NONE',                      rarity: 'free' },
    { id: 'glow',       name: 'SOFT AURA',                 rarity: 'free' },
    { id: 'pulse',      name: 'HEARTBEAT',                 rarity: 'free' },
    { id: 'shadow',     name: 'DARK CAST',                 rarity: 'free' },
    { id: 'flicker',    name: 'STATIC GHOST',              rarity: 'free' },
    { id: 'outline',    name: 'HOLLOW SHELL',              rarity: 'free' },
    // RARE DROPS - obtained from chat drops only
    { id: 'neon',       name: 'NEON BLEED',                rarity: 'drop' },
    { id: 'ice',        name: 'FROSTBITE KISS',            rarity: 'drop' },
    { id: 'fire',       name: 'HELLFIRE TONGUE',           rarity: 'drop' },
    { id: 'glitch',     name: 'BROKEN SIGNAL',             rarity: 'drop' },
    { id: 'radioactive',name: 'NUCLEAR DECAY',             rarity: 'drop' },
    { id: 'phantom',    name: 'SOUL FADING',               rarity: 'drop' },
    { id: 'lightning',  name: 'THUNDERSTRIKE',              rarity: 'drop' },
    { id: 'blood',      name: 'CRIMSON DRIP',              rarity: 'drop' },
    { id: 'ember',      name: 'DYING EMBER',               rarity: 'drop' },
    { id: 'toxic',      name: 'VENOMSPILL',                rarity: 'drop' },
    { id: 'chrome',     name: 'LIQUID METAL',              rarity: 'drop' },
    { id: 'matrix',     name: 'DIGITAL RAIN',              rarity: 'drop' },
    { id: 'voidfx',     name: 'ABYSSAL VOID',              rarity: 'drop' },
    { id: 'thunder',    name: 'WRATH OF ZEUS',             rarity: 'drop' },
    { id: 'crystal',    name: 'DIAMOND DUST',              rarity: 'drop' },
    { id: 'magma',      name: 'MOLTEN CORE',               rarity: 'drop' },
    { id: 'spectrum',   name: 'PRISM SHIFT',               rarity: 'drop' },
    { id: 'storm',      name: 'CHAOS TEMPEST',             rarity: 'drop' },
    { id: 'inferno',    name: 'NINE CIRCLES',              rarity: 'drop' },
    { id: 'plasma',     name: 'PLASMA SURGE',              rarity: 'drop' },
    { id: 'eclipse',    name: 'SOLAR ECLIPSE',             rarity: 'drop' },
    { id: 'cyber',      name: 'CYBERPUNK WIRE',            rarity: 'drop' },
    { id: 'frost',      name: 'ARCTIC BREATH',             rarity: 'drop' },
    { id: 'nova',       name: 'DYING STAR',                rarity: 'drop' },
    { id: 'vortex',     name: 'BLACK HOLE',                rarity: 'drop' },
    { id: 'demon',      name: 'DEMON SIGIL',               rarity: 'drop' },
    { id: 'wraith',     name: 'WRAITH WALK',               rarity: 'drop' },
    { id: 'titan',      name: 'TITAN\'S CROWN',            rarity: 'drop' },
    { id: 'reaper',     name: 'DEATH\'S TOUCH',            rarity: 'drop' },
    { id: 'dragon',     name: 'DRAGONBREATH',              rarity: 'drop' },
    { id: 'celestial',  name: 'HEAVEN\'S GATE',            rarity: 'drop' },
    { id: 'oblivion',   name: 'OBLIVION CALL',             rarity: 'drop' },
    { id: 'eternal',    name: 'ETERNAL FLAME',             rarity: 'drop' },
    { id: 'supernova',  name: 'SUPERNOVA BURST',           rarity: 'drop' },
    { id: 'god',        name: 'GOD MODE',                  rarity: 'drop' },
    // SHOP-EXCLUSIVE EFFECTS - buy with coins (50 total)
    { id: 'bloodmoon',    name: 'BLOOD MOON RISING',       rarity: 'shop', price: 500 },
    { id: 'witchfire',    name: 'WITCHFIRE HEX',           rarity: 'shop', price: 600 },
    { id: 'deadpixel',    name: 'DEAD PIXEL CURSE',        rarity: 'shop', price: 400 },
    { id: 'nightterror',  name: 'NIGHT TERROR',            rarity: 'shop', price: 750 },
    { id: 'acidrain',     name: 'ACID RAIN',               rarity: 'shop', price: 550 },
    { id: 'hologram',     name: 'HOLOGRAM GHOST',          rarity: 'shop', price: 800 },
    { id: 'soulchain',    name: 'SOULCHAIN BIND',          rarity: 'shop', price: 900 },
    { id: 'pixelrift',    name: 'PIXEL RIFT',              rarity: 'shop', price: 450 },
    { id: 'cosmicrot',    name: 'COSMIC ROT',              rarity: 'shop', price: 1000 },
    { id: 'deathwish',    name: 'DEATH WISH',              rarity: 'shop', price: 1200 },
    { id: 'gravemind',    name: 'GRAVEMIND PULSE',         rarity: 'shop', price: 350 },
    { id: 'miasma',       name: 'MIASMA CLOUD',            rarity: 'shop', price: 400 },
    { id: 'bonefire',     name: 'BONEFIRE RITUAL',         rarity: 'shop', price: 500 },
    { id: 'hexweave',     name: 'HEXWEAVE THREAD',         rarity: 'shop', price: 550 },
    { id: 'rotgut',       name: 'ROTGUT DRENCH',           rarity: 'shop', price: 300 },
    { id: 'skullflame',   name: 'SKULL FLAME',             rarity: 'shop', price: 650 },
    { id: 'spidervein',   name: 'SPIDER VEIN CRACK',       rarity: 'shop', price: 450 },
    { id: 'warpzone',     name: 'WARP ZONE TEAR',          rarity: 'shop', price: 700 },
    { id: 'chaoscode',    name: 'CHAOS CODE',              rarity: 'shop', price: 800 },
    { id: 'cursedink',    name: 'CURSED INK',              rarity: 'shop', price: 500 },
    { id: 'necroplasm',   name: 'NECROPLASM OOZE',         rarity: 'shop', price: 850 },
    { id: 'vipercoil',    name: 'VIPER COIL',              rarity: 'shop', price: 600 },
    { id: 'ashfall',      name: 'ASHFALL DESCENT',         rarity: 'shop', price: 550 },
    { id: 'singularity',  name: 'SINGULARITY CRUSH',       rarity: 'shop', price: 1100 },
    { id: 'staticnova',   name: 'STATIC NOVA',             rarity: 'shop', price: 750 },
    { id: 'phantombleed', name: 'PHANTOM BLEED',           rarity: 'shop', price: 900 },
    { id: 'cryoburn',     name: 'CRYO BURN',               rarity: 'shop', price: 650 },
    { id: 'darkpulsar',   name: 'DARK PULSAR',             rarity: 'shop', price: 1000 },
    { id: 'runecarve',    name: 'RUNE CARVE',              rarity: 'shop', price: 700 },
    { id: 'venomstrike',  name: 'VENOM STRIKE',            rarity: 'shop', price: 500 },
    { id: 'shadowmelt',   name: 'SHADOW MELT',             rarity: 'shop', price: 400 },
    { id: 'ironblood',    name: 'IRON BLOOD',              rarity: 'shop', price: 600 },
    { id: 'nullvoid',     name: 'NULL VOID',               rarity: 'shop', price: 950 },
    { id: 'doomscroll',   name: 'DOOM SCROLL',             rarity: 'shop', price: 800 },
    { id: 'grimspark',    name: 'GRIM SPARK',              rarity: 'shop', price: 450 },
    { id: 'plaguedrift',  name: 'PLAGUE DRIFT',            rarity: 'shop', price: 550 },
    { id: 'wormhole',     name: 'WORMHOLE TRANSIT',        rarity: 'shop', price: 1200 },
    { id: 'razorwind',    name: 'RAZOR WIND',              rarity: 'shop', price: 700 },
    { id: 'helixdna',     name: 'HELIX DNA STRAND',        rarity: 'shop', price: 850 },
    { id: 'ghostchain',   name: 'GHOST CHAIN RATTLE',      rarity: 'shop', price: 600 },
    { id: 'entropywave',  name: 'ENTROPY WAVE',            rarity: 'shop', price: 1500 },
    { id: 'blightmark',   name: 'BLIGHT MARK',             rarity: 'shop', price: 500 },
    { id: 'neurotoxin',   name: 'NEUROTOXIN DRIP',         rarity: 'shop', price: 750 },
    { id: 'abyssfire',    name: 'ABYSS FIRE',              rarity: 'shop', price: 1000 },
    { id: 'voidpulse',    name: 'VOID PULSE',              rarity: 'shop', price: 900 },
    { id: 'crimsonmaw',   name: 'CRIMSON MAW',             rarity: 'shop', price: 650 },
    { id: 'glitchking',   name: 'GLITCH KING',             rarity: 'shop', price: 1800 },
    { id: 'titanfall',    name: 'TITAN FALL',              rarity: 'shop', price: 2000 },
    { id: 'soulreaver',   name: 'SOUL REAVER',             rarity: 'shop', price: 2500 },
    { id: 'infinityveil', name: 'INFINITY VEIL',           rarity: 'shop', price: 3000 },
    // ADMIN-ONLY
    { id: 'divine',     name: 'DIVINE ASCENSION',          rarity: 'admin' },
    { id: 'corrupted',  name: 'CORRUPTED DATA',            rarity: 'admin' },
    { id: 'ancient',    name: 'ANCIENT RUNE',              rarity: 'admin' },
    { id: 'overlord',   name: 'OVERLORD\'S WRATH',         rarity: 'admin' },
    { id: 'omega',      name: 'OMEGA PROTOCOL',            rarity: 'admin' },
    // OMEGA TIER — admin-gifted only, extreme visual effects
    { id: 'omg-godhand',    name: '\u2726 GOD HAND \u2726',              rarity: 'omega' },
    { id: 'omg-voidborn',   name: '\u2620 VOID BORN \u2620',             rarity: 'omega' },
    { id: 'omg-starcollapse', name: '\u2604 STAR COLLAPSE \u2604',       rarity: 'omega' },
    { id: 'omg-bloodgod',   name: '\u2623 BLOOD GOD \u2623',             rarity: 'omega' },
    { id: 'omg-realitybreak', name: '\u29E6 REALITY BREAK \u29E6',       rarity: 'omega' },
    { id: 'omg-eternaldark', name: '\u2588\u2591 ETERNAL DARK \u2591\u2588', rarity: 'omega' },
    { id: 'omg-ascended',   name: '\u2742 ASCENDED ONE \u2742',          rarity: 'omega' },
    { id: 'omg-worldeater', name: '\u2621 WORLD EATER \u2621',           rarity: 'omega' },
    { id: 'omg-glitchgod',  name: '\u2592\u2593 GLITCH GOD \u2593\u2592', rarity: 'omega' },
    { id: 'omg-cosmichorror', name: '\u2740\u2734 COSMIC HORROR \u2734\u2740', rarity: 'omega' },
  ];

  const DROPPABLE_EFFECTS = EFFECTS.filter(e => e.rarity === 'drop');
  const SHOP_EFFECTS = EFFECTS.filter(e => e.rarity === 'shop');

  /* ===== SHOP ITEMS REGISTRY ===== */
  // Categories: effects, fonts, titles, flair
  const SHOP_FONTS = [
    { id: 'font-default',      name: 'DEFAULT (PRESS START)',   price: 0,    css: "'Press Start 2P', monospace" },
    { id: 'font-bloodcrow',    name: 'BLOOD CROW',              price: 300,  css: "'Blood Crow', Impact, sans-serif" },
    { id: 'font-retro',        name: 'RETRO ARCADE',            price: 250,  css: "'Retro Arcade', 'Press Start 2P', monospace" },
    { id: 'font-vt323',        name: 'VT323 TERMINAL',          price: 400,  css: "'VT323', monospace" },
    { id: 'font-silkscreen',   name: 'SILKSCREEN',              price: 350,  css: "'Silkscreen', monospace" },
    { id: 'font-dotgothic',    name: 'DOT GOTHIC',              price: 500,  css: "'DotGothic16', monospace" },
    { id: 'font-monoton',      name: 'MONOTON NEON',            price: 600,  css: "'Monoton', cursive" },
    { id: 'font-bungee',       name: 'BUNGEE SHADE',            price: 550,  css: "'Bungee Shade', cursive" },
    { id: 'font-pixelify',     name: 'PIXELIFY SANS',           price: 300,  css: "'Pixelify Sans', monospace" },
    { id: 'font-rubikglitch',  name: 'RUBIK GLITCH',            price: 500,  css: "'Rubik Glitch', cursive" },
    { id: 'font-creepster',    name: 'CREEPSTER',                price: 400,  css: "'Creepster', cursive" },
    { id: 'font-nosifer',      name: 'NOSIFER',                  price: 700,  css: "'Nosifer', cursive" },
    { id: 'font-rubikburned',  name: 'RUBIK BURNED',            price: 550,  css: "'Rubik Burned', cursive" },
    { id: 'font-rubikdoodle',  name: 'RUBIK DOODLE',            price: 450,  css: "'Rubik Doodle Shadow', cursive" },
    { id: 'font-sixtyfour',    name: 'SIXTYFOUR',               price: 800,  css: "'Sixtyfour', monospace" },
    { id: 'font-rubikwetpaint',name: 'RUBIK WET PAINT',         price: 600,  css: "'Rubik Wet Paint', cursive" },
    { id: 'font-bungeespice',  name: 'BUNGEE SPICE',            price: 750,  css: "'Bungee Spice', cursive" },
    { id: 'font-notable',      name: 'NOTABLE',                  price: 350,  css: "'Notable', sans-serif" },
    { id: 'font-orbitron',     name: 'ORBITRON',                  price: 400,  css: "'Orbitron', sans-serif" },
    { id: 'font-audiowide',    name: 'AUDIOWIDE',                price: 350,  css: "'Audiowide', cursive" },
    { id: 'font-bungeeoutline',name: 'BUNGEE OUTLINE',          price: 500,  css: "'Bungee Outline', cursive" },
    { id: 'font-blackops',     name: 'BLACK OPS ONE',            price: 450,  css: "'Black Ops One', cursive" },
    { id: 'font-russoone',     name: 'RUSSO ONE',                price: 300,  css: "'Russo One', sans-serif" },
    { id: 'font-pressstart',   name: 'PRESS START 2P',           price: 0,    css: "'Press Start 2P', monospace" },
    { id: 'font-share',        name: 'SHARE TECH MONO',         price: 250,  css: "'Share Tech Mono', monospace" },
    { id: 'font-spacemono',    name: 'SPACE MONO',               price: 300,  css: "'Space Mono', monospace" },
    { id: 'font-specialelite', name: 'SPECIAL ELITE',            price: 400,  css: "'Special Elite', cursive" },
    { id: 'font-megrim',       name: 'MEGRIM',                    price: 350,  css: "'Megrim', cursive" },
    { id: 'font-iceland',      name: 'ICELAND',                   price: 300,  css: "'Iceland', cursive" },
    { id: 'font-novacut',      name: 'NOVA CUT',                 price: 450,  css: "'Nova Cut', cursive" },
    { id: 'font-novaflat',     name: 'NOVA FLAT',                price: 350,  css: "'Nova Flat', cursive" },
    { id: 'font-gravitas',     name: 'GRAVITAS ONE',             price: 400,  css: "'Gravitas One', cursive" },
    { id: 'font-rampart',      name: 'RAMPART ONE',              price: 500,  css: "'Rampart One', cursive" },
    { id: 'font-rye',          name: 'RYE',                       price: 450,  css: "'Rye', cursive" },
    { id: 'font-eater',        name: 'EATER',                     price: 600,  css: "'Eater', cursive" },
    { id: 'font-butcherman',   name: 'BUTCHERMAN',               price: 650,  css: "'Butcherman', cursive" },
    { id: 'font-rubikpuddles', name: 'RUBIK PUDDLES',            price: 500,  css: "'Rubik Puddles', cursive" },
    { id: 'font-bungeeinline', name: 'BUNGEE INLINE',            price: 450,  css: "'Bungee Inline', cursive" },
    { id: 'font-rubikvinyl',   name: 'RUBIK VINYL',              price: 400,  css: "'Rubik Vinyl', cursive" },
    { id: 'font-rubikiso',     name: 'RUBIK ISO',                price: 550,  css: "'Rubik Iso', cursive" },
    { id: 'font-rubik80s',     name: 'RUBIK 80S FADE',           price: 700,  css: "'Rubik 80s Fade', cursive" },
    { id: 'font-rubikstorm',   name: 'RUBIK STORM',              price: 600,  css: "'Rubik Storm', cursive" },
    { id: 'font-rubikdistress',name: 'RUBIK DISTRESSED',         price: 500,  css: "'Rubik Distressed', cursive" },
    { id: 'font-emblema',      name: 'EMBLEMA ONE',              price: 450,  css: "'Emblema One', cursive" },
    { id: 'font-rubikmarker',  name: 'RUBIK MARKER HATCH',      price: 550,  css: "'Rubik Marker Hatch', cursive" },
    { id: 'font-rubikscribble',name: 'RUBIK SCRIBBLE',           price: 500,  css: "'Rubik Scribble', cursive" },
    { id: 'font-nabla',        name: 'NABLA',                     price: 900,  css: "'Nabla', cursive" },
    { id: 'font-rubiklines',   name: 'RUBIK LINES',              price: 450,  css: "'Rubik Lines', cursive" },
    { id: 'font-rubikpixels',  name: 'RUBIK PIXELS',             price: 600,  css: "'Rubik Pixels', cursive" },
    { id: 'font-rubikbroken',  name: 'RUBIK BROKEN FAXE',       price: 800,  css: "'Rubik Broken Fax', cursive" },
  ];

  const SHOP_TITLES = [
    { id: 'title-newcomer',    name: 'NEWCOMER',            price: 0,     color: '#666' },
    { id: 'title-drifter',     name: 'DRIFTER',             price: 100,   color: '#777' },
    { id: 'title-lurker',      name: 'LURKER',              price: 150,   color: '#556' },
    { id: 'title-shadow',      name: 'SHADOW WALKER',       price: 200,   color: '#555' },
    { id: 'title-rogue',       name: 'ROGUE AGENT',         price: 250,   color: '#6688aa' },
    { id: 'title-blade',       name: 'BLADE RUNNER',        price: 300,   color: '#88aacc' },
    { id: 'title-outlaw',      name: 'OUTLAW',              price: 300,   color: '#aa6633' },
    { id: 'title-phantom',     name: 'PHANTOM LORD',        price: 400,   color: '#9966ff' },
    { id: 'title-nomad',       name: 'NOMAD KING',          price: 400,   color: '#aa8844' },
    { id: 'title-warlord',     name: 'WARLORD',             price: 500,   color: '#cc4400' },
    { id: 'title-sentinel',    name: 'SENTINEL',            price: 500,   color: '#4488cc' },
    { id: 'title-mystic',      name: 'MYSTIC SAGE',         price: 600,   color: '#44cc88' },
    { id: 'title-berserker',   name: 'BERSERKER',           price: 600,   color: '#dd3300' },
    { id: 'title-nightstalker',name: 'NIGHT STALKER',       price: 650,   color: '#443366' },
    { id: 'title-vanguard',    name: 'VANGUARD',            price: 700,   color: '#5599bb' },
    { id: 'title-marauder',    name: 'MARAUDER',            price: 700,   color: '#995522' },
    { id: 'title-reaper',      name: 'GRIM REAPER',         price: 800,   color: '#880000' },
    { id: 'title-warlock',     name: 'WARLOCK',             price: 800,   color: '#7733aa' },
    { id: 'title-executioner', name: 'EXECUTIONER',         price: 900,   color: '#990000' },
    { id: 'title-gladiator',   name: 'GLADIATOR',           price: 900,   color: '#bb8833' },
    { id: 'title-overlord',    name: 'DARK OVERLORD',       price: 1000,  color: '#aa00aa' },
    { id: 'title-specter',     name: 'SPECTER',             price: 1000,  color: '#334466' },
    { id: 'title-archon',      name: 'ARCHON',              price: 1100,  color: '#6644cc' },
    { id: 'title-ravager',     name: 'RAVAGER',             price: 1100,  color: '#cc2200' },
    { id: 'title-sovereign',   name: 'SOVEREIGN',           price: 1200,  color: '#cc9900' },
    { id: 'title-necromancer', name: 'NECROMANCER',          price: 1200,  color: '#226622' },
    { id: 'title-champion',    name: 'CHAMPION',            price: 1300,  color: '#ddaa00' },
    { id: 'title-revenant',    name: 'REVENANT',            price: 1300,  color: '#445566' },
    { id: 'title-legend',      name: 'LIVING LEGEND',       price: 1500,  color: '#ffaa00' },
    { id: 'title-conqueror',   name: 'CONQUEROR',           price: 1500,  color: '#cc6600' },
    { id: 'title-juggernaut',  name: 'JUGGERNAUT',          price: 1700,  color: '#884400' },
    { id: 'title-demonlord',   name: 'DEMON LORD',          price: 1800,  color: '#bb0000' },
    { id: 'title-sorcerer',    name: 'GRAND SORCERER',      price: 1800,  color: '#8844cc' },
    { id: 'title-warden',      name: 'DEATH WARDEN',        price: 2000,  color: '#335544' },
    { id: 'title-tyrant',      name: 'TYRANT',              price: 2000,  color: '#660022' },
    { id: 'title-god',         name: 'GODSLAYER',           price: 2500,  color: '#ff0000' },
    { id: 'title-oracle',      name: 'ORACLE',              price: 2500,  color: '#44aacc' },
    { id: 'title-oblivion',    name: 'OBLIVION WALKER',     price: 2800,  color: '#220033' },
    { id: 'title-void',        name: 'VOID EMPEROR',        price: 3000,  color: '#220044' },
    { id: 'title-abyssal',     name: 'ABYSSAL KING',        price: 3000,  color: '#110033' },
    { id: 'title-apocalypse',  name: 'APOCALYPSE HERALD',   price: 3500,  color: '#aa2200' },
    { id: 'title-primordial',  name: 'PRIMORDIAL BEING',    price: 3500,  color: '#336644' },
    { id: 'title-ascendant',   name: 'ASCENDANT',           price: 4000,  color: '#ccaa44' },
    { id: 'title-worldender',  name: 'WORLD ENDER',         price: 4000,  color: '#880022' },
    { id: 'title-celestial',   name: 'CELESTIAL TITAN',     price: 4500,  color: '#8888ff' },
    { id: 'title-eternal',     name: 'ETERNAL ONE',         price: 5000,  color: '#ffd700' },
    { id: 'title-omniscient',  name: 'OMNISCIENT',          price: 6000,  color: '#ffffff' },
    { id: 'title-mythic',      name: 'MYTHIC ANCESTOR',     price: 7000,  color: '#ddbb44' },
    { id: 'title-infinitum',   name: 'AD INFINITUM',        price: 8000,  color: '#aaccff' },
    { id: 'title-genesis',     name: 'GENESIS ARCHITECT',   price: 10000, color: '#ff8800' },
  ];

  const SHOP_FLAIR = [
    { id: 'flair-skull',     name: '\u2620 SKULL TAG',          price: 150,  prefix: '\u2620 ' },
    { id: 'flair-crown',     name: '\u265B ROYAL CROWN',       price: 250,  prefix: '\u265B ' },
    { id: 'flair-star',      name: '\u2605 STAR MARK',         price: 200,  prefix: '\u2605 ' },
    { id: 'flair-lightning', name: '\u26A1 LIGHTNING BOLT',     price: 300,  prefix: '\u26A1 ' },
    { id: 'flair-sword',     name: '\u2694 CROSSED SWORDS',    price: 350,  prefix: '\u2694 ' },
    { id: 'flair-diamond',   name: '\u25C6 BLACK DIAMOND',     price: 400,  prefix: '\u25C6 ' },
    { id: 'flair-fire',      name: '\u2739 FIRE SIGIL',        price: 450,  prefix: '\u2739 ' },
    { id: 'flair-biohazard', name: '\u2623 BIOHAZARD',         price: 500,  prefix: '\u2623 ' },
    { id: 'flair-eye',       name: '\u25C9 ALL-SEEING EYE',    price: 600,  prefix: '\u25C9 ' },
    { id: 'flair-moon',      name: '\u263E DARK MOON',         price: 350,  prefix: '\u263E ' },
  ];

  // Parse owned items from comma-separated string (stored in owned_effects field)
  function parseOwnedItems(str) {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }

  function getEffectClass(effectId) {
    return effectId && effectId !== 'none' ? 'fx-' + effectId : '';
  }

  // Parse owned effects from comma-separated string
  function parseOwnedEffects(str) {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }

  function getAvailableEffects(level, isAdmin, ownedEffectsStr) {
    const owned = parseOwnedEffects(ownedEffectsStr);
    return EFFECTS.filter(e => {
      if (e.rarity === 'admin') return isAdmin;
      if (e.rarity === 'omega') return owned.includes(e.id) || isAdmin;
      if (e.rarity === 'free') return true;
      // 'drop' or 'shop' effects: must own it, or be admin
      return isAdmin || owned.includes(e.id);
    });
  }

  // Render avatar HTML - supports video/gif avatars with looping
  function renderAvatar(url, size) {
    if (!url) return '';
    const sizeStyle = size ? `width:${size}px;height:${size}px;` : 'width:100%;height:100%;';
    const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
    if (isVideo) {
      return `<video src="${escapeHtml(url)}" autoplay loop muted playsinline style="${sizeStyle}object-fit:cover;"></video>`;
    }
    return `<img src="${escapeHtml(url)}" alt="" style="width:100%;height:100%;object-fit:cover;image-rendering:pixelated;">`;
  }

  /* ===== ASCII VIDEO ENGINE ===== */
  const video = document.getElementById('video');
  const sourceCanvas = document.getElementById('source');
  const sourceCtx = sourceCanvas.getContext('2d');
  const asciiCanvas = document.getElementById('ascii-canvas');
  const asciiCtx = asciiCanvas.getContext('2d');
  const noVideo = document.getElementById('no-video');

  const CHARS = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
  const COLS = 150, CELL_W = 4, CELL_H = 6, BG_COLOR = '#000', WHITE_THRESHOLD = 245, FPS_TARGET = 12;
  let lastFrameTime = 0;

  function luminance(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }
  function charForLuminance(lum) { return CHARS[Math.min(Math.floor((lum / 255) * CHARS.length), CHARS.length - 1)]; }
  function boostColor(r, g, b, lum) {
    const boost = 1.15, gray = lum;
    return [Math.min(255, Math.round(r * boost + (1 - boost) * gray)), Math.min(255, Math.round(g * boost + (1 - boost) * gray)), Math.min(255, Math.round(b * boost + (1 - boost) * gray))];
  }

  function processFrame() {
    if (video.readyState < 2) return;
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return;
    const cellW = vw / COLS, cellH = cellW * (CELL_H / CELL_W), rows = Math.floor(vh / cellH);
    const outW = COLS * CELL_W, outH = rows * CELL_H;
    sourceCanvas.width = vw; sourceCanvas.height = vh;
    sourceCtx.drawImage(video, 0, 0);
    const data = sourceCtx.getImageData(0, 0, vw, vh).data;
    asciiCanvas.width = outW; asciiCanvas.height = outH;
    asciiCtx.fillStyle = BG_COLOR; asciiCtx.fillRect(0, 0, outW, outH);
    asciiCtx.font = `bold ${CELL_H}px "Consolas","Monaco","Courier New",monospace`;
    asciiCtx.textBaseline = 'top';
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < COLS; col++) {
        const px = Math.floor(col * cellW + cellW / 2), py = Math.floor(row * cellH + cellH / 2);
        let r = 0, g = 0, b = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const sx = Math.min(vw - 1, Math.max(0, px + dx)), sy = Math.min(vh - 1, Math.max(0, py + dy));
          const i = (sy * vw + sx) * 4;
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
        }
        r /= n; g /= n; b /= n;
        const lum = luminance(r, g, b);
        if (lum >= WHITE_THRESHOLD) continue;
        const [rr, gg, bb] = boostColor(r, g, b, lum);
        asciiCtx.fillStyle = `rgb(${rr},${gg},${bb})`;
        asciiCtx.fillText(charForLuminance(lum), col * CELL_W, row * CELL_H);
      }
    }
  }

  function nextFrame(timestamp) {
    if (video.paused || video.ended) return;
    if (timestamp - lastFrameTime >= 1000 / FPS_TARGET) { lastFrameTime = timestamp; processFrame(); }
    requestAnimationFrame(nextFrame);
  }

  video.addEventListener('loadeddata', () => { asciiCanvas.style.display = 'block'; noVideo.style.display = 'none'; video.play().catch(() => {}); requestAnimationFrame(nextFrame); });
  video.addEventListener('error', () => { asciiCanvas.style.display = 'none'; noVideo.style.display = 'block'; });
  video.play().catch(() => {});

  /* ===== SCREEN NAVIGATION ===== */
  let currentScreen = 'screen-title';
  const hud = document.getElementById('player-hud');

  function switchScreen(fromId, toId) {
    const from = document.getElementById(fromId);
    const to = document.getElementById(toId);
    if (!from || !to) return;
    if (toId === 'screen-title' || (fromId !== 'screen-title' && toId === 'screen-nav')) {
      AudioSystem.sfxBack();
    } else {
      AudioSystem.sfxSelect();
    }
    from.classList.remove('visible');
    setTimeout(() => {
      from.classList.remove('active');
      to.classList.add('active');
      to.offsetHeight;
      to.classList.add('visible');
      hud.classList.toggle('show', toId !== 'screen-title');
      currentScreen = toId;
    }, 600);
  }

  // Press Start
  document.getElementById('press-start').addEventListener('click', () => {
    AudioSystem.init();
    AudioSystem.sfxSelect();
    setTimeout(() => AudioSystem.startMusic(), 400);
    switchScreen('screen-title', 'screen-nav');
  });

  // All clickable menu items
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.target;
      if (!target) return;
      if (target === 'screen-shop' && !SupabaseClient.getUser()) {
        AudioSystem.sfxError(); showToast('LOGIN REQUIRED'); return;
      }
      if (target === 'screen-shop') loadShop();
      if (target === 'screen-chat') {
        if (SupabaseClient.getUser()) {
          switchHub(currentChannel);
          SupabaseClient.markMentionsRead();
          updateChatBadge(0);
        } else {
          // Guest chat - read-only
          enterGuestChat();
        }
      }
      switchScreen(currentScreen, target);
    });
    item.addEventListener('mouseenter', () => AudioSystem.sfxHover());
  });

  // Sidebar buttons (shop, admin)
  document.querySelectorAll('.menu-sidebar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (!target) return;
      if (target === 'screen-shop' && !SupabaseClient.getUser()) {
        AudioSystem.sfxError(); showToast('LOGIN REQUIRED'); return;
      }
      if (target === 'screen-shop') loadShop();
      AudioSystem.sfxSelect();
      switchScreen(currentScreen, target);
    });
    btn.addEventListener('mouseenter', () => AudioSystem.sfxHover());
  });

  // Back buttons
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target) switchScreen(currentScreen, target);
    });
    btn.addEventListener('mouseenter', () => AudioSystem.sfxHover());
  });

  // Sound toggle
  document.getElementById('sound-toggle').addEventListener('click', () => {
    AudioSystem.init();
    const muted = AudioSystem.toggleMute();
    document.getElementById('sound-toggle').textContent = muted ? 'SOUND:OFF' : 'SOUND:ON';
    AudioSystem.sfxNavigate();
  });

  /* ===== TOAST ===== */
  function showToast(msg, duration = 2500) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }

  /* ===== AUTH TABS ===== */
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      AudioSystem.sfxNavigate();
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.form).classList.add('active');
    });
  });

  /* ===== AUTH: LOGIN ===== */
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll('.auth-input');
    const email = inputs[0].value.trim();
    const password = inputs[1].value;
    if (!email || !password) { showToast('FILL ALL FIELDS'); AudioSystem.sfxError(); return; }
    try {
      await SupabaseClient.login(email, password);
      AudioSystem.sfxSelect();
      showToast('ACCESS GRANTED');
      inputs.forEach(i => i.value = '');
      switchScreen('screen-auth', 'screen-nav');
    } catch (err) {
      AudioSystem.sfxError();
      showToast(err.message ? err.message.toUpperCase().slice(0, 60) : 'ACCESS DENIED');
    }
  });

  /* ===== AUTH: REGISTER ===== */
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputs = e.target.querySelectorAll('.auth-input');
    const username = inputs[0].value.trim();
    const email = inputs[1].value.trim();
    const password = inputs[2].value;
    const confirm = inputs[3].value;
    if (!username || !email || !password) { showToast('FILL ALL FIELDS'); AudioSystem.sfxError(); return; }
    if (password !== confirm) { showToast('PASSWORDS DO NOT MATCH'); AudioSystem.sfxError(); return; }
    if (password.length < 6) { showToast('PASSWORD MIN 6 CHARACTERS'); AudioSystem.sfxError(); return; }
    if (username.length < 2 || username.length > 20) { showToast('USERNAME 2-20 CHARACTERS'); AudioSystem.sfxError(); return; }
    try {
      await SupabaseClient.register(email, password, username.toUpperCase());
      AudioSystem.sfxSelect();
      showToast('REGISTERED SUCCESSFULLY');
      inputs.forEach(i => i.value = '');
    } catch (err) {
      AudioSystem.sfxError();
      showToast(err.message ? err.message.toUpperCase().slice(0, 60) : 'REGISTRATION FAILED');
    }
  });

  /* ===== AUTH STATE ===== */
  let hasAutoResumed = false;
  SupabaseClient.setOnAuthChange((user, profile) => {
    updateHUD(user, profile);
    updateNavMenu(user, profile);
    updateShopMenu(user);
    updatePurgeBtn();
    updateSpawnDropBtn();

    // Auto-resume session: skip title screen if user is already logged in on page load
    if (user && profile && !hasAutoResumed && currentScreen === 'screen-title') {
      hasAutoResumed = true;
      AudioSystem.init();
      setTimeout(() => AudioSystem.startMusic(), 400);
      const titleEl = document.getElementById('screen-title');
      const navEl = document.getElementById('screen-nav');
      if (titleEl && navEl) {
        titleEl.classList.remove('visible');
        setTimeout(() => {
          titleEl.classList.remove('active');
          navEl.classList.add('active');
          navEl.offsetHeight;
          navEl.classList.add('visible');
          hud.classList.add('show');
          currentScreen = 'screen-nav';
        }, 300);
      }
    }
  });

  function updateNavMenu(user, profile) {
    const authItem = document.querySelector('[data-target="screen-auth"]');
    const adminLi = document.getElementById('admin-menu-btn');
    const chatLi = document.getElementById('chat-menu-li');
    if (!authItem) return;

    if (user) {
      authItem.textContent = 'LOGOUT';
      authItem.dataset.target = '';
      authItem.onclick = async () => {
        await SupabaseClient.logout();
        authItem.textContent = 'LOGIN / REGISTER';
        authItem.dataset.target = 'screen-auth';
        authItem.onclick = null;
        AudioSystem.sfxBack();
        showToast('LOGGED OUT');
        updateHUD(null, null);
        updateNavMenu(null, null);
      };
    } else {
      authItem.textContent = 'LOGIN / REGISTER';
      authItem.dataset.target = 'screen-auth';
      authItem.onclick = null;
    }

    // Chat is always visible (guest = read-only, logged-in = full access)
    if (chatLi) {
      chatLi.style.display = '';
    }

    // Show/hide admin panel option
    if (adminLi) {
      adminLi.style.display = (profile && profile.is_admin) ? '' : 'none';
    }

    // Show/hide sidebar (visible when shop or admin is available)
    const sidebar = document.getElementById('menu-sidebar');
    const shopBtn = document.getElementById('shop-menu-btn');
    if (sidebar) {
      const shopVisible = shopBtn && shopBtn.style.display !== 'none';
      const adminVisible = adminLi && adminLi.style.display !== 'none';
      sidebar.classList.toggle('show', shopVisible || adminVisible);
    }
  }

  /* ===== PLAYER HUD ===== */
  function updateHUD(user, profile) {
    const hudContent = document.getElementById('hud-content');
    if (!user || !profile) {
      hudContent.innerHTML = '<span class="hud-guest">GUEST</span>';
      return;
    }
    const effect = getEffectClass(profile.name_effect);
    const idNum = profile.user_id_num ? ('#' + String(profile.user_id_num).padStart(4, '0')) : '#????';
    hudContent.innerHTML = `
      <div class="hud-avatar" id="hud-avatar-btn">
        ${profile.avatar_url
          ? renderAvatar(profile.avatar_url)
          : '<span class="hud-avatar-placeholder">?</span>'}
      </div>
      <div class="hud-info">
        <span class="hud-username ${effect}" style="color:${escapeHtml(profile.name_color)}">${escapeHtml(profile.username)}</span>
        <span class="hud-rank">${escapeHtml(profile.rank)} ${profile.is_admin ? '[ADMIN]' : ''}</span>
        <span class="hud-stats">LV.${profile.level} | $${profile.balance} | ${idNum}</span>
      </div>
    `;
    hudContent.onclick = () => openProfileEditor();
  }

  /* ===== PROFILE EDITOR ===== */
  // ===== INVENTORY / PROFILE EDITOR =====
  let invCurrentTab = 'effects';
  // Pending selections (applied on save)
  let invSelections = { effect: 'none', font: 'font-default', title: 'title-newcomer', flair: 'none' };

  function openProfileEditor() {
    const profile = SupabaseClient.getProfile();
    if (!profile) return;
    AudioSystem.sfxSelect();

    const user = SupabaseClient.getUser();
    const prefs = user ? getUserPrefs(user.id) : { font: 'font-default', flair: 'none', titleId: 'title-newcomer' };

    // Init selections from current profile
    invSelections = {
      effect: profile.name_effect || 'none',
      font: prefs.font || 'font-default',
      title: prefs.titleId || 'title-newcomer',
      flair: prefs.flair || 'none',
    };

    // Avatar
    const avatarPreview = document.getElementById('edit-avatar-preview');
    avatarPreview.innerHTML = profile.avatar_url
      ? renderAvatar(profile.avatar_url)
      : '<span class="hud-avatar-placeholder">?</span>';

    // Username preview
    document.getElementById('edit-color').value = profile.name_color || '#e02020';
    updateInvPreview();

    // Stats
    const idNum = profile.user_id_num ? ('#' + String(profile.user_id_num).padStart(4, '0')) : '#????';
    const created = new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
    document.getElementById('edit-info').innerHTML = `
      <span class="profile-detail"><span class="label">USER ID:</span> ${idNum}</span>
      <span class="profile-detail"><span class="label">LEVEL:</span> ${profile.level} / 100</span>
      <span class="profile-detail"><span class="label">BALANCE:</span> $${profile.balance}</span>
      <span class="profile-detail"><span class="label">ITEMS:</span> ${parseOwnedItems(profile.owned_effects || '').length}</span>
      <span class="profile-detail"><span class="label">JOINED:</span> ${created}</span>
      ${profile.is_admin ? '<span class="profile-detail"><span class="label">STATUS:</span> ADMIN</span>' : ''}
    `;

    // Render equipped slots + inventory
    updateInvEquipped();
    invCurrentTab = 'effects';
    document.querySelectorAll('[data-inv-tab]').forEach(b => b.classList.toggle('active', b.dataset.invTab === 'effects'));
    renderInvGrid();

    switchScreen(currentScreen, 'screen-editor');
  }

  function updateInvPreview() {
    const preview = document.getElementById('edit-preview-name');
    const profile = SupabaseClient.getProfile();
    if (!preview || !profile) return;
    preview.textContent = profile.username;
    preview.style.color = document.getElementById('edit-color').value;
    preview.className = 'edit-preview-name ' + getEffectClass(invSelections.effect);
  }

  function updateInvEquipped() {
    const el = document.getElementById('inv-equipped');
    if (!el) return;
    const effectObj = EFFECTS.find(e => e.id === invSelections.effect);
    const fontObj = SHOP_FONTS.find(f => f.id === invSelections.font);
    const titleObj = SHOP_TITLES.find(t => t.id === invSelections.title);
    const flairObj = SHOP_FLAIR.find(f => f.id === invSelections.flair);
    el.innerHTML = `
      <div class="inv-equipped-label">\u2605 EQUIPPED LOADOUT \u2605</div>
      <div class="inv-equipped-slot"><span class="slot-label">EFFECT</span><span class="slot-value ${effectObj ? '' : 'empty'}">${effectObj ? escapeHtml(effectObj.name) : 'NONE'}</span></div>
      <div class="inv-equipped-slot"><span class="slot-label">FONT</span><span class="slot-value ${fontObj ? '' : 'empty'}">${fontObj ? escapeHtml(fontObj.name) : 'DEFAULT'}</span></div>
      <div class="inv-equipped-slot"><span class="slot-label">TITLE</span><span class="slot-value ${titleObj ? '' : 'empty'}">${titleObj ? escapeHtml(titleObj.name) : 'NEWCOMER'}</span></div>
      <div class="inv-equipped-slot"><span class="slot-label">FLAIR</span><span class="slot-value ${flairObj ? '' : 'empty'}">${flairObj ? escapeHtml(flairObj.name) : 'NONE'}</span></div>
    `;
  }

  function renderInvGrid() {
    const grid = document.getElementById('inv-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const profile = SupabaseClient.getProfile();
    if (!profile) return;
    const owned = parseOwnedItems(profile.owned_effects || '');

    switch (invCurrentTab) {
      case 'effects': renderInvEffects(grid, owned, profile); break;
      case 'fonts': renderInvFonts(grid, owned, profile); break;
      case 'titles': renderInvTitles(grid, owned, profile); break;
      case 'flair': renderInvFlair(grid, owned, profile); break;
    }
  }

  function renderInvEffects(grid, owned, profile) {
    // "None" option
    const noneItem = createInvItem('NONE', '', 'none', invSelections.effect === 'none', true, 'free');
    noneItem.addEventListener('click', () => { invSelections.effect = 'none'; updateInvPreview(); updateInvEquipped(); renderInvGrid(); AudioSystem.sfxSelect(); });
    grid.appendChild(noneItem);

    const available = getAvailableEffects(profile.level, profile.is_admin, profile.owned_effects);
    available.forEach(e => {
      const isEquipped = invSelections.effect === e.id;
      const rarity = e.rarity === 'omega' ? 'omega' : e.rarity === 'admin' ? 'admin' : e.rarity === 'free' ? 'free' : e.rarity === 'drop' ? 'drop' : e.price >= 1000 ? 'legendary' : e.price >= 700 ? 'epic' : e.price >= 400 ? 'rare' : 'common';
      const previewHtml = `<span class="${getEffectClass(e.id)}" style="color:#e02020;">${escapeHtml(e.name.split(' ')[0])}</span>`;
      const item = createInvItem(e.name, previewHtml, e.id, isEquipped, true, rarity);
      item.addEventListener('click', () => { invSelections.effect = e.id; updateInvPreview(); updateInvEquipped(); renderInvGrid(); AudioSystem.sfxSelect(); });
      grid.appendChild(item);
    });
  }

  function renderInvFonts(grid, owned, profile) {
    SHOP_FONTS.forEach(f => {
      const isOwned = f.price === 0 || owned.includes(f.id) || profile.is_admin;
      const isEquipped = invSelections.font === f.id;
      const rarity = f.price === 0 ? 'free' : f.price >= 500 ? 'epic' : f.price >= 300 ? 'rare' : 'common';
      const previewHtml = `<span style="font-family:${f.css}; font-size:clamp(.5rem, 1.5vw, .8rem);">AaBb 12</span>`;
      const item = createInvItem(f.name, previewHtml, f.id, isEquipped, isOwned, rarity);
      if (isOwned) {
        item.addEventListener('click', () => { invSelections.font = f.id; updateInvEquipped(); renderInvGrid(); AudioSystem.sfxSelect(); });
      }
      grid.appendChild(item);
    });
  }

  function renderInvTitles(grid, owned, profile) {
    SHOP_TITLES.forEach(t => {
      const isOwned = t.price === 0 || owned.includes(t.id) || profile.is_admin;
      const isEquipped = invSelections.title === t.id;
      const rarity = t.price === 0 ? 'free' : t.price >= 1000 ? 'legendary' : t.price >= 500 ? 'epic' : t.price >= 200 ? 'rare' : 'common';
      const previewHtml = `<span style="color:${t.color};">${escapeHtml(t.name)}</span>`;
      const item = createInvItem(t.name, previewHtml, t.id, isEquipped, isOwned, rarity);
      if (isOwned) {
        item.addEventListener('click', () => { invSelections.title = t.id; updateInvEquipped(); renderInvGrid(); AudioSystem.sfxSelect(); });
      }
      grid.appendChild(item);
    });
  }

  function renderInvFlair(grid, owned, profile) {
    // "None" option
    const noneItem = createInvItem('NONE', '-', 'none', invSelections.flair === 'none', true, 'free');
    noneItem.addEventListener('click', () => { invSelections.flair = 'none'; updateInvEquipped(); renderInvGrid(); AudioSystem.sfxSelect(); });
    grid.appendChild(noneItem);

    SHOP_FLAIR.forEach(f => {
      const isOwned = owned.includes(f.id) || profile.is_admin;
      const isEquipped = invSelections.flair === f.id;
      const rarity = f.price >= 400 ? 'epic' : f.price >= 250 ? 'rare' : 'common';
      const previewHtml = `<span style="font-size:clamp(.6rem, 2vw, 1.2rem);">${f.prefix.trim()}</span>`;
      const item = createInvItem(f.name, previewHtml, f.id, isEquipped, isOwned, rarity);
      if (isOwned) {
        item.addEventListener('click', () => { invSelections.flair = f.id; updateInvEquipped(); renderInvGrid(); AudioSystem.sfxSelect(); });
      }
      grid.appendChild(item);
    });
  }

  function createInvItem(name, previewHtml, id, isEquipped, isOwned, rarity) {
    const item = document.createElement('div');
    item.className = 'inv-item' + (isEquipped ? ' equipped' : '') + (!isOwned ? ' locked' : '') + (rarity === 'omega' ? ' omega-item' : '');
    const rarityLabel = rarity === 'omega' ? '\u2726 OMEGA \u2726' : rarity.toUpperCase();
    item.innerHTML = `
      <div class="inv-item-rarity ${rarity}">${rarityLabel}</div>
      <div class="inv-item-preview">${previewHtml}</div>
      <div class="inv-item-name">${escapeHtml(name)}</div>
    `;
    return item;
  }

  // Inventory tab switching
  document.querySelectorAll('[data-inv-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      AudioSystem.sfxNavigate();
      invCurrentTab = btn.dataset.invTab;
      document.querySelectorAll('[data-inv-tab]').forEach(b => b.classList.toggle('active', b === btn));
      renderInvGrid();
    });
    btn.addEventListener('mouseenter', () => AudioSystem.sfxHover());
  });

  // Color picker live preview
  document.getElementById('edit-color').addEventListener('input', () => updateInvPreview());

  // Avatar upload
  document.getElementById('edit-avatar-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('MAX 2MB'); return; }

    const isAnimated = file.type === 'image/gif' || file.type.startsWith('video/');
    if (isAnimated && !SupabaseClient.isAdmin()) {
      showToast('ONLY ADMINS CAN USE GIF/VIDEO AVATARS');
      AudioSystem.sfxError();
      return;
    }

    try {
      showToast('UPLOADING...');
      const url = await SupabaseClient.uploadAvatar(file);
      if (file.type.startsWith('video/')) {
        document.getElementById('edit-avatar-preview').innerHTML = `<video src="${escapeHtml(url)}" autoplay loop muted playsinline style="width:100%;height:100%;object-fit:cover;"></video>`;
      } else {
        document.getElementById('edit-avatar-preview').innerHTML = `<img src="${escapeHtml(url)}" alt="Avatar">`;
      }
      showToast('AVATAR UPDATED'); AudioSystem.sfxSelect();
    } catch (err) {
      AudioSystem.sfxError();
      const errMsg = err.message || err.error || 'UNKNOWN ERROR';
      showToast('UPLOAD FAILED: ' + String(errMsg).toUpperCase().slice(0, 50));
      console.error('Avatar upload error:', err);
    }
  });

  // Save loadout
  document.getElementById('edit-save').addEventListener('click', async () => {
    try {
      const titleObj = SHOP_TITLES.find(t => t.id === invSelections.title);
      const rankName = titleObj ? titleObj.name : 'NEWCOMER';

      await SupabaseClient.updateProfile({
        name_color: document.getElementById('edit-color').value,
        name_effect: invSelections.effect,
        rank: rankName,
      });

      const user = SupabaseClient.getUser();
      if (user) {
        const prefs = getUserPrefs(user.id);
        prefs.font = invSelections.font;
        prefs.flair = invSelections.flair;
        prefs.titleId = invSelections.title;
        saveUserPrefs(user.id, prefs);
      }

      AudioSystem.sfxSelect(); showToast('LOADOUT SAVED');
      switchScreen('screen-editor', 'screen-nav');
    } catch (err) { AudioSystem.sfxError(); showToast('SAVE FAILED'); }
  });

  // User preferences (stored in localStorage for font/flair)
  function getUserPrefs(userId) {
    try {
      const data = localStorage.getItem('rune-prefs-' + userId);
      return data ? JSON.parse(data) : { font: 'font-default', flair: 'none', titleId: 'title-newcomer' };
    } catch (_) { return { font: 'font-default', flair: 'none', titleId: 'title-newcomer' }; }
  }
  function saveUserPrefs(userId, prefs) {
    try { localStorage.setItem('rune-prefs-' + userId, JSON.stringify(prefs)); } catch (_) {}
  }
  function getActiveFlair() {
    const user = SupabaseClient.getUser();
    if (!user) return '';
    const prefs = getUserPrefs(user.id);
    const flair = SHOP_FLAIR.find(f => f.id === prefs.flair);
    return flair ? flair.prefix : '';
  }
  function getActiveFont() {
    const user = SupabaseClient.getUser();
    if (!user) return '';
    const prefs = getUserPrefs(user.id);
    const font = SHOP_FONTS.find(f => f.id === prefs.font);
    return font && prefs.font !== 'font-default' ? 'chat-font-' + prefs.font.replace('font-', '') : '';
  }

  /* ===== CHAT ===== */
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send');
  const mentionSuggestions = document.getElementById('mention-suggestions');
  let chatLoaded = false;
  let chatSubscribed = false; // true once realtime subscriptions are set up
  let currentChannel = 'general';
  let cachedUsers = []; // for @mention autocomplete
  let mentionSelIndex = -1;

  // Hub metadata
  const HUBS = {
    general:  { name: 'GENERAL',  icon: '\u25C6', desc: 'Main chat for the tribe' },
    music:    { name: 'MUSIC',    icon: '\u266B', desc: 'Talk about music, beats, production' },
    trading:  { name: 'TRADING',  icon: '\u2605', desc: 'Trade effects, items, and more' },
    offtopic: { name: 'OFF-TOPIC', icon: '\u263C', desc: 'Anything goes' },
  };

  // Hub unread tracking
  const hubUnread = { general: 0, music: 0, trading: 0, offtopic: 0 };

  // Cooldown state
  let lastMsgTime = 0;
  let recentMessages = [];
  let spamCooldownUntil = 0;

  const COOLDOWN_MS = 5000;
  const SPAM_REPEAT_LIMIT = 3;
  const SPAM_COOLDOWN_MS = 15000;
  const SPAM_MUTE_OFFENSES = 3;
  let spamOffenseCount = 0;

  const RETRO_EMOJIS = {
    ':skull:': '\u2620', ':heart:': '\u2665', ':star:': '\u2605', ':sword:': '\u2694',
    ':lightning:': '\u26A1', ':moon:': '\u263E', ':sun:': '\u2600', ':crown:': '\u265B',
    ':music:': '\u266B', ':fire:': '\u2739', ':check:': '\u2714', ':x:': '\u2718',
    ':arrow:': '\u25BA', ':diamond:': '\u25C6', ':circle:': '\u25CF', ':square:': '\u25A0',
    ':triangle:': '\u25B2', ':wave:': '\u223F', ':eye:': '\u25C9', ':skull2:': '\u2623',
  };

  // Chat commands
  const CHAT_COMMANDS = {
    '/help': () => {
      addSystemMessage('COMMANDS: /me [action] \u2022 /roll [max] \u2022 /shrug \u2022 /tableflip \u2022 /lenny \u2022 /disapproval \u2022 /help');
      return null;
    },
    '/shrug': () => '\u00AF\\_(\u30C4)_/\u00AF',
    '/tableflip': () => '(\u256F\u00B0\u25A1\u00B0)\u256F\uFE35 \u253B\u2501\u253B',
    '/lenny': () => '( \u0361\u00B0 \u035C\u0296 \u0361\u00B0)',
    '/disapproval': () => '\u0CA0_\u0CA0',
  };

  function parseEmojis(text) {
    let result = escapeHtml(text);
    for (const [code, emoji] of Object.entries(RETRO_EMOJIS)) {
      result = result.replace(new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `<span class="retro-emoji">${emoji}</span>`);
    }
    result = result.replace(/@(\w+)/g, '<span class="chat-mention" data-user="$1">@$1</span>');
    return result;
  }

  function renderMessage(msg) {
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.dataset.msgId = msg.id;
    const p = msg.profiles;
    const effect = p ? getEffectClass(p.name_effect) : '';
    const color = p ? p.name_color : '#aaa';
    const username = p ? p.username : 'UNKNOWN';
    const avatarUrl = p ? p.avatar_url : '';
    const idNum = p && p.user_id_num ? ('#' + String(p.user_id_num).padStart(4, '0')) : '';
    const adminTag = p && p.is_admin ? '<span class="chat-admin-tag">[ADMIN]</span>' : '';
    const time = new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    // Check for flair/font (current user's own messages)
    const currentUser = SupabaseClient.getUser();
    const isOwnMsg = currentUser && msg.user_id === currentUser.id;
    const flairPrefix = isOwnMsg ? getActiveFlair() : '';
    const fontClass = isOwnMsg ? getActiveFont() : '';

    // Check if it's an action message (/me)
    const isAction = msg.content.startsWith('/me ');
    const content = isAction ? msg.content.slice(4) : msg.content;
    const textClass = isAction ? 'chat-text chat-cmd-msg' : 'chat-text';

    div.innerHTML = `
      <div class="chat-msg-avatar">
        ${avatarUrl
          ? renderAvatar(avatarUrl)
          : '<span class="chat-msg-avatar-placeholder">\u25C9</span>'}
      </div>
      <div class="chat-msg-body">
        <div class="chat-msg-header">
          <span class="chat-user ${effect}" style="color:${escapeHtml(color)}" data-username="${escapeHtml(username)}">${flairPrefix}${escapeHtml(username)}</span>
          <span class="chat-id">${idNum}</span>
          ${adminTag}
          <span class="chat-time">${time}</span>
        </div>
        <span class="${textClass} ${fontClass}">${isAction ? `* ${escapeHtml(username)} ${parseEmojis(content)}` : parseEmojis(content)}</span>
      </div>
    `;

    // Click username to show profile popup
    const userSpan = div.querySelector('.chat-user');
    if (userSpan && msg.user_id) {
      userSpan.addEventListener('click', () => {
        showUserPopup(msg.user_id, username);
      });
    }

    // Click @mention in message to show their profile popup
    div.querySelectorAll('.chat-mention').forEach(m => {
      m.addEventListener('click', () => {
        const mentionedName = m.dataset.user;
        if (mentionedName) {
          const found = cachedUsers.find(u => u.username.toLowerCase() === mentionedName.toLowerCase());
          if (found) {
            showUserPopup(found.id, found.username);
          } else {
            chatInput.value += '@' + mentionedName + ' ';
            chatInput.focus();
          }
        }
      });
    });

    return div;
  }

  function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'chat-system';
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // --- Hub switching ---
  function switchHub(channel) {
    if (channel === currentChannel && chatLoaded) return;
    currentChannel = channel;
    const hub = HUBS[channel];

    // Update sidebar active state
    document.querySelectorAll('.chat-hub-item').forEach(item => {
      item.classList.toggle('active', item.dataset.channel === channel);
    });

    // Update header
    document.getElementById('chat-header-icon')?.remove();
    const headerIcon = document.querySelector('.chat-header-icon');
    if (headerIcon) headerIcon.textContent = hub.icon;
    document.getElementById('chat-header-name').textContent = hub.name;
    document.getElementById('chat-header-desc').textContent = hub.desc;

    // Clear unread for this hub
    hubUnread[channel] = 0;
    updateHubUnreadBadges();

    // Reload messages for this channel
    chatLoaded = false;
    loadChat();
    AudioSystem.sfxNavigate();
  }

  function updateHubUnreadBadges() {
    document.querySelectorAll('.chat-hub-item').forEach(item => {
      const ch = item.dataset.channel;
      const badge = item.querySelector('.hub-unread');
      if (badge) {
        if (hubUnread[ch] > 0 && ch !== currentChannel) {
          badge.textContent = hubUnread[ch];
          badge.classList.add('show');
        } else {
          badge.classList.remove('show');
        }
      }
    });
  }

  // Wire up hub clicks
  document.querySelectorAll('.chat-hub-item').forEach(item => {
    item.addEventListener('click', () => switchHub(item.dataset.channel));
  });

  async function loadChat() {
    if (chatLoaded) return;
    chatLoaded = true;

    // One-time setup: subscriptions, user cache, DMs
    if (!chatSubscribed) {
      chatSubscribed = true;

      // Subscribe to ALL messages (filter by channel client-side)
      SupabaseClient.subscribeChat((msg) => {
        const msgChannel = msg.channel || 'general';
        if (msgChannel === currentChannel) {
          const content = msg.content || '';
          let el;
          if (isDropMessage(content)) {
            el = renderDropMessage(msg);
            if (el) AudioSystem.sfxMention();
          } else if (isClaimMessage(content)) {
            el = renderClaimMessage(msg);
          } else {
            el = renderMessage(msg);
            AudioSystem.sfxChat();
            incrementTabUnread();
          }
          if (el) {
            chatMessages.appendChild(el);
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
        } else {
          // Unread badge for other hub
          if (hubUnread[msgChannel] !== undefined) {
            hubUnread[msgChannel]++;
            updateHubUnreadBadges();
          }
        }
      });

      // Load cached users for @mention autocomplete
      try {
        cachedUsers = await SupabaseClient.fetchAllProfiles(100);
      } catch (e) { cachedUsers = []; }

      // Load DM conversations
      loadDMList();

      // Subscribe to DMs
      try {
        SupabaseClient.subscribeDMs((dm) => {
          const user = SupabaseClient.getUser();
          if (!user) return;
          const partnerId = dm.from_user_id === user.id ? dm.to_user_id : dm.from_user_id;

          // If DM panel is open for this partner, show message
          if (activeDMPartner === partnerId) {
            appendDMMessage(dm);
            // Mark as read
            if (dm.to_user_id === user.id) SupabaseClient.markDMsRead(dm.from_user_id);
          }
          // Refresh DM list
          loadDMList();
          if (dm.to_user_id === user.id) AudioSystem.sfxMention();
        });
      } catch (e) { /* DM subscription failed - table may not exist */ }

      // Online count (estimate from cached users)
      updateOnlineCount();

      // Start rare effect drop timer
      startDropTimer();
    }

    // Load messages for current channel
    try {
      const messages = await SupabaseClient.fetchMessages(50, currentChannel);
      chatMessages.innerHTML = '';
      if (messages.length === 0) {
        addSystemMessage('NO MESSAGES YET. BE THE FIRST TO SPEAK.');
      } else {
        // First pass: find all claim messages to mark drops as claimed
        messages.forEach(msg => {
          if (isClaimMessage(msg.content)) {
            const info = parseClaimMessage(msg.content);
            claimedDropIds.add(info.dropMsgId);
          }
        });
        // Second pass: render all messages
        messages.forEach(msg => {
          const content = msg.content || '';
          let el;
          if (isDropMessage(content)) {
            el = renderDropMessage(msg);
          } else if (isClaimMessage(content)) {
            el = renderClaimMessage(msg);
          } else {
            el = renderMessage(msg);
          }
          if (el) chatMessages.appendChild(el);
        });
      }
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
      chatMessages.innerHTML = '<div class="chat-system">FAILED TO LOAD MESSAGES</div>';
    }
  }

  function updateOnlineCount() {
    const el = document.getElementById('chat-online-count');
    if (el) {
      const count = Math.max(1, cachedUsers.length);
      el.innerHTML = `<span class="chat-online-dot"></span><span>${count} MEMBERS</span>`;
    }
  }

  // --- Admin Purge Channel ---
  const purgeBtn = document.getElementById('chat-purge-btn');
  function updatePurgeBtn() {
    if (purgeBtn) {
      purgeBtn.style.display = SupabaseClient.isAdmin() ? '' : 'none';
    }
  }
  if (purgeBtn) {
    purgeBtn.addEventListener('click', async () => {
      if (!SupabaseClient.isAdmin()) return;
      if (!confirm('PURGE ALL MESSAGES IN ' + (HUBS[currentChannel]?.name || currentChannel).toUpperCase() + '? THIS CANNOT BE UNDONE.')) return;
      try {
        await SupabaseClient.adminPurgeChannel(currentChannel);
        chatMessages.innerHTML = '';
        addSystemMessage('CHANNEL PURGED BY ADMIN');
        showToast('CHANNEL PURGED');
        AudioSystem.sfxSelect();
      } catch (err) {
        showToast('PURGE FAILED');
        AudioSystem.sfxError();
      }
    });
  }

  /* ===== RARE EFFECT DROP SYSTEM ===== */
  const DROP_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
  const DROP_CLAIM_WINDOW_MS = 5 * 60 * 1000; // 5 minutes to claim
  const DROP_DUPE_REWARD = 100; // coins for owning the effect already
  let dropTimer = null;
  // Track claimed drops locally so we don't double-claim
  const claimedDropIds = new Set();

  // Drop message format: __DROP__:effectId
  // Claim message format: __CLAIMED__:effectId:dropMsgId:claimerUsername
  const DROP_PREFIX = '__DROP__:';
  const CLAIM_PREFIX = '__CLAIMED__:';

  function isDropMessage(content) { return content.startsWith(DROP_PREFIX); }
  function isClaimMessage(content) { return content.startsWith(CLAIM_PREFIX); }
  function isSystemDropMessage(content) { return isDropMessage(content) || isClaimMessage(content); }

  function parseDropMessage(content) {
    // __DROP__:effectId
    const effectId = content.slice(DROP_PREFIX.length);
    return DROPPABLE_EFFECTS.find(e => e.id === effectId) || null;
  }

  function parseClaimMessage(content) {
    // __CLAIMED__:effectId:dropMsgId:claimerUsername
    const parts = content.slice(CLAIM_PREFIX.length).split(':');
    return { effectId: parts[0], dropMsgId: parts[1], claimer: parts.slice(2).join(':') };
  }

  function startDropTimer() {
    if (dropTimer) clearInterval(dropTimer);
    dropTimer = setInterval(() => {
      if (currentScreen === 'screen-chat' && SupabaseClient.getUser()) {
        spawnDropMessage();
      }
    }, DROP_INTERVAL_MS);
  }

  // Spawn a drop by inserting a special message into the current channel
  async function spawnDropMessage(specificEffectId) {
    let effect;
    if (specificEffectId) {
      effect = DROPPABLE_EFFECTS.find(e => e.id === specificEffectId);
    }
    if (!effect) {
      effect = DROPPABLE_EFFECTS[Math.floor(Math.random() * DROPPABLE_EFFECTS.length)];
    }
    try {
      await SupabaseClient.sendMessage(DROP_PREFIX + effect.id, currentChannel);
    } catch (err) {
      showToast('DROP SPAWN FAILED');
      AudioSystem.sfxError();
    }
  }

  // Claim a drop by inserting a claim message + updating profile
  async function claimDrop(dropMsgId, effectId, dropTime) {
    // Check if expired (5 min window)
    const dropDate = new Date(dropTime).getTime();
    if (Date.now() - dropDate > DROP_CLAIM_WINDOW_MS) {
      showToast('DROP EXPIRED');
      AudioSystem.sfxError();
      return;
    }

    if (claimedDropIds.has(dropMsgId)) {
      showToast('ALREADY CLAIMED');
      AudioSystem.sfxError();
      return;
    }

    const user = SupabaseClient.getUser();
    const profile = SupabaseClient.getProfile();
    if (!user || !profile) { showToast('LOGIN REQUIRED'); AudioSystem.sfxError(); return; }

    const owned = parseOwnedEffects(profile.owned_effects || '');
    const alreadyOwned = owned.includes(effectId);
    const effect = DROPPABLE_EFFECTS.find(e => e.id === effectId);
    const effectName = effect ? effect.name : effectId.toUpperCase();

    try {
      // Update profile first
      if (alreadyOwned) {
        const newBalance = (profile.balance || 0) + DROP_DUPE_REWARD;
        await SupabaseClient.updateProfile({ balance: newBalance });
      } else {
        owned.push(effectId);
        await SupabaseClient.updateProfile({ owned_effects: owned.join(',') });
      }

      // Send claim message so all users see it
      await SupabaseClient.sendMessage(
        CLAIM_PREFIX + effectId + ':' + dropMsgId + ':' + profile.username,
        currentChannel
      );

      claimedDropIds.add(dropMsgId);

      if (alreadyOwned) {
        showToast('ALREADY OWNED! +$' + DROP_DUPE_REWARD + ' COINS');
      } else {
        showToast('\u2605 CLAIMED: ' + effectName + '!');
      }
      AudioSystem.sfxSelect();

      // Refresh profile
      await SupabaseClient.fetchProfile();
    } catch (err) {
      showToast('CLAIM FAILED: ' + (err.message || 'ERROR').toUpperCase().slice(0, 50));
      AudioSystem.sfxError();
    }
  }

  // Render a drop message (called from renderMessage)
  function renderDropMessage(msg) {
    const effect = parseDropMessage(msg.content);
    if (!effect) return null;

    const div = document.createElement('div');
    div.className = 'chat-drop';
    div.dataset.msgId = msg.id;
    div.dataset.effectId = effect.id;

    const dropTime = new Date(msg.created_at).getTime();
    const remaining = DROP_CLAIM_WINDOW_MS - (Date.now() - dropTime);
    const isExpired = remaining <= 0;
    const isClaimed = claimedDropIds.has(String(msg.id));

    div.innerHTML = `
      <div class="chat-drop-inner${isClaimed ? ' claimed' : ''}${isExpired && !isClaimed ? ' expired' : ''}">
        <div class="chat-drop-icon">\u2605</div>
        <div class="chat-drop-info">
          <div class="chat-drop-title">RARE EFFECT DROP!</div>
          <div class="chat-drop-effect ${getEffectClass(effect.id)}">${escapeHtml(effect.name)}</div>
          <div class="chat-drop-timer" data-drop-timer="${msg.id}">${isExpired ? 'EXPIRED' : isClaimed ? 'CLAIMED' : ''}</div>
        </div>
        ${!isExpired && !isClaimed ? `<button class="chat-drop-claim" data-drop-claim="${msg.id}">\u2605 CLAIM</button>` : ''}
      </div>
    `;

    // Wire up claim button
    const claimBtn = div.querySelector('[data-drop-claim]');
    if (claimBtn) {
      claimBtn.addEventListener('click', () => claimDrop(String(msg.id), effect.id, msg.created_at));
    }

    // Start countdown if not expired
    if (!isExpired && !isClaimed) {
      const timerEl = div.querySelector('[data-drop-timer]');
      const countdownInterval = setInterval(() => {
        const rem = DROP_CLAIM_WINDOW_MS - (Date.now() - dropTime);
        if (rem <= 0 || claimedDropIds.has(String(msg.id))) {
          clearInterval(countdownInterval);
          if (!claimedDropIds.has(String(msg.id))) {
            if (timerEl) timerEl.textContent = 'EXPIRED';
            const inner = div.querySelector('.chat-drop-inner');
            if (inner) inner.classList.add('expired');
            const btn = div.querySelector('.chat-drop-claim');
            if (btn) btn.remove();
          }
          return;
        }
        const mins = Math.floor(rem / 60000);
        const secs = Math.floor((rem % 60000) / 1000);
        timerEl.textContent = `${mins}:${String(secs).padStart(2, '0')} REMAINING`;
      }, 1000);
    }

    return div;
  }

  // Render a claim message (called from renderMessage)
  function renderClaimMessage(msg) {
    const info = parseClaimMessage(msg.content);
    const effect = DROPPABLE_EFFECTS.find(e => e.id === info.effectId);
    const effectName = effect ? effect.name : info.effectId.toUpperCase();

    // Mark the original drop as claimed
    claimedDropIds.add(info.dropMsgId);

    // Update the original drop element if it exists in DOM
    const dropEl = chatMessages.querySelector(`.chat-drop[data-msg-id="${info.dropMsgId}"]`);
    if (dropEl) {
      const inner = dropEl.querySelector('.chat-drop-inner');
      if (inner) inner.classList.add('claimed');
      const btn = dropEl.querySelector('.chat-drop-claim');
      if (btn) btn.remove();
      const timer = dropEl.querySelector('[data-drop-timer]');
      if (timer) timer.textContent = 'CLAIMED BY ' + info.claimer;
    }

    // Render a system-style claim announcement
    const div = document.createElement('div');
    div.className = 'chat-system chat-claim-msg';
    div.innerHTML = `\u2605 <span style="color:#e02020;">${escapeHtml(info.claimer)}</span> CLAIMED THE <span class="${getEffectClass(info.effectId)}" style="color:#e02020;">${escapeHtml(effectName)}</span> EFFECT!`;
    return div;
  }

  // Admin spawn drop controls
  const spawnDropBtn = document.getElementById('chat-spawn-drop-btn');
  function updateSpawnDropBtn() {
    if (spawnDropBtn) {
      spawnDropBtn.style.display = SupabaseClient.isAdmin() ? '' : 'none';
    }
  }
  if (spawnDropBtn) {
    spawnDropBtn.addEventListener('click', () => {
      if (!SupabaseClient.isAdmin()) return;
      const modal = document.getElementById('spawn-drop-modal');
      if (modal) {
        const sel = document.getElementById('spawn-drop-select');
        if (sel) {
          sel.innerHTML = '<option value="random">RANDOM</option>' +
            DROPPABLE_EFFECTS.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
        }
        modal.classList.add('show');
        AudioSystem.sfxNavigate();
      }
    });
  }

  // Spawn modal confirm
  const spawnConfirmBtn = document.getElementById('spawn-drop-confirm');
  if (spawnConfirmBtn) {
    spawnConfirmBtn.addEventListener('click', () => {
      const sel = document.getElementById('spawn-drop-select');
      const val = sel ? sel.value : 'random';
      document.getElementById('spawn-drop-modal')?.classList.remove('show');
      spawnDropMessage(val === 'random' ? null : val);
      showToast('DROP SPAWNED!');
    });
  }

  const spawnCancelBtn = document.getElementById('spawn-drop-cancel');
  if (spawnCancelBtn) {
    spawnCancelBtn.addEventListener('click', () => {
      document.getElementById('spawn-drop-modal')?.classList.remove('show');
    });
  }

  // --- Cooldown ---
  function checkCooldown(content) {
    const now = Date.now();
    if (spamCooldownUntil > now) {
      const secs = Math.ceil((spamCooldownUntil - now) / 1000);
      showToast(`SPAM COOLDOWN: ${secs}S`);
      AudioSystem.sfxError();
      return false;
    }
    if (now - lastMsgTime < COOLDOWN_MS) {
      const secs = Math.ceil((COOLDOWN_MS - (now - lastMsgTime)) / 1000);
      showToast(`WAIT ${secs}S`);
      AudioSystem.sfxError();
      return false;
    }
    const trimmed = content.trim().toLowerCase();
    recentMessages.push({ time: now, content: trimmed });
    recentMessages = recentMessages.filter(m => now - m.time < 60000);
    const repeatCount = recentMessages.filter(m => m.content === trimmed).length;
    if (repeatCount >= SPAM_REPEAT_LIMIT) {
      spamOffenseCount++;
      if (spamOffenseCount >= SPAM_MUTE_OFFENSES) {
        SupabaseClient.updateProfile({ is_muted: true, muted_until: new Date(now + 30 * 60000).toISOString() }).catch(() => {});
        showToast('MUTED FOR 30 MINUTES (SPAM)');
        spamCooldownUntil = now + 30 * 60000;
      } else {
        spamCooldownUntil = now + SPAM_COOLDOWN_MS;
        showToast(`REPEATED TEXT - ${SPAM_COOLDOWN_MS / 1000}S COOLDOWN`);
      }
      AudioSystem.sfxError();
      return false;
    }
    return true;
  }

  // --- Send message with command support ---
  async function sendChatMessage() {
    const content = chatInput.value.trim();
    if (!content) return;
    hideMentionSuggestions();

    // Handle commands
    if (content.startsWith('/')) {
      const parts = content.split(' ');
      const cmd = parts[0].toLowerCase();

      // /help
      if (cmd === '/help') {
        CHAT_COMMANDS['/help']();
        chatInput.value = '';
        return;
      }

      // /roll [max]
      if (cmd === '/roll') {
        const max = parseInt(parts[1]) || 100;
        const roll = Math.floor(Math.random() * max) + 1;
        const profile = SupabaseClient.getProfile();
        const name = profile ? profile.username : 'USER';
        addSystemMessage(`\u2605 ${name} rolled ${roll} (1-${max})`);
        chatInput.value = '';
        AudioSystem.sfxSelect();
        return;
      }

      // Text replacement commands
      const textCmd = CHAT_COMMANDS[cmd];
      if (textCmd && cmd !== '/help') {
        const result = textCmd();
        if (result) {
          if (!checkCooldown(result)) return;
          chatInput.value = '';
          lastMsgTime = Date.now();
          try { await SupabaseClient.sendMessage(result, currentChannel); }
          catch (err) { showToast('SEND FAILED'); AudioSystem.sfxError(); }
        }
        return;
      }

      // /me action
      if (cmd === '/me' && parts.length > 1) {
        if (!checkCooldown(content)) return;
        chatInput.value = '';
        lastMsgTime = Date.now();
        try { await SupabaseClient.sendMessage(content, currentChannel); }
        catch (err) { showToast('SEND FAILED'); AudioSystem.sfxError(); }
        return;
      }
    }

    // Regular message
    if (!checkCooldown(content)) return;
    chatInput.value = '';
    lastMsgTime = Date.now();
    try {
      await SupabaseClient.sendMessage(content, currentChannel);
    } catch (err) {
      showToast(err.message ? err.message.toUpperCase().slice(0, 60) : 'SEND FAILED');
      AudioSystem.sfxError();
    }
  }

  chatSendBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keydown', (e) => {
    // Handle mention suggestion navigation
    if (mentionSuggestions.classList.contains('show')) {
      const items = mentionSuggestions.querySelectorAll('.mention-suggestion');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        mentionSelIndex = Math.min(mentionSelIndex + 1, items.length - 1);
        updateMentionSelection(items);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        mentionSelIndex = Math.max(mentionSelIndex - 1, 0);
        updateMentionSelection(items);
        return;
      }
      if ((e.key === 'Tab' || e.key === 'Enter') && mentionSelIndex >= 0 && items[mentionSelIndex]) {
        e.preventDefault();
        selectMention(items[mentionSelIndex].dataset.username);
        return;
      }
      if (e.key === 'Escape') {
        hideMentionSuggestions();
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  });

  // --- @Mention autocomplete ---
  chatInput.addEventListener('input', () => {
    const val = chatInput.value;
    const cursorPos = chatInput.selectionStart;
    const textBefore = val.slice(0, cursorPos);

    // Find the @mention being typed
    const mentionMatch = textBefore.match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      const matches = cachedUsers.filter(u =>
        u.username.toLowerCase().includes(query)
      ).slice(0, 6);

      if (matches.length > 0) {
        showMentionSuggestions(matches);
      } else {
        hideMentionSuggestions();
      }
    } else {
      hideMentionSuggestions();
    }
  });

  function showMentionSuggestions(users) {
    mentionSelIndex = 0;
    mentionSuggestions.innerHTML = '';
    users.forEach((u, i) => {
      const div = document.createElement('div');
      div.className = 'mention-suggestion' + (i === 0 ? ' selected' : '');
      div.dataset.username = u.username;
      const effect = getEffectClass(u.name_effect);
      div.innerHTML = `
        <span class="mention-av">${u.avatar_url
          ? renderAvatar(u.avatar_url)
          : '<span style="color:#333;font-size:.25rem;">\u25C9</span>'}</span>
        <span class="${effect}" style="color:${escapeHtml(u.name_color)}">${escapeHtml(u.username)}</span>
        ${u.is_admin ? '<span style="color:#e02020;font-size:.7em;">[A]</span>' : ''}
      `;
      div.addEventListener('click', () => selectMention(u.username));
      mentionSuggestions.appendChild(div);
    });
    mentionSuggestions.classList.add('show');
  }

  function hideMentionSuggestions() {
    mentionSuggestions.classList.remove('show');
    mentionSelIndex = -1;
  }

  function updateMentionSelection(items) {
    items.forEach((item, i) => item.classList.toggle('selected', i === mentionSelIndex));
  }

  function selectMention(username) {
    const val = chatInput.value;
    const cursorPos = chatInput.selectionStart;
    const textBefore = val.slice(0, cursorPos);
    const textAfter = val.slice(cursorPos);
    const newBefore = textBefore.replace(/@\w*$/, '@' + username + ' ');
    chatInput.value = newBefore + textAfter;
    chatInput.focus();
    chatInput.selectionStart = chatInput.selectionEnd = newBefore.length;
    hideMentionSuggestions();
  }

  // --- Emoji picker ---
  const emojiBtn = document.getElementById('emoji-toggle');
  const emojiPicker = document.getElementById('emoji-picker');
  emojiBtn.addEventListener('click', () => { AudioSystem.sfxNavigate(); emojiPicker.classList.toggle('show'); });
  for (const [code, emoji] of Object.entries(RETRO_EMOJIS)) {
    const btn = document.createElement('span');
    btn.className = 'emoji-option';
    btn.textContent = emoji;
    btn.title = code;
    btn.addEventListener('click', () => { chatInput.value += code; chatInput.focus(); emojiPicker.classList.remove('show'); AudioSystem.sfxNavigate(); });
    emojiPicker.appendChild(btn);
  }

  // Dismiss mention suggestions & emoji picker when clicking outside
  document.addEventListener('click', (e) => {
    if (mentionSuggestions.classList.contains('show') &&
        !mentionSuggestions.contains(e.target) &&
        e.target !== chatInput) {
      hideMentionSuggestions();
    }
    if (emojiPicker.classList.contains('show') &&
        !emojiPicker.contains(e.target) &&
        e.target !== emojiBtn) {
      emojiPicker.classList.remove('show');
    }
  });

  // --- Chat badge (mentions) ---
  function updateChatBadge(count) {
    const badge = document.getElementById('chat-badge');
    if (count > 0) { badge.textContent = '+' + count; badge.classList.add('show'); }
    else { badge.classList.remove('show'); }
  }
  SupabaseClient.setOnMentionUpdate(updateChatBadge);

  // --- DM System ---
  let activeDMPartner = null;
  const dmPanel = document.getElementById('dm-panel');
  const dmOverlay = document.getElementById('dm-panel-overlay');
  const dmMessages = document.getElementById('dm-panel-messages');
  const dmInput = document.getElementById('dm-panel-input');
  const dmSendBtn = document.getElementById('dm-panel-send');
  const dmSearchModal = document.getElementById('dm-search-modal');
  const dmSearchInput = document.getElementById('dm-search-input');
  const dmSearchResults = document.getElementById('dm-search-results');

  async function loadDMList() {
    const list = document.getElementById('chat-dm-list');
    if (!list) return;
    try {
      const convos = await SupabaseClient.fetchDMConversations();
      list.innerHTML = '';
      convos.forEach(c => {
        const li = document.createElement('li');
        li.className = 'chat-dm-item' + (activeDMPartner === c.partnerId ? ' active' : '');
        const partner = c.partner;
        li.innerHTML = `
          <span class="dm-avatar">${partner && partner.avatar_url
            ? renderAvatar(partner.avatar_url)
            : '<span style="color:#333;font-size:.2rem;">\u25C9</span>'}</span>
          <span>${escapeHtml(partner ? partner.username : 'USER')}</span>
          <span class="dm-unread${c.unread > 0 ? ' show' : ''}"></span>
        `;
        li.addEventListener('click', () => {
          openDMPanel(c.partnerId, partner ? partner.username : 'USER');
          AudioSystem.sfxNavigate();
        });
        list.appendChild(li);
      });
    } catch (e) { /* silently fail */ }
  }

  async function openDMPanel(partnerId, partnerName) {
    activeDMPartner = partnerId;
    document.getElementById('dm-panel-name').textContent = '\u2709 ' + escapeHtml(partnerName);
    dmMessages.innerHTML = '<div class="chat-system">LOADING...</div>';
    dmPanel.classList.add('show');
    dmOverlay.classList.add('show');

    try {
      await SupabaseClient.markDMsRead(partnerId);
      const messages = await SupabaseClient.fetchDMsWith(partnerId, 50);
      dmMessages.innerHTML = '';
      if (messages.length === 0) {
        dmMessages.innerHTML = '<div class="chat-system">NO MESSAGES YET</div>';
      } else {
        messages.forEach(dm => appendDMMessage(dm));
      }
      dmMessages.scrollTop = dmMessages.scrollHeight;
    } catch (e) {
      dmMessages.innerHTML = '<div class="chat-system">FAILED TO LOAD</div>';
    }

    loadDMList();
    dmInput.focus();
  }

  function appendDMMessage(dm) {
    const user = SupabaseClient.getUser();
    if (!user) return;
    const isSent = dm.from_user_id === user.id;
    const div = document.createElement('div');
    div.className = 'dm-msg ' + (isSent ? 'sent' : 'received');
    const time = new Date(dm.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    div.innerHTML = `
      <div class="dm-msg-content">
        <div class="dm-msg-bubble">${parseEmojis(dm.content)}</div>
        <span class="dm-msg-time">${time}</span>
      </div>
    `;
    dmMessages.appendChild(div);
    dmMessages.scrollTop = dmMessages.scrollHeight;
  }

  function closeDMPanel() {
    activeDMPartner = null;
    dmPanel.classList.remove('show');
    dmOverlay.classList.remove('show');
    AudioSystem.sfxBack();
  }

  document.getElementById('dm-panel-close').addEventListener('click', closeDMPanel);
  dmOverlay.addEventListener('click', () => {
    // Close search modal if open
    if (dmSearchModal.classList.contains('show')) {
      dmSearchModal.classList.remove('show');
    }
    // Close DM panel if open
    if (dmPanel.classList.contains('show')) {
      closeDMPanel();
      return;
    }
    // If neither panel was open, just hide overlay
    dmOverlay.classList.remove('show');
  });

  async function sendDM() {
    const content = dmInput.value.trim();
    if (!content || !activeDMPartner) return;
    dmInput.value = '';
    try {
      await SupabaseClient.sendDM(activeDMPartner, content);
    } catch (err) {
      showToast('DM FAILED');
      AudioSystem.sfxError();
    }
  }

  dmSendBtn.addEventListener('click', sendDM);
  dmInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); sendDM(); }
  });

  // --- New DM search ---
  document.getElementById('chat-dm-new').addEventListener('click', () => {
    dmSearchModal.classList.add('show');
    dmOverlay.classList.add('show');
    dmSearchInput.value = '';
    dmSearchResults.innerHTML = '';
    dmSearchInput.focus();
    AudioSystem.sfxNavigate();
  });

  let dmSearchTimeout;
  dmSearchInput.addEventListener('input', () => {
    clearTimeout(dmSearchTimeout);
    dmSearchTimeout = setTimeout(async () => {
      const q = dmSearchInput.value.trim();
      if (!q) { dmSearchResults.innerHTML = ''; return; }
      const users = await SupabaseClient.searchUsers(q, 8);
      const currentUserId = SupabaseClient.getUser()?.id;
      dmSearchResults.innerHTML = '';
      users.filter(u => u.id !== currentUserId).forEach(u => {
        const div = document.createElement('div');
        div.className = 'dm-search-result';
        div.innerHTML = `
          <span class="dm-avatar" style="width:16px;height:16px;border:1px solid #330000;overflow:hidden;display:flex;align-items:center;justify-content:center;">
            ${u.avatar_url ? renderAvatar(u.avatar_url) : '<span style="color:#333;font-size:.2rem;">\u25C9</span>'}
          </span>
          <span style="color:${escapeHtml(u.name_color)}">${escapeHtml(u.username)}</span>
          ${u.is_admin ? '<span style="color:#e02020;font-size:.7em;">[A]</span>' : ''}
        `;
        div.addEventListener('click', () => {
          dmSearchModal.classList.remove('show');
          openDMPanel(u.id, u.username);
          AudioSystem.sfxSelect();
        });
        dmSearchResults.appendChild(div);
      });
      if (users.filter(u => u.id !== currentUserId).length === 0) {
        dmSearchResults.innerHTML = '<div class="chat-system">NO USERS FOUND</div>';
      }
    }, 300);
  });


  /* ===== ADMIN PANEL ===== */
  const adminUserList = document.getElementById('admin-user-list');
  const adminSearch = document.getElementById('admin-search');
  const adminDetail = document.getElementById('admin-detail');
  let adminSelectedUser = null;
  let adminAllUsers = [];

  // Admin tab switching
  document.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      AudioSystem.sfxNavigate();
      document.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('admin-tab-' + btn.dataset.adminTab)?.classList.add('active');
      // Load tab data
      if (btn.dataset.adminTab === 'messages') loadAdminMessages();
      if (btn.dataset.adminTab === 'stats') loadAdminStats();
    });
  });

  // Open admin panel
  document.querySelector('[data-target="screen-admin"]')?.addEventListener('click', () => {
    if (!SupabaseClient.isAdmin()) return;
    loadAdminUsers();
  });

  async function loadAdminUsers(search = '') {
    if (!SupabaseClient.isAdmin()) return;
    try {
      const users = await SupabaseClient.adminFetchAllUsers(search);
      adminAllUsers = users;
      adminUserList.innerHTML = '';
      users.forEach(u => {
        const div = document.createElement('div');
        div.className = 'admin-user-row';
        const idNum = u.user_id_num ? ('#' + String(u.user_id_num).padStart(4, '0')) : '#????';
        let flags = '';
        if (u.is_admin) flags += ' [A]';
        if (u.is_banned) flags += ' [BANNED]';
        if (u.is_muted) flags += ' [MUTED]';
        div.innerHTML = `<span class="admin-user-id">${idNum}</span> <span class="admin-user-name">${escapeHtml(u.username)}</span><span class="admin-flags">${flags}</span>`;
        div.addEventListener('click', () => { selectAdminUser(u); AudioSystem.sfxNavigate(); });
        adminUserList.appendChild(div);
      });
    } catch (err) {
      adminUserList.innerHTML = '<div class="chat-system">FAILED TO LOAD USERS</div>';
    }
  }

  if (adminSearch) {
    let searchTimeout;
    adminSearch.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => loadAdminUsers(adminSearch.value.trim()), 300);
    });
  }

  function selectAdminUser(user) {
    adminSelectedUser = user;
    const idNum = user.user_id_num ? ('#' + String(user.user_id_num).padStart(4, '0')) : '#????';
    const created = new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
    const muteInfo = user.is_muted && user.muted_until
      ? `UNTIL ${new Date(user.muted_until).toLocaleString()}`
      : (user.is_muted ? 'YES' : 'NO');

    adminDetail.innerHTML = `
      <div class="admin-detail-header">${escapeHtml(user.username)} ${idNum}</div>
      <div class="admin-detail-info">
        <span class="profile-detail"><span class="label">UUID:</span> ${user.id.slice(0, 8)}...</span>
        <span class="profile-detail"><span class="label">RANK:</span> ${escapeHtml(user.rank)}</span>
        <span class="profile-detail"><span class="label">LEVEL:</span> ${user.level}</span>
        <span class="profile-detail"><span class="label">BALANCE:</span> $${user.balance}</span>
        <span class="profile-detail"><span class="label">EFFECT:</span> ${escapeHtml(user.name_effect)}</span>
        <span class="profile-detail"><span class="label">OWNED FX:</span> ${parseOwnedEffects(user.owned_effects).length} (${parseOwnedEffects(user.owned_effects).join(', ') || 'NONE'})</span>
        <span class="profile-detail"><span class="label">ADMIN:</span> ${user.is_admin ? 'YES' : 'NO'}</span>
        <span class="profile-detail"><span class="label">BANNED:</span> ${user.is_banned ? 'YES' : 'NO'}</span>
        <span class="profile-detail"><span class="label">MUTED:</span> ${muteInfo}</span>
        <span class="profile-detail"><span class="label">JOINED:</span> ${created}</span>
      </div>
      <div class="admin-actions">
        <button class="admin-btn ${user.is_banned ? 'active' : ''}" data-action="ban">${user.is_banned ? 'UNBAN' : 'BAN'}</button>
        <button class="admin-btn ${user.is_muted ? 'active' : ''}" data-action="mute">${user.is_muted ? 'UNMUTE' : 'MUTE 30M'}</button>
        <button class="admin-btn" data-action="mute-1h">MUTE 1H</button>
        <button class="admin-btn" data-action="mute-24h">MUTE 24H</button>
        <button class="admin-btn" data-action="admin">${user.is_admin ? 'REMOVE ADMIN' : 'MAKE ADMIN'}</button>
      </div>
      <div class="admin-set-row">
        <span class="edit-label">SET USERNAME</span>
        <input type="text" id="admin-username-input" class="auth-input admin-small-input" value="${escapeHtml(user.username)}">
        <button class="admin-btn" data-action="set-username">SET</button>
      </div>
      <div class="admin-set-row">
        <span class="edit-label">SET LEVEL</span>
        <input type="number" id="admin-level-input" class="auth-input admin-small-input" min="1" max="100" value="${user.level}">
        <button class="admin-btn" data-action="set-level">SET</button>
      </div>
      <div class="admin-set-row">
        <span class="edit-label">SET RANK</span>
        <input type="text" id="admin-rank-input" class="auth-input admin-small-input" value="${escapeHtml(user.rank)}">
        <button class="admin-btn" data-action="set-rank">SET</button>
      </div>
      <div class="admin-set-row">
        <span class="edit-label">SET BALANCE</span>
        <input type="number" id="admin-balance-input" class="auth-input admin-small-input" min="0" value="${user.balance}">
        <button class="admin-btn" data-action="set-balance">SET</button>
      </div>
      <div class="admin-set-row">
        <span class="edit-label">SET ACTIVE EFFECT</span>
        <select id="admin-effect-select" class="edit-select">
          ${EFFECTS.map(e => `<option value="${e.id}" ${e.id === user.name_effect ? 'selected' : ''}>${e.name}${e.rarity === 'omega' ? ' [\u2726 OMEGA]' : e.rarity === 'admin' ? ' [ADMIN]' : e.rarity === 'drop' ? ' \u2605' : ''}</option>`).join('')}
        </select>
        <button class="admin-btn" data-action="set-effect">SET</button>
      </div>
      <div class="admin-set-row">
        <span class="edit-label">GRANT EFFECT</span>
        <select id="admin-grant-effect-select" class="edit-select">
          <optgroup label="\u2726 OMEGA TIER">
            ${EFFECTS.filter(e => e.rarity === 'omega').map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
          </optgroup>
          <optgroup label="\u2605 DROP EFFECTS">
            ${DROPPABLE_EFFECTS.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
          </optgroup>
          <optgroup label="SHOP EFFECTS">
            ${SHOP_EFFECTS.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
          </optgroup>
        </select>
        <button class="admin-btn" data-action="grant-effect">GRANT</button>
      </div>
      <div class="admin-danger-zone">
        <div class="admin-danger-title">\u26A0 DANGER ZONE</div>
        <div class="admin-actions">
          <button class="admin-btn danger" data-action="purge-msgs">PURGE MESSAGES</button>
          <button class="admin-btn danger" data-action="reset-profile">RESET PROFILE</button>
        </div>
      </div>
    `;

    // Wire up buttons
    adminDetail.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => handleAdminAction(btn.dataset.action));
    });
  }

  async function handleAdminAction(action) {
    if (!adminSelectedUser) return;
    const uid = adminSelectedUser.id;
    try {
      switch (action) {
        case 'ban':
          await SupabaseClient.adminBanUser(uid, !adminSelectedUser.is_banned);
          showToast(adminSelectedUser.is_banned ? 'USER UNBANNED' : 'USER BANNED');
          break;
        case 'mute':
          if (adminSelectedUser.is_muted) {
            await SupabaseClient.adminUnmuteUser(uid);
            showToast('USER UNMUTED');
          } else {
            await SupabaseClient.adminMuteUser(uid, 30);
            showToast('USER MUTED FOR 30 MINUTES');
          }
          break;
        case 'mute-1h':
          await SupabaseClient.adminMuteUser(uid, 60);
          showToast('USER MUTED FOR 1 HOUR');
          break;
        case 'mute-24h':
          await SupabaseClient.adminMuteUser(uid, 1440);
          showToast('USER MUTED FOR 24 HOURS');
          break;
        case 'admin':
          await SupabaseClient.adminSetAdmin(uid, !adminSelectedUser.is_admin);
          showToast(adminSelectedUser.is_admin ? 'ADMIN REMOVED' : 'ADMIN GRANTED');
          break;
        case 'set-username': {
          const name = document.getElementById('admin-username-input').value.trim();
          if (name && name.length >= 2 && name.length <= 20) {
            await SupabaseClient.adminSetUsername(uid, name);
            showToast('USERNAME SET TO ' + name.toUpperCase());
          } else { showToast('USERNAME MUST BE 2-20 CHARS'); AudioSystem.sfxError(); return; }
          break;
        }
        case 'set-level': {
          const lvl = parseInt(document.getElementById('admin-level-input').value) || 1;
          await SupabaseClient.adminSetLevel(uid, lvl);
          showToast('LEVEL SET TO ' + Math.max(1, Math.min(100, lvl)));
          break;
        }
        case 'set-rank': {
          const rank = document.getElementById('admin-rank-input').value.trim();
          if (rank) { await SupabaseClient.adminSetRank(uid, rank.toUpperCase()); showToast('RANK UPDATED'); }
          break;
        }
        case 'set-balance': {
          const bal = parseInt(document.getElementById('admin-balance-input').value) || 0;
          await SupabaseClient.adminSetBalance(uid, bal);
          showToast('BALANCE SET TO $' + Math.max(0, bal));
          break;
        }
        case 'set-effect': {
          const fx = document.getElementById('admin-effect-select').value;
          await SupabaseClient.adminSetEffect(uid, fx);
          showToast('EFFECT SET TO ' + fx.toUpperCase());
          break;
        }
        case 'grant-effect': {
          const grantFx = document.getElementById('admin-grant-effect-select').value;
          const currentOwned = parseOwnedEffects(adminSelectedUser.owned_effects || '');
          if (currentOwned.includes(grantFx)) {
            showToast('USER ALREADY OWNS ' + grantFx.toUpperCase());
            AudioSystem.sfxError();
            return;
          }
          currentOwned.push(grantFx);
          await SupabaseClient.adminUpdateUser(uid, { owned_effects: currentOwned.join(',') });
          showToast('GRANTED ' + grantFx.toUpperCase() + ' TO ' + adminSelectedUser.username);
          break;
        }
        case 'purge-msgs':
          await SupabaseClient.adminPurgeUserMessages(uid);
          showToast('ALL MESSAGES PURGED FOR ' + adminSelectedUser.username);
          break;
        case 'reset-profile':
          await SupabaseClient.adminResetProfile(uid);
          showToast('PROFILE RESET FOR ' + adminSelectedUser.username);
          break;
      }
      AudioSystem.sfxSelect();
      // Refresh user data
      const users = await SupabaseClient.adminFetchAllUsers(adminSearch ? adminSearch.value : '');
      const updated = users.find(u => u.id === uid);
      if (updated) selectAdminUser(updated);
      loadAdminUsers(adminSearch ? adminSearch.value : '');
    } catch (err) {
      AudioSystem.sfxError();
      showToast('ACTION FAILED: ' + (err.message || 'ERROR').toUpperCase().slice(0, 40));
    }
  }

  // --- Admin Messages Tab ---
  async function loadAdminMessages(search = '') {
    const log = document.getElementById('admin-msg-log');
    if (!log) return;
    try {
      const messages = await SupabaseClient.fetchMessages(100, 'general');
      // Also fetch from other channels
      const allMessages = [...messages];
      for (const ch of ['music', 'trading', 'offtopic']) {
        try {
          const chMsgs = await SupabaseClient.fetchMessages(50, ch);
          allMessages.push(...chMsgs);
        } catch (e) { /* skip */ }
      }
      allMessages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const filtered = search
        ? allMessages.filter(m => {
            const u = m.profiles?.username || '';
            return u.toLowerCase().includes(search.toLowerCase()) || m.content.toLowerCase().includes(search.toLowerCase());
          })
        : allMessages;

      log.innerHTML = '';
      if (filtered.length === 0) {
        log.innerHTML = '<div class="chat-system">NO MESSAGES FOUND</div>';
        return;
      }
      filtered.slice(0, 200).forEach(msg => {
        const row = document.createElement('div');
        row.className = 'admin-msg-row';
        const p = msg.profiles;
        const username = p ? p.username : 'UNKNOWN';
        const time = new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        const date = new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const channel = msg.channel || 'general';
        row.innerHTML = `
          <span class="admin-msg-user" data-uid="${msg.user_id}">${escapeHtml(username)}</span>
          <span style="color:#282828;font-size:7px;">[${channel}]</span>
          <span class="admin-msg-text">${isDropMessage(msg.content) ? '\u2605 EFFECT DROP' : isClaimMessage(msg.content) ? '\u2605 DROP CLAIMED' : escapeHtml(msg.content.slice(0, 120))}</span>
          <span class="admin-msg-time">${date} ${time}</span>
          <button class="admin-msg-delete" data-msgid="${msg.id}" title="Delete">\u2718</button>
        `;
        // Click username to select in user tab
        row.querySelector('.admin-msg-user')?.addEventListener('click', () => {
          const found = adminAllUsers.find(u => u.id === msg.user_id);
          if (found) {
            // Switch to users tab and select
            document.querySelectorAll('[data-admin-tab]').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            document.querySelector('[data-admin-tab="users"]')?.classList.add('active');
            document.getElementById('admin-tab-users')?.classList.add('active');
            selectAdminUser(found);
            AudioSystem.sfxNavigate();
          }
        });
        // Delete message
        row.querySelector('.admin-msg-delete')?.addEventListener('click', async () => {
          try {
            await SupabaseClient.adminDeleteMessage(msg.id);
            row.remove();
            showToast('MESSAGE DELETED');
            AudioSystem.sfxSelect();
          } catch (e) {
            showToast('DELETE FAILED');
            AudioSystem.sfxError();
          }
        });
        log.appendChild(row);
      });
    } catch (err) {
      log.innerHTML = '<div class="chat-system">FAILED TO LOAD MESSAGES</div>';
    }
  }

  // Admin message search
  const adminMsgSearch = document.getElementById('admin-msg-search');
  if (adminMsgSearch) {
    let msgSearchTimeout;
    adminMsgSearch.addEventListener('input', () => {
      clearTimeout(msgSearchTimeout);
      msgSearchTimeout = setTimeout(() => loadAdminMessages(adminMsgSearch.value.trim()), 300);
    });
  }

  // --- Admin Stats Tab ---
  async function loadAdminStats() {
    const grid = document.getElementById('admin-stats-grid');
    if (!grid) return;
    try {
      const users = adminAllUsers.length > 0 ? adminAllUsers : await SupabaseClient.adminFetchAllUsers('');
      const totalUsers = users.length;
      const admins = users.filter(u => u.is_admin).length;
      const banned = users.filter(u => u.is_banned).length;
      const muted = users.filter(u => u.is_muted).length;
      const avgLevel = totalUsers > 0 ? Math.round(users.reduce((s, u) => s + (u.level || 1), 0) / totalUsers) : 0;
      const totalBalance = users.reduce((s, u) => s + (u.balance || 0), 0);
      const highestLevel = users.reduce((max, u) => Math.max(max, u.level || 1), 0);
      const newestUser = users.length > 0 ? users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] : null;

      grid.innerHTML = `
        <div class="admin-stat-card"><div class="admin-stat-value">${totalUsers}</div><div class="admin-stat-label">TOTAL USERS</div></div>
        <div class="admin-stat-card"><div class="admin-stat-value">${admins}</div><div class="admin-stat-label">ADMINS</div></div>
        <div class="admin-stat-card"><div class="admin-stat-value">${banned}</div><div class="admin-stat-label">BANNED</div></div>
        <div class="admin-stat-card"><div class="admin-stat-value">${muted}</div><div class="admin-stat-label">MUTED</div></div>
        <div class="admin-stat-card"><div class="admin-stat-value">${avgLevel}</div><div class="admin-stat-label">AVG LEVEL</div></div>
        <div class="admin-stat-card"><div class="admin-stat-value">${highestLevel}</div><div class="admin-stat-label">MAX LEVEL</div></div>
        <div class="admin-stat-card"><div class="admin-stat-value">$${totalBalance}</div><div class="admin-stat-label">TOTAL BALANCE</div></div>
        <div class="admin-stat-card"><div class="admin-stat-value">${newestUser ? escapeHtml(newestUser.username).slice(0, 10) : '-'}</div><div class="admin-stat-label">NEWEST USER</div></div>
      `;
    } catch (err) {
      grid.innerHTML = '<div class="chat-system">FAILED TO LOAD STATS</div>';
    }
  }

  /* ===== USER PROFILE POPUP (Discord-style) ===== */
  const userPopup = document.getElementById('user-popup');
  const userPopupOverlay = document.getElementById('user-popup-overlay');
  const userPopupAvatar = document.getElementById('user-popup-avatar');
  const userPopupBody = document.getElementById('user-popup-body');
  const userPopupActions = document.getElementById('user-popup-actions');

  function closeUserPopup() {
    userPopup.classList.remove('show');
    userPopupOverlay.classList.remove('show');
  }
  userPopupOverlay.addEventListener('click', closeUserPopup);

  async function showUserPopup(userId, username) {
    AudioSystem.sfxNavigate();
    // Show loading state
    userPopupAvatar.innerHTML = '<span class="user-popup-avatar-placeholder">\u25C9</span>';
    userPopupBody.innerHTML = '<div class="chat-system">LOADING...</div>';
    userPopupActions.innerHTML = '';
    userPopup.classList.add('show');
    userPopupOverlay.classList.add('show');

    try {
      const profile = await SupabaseClient.fetchProfileById(userId);
      if (!profile) { closeUserPopup(); showToast('USER NOT FOUND'); return; }

      const effect = getEffectClass(profile.name_effect);
      const idNum = profile.user_id_num ? ('#' + String(profile.user_id_num).padStart(4, '0')) : '#????';
      const joined = new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
      const adminTag = profile.is_admin ? '<span style="color:#e02020;font-size:8px;margin-left:4px;">[ADMIN]</span>' : '';

      userPopupAvatar.innerHTML = profile.avatar_url
        ? renderAvatar(profile.avatar_url)
        : '<span class="user-popup-avatar-placeholder">\u25C9</span>';

      userPopupBody.innerHTML = `
        <div class="user-popup-name ${effect}" style="color:${escapeHtml(profile.name_color)}">${escapeHtml(profile.username)}${adminTag}</div>
        <div class="user-popup-id">${idNum}</div>
        <div class="user-popup-divider"></div>
        <div class="user-popup-section">ABOUT</div>
        <div class="user-popup-info">
          <span class="label">RANK:</span> ${escapeHtml(profile.rank)}<br>
          <span class="label">LEVEL:</span> ${profile.level}<br>
          <span class="label">EFFECT:</span> ${escapeHtml(profile.name_effect || 'NONE').toUpperCase()}<br>
          <span class="label">EFFECTS OWNED:</span> ${parseOwnedEffects(profile.owned_effects).length}<br>
          <span class="label">JOINED:</span> ${joined}
        </div>
      `;

      // Actions - show DM button if logged in and not viewing own profile
      const currentUser = SupabaseClient.getUser();
      const isOwnProfile = currentUser && currentUser.id === userId;
      let actionsHTML = '';
      if (!isOwnProfile && currentUser) {
        actionsHTML += `<button class="user-popup-btn primary" id="popup-dm-btn">\u2709 MESSAGE</button>`;
      }
      actionsHTML += `<button class="user-popup-btn" id="popup-mention-btn">@ MENTION</button>`;
      actionsHTML += `<button class="user-popup-btn" id="popup-close-btn">\u2718 CLOSE</button>`;
      userPopupActions.innerHTML = actionsHTML;

      // Wire up action buttons
      document.getElementById('popup-close-btn')?.addEventListener('click', closeUserPopup);
      document.getElementById('popup-dm-btn')?.addEventListener('click', () => {
        closeUserPopup();
        openDMPanel(userId, profile.username);
        AudioSystem.sfxSelect();
      });
      document.getElementById('popup-mention-btn')?.addEventListener('click', () => {
        closeUserPopup();
        chatInput.value += '@' + profile.username + ' ';
        chatInput.focus();
        AudioSystem.sfxSelect();
      });
    } catch (err) {
      closeUserPopup();
      showToast('FAILED TO LOAD PROFILE');
    }
  }

  /* ===== MEMBERS ===== */
  // Core crew - hardcoded founding/key members with roles
  const CORE_CREW = {
    'PERCPUKE':            { role: 'Manager', since: '2019' },
    'ALLCONTEMPT':         { role: 'Vocals & Graphic Designer', since: '2020' },
    'DEADBELIEF':          { role: 'Vocals & Producer', since: '2025' },
    'ALKOHOLINMEINEMBLUT': { role: 'Website Manager', since: '2026' },
    'ALLSOMECAT':          { role: 'Producer & Mixxer', since: '2026' },
  };

  let membersLoaded = false;

  async function loadMembers() {
    if (membersLoaded) return;
    membersLoaded = true;

    const coreList = document.getElementById('members-core-list');
    const communityList = document.getElementById('members-community-list');
    if (!coreList || !communityList) return;

    coreList.innerHTML = '<div class="chat-system">LOADING...</div>';
    communityList.innerHTML = '';

    try {
      const profiles = await SupabaseClient.fetchAllProfiles(200);
      coreList.innerHTML = '';

      const coreMembers = [];
      const communityMembers = [];

      profiles.forEach(p => {
        const upperName = (p.username || '').toUpperCase();
        if (CORE_CREW[upperName]) {
          coreMembers.push({ ...p, crewInfo: CORE_CREW[upperName] });
        } else {
          communityMembers.push(p);
        }
      });

      // Also add any core crew not yet registered (show as placeholder)
      Object.entries(CORE_CREW).forEach(([name, info]) => {
        if (!coreMembers.find(m => (m.username || '').toUpperCase() === name)) {
          coreMembers.push({ username: name, crewInfo: info, placeholder: true });
        }
      });

      // Sort core crew by 'since' year
      coreMembers.sort((a, b) => parseInt(a.crewInfo.since) - parseInt(b.crewInfo.since));

      // Render core crew
      coreMembers.forEach(m => {
        coreList.appendChild(renderMemberCard(m, true));
      });

      // Render community
      if (communityMembers.length > 0) {
        communityMembers.forEach(m => {
          communityList.appendChild(renderMemberCard(m, false));
        });
      } else {
        communityList.innerHTML = '<div class="chat-system" style="font-size:8px;">NO COMMUNITY MEMBERS YET</div>';
      }
    } catch (err) {
      coreList.innerHTML = '<div class="chat-system">FAILED TO LOAD MEMBERS</div>';
    }
  }

  function renderMemberCard(member, isCore) {
    const li = document.createElement('li');
    const card = document.createElement('div');
    card.className = 'member-card';

    const effect = member.placeholder ? '' : getEffectClass(member.name_effect);
    const color = member.name_color || '#aaa';
    const idNum = member.user_id_num ? ('#' + String(member.user_id_num).padStart(4, '0')) : '';
    const rank = member.rank || (isCore ? 'CORE' : 'MEMBER');

    let metaText = '';
    if (isCore && member.crewInfo) {
      metaText = `${escapeHtml(member.crewInfo.role)} \u2022 Since ${member.crewInfo.since}`;
    } else {
      metaText = `${escapeHtml(rank)} \u2022 LV.${member.level || 1}`;
    }

    card.innerHTML = `
      <div class="member-card-avatar">
        ${member.avatar_url
          ? renderAvatar(member.avatar_url)
          : '<span class="member-card-avatar-placeholder">\u25C9</span>'}
      </div>
      <div class="member-card-info">
        <div class="member-card-name">
          <span class="${effect}" style="color:${escapeHtml(color)}">${escapeHtml(member.username)}</span>
          ${member.is_admin ? '<span class="member-card-badge">[ADMIN]</span>' : ''}
          ${isCore ? '<span class="member-card-badge">CORE</span>' : ''}
          <span class="member-card-id">${idNum}</span>
        </div>
        <div class="member-card-meta">${metaText}</div>
      </div>
    `;

    card.addEventListener('mouseenter', () => AudioSystem.sfxHover());
    card.addEventListener('click', () => {
      showMemberProfile(member, isCore);
    });

    li.appendChild(card);
    return li;
  }

  async function showMemberProfile(member, isCore) {
    const profileCard = document.getElementById('profile-card');
    const effect = member.placeholder ? '' : getEffectClass(member.name_effect);
    const color = member.name_color || '#e02020';
    const rank = member.rank || (isCore ? 'CORE CREW' : 'MEMBER');
    const joined = member.created_at
      ? new Date(member.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase()
      : (isCore && member.crewInfo ? member.crewInfo.since : '???');

    let msgCount = 0;
    if (member.id) {
      try { msgCount = await SupabaseClient.fetchUserMessageCount(member.id); } catch (_) {}
    }

    profileCard.innerHTML = `
      <div class="profile-card-avatar">
        ${member.avatar_url
          ? renderAvatar(member.avatar_url)
          : '<span class="profile-card-avatar-placeholder">\u25C9</span>'}
      </div>
      <div class="profile-name ${effect}" style="color:${escapeHtml(color)}">${escapeHtml(member.username)}</div>
      ${member.is_admin ? '<div style="font-size:.4rem;color:#e02020;letter-spacing:.1em;margin-bottom:.3rem;">[ADMINISTRATOR]</div>' : ''}
      <div class="pixel-divider"></div>
      ${isCore && member.crewInfo ? `<p class="profile-detail"><span class="label">ROLE:</span> ${escapeHtml(member.crewInfo.role)}</p>` : ''}
      <p class="profile-detail"><span class="label">RANK:</span> ${escapeHtml(rank)}</p>
      <div class="profile-stats-row">
        <div class="profile-stat"><div class="profile-stat-value">${member.level || 1}</div><div class="profile-stat-label">LEVEL</div></div>
        <div class="profile-stat"><div class="profile-stat-value">${parseOwnedEffects(member.owned_effects).length}</div><div class="profile-stat-label">EFFECTS</div></div>
        <div class="profile-stat"><div class="profile-stat-value">${msgCount}</div><div class="profile-stat-label">MESSAGES</div></div>
      </div>
      <p class="profile-detail"><span class="label">EFFECT:</span> <span class="${effect}" style="color:${escapeHtml(color)}">${escapeHtml(member.name_effect || 'NONE').toUpperCase()}</span></p>
      <p class="profile-detail"><span class="label">JOINED:</span> ${joined}</p>
    `;
    switchScreen('screen-members', 'screen-profile');
  }

  // Load members when navigating to the members screen
  document.querySelector('[data-target="screen-members"]')?.addEventListener('click', () => {
    membersLoaded = false; // Reload each time to catch new registrations
    loadMembers();
  });

  /* ===== SHOP SYSTEM ===== */
  let currentShopTab = 'effects';

  // Show/hide shop in nav
  function updateShopMenu(user) {
    const shopBtn = document.getElementById('shop-menu-btn');
    if (shopBtn) shopBtn.style.display = user ? '' : 'none';
    // Update sidebar visibility
    const sidebar = document.getElementById('menu-sidebar');
    const adminBtn = document.getElementById('admin-menu-btn');
    if (sidebar) {
      const shopVisible = shopBtn && shopBtn.style.display !== 'none';
      const adminVisible = adminBtn && adminBtn.style.display !== 'none';
      sidebar.classList.toggle('show', shopVisible || adminVisible);
    }
  }

  // Open shop
  document.querySelector('[data-target="screen-shop"]')?.addEventListener('click', () => {
    if (!SupabaseClient.getUser()) {
      AudioSystem.sfxError(); showToast('LOGIN REQUIRED'); return;
    }
    loadShop();
  });

  // Shop tab switching
  document.querySelectorAll('[data-shop-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      AudioSystem.sfxNavigate();
      currentShopTab = btn.dataset.shopTab;
      document.querySelectorAll('[data-shop-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderShopItems();
    });
  });

  function loadShop() {
    const profile = SupabaseClient.getProfile();
    if (!profile) return;
    document.getElementById('shop-balance').textContent = '$' + (profile.balance || 0);
    renderShopItems();
  }

  function renderShopItems() {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const profile = SupabaseClient.getProfile();
    if (!profile) return;
    const owned = parseOwnedItems(profile.owned_effects || '');

    switch (currentShopTab) {
      case 'effects':
        renderShopEffects(grid, owned, profile);
        break;
      case 'fonts':
        renderShopFonts(grid, owned, profile);
        break;
      case 'titles':
        renderShopTitles(grid, owned, profile);
        break;
      case 'flair':
        renderShopFlair(grid, owned, profile);
        break;
    }
  }

  function renderShopEffects(grid, owned, profile) {
    SHOP_EFFECTS.forEach(effect => {
      const isOwned = owned.includes(effect.id);
      const canAfford = (profile.balance || 0) >= effect.price;
      const rarity = effect.price >= 1000 ? 'legendary' : effect.price >= 700 ? 'epic' : effect.price >= 400 ? 'rare' : 'common';

      const item = document.createElement('div');
      item.className = 'shop-item' + (isOwned ? ' owned' : '');
      item.innerHTML = `
        <div class="shop-item-rarity ${rarity}">${rarity.toUpperCase()}</div>
        <div class="shop-item-name">${escapeHtml(effect.name)}</div>
        <div class="shop-item-preview">
          <span class="${getEffectClass(effect.id)}" style="color:#e02020;">${escapeHtml(effect.name)}</span>
        </div>
        <div class="shop-item-price">$${effect.price}</div>
        <button class="shop-buy-btn ${isOwned ? 'owned' : ''}" ${!canAfford && !isOwned ? 'disabled' : ''}>
          ${isOwned ? '\u2714 OWNED' : canAfford ? '\u2605 BUY' : 'NOT ENOUGH'}
        </button>
      `;
      if (!isOwned && canAfford) {
        item.querySelector('.shop-buy-btn').addEventListener('click', () => buyItem('effect', effect.id, effect.price, effect.name));
      }
      grid.appendChild(item);
    });
  }

  function renderShopFonts(grid, owned, profile) {
    SHOP_FONTS.forEach(font => {
      const isOwned = font.price === 0 || owned.includes(font.id);
      const canAfford = (profile.balance || 0) >= font.price;
      const rarity = font.price >= 500 ? 'epic' : font.price >= 300 ? 'rare' : 'common';

      const item = document.createElement('div');
      item.className = 'shop-item' + (isOwned ? ' owned' : '');
      item.innerHTML = `
        <div class="shop-item-rarity ${rarity}">${font.price === 0 ? 'FREE' : rarity.toUpperCase()}</div>
        <div class="shop-item-name">${escapeHtml(font.name)}</div>
        <div class="shop-item-preview" style="font-family:${font.css}; font-size:clamp(.6rem, 2vw, 1rem);">
          AaBbCc 123
        </div>
        <div class="shop-item-price ${font.price === 0 ? 'free' : ''}">${font.price === 0 ? 'FREE' : '$' + font.price}</div>
        <button class="shop-buy-btn ${isOwned ? 'owned' : ''}" ${!canAfford && !isOwned ? 'disabled' : ''}>
          ${isOwned ? '\u2714 OWNED' : canAfford ? '\u2605 BUY' : 'NOT ENOUGH'}
        </button>
      `;
      if (!isOwned && canAfford && font.price > 0) {
        item.querySelector('.shop-buy-btn').addEventListener('click', () => buyItem('font', font.id, font.price, font.name));
      }
      grid.appendChild(item);
    });
  }

  function renderShopTitles(grid, owned, profile) {
    SHOP_TITLES.forEach(title => {
      const isOwned = title.price === 0 || owned.includes(title.id);
      const canAfford = (profile.balance || 0) >= title.price;
      const rarity = title.price >= 2500 ? 'legendary' : title.price >= 800 ? 'epic' : title.price >= 300 ? 'rare' : 'common';

      const item = document.createElement('div');
      item.className = 'shop-item' + (isOwned ? ' owned' : '');
      item.innerHTML = `
        <div class="shop-item-rarity ${rarity}">${title.price === 0 ? 'FREE' : rarity.toUpperCase()}</div>
        <div class="shop-item-name">${escapeHtml(title.name)}</div>
        <div class="shop-item-preview">
          <span style="color:${title.color};letter-spacing:.08em;">${escapeHtml(title.name)}</span>
        </div>
        <div class="shop-item-price ${title.price === 0 ? 'free' : ''}">${title.price === 0 ? 'FREE' : '$' + title.price}</div>
        <button class="shop-buy-btn ${isOwned ? 'owned' : ''}" ${!canAfford && !isOwned ? 'disabled' : ''}>
          ${isOwned ? '\u2714 OWNED' : canAfford ? '\u2605 BUY' : 'NOT ENOUGH'}
        </button>
      `;
      if (!isOwned && canAfford && title.price > 0) {
        item.querySelector('.shop-buy-btn').addEventListener('click', () => buyItem('title', title.id, title.price, title.name));
      }
      grid.appendChild(item);
    });
  }

  function renderShopFlair(grid, owned, profile) {
    SHOP_FLAIR.forEach(flair => {
      const isOwned = owned.includes(flair.id);
      const canAfford = (profile.balance || 0) >= flair.price;
      const rarity = flair.price >= 500 ? 'epic' : flair.price >= 300 ? 'rare' : 'common';

      const item = document.createElement('div');
      item.className = 'shop-item' + (isOwned ? ' owned' : '');
      item.innerHTML = `
        <div class="shop-item-rarity ${rarity}">${rarity.toUpperCase()}</div>
        <div class="shop-item-name">${escapeHtml(flair.name)}</div>
        <div class="shop-item-preview">
          <span style="color:#ccc;font-size:1.3em;">${flair.prefix}USERNAME</span>
        </div>
        <div class="shop-item-desc">Shows ${flair.prefix}before your name in chat</div>
        <div class="shop-item-price">$${flair.price}</div>
        <button class="shop-buy-btn ${isOwned ? 'owned' : ''}" ${!canAfford && !isOwned ? 'disabled' : ''}>
          ${isOwned ? '\u2714 OWNED' : canAfford ? '\u2605 BUY' : 'NOT ENOUGH'}
        </button>
      `;
      if (!isOwned && canAfford) {
        item.querySelector('.shop-buy-btn').addEventListener('click', () => buyItem('flair', flair.id, flair.price, flair.name));
      }
      grid.appendChild(item);
    });
  }

  async function buyItem(type, itemId, price, itemName) {
    const profile = SupabaseClient.getProfile();
    if (!profile) return;
    if ((profile.balance || 0) < price) {
      showToast('NOT ENOUGH COINS'); AudioSystem.sfxError(); return;
    }

    const owned = parseOwnedItems(profile.owned_effects || '');
    if (owned.includes(itemId)) {
      showToast('ALREADY OWNED'); AudioSystem.sfxError(); return;
    }

    try {
      owned.push(itemId);
      const newBalance = (profile.balance || 0) - price;
      await SupabaseClient.updateProfile({
        owned_effects: owned.join(','),
        balance: newBalance,
      });
      showToast('\u2605 PURCHASED: ' + itemName);
      AudioSystem.sfxSelect();
      // Refresh shop display
      await SupabaseClient.fetchProfile();
      loadShop();
    } catch (err) {
      showToast('PURCHASE FAILED');
      AudioSystem.sfxError();
    }
  }

  /* ===== GUEST CHAT (READ-ONLY) ===== */
  let guestChatLoaded = false;

  async function enterGuestChat() {
    if (guestChatLoaded) return;
    guestChatLoaded = true;

    // Hide input area, show guest banner
    const inputArea = document.querySelector('.chat-input-area');
    if (inputArea) inputArea.style.display = 'none';

    // Add guest banner
    const chatMain = document.querySelector('.chat-main');
    if (chatMain) {
      const banner = document.createElement('div');
      banner.className = 'chat-guest-banner';
      banner.innerHTML = `
        \u25C9 VIEWING AS GUEST (READ-ONLY)
        <button class="guest-login-btn" id="guest-login-btn">LOGIN TO CHAT</button>
      `;
      chatMain.appendChild(banner);
      document.getElementById('guest-login-btn')?.addEventListener('click', () => {
        switchScreen('screen-chat', 'screen-auth');
      });
    }

    // Hide admin buttons
    const spawnBtn = document.getElementById('chat-spawn-drop-btn');
    const purgeBtn2 = document.getElementById('chat-purge-btn');
    if (spawnBtn) spawnBtn.style.display = 'none';
    if (purgeBtn2) purgeBtn2.style.display = 'none';

    // Load messages for current channel (read-only)
    try {
      const messages = await SupabaseClient.fetchMessages(50, currentChannel);
      chatMessages.innerHTML = '';
      if (messages.length === 0) {
        addSystemMessage('NO MESSAGES YET.');
      } else {
        messages.forEach(msg => {
          const content = msg.content || '';
          let el;
          if (isDropMessage(content)) {
            el = renderDropMessage(msg);
          } else if (isClaimMessage(content)) {
            el = renderClaimMessage(msg);
          } else {
            el = renderMessage(msg);
          }
          if (el) chatMessages.appendChild(el);
        });
      }
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
      chatMessages.innerHTML = '<div class="chat-system">FAILED TO LOAD MESSAGES</div>';
    }

    // Subscribe to real-time updates (read-only)
    SupabaseClient.subscribeChat((msg) => {
      const msgChannel = msg.channel || 'general';
      if (msgChannel === currentChannel) {
        const content = msg.content || '';
        let el;
        if (isDropMessage(content)) {
          el = renderDropMessage(msg);
        } else if (isClaimMessage(content)) {
          el = renderClaimMessage(msg);
        } else {
          el = renderMessage(msg);
        }
        if (el) {
          chatMessages.appendChild(el);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }
    });

    // Guest hub switching
    document.querySelectorAll('.chat-hub-item').forEach(item => {
      item.addEventListener('click', async () => {
        const channel = item.dataset.channel;
        if (channel === currentChannel) return;
        currentChannel = channel;
        const hub = HUBS[channel];
        document.querySelectorAll('.chat-hub-item').forEach(i => {
          i.classList.toggle('active', i.dataset.channel === channel);
        });
        document.getElementById('chat-header-name').textContent = hub.name;
        document.getElementById('chat-header-desc').textContent = hub.desc;

        // Reload messages for this channel
        try {
          const messages = await SupabaseClient.fetchMessages(50, channel);
          chatMessages.innerHTML = '';
          if (messages.length === 0) {
            addSystemMessage('NO MESSAGES YET.');
          } else {
            messages.forEach(msg => {
              const content = msg.content || '';
              let el;
              if (isDropMessage(content)) el = renderDropMessage(msg);
              else if (isClaimMessage(content)) el = renderClaimMessage(msg);
              else el = renderMessage(msg);
              if (el) chatMessages.appendChild(el);
            });
          }
          chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (_) {
          chatMessages.innerHTML = '<div class="chat-system">FAILED TO LOAD</div>';
        }
        AudioSystem.sfxNavigate();
      });
    });
  }

  /* ===== BROWSER TAB NOTIFICATIONS ===== */
  const ORIGINAL_TITLE = document.title;
  let tabUnreadCount = 0;
  let tabFlashInterval = null;

  function updateTabTitle() {
    if (tabUnreadCount > 0) {
      document.title = `(${tabUnreadCount}) ${ORIGINAL_TITLE}`;
      // Flash the tab title for attention
      if (!tabFlashInterval) {
        let flash = false;
        tabFlashInterval = setInterval(() => {
          flash = !flash;
          document.title = flash ? `\u2605 NEW MESSAGE - ${ORIGINAL_TITLE}` : `(${tabUnreadCount}) ${ORIGINAL_TITLE}`;
        }, 1500);
      }
    } else {
      document.title = ORIGINAL_TITLE;
      if (tabFlashInterval) {
        clearInterval(tabFlashInterval);
        tabFlashInterval = null;
      }
    }
  }

  // Track when user is on the page
  let isPageVisible = true;
  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    if (isPageVisible) {
      tabUnreadCount = 0;
      updateTabTitle();
    }
  });

  // Hook into the existing chat subscription to track tab unreads
  const originalOnNewMessage = null;
  function incrementTabUnread() {
    if (!isPageVisible) {
      tabUnreadCount++;
      updateTabTitle();
    }
  }

  /* ===== KEYBOARD SHORTCUTS ===== */
  document.addEventListener('keydown', (e) => {
    // Don't interfere with input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    // ESC to go back
    if (e.key === 'Escape') {
      // Close popups first
      if (userPopup.classList.contains('show')) { closeUserPopup(); return; }
      if (dmPanel.classList.contains('show')) { closeDMPanel(); return; }
      if (dmSearchModal.classList.contains('show')) { dmSearchModal.classList.remove('show'); dmOverlay.classList.remove('show'); return; }

      // Navigate back
      if (currentScreen === 'screen-title') return;
      if (currentScreen === 'screen-nav') { switchScreen(currentScreen, 'screen-title'); return; }
      if (currentScreen === 'screen-profile') { switchScreen(currentScreen, 'screen-members'); return; }
      if (currentScreen === 'screen-classified') { switchScreen(currentScreen, 'screen-members'); return; }
      switchScreen(currentScreen, 'screen-nav');
      return;
    }

    // Enter on title screen = press start
    if (e.key === 'Enter' && currentScreen === 'screen-title') {
      document.getElementById('press-start').click();
      return;
    }
  });

  /* ===== UTILITY ===== */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ===== INIT ===== */
  SupabaseClient.init();

})();
