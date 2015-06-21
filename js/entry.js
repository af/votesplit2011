let d3 = require('d3')
let React = require('react')
let d = require('jsnox')(React)
let topojson = require('topojson')

const WIDTH = Math.max(900, window.innerWidth)
const HEIGHT = Math.max(400, window.innerHeight)
const PARTIES = 'CPC,LPC,NDP,GRN,BLC'.split(',')
const SEAT_COUNT = 308
let seatTotals = {}


let ElectionMap = React.createClass({
    displayName: 'ElectionMap',
    propTypes: {
        onResultsChange: React.PropTypes.func.isRequired
    },

    // FIXME: need to break down this massive method:
    componentDidMount() {
        let component = this
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

            component.props.onResultsChange(seatTotals)
        })
    },

    render() {
        return d('svg', {
            width: WIDTH,
            height: HEIGHT,
            transform: `translate(0, ${HEIGHT - 150})`
        })
    }
})


let BarChart = React.createClass({
    displayName: 'BarChart',
    propTypes: {
        dataMap: React.PropTypes.object.isRequired,
        barMax: React.PropTypes.number.isRequired
    },

    render() {
        let results = this.props.dataMap
        let resultsKeys = Object.keys(results)
        resultsKeys.sort((v1, v2) => results[v2] - results[v1]);

        return d('div.barChart',
            resultsKeys.map(partyKey => {
                let value = results[partyKey]
                let barScale = 100*value/this.props.barMax
                return d(`div.barContainer.${partyKey}`, { key: partyKey }, [
                    d('span.text', `${partyKey} ... ${value}`),
                    d('div.bar', { style: { width: barScale + '%' }})
                ])
            })
        )
    }
})


let SplitterForm = React.createClass({
    displayName: 'SplitterForm',

    render: function() {
        let toOptions = n => d('option', { key: n }, n)
        return d('form.splitForm', [
            d('label.percent', [
                d('select.percent', [0, 5, 10, 20, 50, 100].map(toOptions)),
                '% of',
            ]),
            d('label.from', [
                d('select.from', PARTIES.map(toOptions)),
                'voters went',
            ]),
            d('label.to', [
                d('select.to', PARTIES.map(toOptions)),
                'instead'
            ])
        ])
    }
})


let Sidebar = React.createClass({
    displayName: 'Sidebar',
    propTypes: {
        seatTotals: React.PropTypes.object.isRequired
    },

    render() {
        let results = this.props.seatTotals
        return d('aside', [
            d('h1', '2011 Vote Splitter'),
            d(BarChart, { dataMap: results, barMax: SEAT_COUNT }),
            d('h2', 'if...'),
            d(SplitterForm, {})
        ])
    }
})


let App = React.createClass({
    displayName: 'App',
    getInitialState() {
        return { seatTotals: {} }
    },

    handleChangedResults(seatTotals) {
        this.setState({ seatTotals: seatTotals })
    },

    render() {
        return d('div', [
            d(Sidebar, { seatTotals: seatTotals }),
            d(ElectionMap, { onResultsChange: this.handleChangedResults })
        ])
    }
})

React.render(d(App), document.body)
