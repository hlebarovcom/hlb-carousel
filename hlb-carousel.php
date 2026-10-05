<?php
/**
 * Plugin Name:       HLB Carousel
 * Description:       A carousel block built on CSS scroll snap, scroll buttons and scroll markers, with a script fallback and optional autoplay.
 * Version:           0.1.0
 * Requires at least: 6.6
 * Requires PHP:      8.1
 * Author:            Hlebarov.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       hlb-carousel
 *
 * @package HLB\Carousel
 */

declare( strict_types=1 );

require_once __DIR__ . '/inc/namespace.php';

HLB\Carousel\bootstrap();
