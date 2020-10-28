/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

// init global variables & switches
let myDataTable,
    myMapVis,
    myBarVisOne,
    myBarVisTwo,
    myBrushVis;

let selectedTimeRange = [];
let selectedState = '';
let trans_time= 1500

let colors= d3.scaleLinear()
    .range(["#e6faff", "#008385"])

let parseDate = d3.timeParse("%m/%d/%Y");

// load data using promises
let promises = [

    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),  // not projected -> you need to do it
    // d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json"), // already projected -> you can just scale it to ft your browser window
    d3.csv("data/covid_data.csv"),
    d3.csv("data/census_usa.csv")
];

Promise.all(promises)
    .then( function(data){ initMainPage(data) })
    .catch( function (err){console.log(err)} );

// initMainPage
function initMainPage(dataArray) {

    // log data
    console.log('check out the data', dataArray);

    // init table
    myDataTable = new DataTable('tableDiv', dataArray[1], dataArray[2]);

    // TODO - init map
    myMapVis = new MapVis('mapDiv', dataArray[0], dataArray[1], dataArray[2]);

    // TODO - init bars
    // true translates to descending order
    myBarVisOne = new BarVis('scatterDiv1', dataArray[1], dataArray[2], true)

    // false translates to ascending order
    myBarVisTwo = new BarVis('scatterDiv2', dataArray[1], dataArray[2], false)


    // init brush
    myBrushVis = new BrushVis('brushDiv', dataArray[1]);
}


let selectedCategory = $('#categorySelector').val();
let selectedCategoryName= $('#categorySelector').find('option:selected').text()

function categoryChange() {

    selectedCategory = $('#categorySelector').val();
    selectedCategoryName= $('#categorySelector').find('option:selected').text()

    myMapVis.wrangleData();
    myBarVisOne.wrangleData()
    myBarVisTwo.wrangleData()
}

