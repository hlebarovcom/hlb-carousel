/**
 * Carousel behaviour: keeps the current slide in step with the scroll
 * position, drives the fallback arrows and markers, and runs autoplay.
 *
 * CSS scroll buttons and markers need none of this; the script is what
 * makes the same controls work elsewhere, and what autoplay and mouse drag
 * need everywhere.
 */
import { getContext, getElement, store, withScope } from '@wordpress/interactivity';

/**
 *
 */
const reducedMotion = () => window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
/**
 *
 */
const behavior = () => ( reducedMotion() ? 'auto' : 'smooth' );

/**
 * @param {Element} element Any element inside a carousel.
 * @return {HTMLElement|null} The carousel's track.
 */
const trackOf = element => element.closest( '.wp-block-hlb-carousel' )?.querySelector( ':scope > .hlb-carousel__track' ) ?? null;

/**
 * @param {HTMLElement} track Track.
 * @return {HTMLElement[]} Slides of this carousel only.
 */
const slidesOf = track => [ ...track.children ].filter( child => child.classList.contains( 'hlb-carousel__slide' ) );

/**
 * Scroll position at which a slide is snapped.
 *
 * @param {HTMLElement} track Track.
 * @param {HTMLElement} slide Slide.
 * @return {number} Scroll left.
 */
function snapLeft( track, slide ) {
	const max = track.scrollWidth - track.clientWidth;
	// The track is positioned, so offsetLeft is measured from its start.
	let left = slide.offsetLeft;

	if ( getComputedStyle( slide ).scrollSnapAlign.includes( 'center' ) ) {
		left -= ( track.clientWidth - slide.offsetWidth ) / 2;
	}

	return Math.max( 0, Math.min( max, left ) );
}

/**
 * Update current slide and end flags from the scroll position.
 *
 * @param {Object}      context Carousel context.
 * @param {HTMLElement} track   Track.
 */
function sync( context, track ) {
	const slides = slidesOf( track );
	const left = Math.abs( track.scrollLeft );
	const max = track.scrollWidth - track.clientWidth;
	let current = 0;
	let nearest = Infinity;

	slides.forEach( ( slide, index ) => {
		const distance = Math.abs( snapLeft( track, slide ) - left );

		if ( distance < nearest ) {
			nearest = distance;
			current = index;
		}
	} );

	// With several slides in view the last ones never reach their snap point;
	// at the end, the last slide is current.
	if ( left >= max - 2 && slides.length ) {
		current = slides.length - 1;
	}

	context.current = current;
	context.atStart = left <= 2;
	context.atEnd = left >= max - 2;
}

/**
 * @param {HTMLElement} track Track.
 * @param {number}      index Slide index.
 */
function scrollToSlide( track, index ) {
	const slide = slidesOf( track )[ index ];

	if ( slide ) {
		track.scrollTo( {
			left: snapLeft( track, slide ),
			behavior: behavior(),
		} );
	}
}

// Pixels the pointer must move before a press becomes a drag.
const DRAG_THRESHOLD = 5;
// A drag this long moves at least one slide, even if it ends nearer the start.
const DRAG_FLICK = 40;

/**
 * Slide to settle on after a drag.
 *
 * @param {HTMLElement} track     Track.
 * @param {number}      from      Slide current when the drag started.
 * @param {number}      direction 1 when dragged forward, -1 back.
 * @param {number}      distance  Scrolled distance in pixels.
 * @return {number} Slide index.
 */
function dragTarget( track, from, direction, distance ) {
	const slides = slidesOf( track );
	const left = Math.abs( track.scrollLeft );
	let target = from;
	let nearest = Infinity;

	slides.forEach( ( slide, index ) => {
		const gap = Math.abs( snapLeft( track, slide ) - left );

		if ( gap < nearest ) {
			nearest = gap;
			target = index;
		}
	} );

	if ( target === from && distance > DRAG_FLICK ) {
		target += direction;
	}

	if ( track.parentElement.classList.contains( 'is-one-at-a-time' ) ) {
		target = Math.max( from - 1, Math.min( from + 1, target ) );
	}

	return Math.max( 0, Math.min( slides.length - 1, target ) );
}

/**
 * Click-and-drag scrolling for mouse pointers. Touch and pen keep native scrolling.
 *
 * @param {Object}      context Carousel context.
 * @param {HTMLElement} track   Track.
 * @return {Function} Cleanup.
 */
