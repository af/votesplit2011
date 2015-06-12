# 2011 Canadian Election map

Very much a work in progress.

TODO
* the `-p` in the topojson command will preserve *all* properties in the
output, but we will want to slim those down eventually.
* join the topojson properties with a csv of election results
* try alternate projections to see geojson filesize difference. (The .prj file
contains projection details)


## Generating Election results CSV

* Download [this zip
file](http://www.elections.ca/scripts/OVR2011/34/data_donnees/pollresults_resultatsbureau_canada.zip)
with full riding-by-riding results from Elections Canada (it's linked [from
here](http://www.elections.ca/scripts/resval/ovr_41ge.asp?prov=&lang=e)).

* Join all of the poll results csv files into one mega-csv with `cat pollresults_* > joined.csv`
* Convert this csv's encoding from `iso-8859-1` to `utf8` with
  `iconv -f iso-8859-1 -t utf-8 joined.csv > joined-utf8.csv`

* We need to cut out a lot of fat from this csv, and sum up each riding's totals.
  Run `data_munging/csv_consolidator.js joined.csv > trimmed_results.csv` (you may need
  to bring `joined.csv` into the same directory, of course).


## Generating Map TopoJSON

First, download and unzip the shapefile from
https://www12.statcan.gc.ca/census-recensement/2011/geo/bound-limit/bound-limit-2011-eng.cfm

You'll want to choose "Federal Electoral Districts" and "Cartographic Boundary File"

Then run the following (you may need to run `npm install topojson` first):

```
topojson -p --simplify-proportion 0.5 -q 3000 -o election_districts.topojson gfed000b11a_e.shp
```

The [topojson CLI reference](https://github.com/mbostock/topojson/wiki/Command-Line-Reference)
has more tips that can likely improve the output further.


## Running locally

```
npm install
npm run watch
```

And then visit `localhost:8080` in your browser.


## Misc links and alternate data sources

* Alternate Election boundary topojson:
https://github.com/opennorth/represent-canada-data/blob/master/topojson/fed_ed_federal_electoral_districts.topojson

* Alternate (slightly less useful) data source:
http://geogratis.gc.ca/api/en/nrcan-rncan/ess-sst/6d1d8f90-1c25-5fd0-880d-138d27c8cb57.html

* https://en.wikipedia.org/wiki/Results_by_riding_of_the_Canadian_federal_election,_2011
* http://www.elections.ca/res/cir/maps/images/ERMap_41.pdf
* http://www.cbc.ca/news2/politics/canadavotes2011/
* https://www.sfu.ca/~aheard/elections/results.html
