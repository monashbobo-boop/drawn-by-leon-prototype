/**
 * Small page helpers. Both read plain blocks Leon can edit, and both leave the
 * page usable without JS.
 *
 * 1. Guest calculator: a group with class "guest-calc" gets a guests slider and a
 *    black-and-white / colour switch, and shows how long to book.
 * 2. Form switch: buttons linking to #event and #photo inside a "form-switch"
 *    group show one enquiry form at a time.
 * 3. Portfolio filter: buttons linking to #all or a gallery's anchor (#live,
 *    #live-bw, #from-photos, #digital) inside a "work-filter" group show one
 *    gallery (or all) in the "works-grid". "Live in colour" opens first. Drawings
 *    come in pages of 8, upright pages before wide ones; "View more" adds a page.
 * 4. Card stack: groups "stack-card" inside a "card-stack" group pile up and fan
 *    out when scrolled into view. On phones, tap the top card to see the next.
 * 5. Reveal rows: a "reveal-row" group's head opens its "reveal-row__panel".
 * 6. Doodle drop: images inside "doodle-drop__pile" fall into a heap when the
 *    area scrolls into view. Tap one to make it hop.
 * 7. Rotating gallery: a gallery with the class "is-rotator" shows its first three
 *    drawings; every few seconds one of the three slides out and the next drawing
 *    from the gallery slides in. Add as many drawings to the gallery as you like.
 */
