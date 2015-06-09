# 2011 Canadian Election map

Very much a work in progress.

TODO
* the `-p` in the topojson command will preserve *all* properties in the
output, but we will want to slim those down eventually.
* join the topojson properties with a csv of election results
* try alternate projections to see geojson filesize difference. (The .prj file
contains projection details)

## Generating TopoJSON

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


## Sources

* Alternate Election boundary topojson:
https://github.com/opennorth/represent-canada-data/blob/master/topojson/fed_ed_federal_electoral_districts.topojson

* Old (slightly less useful) data source:
http://geogratis.gc.ca/api/en/nrcan-rncan/ess-sst/6d1d8f90-1c25-5fd0-880d-138d27c8cb57.html

* https://en.wikipedia.org/wiki/Results_by_riding_of_the_Canadian_federal_election,_2011
* http://www.elections.ca/res/cir/maps/images/ERMap_41.pdf
* http://www.cbc.ca/news2/politics/canadavotes2011/
