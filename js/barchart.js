'use strict'

import React from 'react'
import jsnox from 'jsnox'
const d = jsnox(React)
import { PARTIES_WITH_OTHER, OTHER_PARTY } from './constants'


module.exports = React.createClass({
    displayName: 'BarChart',
    propTypes: {
        dataMap: React.PropTypes.object.isRequired,
        barMax: React.PropTypes.number.isRequired,
        markers: React.PropTypes.object,
        showOther: React.PropTypes.bool,
        onZeroValue: React.PropTypes.func
    },

    renderSingleBar(results, partyKey) {
        const { barMax, markers, onZeroValue, showOther } = this.props
        const value = results[partyKey] || 0
        const barScale = 100*value/barMax
        const logo = require(`../assets/logos/${partyKey}.svg`)
        const isMajority = value >= (barMax / 2)

        if (!showOther && partyKey === OTHER_PARTY) return null
        if (!value && onZeroValue) return onZeroValue()
        return d(`div.barContainer.${partyKey}^`,
            d('img.logo', { src: logo, alt: partyKey }),
            d('span.total', value),
            d('div.barWrap',
                d('div.bar', { style: { width: barScale + '%' }}),
                isMajority && d('div.majority', 'Majority'),
                markers && d('div.marker', {
                    style: { left: 100*markers[partyKey]/barMax + '%' },
                    title: 'Actual 2011 result: ' + markers[partyKey]
                })
            )
        )
    },

    render() {
        const { dataMap } = this.props
        if (!dataMap) return d('div.barChart');

        const renderItem = this.renderSingleBar.bind(this, dataMap)
        return d('div.barChart', PARTIES_WITH_OTHER.map(renderItem))
    }
})
