'use strict'

let d3 = require('d3')
let React = require('react')
let d = require('jsnox')(React)
let { ZOOM_FEATURES } = require('./constants')

const WIDTH = Math.max(300, window.innerWidth)
const HEIGHT = Math.max(400, window.innerHeight)
const SIDEBAR_WIDTH = 300           // Duplicated from CSS unfortunately
const IS_PORTRAIT = HEIGHT > WIDTH
const DEFAULT_TRANSLATE = [WIDTH / 2, Math.min(HEIGHT, WIDTH)]


module.exports = React.createClass({
    displayName: 'ElectionMap',
    propTypes: {
        districts: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
        selectedDistrictId: React.PropTypes.number,
        onDistrictSelected: React.PropTypes.func.isRequired
    },

    componentDidMount() {
        this.svg = d3.select(this.getDOMNode())
        this.vizRoot = this.svg.append('g').attr('class', 'container')
        this.projection = d3.geo.albers()
                                .scale(IS_PORTRAIT ? WIDTH : WIDTH - SIDEBAR_WIDTH)
                                .translate(DEFAULT_TRANSLATE)
        this.pathProjection = d3.geo.path().projection(this.projection)

        this.zoomer = d3.behavior.zoom()
                       .translate([0,0])
                       .size([WIDTH, HEIGHT])
                       .center([WIDTH/2, HEIGHT/2])
                       .scale(1)
                       .scaleExtent([1, 20])
        this.zoomer.on('zoom', () => {
            let evt = d3.event
            this.vizRoot.attr('transform', `translate(${evt.translate})scale(${evt.scale})`)
        })
        this.svg.call(this.zoomer)

        // FIXME
        setTimeout(() => this.zoomToFeature(ZOOM_FEATURES.Toronto), 3000)
        setTimeout(() => this.zoomToFeature(ZOOM_FEATURES.Montreal), 6000)

        if (this.props.districts) this.drawDistricts(this.props.districts)
    },

    zoomToFeature(zoomTarget) {
        // WIP, see http://bl.ocks.org/mbostock/4699541
        // TODO: handle null case
        let d = d3.select('.id_' + zoomTarget.id).data()[0]     // Gotta be a better way...
        let bounds = this.pathProjection.bounds(d)
        let [x, y] = [bounds[0][0], bounds[0][1]]       // Use top-left corner for simplicity
        let scale = zoomTarget.scale
        let translation = [WIDTH/2 - scale*x, HEIGHT/2 - scale*y]
        let zoomEvt = this.zoomer.translate(translation).scale(scale).event
        this.svg.transition().duration(1000).call(zoomEvt);
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
                return `district ${d.properties.winner.name} ${selectedClass} id_${d.properties.districtId}`
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
        const height = IS_PORTRAIT ? Math.min(HEIGHT, WIDTH) : HEIGHT
        return d('svg.mapRoot', { width: WIDTH, height: height })
    }
})
