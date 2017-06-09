let React = require('react');
let Path = require('./Path.jsx');
let Mark = require('../marks/Mark.jsx');
let _ = require('underscore');

let imUtils = require('../core/im-utils.js');

/*
	{
		path: Path,
		markType: '',
		marks: [Dot || Square]
	}
*/
class PlainChart extends React.Component {

	shouldComponentUpdate(props) {
		return !imUtils.isEqual(props.state,this.props.state);
	}

	render(){
		let { state, css, gIdx } = this.props;
		let opts = { css, gIdx };
		let { marks, path, markType } = state;
		return marks.length === 0 ? <Path {...opts} state={path}/> : <g>
			<Path {...opts} state={path}/>
			{_.map(marks, (point) => <Mark key={point.key} {...opts} state={point} type={markType}/>)}
			</g>;
	}
}

module.exports = PlainChart;
