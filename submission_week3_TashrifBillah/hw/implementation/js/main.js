

// DATASETS

// Global variable with 1198 pizza deliveries
// console.log(deliveryData);

// Global variable with 200 customer feedbacks
// console.log(feedbackData.length);


// FILTER DATA, THEN DISPLAY SUMMARY OF DATA & BAR CHART

dataManipulation()



function dataManipulation() {
    let selectBox = document.getElementById("area");
    let selectedArea = selectBox.options[selectBox.selectedIndex].value;
    console.log(selectedArea)

    selectBox = document.getElementById("type");
    let selectedType = selectBox.options[selectBox.selectedIndex].value;
    console.log(selectedType)

    function checkAreaType(obj){

        if (selectedArea==="all") {
            return obj.order_type===selectedType
        }

        if (selectedType==="all") {
            return obj.area===selectedArea
        }

        return obj.order_type===selectedType && obj.area===selectedArea

    }

    let delivery= deliveryData
    if (selectedArea!=="all" || selectedType!=="all") {
        delivery = delivery.filter(checkAreaType)
    }

    createVisualization(delivery)
    countDelivery(delivery)


    let feed= feedbackData
    let ids = delivery.map(a => a.delivery_id)
    let filtered_feed= feed.filter(a => (ids.includes(a.delivery_id)))
    countFeedback(filtered_feed)

    writeDetails(delivery, filtered_feed)

}



function createVisualization(delivery) {

	/* ************************************************************
	 *
	 * ADD YOUR CODE HERE
	 * (accordingly to the instructions in the HW2 assignment)
	 * 
	 * 1) Filter data
	 * 2) Display key figures
	 * 3) Display bar chart
	 * 4) React to user input and start with (1)
	 *
	 * ************************************************************/
    renderBarChart(delivery)
}

/*
Number of all feedback entries
Number of feedback entries per quality category: low, medium, high
 */
function countFeedback(feed)
{
    document.getElementById("feedback-title").innerHTML=
        "<h4>Total feedbacks "+ feed.length.toString()+"</h4>"

    // let feed= feedbackData
    let high = 0, medium = 0, low = 0
    for (let i = 0; i < feed.length; i++) {
        switch (feed[i].quality) {
            case "high":
                high++
                break
            case "medium":
                medium++
                break
            case "low":
                low++
                break
        }
    }

    console.log("Total feedback:", feed.length)
    console.log("low:", low, "medium:", medium, "high:", high)

    // write to HTML here
    let table= document.getElementById("feedback-summary")


    writeRow(table, 0,"Low satisfaction", low)
    writeRow(table, 1, "Medium satisfaction", medium)
    writeRow(table, 2, "High satisfaction", high)

}


function writeRow(table, r, field, value) {
    table.rows[r].cells[0].innerHTML= field
    table.rows[r].cells[1].innerHTML= value.toString()
}


function writeDetails(delivery, feed) {
    let table= document.getElementById("details")

    // delete old table first
    let L= table.rows.length
    if (L>1) {
        for (let i=0; i<L; i++) {
            table.deleteRow(-1)
        }
    }

    // write new table
    // ids of customers who gave feedback
    let ids = feed.map(a => a.delivery_id)
    for (let i=0; i<delivery.length; i++) {
        let row= table.insertRow(-1)
        row.insertCell(0).innerHTML= delivery[i].delivery_id
        row.insertCell(1).innerHTML= delivery[i].area
        row.insertCell(2).innerHTML= delivery[i].delivery_time
        row.insertCell(3).innerHTML= delivery[i].driver
        row.insertCell(4).innerHTML= delivery[i].count

        let ind= feed.findIndex(a => (a.delivery_id==delivery[i].delivery_id))
        if (ind >= 0) {
            row.insertCell(5).innerHTML = feed[ind].punctuality
            row.insertCell(6).innerHTML = feed[ind].quality
            row.insertCell(7).innerHTML = feed[ind].wrong_pizza
        }
        else {
            row.insertCell(5)
            row.insertCell(6)
            row.insertCell(7)
        }
    }

}


/*
Number of pizza deliveries
Number of all delivered pizzas (count)
Average delivery time
Total sales in USD
 */
function countDelivery(delivery)
{

    document.getElementById("sales-title").innerHTML=
        "<h4>Total deliveries "+ delivery.length.toString()+"</h4>"

    // let delivery= deliveryData
    let pizzas = 0
    let del_time = 0
    let sales= 0.0

    for (let i = 0; i < delivery.length; i++) {
        pizzas += delivery[i].count
        del_time += delivery[i].delivery_time
        sales += delivery[i].price
    }

    let avg_time= Math.round(del_time/delivery.length)

    console.log("Total deliveries:", delivery.length)
    console.log("Average time:", avg_time, "total pizza:", pizzas, "Total sales:", sales.toFixed(2))

    // write to HTML here
    let table= document.getElementById("sales-summary")

    let formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    })


    writeRow(table, 0,"Total pizzas", pizzas)
    writeRow(table, 1, "Total revenue", formatter.format(sales))
    writeRow(table, 2,"Average delivery time [min]", avg_time)

}


