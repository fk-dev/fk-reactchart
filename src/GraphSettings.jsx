import { bson } from "fk-helpers";
import React, { useState } from "react";

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
  const rawProps = bson.clone(props.rawProps());
  const initialGraphTypes = { ...rawProps.data.map((d) => d.type) }; //{0:Plain,1:Bars}
  const initialColors = { ...rawProps.graphProps.map((gp) => gp.color) };
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
  // console.log("initialBaseTypes:" + JSON.stringify({ initialBaseTypes }));
  const [baseTypes, setBaseTypes] = useState(initialBaseTypes); //Base100|Base0|value pour perf
  const [xPosition, setXPosition] = useState(initialAbsPosition);
  const [yPosition, setYPosition] = useState(initialOrdPosition);
  const initLegendPosition = rawProps.legend?.position || 'bottom';
  const [legendPosition, setLegendPosition] = useState(initLegendPosition);
  const initShowLegend = rawProps.legend?.showLegend ? 'show':'hide';
  // console.log("check legend from props:"+JSON.stringify(rawProps.legend));
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
        // rawProps.outerMargin = { left: 40, bottom: 40, right: 40, top: 40 }; // left, bottom, right, top
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
    // console.log("will apply these props:" + JSON.stringify(rawProps));
    rawProps.__defaulted = false;
    props.reinit(rawProps);
    toggleSettings();
  };
  // console.log("new props:" + JSON.stringify(props.rawProps()));
  return (
    <div className="container-fluid">
        <div className="row">
            <div style={{marginRight:10}} className="col-sm-1">Serie</div>
            <div style={{marginRight:10}}  className="col-sm-2">Graph Type</div>
            <div style={{marginRight:10}}  className="col-sm-2">Color</div>
            <div style={{marginRight:10}}  className="col-sm-2">Type valeur</div>
            <div style={{marginRight:10}}  className="col-sm-1">X axis</div>
            <div style={{marginRight:10}}  className="col-sm-1">Y axis</div>
        </div>
        
          {rawProps.data.map((d, i) => {
            let serieName = rawProps.graphProps[i].name;
            let serieType = d.type; // Plain | Bars | Pie ...
            return (
              <div  key={i} className="row">
                <div style={{paddingRight:10}}  className="col-sm-1">{serieName}</div>
                <div style={{marginRight:10}}  className="col-sm-2">
                  <select
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
                <div style={{marginRight:10}}  className="col-sm-2">
                  <input
                    type="color"
                    name="color"
                    onChange={(e) =>
                      setGraphColors((old) => ({ ...old, [i]: e.target.value }))
                    }
                    value={graphColors[i]}
                  />
                </div>
                <div style={{marginRight:10}}  className="col-sm-2">
                  <select
                    value={baseTypes[i]}
                    id="typeVal"
                    onChange={(e) =>
                      setBaseTypes((old) => ({ ...old, [i]: e.target.value }))
                    }
                  >
                    <option value="base100">Base 100</option>
                    <option value="base0">Base 0</option>
                    <option value="value">Value</option>
                  </select>
                </div>
                <div style={{marginRight:10}}  className="col-sm-1">
                  <select
                    value={xPosition[i]}
                    onChange={(e) =>
                      setXPosition((old) => ({ ...old, [i]: e.target.value }))
                    }
                    disabled={!["Plain", "Bars"].includes(serieType)}
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
                <div style={{marginRight:10}}  className="col-sm-1">
                  <select
                    value={yPosition[i]}
                    onChange={(e) =>
                      setYPosition((old) => ({ ...old, [i]: e.target.value }))
                    }
                    disabled={!["Plain", "Bars"].includes(serieType)}
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
            );
          })}
  
      
      <div className="row" style={{ paddingTop: 10 }}>
        <label className="col-sm-3">Position de Legende : </label>
        <select
          value={legendPosition}
          onChange={(e) => {
            setLegendPosition(e.target.value);
          }}
        >
          <option value="bottom">Bottom</option>
          <option value="right">Right</option>
          <option value="left">Left</option>
        </select>
      </div>
      <div className="row">
        <label className="col-sm-3">Afficher Legende :</label>
        <select
          value={showLegend}
          onChange={(e) => {
            setShowLegend(e.target.value);
          }}
        >
          <option value='show'>Show</option>
          <option value='hide'>Hide</option>

        </select>
      </div>
      <div className="row">
        <button type="button" onClick={() => applySettings()}>
          Appliquer
        </button>
      </div>
    </div>
  );
}
