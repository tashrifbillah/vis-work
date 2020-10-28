/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */


class MapVis {

    constructor(parentElement, geoData, covidData, censusData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.covidData = covidData
        this.censusData = censusData

        this.initVis()
    }

    initVis() {
        let vis = this;


        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);


        // title
        vis.svg.append("text")
            .attr("x", vis.width/2)
            .attr("y", 20)
            .attr("class", "title map-title")


        vis.projection = d3.geoAlbersUsa() // d3.geoStereographic()
            .translate([vis.width / 2, vis.height / 2])
            .scale(1200)

        vis.path = d3.geoPath()
            .projection(vis.projection);

        vis.usa = topojson
            .feature(vis.geoData, vis.geoData.objects.states)
            .features

        vis.states = vis.svg.selectAll(".state")
            .data(vis.usa)
            .enter()
            .append("path")
            .attr('class', 'state')
            .attr("d", vis.path)


        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")


        // append legend
        vis.legend = vis.svg.append("g")
            .attr('transform', `translate(${vis.width / 2}, ${vis.height-20})`)

        // color gradient
        let linearGradient = vis.legend.append("linearGradient")
            .attr("id", "gradient");

        // start color
        linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#e6faff");

        // end color
        linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#008385");


        let legendWidth= 200
        let legendHeight= 20
        vis.legend
            .append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .attr("x", 0)
            .attr("y", -legendHeight)
            .attr('class', 'legend')
            .style("fill", "url(#gradient)");

        // Scales and axes
        vis.x = d3.scaleLinear()
            .range([0,legendWidth])

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)


        vis.legend.append("g")
            .attr("class", "x-axis axis")



         vis.wrangleData()

    }


    wrangleData(){
        let vis = this;

        let filteredData = [];

        // if there is a region selected
        if (selectedTimeRange.length !== 0){

            // iterate over all rows the csv (dataFill)
            vis.covidData.forEach( row => {
                // and push rows with proper dates into filteredData
                if (selectedTimeRange[0].getTime() <= parseDate(row.submission_date).getTime() && parseDate(row.submission_date).getTime() <= selectedTimeRange[1].getTime() ){
                    filteredData.push(row);
                }
            });
        } else {
            filteredData = vis.covidData;
        }

        // prepare covid data by grouping all rows by state
        let covidDataByState = Array.from(d3.group(filteredData, d =>d.state), ([key, value]) => ({key, value}))

        // have a look
        // console.log(covidDataByState)

        // init final data structure in which both data sets will be merged into
        vis.stateInfo = {}

        // merge
        covidDataByState.forEach( state => {

            // get full state name
            let stateName = nameConverter.getFullName(state.key)

            // init counters
            let newCasesSum = 0;
            let newDeathsSum = 0;
            let population = 0;

            // look up population for the state in the census data set
            vis.censusData.forEach(row => {
                if (row.state === stateName) {
                    population += +row["2019"].replaceAll(',', '');
                }
            })

            // calculate new cases by summing up all the entries for each state
            state.value.forEach(entry => {
                newCasesSum += +entry['new_case'];
                newDeathsSum += +entry['new_death'];
            });

            // populate the final data structure
            vis.stateInfo[stateName]=
                {
                    // state: stateName,
                    population: population,
                    absCases: newCasesSum,
                    absDeaths: newDeathsSum,
                    relCases: (newCasesSum/population),
                    relDeaths: (newDeathsSum/population),
                }

        })


        let temp= d3.max(Object.values(vis.stateInfo).map(d => d[selectedCategory]))
        colors.domain([0, temp])
        vis.x.domain([0, temp])

        vis.xAxis
            .tickFormat(selectedCategory.search("rel")>=0?d3.format('.2%'):d3.format(','))
            .tickValues([0, temp])

        vis.svg.select(".x-axis")
            .call(vis.xAxis);

        vis.updateVis()

    }



    updateVis(){
        let vis = this;


        // title
        vis.svg.select(".map-title")
            .text(selectedCategoryName)

        // blacken a state and corresponding bar if not in covidData
        // note that vis.sates._groups have 56 objects while vis.covidData has 52 objects
        // so the additional 4 states have to be blackened
        vis.states
            .transition()
            .duration(trans_time)
            .attr("fill", d => vis.stateInfo[d.properties.name]?
                colors(vis.stateInfo[d.properties.name][selectedCategory]):"black")
            .attr("stroke", 'darkblue')

        vis.states
            .on('mouseover', function(event, d){
                console.log(d)
                d3.select(this)
                    .attr('fill', 'red')

                // highlight the corresponding bar
                d3.selectAll('.bar')
                     .attr('fill', b=> b.state==d.properties.name?"red":colors(vis.stateInfo[b.state][selectedCategory]))

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                     <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                         <h4>${d.properties.name}</h4>                
                         <h6>Population: ${d3.format(',')(vis.stateInfo[d.properties.name].population)}</h6>
                         <h6>Cases (absolute): ${d3.format(',')(vis.stateInfo[d.properties.name].absCases)}</h6>
                         <h6>Deaths (absolute): ${d3.format(',')(vis.stateInfo[d.properties.name].absDeaths)}</h6>
                         <h6>Cases (relative): ${d3.format('.2%')(vis.stateInfo[d.properties.name].relCases)}</h6>
                         <h6>Deaths (relative): ${d3.format('.3%')(vis.stateInfo[d.properties.name].relDeaths)}</h6>
                     </div>`);

            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr("fill", d => vis.stateInfo[d.properties.name]?
                        colors(vis.stateInfo[d.properties.name][selectedCategory]):"black")

                // reset the corresponding bar
                d3.selectAll('.bar')
                    .attr('fill', b=> colors(vis.stateInfo[b.state][selectedCategory]))

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })



    }


}