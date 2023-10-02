import React, { useState } from "react";
import { deepCp } from '../svg/core/utils.js';
import { w3color } from './color-converter.js';
import { label } from './lang-services.js';

/***
 * if type line chart | bar chart -> settings : axes | colors | rebaseType | graph type
 * change from line to bar chart
 * for each serie we can :
 *  change position of axe:
 *  - ord:left|right|
 *  - abs: top|bottom
 *  change color of serie
 *  change type base100, base0 or value
 *
 * if type pie  -> settings : colors | graph type
 * we can change color of serie
 * we can change between pie and bar
 */
/**
 * control the graph props, calls reinit to impact the graph
 * @param {*} props contains the graph props
 */
export default function GraphSettings({props,toggleSettings}) {

	const initColor = c => {
		const rgb = w3color(c ?? '#000000').toHexString();
		return rgb;
	};

  const rawProps = deepCp({},props.unprocessedProps());
  const initialGraphTypes = { ...rawProps.data.map((d) => d.type) }; //{0:Plain,1:Bars}
  const initialColors = { ...rawProps.graphProps.map((gp) => initColor(gp.color)) };
  const initialBaseTypes = {
    ...rawProps.data.map((dp) => dp.rebaseType || "value"),
  };
  const initialAbsPosition = {
    ...rawProps.data.map((dp) => dp.abs?.axis || "bottom"),
  };
  const initialOrdPosition = {
    ...rawProps.data.map((dp) => dp.ord?.axis || "left"),
  };

  const [graphTypes, setGraphTypes] = useState(initialGraphTypes);
  const [graphColors, setGraphColors] = useState(initialColors);
  const [baseTypes, setBaseTypes] = useState(initialBaseTypes); //Base100|Base0|value pour perf
  const [xPosition, setXPosition] = useState(initialAbsPosition);
  const [yPosition, setYPosition] = useState(initialOrdPosition);
  const initLegendPosition = rawProps.legend?.position || 'bottom';
  const [legendPosition, setLegendPosition] = useState(initLegendPosition);
  const initShowLegend = rawProps.legend?.showLegend ? 'show':'hide';
  const [showLegend, setShowLegend] = useState(initShowLegend);
  const applySettings = () => {
    rawProps.graphProps.forEach((g, i) => {
      g.show = true;
      g.color = graphColors[i];
      g.mark = graphTypes[i] === "Bars" ? true : false;
      g.width = 2;
      if (graphTypes[i] === "Pie") {
        g.pie = "disc";
        g.fill = true;
        g.pieOrigin = { x: 0, y: 0 };
        g.pieRadius = 160;
        g.cadre = true;
        g.chgSerie = "[{value, legend}]";
        g.file = {
          x: 0.9,
          y: 0.9,
        };
      } else {
        ["pie", "pieOrigin", "pieRadius", "chgSerie"].forEach((key) => {
          delete g[key];
        });
        g.fill = "none";
      }
    });

    rawProps.data.forEach((d, i) => {
      d.type = graphTypes[i];
      d.rebaseType = baseTypes[i];
      if(d.abs){
        d.abs.axis = xPosition[i];
      }
      if(d.ord){
        d.ord.axis = yPosition[i];
      }
      if (graphTypes[i] === "Pie") {
        d.series.forEach((p) => {
          p.value = p.y;
          p.legend = p.x.toDateString();
        });
      } else {
        d.series.forEach((p) => {
          delete p.legend;
          delete p.value;
        });
      }
    });
    rawProps.axisProps = {
      abs: [
        {
          placement: xPosition[0],
        },
        {
          placement: xPosition[1],
        },
      ],
      ord: [
        {
          placement: yPosition[0],
        },
        {
          placement: yPosition[1],
        },
      ],
    };
    if(rawProps.legend){
      rawProps.legend.showLegend = showLegend === 'show'? true:false;
    rawProps.legend.position = legendPosition;
    }
    rawProps.__defaulted = false;
    props.reinit(rawProps);
    toggleSettings();
  };
  return (
    <div className="reactchart-graph-settings">
        <div className="fk-row">
            <div className="fk-col fk-head fk-serie">{label('serie')}</div>
            <div className="fk-col fk-head fk-graphtype">{label('graphType')}</div>
            <div className="fk-col fk-head fk-color">{label('color')}</div>
            <div className="fk-col fk-head fk-valtype">{label('valType')}</div>
            <div className="fk-col fk-head fk-xaxis">{label('Xaxis')}</div>
            <div className="fk-col fk-head fk-yaxis">{label('Yaxis')}</div>
        </div>
        
          {rawProps.data.map((d, i) => {
            const serieName = rawProps.graphProps[i].name;
            const serieType = d.type; // Plain | Bars | Pie ...
            return (
              <div key={i} className="fk-row">
                <div className="fk-col fk-serie">{serieName}</div>
                <div className="fk-col fk-graphtype">
                  <select id={`gt.${i}`} className='fk-input'
                    value={graphTypes[i]}
                    onChange={(e) =>
                      setGraphTypes((old) => ({ ...old, [i]: e.target.value }))
                    }
                  >
                    <option value="Bars">Bar Chart</option>
                    <option value="Pie">Pie Chart</option>
                    <option value="Plain">Line Chart</option>
                    {/* <option value="donut">Donut Chart</option> */}
                  </select>
                </div>
                <div className="fk-col fk-color">
                  <input id={`col.${i}`} className='fk-input'
                    type="color"
                    name="color"
                    onChange={(e) =>
                      setGraphColors((old) => ({ ...old, [i]: e.target.value }))
                    }
                    value={graphColors[i]}
                  />
                </div>
                <div className="fk-col fk-valtype">
                  <select id={`typeVal.${i}`} className='fk-input'
                    value={baseTypes[i]}
                    onChange={(e) =>
                      setBaseTypes((old) => ({ ...old, [i]: e.target.value }))
                    }
                  >
                    <option value="base100">{label('base100')}</option>
                    <option value="base0">{label('base0')}</option>
                    <option value="value">{label('value')}</option>
                  </select>
                </div>
                <div className="fk-col fk-xaxis">
                  <select id={`xaxis.${i}`} className='fk-input'
                    value={xPosition[i]}
                    onChange={(e) =>
                      setXPosition((old) => ({ ...old, [i]: e.target.value }))
                    }
                    disabled={!["Plain", "Bars"].includes(serieType)}
                  >
                    <option value="top">{label('top')}</option>
                    <option value="bottom">{label('bottom')}</option>
                  </select>
                </div>
                <div className="fk-col fk-yaxis">
                  <select id={`yaxis.${i}`} className='fk-input'
                    value={yPosition[i]}
                    onChange={(e) =>
                      setYPosition((old) => ({ ...old, [i]: e.target.value }))
                    }
                    disabled={!["Plain", "Bars"].includes(serieType)}
                  >
                    <option value="left">{label('left')}</option>
                    <option value="right">{label('right')}</option>
                  </select>
                </div>
              </div>
            );
          })}
  
      
      <div className="fk-line" style={{ paddingTop: 10 }}>
        <label className="fk-label">{label('legPos')}</label>
        <select id='legPos' className='fk-input'
          value={legendPosition}
          onChange={(e) => {
            setLegendPosition(e.target.value);
          }}
        >
          <option value="bottom">{label('bottom')}</option>
          <option value="right">{label('right')}</option>
          <option value="left">{label('left')}</option>
        </select>
      </div>
      <div className="fk-line">
        <label className="fk-label">{label('showLeg')}</label>
        <select id='showLeg' className='fk-input'
          value={showLegend}
          onChange={(e) => {
            setShowLegend(e.target.value);
          }}
        >
          <option value='show'>{label('show')}</option>
          <option value='hide'>{label('hide')}</option>

        </select>
      </div>
      <div className="fk-line">
        <button className='fk-button' type="button" onClick={() => applySettings()}>
          {label('apply')}
        </button>
      </div>
    </div>
  );
}
