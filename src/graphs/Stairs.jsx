let React = require('react');
let Bins = require('./Bins.jsx');
let Mark = require('../marks/Mark.jsx');
let _ = require('underscore');

let imUtils = require('../core/im-utils.js');

/*
	{
		markType: '',
		marks: [Dot || Square],
		path: Bins 
	}
*/

class StairsChart extends React.Component {

	shouldComponentUpdate(props) {
		return !imUtils.isEqual(props.state,this.props.state);
	}

	render(){
		let { state, css, gIdx } = this.props;
		let opts = { css, gIdx };
		let { marks, path, markType } = state;
		return marks.length === 0 ? <Bins {...opts} state={path} /> : <g>
			<Bins {...opts} state={path} />
			{_.map(marks, (point) => <Mark {...opts} key={point.key} state={point} type={markType}/>)}
			</g>;
	}
}

module.exports = StairsChart;
