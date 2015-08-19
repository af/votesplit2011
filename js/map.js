'use strict'

let d3 = require('d3')
let React = require('react')
let d = require('jsnox')(React)

const WIDTH = Math.min(1440, window.innerWidth)
const HEIGHT = Math.max(400, window.innerHeight)


module.exports = React.createClass({
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
                return 1.5 * d.properties[d.properties.winner.name]/d.properties.totalVotes
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
