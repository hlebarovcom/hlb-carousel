/**
 * Carousel behaviour: keeps the current slide in step with the scroll
 * position, drives the fallback arrows and markers, and runs autoplay.
 *
 * CSS scroll buttons and markers need none of this; the script is what
 * makes the same controls work elsewhere, and what autoplay needs everywhere.
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
			};
		},
	},
} );
