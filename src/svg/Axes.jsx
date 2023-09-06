import React from 'react';
import Axe from './axis/Axe.jsx';
import { isEqual } from './core/im-utils.js';

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
		return this.props.state.abs ? this.props.state.abs.map( p => p.show ? <Axe className='xAxis' key={p.key} state={p}/> : null) : null;
	}

	ordinate(){
		return this.props.state.ord ? this.props.state.ord.map( p => p.show ? <Axe className='yAxis' key={p.key} state={p}/> : null) : null;
	}

	polar(){
		return this.props.state.polar ? this.props.state.polar.map( p => p.show ? <Axe className='rAxis' key={p.key} state={p}/> : null) : null;
	}

	render(){

		return <g>
				{this.abscissa()}
				{this.ordinate()}
				{this.polar()}
			</g>;
	}

}
