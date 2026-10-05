import { InspectorControls, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const TEMPLATE = [ [ 'core/paragraph', { placeholder: __( 'Add slide content…', 'hlb-carousel' ) } ] ];

/**
 * Slide editor: any blocks, plus a label for markers and screen readers.
 *
 * @param {Object}   props               Block props.
 * @param {Object}   props.attributes    Attributes.
 * @param {Function} props.setAttributes Attribute setter.
 */
export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( {
		className: 'hlb-carousel__slide',
		'data-label': attributes.label || undefined,
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, { template: TEMPLATE } );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Slide', 'hlb-carousel' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						help={ __( 'Shown as the marker when markers use slide labels, and read by screen readers. Defaults to "1 of 4".', 'hlb-carousel' ) }
						label={ __( 'Label', 'hlb-carousel' ) }
						value={ attributes.label }
						onChange={ label => setAttributes( { label } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}
