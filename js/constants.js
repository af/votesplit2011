const PARTIES = 'CPC,NDP,LPC,BQ,GPC'.split(',')
const OTHER_PARTY = 'OTHER'

module.exports = {
    PARTIES,
    OTHER_PARTY,
    PARTIES_WITH_OTHER: [...PARTIES, OTHER_PARTY],
    SEAT_COUNT: 308,

    // Mapping of names to zoom instructions
    ZOOM_FEATURES: {
        Canada:     { id: null, scale: 1 },
        Vancouver:  { id: 59032, scale: 17 },
        Calgary:    { id: 48006, scale: 17 },
        Edmonton:   { id: 48018, scale: 17 },
        Winnipeg:   { id: 46011, scale: 14 },
        Toronto:    { id: 35106, scale: 18 },
        Montreal:   { id: 24003, scale: 16 },
    }
}
