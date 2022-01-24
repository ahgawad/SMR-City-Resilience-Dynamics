//addSingleScenarioTable(singleScenarioTableID, source, categories, tableTitle,  tableTitleTooltip, yAxisTitle, xAxisTitle, cellFormat, tableWidth);


function addSingleScenarioTable(singleScenarioTableID, source, categories, tableTitle,  tableTitleTooltip, rowsTitle, columnsTitle, cellFormat, tableWidth) {
	(function() {
		var div = document.createElement('div');
		div.innerHTML= "<div id=\""+singleScenarioTableID+"\" data-toggle=\"tooltip\" data-original-title=\""+tableTitleTooltip+"\" data-f-c-source=\""+source+"\" data-f-c-categories=\""+categories+"\" "+((typeof (tableWidth)!=="undefined")?"style=\"width: "+tableWidth+"\"":"")+"><table id=\"tbl"+singleScenarioTableID+"\" class=\"table table-hover table-striped\"><thead></thead><tbody></tbody></table></div>";
		//div.className = "table-responsive";
		///var table = document.createElement('table');
		///table.id = "tbl"+singleScenarioTableID;
		///table.className = "table table-hover";
		/*var header = table.createTHead();
		var row = header.insertRow(0);
		var cell = row.insertCell(0);
		cell.innerHTML = "";*/
		////div.appendChild(table);

		var myElem = document.getElementById(singleScenarioTableID);
		if (myElem === null) {
			//alert('does not exist!');
			var scripts= document.getElementsByTagName('script');
			var script= scripts[scripts.length-1];
			script.parentNode.insertBefore(div, script);
		} else {
			myElem.parentNode.replaceChild(div, myElem);
		}

	})();

    singleScenarioTablesArray[singleScenarioTableID] = new SingleScenarioTableClass(singleScenarioTableID, categories, source, rowsTitle, columnsTitle, cellFormat);
	
}


function SingleScenarioTableClass(singleScenarioTableID, categories, source, rowsTitle, columnsTitle, cellFormat) {

	var _this = this;

	this.singleScenarioTableID = "tbl"+singleScenarioTableID;
	
    this.categories = categories;
    this.source = source;

	this.rowsTitle = rowsTitle;
	this.columnsTitle = columnsTitle;
	
    this.cellFormat = (typeof (cellFormat)==="undefined")?'.0d':cellFormat;


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
	
	
	this.tableInstance = document.getElementById(_this.singleScenarioTableID);


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

	this.setSource = function(newValue) {
		_this._source = newValue;
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
        this.tableInstance.setData(ds).render();*/
	}

    this.drawTable = function() {
		var ds = _this._source;
		var seriesNames = _this._legends || [];
		var cats = _this._categories;
		
		//_this.tableInstance.deleteTHead();
		//var header = _this.tableInstance.createTHead();
		//var row = header.insertRow();
		
		//var tableHeader =$(_this.tableInstance).find("thead")[0];
		//if ( !tableHeader ) {
		_this.tableInstance.deleteTHead();
		var tableHeader = _this.tableInstance.createTHead();
		//}
		var th = tableHeader.insertRow();
		var cell = th.insertCell();
		cell.innerHTML = "<b>"+_this.rowsTitle+"</b>";

		
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
				var cell = th.insertCell();
				cell.innerHTML = "<b>"+temp_keyName+"</b>";
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
							// for now I show the last value, other choices could be max, min, first ... etc. However til now it is only one value to be shown instead of the series coming from Vensim. If a series needed to be shown, then we need to find a way to present these series taking into consideration that tables are showing different scenarios as well!
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
							// I need to find a way to present the series coming from Vensim taking into consideration that tables are showing different scenarios as well!
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
		
		//_this.tableInstance.render();

    }

	function singleSeriesSetDataStyle(ds) {
		_this.dataset = ds;
		//_this.tableInstance.setData([]);
		//_this.tableInstance.setData(ds).render();
		
		//tbl  = _this.tableInstance;
		//tbl.style.width  = '100px';
		//tbl.style.border = '1px solid black';
		
		var tableBody = $(_this.tableInstance).find("tbody")[0];
		if ( tableBody.rows.length > ds[0].data.length ) tableBody.innerHTML = "";
		var tr = tableBody.insertRow();
		
		for(var i = ds[0].data.length-1; i < ds[0].data.length; i++){
			var td = tr.insertCell();
			td.appendChild(document.createTextNode(ds[0].data[i].x));
			td.setAttribute("style", "font-weight:bold;text-align:center;");
			for(var j = 0; j < ds.length; j++){
				var td = tr.insertCell();
				td.appendChild(document.createTextNode(formatter(ds[j].data[i].y,cellFormat)));
				//td.style.border = '1px solid black';
				//td.setAttribute('', '');
			}
		}
	}

	function multiSeriesSetDataStyle(ds) {
		_this.dataset = ds;
		//var currentVisNum = _this.tableInstance._visualizations.length;
		//_this.tableInstance._visualizations = [];
		for (var i=0; i<_this.tableInstance._visualizations.length; i++) {
			if (_this.tableInstance.select(i).type=='column') {
				_this.tableInstance.select(i).setData([]).render();
				//_this.tableInstance._visualizations.splice(i, 1);
			}
		}
		
		for (var i = 0, tot = ds.length; i < tot; i++) { 
			if ((_this.tableInstance.select(i).type == "tooltip") || (typeof (_this.tableInstance.select(i)) === "undefined")) {
				_this.addColumnToTable();
			}
			_this.tableInstance.select(i).setData(ds[i]).render();
		}
		
		// fix columns' width
		var d = 10;
		var N = _.filter(_this.tableInstance._visualizations, function(el) {return el.type=='column';}).length;
		var colWidth = Math.round(_this.tableInstance.rangeBand*d/(N*(d+1)));
		var colOffset = 0;
		var n = 0;

		for (var i=0; i<_this.tableInstance._visualizations.length; i++) {
			if (_this.tableInstance.select(i).type=='column') {
				colOffset = Math.round(n*colWidth*(d+1)/d);
				_this.tableInstance.select(i).options.column.columnWidth = colWidth;
				_this.tableInstance.select(i).options.column.offset = colOffset;
				n++;
			}
		}
		//_this.tableInstance.render();
	}

}