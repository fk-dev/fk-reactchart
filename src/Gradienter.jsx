import React from 'react';

export default class Gradienter extends React.Component {

	render(){
		const { state } = this.props;
		const { type, offsets, id } = state;
		const x2 = type === 'vertical' ? '0' : "1";
		const y2 = type === 'vertical' ? '1' : "0";
		return type === 'radial' ? <radialGradient id={id}>
			{offsets.map( (o,i) => <stop key={`grad.${id}.offset.${i}`} offset={o.off} stopColor={o.color} />)}
		</radialGradient> :
		<linearGradient id={id} x1="0" x2={x2} y1="0" y2={y2}>
			{offsets.map( (o,i) => <stop key={`grad.${state.id}.offset.${i}`} offset={o.off} stopColor={o.color} />)}
		</linearGradient>;
	}

}
