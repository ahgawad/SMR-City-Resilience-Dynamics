//function addContourChart(chartID, source, categories, chartTitle, yAxisTitle, yLabelFormat, xLabelFormat, yTicks, xTicks, legend, markers, columnChart, histSource, histCat, chartTitleTooltip, chartWidth, stackedColumns) {

function addPowerGauge(gaugeID, source, gaugeTitle, gaugeTitleTooltip, chartWidth) {
	(function() {
		//<div id="infrastructures-gauge" class="power-gauge"></div>
		var div= document.createElement('div');
		div.innerHTML= "<div class=\"power-gauge\" id=\""+gaugeID+"\" data-f-g-source=\""+source+"\" style=\"text-align: center;"+((typeof (chartWidth)!=="undefined")?" width: "+chartWidth+";\"":"\"")+"></div>"+"<div style=\"text-align: center;\" data-toggle=\"tooltip\" data-original-title=\""+gaugeTitleTooltip+"\">"+gaugeTitle+"</div>";
		
		var myElem = document.getElementById(gaugeID);
		if (myElem === null) {
			//alert('does not exist!');
			var scripts= document.getElementsByTagName('script');
			var script= scripts[scripts.length-1];
			script.parentNode.insertBefore(div, script);
		} else {
			myElem.parentNode.replaceChild(div, myElem);
		}
	})();

    powerGaugesArray[gaugeID] = new PowerGaugeClass(gaugeID, {
		size: 300/1.6,
		clipWidth: 300/1.6,
		clipHeight: 170/1.6,//300,
		ringWidth: 60/1.6,
		maxValue: 1,
		transitionMs: 4000,
	});
	powerGaugesArray[gaugeID].render();
	/*
	function updateReadings() {
		// just pump in random data here...
		powerGaugesArray[gaugeID].update(Math.random() * 10);
	}
	
	// every few seconds update reading values
	updateReadings();
	setInterval(function() {
		updateReadings();
	}, 5 * 1000);
	*/
}


// Matt Magoffin’s Block 3202712
// http://bl.ocks.org/msqr/raw/3202712/
/*
This code is released under the MIT license.
Copyright (C) 2012 Matt Magoffin
*/

function PowerGaugeClass(container, configuration) {
	var that = {};
	var config = {
		size						: 200,
		clipWidth					: 200,
		clipHeight					: 110,
		ringInset					: 20,
		ringWidth					: 20,
		
		pointerWidth				: 10,
		pointerTailLength			: 5,
		pointerHeadLengthPercent	: 0.81,
		
		minValue					: 0,
		maxValue					: 1,
		
		minAngle					: -90,
		maxAngle					: 90,
		
		transitionMs				: 750,
		
		majorTicks					: 5,
		labelFormat					: d3.format('c'),//d3.format(',%'),
		labelInset					: 15, // how near the lables are to the donut?
		
		arcColorFn					: d3.interpolateHsl(d3.rgb('#ddd'), d3.rgb('#146fb0')) //d3.interpolateHsl(d3.rgb('#2477b3#e8e2ca'), d3.rgb('#3e6c0a'))
	};
	var range = undefined;
	var r = undefined;
	var pointerHeadLength = undefined;
	var value = 0;
	
	var svg = undefined;
	var arc = undefined;
	var scale = undefined;
	var ticks = undefined;
	var tickData = undefined;
	var pointer = undefined;

	var donut = d3.layout.pie();
	
	function deg2rad(deg) {
		return deg * Math.PI / 180;
	}
	
	function newAngle(d) {
		var ratio = scale(d);
		var newAngle = config.minAngle + (ratio * range);
		return newAngle;
	}
	
	function configure(configuration) {
		var prop = undefined;
		for ( prop in configuration ) {
			config[prop] = configuration[prop];
		}
		
		range = config.maxAngle - config.minAngle;
		r = config.size / 2;
		pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);

		// a linear scale that maps domain values to a percent from 0..1
		scale = d3.scale.linear()
			.range([0,1])
			.domain([config.minValue, config.maxValue]);
			
		ticks = [48, 83, 77, 65, 82, 84];//['S','M','A','R','T'];//[0, 0.25, 0.5, 0.75, 1];//S M A R T [83, 77, 65, 82, 84];//scale.ticks(config.majorTicks);
		ticksValue = [0, 0.2, 0.4, 0.6, 0.8, 1]; // added this correponding to ticks letters
		tickData = d3.range(config.majorTicks).map(function() {return 1/config.majorTicks;});
		
		arc = d3.svg.arc()
			.innerRadius(r - config.ringWidth - config.ringInset)
			.outerRadius(r - config.ringInset)
			.startAngle(function(d, i) {
				var ratio = d * i;
				return deg2rad(config.minAngle + (ratio * range));
			})
			.endAngle(function(d, i) {
				var ratio = d * (i+1);
				return deg2rad(config.minAngle + (ratio * range));
			});
	}
	that.configure = configure;
	
	function centerTranslation() {
		return 'translate('+r +','+ r +')';
	}
	
	function isRendered() {
		return (svg !== undefined);
	}
	that.isRendered = isRendered;
	
	function render(newValue) {
		svg = d3.select('#'+container)
			.append('svg:svg')
				.attr('class', 'gauge')
				.attr('width', config.clipWidth)
				.attr('height', config.clipHeight);
		
		var centerTx = centerTranslation();
		
		var arcs = svg.append('g')
				.attr('class', 'arc')
				.attr('transform', centerTx);
		
		arcs.selectAll('path')
				.data(tickData)
			.enter().append('path')
				.attr('fill', function(d, i) {
					//colours=['rgb(255,204,255)','rgb(222,234,246)','rgb(226,239,217)','rgb(255,255,204)'];
					//return colours[i];
					return config.arcColorFn(d * i);
				})
				.attr('d', arc);
		
		var lg = svg.append('g')
				.attr('class', 'label')
				.attr('transform', centerTx);
		lg.selectAll('text')
				.data(ticks)
			.enter().append('text')
				.attr('transform', function(d) {
				    var a = ticks.indexOf(d);
					var d = ticksValue[a];
					var ratio = scale(d);
					var newAngle = config.minAngle + (ratio * range);
					return 'rotate(' +newAngle +') translate(0,' +(config.labelInset - r) +')';
				})
				.text(config.labelFormat);

		var lineData = [ [config.pointerWidth / 2, 0], 
						[0, -pointerHeadLength],
						[-(config.pointerWidth / 2), 0],
						[0, config.pointerTailLength],
						[config.pointerWidth / 2, 0] ];
		var pointerLine = d3.svg.line().interpolate('monotone');
		var pg = svg.append('g').data([lineData])
				.attr('class', 'pointer')
				.attr('transform', centerTx);
				
		pointer = pg.append('path')
			.attr('d', pointerLine/*function(d) { return pointerLine(d) +'Z';}*/ )
			.attr('transform', 'rotate(' +config.minAngle +')');
			
		update(newValue === undefined ? 0 : newValue);
	}
	that.render = render;
	
	function update(newValue, newConfiguration) {
		if ( newConfiguration  !== undefined) {
			configure(newConfiguration);
		}
		var ratio = scale(newValue);
		var newAngle = config.minAngle + (ratio * range);
		pointer.transition()
			.duration(config.transitionMs)
			.ease('elastic')
			.attr('transform', 'rotate(' +newAngle +')');
	}
	that.update = update;

	configure(configuration);
	
	return that;
};