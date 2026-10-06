<?php
/**
 * Carousel: a scroll-snap track of slides.
 *
 * Where the browser supports CSS scroll buttons and scroll markers, CSS draws
 * the arrows and markers. The buttons and list below are the fallback for
 * other browsers; the stylesheet shows them only there, once the view script
 * is running. The pause button exists only when autoplay and its toggle are on.
 *
 * @package HLB\Carousel
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Rendered slides.
 * @var WP_Block $block      Block instance.
 */

$hlb_count = count( $block->inner_blocks );

if ( ! $hlb_count ) {
	return;
}

$hlb_arrows   = ! empty( $attributes['showArrows'] );
$hlb_markers  = ! empty( $attributes['showMarkers'] );
$hlb_autoplay = ! empty( $attributes['autoplay'] );
$hlb_pause    = $hlb_autoplay && ! empty( $attributes['showPause'] );
$hlb_style    = in_array( $attributes['markerStyle'] ?? '', [ 'dots', 'numbers', 'labels' ], true ) ? $attributes['markerStyle'] : 'dots';
$hlb_position = 'before' === ( $attributes['markerPosition'] ?? '' ) ? 'before' : 'after';
$hlb_place    = in_array( $attributes['arrowPlacement'] ?? '', [ 'overlay', 'outside', 'below', 'top' ], true ) ? $attributes['arrowPlacement'] : 'overlay';

$hlb_classes = array_filter(
	[
		$hlb_arrows ? 'has-arrows' : '',
		$hlb_arrows ? 'is-arrows-' . $hlb_place : '',
		$hlb_arrows && 'overlay' === $hlb_place && ! empty( $attributes['arrowsOnHover'] ) ? 'is-arrows-on-hover' : '',
		$hlb_markers ? 'has-markers' : '',
		$hlb_markers ? 'is-markers-' . $hlb_position : '',
		$hlb_markers ? 'is-markers-' . $hlb_style : '',
		'is-snap-' . ( 'center' === ( $attributes['snapAlign'] ?? '' ) ? 'center' : 'start' ),
		! empty( $attributes['oneAtATime'] ) ? 'is-one-at-a-time' : '',
	]
);

$hlb_vars = [
	'--hlb-carousel-per-view'        => (float) ( $attributes['perView'] ?? 3 ),
	'--hlb-carousel-per-view-tablet' => (float) ( $attributes['perViewTablet'] ?? 2 ),
	'--hlb-carousel-per-view-mobile' => (float) ( $attributes['perViewMobile'] ?? 1 ),
];

$hlb_gap = $attributes['style']['spacing']['blockGap'] ?? '';

if ( is_string( $hlb_gap ) && '' !== $hlb_gap ) {
	$hlb_vars['--hlb-carousel-gap'] = preg_match( '/^var:preset\|spacing\|([a-z0-9-]+)$/', $hlb_gap, $hlb_match )
		? 'var(--wp--preset--spacing--' . $hlb_match[1] . ')'
		: $hlb_gap;
}

$hlb_inline = '';

foreach ( $hlb_vars as $hlb_name => $hlb_value ) {
	$hlb_inline .= $hlb_name . ':' . $hlb_value . ';';
}

// Label each top-level slide "N of M" and keep its label for the markers.
// Slides of a nested carousel were labelled when it rendered, so they are skipped.
$hlb_labels = [];
$hlb_html   = new WP_HTML_Tag_Processor( $content );
$hlb_index  = 0;

while ( $hlb_html->next_tag( [ 'class_name' => 'hlb-carousel__slide' ] ) ) {
	if ( null !== $hlb_html->get_attribute( 'data-hlb-index' ) ) {
		continue;
	}

	++$hlb_index;
	$hlb_name = (string) $hlb_html->get_attribute( 'data-label' );
	/* translators: 1: slide number, 2: number of slides. */
	$hlb_position_label = sprintf( __( '%1$d of %2$d', 'hlb-carousel' ), $hlb_index, $hlb_count );

	$hlb_html->set_attribute( 'data-hlb-index', (string) $hlb_index );
	$hlb_html->set_attribute( 'role', 'group' );
	$hlb_html->set_attribute( 'aria-roledescription', __( 'slide', 'hlb-carousel' ) );
	$hlb_html->set_attribute( 'aria-label', '' !== $hlb_name ? $hlb_name . ', ' . $hlb_position_label : $hlb_position_label );

	if ( '' === $hlb_name ) {
		$hlb_html->set_attribute( 'data-label', (string) $hlb_index );
	}

	$hlb_labels[] = '' !== $hlb_name ? $hlb_name : (string) $hlb_index;
}

