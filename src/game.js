'use strict';

let {init, Sprite, GameLoop} = kontra;

let {canvas, context} = init();

kontra.setImagePath('../gfx/');
kontra.initKeys();

let screenWidth = kontra.getCanvas().width;
let screenHeight = kontra.getCanvas().height;

kontra.load('player.png', 'vignette.png', 'skeleton.png').then(_ => {
	function render_thing() {
		this.context.save();
		this.context.translate(-player.x + screenWidth / 2, -player.y + screenHeight / 2);
		this.draw();
		this.context.restore();
	}
	let charsSheet = kontra.SpriteSheet({
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
	let skeletonSheet = kontra.SpriteSheet({
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
		x: 4800,
		y: 4800,
		movement_speed: 32,
		anchor: {
			x: 0.5,
			y: 0.5,
		},
		animations: charsSheet.animations,
		update: function(dt) {
			if (kontra.keyPressed('up')) {
				this.y -= this.movement_speed * dt;
			}
			if (kontra.keyPressed('down')) {
				this.y += this.movement_speed * dt;
			}
			if (kontra.keyPressed('left')) {
				this.x -= this.movement_speed * dt;
			}
			if (kontra.keyPressed('right')) {
				this.x += this.movement_speed * dt;
			}
			this.advance(dt);
		},
		render: render_thing,
	});
	player.playAnimation('walk');
	let skel = Sprite({
		x: 4840,
		y: 4840,
		anchor: {
			x: 0.5,
			y: 0.5,
		},
		animations: skeletonSheet.animations,
		render: render_thing,
	});
	skel.playAnimation('walk');
	let ground = Sprite({
		x: 0,
		y: 0,
		tile_size: 20,
		width: 640,
		height: 480,
		calc_ground_tile_color: function(x, y) {
			let sq = k => (k|0) % 2;
			let h = (sq(x) + sq(y)) % 2 ? 120 : 90;
			let s = 100;
			let l = 50;
			return {h: h, s: s, l:l};
		},
		render: function() {
			let ts = this.tile_size;
			let tiles_x = this.width / ts;
			let tiles_y = this.height / ts;
			for (let ty = 0; ty <= tiles_y; ty++) {
				for (let tx = 0; tx <= tiles_x; tx++) {
					let px = (player.x | 0) / ts;
					let py = (player.y | 0) / ts;
					let dx = (player.x | 0) % ts;
					let dy = (player.y | 0) % ts;
					let {h, s, l} = this.calc_ground_tile_color(tx + px, ty + py);
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
			let delta = 5 * (1 + Math.sin(this.range_counter++ / 20));
			this.width = screenWidth + delta;
			this.height = screenWidth + delta;
			this.advance(dt);
		},
	});

	let loop = GameLoop({
		update: function(dt) {
			ground.update(dt);
			player.update(dt);
			skel.update(dt);
			vignette.update(dt);
		},
		render: function() {
			ground.render();
			player.render();
			skel.render();
			vignette.render();
		},
	});

	loop.start();
})
