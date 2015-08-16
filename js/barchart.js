'use strict'

const React = require('react')
const d = require('jsnox')(React)
const { PARTIES_WITH_OTHER, OTHER_PARTY } = require('./constants')


module.exports = React.createClass({
    displayName: 'BarChart',
    propTypes: {
        dataMap: React.PropTypes.object.isRequired,
        barMax: React.PropTypes.number.isRequired,
        showOther: React.PropTypes.bool,
        onZeroValue: React.PropTypes.func
    },

    renderSingleBar(results, partyKey) {
        const { barMax, onZeroValue, showOther } = this.props
        const value = results[partyKey] || 0
        const barScale = 100*value/barMax
        const logo = require(`../assets/logos/${partyKey}.svg`)

        if (!showOther && partyKey === OTHER_PARTY) return null
        if (!value && onZeroValue) return onZeroValue()
        return d(`div.barContainer.${partyKey}`, [
            d('img.logo', { src: logo, alt: partyKey }),
            d('span.total', value),
            d('div.bar', { style: { width: barScale + '%' }})
        ])
    },

    render() {
        const { dataMap } = this.props
        if (!dataMap) return d('div.barChart');

        const renderItem = this.renderSingleBar.bind(this, dataMap)
        return d('div.barChart', PARTIES_WITH_OTHER.map(renderItem))
    }
})


