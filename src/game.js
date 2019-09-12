'use strict';

let {init, Sprite, GameLoop} = kontra;

let {canvas, context} = init();

kontra.setImagePath('../gfx/');
kontra.initKeys();

const screenWidth = kontra.getCanvas().width;
const screenHeight = kontra.getCanvas().height;
const worldCenter = 4800;
const tileSize = 20;
const halfTileSize = tileSize / 2;
const centralTile = worldCenter / tileSize;
const farthestTile = 40;
const playerAttackRangeTiles = 1.6;
const playerAttackRangeHalfTiles = playerAttackRangeTiles * 2;
const skelAttackRangeTiles = 1;
const cloudTtl = 75;

kontra.load('player.bmp', 'vignette.bmp', 'skeleton.bmp', 'cloud.bmp').then(_ => {
	function render_thing() {
		this.context.save();
		this.context.translate(-player.x + screenWidth / 2, -player.y + screenHeight / 2);
		this.draw();
		this.context.restore();
	}
	const charsSheet = kontra.SpriteSheet({
		image: kontra.imageAssets.player,
		frameWidth: 18,
		frameHeight: 20,
		animations: {
			walk: {
				frames: '24..27',
				frameRate: 12,
			},
		},
	});
	const skeletonSheet = kontra.SpriteSheet({
		image: kontra.imageAssets.skeleton,
		frameWidth: 24,
		frameHeight: 32,
		animations: {
			walk: {
				frames: '6..8',
				frameRate: 6,
			},
		},
	});
	const max_attack_delay = 3;
	let player = Sprite({
		x: worldCenter,
		y: worldCenter,
		movement_speed: 64,
		knockback: 256,
		kx: 0,
		ky: 0,
		attack_delay: max_attack_delay,
		anchor: {
			x: 0.5,
			y: 0.5,
		},
		animations: charsSheet.animations,
		update: function(dt) {
			this.dx = 0;
			this.dy = 0;
			if (kontra.keyPressed('up')) {
				this.dy = -this.movement_speed;
			}
			if (kontra.keyPressed('down')) {
				this.dy = this.movement_speed;
			}
			if (kontra.keyPressed('left')) {
				this.dx = -this.movement_speed;
			}
			if (kontra.keyPressed('right')) {
				this.dx = this.movement_speed;
			}
			if (kontra.keyPressed('space')) {
				if (this.attack_delay <= 0) {
					cloudPool.make_puff();
					this.attack();
					this.attack_delay = max_attack_delay;
				}
			}
			this.attack_delay -= dt;
			this.dx += this.kx;
			this.dy += this.ky;
			this.advance(dt);
			this.kx *= 0.9;
			this.ky *= 0.9;
		},
		render: render_thing,
		hit: function(attacker) {
			const dx = this.x - attacker.x;
			const dy = this.y - attacker.y;
			const len = Math.sqrt(dx*dx + dy*dy);
			const k = this.knockback;
			const vx = dx * k / len;
			const vy = dy * k / len;
			this.kx = vx;
			this.ky = vy;
		},
		attack: function() {
			const skels = skelPool.getAliveObjects();
			for (var i = 0, len = skels.length; i < len; i++) {
				const skel = skels[i];
				const dx = (Math.abs(this.x - skel.x) / halfTileSize)|0;
				const dy = (Math.abs(this.y - skel.y) / halfTileSize)|0;
				if (Math.max(dx, dy) < playerAttackRangeHalfTiles) {
					skel.ttl = 0;
				}
			}
		},
	});
	player.playAnimation('walk');
	let skelPool = kontra.Pool({
		maxSize: 100,
		create: function() {
			let skel = Sprite({
				movement_speed: 32,
				animations: skeletonSheet.animations,
				update: function(dt) {
					const dx = ((player.x - this.x) / tileSize)|0;
					const dy = ((player.y - this.y) / tileSize)|0;
					if (Math.abs(dx) >= Math.abs(dy)) {
						this.dx = dx / Math.abs(dx) * this.movement_speed;
						this.dy = 0;
					} else {
						this.dy = dy / Math.abs(dy) * this.movement_speed;
						this.dx = 0;
					}
					this.advance(dt);
					if (this.is_in_range(player)) {
						player.hit(this);
					}
				},
				render: render_thing,
				is_in_range: function(thing) {
					const dx = (Math.abs(player.x - this.x) / tileSize)|0;
					const dy = (Math.abs(player.y - this.y) / tileSize)|0;
					return Math.max(dx, dy) < skelAttackRangeTiles;
				},
			});
			skel.playAnimation('walk');
			return skel;
		},
	});
	setInterval(() => {
		const angle = 2 * Math.PI * Math.random();
		const x = worldCenter + vignette.size / 2 * Math.cos(angle);
		const y = worldCenter + vignette.size / 2 * Math.sin(angle);
		skelPool.get({
			ttl: Infinity,
			x: x,
			y: y,
			width: 24,
			height: 32,
			anchor: {
				x: 0.5,
				y: 0.5,
			},
		});
	}, 750);
	let cloudPool = kontra.Pool({
		maxSize: 32,
		create: function() {
			return Sprite({
				image: kontra.imageAssets.cloud,
				update: function(dt) {
					const a = 1 - (cloudTtl - this.ttl) / cloudTtl;
					this.width = 32 * a;
					this.height = 32 * a;
					this.advance(dt);
				},
				render: render_thing,
			});
		},
	});
	cloudPool.make_puff = function() {
		for (var n = 0; n < 8; n++) {
			const angle = 2 * Math.PI / 8 * n;
			const dx = 99 * Math.cos(angle);
			const dy = 99 * Math.sin(angle);
			const ddx = -99 * Math.cos(angle);
			const ddy = -99 * Math.sin(angle);
			this.get({
				ttl: cloudTtl,
				x: player.x,
				y: player.y,
				dx: dx,
				dy: dy,
				ddx: ddx,
				ddy: ddy,
				anchor: {
					x: 0.5,
					y: 0.5,
				},
			});
		}
	}
	let ground = Sprite({
		x: 0,
		y: 0,
		width: 640,
		height: 480,
		calc_ground_tile_color: function(tx, ty) {
			const sq = k => (k|0) % 2;
			const h = (sq(tx) + sq(ty)) % 2 ? 120 : 90;
			const d = Math.abs(tx - centralTile) + Math.abs(ty - centralTile);
			const s = 100 * (1 - Math.min(d / farthestTile, 1));
			const l = 50;
			return {h: h, s: s, l:l};
		},
		render: function() {
			const ts = tileSize;
			const tiles_x = this.width / ts;
			const tiles_y = this.height / ts;
			const offset_x = tiles_x / 2;
			const offset_y = tiles_y / 2;
			const px = (player.x | 0) / ts;
			const py = (player.y | 0) / ts;
			const dx = (player.x | 0) % ts;
			const dy = (player.y | 0) % ts;
			for (let ty = 0; ty <= tiles_y; ty++) {
				for (let tx = 0; tx <= tiles_x; tx++) {
					const {h, s, l} = this.calc_ground_tile_color(tx + px - offset_x, ty + py - offset_y);
					this.context.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
					this.context.fillRect(tx * ts - dx, ty * ts - dy, ts, ts);
					this.context.strokeStyle = '#999';
					this.context.lineWidth = 1;
					this.context.strokeRect(tx * ts - dx, ty * ts - dy, ts, ts);
				}
			}
		}
	});
	let vignette = Sprite({
		x: worldCenter,
		y: worldCenter,
		size: screenWidth * 1.5,
		range_counter: 0,
		anchor: {
			x: 0.5,
			y: 0.5,
		},
		image: kontra.imageAssets.vignette,
		update: function(dt) {
			const delta = 1 + 5 * (1 + Math.sin(this.range_counter++ / 20));
			this.width = this.size + delta;
			this.height = this.size + delta;
			this.advance(dt);
		},
		render: render_thing,
	});

	const oversize_x = (vignette.size - screenWidth) / 2;
	const oversize_y = (vignette.size - screenHeight) / 2;
	let loop = GameLoop({
		update: function(dt) {
			ground.update(dt);
			player.update(dt);
			skelPool.update(dt);
			cloudPool.update(dt);
			vignette.update(dt);
		},
		render: function() {
			context.fillStyle = 'black';
			context.fillRect(0, 0, screenWidth, screenHeight);
			context.save();
			context.beginPath();
			context.rect(
				worldCenter - oversize_x - player.x,
				worldCenter - oversize_y - player.y,
				vignette.size,
				vignette.size,
			);
			context.clip();
			ground.render();
			player.render();
			skelPool.render();
			cloudPool.render();
			vignette.render();
			context.restore();
		},
	});

	loop.start();
})
