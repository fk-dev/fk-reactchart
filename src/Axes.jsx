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
		let css = this.props.state.css;
		return map(this.props.state.abs, (p) => {return p.show ? <Axe className='xAxis' key={p.key} css={css} state={p}/> : null;});
	}

	ordinate(){
		let css = this.props.state.css;
		return map(this.props.state.ord, (p) => {return p.show ? <Axe className='yAxis' key={p.key} css={css} state={p}/> : null;});
	}

	render(){

		return <g>
				{this.abscissa()}
				{this.ordinate()}
			</g>;
	}

}
