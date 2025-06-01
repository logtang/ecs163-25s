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

  // ===========================
  // 3. Bar Chart Steup (Incidents by Region, Latin America 1970-1980)
  // ===========================
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

  // ─── HELPER: Convert a pixel X to the nearest year for a band scale ─────────────────
    function pixelToYear(px) {
    const years = x.domain();    // [1970,1971,…,1980]
    const bandW = x.bandwidth(); // width of each discrete “band”
    for (let i = 0; i < years.length; i++) {
        const x0 = x(years[i]);
        const x1 = x0 + bandW;
        if (px >= x0 && px <= x1) return years[i];
    }
    // If px falls in between bands (e.g. in padding), approximate by index:
    const approxIndex = Math.floor(px / (bandW + x.paddingInner() * bandW));
    return years[Math.max(0, Math.min(years.length - 1, approxIndex))];
    }

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

    // Add the brush here, inside the .then() block
    const brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on("brush end", brushed);

    svg1.append("g")
    .attr("class", "brush")
    .call(brush);

    function brushed({ selection }) {
        if (!selection) {
        updatePie(1970, 1980);
        updateStream(1970, 1980);
        return;
        }
    const [x0, x1] = selection;           // pixel range
    const year0    = pixelToYear(x0);     // discrete band → year
    const year1    = pixelToYear(x1);

    const startYear = Math.max(1970, Math.min(1980, year0));
    const endYear   = Math.max(1970, Math.min(1980, year1));
    updatePie(startYear, endYear);
    updateStream(startYear, endYear);
    }

    

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

  // Add a legend group to the right of the pie chart
  const legendGroup = svg2.append("g")
    .attr("class", "legend-group")
    .attr("transform", `translate(${radius + 30},${-radius})`);

  updatePie(1970, 1980);

  // ───────────────────────────────────────────────────────────────────────────
