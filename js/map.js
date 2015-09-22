'use strict'

import d3 from 'd3'
import React from 'react'
import jsnox from 'jsnox'
const d = jsnox(React)
import { ZOOM_FEATURES } from './constants'

const WIDTH = Math.max(300, window.innerWidth)
const HEIGHT = Math.max(400, window.innerHeight)
const SIDEBAR_WIDTH = 300           // Duplicated from CSS unfortunately
const IS_PORTRAIT = HEIGHT > WIDTH
const DEFAULT_TRANSLATE = [WIDTH / 2, Math.min(HEIGHT, WIDTH)]


export default React.createClass({
    displayName: 'ElectionMap',
    propTypes: {
        districts: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
        selectedDistrictId: React.PropTypes.number,
        onDistrictSelected: React.PropTypes.func.isRequired
    },

    componentDidMount() {
        let svgNode = this.refs.svg.getDOMNode()
        svgNode.appendChild(document.querySelector('svg.pattern defs'))     // FIXME: ugly hack

        this.svg = d3.select(svgNode)
        this.vizRoot = this.svg.append('g').attr('class', 'container')
        this.projection = d3.geo.albers()
                                .scale(IS_PORTRAIT ? WIDTH : WIDTH - SIDEBAR_WIDTH)
                                .translate(DEFAULT_TRANSLATE)
        this.pathProjection = d3.geo.path().projection(this.projection)

        this.zoomer = d3.behavior.zoom()
                       .translate([0,0])
                       .size([WIDTH, HEIGHT])
                       .scale(1)
                       .scaleExtent([1, 20])
        this.zoomer.on('zoom', () => {
            let evt = d3.event
            this.vizRoot.attr('transform', `translate(${evt.translate})scale(${evt.scale})`)
        })
        this.svg.call(this.zoomer)

        if (this.props.districts) this.drawDistricts(this.props.districts)
    },

    // Zoom to a specific district, using a key into ZOOM_FEATURES
    // See http://bl.ocks.org/mbostock/4699541
    zoomToFeature(evt) {
        var zoomTarget = ZOOM_FEATURES[evt.target.value]
        if (!zoomTarget || !zoomTarget.id) {
            // Handle "Canada" case, as well as any invalid value, by
            // zooming all the way out:
            return this.svg.transition().duration(1000).call(
                this.zoomer.translate([0, 0]).scale(1).event
            )
        }

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
                let battlegroundClass = d.properties.isBattleground ? 'battleground' : ''
                return `district ${d.properties.winner.name} ${selectedClass}
                        ${battlegroundClass} id_${d.properties.districtId}`
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
        return d('div.mapWrap',
            d('div.zoomControls',
                'Zoom to: ',
                d('select',
                    { onChange: this.zoomToFeature },
                    Object.keys(ZOOM_FEATURES).map((k) => d('option', { key: k }, k))
                )
            ),
            d('svg.mapRoot@svg', { width: WIDTH, height: height })
        )
    }
})
