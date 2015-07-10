'use strict'

let d3 = require('d3')
let React = require('react')
let d = require('jsnox')(React)
let topojson = require('topojson')
let TimeoutTransitionGroup = require('timeout-transition-group')
require('array.prototype.find')     // polyfill


const WIDTH = Math.min(1440, window.innerWidth)
const HEIGHT = Math.max(400, window.innerHeight)
const PARTIES = 'CPC,NDP,LPC,BQ,GPC'.split(',')
const SEAT_COUNT = 308
let shallowClone = o => {
    let newObj = {}
    for (let x in o) newObj[x] = o[x]
    return newObj
}


let ElectionMap = React.createClass({
    displayName: 'ElectionMap',
    propTypes: {
        districts: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
        selectedDistrictId: React.PropTypes.number,
        onDistrictSelected: React.PropTypes.func.isRequired
    },

    componentDidMount() {
        let svg = d3.select(this.getDOMNode())
        this.vizRoot = svg.append('g').attr('class', 'container')
        this.projection = d3.geo.albers()
                                .scale(WIDTH)
                                .translate([WIDTH / 2, HEIGHT])
        this.pathProjection = d3.geo.path().projection(this.projection)

        svg.call(d3.behavior.zoom().scaleExtent([1, 20]).on('zoom', () => {
            let evt = d3.event
            this.vizRoot.attr('transform', `translate(${evt.translate})scale(${evt.scale})`)
        }))
        if (this.props.districts) this.drawDistricts(this.props.districts)
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
            .attr('opacity', d => {
                return d.properties[d.properties.winner.name]/d.properties.totalVotes
            })
            .attr('class', d => {
                let isSelected = (d.properties.districtId === this.props.selectedDistrictId)
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
        let shouldDeselect = (this.props.selectedDistrictId === id)
        this.props.onDistrictSelected(shouldDeselect ? null : districtData)
        return this.props.selectedDistrictId
    },

    render() {
        return d('svg', { width: WIDTH, height: HEIGHT })
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
                    d('span.total', value),
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
        splitObj: React.PropTypes.shape({
            from: React.PropTypes.oneOf(PARTIES).isRequired,
            to: React.PropTypes.oneOf(PARTIES).isRequired,
            percent: React.PropTypes.number.isRequired
        }),
        changeCallback: React.PropTypes.func.isRequired
    },

    handleChange() {
        const split = {
            from: this.refs.from.getDOMNode().value,
            to: this.refs.to.getDOMNode().value,
            percent: +this.refs.percent.getDOMNode().value
        }
        if (split.from !== split.to) this.props.changeCallback(split)
    },

    render() {
        let arrayToOptions = n => d('option', { key: n }, n)
        let onChange = this.handleChange
        const percentChoices = [0, 5, 10, 20, 50, 100]
        const split = this.props.splitObj || {}

        return d('form.splitForm', [
            d('label.percent', [
                d('select@percent',
                    { onChange, value: split.percent },
                    percentChoices.map(arrayToOptions)
                ),
                '% of',
            ]),
            d('label.from', [
                d('select@from', { onChange, value: split.from }, PARTIES.map(arrayToOptions)),
                'voters went',
            ]),
            d('label.to', [
                d('select@to', { onChange, value: split.to || PARTIES[1] }, PARTIES.map(arrayToOptions)),
                'instead'
            ])
        ])
    }
})


// Top level "controller-view" for the app
let App = React.createClass({
    displayName: 'App',
    getInitialState() {
        return {
            isLoaded: false,
            seatTotals: null,
            districts: null,
            selectedDistrictId: null,
            originalDistricts: null,
            splitObj: null
        }
    },

    // Set initial app state based on location.hash
    getStateFromHash(hash) {
        let match = hash.match(/split=(\w{2,3})-(\d{1,3})-(\w{2,3})(?:&select=(\d+))?/)
        if (!match) return {}

        // For the "fullMatch" throwaway variable:
        // jshint unused:false
        let [fullMatch, from, percent, to, selectedDistrict] = match
        percent = Math.min(Math.max(+percent, 0), 100)    // 0 < percent < 100
        return {
            splitObj: { from, percent, to },
            selectedDistrictId: +selectedDistrict || null
        }
    },

    componentDidMount() {
        let initialState = this.getStateFromHash(location.hash)

        d3.json('districts.topojson', (error, canada) => {
            if (error) return console.error(error)

            let districts = topojson.feature(canada, canada.objects.gfed000b11a_e).features
            initialState.originalDistricts = districts
            this.setState(initialState)
            this.computeVotes(this.state.splitObj)
        })
    },

    computeVotes(splitObj, districts) {
        // Clone the districts arrays so we don't overwrite the original data:
        let seatTotals = {}
        const actualVotes = this.state.originalDistricts.map(d => shallowClone(d.properties))
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

        this.setState({ splitObj, seatTotals, districts, isLoaded: true })
    },

    onSplitChange(splitObj) {
        this.computeVotes(splitObj, this.state.districts)
        this.updateHash({ splitObj, selectedDistrictId: this.state.selectedDistrictId })
    },

    updateHash({ splitObj, selectedDistrictId }) {
        if (!splitObj) return
        let hash = `split=${splitObj.from}-${splitObj.percent}-${splitObj.to}`
        if (selectedDistrictId) hash += `&select=${selectedDistrictId}`
        location.hash = hash
    },

    render() {
        if (!this.state.isLoaded) return d('div.loading', 'Loading election data...')

        const districts = this.state.districts || []
        const selectedId = this.state.selectedDistrictId
        const selected = (districts || []).find(d => d.properties.districtId === selectedId)

        return d('div', [
            d('aside', [
                d('section.results', [
                    d('h1', '2011 Vote Splitter'),
                    this.state.seatTotals && d(BarChart, { dataMap: this.state.seatTotals, barMax: SEAT_COUNT }),
                    d('h2', 'if...'),
                    d(SplitterForm, {
                        splitObj: this.state.splitObj,
                        changeCallback: this.onSplitChange
                    }),
                ]),
                d(TimeoutTransitionGroup, {
                    enterTimeout: 400,
                    leaveTimeout: 400,
                    transitionName: 'sidebar',
                    component: 'div'
                }, [
                    selected && d('section.selected', [
                        d(DistrictInfo, { district: selected.properties })
                    ])
                ])
            ]),
            d(ElectionMap, {
                districts: districts,
                selectedDistrictId: this.state.selectedDistrictId,
                onDistrictSelected: data => {
                    let id = data ? data.districtId : null
                    this.setState({ selectedDistrictId: id }, () => {
                        this.updateHash(this.state)
                    })
                }
            })
        ])
    }
})

React.render(d(App), document.body)
