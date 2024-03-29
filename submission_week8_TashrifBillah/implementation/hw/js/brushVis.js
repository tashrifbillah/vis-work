/* * * * * * * * * * * * * *
*     class BrushVis       *
* * * * * * * * * * * * * */

BrushVis = function(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;

    // call method initVis
    this.initVis();
};

// init brushVis
BrushVis.prototype.initVis = function() {
    let vis = this;

    vis.margin = {top: 20, right: 50, bottom: 20, left: 50};
    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
    vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // clip path
    vis.svg.append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height);

    // add title
    vis.svg.append('g')
        .attr('class', 'title')
        .append('text')
        .text('New cases per day')
        .attr('transform', `translate(${vis.width/2}, 20)`)
        .attr('text-anchor', 'middle');

    // init scales
    vis.x = d3.scaleTime().range([0, vis.width]);
    vis.y = d3.scaleLinear().range([vis.height, 0]);

    // init x & y axis
    vis.xAxis = vis.svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + vis.height + ")");
    vis.yAxis = vis.svg.append("g")
        .attr("class", "axis y-axis");

    // init pathGroup
    vis.pathGroup = vis.svg.append('g').attr('class','pathGroup');

    // init path one (average)
    vis.pathOne = vis.pathGroup
        .append('path')
        .attr("class", "pathOne");

    // init path two (single state)
    vis.pathTwo = vis.pathGroup
        .append('path')
        .attr("class", "pathTwo");

    // init path generator
    vis.area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return vis.x(d.date); })
        .y0(vis.y(0))
        .y1(function(d) { return vis.y(d.newCases); });

    // init brushGroup:
    vis.brushGroup = vis.svg.append("g")
        .attr("class", "brush")

    // init brush
    vis.brush = d3.brushX()
        .extent([[0, 0], [vis.width, vis.height]])
        .on("end", function(event){
            // prevent error on inadvertent mouse click i.e. empty selection
            if (event.selection) {
                // console.log(event.selection)
                selectedTimeRange = [vis.x.invert(event.selection[0]), vis.x.invert(event.selection[1])];
                // console.log(selectedTimeRange)


                // prevent error on selection of an interval less than a day
                // Error: <g> attribute transform: Expected number, "translate(NaN,0)".
                // though the origin of the error is mapVis.js-->wrangeData()-->vis.xAxis.tickValues()
                // prevention has to be done here
                // the threshold 5 has been found empirically
                if ((event.selection[1]-event.selection[0])>5) {
                    myDataTable.wrangleData();
                    myMapVis.wrangleData()
                    myBarVisOne.wrangleData();
                    myBarVisTwo.wrangleData();
                }
            }
        });

    // init basic data processing
    this.wrangleDataStatic();
};

// init basic data processing - prepares data for brush - done only once
BrushVis.prototype.wrangleDataStatic = function() {
    let vis = this;

    // rearrange data structure and group by state
    let dataByDate = Array.from(d3.group(vis.data, d =>d.submission_date), ([key, value]) => ({key, value}))


    vis.preProcessedData = [];

    // iterate over each year
    dataByDate.forEach( year => {
        let tmpSumNewCases = 0;
        let tmpSumNewDeaths = 0;
        year.value.forEach( entry => {
            tmpSumNewCases += +entry['new_case'];
            tmpSumNewDeaths += +entry['new_death'];
        });

        vis.preProcessedData.push (
            {date: parseDate(year.key), newCases: tmpSumNewCases, newDeaths: tmpSumNewDeaths}
        )
    });

    this.wrangleDataResponsive();
};

// additional DataFiltering - only needed if we want to draw a second chart
BrushVis.prototype.wrangleDataResponsive = function() {
    let vis = this;

    vis.filteredData = [];

    // filter
    if (selectedState !== ''){
        vis.data.forEach(date => {
            if (selectedState === nameConverter.getFullName(date.state)){
                vis.filteredData.push(date)
            }
        })
    }

    // rearrange data structure and group by state
    let dataByDate = Array.from(d3.group(vis.filteredData, d =>d.submission_date), ([key, value]) => ({key, value}))


    vis.dataPathTwo = [];

    // iterate over each year
    dataByDate.forEach( year => {
        let tmpSumNewCases = 0;
        let tmpSumNewDeaths = 0;
        year.value.forEach( entry => {
            tmpSumNewCases += +entry['new_case'];
            tmpSumNewDeaths += +entry['new_death'];
        });

        vis.dataPathTwo.push (
            {date: parseDate(year.key), newCases: tmpSumNewCases, newDeaths: tmpSumNewDeaths}
        )
    });

    this.wrangleData();
};

// wrangleData - gets called whenever a state is selected
BrushVis.prototype.wrangleData = function(){
    let vis = this;

    // Update the visualization
    this.updateVis();
};

// updateVis
BrushVis.prototype.updateVis = function() {
    let vis = this;

    // update domains
    vis.x.domain( d3.extent(vis.preProcessedData, function(d) { return d.date }) );
    vis.y.domain( d3.extent(vis.preProcessedData, function(d) { return d.newCases }) );

    // draw x & y axis
    vis.xAxis.transition().duration(400).call(d3.axisBottom(vis.x));
    vis.yAxis.transition().duration(400).call(d3.axisLeft(vis.y).ticks(5));


    // draw pathOne
    vis.pathOne.datum(vis.preProcessedData)
        .transition().duration(400)
        .attr("d", vis.area)
        .attr("fill", "#428A8D")
        .attr("stroke", "#136D70")
        .attr("clip-path", "url(#clip)");

    // draw pathOne
    vis.pathTwo.datum(vis.dataPathTwo)
        .transition().duration(400)
        .attr("d", vis.area)
        .attr('fill', 'rgba(255,0,0,0.47)')
        .attr("stroke", "#darkred")
        .attr("clip-path", "url(#clip)");

    vis.brushGroup
        .call(vis.brush);
};