( function () {
	'use strict';

	/* ---------- Guest calculator ---------- */
	var RATES = { bw: 13.5, colour: 9 }; // people per hour, middle of Leon's ranges (12–15 and 8–10)
	var MIN_HOURS = 2;

	function hoursFor( guests, style ) {
		var h = guests / RATES[ style ];
		return Math.max( MIN_HOURS, Math.ceil( h * 2 ) / 2 );
	}

	function setupCalc( box ) {
		if ( box.getAttribute( 'data-ready' ) ) {
			return;
		}
		box.setAttribute( 'data-ready', '1' );
		var ui = document.createElement( 'div' );
		ui.className = 'guest-calc__ui';
		ui.innerHTML =
			'<label class="guest-calc__label" for="gc-guests">How many guests?</label>' +
			'<div class="guest-calc__row"><input id="gc-guests" type="range" min="10" max="200" step="5" value="60">' +
			'<output class="guest-calc__guests" for="gc-guests">60</output></div>' +
			'<div class="guest-calc__switch" role="radiogroup" aria-label="Drawing style">' +
				'<button type="button" role="radio" aria-checked="true" data-style="bw">Black &amp; white</button>' +
				'<button type="button" role="radio" aria-checked="false" data-style="colour">Colour</button>' +
			'</div>' +
			'<p class="guest-calc__result" aria-live="polite"></p>';
		box.appendChild( ui );

		var range = ui.querySelector( 'input' );
		var out = ui.querySelector( 'output' );
		var result = ui.querySelector( '.guest-calc__result' );
		var style = 'bw';

		function render() {
			var g = +range.value;
			out.textContent = g;
			var h = hoursFor( g, style );
			var drawn = Math.round( h * RATES[ style ] );
			result.innerHTML = '<strong>' + h + ' hours</strong> <span>About ' + Math.min( g, drawn ) +
				' people drawn in ' + ( style === 'bw' ? 'black and white' : 'colour' ) +
				( drawn < g ? ', so most of your guests get one.' : ', enough for everyone who wants one.' ) + '</span>';
		}
		range.addEventListener( 'input', render );
		ui.querySelectorAll( '[data-style]' ).forEach( function ( b ) {
			b.addEventListener( 'click', function () {
				style = b.getAttribute( 'data-style' );
				ui.querySelectorAll( '[data-style]' ).forEach( function ( x ) {
					x.setAttribute( 'aria-checked', x === b ? 'true' : 'false' );
				} );
				render();
			} );
		} );
		render();
	}

	/* ---------- Form switch ---------- */
	var forms = {};

	function showForm( which ) {
		if ( ! forms[ which ] ) {
			return;
		}
		Object.keys( forms ).forEach( function ( k ) {
			forms[ k ].hidden = k !== which;
		} );
		document.querySelectorAll( '.form-switch a' ).forEach( function ( a ) {
			var on = ( a.getAttribute( 'href' ) + '#' + ( a.getAttribute( 'data-frag' ) || '' ) ).indexOf( '#' + which ) !== -1;
			a.classList.toggle( 'is-active', on );
			a.setAttribute( 'aria-current', on ? 'true' : 'false' );
		} );
	}
	window.leonShowForm = showForm;

	function setupForms() {
		forms.event = document.getElementById( 'event' );
		forms.photo = document.getElementById( 'photo' );
		var other = document.getElementById( 'other' );
		if ( other ) {
			forms.other = other;
		}
		if ( ! forms.event || ! forms.photo || ! document.querySelector( '.form-switch' ) ) {
			return;
		}
		document.querySelectorAll( '.form-switch a' ).forEach( function ( a ) {
			a.addEventListener( 'click', function ( e ) {
				var m = ( a.getAttribute( 'href' ) + '#' + ( a.getAttribute( 'data-frag' ) || '' ) ).match( /#(event|photo|other)\b/ );
				if ( m ) {
					showForm( m[ 1 ] );
				}
				e.preventDefault();
			} );
		} );
		var h = location.hash.slice( 1 );
		showForm( forms[ h ] ? h : 'event' );
	}

	/* ---------- Portfolio filter + View more ---------- */
	var PAGE = 8; // drawings shown before "View more" (two rows of four)
	var DEFAULT_FILTER = 'live'; // the most eye-catching set opens first (Leon's choice)

	function linkTarget( a ) {
		return a.getAttribute( 'href' ) + '#' + ( a.getAttribute( 'data-frag' ) || '' );
	}

	function galleryIds( grid ) {
		return [].map.call( grid.querySelectorAll( '.wp-block-gallery[id]' ), function ( g ) {
			return g.id;
		} );
	}

	// "All" mixes the styles: one drawing from each gallery in turn (the celebrity gallery comes last).
	// The grid reads CSS order, so the drawings stay inside their own galleries in the editor.
	var current = 'all';
	function orderedTiles( grid ) {
		var lists = [].filter.call( grid.querySelectorAll( '.wp-block-gallery[id]' ), function ( g ) {
			return ! g.classList.contains( 'is-filtered-out' );
		} ).map( function ( g ) {
			return { id: g.id, tiles: [].slice.call( g.querySelectorAll( ':scope > figure' ) ) };
		} );
		if ( current !== 'all' ) {
			return lists.reduce( function ( a, l ) {
				return a.concat( l.tiles );
			}, [] );
		}
		var tail = lists.filter( function ( l ) {
			return l.id === 'celebrity';
		} );
		var mix = lists.filter( function ( l ) {
			return l.id !== 'celebrity';
		} );
		var out = [];
		for ( var i = 0; mix.some( function ( l ) { return i < l.tiles.length; } ); i++ ) {
			mix.forEach( function ( l ) {
				if ( l.tiles[ i ] ) {
					out.push( l.tiles[ i ] );
				}
			} );
		}
		tail.forEach( function ( l ) {
			out = out.concat( l.tiles );
		} );
		return out;
	}

	// Leon wants every screenful to be all upright drawings or all wide ones, so the
	// drawings are split into pages of 8: upright pages first, then wide pages.
	// A drawing is "wide" when its image block has the class "is-landscape"
	// (or, once loaded, when the picture itself is wider than tall).
	function isWide( f ) {
		if ( f.classList.contains( 'is-landscape' ) ) {
			return true;
		}
		var im = f.querySelector( 'img' );
		return !! ( im && im.complete && im.naturalWidth > im.naturalHeight * 1.05 );
	}

	var pagesShown = 1;
	function applyMore( grid ) {
		var tiles = orderedTiles( grid );
		var tall = tiles.filter( function ( f ) {
			return ! isWide( f );
		} );
		var wide = tiles.filter( isWide );
		var pages = [];
		[ tall, wide ].forEach( function ( list ) {
			for ( var i = 0; i < list.length; i += PAGE ) {
				pages.push( list.slice( i, i + PAGE ) );
			}
		} );
		var pos = 0;
		pages.forEach( function ( page, p ) {
			page.forEach( function ( f ) {
				f.style.order = pos++;
				f.classList.toggle( 'is-more-hidden', p >= pagesShown );
			} );
		} );
		var more = document.querySelector( '.works-more' );
		if ( more ) {
			more.hidden = pagesShown >= pages.length;
		}
	}

	function filterWorks( which ) {
		var grid = document.querySelector( '.works-grid' );
		if ( ! grid ) {
			return;
		}
		if ( which !== 'all' && galleryIds( grid ).indexOf( which ) === -1 ) {
			which = DEFAULT_FILTER;
		}
		grid.querySelectorAll( '.wp-block-gallery[id]' ).forEach( function ( g ) {
			g.classList.toggle( 'is-filtered-out', which !== 'all' && g.id !== which );
		} );
		document.querySelectorAll( '.work-filter a' ).forEach( function ( a ) {
			var on = linkTarget( a ).split( '#' ).indexOf( which ) > 0;
			a.classList.toggle( 'is-active', on );
			a.setAttribute( 'aria-pressed', on ? 'true' : 'false' );
		} );
		current = which;
		pagesShown = 1;
		applyMore( grid );
	}
	window.leonFilterWorks = filterWorks;

	function setupFilter() {
		var grid = document.querySelector( '.works-grid' );
		if ( ! grid ) {
			return;
		}
		var wrap = document.createElement( 'div' );
		wrap.className = 'works-more wp-block-buttons';
		wrap.innerHTML = '<div class="wp-block-button"><button type="button" class="wp-block-button__link wp-element-button">View more</button></div>';
		grid.parentNode.insertBefore( wrap, grid.nextSibling );
		wrap.querySelector( 'button' ).addEventListener( 'click', function () {
			pagesShown++;
			applyMore( grid );
		} );

		var ids = galleryIds( grid );
		document.querySelectorAll( '.work-filter a' ).forEach( function ( a ) {
			a.setAttribute( 'role', 'button' );
			a.addEventListener( 'click', function ( e ) {
				var m = linkTarget( a ).match( /#([\w-]+)/ );
				if ( m && ( m[ 1 ] === 'all' || ids.indexOf( m[ 1 ] ) !== -1 ) ) {
					e.preventDefault();
					filterWorks( m[ 1 ] );
				}
			} );
		} );
		filterWorks( location.hash.slice( 1 ) || DEFAULT_FILTER );
	}

	var REDUCE = window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
	var WIDE = window.matchMedia ? window.matchMedia( '(min-width: 1024px)' ) : { matches: true };

	function onVisible( el, ratio, fn ) {
		if ( ! ( 'IntersectionObserver' in window ) ) {
			fn();
			return;
		}
		var io = new IntersectionObserver( function ( entries ) {
			entries.forEach( function ( e ) {
				if ( e.isIntersecting ) {
					io.disconnect();
					fn();
				}
			} );
		}, { threshold: ratio } );
		io.observe( el );
	}

	/* ---------- Card stack ---------- */
	function setupStack( stack ) {
		var cards = [].slice.call( stack.querySelectorAll( ':scope > .stack-card' ) );
		var n = cards.length;
		if ( n < 2 ) {
			return;
		}
		var order = cards.map( function ( c, i ) {
			return i;
		} );
		function place() {
			order.forEach( function ( cardIndex, pos ) {
				var c = cards[ cardIndex ];
				var off = cardIndex - ( n - 1 ) / 2;
				c.style.setProperty( '--pos', pos );
				c.style.setProperty( '--off', off );
				c.style.setProperty( '--abs', Math.abs( off ) );
				c.style.zIndex = n - pos;
			} );
		}
		stack.classList.add( 'is-ready' );
		stack.style.setProperty( '--n', n );
		place();
		cards.forEach( function ( c, i ) {
			c.addEventListener( 'click', function () {
				if ( WIDE.matches && stack.classList.contains( 'is-spread' ) ) {
					return;
				}
				if ( WIDE.matches ) {
					stack.classList.add( 'is-spread' );
					return;
				}
				// Phones: the top card slides away and goes to the back of the pile.
				if ( order[ 0 ] !== i || c.classList.contains( 'is-leaving' ) ) {
					return;
				}
				c.classList.add( 'is-leaving' );
				setTimeout( function () {
					order.push( order.shift() );
					place();
					c.classList.remove( 'is-leaving' );
				}, REDUCE ? 0 : 320 );
			} );
		} );
		onVisible( stack, 0.35, function () {
			setTimeout( function () {
				stack.classList.add( 'is-spread' );
			}, REDUCE ? 0 : 250 );
		} );
	}

	/* ---------- Reveal rows ---------- */
	function setupReveal( row, i ) {
		var head = row.querySelector( '.reveal-row__head' );
		var panel = row.querySelector( '.reveal-row__panel' );
		if ( ! head || ! panel ) {
			return;
		}
		panel.id = panel.id || 'reveal-panel-' + i;
		head.setAttribute( 'role', 'button' );
		head.setAttribute( 'tabindex', '0' );
		head.setAttribute( 'aria-controls', panel.id );
		function set( open ) {
			row.classList.toggle( 'is-open', open );
			head.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		}
		// The first row of each list starts open so the section never looks empty.
		set( row.parentNode.querySelector( ':scope > .reveal-row' ) === row );
		row.classList.add( 'is-ready' );
		function toggle() {
			var open = ! row.classList.contains( 'is-open' );
			var list = row.parentNode;
			[].forEach.call( list.querySelectorAll( ':scope > .reveal-row.is-open' ), function ( other ) {
				if ( other !== row ) {
					other.classList.remove( 'is-open' );
					other.querySelector( '.reveal-row__head' ).setAttribute( 'aria-expanded', 'false' );
				}
			} );
			set( open );
		}
		head.addEventListener( 'click', toggle );
		head.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Enter' || e.key === ' ' ) {
				e.preventDefault();
				toggle();
			}
		} );
	}

	/* ---------- Doodle drop ---------- */
	function rand( a, b ) {
		return a + Math.random() * ( b - a );
	}

	function setupDrop( pile ) {
		var items = [].slice.call( pile.querySelectorAll( ':scope > .wp-block-image' ) );
		if ( ! items.length ) {
			return;
		}
		pile.classList.add( 'is-ready' );
		var n = items.length;
		items.forEach( function ( fig, i ) {
			var size = rand( 0.8, 1.25 );
			var slot = ( i + rand( 0.1, 0.9 ) ) / n;           // spread across the width
			fig.style.setProperty( '--x', ( 4 + slot * 88 ).toFixed( 1 ) + '%' );
			fig.style.setProperty( '--s', size.toFixed( 2 ) );
			fig.style.setProperty( '--rest', Math.round( rand( 0, 28 ) ) + 'px' );
			fig.style.setProperty( '--r', Math.round( rand( -35, 35 ) ) + 'deg' );
			fig.style.zIndex = Math.round( rand( 1, 9 ) );
		} );

		function drop() {
			pile.classList.add( 'has-dropped' );
			if ( REDUCE || ! items[ 0 ].animate ) {
				return;
			}
			var h = pile.getBoundingClientRect().height + 260;
			items.forEach( function ( fig ) {
				var r = getComputedStyle( fig ).getPropertyValue( '--r' ).trim() || '0deg';
				var spin = Math.round( rand( -120, 120 ) );
				fig.animate( [
					{ transform: 'translateY(' + -h + 'px) rotate(calc(' + r + ' + ' + spin + 'deg))', opacity: 1, offset: 0 },
					{ transform: 'translateY(0) rotate(' + r + ')', offset: 0.6, easing: 'ease-out' },
					{ transform: 'translateY(-' + Math.round( h * 0.08 ) + 'px) rotate(' + r + ')', offset: 0.76, easing: 'ease-in' },
					{ transform: 'translateY(0) rotate(' + r + ')', offset: 0.88, easing: 'ease-out' },
					{ transform: 'translateY(-6px) rotate(' + r + ')', offset: 0.94, easing: 'ease-in' },
					{ transform: 'translateY(0) rotate(' + r + ')', offset: 1 }
				], { duration: rand( 1100, 1500 ), delay: rand( 0, 1100 ), easing: 'ease-in', fill: 'backwards' } );
			} );
		}

		items.forEach( function ( fig ) {
			fig.addEventListener( 'click', function () {
				if ( REDUCE || ! fig.animate ) {
					return;
				}
				var r = getComputedStyle( fig ).getPropertyValue( '--r' ).trim() || '0deg';
				var nr = Math.round( rand( -35, 35 ) ) + 'deg';
				fig.style.setProperty( '--r', nr );
				fig.animate( [
					{ transform: 'translateY(0) rotate(' + r + ')' },
					{ transform: 'translateY(-' + Math.round( rand( 70, 130 ) ) + 'px) rotate(calc(' + r + ' + 180deg))', offset: 0.45, easing: 'ease-in' },
					{ transform: 'translateY(0) rotate(' + nr + ')' }
				], { duration: 650, easing: 'ease-out' } );
			} );
		} );

		onVisible( pile, 0.3, drop );
	}

	/* ---------- Rotating gallery ----------
	   All three spots change at the same moment: the next three drawings are loaded
	   first, then the cards flash and the new drawings fade in together. */
	function setupRotator( gal ) {
		var figs = [].slice.call( gal.querySelectorAll( ':scope > figure.wp-block-image' ) );
		var pool = figs.map( function ( f ) {
			var im = f.querySelector( 'img' );
			return im ? { src: im.currentSrc || im.src, alt: im.alt } : null;
		} ).filter( Boolean );
		var SLOTS = 3;
		if ( REDUCE || pool.length <= SLOTS ) {
			return;
		}
		var slots = figs.slice( 0, SLOTS );
		var first = 0; // pool index of the drawing in the first spot
		var busy = false;
		var running = false;
		var timer = null;
		var pending = null;

		function load( i ) {
			return new Promise( function ( done ) {
				var im = new Image();
				im.onload = im.onerror = function () {
					( im.decode ? im.decode().catch( function () {} ) : Promise.resolve() ).then( done );
				};
				im.src = pool[ i ].src;
			} );
		}
		function prepare() {
			var set = [];
			for ( var k = 0; k < SLOTS; k++ ) {
				set.push( ( first + SLOTS + k ) % pool.length );
			}
			pending = { set: set, ready: Promise.all( set.map( load ) ) };
		}
		prepare();

		function swap() {
			if ( busy ) {
				return;
			}
			busy = true;
			var p = pending;
			p.ready.then( function () {
				var olds = [];
				var news = [];
				slots.forEach( function ( fig, k ) {
					var old = fig.querySelector( 'img:not(.rot-out)' );
					var img = document.createElement( 'img' );
					img.src = pool[ p.set[ k ] ].src;
					img.alt = pool[ p.set[ k ] ].alt;
					img.className = 'rot-layer rot-enter';
					fig.appendChild( img );
					olds.push( old );
					news.push( img );
				} );
				gal.classList.remove( 'is-flashing' );
				void gal.offsetWidth; // restart the flash animation
				gal.classList.add( 'is-flashing' );
				requestAnimationFrame( function () {
					requestAnimationFrame( function () {
						news.forEach( function ( im ) {
							im.classList.remove( 'rot-enter' );
						} );
						olds.forEach( function ( im ) {
							if ( im ) {
								im.classList.add( 'rot-out' );
							}
						} );
					} );
				} );
				setTimeout( function () {
					olds.forEach( function ( im ) {
						if ( im && im.parentNode ) {
							im.parentNode.removeChild( im );
						}
					} );
					news.forEach( function ( im ) {
						im.classList.remove( 'rot-layer' );
					} );
					gal.classList.remove( 'is-flashing' );
					first = p.set[ 0 ];
					busy = false;
					prepare();
				}, 800 );
			} );
		}
		function start() {
			if ( ! running ) {
				running = true;
				timer = setInterval( swap, 4200 );
			}
		}
		function stop() {
			running = false;
			clearInterval( timer );
		}
		gal.classList.add( 'is-rotating' );
		if ( 'IntersectionObserver' in window ) {
			new IntersectionObserver( function ( entries ) {
				entries.forEach( function ( e ) {
					if ( e.isIntersecting && ! document.hidden ) {
						start();
					} else {
						stop();
					}
				} );
			}, { threshold: 0.2 } ).observe( gal );
		} else {
			start();
		}
		document.addEventListener( 'visibilitychange', function () {
			if ( document.hidden ) {
				stop();
			}
		} );
	}

	function init() {
		document.querySelectorAll( '.guest-calc' ).forEach( setupCalc );
		setupForms();
		setupFilter();
		document.querySelectorAll( '.card-stack' ).forEach( setupStack );
		document.querySelectorAll( '.reveal-row' ).forEach( setupReveal );
		document.querySelectorAll( '.doodle-drop__pile' ).forEach( setupDrop );
		document.querySelectorAll( '.wp-block-gallery.is-rotator' ).forEach( setupRotator );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
