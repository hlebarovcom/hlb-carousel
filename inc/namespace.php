<?php
/**
 * Block registration.
 *
 * @package HLB\Carousel
 */

declare( strict_types=1 );

namespace HLB\Carousel;

const VERSION = '0.3.0';

/**
 * Hook the plugin into WordPress.
 */
function bootstrap(): void {
	add_action( 'init', __NAMESPACE__ . '\\register_blocks' );
}

/**
 * Register the carousel and slide blocks from the build directory.
 */
function register_blocks(): void {
	foreach ( [ 'carousel', 'carousel-slide' ] as $block ) {
		register_block_type_from_metadata( dirname( __DIR__ ) . '/build/' . $block );
	}

	wp_set_script_translations( 'hlb-carousel-editor-script', 'hlb-carousel' );
	wp_set_script_translations( 'hlb-carousel-slide-editor-script', 'hlb-carousel' );
}
