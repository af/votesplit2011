var assign = require('object-assign')
var csv = require('fast-csv')

var INPUT_FILE = process.argv[2]        // TODO: validate path to csv file
var currentTotals = {}
var currentDistrict = null              // will take form of { name, id }
var outputStream = csv.createWriteStream({
    headers: true,
    includeEndRowDelimiter: true,
    encoding: 'utf8'
})
outputStream.pipe(process.stdout)


// Write the current vote totals to the csv output
function flush() {
    var attrs = assign({
        districtId: currentDistrict.id,
        districtName: currentDistrict.name
    }, currentTotals)
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
            // We encountered a new district; flush the old district's totals:
            flush()
            console.error(currentDistrict.name)

            // Start counting for the new district
            currentDistrict.id = id
            currentDistrict.name = name
            currentTotals = {}
        }

        var partyName = data[13]
        var numVotes = data[17]
        if (!currentTotals[partyName]) currentTotals[partyName] = 0
        currentTotals[partyName] += parseInt(numVotes)
    })
    .on('end', flush)
