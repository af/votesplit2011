let d3 = require('d3')
let React = require('react')
let d = require('jsnox')(React)
let topojson = require('topojson')

const WIDTH = Math.max(900, window.innerWidth)
const HEIGHT = Math.max(400, window.innerHeight)
const PARTIES = 'CPC,LPC,NDP,GRN,BLC'.split(',')
let seatTotals = {}


let ElectionMap = React.createClass({
    displayName: 'ElectionMap',

    componentDidMount: function() {
        let container
        let projection = d3.geo.albers().translate([WIDTH / 2, HEIGHT])
        let pathProjection = d3.geo.path().projection(projection)
        let zoom = d3.behavior.zoom().scaleExtent([1, 20])
                     .on('zoom', () => {
                        let evt = d3.event
                        container.attr('transform', `translate(${evt.translate})scale(${evt.scale})`)
                     })

        let svg = d3.select(this.getDOMNode()).call(zoom)
        container = svg.append('g').attr('class', 'container')

        d3.json('districts.topojson', function(error, canada) {
            if (error) return console.error(error)

            var districts = topojson.feature(canada, canada.objects.gfed000b11a_e).features
            var paths = container.selectAll('.district').data(districts)

            paths.enter().insert('path')
                .attr('vector-effect', 'non-scaling-stroke')
                .attr('class', d => {
                    // Quick & dirty vote splitting simulation:
                    // let split = 0.2*d.properties.CPC
                    // d.properties.NDP = d.properties.NDP + split
                    // d.properties.CPC = d.properties.CPC - split

                    let winReducer = (max, next) => next.votes > max.votes ? next : max
                    let winner = PARTIES.map(party => ({ name: party, votes: d.properties[party] }))
                                        .reduce(winReducer, { votes: 0 })
                    seatTotals[winner.name] = seatTotals[winner.name] + 1 || 1
                    return `district ${winner.name}`
                })
                .attr('d', pathProjection)
                    .append('title').text(d => d.properties.districtName)

            console.log(seatTotals)
        })
    },

    render: function() {
        return d('svg', {
            width: WIDTH,
            height: HEIGHT,
            transform: `translate(0, ${HEIGHT - 150})`
        })
    }
})

React.render(d(ElectionMap), document.body)
