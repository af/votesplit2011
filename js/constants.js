const PARTIES = 'CPC,NDP,LPC,BQ,GPC'.split(',')
const SEAT_COUNT = 308

// Export a version of PARTIES with an 'OTHER' option
const OTHER_PARTY = 'OTHER'
let PARTIES_WITH_OTHER = PARTIES.slice()
PARTIES_WITH_OTHER.push(OTHER_PARTY)

// Mapping of names to zoom instructions
const ZOOM_FEATURES = {
    Canada: { id: null, scale: 1 },
    Montreal: { id: 24003, scale: 15 },
    Toronto: { id: 35106, scale: 17 }
}

module.exports = { PARTIES, PARTIES_WITH_OTHER, OTHER_PARTY, SEAT_COUNT, ZOOM_FEATURES }
