import React from 'react';

export default class Measurer extends React.Component {


		oneAxis(type, dirs){
			return <g className={`${type}Axis`}>
				{dirs.map( dir => <g key={`${type}.${dir}`} className={`axis axis-${dir}`}>
						<g className='ticks'>
							<text className={`label-major label-major-${dir} ${type}AxisTickLabel`} x={-10} y={-10} anchor='middle' id={`fkchartmeasurer-${this.props.id}-label-major-${dir}`}/>
							<text className={`label-major label-major-${dir} ${type}AxisTickLabel`} x={-10} y={-10} anchor='middle' id={`fkchartmeasurer-${this.props.id}-label-major`}/>
							<text className={`label-minor label-minor-${dir} ${type}AxisTickLabel`} x={-10} y={-10} anchor='middle' id={`fkchartmeasurer-${this.props.id}-label-minor-${dir}`}/>
							<text className={`label-minor label-minor-${dir} ${type}AxisTickLabel`} x={-10} y={-10} anchor='middle' id={`fkchartmeasurer-${this.props.id}-label-minor`}/>
						</g>
						<text className={`axis-label axis-label-${dir} ${type}AxisLineLabel`} x={-10} y={-10} anchor='middle' id={`fkchartmeasurer-${this.props.id}-axis-label-${dir}`}/>
						<text className={`axis-label axis-label-${dir} ${type}AxisLineLabel`} x={-10} y={-10} anchor='middle' id={`fkchartmeasurer-${this.props.id}-axis-label`}/>
						<text className={`axis-factor axis-factor-${dir} ${type}AxisLineLabel`} x={-10} y={-10} anchor='middle' id={`fkchartmeasurer-${this.props.id}-axis-factor-${dir}`}/>
						<text className={`axis-factor axis-factor-${dir} ${type}AxisLineLabel`} x={-10} y={-10} anchor='middle' id={`fkchartmeasurer-${this.props.id}-axis-factor`}/>
					</g>
				)}
				</g>;
		}

		render(){

			return <g style={{visibility: 'hidden'}} id={`fkchartmeasurer-${this.props.id}`}>
				<text x={-10} y={-10} anchor='middle' id={`fkchartmeasurer-${this.props.id}-text`}/>
				<text textAnchor='middle' className='title' id={`fkchartmeasurer-${this.props.id}-title`}/>
				{this.oneAxis('x',['bottom','top'])}
				{this.oneAxis('y',['left','right'])}
				{this.oneAxis('polar',['r'])}
			</g>;
		}
}
