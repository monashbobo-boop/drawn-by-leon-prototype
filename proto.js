/* Homepage v2 prototype: tuck-away header, Book Leon tab links, photo upload field. */
( function () {
	'use strict';

	var head = document.querySelector( '.wp-site-blocks > header' );

	function menuOpen() {
		return !! document.querySelector( '.wp-block-navigation__responsive-container.is-menu-open' );
	}

	/* The hero fills the window below the header: CSS reads the header height from --hdr. */
	function setHeaderHeight() {
		if ( head ) {
			document.documentElement.style.setProperty( '--hdr', head.offsetHeight + 'px' );
		}
	}
	setHeaderHeight();
	window.addEventListener( 'resize', setHeaderHeight );
	window.addEventListener( 'load', setHeaderHeight );

	/* Header hides while scrolling down and comes back when scrolling up. */
	if ( head ) {
		var last = window.scrollY;
		var busy = false;
		window.addEventListener( 'scroll', function () {
			if ( busy ) {
				return;
			}
			busy = true;
			requestAnimationFrame( function () {
				busy = false;
				var y = window.scrollY;
				if ( y < 120 || menuOpen() || head.contains( document.activeElement ) ) {
					head.classList.remove( 'is-tucked' );
				} else if ( y > last + 8 ) {
					head.classList.add( 'is-tucked' );
				} else if ( y < last - 8 ) {
					head.classList.remove( 'is-tucked' );
				}
				last = y;
			} );
		}, { passive: true } );
		head.addEventListener( 'focusin', function () {
			head.classList.remove( 'is-tucked' );
		} );
	}

	/* The little arrow next to Book Leon opens its menu on click as well as on hover. */
	document.querySelectorAll( '.nav-book > .wp-block-navigation-submenu__toggle' ).forEach( function ( btn ) {
		btn.addEventListener( 'click', function ( e ) {
			e.preventDefault();
			btn.setAttribute( 'aria-expanded', btn.getAttribute( 'aria-expanded' ) === 'true' ? 'false' : 'true' );
		} );
		document.addEventListener( 'click', function ( e ) {
			if ( ! btn.parentNode.contains( e.target ) ) {
				btn.setAttribute( 'aria-expanded', 'false' );
			}
		} );
	} );

	/* Menu links to #event / #photo / #other on the Book Leon page switch the tab in place. */
	window.addEventListener( 'hashchange', function () {
		var m = location.hash.match( /^#(event|photo|other)$/ );
		if ( ! m || ! window.leonShowForm ) {
			return;
		}
		window.leonShowForm( m[ 1 ] );
		var close = document.querySelector( '.wp-block-navigation__responsive-container.is-menu-open .wp-block-navigation__responsive-container-close' );
		if ( close ) {
			close.click();
		}
		var top = document.querySelector( '.contact-page' );
		if ( top ) {
			top.scrollIntoView( { behavior: 'smooth', block: 'start' } );
		}
	} );

	/* Crossfade galleries (hero photos, live events photos): one picture at a time,
	   each fades into the next. Paused off screen and for people who prefer less motion. */
	var REDUCE = window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
	document.querySelectorAll( '.wp-block-gallery.is-style-crossfade' ).forEach( function ( gal ) {
		var figs = [].slice.call( gal.querySelectorAll( ':scope > figure.wp-block-image' ) );
		if ( REDUCE || figs.length < 2 ) {
			return;
		}
		var every = gal.classList.contains( 'hero-fade' ) ? 6000 : 4200;
		var i = 0;
		var timer = null;
		figs.forEach( function ( f ) {
			var im = f.querySelector( 'img' );
			if ( im ) {
				im.loading = 'eager';
			}
		} );
		figs[ 0 ].classList.add( 'is-current' );
		gal.classList.add( 'is-ready' );
		function next() {
			figs[ i ].classList.remove( 'is-current' );
			i = ( i + 1 ) % figs.length;
			figs[ i ].classList.add( 'is-current' );
		}
		function start() {
			if ( ! timer ) {
				timer = setInterval( next, every );
			}
		}
		function stop() {
			clearInterval( timer );
			timer = null;
		}
		if ( 'IntersectionObserver' in window ) {
			new IntersectionObserver( function ( entries ) {
				entries.forEach( function ( e ) {
					if ( e.isIntersecting && ! document.hidden ) {
						start();
					} else {
						stop();
					}
				} );
			}, { threshold: 0.15 } ).observe( gal );
		} else {
			start();
		}
		document.addEventListener( 'visibilitychange', function () {
			if ( document.hidden ) {
				stop();
			}
		} );
	} );

	/* Optional photo upload: up to three pictures (the prototype only lists the names). */
	document.querySelectorAll( '.p-upload' ).forEach( function ( box ) {
		var input = box.querySelector( 'input[type="file"]' );
		var drop = box.querySelector( '.p-upload__drop' );
		var list = box.querySelector( '.p-upload__list' );
		var warn = box.querySelector( '.p-upload__warn' );
		var MAX = 3;
		function show( files ) {
			files = [].slice.call( files || [] );
			warn.hidden = files.length <= MAX;
			list.innerHTML = '';
			files.slice( 0, MAX ).forEach( function ( f ) {
				var li = document.createElement( 'li' );
				li.textContent = f.name;
				list.appendChild( li );
			} );
		}
		input.addEventListener( 'change', function () {
			show( input.files );
		} );
		[ 'dragenter', 'dragover' ].forEach( function ( ev ) {
			drop.addEventListener( ev, function ( e ) {
				e.preventDefault();
				drop.classList.add( 'is-over' );
			} );
		} );
		[ 'dragleave', 'drop' ].forEach( function ( ev ) {
			drop.addEventListener( ev, function ( e ) {
				e.preventDefault();
				drop.classList.remove( 'is-over' );
			} );
		} );
		drop.addEventListener( 'drop', function ( e ) {
			show( e.dataTransfer && e.dataTransfer.files );
		} );
	} );
} )();
