// This version of contour-charts.js is adapted to work with InsightMaker's simulation enigne.

function addContourChart(chartID, source, categories, chartTitle, yAxisTitle, yLabelFormat, xLabelFormat, yTicks, xTicks, legend, markers, columnChart, histSource, histCat, chartTitleTooltip, chartWidth, stackedColumns, xAxisTitle) {
    histSource = (typeof (histSource) === "undefined")?[]:histSource;
    histCat = (typeof (histCat) === "undefined")?[]:histCat;
    chartTitleTooltip = (typeof (chartTitleTooltip) === "undefined") ? "" : chartTitleTooltip;
	stackedColumns = (typeof (stackedColumns) === "undefined") ? false : stackedColumns;
	
	(function() {
		var div= document.createElement('div');
		div.innerHTML= "<div class=\"chart-title\" data-toggle=\"tooltip\" data-original-title=\""+chartTitleTooltip+"\">"+chartTitle+"</div>"+"<div class=\"chart-container\" id=\""+chartID+"\" data-f-c-source=\""+source+"\" data-f-c-categories=\""+categories+"\" "+((typeof (chartWidth)!=="undefined")?"style=\"width: "+chartWidth+"\"":"")+"></div>";

		var divLGND = document.createElement('div');
		divLGND.innerHTML = "<div id=\"LGND_"+chartID+"\"></div>";

		var myElem = document.getElementById(chartID);
		if (myElem === null) {
			//alert('does not exist!');
			var scripts= document.getElementsByTagName('script');
			var script= scripts[scripts.length-1];
			script.parentNode.insertBefore(div, script);
		} else {
			myElem.parentNode.replaceChild(div, myElem);
		}
		myElem = document.getElementById("LGND_"+chartID);
		if (myElem === null) {
			//alert('does not exist!');
			var scripts= document.getElementsByTagName('script');
			var script= scripts[scripts.length-1];
			script.parentNode.insertBefore(divLGND, script);
		} else {
			myElem.parentNode.replaceChild(divLGND, myElem);
		}
		
	})();

    contoursArray[chartID] = new ContourChartClass(chartID, categories, source, legend, yAxisTitle, chartTitle, markers, xLabelFormat, yLabelFormat, xTicks, yTicks, xAxisTitle);
    if ( columnChart ) {
		contoursArray[chartID].setColumn();
		if (stackedColumns) contoursArray[chartID].setStackedColumn();
        contoursArray[chartID].addColumnToChart();
    } else {
        contoursArray[chartID].addLineToChart();
    }

    /*
    runsSourceArray[chartID][runsName] = source;
    runsCategoriesArray[chartID] = categories;
    */
    
    runsSourceArray[chartID] = {};
    //runsCategoriesArray[chartID] = [0];

    // Historical data initialisation if existed
    if ( histSource.length > 0 ) {
        runsSourceArray[chartID]["Historical-Data"] = histSource;
        runsCategoriesArray[chartID] = histCat;
    }

    // Initialise Scenario-1 with (0, 0) It will be rewritten under all circumstances!
    runsSourceArray[chartID]["Scenario-1"] = [0];
    runsCategoriesArray[chartID] = [0];
    
    contoursArray[chartID].setSource( runsSourceArray[chartID] );
    contoursArray[chartID].setCategories(runsCategoriesArray[chartID]);

    contoursArray[chartID].renderChart();
}
    
