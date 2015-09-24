'use strict'

import 'babel/polyfill'
import './analytics'
import d3 from 'd3'
import React from 'react'
import topojson from 'topojson'
import TimeoutTransitionGroup from 'timeout-transition-group'
import jsnox from 'jsnox'
const d = jsnox(React)

import ElectionMap from './map'
import BarChart from './barchart'
import { PARTIES, PROGRESSIVES, SEAT_COUNT, STRATEGIC } from './constants'

const shallowClone = o => {
    let newObj = {}
    for (let x in o) newObj[x] = o[x]
    return newObj
}


let DistrictInfo = React.createClass({
    displayName: 'DistrictInfo',
    propTypes: {
        district: React.PropTypes.object.isRequired
    },

    render: function() {
        const { district } = this.props
        const name = district.districtName.replace(/--/g, '—')

        let other = district.totalVotes
        for (let p of PARTIES) other -= (district[p] || 0)
        district.OTHER = other

        return d('div.districtInfo',
            d('h2', name),
            d(BarChart, {
                dataMap: district,
                barMax: district.totalVotes,    // Note: different scale across ridings
                showOther: true,
                onZeroValue: () => null     // Don't render bars where there are no votes
            })
        )
    }
})


let SplitterForm = React.createClass({
    displayName: 'SplitterForm',
    propTypes: {
        splitObj: React.PropTypes.shape({
            from: React.PropTypes.oneOf([...PARTIES, PROGRESSIVES.join(',')]).isRequired,
            to: React.PropTypes.oneOf([...PARTIES, STRATEGIC]).isRequired,
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
        this.props.changeCallback(split)
    },

    render() {
        const arrayToOptions = n => d('option', { key: n }, '' + n)
        const onChange = this.handleChange
        const percentChoices = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        const split = this.props.splitObj || {}
        const fromOptions = [...PARTIES, PROGRESSIVES].map(arrayToOptions)
        const toOptions = [...PARTIES, STRATEGIC].map(arrayToOptions)

        return d('form.splitForm',
            d('h3', 'Redistribute votes'),
            d('div.voteFlow',
                d('select@from', { onChange, value: split.from }, fromOptions),
                d('label.percent',
                    d('select@percent', { onChange, value: split.percent || 0 },
                        percentChoices.map(arrayToOptions)
                    ),
                    ' %'
                ),
                d('select@to', { onChange, value: split.to || PARTIES[1] }, toOptions)
            ),

            d('div.examples',
                d('h3', 'Examples: what if...'),
                d('a[href=#split=NDP-50-LPC]', 'Half of NDP voters went Liberal'),
                d('a[href=#split=LPC-50-NDP]', 'Half of Liberal voters went NDP'),
                d(`a[href=#split=GPC-100-${STRATEGIC}]`, 'All Greens voted strategically'),
                d('a[href=#]', '(reset to actual 2011 results)')
            )
        )
    }
})


// Top level "controller-view" for the app
let App = React.createClass({
    displayName: 'App',
    getInitialState() {
        return {
            isLoaded: false,
            seatTotals: null,
            actualTotals: null,
            districts: null,
            selectedDistrictId: null,
            originalDistricts: null,
            splitObj: null
        }
    },

    // Set initial app state based on location.hash
    getStateFromHash(hash) {
        let match = hash.match(/split=([\w,]{2,})-(\d{1,3})-(\w{2,})(?:&select=(\d+))?/)
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
        window.onhashchange = () => {
            let { splitObj } = this.getStateFromHash(location.hash)
            this.computeVotes(splitObj)
        }

        d3.json('./assets/districts.topojson', (error, canada) => {
            if (error) return console.error(error)

            let districts = topojson.feature(canada, canada.objects.gfed000b11a_e).features
            initialState.originalDistricts = districts
            this.setState(initialState)
            this.computeVotes(this.state.splitObj)
        })
    },

    computeVotes(splitObj, districts) {
        // Clone the districts arrays so we don't overwrite the original data,
        // and compute the vote totals and winner for each riding, based on a
        // split/redistribution object:
        const actualVotes = this.state.originalDistricts.map(d => shallowClone(d.properties))
        districts = districts || this.state.originalDistricts.map(d => shallowClone(d))
        districts = districts.map((d, idx) => this.computeRiding(d, actualVotes[idx], splitObj))

        // Figure out how many seats each party got, and if no split was applied,
        // also save the results as state.actualTotals:
        const seatTotals = districts.reduce((results, d) => {
            let winningParty = d.properties.winner.name
            results[winningParty] = (results[winningParty] + 1) || 1
            return results
        }, {})
        const saveActuals = (!this.state.actualTotals && (!splitObj || !splitObj.percent))
        const actualTotals = saveActuals ? seatTotals : this.state.actualTotals

        this.setState({ splitObj, seatTotals, actualTotals, districts, isLoaded: true })
    },

    computeRiding(district, votes, splitObj) {
        let boostedParty = splitObj && splitObj.to

        // If we're simulating "strategic" voting, find out which progressive party
        // had the best results in this riding, so we can boost its vote total:
        let preSorted = PARTIES.map(party => ({ name: party, votes: votes[party] }))
                               .sort((r1, r2) => (r1.votes > r2.votes) ? -1 : 1)
        let strategicChoice = preSorted.find(r => PROGRESSIVES.indexOf(r.name) > -1)
        if (boostedParty === STRATEGIC) boostedParty = strategicChoice.name

        let addRedistribution = (decreasedParty) => {
            let splitAmount = Math.round((splitObj.percent * votes[decreasedParty]) / 100)
            votes[boostedParty] = votes[boostedParty] + splitAmount
            votes[decreasedParty] = votes[decreasedParty] - splitAmount
        }

        if (splitObj && votes[boostedParty]) { // Assume no candidate in riding if 0 votes
            splitObj.from.split(',').forEach(addRedistribution)
        }

        var sortedResults = PARTIES.map(party => ({ name: party, votes: votes[party] }))
                                   .sort((r1, r2) => (r1.votes > r2.votes) ? -1 : 1)
        district.properties = votes
        district.properties.isBattleground = Math.abs(votes[strategicChoice.name] - votes.CPC) < votes.totalVotes * 0.1
        district.properties.winner = sortedResults[0]
        return district
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
        const FPTPlink = d('a', {
            target: '_blank',
            href: 'https://en.wikipedia.org/wiki/First-past-the-post_voting'
        }, 'FPTP')

        return d('div',
            d('aside',
                d('section.results',
                    d('h1', '2011 Vote Splitter'),
                    d('div.preamble', null,
                        `A common gripe about Canada's `, FPTPlink,
                        ` voting system is how the progressive vote is split
                         among several parties, giving the Conservatives
                         easy wins in many ridings. Use the form below to
                         redistribute votes from the 2011 election and see how
                         it would have affected the results.`
                    ),

                    d(SplitterForm, {
                        splitObj: this.state.splitObj,
                        changeCallback: this.onSplitChange
                    }),

                    d('h3.seatHeading', 'Seat Results'),
                    this.state.seatTotals && d(BarChart, {
                        dataMap: this.state.seatTotals,
                        barMax: SEAT_COUNT,
                        markers: this.state.actualTotals
                    })
                ),
                d(TimeoutTransitionGroup, {
                    enterTimeout: 400,
                    leaveTimeout: 400,
                    transitionName: 'sidebar',
                    component: 'div'
                }, selected && d('section.selected',
                        d('button.close', {
                            onClick: () => this.setState({ selectedDistrictId: null })
                        }),
                        d(DistrictInfo, { district: selected.properties })
                    )
                )
            ),
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
        )
    }
})

React.render(d(App), document.querySelector('.appContainer'))
