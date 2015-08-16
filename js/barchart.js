'use strict'

let React = require('react')
let d = require('jsnox')(React)
const { PARTIES } = require('./constants')


module.exports = React.createClass({
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
                let logo = require(`../assets/logos/${partyKey}.svg`)

                if (!value && this.props.onZeroValue) return this.props.onZeroValue()
                return d(`div.barContainer.${partyKey}`, [
                    d('img.logo', { src: logo, alt: partyKey }),
                    d('span.total', value),
                    d('div.bar', { style: { width: barScale + '%' }})
                ])
            })
        )
    }
})


