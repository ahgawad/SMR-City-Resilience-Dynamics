//addSingleScenarioChart(singleScenarioChartID, source, categories, chartTitle, yAxisTitle, yLabelFormat, xLabelFormat, yTicks, xTicks, legend, markers, columnChart, histSource, histCat, chartTitleTooltip, chartWidth, stackedColumns);


function addSingleScenarioChart(singleScenarioChartID, source, categories, chartTitle, yAxisTitle, yLabelFormat, xLabelFormat, yTicks, xTicks, legend, markers, columnChart, histSource, histCat, chartTitleTooltip, chartWidth, stackedColumns, xAxisTitle) {
	(function() {
		var div = document.createElement('div');
		var divLGND = document.createElement('div');
		div.innerHTML = "<div class=\"chart-title\" data-toggle=\"tooltip\" data-original-title=\""+chartTitleTooltip+"\">"+chartTitle+"</div>";
		div.innerHTML += "<div class=\"chart-container\" id=\""+singleScenarioChartID+"\" data-f-c-source=\""+source+"\" data-f-c-categories=\""+categories+"\" "+((typeof (chartWidth)!=="undefined")?"style=\"width: "+chartWidth+"\"":"")+"></div>";
		divLGND.innerHTML = "<div id=\"LGND_"+singleScenarioChartID+"\"></div>";

		var myElem = document.getElementById(singleScenarioChartID);
		if (myElem === null) {
			//alert('does not exist!');
			var scripts= document.getElementsByTagName('script');
			var script= scripts[scripts.length-1];
			script.parentNode.insertBefore(div, script);
		} else {
			myElem.parentNode.replaceChild(div, myElem);
		}
		myElem = document.getElementById("LGND_"+singleScenarioChartID);
		if (myElem === null) {
			//alert('does not exist!');
			var scripts= document.getElementsByTagName('script');
			var script= scripts[scripts.length-1];
			script.parentNode.insertBefore(divLGND, script);
		} else {
			myElem.parentNode.replaceChild(divLGND, myElem);
		}

	})();

    singleScenarioChartsArray[singleScenarioChartID] = new SingleScenarioChartClass(singleScenarioChartID, categories, source, legend, yAxisTitle, chartTitle, markers, xLabelFormat, yLabelFormat, xTicks, yTicks, xAxisTitle);
    if ( columnChart ) {
		singleScenarioChartsArray[singleScenarioChartID].setColumn();
		if (stackedColumns) singleScenarioChartsArray[singleScenarioChartID].setStackedColumn();
        singleScenarioChartsArray[singleScenarioChartID].addColumnToChart();
    } else {
        singleScenarioChartsArray[singleScenarioChartID].addLineToChart();
    }
	
}


