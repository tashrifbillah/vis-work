/* * * * * * * * * * * * * *
*      class BarVis        *
* * * * * * * * * * * * * */


class BarVis {

    constructor(parentElement, covidData, censusData, descending) {
        this.parentElement = parentElement;
        this.covidData = covidData
        this.censusData = censusData

        this.descending= descending

        this.initVis()
    }


    initVis(){
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 20, left: 60};
        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = $("#" + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);


        // Scales and axes
        vis.x = d3.scaleBand()
            .range([0, vis.width])
            .paddingInner(0.1)

        vis.y = d3.scaleLinear()
            .range([vis.height, 0])

        vis.xAxis = d3.axisBottom()
            .scale(vis.x)

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")")

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .attr("transform", "translate(-5,0)")

        // title
        vis.svg.append("text")
            .attr("x", vis.width/4)
            .attr("class", "title plot-title")

        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")


        this.wrangleData();
    }


    wrangleData(){
        let vis = this

        // I think one could use a lot of the dataWrangling from dataTable.js here...
        // first, filter according to selectedTimeRange, init empty array
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
        vis.stateInfo = []

        // merge
        covidDataByState.forEach( state => {

            // get full state name
            let stateName = nameConverter.getFullName(state.key)

            // init counters
            let newCasesSum = 0;
            let newDeathsSum = 0;
            let population = 0;

            // look up population for the state in the census data set
            vis.censusData.forEach( row => {
                if(row.state === stateName){
                    population += +row["2019"].replaceAll(',', '');
                }
            })

            // calculate new cases by summing up all the entries for each state
            state.value.forEach( entry => {
                newCasesSum += +entry['new_case'];
                newDeathsSum += +entry['new_death'];
            });

            // populate the final data structure
            vis.stateInfo.push(
                {
                    state: stateName,
                    population: population,
                    absCases: newCasesSum,
                    absDeaths: newDeathsSum,
                    relCases: (newCasesSum/population),
                    relDeaths: (newDeathsSum/population)
                }
            )
        })

        // console.log('final data structure for display', vis.stateInfo);


        // maybe a boolean in the constructor could come in handy
        if (vis.descending){
            vis.stateInfo.sort((a,b) => {return b[selectedCategory] - a[selectedCategory]})
        } else {
            vis.stateInfo.sort((a,b) => {return a[selectedCategory] - b[selectedCategory]})
        }

        vis.topTenData = vis.stateInfo.slice(0, 10)

        // console.log('top ten data structure', vis.topTenData);


        vis.updateVis()

    }


    updateVis(){
        let vis = this;

        // x domain
        vis.y.domain([0, d3.max(vis.topTenData, d => d[selectedCategory])])
        // y domain
        vis.x.domain(vis.topTenData.map(d=>nameConverter.getAbbreviation(d.state)))

        // title
        vis.svg.select(".plot-title")
            .text(selectedCategoryName)

        // bars
        // the breakdown between tmp and circle is necessary, otherwise .on() won't work
        let tmp= vis.svg.selectAll(".bar")
            .data(vis.topTenData, d=>d.state)

        let bar= tmp.enter()
            .append("rect")
            .merge(tmp)

        bar
            .transition()
            .duration(trans_time)
            .attr("y", d=> vis.y(d[selectedCategory]))
            .attr("x", d=> vis.x(nameConverter.getAbbreviation(d.state)))
            .attr("width", vis.x.bandwidth())
            .attr("height", d=> {
                let h= vis.height-vis.y(d[selectedCategory])
                // handle non-positive d[selectedCategory] values that yield invalid <rect> height
                // select a small strip within June-July and see console log
                if (h<0) {
                    selectedTimeRange.forEach(d => console.log(d3.timeFormat("%m/%d/%Y")(new Date(d))))
                    console.log(d.state, d[selectedCategory])
                    console.log('')
                } else {
                    return h
                }
            })
            .attr("class", "bar")
            .attr("fill", d => colors(d[selectedCategory]))


        bar
            .on('mouseover', function(event, d){

                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .attr('fill', 'red')

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                     <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                         <h4>${d.state}</h4>
                         <h6>Population: ${d3.format(',')(d.population)}</h6>
                         <h6>Cases (absolute): ${d3.format(',')(d.absCases)}</h6>
                         <h6>Deaths (absolute): ${d3.format(',')(d.absDeaths)}</h6>
                         <h6>Cases (relative): ${d3.format('.2%')(d.relCases)}</h6>
                         <h6>Deaths (relative): ${d3.format('.3%')(d.relDeaths)}</h6>
                     </div>`);

            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .attr("fill", d => colors(d[selectedCategory]))


                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })


        tmp.exit().remove()


        vis.svg.select(".x-axis")
            .transition()
            .duration(trans_time)
            .call(vis.xAxis);

        vis.yAxis
            .tickFormat(selectedCategory.search("rel")>=0?d3.format('.3%'):d3.format(','))

        vis.svg.select(".y-axis")
            .transition()
            .duration(trans_time)
            .call(vis.yAxis);


    }


}