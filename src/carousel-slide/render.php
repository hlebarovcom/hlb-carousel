<?php
/**
 * Slide: a wrapper for any blocks. The carousel adds the slide role and its
 * "N of M" label.
 *
 * @package HLB\Carousel
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner blocks.
 */

$hlb_label = trim( (string) ( $attributes['label'] ?? '' ) );
$hlb_attrs = [ 'class' => 'hlb-carousel__slide' ];

if ( '' !== $hlb_label ) {
	$hlb_attrs['data-label'] = $hlb_label;
}
?>
<div <?php echo get_block_wrapper_attributes( $hlb_attrs ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>><?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
