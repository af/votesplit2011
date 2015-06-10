var assign = require('object-assign')
var csv = require('fast-csv')

var currentTotals = {}
var currentDistrict = ''
var outputStream = csv.createWriteStream({ headers: true })
outputStream.pipe(process.stdout)

// Write the current vote totals to the csv output
function flush() {
    var attrs = assign({
        districtId: currentDistrict,
        //districtName: data[1]     // FIXME
    }, currentTotals)
    outputStream.write(attrs)
}

csv.fromPath('test.csv')
    .on('data', function(data) {
        var isDataRow = !!parseInt(data[0])     // Skip header row (assume integer ids)
        var isVoid = (data[5] === 'Y')
        var noPollHeld = (data[6] === 'Y')
        if (!isDataRow || isVoid || noPollHeld) return

        var id = data[0]
        if (!currentDistrict) currentDistrict = id      // For the first data row
        if (id !== currentDistrict) {
            // We encountered a new district; flush the old district's totals:
            flush()

            // Start counting for the new district
            currentDistrict = id
            currentTotals = {}
        }

        var partyName = data[13]
        var numVotes = data[17]
        if (!currentTotals[partyName]) currentTotals[partyName] = 0
        currentTotals[partyName] += parseInt(numVotes)
    })
    .on('end', function() {
        flush()
        console.log('...done')
    });
