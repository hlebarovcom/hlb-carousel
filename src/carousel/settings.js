/**
 * Classes and custom properties shared by the editor preview. Kept in step
 * with render.php, which outputs the same on the front end.
 */

/**
 * Resolve a block gap value to CSS.
 *
 * @param {string|undefined} value Block gap from the style attribute.
 * @return {string|undefined} CSS value.
 */
export function gapValue( value ) {
	if ( typeof value !== 'string' || ! value ) {
		return undefined;
	}

	const preset = value.match( /^var:preset\|spacing\|(.+)$/ );

	return preset ? `var(--wp--preset--spacing--${ preset[ 1 ] })` : value;
}

/**
 * Wrapper classes for the settings.
 *
 * @param {Object} attributes Block attributes.
 * @return {string} Class names.
 */
export function wrapperClasses( attributes ) {
	const { showArrows, arrowPlacement, arrowsOnHover, showMarkers, markerStyle, markerPosition, snapAlign, oneAtATime } = attributes;

	return [
		showArrows && 'has-arrows',
		showArrows && `is-arrows-${ arrowPlacement }`,
		showArrows && 'overlay' === arrowPlacement && arrowsOnHover && 'is-arrows-on-hover',
		showMarkers && 'has-markers',
		showMarkers && `is-markers-${ markerPosition }`,
		showMarkers && `is-markers-${ markerStyle }`,
		`is-snap-${ snapAlign }`,
		oneAtATime && 'is-one-at-a-time',
	].filter( Boolean ).join( ' ' );
}

/**
 * Custom properties for the settings.
 *
 * @param {Object} attributes Block attributes.
 * @return {Object} Inline style.
 */
export function wrapperStyle( attributes ) {
	const gap = gapValue( attributes.style?.spacing?.blockGap );

	return {
		'--hlb-carousel-per-view': attributes.perView,
		'--hlb-carousel-per-view-tablet': attributes.perViewTablet,
		'--hlb-carousel-per-view-mobile': attributes.perViewMobile,
		...( gap ? { '--hlb-carousel-gap': gap } : {} ),
	};
}
