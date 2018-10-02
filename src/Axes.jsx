import React from 'react';
import Axe from './axis/Axe.jsx';
import { isEqual } from './core/im-utils.js';
import { map } from 'underscore';

/*
	{
		abs: [Axe],
		ord: [Axe]
	}
*/

export default class Axes extends React.Component {

	shouldComponentUpdate(props){
		return !isEqual(props.state,this.props.state);
	}

	abscissa(){
		return map(this.props.state.abs, (p) => p.show ? <Axe className='xAxis' key={p.key} state={p}/> : null);
	}

	ordinate(){
		return map(this.props.state.ord, (p) => p.show ? <Axe className='yAxis' key={p.key} state={p}/> : null);
	}

	render(){

		return <g>
				{this.abscissa()}
				{this.ordinate()}
			</g>;
	}

}
