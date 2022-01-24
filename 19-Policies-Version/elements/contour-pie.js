//function addContourChart(chartID, source, categories, chartTitle, yAxisTitle, yLabelFormat, xLabelFormat, yTicks, xTicks, legend, markers, columnChart, histSource, histCat, chartTitleTooltip, chartWidth, stackedColumns) {

function addContourPie(pieID, source, iniData, pieTitle, pieTitleTooltip, pieWidth) {
	(function() {
		var div= document.createElement('div');
		div.innerHTML= "<div class=\"contour-pie\" id=\""+pieID+"\" data-f-p-source=\""+source+"\" "+((typeof (pieWidth)!=="undefined")?"style=\"text-align: center; width: "+pieWidth+"\"":"")+"></div>";//+"<div style=\"text-align: center;\" data-toggle=\"tooltip\" data-original-title=\""+pieTitleTooltip+"\">"+pieTitle+"</div>"
		//<div id="policyS1L1-pie" class="contour-pie"></div>

		var myElem = document.getElementById(pieID);
		if (myElem === null) {
			//alert('does not exist!');
			var scripts= document.getElementsByTagName('script');
			var script= scripts[scripts.length-1];
			script.parentNode.insertBefore(div, script);
		} else {
			myElem.parentNode.replaceChild(div, myElem);
		}
		/*
		var scripts= document.getElementsByTagName('script');
		var script= scripts[scripts.length-1];
		//$(script).parent().html("<div class=\"contour-pie\" id=\""+pieID+"\" data-f-p-source=\""+source+"\" "+((typeof (pieWidth)!=="undefined")?"style=\"text-align: center; width: "+pieWidth+"\"":"")+"></div>");
		$(script).parent('div').html("<div class=\"contour-pie\" id=\""+pieID+"\" data-f-p-source=\""+source+"\" "+((typeof (pieWidth)!=="undefined")?"style=\"text-align: center; width: "+pieWidth+"\"":"")+"></div>");
		*/
	})();

    contourPiesArray[pieID] = new ContourPieClass(pieID);//,iniData);
	//contourPiesArray[pieID].setData(0.6);
	
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


function ContourPieClass(pieID, iniData) {

	var _this = this;

	this.pieID = pieID;
	
	this.data = (typeof (iniData)==="undefined")?[0, 1]:[iniData, 1-iniData];
	
    var formatter = d3.format('%');

    Contour.export('donutTextOneValue', function (data, layer, options) {

        // This visualization is only for single-element gauges, that is,
        // donut (pie) charts with one data series, one value visible, and the remainder dimmed out.
        // So we can assume that there are only two elements in the data series.
        var visibleIndex = 0;//data[0].data[0].y < data[0].data[1].y ? 1 : 0;
        var centerX = options.chart.plotWidth / 2;
        var centerY = options.chart.plotHeight / 2;
		layer.select("text").remove();
        layer.append('text')
            .attr('class', 'center-text')
            .attr('x', centerX)
            .attr('y', centerY)
            .attr('dx', '-.3em')
            .attr('dy', '.3em')
            .text(formatter(data[0].data[visibleIndex].y));
    });

    //var data = [{ x: 'Case A', y: 0.82}, { x: 'Case B', y: 0.18 }];

	this.pieInstance = new Contour({
			el: document.getElementById(this.pieID),
            pie: {
                innerRadius: 25
            },
            tooltip: {
                formatter: function(d) {
                    return d.data.x + ': ' + formatter(d.data.y);
                }
            }
        }).pie(this.data)
		.donutTextOneValue(this.data)
		.render();

		
	this.setData = function(inputData) {
		//this.pieInstance.setData([]);
		//this.pieInstance.donutTextOneValue([]);
		this.pieInstance.setData([inputData, 1-inputData]);
		//this.pieInstance.donutTextOneValue([inputData, 1-inputData]);
		this.pieInstance.render();
	}

}

