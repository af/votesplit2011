const PARTIES = 'CPC,NDP,LPC,BQ,GPC'.split(',')
const SEAT_COUNT = 308

// Export a version of PARTIES with an 'OTHER' option
const OTHER_PARTY = 'OTHER'
let PARTIES_WITH_OTHER = PARTIES.slice()
PARTIES_WITH_OTHER.push(OTHER_PARTY)

module.exports = { PARTIES, PARTIES_WITH_OTHER, OTHER_PARTY, SEAT_COUNT }
