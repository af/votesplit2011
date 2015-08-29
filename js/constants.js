const PARTIES = 'CPC,NDP,LPC,BQ,GPC'.split(',')
const SEAT_COUNT = 308

// Export a version of PARTIES with an 'OTHER' option
const OTHER_PARTY = 'OTHER'
let PARTIES_WITH_OTHER = PARTIES.slice()
PARTIES_WITH_OTHER.push(OTHER_PARTY)

// Mapping of names to zoom instructions
const ZOOM_FEATURES = {
    Canada:     { id: null, scale: 1 },
    Vancouver:  { id: 59032, scale: 17 },
    Calgary:    { id: 48006, scale: 17 },
    Edmonton:   { id: 48018, scale: 17 },
    Winnipeg:   { id: 46011, scale: 14 },
    Toronto:    { id: 35106, scale: 18 },
    Montreal:   { id: 24003, scale: 16 },
}

module.exports = { PARTIES, PARTIES_WITH_OTHER, OTHER_PARTY, SEAT_COUNT, ZOOM_FEATURES }
