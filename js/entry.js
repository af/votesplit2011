let d3 = require('d3')
let topojson = require('topojson')

const WIDTH = Math.max(900, window.innerWidth);
const HEIGHT = 600

let container;
let projection = d3.geo.albers().translate([WIDTH / 2, HEIGHT ]);
let pathProjection = d3.geo.path().projection(projection)
let zoom = d3.behavior.zoom().scaleExtent([1, 20])
             .on('zoom', () => {
                let evt = d3.event
                container.attr('transform', `translate(${evt.translate})scale(${evt.scale})`)
             })

let svg = d3.select('body').append('svg')
            .attr('width', WIDTH)
            .attr('height', HEIGHT)
            .attr('transform', `translate(0, ${HEIGHT - 150})`)
            .call(zoom)
container = svg.append('g').attr('class', 'container')

d3.json('districts.topojson', function(error, canada) {
    if (error) return console.error(error)
    //console.log(canada, svg)

    var districts = topojson.feature(canada, canada.objects.gfed000b11a_e).features
    var paths = container.selectAll('.district').data(districts)

    var parties = 'CPC,LPC,NDP,GRN,BLC'.split(',')
    var seatTotals = {}

    paths.enter().insert('path')
        .attr('class', d => {
            // Quick & dirty vote splitting simulation:
            // let split = 0.2*d.properties.CPC
            // d.properties.NDP = d.properties.NDP + split
            // d.properties.CPC = d.properties.CPC - split

            let winner = parties.map(party => ({ name: party, votes: d.properties[party] }))
                                .reduce(((max, next) => next.votes > max.votes ? next : max), { votes: 0 })
            seatTotals[winner.name] = seatTotals[winner.name] + 1 || 1
            return `district ${winner.name}`
        })
        .attr('d', pathProjection)

    console.log(seatTotals)
});
