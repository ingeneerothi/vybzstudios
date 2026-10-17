import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';

type ShutterProps = Record<string, unknown>;

/**
 * Le rideau métallique remonte d'un coup et emporte la scène (et ses stickers) :
 * la boutique ouvre sur la scène suivante.
 */
const ShutterUp: React.FC<TransitionPresentationComponentProps<ShutterProps>> = ({
	children,
	presentationDirection,
	presentationProgress,
}) => {
	if (presentationDirection === 'entering') {
		return <AbsoluteFill style={{zIndex: 0, transform: `scale(${1.08 - 0.08 * presentationProgress})`}}>{children}</AbsoluteFill>;
	}
	return (
		<AbsoluteFill style={{zIndex: 1, transform: `translateY(${(-presentationProgress * 104).toFixed(3)}%)`}}>
			{children}
			{/* lame basse du rideau */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					bottom: -46,
					height: 46,
					background: 'linear-gradient(#3a3a3a 0%, #151515 55%, #050505 100%)',
					borderTop: '3px solid #6b6b6b',
					boxShadow: '0 22px 40px rgba(0,0,0,0.55)',
				}}
			/>
		</AbsoluteFill>
	);
};

export const shutterUp = (): TransitionPresentation<ShutterProps> => ({component: ShutterUp, props: {}});