/* contour_chart class instead of Polymer web element */
/* attributes="categories source legend yAxisTitle chartTitle markers xLabelFormat yLabelFormat xTicks yTicks xAxisTitle" */
function ContourChartClass(chartID, categories, source, legend, yAxisTitle, chartTitle, markers, xLabelFormat, yLabelFormat, xTicks, yTicks, xAxisTitle) {

	var _this = this;

	this.chartID = chartID;
    this.categories = categories;
    this.source = source;
    this.legend = legend;
	
	this.chartLGNDDivID = 'LGND_'+chartID;


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

	/*
    // make sure that if we have categories, they are inside the
    // x,y pairs for the data.
    var mergeXY = function (ds, cats) {
        if (!cats) return ds;
        if (!_.isArray(ds) || !ds.length) return ds;

        var composeDatum = function (d, index) {
            return {
                // replace the double quotes if they exist in the categories, double quotes will be a minimum requirements for Vensim subscripts if they are numerical!
                x: d.x != null ? d.x : ((typeof (cats[index]) !== "undefined") && isNaN(cats[index])) ? (cats[index].replace(/"/g, "")) : (cats[index]),
                y: d.y != null ? d.y : d
            }};

        if (!_.isArray(ds[0].data) && _.isObject(ds[0].data) && isNaN(cats[0])) {
			// changes needed when cat is "Categorical/Ordinal" -- like: not time
			var temp_ds = [];
            for (var i = 0, tot = ds.length; i < tot; i++) { 
                for (var key in ds[i].data) {
					// for now I show the last value, other choices could be max, min, first ... etc. However till now it is only one value to be shown instead of the series coming from Vensim. If a series needed to be shown, then we need to find a way to present these series taking into consideration that charts are showing different scenarios as well!
					// I use _.indexOf(cats, key) to reorder the values, because the values coming from Vensim is not the same order as cats
                    temp_ds[_.indexOf(cats, key)] = _.last(ds[i]["data"][key]);
                }
                ds[i].data = _.map(temp_ds, composeDatum);
            }
        } else if (!_.isArray(ds[0].data) && _.isObject(ds[0].data) && !isNaN(cats[0])) {
			// changes needed when cat is "Interval" -- like: time
			var temp_ds = [];
            for (var i = 0, tot = ds.length; i < tot; i++) { 
                for (var key in ds[i].data) {
                    // temp_ds[_.indexOf(cats, key)] = ds[i]["data"][key];
                    // for now I loop over all of them and take the last!!
					// I need to find a way to present the series coming from Vensim taking into consideration that charts are showing different scenarios as well!
                    temp_ds = ds[i]["data"][key];
                }
                ds[i].data = _.map(temp_ds, composeDatum);
            }
        } else if (_.isArray(ds[0].data)) {
			// The original code, no changes needed
            _.each(ds, function (series) {
                series.data = _.map(series.data, composeDatum);
            });
        } else {
            ds = _.map(ds, composeDatum);
        }

        return ds;
    }
	*/

    var safeParse = function (value, defaultValue) {
        var val = +value;
        return val === val ? val : defaultValue;
    }

	/*$( document.getElementById(_this.chartID) ).before( "<div class=\"chart-title\" data-toggle=\"tooltip\" data-original-title="+this.chartTitleTooltip+">"+this.chartTitle+"</div>" );*/
	//var thisChartWidth = document.getElementById(_this.chartID).offsetWidth;
	this.contourInstance = new Contour({
		el: document.getElementById(_this.chartID),
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
			legend: {
				el: document.getElementById(_this.chartLGNDDivID),
				direction: 'horizontal',
				hAlign: 'right',
				vAlign: 'top',
				formatter: function (d) { 
					var name = _.result(_.find(runsNamesArray, {'name': d.name}), 'comment');
                    return name;
					}
				},
			tooltip: {
				formatter: function (d, name) {
					//return d.x + '<br>' + formatter(d.y, _this.yLabelFormat || '.2s');
                    var name = _.result(_.find(runsNamesArray, {'name': d.series}), 'comment');

                    return name + '<br>' + d.x + '<br>' + formatter(d.y, _this.yLabelFormat || '.2s');
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
        
		if (!_.isArray(ds) && _.isObject(ds)) {
			ds = _.map(ds, function (data, name) {
				return {
					name: name,
					data: data
				};
			});
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
		
		// end mergeXY

        //try {
			//_this.contourInstance.update();
		_this.contourInstance.render();
        //}
        //catch(err) {
        //    console.log(err);
        //}
		var j=1;
		var tot = (ds[ds.length-1].name == "Historical-Data") ? ds.length-1 : ds.length;
        var colBodyWhiteShadRatio = 0.3;

		if (_this.isColumn && true) {
			for (var i = 0; i<tot; i++) {
				var colour = _.result(_.find(runsNamesArray, {'name': ds[i].name}), 'color');
                var lShadedColour = shadeBlend(colBodyWhiteShadRatio,colour);
                //$('#elem').attr('style', 'background-color: '+colour+' !important');

				$('#'+_this.chartID).find('.s-'+j+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);
				$('#'+_this.chartLGNDDivID).find('.s-'+j+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);
				j++;
			}
		} else {
			for (var i = 0; i<tot; i++) {
				var colour = _.result(_.find(runsNamesArray, {'name': ds[i].name}), 'color');
				$('#'+_this.chartID).find('.'+ds[i].name+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);
				$('#'+_this.chartLGNDDivID).find('.'+ds[i].name+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);
			}
		}
    }

	function singleSeriesSetDataStyle(ds) {
		if ( ds[0].name == "Historical-Data" ) {
			ds.push(ds.shift());
		}
		_this.dataset = ds;
		//_this.contourInstance.setData([]).render();
		_this.contourInstance.setData([]);
		//_this.contourInstance.select(0).setData([]).render();
		_this.contourInstance.setData(ds).render();
		//_this.contourInstance.setData(ds);
		//_this.contourInstance.select(0).setData(ds).render();
		/*
		for (var i=0; i<_this.contourInstance._visualizations.length; i++) {
			if (_this.contourInstance.select(i).type!='tooltip') {
				_this.contourInstance.select(i).setData([]).render();
			}
		}

		for (var i=0; i<_this.contourInstance._visualizations.length; i++) {
			if (_this.contourInstance.select(i).type!='tooltip') {
				_this.contourInstance.select(i).setData(ds).render();
			}
		}
		*/
		// add colours to series
		d3.select(document.getElementById(_this.chartID)).selectAll('.Historical-Data').style("color", "black");
		d3.select(document.getElementById(_this.chartID)).selectAll('.Historical-Data').style("stroke", "black");
		d3.select(document.getElementById(_this.chartID)).selectAll('.Historical-Data .line').style("stroke-dasharray", "1,5");
		d3.select(document.getElementById(_this.chartID)).selectAll('.Historical-Data').style("fill", "black");
		d3.select(document.getElementById(_this.chartID)).selectAll('.Historical-Data').style("stroke-width", "5px");
		
		var j=1;
		var tot = (ds[ds.length-1].name == "Historical-Data") ? ds.length-1 : ds.length;
        var colBodyWhiteShadRatio = 0.3;

		if (_this.isColumn && true) {
			for (var i = 0; i<tot; i++) {
				var colour = _.result(_.find(runsNamesArray, {'name': ds[i].name}), 'color');
                var lShadedColour = shadeBlend(colBodyWhiteShadRatio,colour);
                //var dShadedColour = shadeBlend(-0.5,colour);

				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j).style("color", colour);
				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j).style("stroke", colour);
				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j).style("fill", lShadedColour);

				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j+'.line').style("stroke-width", "2px");
				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j+'.line').style("fill", "none");
				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j+' .line').style("stroke-width", "2px");
				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j+' .line').style("fill", "none");

				//d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j+'.contour-legend-key').style("background-color", colour);
				//d3.select(document.getElementById(_this.chartLGNDDivID)).selectAll('.s-'+j+'.contour-legend-key').style("background-color", colour);
				//$("#country.save")
				$('#'+_this.chartID).find('.s-'+j+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);
				$('#'+_this.chartLGNDDivID).find('.s-'+j+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);
				
				
				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j+'.dot').style("stroke-dasharray", "none");
				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j+' .dot').style("stroke-dasharray", "none");
				j++;
			}
		} else {
			for (var i = 0; i<tot; i++) {
				var colour = _.result(_.find(runsNamesArray, {'name': ds[i].name}), 'color');
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name).style("color", colour);
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name).style("stroke", colour);
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name).style("fill", colour);

				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name+'.line').style("stroke-width", "2px");
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name+'.line').style("fill", "none");
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name+' .line').style("stroke-width", "2px");
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name+' .line').style("fill", "none");
				
				//d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name+'.contour-legend-key').style("background-color", colour);
				//d3.select(document.getElementById(_this.chartLGNDDivID)).selectAll('.'+ds[i].name+'.contour-legend-key').style("background-color", colour);
				
				$('#'+_this.chartID).find('.'+ds[i].name+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);
				$('#'+_this.chartLGNDDivID).find('.'+ds[i].name+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);

				
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name+'.dot').style("stroke-dasharray", "none");
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name+' .dot').style("stroke-dasharray", "none");
			}
		}


		/*
		if (_this.isColumn) {
			for (var i = 0; i<tot; i++) {
				var colour = _.result(_.find(runsNamesArray, {'name': ds[i].name}), 'color');
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name+' .column').style("color", colour);
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name+' .column').style("stroke", colour);
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name+' .column').style("fill", colour);
			}
		} else {
			for (var i = 0; i<tot; i++) {
				var colour = _.result(_.find(runsNamesArray, {'name': ds[i].name}), 'color');
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name+' .line').style("color", colour);
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name+' .line').style("stroke", colour);
				//d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i].name+' .line').style("fill", 'none');
			}
		}
		*/
		
	}

	function multiSeriesSetDataStyle(ds) {
		if ( ds[0][0].name == "Historical-Data" ) {
			ds.push(ds.shift());
		}
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
		
		// add colours to series
		d3.select(document.getElementById(_this.chartID)).selectAll('.Historical-Data').style("color", "black");
		d3.select(document.getElementById(_this.chartID)).selectAll('.Historical-Data').style("stroke", "black");
		d3.select(document.getElementById(_this.chartID)).selectAll('.Historical-Data .line').style("stroke-dasharray", "1,5");
		d3.select(document.getElementById(_this.chartID)).selectAll('.Historical-Data').style("fill", "black");
		d3.select(document.getElementById(_this.chartID)).selectAll('.Historical-Data').style("stroke-width", "5px");
		
		// I check the first element name in each row since they are the same for same row
		
		var j=1;
		var tot = (ds[ds.length-1][0].name == "Historical-Data") ? ds.length-1 : ds.length;
        var colBodyWhiteShadRatio = 0.2;

		if (_this.isColumn && true) {
			for (var i = 0; i<tot; i++) {
				var colour = _.result(_.find(runsNamesArray, {'name': ds[i][0].name}), 'color');
                var lShadedColour = shadeBlend(colBodyWhiteShadRatio,colour);
                //var dShadedColour = shadeBlend(-0.5,colour);

				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j).style("color", colour);
				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j).style("stroke", colour);
				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j).style("fill", lShadedColour);

				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j+'.line').style("stroke-width", "2px");
				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j+'.line').style("fill", "none");
				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j+' .line').style("stroke-width", "2px");
				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j+' .line').style("fill", "none");

				//d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j+'.contour-legend-key').style("background-color", colour);
				//d3.select(document.getElementById(_this.chartLGNDDivID)).selectAll('.s-'+j+'.contour-legend-key').style("background-color", colour);
				$('#'+_this.chartID).find('.s-'+j+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);
				$('#'+_this.chartLGNDDivID).find('.s-'+j+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);
				
				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j+'.dot').style("stroke-dasharray", "none");
				d3.select(document.getElementById(_this.chartID)).selectAll('.s-'+j+' .dot').style("stroke-dasharray", "none");
				j++;
			}
		} else {
			for (var i = 0; i<tot; i++) {
				var colour = _.result(_.find(runsNamesArray, {'name': ds[i][0].name}), 'color');
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name).style("color", colour);
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name).style("stroke", colour);
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name).style("fill", colour);

				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name+'.line').style("stroke-width", "2px");
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name+'.line').style("fill", "none");
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name+' .line').style("stroke-width", "2px");
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name+' .line').style("fill", "none");
				
				//d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name+'.contour-legend-key').style("background-color", colour);
				//d3.select(document.getElementById(_this.chartLGNDDivID)).selectAll('.'+ds[i][0].name+'.contour-legend-key').style("background-color", colour);
				$('#'+_this.chartID).find('.'+ds[i][0].name+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);
				$('#'+_this.chartLGNDDivID).find('.'+ds[i][0].name+'.contour-legend-key').attr('style', 'background-color: '+colour+' !important');//.css("background-color", colour);
				
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name+'.dot').style("stroke-dasharray", "none");
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name+' .dot').style("stroke-dasharray", "none");
			}
		}
		/*
		if (_this.isColumn) {
			for (var i = 0; i<tot; i++) {
				var colour = _.result(_.find(runsNamesArray, {'name': ds[i][0].name}), 'color');
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name+' .column').style("color", colour);
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name+' .column').style("stroke", colour);
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name+' .column').style("fill", colour);
			}
		} else {
			for (var i = 0; i<tot; i++) {
				var colour = _.result(_.find(runsNamesArray, {'name': ds[i][0].name}), 'color');
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name+' .line').style("color", colour);
				d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name+' .line').style("stroke", colour);
				//d3.select(document.getElementById(_this.chartID)).selectAll('.'+ds[i][0].name+' .line').style("fill", 'none');
			}
		}
		*/

		
		//_this.contourInstance.update();
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
	
	/*function rainbow(numOfSteps, step) {
		// This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
		// Adam Cole, 2011-Sept-14
		// HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
		var r, g, b;
		var h = step / numOfSteps;
		var i = ~~(h * 6);
		var f = h * 6 - i;
		var q = 1 - f;
		switch(i % 6){
			case 0: r = 1, g = f, b = 0; break;
			case 1: r = q, g = 1, b = 0; break;
			case 2: r = 0, g = 1, b = f; break;
			case 3: r = 0, g = q, b = 1; break;
			case 4: r = f, g = 0, b = 1; break;
			case 5: r = 1, g = 0, b = q; break;
		}
		var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
		return (c);
	}*/

    function shadeBlend(p,c0,c1) {
        //http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
        var n=p<0?p*-1:p,u=Math.round,w=parseInt;
        /*if(c0.length>7){
            var f=c0.split(","),t=(c1?c1:p<0?"rgb(0,0,0)":"rgb(255,255,255)").split(","),R=w(f[0].slice(4)),G=w(f[1]),B=w(f[2]);
            return "rgb("+(u((w(t[0].slice(4))-R)*n)+R)+","+(u((w(t[1])-G)*n)+G)+","+(u((w(t[2])-B)*n)+B)+")"
        }else{*/
            var f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
            return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1)
        /*}*/
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