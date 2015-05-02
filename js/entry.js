let d3 = require('d3')
let topojson = require('topojson')

const WIDTH = Math.max(900, window.innerWidth);
const HEIGHT = 600
let svg = d3.select('body').append('svg')
            .attr('width', WIDTH)
            .attr('height', HEIGHT)
            .append('g').attr('class', 'container')
            .attr('transform', `translate(0, ${HEIGHT - 150})`)
let projection = d3.geo.albers()
let pathProjection = d3.geo.path().projection(projection)

d3.json('election_districts.topojson', function(error, canada) {
    if (error) return console.error(error)
    console.log(canada, svg)

    var districts = topojson.feature(canada, canada.objects.election_districts).features
    var paths = svg.selectAll('.district').data(districts)
    paths.enter().insert('path')
        .attr('class', d => `district ${d.id}`)
        .attr('d', pathProjection)
});
