/**
 * "Your face here" drawing desk.
 *
 * Any image block with the "Drawing reveal" style becomes a "Your face here?"
 * paper card. Clicking it opens a blank sheet with a faint pencil guide. The
 * visitor draws over it by hand: every stroke lays down rough pencil lines at
 * its edges and colour in its middle. When the whole drawing is coloured in,
 * the "Draw it again" and "Get your own drawn" buttons appear.
 *
 * Everything is built from the one colour image in the block, so the artist
 * only ever swaps that image. Without JS the block simply shows the artwork.
 */
( function () {
	'use strict';

	var NS = 'http://www.w3.org/2000/svg';
	var REDUCE = window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
	var COLS = 16;          // coverage grid columns
	var DONE_AT = 0.95;     // share of the drawing that has to be coloured
	var INK_W = 150;        // pencil stroke width (artwork is 1000 units wide)
	var COL_W = 100;        // colour stroke width
	var uid = 0;

	function el( name, attrs, parent ) {
		var node = document.createElementNS( NS, name );
		Object.keys( attrs || {} ).forEach( function ( k ) {
			node.setAttribute( k, attrs[ k ] );
		} );
		if ( parent ) {
			parent.appendChild( node );
		}
		return node;
	}

	function rand( a, b ) {
		return a + Math.random() * ( b - a );
	}

	function Desk( src, alt, cta ) {
		this.src = src;
		this.alt = alt;
		this.cta = cta;
		this.id = 'dr' + ++uid;
		this.build();
	}

	Desk.prototype.build = function () {
		var self = this;

		var overlay = document.createElement( 'div' );
		overlay.className = 'dr-desk';
		overlay.hidden = true;
		overlay.setAttribute( 'role', 'dialog' );
		overlay.setAttribute( 'aria-modal', 'true' );
		overlay.setAttribute( 'aria-label', 'Colour in one of Leon\'s caricatures' );
		overlay.innerHTML =
			'<div class="dr-desk__sheet">' +
				'<button type="button" class="dr-desk__close" aria-label="Close">×</button>' +
				'<p class="dr-desk__note" aria-live="polite"></p>' +
				'<div class="dr-desk__paper"></div>' +
				'<div class="dr-desk__bar" aria-hidden="true"><span></span></div>' +
				'<div class="dr-desk__actions">' +
					'<button type="button" class="dr-btn dr-btn--again">Draw it again</button>' +
					'<a class="dr-btn dr-btn--cta" href="' + this.cta + '">Get your own drawn</a>' +
				'</div>' +
			'</div>';
		document.body.appendChild( overlay );

		this.overlay = overlay;
		this.note = overlay.querySelector( '.dr-desk__note' );
		this.paper = overlay.querySelector( '.dr-desk__paper' );
		this.bar = overlay.querySelector( '.dr-desk__bar span' );

		overlay.querySelector( '.dr-desk__close' ).addEventListener( 'click', function () {
			self.close();
		} );
		overlay.addEventListener( 'click', function ( e ) {
			if ( e.target === overlay ) {
				self.close();
			}
		} );
		overlay.querySelector( '.dr-btn--again' ).addEventListener( 'click', function () {
			self.start();
		} );
		document.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Escape' && ! overlay.hidden ) {
				self.close();
			}
		} );

		var img = new Image();
		img.onload = function () {
			self.W = 1000;
			self.H = Math.round( 1000 * img.naturalHeight / img.naturalWidth );
			self.readShape( img );
			self.makeSvg();
			if ( self.pendingStart ) {
				self.start();
			}
		};
		img.src = this.src;
	};

	/* Work out which grid cells actually hold drawing (not transparent
	   background), so "fully coloured" means the drawing, not the empty corners. */
	Desk.prototype.readShape = function ( img ) {
		this.cols = COLS;
		this.rows = Math.max( 8, Math.round( COLS * this.H / this.W ) );
		this.content = null;
		try {
			var c = document.createElement( 'canvas' );
			c.width = this.cols * 6;
			c.height = this.rows * 6;
			var ctx = c.getContext( '2d' );
			ctx.drawImage( img, 0, 0, c.width, c.height );
			var data = ctx.getImageData( 0, 0, c.width, c.height ).data;
			var content = {}, n = 0;
			for ( var r = 0; r < this.rows; r++ ) {
				for ( var col = 0; col < this.cols; col++ ) {
					var solid = 0;
					for ( var y = 0; y < 6; y++ ) {
						for ( var x = 0; x < 6; x++ ) {
							if ( data[ ( ( r * 6 + y ) * c.width + col * 6 + x ) * 4 + 3 ] > 40 ) {
								solid++;
							}
						}
					}
					if ( solid >= 4 ) {
						content[ col + ':' + r ] = 1;
						n++;
					}
				}
			}
			if ( n > 4 ) {
				this.content = content;
				this.total = n;
			}
		} catch ( e ) {
			// Image from another origin: every cell counts.
		}
		if ( ! this.content ) {
			this.total = this.cols * this.rows;
		}
	};

	Desk.prototype.makeSvg = function () {
		var W = this.W, H = this.H, id = this.id, self = this;
		var pad = 40;
		var box = { x: -pad, y: -pad, width: W + pad * 2, height: H + pad * 2 };
		var svg = el( 'svg', {
			viewBox: box.x + ' ' + box.y + ' ' + box.width + ' ' + box.height,
			class: 'dr-svg',
			role: 'img',
			tabindex: '0',
			'aria-label': this.alt + '. Drag over the paper to colour it in.'
		} );
		var defs = el( 'defs', {}, svg );

		/* Pencil: the colour drawing turned into dark graphite lines. */
		var ink = el( 'filter', { id: id + 'ink', x: '-2%', y: '-2%', width: '104%', height: '104%' }, defs );
		el( 'feColorMatrix', { type: 'saturate', values: '0', result: 'g' }, ink );
		var ct = el( 'feComponentTransfer', { in: 'g', result: 'c' }, ink );
		[ 'feFuncR', 'feFuncG', 'feFuncB' ].forEach( function ( f ) {
			el( f, { type: 'linear', slope: '6', intercept: '-2.6' }, ct );
		} );
		el( 'feColorMatrix', { in: 'c', type: 'matrix', values: '0.85 0 0 0 0.05  0 0.85 0 0 0.05  0 0 0.9 0 0.06  0 0 0 1 0' }, ink );

		var mInk = el( 'mask', { id: id + 'mi', maskUnits: 'userSpaceOnUse', x: box.x, y: box.y, width: box.width, height: box.height }, defs );
		var mCol = el( 'mask', { id: id + 'mc', maskUnits: 'userSpaceOnUse', x: box.x, y: box.y, width: box.width, height: box.height }, defs );
		this.gInk = el( 'g', {}, mInk );
		this.gCol = el( 'g', {}, mCol );

		// Faint guide so the visitor knows where the drawing is.
		el( 'image', { href: this.src, x: 0, y: 0, width: W, height: H, filter: 'url(#' + id + 'ink)', opacity: '0.12', class: 'dr-guide' }, svg );
		el( 'image', { href: this.src, x: 0, y: 0, width: W, height: H, filter: 'url(#' + id + 'ink)', mask: 'url(#' + id + 'mi)' }, svg );
		el( 'image', { href: this.src, x: 0, y: 0, width: W, height: H, mask: 'url(#' + id + 'mc)' }, svg );

		this.svg = svg;
		this.paper.appendChild( svg );

		/* Keep the whole sheet on screen, whatever the artwork's proportions. */
		var ratio = box.width / box.height;
		this.overlay.querySelector( '.dr-desk__sheet' ).style.width =
			'min(520px, 100%, calc((100vh - 230px) * ' + ratio.toFixed( 3 ) + ' + 56px))';

		var pen = document.createElement( 'span' );
		pen.className = 'dr-desk__pen';
		pen.setAttribute( 'aria-hidden', 'true' );
		this.pen = pen;
		this.paper.appendChild( pen );

		svg.addEventListener( 'pointerdown', function ( e ) {
			if ( self.mode !== 'draw' ) {
				return;
			}
			e.preventDefault();
			try {
				svg.setPointerCapture( e.pointerId );
			} catch ( err ) {}
			self.overlay.classList.add( 'is-drawing' );
			self.inkStroke = self.newStroke( self.gInk, INK_W );
			self.colStroke = self.newStroke( self.gCol, COL_W );
			self.strokeD = '';
			self.last = null;
			self.addPoint( e );
		} );
		svg.addEventListener( 'pointermove', function ( e ) {
			if ( self.mode !== 'draw' ) {
				return;
			}
			self.movePenTo( self.toSvg( e ) );
			if ( self.inkStroke ) {
				self.addPoint( e );
			}
		} );
		var end = function () {
			self.inkStroke = self.colStroke = null;
		};
		svg.addEventListener( 'pointerup', end );
		svg.addEventListener( 'pointercancel', end );

		/* Keyboard users can't drag, so Enter colours the whole drawing. */
		svg.addEventListener( 'keydown', function ( e ) {
			if ( self.mode === 'draw' && ( e.key === 'Enter' || e.key === ' ' ) ) {
				e.preventDefault();
				self.complete();
			}
		} );
	};

	/* A brush stroke = a few copies of one path, nudged apart and given different
	   widths and opacities. Where they overlap the reveal is solid; at the edges
	   it breaks up into streaks, like a dry marker or pencil hatching. */
	Desk.prototype.newStroke = function ( group, width ) {
		var g = el( 'g', {}, group );
		var copies = [];
		for ( var i = 0; i < 5; i++ ) {
			var spread = i === 0 ? 0 : width * 0.4;
			copies.push( el( 'path', {
				d: '',
				fill: 'none',
				stroke: '#fff',
				'stroke-width': ( width * ( i === 0 ? 0.8 : rand( 0.25, 0.5 ) ) ).toFixed( 1 ),
				'stroke-linecap': 'round',
				'stroke-linejoin': 'round',
				'stroke-opacity': ( i === 0 ? 0.95 : rand( 0.45, 0.85 ) ).toFixed( 2 ),
				transform: 'translate(' + rand( -spread, spread ).toFixed( 1 ) + ' ' + rand( -spread, spread ).toFixed( 1 ) + ')'
			}, g ) );
		}
		return copies;
	};

	function setD( copies, d ) {
		copies.forEach( function ( p ) {
			p.setAttribute( 'd', d );
		} );
	}

	Desk.prototype.toSvg = function ( e ) {
		var pt = this.svg.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		return pt.matrixTransform( this.svg.getScreenCTM().inverse() );
	};

	Desk.prototype.addPoint = function ( e ) {
		var p = this.toSvg( e );
		this.strokeD += ( this.strokeD ? ' L' : 'M' ) + p.x.toFixed( 1 ) + ' ' + p.y.toFixed( 1 );
		setD( this.inkStroke, this.strokeD );
		setD( this.colStroke, this.strokeD );
		this.movePenTo( p );

		// Mark coverage along the segment, so fast drags don't skip cells.
		var a = this.last || p;
		var dist = Math.hypot( p.x - a.x, p.y - a.y );
		var steps = Math.max( 1, Math.ceil( dist / 20 ) );
		for ( var i = 1; i <= steps; i++ ) {
			this.mark( a.x + ( p.x - a.x ) * i / steps, a.y + ( p.y - a.y ) * i / steps );
		}
		this.last = p;
		this.progress();
	};

	Desk.prototype.mark = function ( x, y ) {
		var cw = this.W / this.cols, ch = this.H / this.rows;
		var reach = COL_W * 0.5 + cw * 0.3;
		var c0 = Math.floor( ( x - reach ) / cw ), c1 = Math.floor( ( x + reach ) / cw );
		var r0 = Math.floor( ( y - reach ) / ch ), r1 = Math.floor( ( y + reach ) / ch );
		for ( var c = Math.max( 0, c0 ); c <= Math.min( this.cols - 1, c1 ); c++ ) {
			for ( var r = Math.max( 0, r0 ); r <= Math.min( this.rows - 1, r1 ); r++ ) {
				var k = c + ':' + r;
				if ( this.cells[ k ] || ( this.content && ! this.content[ k ] ) ) {
					continue;
				}
				if ( Math.hypot( ( c + 0.5 ) * cw - x, ( r + 0.5 ) * ch - y ) <= reach ) {
					this.cells[ k ] = 1;
					this.filled++;
				}
			}
		}
	};

	Desk.prototype.progress = function () {
		var p = this.filled / this.total;
		this.bar.style.width = Math.min( 100, Math.round( p / DONE_AT * 100 ) ) + '%';
		if ( p >= DONE_AT ) {
			this.complete();
		} else if ( p > 0.6 && ! this.nearly ) {
			this.nearly = true;
			this.note.textContent = 'Nearly there, fill in the last bits!';
		} else if ( p > 0.05 && ! this.going ) {
			this.going = true;
			this.note.textContent = 'Keep going, colour the whole drawing.';
		}
	};

	Desk.prototype.movePenTo = function ( p ) {
		var r = this.svg.getBoundingClientRect();
		var vb = this.svg.viewBox.baseVal;
		var x = ( p.x - vb.x ) / vb.width * r.width;
		var y = ( p.y - vb.y ) / vb.height * r.height;
		this.pen.style.transform = 'translate(' + x.toFixed( 1 ) + 'px,' + y.toFixed( 1 ) + 'px)';
	};

	/* Colour whatever is left (tiny gaps between strokes) and show the buttons. */
	Desk.prototype.complete = function () {
		if ( this.mode !== 'draw' ) {
			return;
		}
		this.inkStroke = this.colStroke = null;
		[ this.gInk, this.gCol ].forEach( function ( g ) {
			var r = el( 'rect', { x: -40, y: -40, width: this.W + 80, height: this.H + 80, fill: '#fff', opacity: '0' }, g );
			r.style.transition = REDUCE ? 'none' : 'opacity 0.8s ease';
			requestAnimationFrame( function () {
				requestAnimationFrame( function () {
					r.setAttribute( 'opacity', '1' );
				} );
			} );
		}, this );
		this.bar.style.width = '100%';
		this.state( 'done', 'Ta-da! Now imagine it\'s you.' );
		var cta = this.overlay.querySelector( '.dr-btn--cta' );
		setTimeout( function () {
			cta.focus( { preventScroll: true } );
		}, 50 );
	};

	Desk.prototype.state = function ( mode, note ) {
		this.mode = mode;
		this.overlay.setAttribute( 'data-mode', mode );
		this.note.textContent = note;
	};

	Desk.prototype.start = function () {
		if ( ! this.svg ) {
			this.pendingStart = true;
			return;
		}
		this.pendingStart = false;
		this.gInk.textContent = '';
		this.gCol.textContent = '';
		this.cells = {};
		this.filled = 0;
		this.going = this.nearly = false;
		this.last = null;
		this.bar.style.width = '0%';
		this.overlay.classList.remove( 'is-drawing' );
		this.state( 'draw', 'Grab the pen and colour me in!' );
		// Park the pen in the middle of the sheet until the first stroke.
		this.movePenTo( { x: this.W * 0.5, y: this.H * 0.5 } );
	};

	Desk.prototype.open = function ( opener ) {
		this.opener = opener;
		this.overlay.hidden = false;
		document.documentElement.classList.add( 'dr-open' );
		this.start();
		this.overlay.querySelector( '.dr-desk__close' ).focus( { preventScroll: true } );
	};

	Desk.prototype.close = function () {
		this.overlay.hidden = true;
		document.documentElement.classList.remove( 'dr-open' );
		if ( this.opener ) {
			this.opener.focus( { preventScroll: true } );
		}
	};

	function setup( fig ) {
		var img = fig.querySelector( 'img' );
		if ( ! img || fig.getAttribute( 'data-dr' ) ) {
			return;
		}
		fig.setAttribute( 'data-dr', '1' );

		var src = img.currentSrc || img.src;
		var cta = fig.getAttribute( 'data-cta' ) || '/contact/#photo';
		var desk = new Desk( src, img.alt || 'Caricature drawing', cta );

		var btn = document.createElement( 'button' );
		btn.type = 'button';
		btn.className = 'dr-trigger';
		btn.setAttribute( 'aria-label', 'Your face here? Open the sketchpad and colour in a drawing' );
		btn.innerHTML =
			'<span class="dr-trigger__card" aria-hidden="true"><span class="dr-trigger__sketch"></span></span>' +
			'<span class="dr-trigger__label" aria-hidden="true">Your face here?</span>' +
			'<span class="dr-trigger__hint" aria-hidden="true">tap &amp; colour me in</span>';
		// The big "sheet" version shows the drawing as a faint pencil sketch.
		btn.querySelector( '.dr-trigger__sketch' ).style.backgroundImage = 'url("' + src.replace( /"/g, '%22' ) + '")';
		btn.addEventListener( 'click', function () {
			desk.open( btn );
		} );

		fig.classList.add( 'dr-ready' );
		fig.appendChild( btn );
	}

	function init() {
		document.querySelectorAll( '.wp-block-image.is-style-draw-reveal' ).forEach( setup );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