$hlb_context = [
	'count'    => $hlb_count,
	'current'  => 0,
	'atStart'  => true,
	'atEnd'    => $hlb_count < 2,
	'autoplay' => $hlb_autoplay,
	'interval' => max( 3, (int) ( $attributes['interval'] ?? 6 ) ),
	'playing'  => $hlb_autoplay,
	'hover'    => false,
	'hidden'   => false,
	'offscreen' => false,
	'ready'    => false,
	'labels'   => [
		'pause' => __( 'Pause slideshow', 'hlb-carousel' ),
		'play'  => __( 'Play slideshow', 'hlb-carousel' ),
	],
];

$hlb_wrapper = get_block_wrapper_attributes(
	[
		'class'                => implode( ' ', $hlb_classes ),
		'style'                => $hlb_inline,
		'aria-roledescription' => __( 'carousel', 'hlb-carousel' ),
		'aria-label'           => '' !== trim( (string) ( $attributes['label'] ?? '' ) ) ? $attributes['label'] : __( 'Carousel', 'hlb-carousel' ),
	]
);

$hlb_marker_list = static function () use ( $hlb_labels, $hlb_style ): void {
	?>
	<ol class="hlb-carousel__markers hlb-carousel__fallback">
		<?php foreach ( $hlb_labels as $hlb_i => $hlb_text ) : ?>
			<li>
				<?php /* translators: %d: slide number. */ ?>
				<button type="button" class="hlb-carousel__marker" aria-label="<?php echo esc_attr( sprintf( __( 'Go to slide %d', 'hlb-carousel' ), $hlb_i + 1 ) ); ?>" data-wp-context="<?php echo esc_attr( wp_json_encode( [ 'index' => $hlb_i ] ) ); ?>" data-wp-on--click="actions.goTo" data-wp-bind--aria-current="state.isCurrent"><?php echo 'dots' === $hlb_style ? '' : esc_html( 'numbers' === $hlb_style ? (string) ( $hlb_i + 1 ) : $hlb_text ); ?></button>
			</li>
		<?php endforeach; ?>
	</ol>
	<?php
};
?>
<section <?php echo $hlb_wrapper; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> data-wp-interactive="hlb/carousel" data-wp-context="<?php echo esc_attr( wp_json_encode( $hlb_context ) ); ?>" data-wp-init="callbacks.init" data-wp-class--is-ready="context.ready" data-wp-on--mouseenter="actions.hoverStart" data-wp-on--mouseleave="actions.hoverEnd" data-wp-on--focusin="actions.focusIn">
	<?php if ( $hlb_markers && 'before' === $hlb_position ) : ?>
		<?php $hlb_marker_list(); ?>
	<?php endif; ?>
	<?php if ( $hlb_arrows ) : ?>
		<button type="button" class="hlb-carousel__button hlb-carousel__button--prev hlb-carousel__fallback" aria-label="<?php esc_attr_e( 'Previous slide', 'hlb-carousel' ); ?>" data-wp-on--click="actions.prev" data-wp-bind--disabled="context.atStart"></button>
	<?php endif; ?>
	<div class="hlb-carousel__track" tabindex="0" role="group" aria-label="<?php esc_attr_e( 'Slides', 'hlb-carousel' ); ?>" data-label-prev="<?php esc_attr_e( 'Previous slide', 'hlb-carousel' ); ?>" data-label-next="<?php esc_attr_e( 'Next slide', 'hlb-carousel' ); ?>" data-wp-bind--aria-live="state.live" data-wp-on-async--scroll="callbacks.sync" data-wp-on--pointerdown="actions.stop" data-wp-on--keydown="actions.stop" data-wp-on-async--wheel="actions.wheel"><?php echo $hlb_html->get_updated_html(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
	<?php if ( $hlb_arrows ) : ?>
		<button type="button" class="hlb-carousel__button hlb-carousel__button--next hlb-carousel__fallback" aria-label="<?php esc_attr_e( 'Next slide', 'hlb-carousel' ); ?>" data-wp-on--click="actions.next" data-wp-bind--disabled="context.atEnd"></button>
	<?php endif; ?>
	<?php if ( $hlb_markers && 'after' === $hlb_position ) : ?>
		<?php $hlb_marker_list(); ?>
	<?php endif; ?>
	<?php if ( $hlb_pause ) : ?>
		<button type="button" class="hlb-carousel__pause" hidden data-wp-bind--hidden="!context.ready" data-wp-class--is-paused="!context.playing" data-wp-on--click="actions.togglePlay" data-wp-text="state.playLabel"><?php esc_html_e( 'Pause slideshow', 'hlb-carousel' ); ?></button>
	<?php endif; ?>
</section>
