// Parse Elections Canada election results csv to a more useful csv output:
//  * one record per riding
//  * only track the major parties
//  * save the electoral district {name, id, totalVotes} as well
//
//  Usage (see README for description of how to get full-results.csv):
//  node csv_consolidator.js full-results.csv > simplified-results.csv
var csv = require('fast-csv')

var INPUT_FILE = process.argv[2]        // TODO: validate path to csv file
var PARTIES = {     // The parties whose data we're interested in
    'Conservative':             'CPC',
    'NDP-New Democratic Party': 'NDP',
    'Liberal':                  'LPC',
    'Green Party':              'GPC',
    'Bloc Québécois':           'BQ'
};

var log = console.error.bind(console)   // utility for logging to stderr
var currentDistrictTotals = {}
var currentDistrict = null              // will take form of { name, id }
var outputStream = csv.createWriteStream({
    headers: true,
    includeEndRowDelimiter: true,
    encoding: 'utf8'
})
outputStream.pipe(process.stdout)


// Write the current vote totals to the csv output
function flushDistrict() {
    // Get a total of all votes cast in the riding:
    var allParties = Object.keys(currentDistrictTotals)
    var totalVotes = allParties.reduce(function(sum, name) {
        return sum + currentDistrictTotals[name]
    }, 0)

    var attrs = {
        districtId: currentDistrict.id,
        districtName: currentDistrict.name,
        totalVotes: totalVotes
    };

    // Add each of the major parties' vote counts to the record for this riding:
    Object.keys(PARTIES).forEach(function(p) {
        var shortName = PARTIES[p]
        attrs[shortName] = currentDistrictTotals[p] || 0
    })

    outputStream.write(attrs)
}

// TODO: add total votes column
csv.fromPath(INPUT_FILE)
    .on('data', function(data) {
        var isDataRow = !!parseInt(data[0])     // Skip header row (assume integer ids)
        var isVoid = (data[5] === 'Y')
        var noPollHeld = (data[6] === 'Y')
        if (!isDataRow || isVoid || noPollHeld) return

        var id = data[0]
        var name = data[1]
        if (!currentDistrict) currentDistrict = { id: id, name: name }
        if (id !== currentDistrict.id) {
            // We encountered a new riding; flush the old one's totals:
            flushDistrict()
            log(currentDistrict.name)

            // Start counting for the new district
            currentDistrict.id = id
            currentDistrict.name = name
            currentDistrictTotals = {}
        }

        var partyName = data[13]
        var numVotes = data[17]
        if (!currentDistrictTotals[partyName]) currentDistrictTotals[partyName] = 0
        currentDistrictTotals[partyName] += parseInt(numVotes)
    })
    .on('end', flushDistrict)
