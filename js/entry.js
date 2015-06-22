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
        districts: React.PropTypes.arrayOf(React.PropTypes.object),
        onResultsChange: React.PropTypes.func.isRequired
    },

    componentDidMount() {
        let svg = d3.select(this.getDOMNode())
        this.vizRoot = svg.append('g').attr('class', 'container')
        this.projection = d3.geo.albers().translate([WIDTH / 2, HEIGHT])
        this.pathProjection = d3.geo.path().projection(this.projection)

        svg.call(d3.behavior.zoom().scaleExtent([1, 20]).on('zoom', () => {
            let evt = d3.event
            this.vizRoot.attr('transform', `translate(${evt.translate})scale(${evt.scale})`)
        }))
    },

    // Don't ever re-render the svg element, but redraw the districts if the
    // input data has changed.
    shouldComponentUpdate(nextProps) {
        let shouldRedraw = (nextProps.districts !== this.props.districts)
        if (shouldRedraw) this.drawDistricts(nextProps.districts)
        return false
    },

    drawDistricts(districts) {
        let paths = this.vizRoot.selectAll('.district').data(districts)

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
            .attr('d', this.pathProjection)
                .append('title').text(d => d.properties.districtName)

        this.props.onResultsChange(seatTotals)
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

    handleChange() {
        let split = {
            from: this.refs.from.getDOMNode().value,
            to: this.refs.to.getDOMNode().value,
            percent: +this.refs.percent.getDOMNode().value
        }
        console.log(split)
    },

    render() {
        let arrayToOptions = n => d('option', { key: n }, n)
        let selectProps = { onChange: this.handleChange }
        let percentChoices = [0, 5, 10, 20, 50, 100]

        return d('form.splitForm', [
            d('label.percent', [
                d('select@percent', selectProps, percentChoices.map(arrayToOptions)),
                '% of',
            ]),
            d('label.from', [
                d('select@from', selectProps, PARTIES.map(arrayToOptions)),
                'voters went',
            ]),
            d('label.to', [
                d('select@to', selectProps, PARTIES.map(arrayToOptions)),
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
        return { seatTotals: {}, districts: null }
    },

    componentDidMount() {
        d3.json('districts.topojson', (error, canada) => {
            if (error) return console.error(error)
            this.setState({
                districts: topojson.feature(canada, canada.objects.gfed000b11a_e).features
            })
        })
    },

    handleChangedResults(seatTotals) {
        this.setState({ seatTotals: seatTotals })
    },

    render() {
        return d('div', [
            d(Sidebar, { seatTotals: seatTotals }),
            d(ElectionMap, {
                districts: this.state.districts,
                onResultsChange: this.handleChangedResults
            })
        ])
    }
})

React.render(d(App), document.body)
