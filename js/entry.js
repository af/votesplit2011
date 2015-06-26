let d3 = require('d3')
let React = require('react')
let d = require('jsnox')(React)
let topojson = require('topojson')

// Polyfill for the ES6 method. In theory, shouldn't need this with babel,
// but see https://github.com/babel/babel/issues/892
let polyfillFind = typeof Array.prototype.find !== 'function'
if (polyfillFind) Array.prototype.find = function(cb) {
    for (var i=0, l=this.length; i<l; i++) {
        if (cb(this[i])) return this[i]
    }
}

const WIDTH = Math.max(900, window.innerWidth)
const HEIGHT = Math.max(400, window.innerHeight)
const PARTIES = 'CPC,NDP,LPC,BLC,GRN'.split(',')
const SEAT_COUNT = 308
let shallowClone = o => {
    let newObj = {}
    for (let x in o) newObj[x] = o[x]
    return newObj
}


let ElectionMap = React.createClass({
    displayName: 'ElectionMap',
    propTypes: {
        districts: React.PropTypes.arrayOf(React.PropTypes.object),
        onDistrictSelected: React.PropTypes.func
    },
    getInitialState() { return { selectedDistrictId: null } },

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
        let component = this
        let paths = this.vizRoot.selectAll('.district')
                        .data(districts, d => d.properties.districtId)

        paths.enter().insert('path')
        paths
            .attr('vector-effect', 'non-scaling-stroke')
            .attr('d', this.pathProjection)
            .attr('class', d => {
                let isSelected = (d.properties.districtId === this.state.selectedDistrictId)
                let selectedClass = isSelected ? 'selected' : ''
                return `district ${d.properties.winner.name} ${selectedClass}`
            })
            .on('click', function(d) {
                let selectedId = component.selectDistrict(d.properties)
                let deselect = (selectedId === null)
                d3.selectAll('.district').classed('selected', false)
                d3.select(this).classed('selected', !deselect)
            })
            .append('title').text(d => d.properties.districtName)
    },

    selectDistrict(districtData) {
        let id = districtData.districtId
        let shouldDeselect = (this.state.selectedDistrictId === id)
        if (this.props.onDistrictSelected) {
            this.props.onDistrictSelected(shouldDeselect ? null : districtData)
        }
        this.setState({
            selectedDistrictId: shouldDeselect ? null : id
        })
        return this.state.selectedDistrictId
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
        barMax: React.PropTypes.number.isRequired,
        onZeroValue: React.PropTypes.func
    },

    render() {
        let results = this.props.dataMap
        if (!results) return d('div.barChart');

        return d('div.barChart',
            PARTIES.map(partyKey => {
                let value = results[partyKey] || 0
                let barScale = 100*value/this.props.barMax

                if (!value && this.props.onZeroValue) return this.props.onZeroValue()
                return d(`div.barContainer.${partyKey}`, [
                    d('img.logo', { src: `/logos/${partyKey}.svg`, alt: partyKey }),
                    d('span.total', '' + value),        // FIXME: jsnox number treatment
                    d('div.bar', { style: { width: barScale + '%' }})
                ])
            })
        )
    }
})


let DistrictInfo = React.createClass({
    displayName: 'DistrictInfo',
    propTypes: {
        district: React.PropTypes.object.isRequired
    },

    render: function() {
        let name = this.props.district.districtName.replace(/--/g, '—')
        return d('div.districtInfo', [
            d('h2', name),
            d(BarChart, {
                dataMap: this.props.district,
                barMax: 60000,
                onZeroValue: () => null     // Don't render bars where there are no votes
            })
        ])
    }
})


let SplitterForm = React.createClass({
    displayName: 'SplitterForm',
    propTypes: {
        changeCallback: React.PropTypes.func.isRequired
    },

    handleChange() {
        let split = {
            from: this.refs.from.getDOMNode().value,
            to: this.refs.to.getDOMNode().value,
            percent: +this.refs.percent.getDOMNode().value
        }
        if (split.from !== split.to) this.props.changeCallback(split)
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


let App = React.createClass({
    displayName: 'App',
    getInitialState() {
        return {
            seatTotals: null,
            districts: null,
            selectedDistrictId: null,
            originalDistricts: null,
            splitObj: null
        }
    },

    componentDidMount() {
        d3.json('districts.topojson', (error, canada) => {
            if (error) return console.error(error)

            let districts = topojson.feature(canada, canada.objects.gfed000b11a_e).features
            this.setState({ originalDistricts: districts })
            this.computeVotes()
        })
    },

    computeVotes(splitObj, districts) {
        // Clone the districts arrays so we don't overwrite the original data:
        let seatTotals = {}
        let actualVotes = this.state.originalDistricts.map(d => shallowClone(d.properties))
        districts = districts || this.state.originalDistricts.map(d => shallowClone(d))

        districts = districts.map((d, idx) => {
            // Apply the vote split:
            let votes = actualVotes[idx]
            if (splitObj && votes[splitObj.to]) { // Assume no candidate in riding if 0 votes
                let splitAmount = Math.round((splitObj.percent * votes[splitObj.from]) / 100)
                votes[splitObj.to] = votes[splitObj.to] + splitAmount
                votes[splitObj.from] = votes[splitObj.from] - splitAmount
            }

            let winReducer = (max, next) => next.votes > max.votes ? next : max
            let winner = PARTIES.map(party => ({ name: party, votes: votes[party] }))
                                .reduce(winReducer, { votes: 0 })
            d.properties = votes
            d.properties.winner = winner
            seatTotals[winner.name] = seatTotals[winner.name] + 1 || 1
            return d
        })

        this.setState({ seatTotals, districts })
    },

    render() {
        let districts = this.state.districts || []
        let selectedId = this.state.selectedDistrictId
        let selected = (districts || []).find(d => d.properties.districtId === selectedId)

        return d('div', [
            d('aside', [
                d('h1', '2011 Vote Splitter'),
                d(BarChart, { dataMap: this.state.seatTotals, barMax: SEAT_COUNT }),
                d('h2', 'if...'),
                d(SplitterForm, {
                    changeCallback: (split) => this.computeVotes(split, districts)
                }),
                selectedId && d(DistrictInfo, { district: selected.properties })
            ]),
            d(ElectionMap, {
                districts: districts,
                onDistrictSelected: data => this.setState({ selectedDistrictId: data.districtId })
            })
        ])
    }
})

React.render(d(App), document.body)
