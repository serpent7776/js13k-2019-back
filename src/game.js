'use strict';

let {init, Sprite, GameLoop} = kontra;

let {canvas, context} = init();

kontra.setImagePath('../gfx/');
kontra.initKeys();

const screenWidth = kontra.getCanvas().width;
const screenHeight = kontra.getCanvas().height;
const worldCenter = 4800;
const farthestTile = 40;
const tileSize = 20;

kontra.load('player.bmp', 'vignette.bmp', 'skeleton.bmp').then(_ => {
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
	let player = Sprite({
		x: worldCenter,
		y: worldCenter,
		movement_speed: 64,
		knockback: 256,
		kx: 0,
		ky: 0,
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
		}
	});
	player.playAnimation('walk');
	let skelPool = kontra.Pool({
		maxSize: 100,
		create: function() {
			let skel = Sprite({
				movement_speed: 32,
				attack_range: 1,
				animations: skeletonSheet.animations,
				update: function(dt) {
					const dx = (((player.x - this.x)) / tileSize)|0;
					const dy = (((player.y - this.y)) / tileSize)|0;
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
					const dx = (((player.x - this.x)) / tileSize)|0;
					const dy = (((player.y - this.y)) / tileSize)|0;
					return Math.abs(dx) + Math.abs(dy) < this.attack_range;
				},
			});
			skel.playAnimation('walk');
			return skel;
		},
	});
	setInterval(() => {
		skelPool.get({
			x: worldCenter + 40,
			y: worldCenter + 40,
			width: 24,
			height: 32,
			anchor: {
				x: 0.5,
				y: 0.5,
			},
		});
	}, 5000);
	let ground = Sprite({
		x: 0,
		y: 0,
		width: 640,
		height: 480,
		calc_ground_tile_color: function(tx, ty) {
			const sq = k => (k|0) % 2;
			const centralTile = worldCenter / tileSize;
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
		x: screenWidth / 2,
		y: screenHeight / 2,
		width: screenWidth,
		height: screenWidth,
		range_counter: 0,
		anchor: {
			x: 0.5,
			y: 0.5,
		},
		image: kontra.imageAssets.vignette,
		update: function(dt) {
			const delta = 5 * (1 + Math.sin(this.range_counter++ / 20));
			this.width = screenWidth + delta;
			this.height = screenHeight + delta;
			this.advance(dt);
		},
	});

	let loop = GameLoop({
		update: function(dt) {
			ground.update(dt);
			player.update(dt);
			skelPool.update(dt);
			vignette.update(dt);
		},
		render: function() {
			ground.render();
			player.render();
			skelPool.render();
			vignette.render();
		},
	});

	loop.start();
})
