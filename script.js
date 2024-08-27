// Fetch the dataset
fetch(
    "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
)
    .then((response) => response.json())
    .then((data) => {
        const baseTemperature = data.baseTemperature;
        const monthlyVariance = data.monthlyVariance;

        // Call the function to create the heat map
        createHeatMap(monthlyVariance, baseTemperature);
    });

function createHeatMap(monthlyVariance, baseTemperature) {
    // Set up the dimensions and margins of the graph
    const margin = { top: 100, right: 30, bottom: 100, left: 100 },
        width = 1200 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    const svg = d3
        .select("#heatmap-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes
    const xScale = d3
        .scaleBand()
        .domain(monthlyVariance.map((d) => d.year))
        .range([0, width])
        .padding(0.05);

    const yScale = d3
        .scaleBand()
        .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
        .range([0, height])
        .padding(0.05);

    // Append x and y axes
    const xAxis = d3
        .axisBottom(xScale)
        .tickValues(xScale.domain().filter((year, i) => year % 10 === 0)); // Adjust the ticks to every 10 years

    svg.append("g")
        .attr("id", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis)
        .selectAll("text")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    const yAxis = d3.axisLeft(yScale).tickFormat((d) => {
        const date = new Date();
        date.setMonth(d);
        return d3.timeFormat("%B")(date);
    });

    svg.append("g").attr("id", "y-axis").call(yAxis);

    // Define the color scale with more discrete colors
    const color = d3
        .scaleQuantize()
        .domain([
            d3.min(monthlyVariance, (d) => baseTemperature + d.variance),
            d3.max(monthlyVariance, (d) => baseTemperature + d.variance),
        ])
        .range(d3.schemeRdYlBu[11].reverse()); // Use a color scheme with 11 distinct colors

    // Add the cells
    svg.selectAll(".cell")
        .data(monthlyVariance)
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("x", (d) => xScale(d.year))
        .attr("y", (d) => yScale(d.month - 1)) // Adjust month index (0-11)
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("data-month", (d) => d.month - 1)
        .attr("data-year", (d) => d.year)
        .attr("data-temp", (d) => baseTemperature + d.variance)
        .style("fill", (d) => color(baseTemperature + d.variance));

    // Add tooltip
    const tooltip = d3
        .select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute");

    svg.selectAll(".cell")
        .on("mouseover", function (event, d) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
                .html(
                    `Year: ${d.year}<br>Temp: ${(
                        baseTemperature + d.variance
                    ).toFixed(2)}°C`
                )
                .attr("data-year", d.year)
                .style("left", event.pageX + 5 + "px")
                .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", function () {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Add the legend
    const legendWidth = 400,
        legendHeight = 20;

    const legendColors = color.range(); // Use the new color scale range

    const legend = svg
        .append("g")
        .attr("id", "legend")
        .attr(
            "transform",
            `translate(${(width - legendWidth) / 2}, ${
                height + margin.top / 2
            })`
        );

    const legendScale = d3
        .scaleLinear()
        .domain(color.domain())
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5); // Fewer ticks on the legend

    // Adjust this part to ensure at least 4 distinct fill colors
    const legendData = d3.range(legendColors.length).map((i) => {
        const start =
            legendScale.domain()[0] +
            (i / legendColors.length) *
                (legendScale.domain()[1] - legendScale.domain()[0]);
        const end =
            start +
            (1 / legendColors.length) *
                (legendScale.domain()[1] - legendScale.domain()[0]);
        return { color: legendColors[i], start: start, end: end };
    });

    legend
        .selectAll("rect")
        .data(legendColors)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * (legendWidth / legendColors.length))
        .attr("y", 0)
        .attr("width", legendWidth / legendColors.length)
        .attr("height", legendHeight)
        .style("fill", (d) => d);

    legend
        .append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis);
}
