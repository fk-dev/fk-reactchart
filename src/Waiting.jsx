import React from 'react';

export default class Waiting extends React.Component {

	constructor(props){
		super(props);
		const r = 40;
		let where = [];
		for(let i = 0; i < 12; i++){
			where.push(i);
		}
		this.state = {
			r,
			where
		};
	}

	componentDidUpdate(){
		setTimeout(() => {
			const w = this.state.where.map(w => (w + 1)%12);
			this.setState({where: w});
		}, 100);
	}

	position(h){
		const { r } = this.state;
		const { cos, sin, PI } = Math;
		const alpha = h * 2 * PI / 12;

		const x = - r * sin(alpha) + this.props.x;
		const y = - r * cos(alpha) + this.props.y;
		return { x, y };
	}

	second(){
		const { where } = this.state;

		return where.map( (w,i) => {
			const { x, y } = this.position(i);
			return <circle key={`c.${w}`} cx={x} cy={y} r={5 - w/11*3} stroke='#3A83F1' fill='#3A83F1' strokeWidth='4px'/>;
		});
	}

	render(){
		return <g>
			{this.second()}
		</g>;
	}


}
