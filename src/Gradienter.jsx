import React from 'react';

export default class Gradienter extends React.Component {

	render(){
		const { state } = this.props;
		return <linearGradient x1="0%" x2="100%" y1="0%" y2="0%" id={state.id}>
			{state.offsets.map( (o,i) => <stop key={`grad.${state.id}.offset.${i}`} offset={o.off} stopColor={o.color} />)}
		</linearGradient>;
	}

}
