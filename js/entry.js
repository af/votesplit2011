let d3 = require('d3')
let topojson = require('topojson')

const WIDTH = 900
const HEIGHT = 600
let svg = d3.select('body').append('svg')
            .attr('width', WIDTH)
            .attr('height', HEIGHT)
let projection = d3.geo.albers()

d3.json('election_districts.topojson', function(error, canada) {
    if (error) return console.error(error)
    console.log(canada, svg)

    svg.append('path')
        .attr('transform', `translate(0, ${HEIGHT - 150})`)
        .datum(topojson.feature(canada, canada.objects.election_districts))
        .attr('d', d3.geo.path().projection(projection))
});
