import React from 'react';

export default class Measurer extends React.Component {


		oneAxis(type, dirs){
			return <g className={`${type}Axis`}>
				{dirs.map( dir => <g key={`${type}.${dir}`} className={`axis axis-${dir}`}>
						<g className='ticks'>
							<text className={`label-major-${type} label-major-${type}-${dir} ${type}AxisTickLabel`} x={-10} y={-10} anchor='middle' id={`fkchartmeasurer-${this.props.id}-ticksmajor${type}${dir}`}/>
							<text className={`label-minor-${type} label-minor-${type}-${dir} ${type}AxisTickLabel`} x={-10} y={-10} anchor='middle' id={`fkchartmeasurer-${this.props.id}-ticksminor${type}${dir}`}/>
						</g>
						<g className={`axis-line axis-line-${dir} ${type}AxisLine`}>
							<text className={`axis-label axis-label-${dir} ${type}AxisLineLabel`} x={-10} y={-10} anchor='middle' id={`fkchartmeasurer-${this.props.id}-axis${type}${dir}`}/>
						</g>
					</g>
				)}
				</g>;
		}

		render(){

			return <g style={{visibility: 'hidden'}}>
				<text x={-10} y={-10} anchor='middle' id={`fkchartmeasurer-${this.props.id}`}/>
				<text textAnchor='middle' className='title' id={`fkchartmeasurer-${this.props.id}-title`}/>
				{this.oneAxis('x',['bottom','top'])}
				{this.oneAxis('y',['left','right'])}
			</g>;
		}
}
