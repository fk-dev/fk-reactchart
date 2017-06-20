let React = require('react');
let dataScale = require('../core/space-transf.js');
let imUtils = require('../core/im-utils.js');

/*
	{
		draw: false,
		ds: {
			x: {},
			y: {}
		},
		position:{
			x: 0,
			y: 0
		},
		color: 'black',
		width: 0,
		fill: null,
		size: 0,
		shade: 1
	}
*/

class SquareMark extends React.Component {

	shouldComponentUpdate(props){
		return !imUtils.isEqual(props.state,this.props.state);
	}

	render(){
		let { css, gIdx, state } = this.props;
		let { ds, position, size, fill, color, shade, width} = state;

		let x = dataScale.toC(ds.x,position.x) - size;
		let y = dataScale.toC(ds.y,position.y) - size;
		let f = fill || color;

		let rectProps = css ? null : { width: 2 * size, height: 2 * size, fill: f, opacity: shade, stroke: color, strokeWidth: width };

		return <rect className={'mark mark-' + gIdx} x={x} y={y} {...rectProps}/>;
	}
}

module.exports = SquareMark;
