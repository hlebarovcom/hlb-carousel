import {
	BlockControls,
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	Notice,
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';

import { wrapperClasses, wrapperStyle } from './settings';

const SLIDE = 'hlb/carousel-slide';
const TEMPLATE = [ [ SLIDE ], [ SLIDE ], [ SLIDE ] ];

/**
 * Carousel editor: the track holds the slides; settings live in the sidebar.
 *
 * @param {Object}   props               Block props.
 * @param {Object}   props.attributes    Attributes.
 * @param {Function} props.setAttributes Attribute setter.
 * @param {string}   props.clientId      Block client ID.
 */
export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		label,
		perView,
		perViewTablet,
		perViewMobile,
		snapAlign,
		oneAtATime,
		mouseDrag,
		showArrows,
		arrowPlacement,
		arrowsOnHover,
		showMarkers,
		markerStyle,
		markerPosition,
		autoplay,
		showPause,
		interval,
	} = attributes;

	const count = useSelect( select => select( blockEditorStore ).getBlockCount( clientId ), [ clientId ] );
	const { insertBlock } = useDispatch( blockEditorStore );

	const blockProps = useBlockProps( {
		className: wrapperClasses( attributes ),
		style: wrapperStyle( attributes ),
	} );

	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'hlb-carousel__track',
			'data-label-prev': __( 'Previous slide', 'hlb-carousel' ),
			'data-label-next': __( 'Next slide', 'hlb-carousel' ),
		},
		{
			allowedBlocks: [ SLIDE ],
			template: TEMPLATE,
			orientation: 'horizontal',
			renderAppender: false,
		}
	);

	/**
	 *
	 */
	const perViewControl = ( key, title, value ) => (
		<RangeControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ title }
			max={ 6 }
			min={ 1 }
			step={ 0.1 }
			value={ value }
			onChange={ next => setAttributes( { [ key ]: next } ) }
		/>
	);

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon={ plus }
						label={ __( 'Add slide', 'hlb-carousel' ) }
						onClick={ () => insertBlock( createBlock( SLIDE ), count, clientId ) }
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<PanelBody title={ __( 'Carousel', 'hlb-carousel' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						help={ __( 'Names the carousel for screen readers, for example "Upcoming events".', 'hlb-carousel' ) }
						label={ __( 'Label', 'hlb-carousel' ) }
						value={ label }
						onChange={ next => setAttributes( { label: next } ) }
					/>
					{ ! label && (
						<Notice isDismissible={ false } status="warning">
							{ __( 'Add a label so screen reader users know what the carousel holds.', 'hlb-carousel' ) }
						</Notice>
					) }
				</PanelBody>

				<PanelBody title={ __( 'Slides per view', 'hlb-carousel' ) }>
					{ perViewControl( 'perView', __( 'Wide', 'hlb-carousel' ), perView ) }
					{ perViewControl( 'perViewTablet', __( 'Medium (under 1024px)', 'hlb-carousel' ), perViewTablet ) }
					{ perViewControl( 'perViewMobile', __( 'Narrow (under 600px)', 'hlb-carousel' ), perViewMobile ) }
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Snap slides to', 'hlb-carousel' ) }
						options={ [
							{
								label: __( 'Start', 'hlb-carousel' ),
								value: 'start',
							},
							{
								label: __( 'Centre', 'hlb-carousel' ),
								value: 'center',
							},
						] }
						value={ snapAlign }
						onChange={ next => setAttributes( { snapAlign: next } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						checked={ oneAtATime }
						help={ __( 'A swipe never skips past a slide.', 'hlb-carousel' ) }
						label={ __( 'One slide at a time', 'hlb-carousel' ) }
						onChange={ next => setAttributes( { oneAtATime: next } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						checked={ mouseDrag }
						help={ __( 'Click and drag to scroll with a mouse. Touch swiping always works. Not active in the editor.', 'hlb-carousel' ) }
						label={ __( 'Drag with mouse', 'hlb-carousel' ) }
						onChange={ next => setAttributes( { mouseDrag: next } ) }
					/>
				</PanelBody>

				<PanelBody title={ __( 'Arrows', 'hlb-carousel' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						checked={ showArrows }
						label={ __( 'Show arrows', 'hlb-carousel' ) }
						onChange={ next => setAttributes( { showArrows: next } ) }
					/>
					{ showArrows && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Placement', 'hlb-carousel' ) }
							options={ [
								{
									label: __( 'On the slides', 'hlb-carousel' ),
									value: 'overlay',
								},
								{
									label: __( 'Beside the slides', 'hlb-carousel' ),
									value: 'outside',
								},
								{
									label: __( 'Below the slides', 'hlb-carousel' ),
									value: 'below',
								},
								{
									label: __( 'Above, at the end', 'hlb-carousel' ),
									value: 'top',
								},
							] }
							value={ arrowPlacement }
							onChange={ next => setAttributes( { arrowPlacement: next } ) }
						/>
					) }
					{ showArrows && 'overlay' === arrowPlacement && (
						<ToggleControl
							__nextHasNoMarginBottom
							checked={ arrowsOnHover }
							help={ __( 'On devices with a mouse. Touch screens always show the arrows.', 'hlb-carousel' ) }
							label={ __( 'Show on hover only', 'hlb-carousel' ) }
							onChange={ next => setAttributes( { arrowsOnHover: next } ) }
						/>
					) }
				</PanelBody>

				<PanelBody title={ __( 'Markers', 'hlb-carousel' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						checked={ showMarkers }
						label={ __( 'Show markers', 'hlb-carousel' ) }
						onChange={ next => setAttributes( { showMarkers: next } ) }
					/>
					{ showMarkers && (
						<>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Style', 'hlb-carousel' ) }
								options={ [
									{
										label: __( 'Dots', 'hlb-carousel' ),
										value: 'dots',
									},
									{
										label: __( 'Numbers', 'hlb-carousel' ),
										value: 'numbers',
									},
									{
										label: __( 'Slide labels', 'hlb-carousel' ),
										value: 'labels',
									},
								] }
								value={ markerStyle }
								onChange={ next => setAttributes( { markerStyle: next } ) }
							/>
							<SelectControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Position', 'hlb-carousel' ) }
								options={ [
									{
										label: __( 'Above the slides', 'hlb-carousel' ),
										value: 'before',
									},
									{
										label: __( 'Below the slides', 'hlb-carousel' ),
										value: 'after',
									},
								] }
								value={ markerPosition }
								onChange={ next => setAttributes( { markerPosition: next } ) }
							/>
						</>
					) }
				</PanelBody>

				<PanelBody initialOpen={ false } title={ __( 'Autoplay', 'hlb-carousel' ) }>
					<ToggleControl
						__nextHasNoMarginBottom
						checked={ autoplay }
						help={ __( 'Autoplay pauses on hover, stops on focus or interaction, and does not start for visitors who prefer reduced motion. It never runs in the editor.', 'hlb-carousel' ) }
						label={ __( 'Autoplay', 'hlb-carousel' ) }
						onChange={ next => setAttributes( { autoplay: next } ) }
					/>
					{ autoplay && (
						<ToggleControl
							__nextHasNoMarginBottom
							checked={ showPause }
							help={ __( 'Without it, visitors can only stop autoplay by hovering, focusing or interacting with the carousel.', 'hlb-carousel' ) }
							label={ __( 'Show pause button', 'hlb-carousel' ) }
							onChange={ next => setAttributes( { showPause: next } ) }
						/>
					) }
					{ autoplay && (
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							help={ __( 'Seconds per slide. After the last slide it rewinds to the first.', 'hlb-carousel' ) }
							label={ __( 'Interval', 'hlb-carousel' ) }
							max={ 20 }
							min={ 3 }
							value={ interval }
							onChange={ next => setAttributes( { interval: next } ) }
						/>
					) }
				</PanelBody>
			</InspectorControls>

			<section { ...blockProps }>
				<div { ...innerBlocksProps } />
				{ autoplay && showPause && (
					<button className="hlb-carousel__pause" disabled type="button">
						{ __( 'Pause slideshow', 'hlb-carousel' ) }
					</button>
				) }
			</section>
		</>
	);
}