function enableDrag( context, track ) {
	let press = null;
	let settle = 0;

	const release = () => {
		track.classList.remove( 'is-free' );
		track.removeEventListener( 'scrollend', release );
		window.clearTimeout( settle );
	};

	// Swallow the click that ends a drag, so links in slides do not open.
	const blockClick = event => {
		event.preventDefault();
		event.stopPropagation();
	};

	const down = event => {
		if ( 'mouse' !== event.pointerType || 0 !== event.button || event.target.closest( 'input, textarea, select, [contenteditable]' ) ) {
			return;
		}

		release();
		press = { x: event.clientX, left: track.scrollLeft, from: context.current, id: event.pointerId, dragging: false };
	};

	const move = event => {
		if ( ! press || event.pointerId !== press.id ) {
			return;
		}

		const dx = event.clientX - press.x;

		if ( ! press.dragging ) {
			if ( Math.abs( dx ) < DRAG_THRESHOLD ) {
				return;
			}

			press.dragging = true;
			track.setPointerCapture( event.pointerId );
			track.classList.add( 'is-dragging', 'is-free' );
			window.getSelection()?.removeAllRanges();
		}

		track.scrollLeft = press.left - dx;
	};

	const up = event => {
		if ( ! press || event.pointerId !== press.id ) {
			return;
		}

		const { dragging, left, from } = press;
		press = null;

		if ( ! dragging ) {
			return;
		}

		track.classList.remove( 'is-dragging' );
		track.addEventListener( 'click', blockClick, { capture: true, once: true } );
		window.setTimeout( () => track.removeEventListener( 'click', blockClick, { capture: true } ) );

		const moved = Math.abs( track.scrollLeft ) - Math.abs( left );
		const target = dragTarget( track, from, Math.sign( moved ), Math.abs( moved ) );

		// Snapping comes back once the scroll lands; the timeout covers no scroll at all.
		track.addEventListener( 'scrollend', release );
		settle = window.setTimeout( release, 1000 );
		scrollToSlide( track, target );
	};

	// Images and links would otherwise start a native drag.
	const noNativeDrag = event => event.preventDefault();

	track.addEventListener( 'pointerdown', down );
	track.addEventListener( 'pointermove', move );
	track.addEventListener( 'pointerup', up );
	track.addEventListener( 'pointercancel', up );
	track.addEventListener( 'dragstart', noNativeDrag );

	return () => {
		release();
		track.removeEventListener( 'pointerdown', down );
		track.removeEventListener( 'pointermove', move );
		track.removeEventListener( 'pointerup', up );
		track.removeEventListener( 'pointercancel', up );
		track.removeEventListener( 'dragstart', noNativeDrag );
	};
}

const { state, actions } = store( 'hlb/carousel', {
	state: {
		/**
		 *
		 */
		get isCurrent() {
			const context = getContext();
			return context.index === context.current;
		},
		/**
		 *
		 */
		get live() {
			const context = getContext();
			return context.autoplay && context.playing ? 'off' : 'polite';
		},
		/**
		 *
		 */
		get playLabel() {
			const context = getContext();
			return context.playing ? context.labels.pause : context.labels.play;
		},
		/**
		 *
		 */
		get shouldPlay() {
			const context = getContext();
			return context.autoplay && context.playing && ! context.hover && ! context.hidden && ! context.offscreen;
		},
	},
	actions: {
		/**
		 * Any deliberate interaction stops autoplay until play is pressed.
		 */
		stop() {
			getContext().playing = false;
		},
		/**
		 * Horizontal wheel or trackpad scrolling on the track counts as interaction.
		 *
		 * @param {WheelEvent} event Wheel event.
		 */
		wheel( event ) {
			if ( Math.abs( event.deltaX ) > Math.abs( event.deltaY ) ) {
				actions.stop();
			}
		},
		/**
		 *
		 */
		prev() {
			const track = trackOf( getElement().ref );
			track?.scrollBy( {
				left: -track.clientWidth * 0.85,
				behavior: behavior(),
			} );
			actions.stop();
		},
		/**
		 *
		 */
		next() {
			const track = trackOf( getElement().ref );
			track?.scrollBy( {
				left: track.clientWidth * 0.85,
				behavior: behavior(),
			} );
			actions.stop();
		},
		/**
		 *
		 */
		goTo() {
			const track = trackOf( getElement().ref );

			if ( track ) {
				scrollToSlide( track, getContext().index );
			}

			actions.stop();
		},
		/**
		 *
		 */
		togglePlay() {
			const context = getContext();
			context.playing = ! context.playing;
		},
		/**
		 *
		 */
		hoverStart() {
			getContext().hover = true;
		},
		/**
		 *
		 */
		hoverEnd() {
			getContext().hover = false;
		},
		/**
		 * Keyboard focus inside the carousel stops autoplay, except on the pause button.
		 *
		 * @param {FocusEvent} event Focus event.
		 */
		focusIn( event ) {
			if ( ! event.target.closest( '.hlb-carousel__pause' ) && event.target.matches( ':focus-visible' ) ) {
				actions.stop();
			}
		},
	},
	callbacks: {
		/**
		 * Keep the current slide in step while scrolling.
		 */
		sync() {
			const track = getElement().ref;
			const context = getContext();

			window.cancelAnimationFrame( track.hlbFrame );
			track.hlbFrame = window.requestAnimationFrame( withScope( () => sync( context, track ) ) );
		},
		/**
		 * Set up one carousel: initial state, observers and the autoplay timer.
		 *
		 * @return {Function} Cleanup.
		 */
		init() {
			const context = getContext();
			const element = getElement().ref;
			const track = element.querySelector( ':scope > .hlb-carousel__track' );

			if ( ! track ) {
				return undefined;
			}

			if ( context.autoplay && reducedMotion() ) {
				context.playing = false;
			}

			sync( context, track );
			context.ready = true;

			const resize = new ResizeObserver( withScope( () => sync( context, track ) ) );
			resize.observe( track );

			const visibility = new IntersectionObserver(
				withScope( ( [ entry ] ) => {
					context.offscreen = ! entry.isIntersecting;
				} )
			);
			visibility.observe( element );

			const onVisibility = withScope( () => {
				context.hidden = document.hidden;
			} );
			document.addEventListener( 'visibilitychange', onVisibility );

			const stopDrag = context.drag ? enableDrag( context, track ) : () => {};

			let timer = 0;

			if ( context.autoplay ) {
				timer = window.setInterval(
					withScope( () => {
						if ( ! state.shouldPlay ) {
							return;
						}

						scrollToSlide( track, context.atEnd ? 0 : context.current + 1 );
					} ),
					context.interval * 1000
				);
			}

			return () => {
				resize.disconnect();
				visibility.disconnect();
				document.removeEventListener( 'visibilitychange', onVisibility );
				window.clearInterval( timer );
				stopDrag();
			};
		},
	},
} );
