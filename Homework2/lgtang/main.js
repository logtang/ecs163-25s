// ===========================
// 1. Global Configuration and Layout Setup
// ===========================

// ===========================
// 2. Data Loading and Preprocessing
// ===========================

d3.csv("global-terror.csv").then(data => {
  // Convert iyear from string to number
  const filteredData = data
    .map(d => ({ ...d, iyear: +d.iyear }))
    .filter(d => d.iyear >= 1970 && d.iyear <= 1980);

  console.log("Filtered Data (1970–1980):", filteredData);

  // Group data by year to count incidents per year
  const byYear = d3.rollup(
    filteredData,
    v => v.length,
    d => d.iyear
  );

  console.log("Incidents by year:", Array.from(byYear));
  // We'll use this to plot the histogram next!

  // Convert Map to array of objects for easy access
  const dataByYear = Array.from(byYear, ([year, count]) => ({ year: +year, count }));

  // Set dimensions for vis1
  const margin = { top: 20, right: 20, bottom: 30, left: 50 },
        width = 400 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

  // Select the SVG and append a group with margin offset
  const svg1 = d3.select("#vis1")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  svg1.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Terrorist Attacks by Year (1970–1980)");

  // X Scale — year
  const x = d3.scaleBand()
    .domain(dataByYear.map(d => d.year))
    .range([0, width])
    .padding(0.1);
  // Y Scale — count of incidents
  const y = d3.scaleLinear()
    .domain([0, d3.max(dataByYear, d => d.count)])
    .nice()
    .range([height, 0]);

  // X Axis
  svg1.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));
  // X Axis Label 
  svg1.append("text")
  .attr("x", width / 2)
  .attr("y", height + margin.bottom - 5)
  .attr("text-anchor", "middle")
  .text("Year")
  .attr("y", height + margin.bottom + 10);

  // Y Axis
  svg1.append("g")
    .call(d3.axisLeft(y));
  // Y Axis Label 
  svg1.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -margin.left + 15)
  .attr("text-anchor", "middle")
  .text("Number of Attacks")
  .attr("y", -margin.left + 5);

  // Bars
  svg1.selectAll(".bar")
    .data(dataByYear)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.year))
    .attr("y", d => y(d.count))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.count))
    .attr("fill", "#36454F");
  // ===========================
  // 4. Pie Chart Setup (Incidents by Region, Latin America 1970-1980)
  // ===========================

  // Group data by region
  const byRegion = d3.rollup(
    filteredData,
    v => v.length,
    d => d.region_txt
  );
  const dataByRegion = Array.from(byRegion, ([region, count]) => ({ region, count }))
    .sort((a, b) => d3.descending(a.count, b.count));

  // Set dimensions for vis2
  const pieWidth = 400, pieHeight = 300, pieMargin = 40;
  const radius = Math.min(pieWidth, pieHeight) / 2 - pieMargin;

  const svg2 = d3.select("#vis2")
    .attr("width", pieWidth)
    .attr("height", pieHeight)
    .append("g")
    .attr("transform", `translate(${pieWidth / 2 - 40},${pieHeight / 2})`);

  svg2.append("text")
    .attr("x", 0)
    .attr("y", -radius - 20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Regional Distribution of Attacks (1970–1980)");

  // Pie and arc generators
  const pie = d3.pie()
    .value(d => d.count);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  // Color scale
  const color = d3.scaleOrdinal()
    .domain(dataByRegion.map(d => d.region))
    .range(d3.schemeSet3);

  // Draw slices
  svg2.selectAll("path")
    .data(pie(dataByRegion))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.region))
    .attr("stroke", "white")
    .style("stroke-width", "1px");

  // Legend
  const legend = svg2.append("g")
    .attr("transform", `translate(${radius + 100}, ${-radius + 10})`);

  const totalCount = d3.sum(dataByRegion, d => d.count);
  const percent = (count) => ((count / totalCount) * 100).toFixed(1) + "%";

  dataByRegion.forEach((d, i) => {
    const legendRow = legend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendRow.append("text")
      .attr("x", -90)
      .attr("y", 10)
      .text(percent(d.count))
      .style("font-size", "10px")
      .attr("alignment-baseline", "middle");

    legendRow.append("rect")
      .attr("x", -47)
      .attr("y", 5)
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", color(d.region));

    legendRow.append("text")
      .attr("x", 0)
      .attr("y", 10)
      .text(d.region)
      .style("font-size", "10px")
      .attr("alignment-baseline", "middle");
  });
  // ===========================
  // 5. Line-Area Chart Setup (Incidents by Year in Latin America, by Country, 1970-1980)
  // ===========================

  // Inspect available region values
  console.log("Unique regions:", Array.from(new Set(filteredData.map(d => d.region_txt))));
  console.log("All region values (cleaned):", Array.from(new Set(filteredData.map(d => d.region_txt && d.region_txt.trim()))));
  // Filter to Central America & Caribbean only (exclude South America)
  const latinData = filteredData.filter(d =>
    d.region_txt &&
    d.region_txt.trim() === "Central America & Caribbean"
  );
  console.log("Latin data sample:", latinData.slice(0, 5));

  // Group by country then by year
  const nestedData = d3.rollups(
    latinData,
    v => v.length,
    d => d.country_txt,
    d => d.iyear
  );

  // Filter out countries with low total counts, group them into "Other"
  let threshold = 20;
  let rawCountrySeries = nestedData.map(([country, yearMap]) => {
    const values = Array.from(yearMap, ([year, count]) => ({ year: +year, count }));
    const total = d3.sum(values, d => d.count);
    return { country, values, total };
  });
  const visibleCountries = rawCountrySeries.filter(d => d.total >= threshold);
  const other = rawCountrySeries.filter(d => d.total < threshold);
  if (other.length > 0) {
    const yearMap = new Map();
    other.forEach(group => {
      group.values.forEach(({ year, count }) => {
        yearMap.set(year, (yearMap.get(year) || 0) + count);
      });
    });
    visibleCountries.push({
      country: "Other",
      values: Array.from(yearMap.entries()).map(([year, count]) => ({ year, count }))
    });
  }
  const countrySeries = visibleCountries;

  // Optional console log for visible countries
  console.log("Visible countries:", countrySeries.map(d => d.country));

  // Set dimensions
  const vis3Margin = { top: 20, right: 80, bottom: 30, left: 50 },
        vis3Width = 500 - vis3Margin.left - vis3Margin.right,
        vis3Height = 300 - vis3Margin.top - vis3Margin.bottom;

  const svg3 = d3.select("#vis3")
    .attr("width", vis3Width + vis3Margin.left + vis3Margin.right)
    .attr("height", vis3Height + vis3Margin.top + vis3Margin.bottom)
    .append("g")
    .attr("transform", `translate(${vis3Margin.left},${vis3Margin.top})`);

  svg3.append("text")
    .attr("x", vis3Width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Terrorist Attacks in Central America by Country (1970–1980)");

  // X and Y scales
  const x3 = d3.scaleLinear()
    .domain(d3.extent(filteredData, d => d.iyear))
    .range([0, vis3Width]);

  const y3 = d3.scaleLinear()
    .domain([0, d3.max(countrySeries, s => d3.max(s.values, v => v.count))])
    .nice()
    .range([vis3Height, 0]);

  // Color scale by country
  const color3 = d3.scaleOrdinal()
    .domain(countrySeries.map(d => d.country))
    .range(d3.schemeTableau10);

  // X axis
  svg3.append("g")
    .attr("transform", `translate(0,${vis3Height})`)
    .call(d3.axisBottom(x3).tickFormat(d3.format("d")));
  // X Axis Label
  svg3.append("text")
    .attr("x", vis3Width / 2)
    .attr("y", vis3Height + vis3Margin.bottom + 10)
    .attr("text-anchor", "middle")
    .text("Year");

  // Y axis
  svg3.append("g")
    .call(d3.axisLeft(y3));
  // Y Axis Label
  svg3.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -vis3Height / 2)
    .attr("y", -vis3Margin.left + 5)
    .attr("text-anchor", "middle")
    .text("Number of Attacks");

  // Line generator
  const line = d3.line()
    .x(d => x3(d.year))
    .y(d => y3(d.count));
    
  // Area generator
  const area = d3.area()
    .x(d => x3(d.year))
    .y0(vis3Height)
    .y1(d => y3(d.count));

  // Debugger 
  console.log("Country series:", countrySeries);

  // Draw areas under lines
  svg3.selectAll(".area")
    .data(countrySeries)
    .enter()
    .append("path")
    .attr("class", "area")
    .attr("fill", d => d3.color(color3(d.country)).copy({opacity: 0.15}))
    .attr("d", d => area(d.values));

  // Draw lines on top
  svg3.selectAll(".line")
    .data(countrySeries)
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", d => color3(d.country))
    .attr("stroke-width", 1.5)
    .attr("d", d => line(d.values));

  // Optional: Add legend
  const legend3 = svg3.append("g")
    .attr("transform", `translate(${vis3Width + 10}, 0)`);

  countrySeries.forEach((d, i) => {
    const row = legend3.append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    row.append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", color3(d.country));

    row.append("text")
      .attr("x", 15)
      .attr("y", 10)
      .text(d.country)
      .style("font-size", "10px")
      .attr("alignment-baseline", "middle");
  });
});

    // ===========================
    // 3. Histogram Setup (Incidents by Year, 1970-1980)
    // ===========================
    // --- Plot 1 ---

    // Labels

    // ===========================
    // 4. Pie Chart Setup (Incidents by Region, Latin America 1970-1980)
    // ===========================
    // --- Plot 2 ---

    // Labels

    // ===========================
    // 5. Line-Area Chart Setup (Incidents by Year in Latin America, by Country, 1970-1980)
    // ===========================
    // --- Plot 3 ---

    // Labels

// ===========================
// Error Handling
// ===========================
// .catch(function(error){
//     console.log(error);
// });

console.log("main.js is linked!");