// Function: updatePie(startYear, endYear)
//   Filters `filteredData` to [startYear, endYear], recomputes region counts,
//   then animates the pie slices and legend percentages to the new data.
// ───────────────────────────────────────────────────────────────────────────
function updatePie(startYear, endYear) {
  // A) Filter the original filteredData to years in [startYear, endYear]
  const slice = filteredData.filter(d => d.iyear >= startYear && d.iyear <= endYear);

  // B) Recompute counts by region for that slice
  const byRegion2 = d3.rollup(
    slice,
    v => v.length,
    d => d.region_txt
  );
  const dataByRegion2 = Array.from(byRegion2, ([region, count]) => ({ region, count }))
    .sort((a, b) => d3.descending(a.count, b.count));

  // C) Join new pie data to existing <path> elements, keyed by region
  const arcs = svg2.selectAll("path")
    .data(pie(dataByRegion2), d => d.data.region);

  // C1) EXIT any slices for regions that no longer exist
  arcs.exit()
    .transition().duration(500)
      .attr("opacity", 0)
      .remove();

  // C2) UPDATE existing slices: tween the “d” attribute (from old angle → new angle)
  arcs.transition().duration(500)
    .attrTween("d", function(d) {
      // d is the new pie‐segment data; this._current stores the old.
      const interpolate = d3.interpolate(this._current || d, d);
      this._current = interpolate(0);
      return t => arc(interpolate(t));
    })
    .attr("fill", d => color(d.data.region));

  // C3) ENTER new slices
  arcs.enter()
    .append("path")
      .attr("d", arc)                      // start at final shape for smooth fade‐in
      .attr("fill", d => color(d.data.region))
      .attr("opacity", 0)
    .transition().duration(500)
      .attr("opacity", 1)
    .each(function(d) { this._current = d; }); // store final for next transition

  // D) Animate the legend percentages
  const total2 = d3.sum(dataByRegion2, d => d.count);
  const percent2 = count => ((count / total2) * 100).toFixed(1) + "%";

  // D1) Join the new legend data to each <g class="legend-row"> inside legendGroup
  const legendRows = legendGroup.selectAll(".legend-row")
    .data(dataByRegion2, d => d.region);

  // D2) EXIT old legend rows
  legendRows.exit().remove();

  // D3) UPDATE existing legend rows: tween the percentage text
  legendRows.select("text.percent")
    .transition().duration(500)
    .tween("text", function(d) {
      const that = d3.select(this);
      const oldVal = parseFloat(that.text()) || 0;
      const newVal = parseFloat(percent2(d.count));
      const i = d3.interpolateNumber(oldVal, newVal);
      return t => that.text(i(t).toFixed(1) + "%");
    });

  // D4) ENTER new legend rows
  const newRows = legendRows.enter().append("g")
    .attr("class", "legend-row")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  newRows.append("text")
    .attr("class", "percent")
    .attr("x", 0)
    .attr("y", 10)
    .text(d => percent2(d.count))
    .style("font-size", "10px")
    .attr("alignment-baseline", "middle");

  newRows.append("rect")
    .attr("x", 35)
    .attr("y", 5)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", d => color(d.region));

  newRows.append("text")
    .attr("x", 50)
    .attr("y", 10)
    .text(d => d.region)
    .style("font-size", "10px")
    .attr("alignment-baseline", "middle");

  // D5) Re‐position all legend rows according to new order
  legendGroup.selectAll(".legend-row")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);
}
// ───────────────────────────────────────────────────────────────────────────

    // ===========================
  // 5. Stream-Graph Setup (Incidents in Central America by Country, 1970–1980)
  // ===========================

  // 5.1  Filter to “Central America & Caribbean”
  const latinData = filteredData.filter(d =>
    d.region_txt && d.region_txt.trim() === "Central America & Caribbean"
  );

  // 5.2  Group latinData by country → year → count
  const nestedData = d3.rollups(
    latinData,
    v => v.length,
    d => d.country_txt,
    d => d.iyear
  );

  // 5.3  Build a “raw” countrySeries array: {country, values: [{year, count},…], total}
  let rawCountrySeries = nestedData.map(([country, yearMap]) => {
    const values = Array.from(yearMap, ([year, count]) => ({ year: +year, count }));
    const total = d3.sum(values, d => d.count);
    return { country, values, total };
  });

  // 5.4  Separate “small” countries (<20 incidents total) into an “Other” bucket
  const threshold = 20;
  const visibleCountries = rawCountrySeries.filter(d => d.total >= threshold);
  const smallGroups = rawCountrySeries.filter(d => d.total < threshold);

  if (smallGroups.length) {
    const yearMap = new Map();
    smallGroups.forEach(group =>
      group.values.forEach(({ year, count }) => {
        yearMap.set(year, (yearMap.get(year) || 0) + count);
      })
    );
    visibleCountries.push({
      country: "Other",
      values: Array.from(yearMap.entries()).map(([year, count]) => ({ year: +year, count })),
      total: d3.sum(Array.from(yearMap.values()))
    });
  }

  // 5.5  Final countrySeries to plot
  const countrySeries = visibleCountries;

  // 5.6  List all years (1970–1980) and all countries
  const allYears = d3.range(1970, 1981); // [1970, 1971, …, 1980]
  const allCountries = countrySeries.map(d => d.country);

  // 5.7  Build a Map for quick lookup: country → (year → count)
  const countsByCountry = new Map();
  countrySeries.forEach(({ country, values }) => {
    const yearMap = new Map();
    values.forEach(d => yearMap.set(d.year, d.count));
    countsByCountry.set(country, yearMap);
  });

  // 5.8  Pivot into “wideData”: one object per year with a key for each country
  const wideData = allYears.map(year => {
    const row = { year };
    allCountries.forEach(country => {
      const m = countsByCountry.get(country);
      row[country] = m.get(year) || 0;
    });
    return row;
  });

  // 5.9  Create the silhouette-stacked layers
  const stackGen = d3.stack()
    .keys(allCountries)
    .offset(d3.stackOffsetSilhouette);
  const layers = stackGen(wideData);
  // layers[i].key === allCountries[i]

  // 5.10  Set up SVG group for #vis3 (reuse your margin/width/height vars)
  const vis3Margin = { top: 20, right: 80, bottom: 30, left: 50 },
        vis3Width  = 500 - vis3Margin.left - vis3Margin.right,
        vis3Height = 300 - vis3Margin.top  - vis3Margin.bottom;

  const svg3 = d3.select("#vis3")
    .attr("width",  vis3Width  + vis3Margin.left + vis3Margin.right)
    .attr("height", vis3Height + vis3Margin.top  + vis3Margin.bottom)
    .append("g")
      .attr("transform", `translate(${vis3Margin.left},${vis3Margin.top})`);

  svg3.append("text")
    .attr("x", vis3Width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Terrorist Attacks in Central America by Country (1970–1980)");

  // 5.11  Define x3 and a “blank” y3 (range only — domain to come)
  const x3 = d3.scaleLinear()
    .domain(d3.extent(filteredData, d => d.iyear)) // [1970,1980]
    .range([0, vis3Width]);

  const y3 = d3.scaleLinear()
    .range([vis3Height, 0]); // no domain yet

  // (Optional) Axis labels
  svg3.append("text")
    .attr("x", vis3Width / 2)
    .attr("y", vis3Height + vis3Margin.bottom + 10)
    .attr("text-anchor", "middle")
    .text("Year");

  // Remove the Y axis label (do not append it)
  // svg3.append("text")
  //   .attr("transform", "rotate(-90)")
  //   .attr("x", -vis3Height / 2)
  //   .attr("y", -vis3Margin.left + 5)
  //   .attr("text-anchor", "middle")
  //   .text("Number of Attacks");

  // 5.12  Compute silhouette’s global min/max and update y3.domain
  const yMin = d3.min(layers, layer => d3.min(layer, d => d[0]));
  const yMax = d3.max(layers, layer => d3.max(layer, d => d[1]));
  y3.domain([yMin, yMax]);

  // 5.13  Remove any old axes/zero-line
  svg3.selectAll(".x-axis, .y-axis, .zero-line").remove();

  // 5.14  (Removed Y-axis entirely, do not append it)
  // svg3.append("g")
  //   .attr("class", "y-axis")
  //   .call(d3.axisLeft(y3).tickFormat(""));

  // 5.15  Draw a faint “zero” baseline at y3(0)
  svg3.append("line")
    .attr("class", "zero-line")
    .attr("x1", 0)
    .attr("x2", vis3Width)
    .attr("y1", y3(0))
    .attr("y2", y3(0))
    .attr("stroke", "#888")
    .attr("stroke-dasharray", "2 2");

  // 5.16  Draw new X-axis at the bottom
  svg3.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${vis3Height})`)
    .call(d3.axisBottom(x3).tickFormat(d3.format("d")));

  // 5.17  Set up a color scale for each country
  const color3 = d3.scaleOrdinal()
    .domain(allCountries)
    .range(d3.schemeTableau10);

  // 5.18  Draw the stream-graph layers
  const areaGen = d3.area()
    .x((d, i) => x3(allYears[i]))
    .y0(d => y3(d[0]))
    .y1(d => y3(d[1]))
    .curve(d3.curveBasis);

  svg3.selectAll(".stream-layer").remove();
  svg3.selectAll(".stream-layer")
    .data(layers)
    .enter()
    .append("path")
      .attr("class", "stream-layer")
      .attr("d", layer => areaGen(layer))
      .attr("fill", layer => color3(layer.key))
      .attr("opacity", 0.85)
      .attr("stroke", "none")
      // --- Add click event for highlighting and popup ---
      .on("click", function(event, layer) {
        event.stopPropagation();
        svg3.selectAll(".stream-layer")
          .attr("opacity", 0.25)
          .attr("stroke", "none")
          .attr("stroke-width", null);
        d3.select(this)
          .attr("opacity", 1)
          .attr("stroke", "#222")
          .attr("stroke-width", 2);
        this.parentNode.appendChild(this);

        // --- Show popup with description ---
        setTimeout(() => showStreamPopup(layer.key), 0); // Ensure popup appears above SVG
      });

// --- Click outside to reset highlight and remove popup ---
svg3.on("click", function(event) {
  if (event.target.tagName !== "path") {
    svg3.selectAll(".stream-layer")
      .attr("opacity", 0.85)
      .attr("stroke", "none")
      .attr("stroke-width", null);
    d3.select("#stream-popup").remove();
  }
});

// --- Helper: Show popup overlay for stream description ---
function showStreamPopup(country) {
  d3.select("#stream-popup").remove();
  const desc = countryDescriptions[country] || "No description available. Add one in countryDescriptions.";
  d3.select("body")
    .append("div")
    .attr("id", "stream-popup")
    .style("position", "fixed")
    .style("left", "50%")
    .style("top", "20%")
    .style("transform", "translate(-50%, 0)")
    .style("background", "white")
    .style("border", "2px solid #36454F")
    .style("border-radius", "8px")
    .style("padding", "20px")
    .style("box-shadow", "0 2px 10px rgba(0,0,0,0.2)")
    .style("z-index", 10000)
    .html(
      `<div style="display:flex;justify-content:space-between;align-items:center;">
         <strong>${country}</strong>
         <span id="close-stream-popup" style="cursor:pointer;font-size:18px;font-weight:bold;padding-left:20px;">&#10005;</span>
       </div>
       <div style="margin-top:8px; font-size:14px;">${desc}</div>`
    );
  d3.select("#close-stream-popup").on("click", () => {
    d3.select("#stream-popup").remove();
  });
}

  // 5.19  Rebuild the legend on the right
  svg3.selectAll(".legend3").remove();
  const legend3 = svg3.append("g")
    .attr("class", "legend3")
    .attr("transform", `translate(${vis3Width + 10}, 0)`);

  allCountries.forEach((country, i) => {
    const row = legend3.append("g")
      .attr("transform", `translate(0, ${i * 20})`);
    row.append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", color3(country));
    row.append("text")
      .attr("x", 15)
      .attr("y", 10)
      .text(country)
      .style("font-size", "10px")
      .attr("alignment-baseline", "middle");
  });


  // ===========================
  // 6. Add Interactivity
  // ===========================
  
});

// --- Add your custom descriptions here ---
const countryDescriptions = {
  "El Salvador": "El Salvador experienced significant unrest during the 1970s, leading up to the civil war.",
  "Guatemala": "Guatemala's civil conflict contributed to a high number of attacks in this period.",
  "Nicaragua": "The Sandinista revolution and related violence marked this era in Nicaragua.",
  "Other": "Other countries in the region had fewer incidents, but still faced instability.",
  "Costa Rica": "Costa Rica remained relatively peaceful compared to its neighbors",
  // Add more countries and descriptions as needed
};