function SingleScenarioChartClass(singleScenarioChartID, categories, source, legend, yAxisTitle, chartTitle, markers, xLabelFormat, yLabelFormat, xTicks, yTicks, xAxisTitle) {

	var _this = this;

	this.singleScenarioChartID = singleScenarioChartID;
	
	this.singleScenarioChartLegendDivID = 'LGND_'+singleScenarioChartID;

    this.categories = categories;
    this.source = source;
    this.legend = legend;

    this.yAxisTitle = yAxisTitle;
	this.xAxisTitle = xAxisTitle;
    this.chartTitle = chartTitle;

    this.xLabelFormat = (typeof (xLabelFormat)==="undefined")?'.0d':xLabelFormat;
    this.yLabelFormat = yLabelFormat;

    this.markers = (typeof (markers)==="undefined")?false:markers;

    this.xTicks = xTicks;
    this.yTicks = yTicks;
	
	this.isColumn = false;
	this.isStacked = false;
	
    var formatter = function (v, fmt) {
        var format = fmt || 's';
        if (v < 10 && /s$/.test(format)) {
            format = '.1f';
        }

        return d3.format(format)(v).replace('G', 'B');
    };

    var safeParse = function (value, defaultValue) {
        var val = +value;
        return val === val ? val : defaultValue;
    }
	
	
	this.contourInstance = new Contour({
		el: document.getElementById(_this.singleScenarioChartID),
			chart: {
                //defaultWidth: 800,
                //width: thisChartWidth,
				padding: {
					left: 50
				}
			},
			xAxis: {
				title: this.xAxisTitle,
				ticks: safeParse(this.xTicks, undefined),
				labels: {
					format: _this._xLabelFormat || '.0d'
				}
			},
			yAxis: {
				title: this.yAxisTitle,
				ticks: safeParse(this.yTicks, undefined),
				nicing: false,
				labels: {
					formatter: function (v) {
						return formatter(v, _this.yLabelFormat || _this.contourInstance.options.yAxis.labels.format)
					}
				}
			},
			legend:  { 
				el: document.getElementById(_this.singleScenarioChartLegendDivID),
				direction: 'horizontal',
				hAlign: 'right',
				vAlign: 'top'
			},
			tooltip: {
				formatter: function (d, name) {
					//return d.x + '<br>' + formatter(d.y, _this.yLabelFormat || '.2s');
                    //var name = _.result(_.find(runsNamesArray, {'name': d.series}), 'comment');

                    return d.series + '<br>' + d.x + '<br>' + formatter(d.y, _this.yLabelFormat || '.2s');
                    //return d.series + ': ' + d.x + ', ' d.y;
				}
			}
		})
		.cartesian().legend();


    this.setCategories = function(newValue) {
		if (_.isArray(newValue)) {
			if (_.isArray(newValue[0])) {
				this._categories = newValue[0];
			} else {
				this._categories = newValue;
			}
		} else {
			// ignore it for now
        }
    }

    this.setLegend = function(newValue) {
		this._legends = newValue;
		this.contourInstance.legend(this._legends);
        /*Till we know how to update legend, this part is useless!*/
	}

	this.setSource = function(newValue) {
		this._source = newValue;
		/*var ds = newValue;
		var seriesNames = this._legends || [];
		var cats = this._categories;

		if (!_.isArray(ds) && _.isObject(ds)) {
			ds = _.map(ds, function (data, name) {
				return {
					name: name,
					data: data
				};
			});
		}

        ds = mergeXY(ds, cats);
        this.dataset = ds;
        this.contourInstance.setData(ds).render();*/
	}

    this.renderChart = function() {
		var ds = this._source;
		var seriesNames = this._legends || [];
		var cats = this._categories;
        /* case 1 one dimension series
		[0.4]
		_.isArray(c) true
		_.isObject(c) true

		_.isArray(c1[0]) false
		_.isObject(c1[0]) false
		
		
		*/
		//if (!_.isArray(ds) && _.isObject(ds)) {
		ds = _.map(ds, function (data, name) {
			return {
				name: selectedScenario,
				data: data
			};
		});
		//}
		
		/* case 2 multi-dimensional series
		[{"L":0,"P":0,"I":0,"C":0}]
		_.isArray(c2) true
		_.isObject(c2) true
		
		_.isArray(c2[0]) false
		_.isObject(c2[0]) true
		*/
		if (_.isObject(ds[0].data)) {
			// we have multi series and we need to extract only the selectedScenario
			/*
			JSON.stringify(_.find(ds, {'name': selectedScenario}).data)	"[{"L":0,"P":0,"I":0,"C":0},{"L":32187.616194991686,"P":0,"I":0,"C":0},{"L":32283.188493216934,"P":0,"I":0,"C":0},{"L":22120.08238962991,"P":0,"I":0,"C":0},{"L":15252.322172723798,"P":0,"I":0,"C":0}]"
			*/
			//ds = _.find(ds, {'name': selectedScenario}).data; //ds[0].data[0];
			
			// [{ 'name': newKeyName, 'data': _.map(_.find(ds, {'name': selectedScenario}).data, newKeyName )}]
			
			
			var temp_keyNames = [];
			//var newds = _.find(ds, {'name': selectedScenario}).data;
			
			_.forEach(ds[0].data, function(value, temp_keyName) {
				temp_keyNames.push(temp_keyName);
			});
			
			var temp_ds = [];
			for (var j=0; j<temp_keyNames.length;j++) {
				var newKeyName = temp_keyNames[j];
				var temp_data=[];
				for (var i=0; i<ds.length;i++) {
					//ds[60].data.L
					temp_data.push(ds[i].data[newKeyName]);
				}
				temp_ds.push({ 'name': newKeyName, 'data': temp_data });
			}
			
			/*
			JSON.stringify(temp_ds)
			"[{"name":"L","data":[0,32187.616194991686,32283.188493216934,22120.08238962991,15252.322172723798]},{"name":"P","data":[0,0,0,0,0]},{"name":"I","data":[0,0,0,0,0]},{"name":"C","data":[0,0,0,0,0]}]"
			*/
			ds = temp_ds;

		}
		
        
        //ds = mergeXY(ds, cats);
		// begin mergeXY
		
        if (cats) {
			if (_.isArray(ds) && ds.length) {
				var composeDatum = function (d, index) {
					return {
						// replace the double quotes if they exist in the categories, double quotes will be a minimum requirements for Vensim subscripts if they are numerical!
						x: d.x != null ? d.x : ((typeof (cats[index]) !== "undefined") && isNaN(cats[index])) ? (cats[index].replace(/"/g, "")) : (cats[index]),
						//x: d.x != null ? d.x : cats[index],
						y: d.y != null ? d.y : d
					}};
				
				if (!_.isArray(ds[0].data) && _.isObject(ds[0].data) && isNaN(cats[0])) {
					// changes needed when cat is "Categorical/Ordinal" -- like: not time
					for (var i = 0, tot = ds.length; i < tot; i++) { 
						var temp_ds = [];
						for (var key in ds[i].data) {
							// for now I show the last value, other choices could be max, min, first ... etc. However til now it is only one value to be shown instead of the series coming from Vensim. If a series needed to be shown, then we need to find a way to present these series taking into consideration that charts are showing different scenarios as well!
							// I use _.indexOf(cats, key) to reorder the values, because the values coming from Vensim is not the same order as cats
							temp_ds[_.indexOf(cats, key)] = _.last(ds[i]["data"][key]);
						}
						
						// in case of column, pad with zeros --think this is a bug!
						if (_this.isColumn) {
							temp_ds = zerosPadding(temp_ds, cats);
						}
						
						ds[i].data = _.map(temp_ds, composeDatum);
					}
					/*case 1*/
					singleSeriesSetDataStyle(ds);
				} else if (!_.isArray(ds[0].data) && _.isObject(ds[0].data) && !isNaN(cats[0])) {
					// changes needed when cat is "Interval" -- like: time
					for (var i = 0, tot = ds.length; i < tot; i++) { 
						var temp_ds = [];
						for (var key in ds[i].data) {
							// temp_ds[_.indexOf(cats, key)] = ds[i]["data"][key];
							// for now I loop over all of them and .....
							// I need to find a way to present the series coming from Vensim taking into consideration that charts are showing different scenarios as well!
							temp_ds.push({"name": ds[i].name,"data": _.map(ds[i]["data"][key], composeDatum)});
						}
						ds[i] = temp_ds;
					}
					multiSeriesSetDataStyle(ds);
				} else if (_.isArray(ds[0].data)) {
					// The original code, no changes needed
					_.each(ds, function (series) {
						// in case of column, pad with zeros --think this is a bug!
						if (_this.isColumn) {
							series.data = zerosPadding(series.data, cats);
						}

						series.data = _.map(series.data, composeDatum);
					});
					/*case 2*/
					singleSeriesSetDataStyle(ds);
				} else {
					ds = _.map(ds, composeDatum);
					/*case 3*/
					singleSeriesSetDataStyle(ds);
				}
			} else {
				/*case 4*/
				singleSeriesSetDataStyle(ds);
			
			}
		} else {
			/*case 5*/
			singleSeriesSetDataStyle(ds);
		}
		
		_this.contourInstance.render();
		
		
		var j=1;
		var tot = (ds[ds.length-1].name == "Historical-Data") ? ds.length-1 : ds.length;
        var colBodyWhiteShadRatio = 0.3;

		if (_this.isColumn && true) {
			for (var i = 0; i<tot; i++) {
				var colour = $('#'+_this.singleScenarioChartLegendDivID).find('.s-'+j+'.contour-legend-key').css('background-color');
                var lShadedColour = shadeBlend(colBodyWhiteShadRatio,colour);
                //$('#elem').attr('style', 'background-color: '+colour+' !important');

				$('#'+_this.singleScenarioChartID).find('.s-'+j+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);
				$('#'+_this.singleScenarioChartLegendDivID).find('.s-'+j+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);
				j++;
			}
		} else {
			for (var i = 0; i<tot; i++) {
				var colour = $('#'+_this.singleScenarioChartLegendDivID).find('.'+ds[i].name+'.contour-legend-key').css("background-color");
				$('#'+_this.singleScenarioChartID).find('.'+ds[i].name+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);
				$('#'+_this.singleScenarioChartLegendDivID).find('.'+ds[i].name+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);
			}
		}

    }

	function singleSeriesSetDataStyle(ds) {
		_this.dataset = ds;
		_this.contourInstance.setData([]);
		_this.contourInstance.setData(ds).render();
	}

	function multiSeriesSetDataStyle(ds) {
		_this.dataset = ds;
		//var currentVisNum = _this.contourInstance._visualizations.length;
		//_this.contourInstance._visualizations = [];
		for (var i=0; i<_this.contourInstance._visualizations.length; i++) {
			if (_this.contourInstance.select(i).type=='column') {
				_this.contourInstance.select(i).setData([]).render();
				//_this.contourInstance._visualizations.splice(i, 1);
			}
		}
		
		for (var i = 0, tot = ds.length; i < tot; i++) { 
			if ((_this.contourInstance.select(i).type == "tooltip") || (typeof (_this.contourInstance.select(i)) === "undefined")) {
				_this.addColumnToChart();
			}
			_this.contourInstance.select(i).setData(ds[i]).render();
		}
		
		// fix columns' width
		var d = 10;
		var N = _.filter(_this.contourInstance._visualizations, function(el) {return el.type=='column';}).length;
		var colWidth = Math.round(_this.contourInstance.rangeBand*d/(N*(d+1)));
		var colOffset = 0;
		var n = 0;

		for (var i=0; i<_this.contourInstance._visualizations.length; i++) {
			if (_this.contourInstance.select(i).type=='column') {
				colOffset = Math.round(n*colWidth*(d+1)/d);
				_this.contourInstance.select(i).options.column.columnWidth = colWidth;
				_this.contourInstance.select(i).options.column.offset = colOffset;
				n++;
			}
		}
		//_this.contourInstance.render();
	}

    this.addLineToChart = function() {
		this.contourInstance
			.line([], {
				marker: {
					enable: this.markers !== 'false'
				}
			});
		moveToolipTop();
	}

	this.addColumnToChart = function() {
		this.contourInstance
			.column([], {
				stacked: this.isStacked
			});
		moveToolipTop();
	}


	this.setColumn = function() {
		this.isColumn = true;
	}

	this.setStackedColumn = function() {
		this.isStacked = true;
	}

	function moveToolipTop() {
		// find tooltip layer
		var i = _.findIndex(_this.contourInstance._visualizations, function(el) { return el.type=='tooltip';});
		if (i > -1) {
			// if tooltip exits
			// find last index
			var x = _this.contourInstance._visualizations.length-1;

			// move tooltip layer to the top
			_this.contourInstance._visualizations[x] = _this.contourInstance._visualizations.splice(i, 1, _this.contourInstance._visualizations[x])[0];
		} else { 
			// create tooltip otherwise
			_this.contourInstance.tooltip();
		}
	}
	

    function shadeBlend(p,c0,c1) {
        //http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
        var n=p<0?p*-1:p,u=Math.round,w=parseInt;
		var f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
		return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1)
    }
    
	function zerosPadding(ds, cats) {
		var diff = cats.length - ds.length;
		if ( diff > 0 ) {
			var zerosPadding = Array.apply(null, new Array(diff)).map(Number.prototype.valueOf,0);
			ds = ds.concat(zerosPadding);
		}
		return ds;
	}
}