# 2011 Canadian Election map

Very much a work in progress.


## Generating TopoJSON

First, download and unzip the data from
http://geogratis.gc.ca/api/en/nrcan-rncan/ess-sst/6d1d8f90-1c25-5fd0-880d-138d27c8cb57.html

Then run the following (you may need to run `brew install gdal` and
`npm install topojson` first):

```
ogr2ogr -f GeoJSON -t_srs EPSG:4326 election_districts.json FED_CA_1.0_0_ENG.shp
topojson -o election_districts.topojson election_districts.json
```

The resulting file is not ideal (a big, slow, 900kB file), but it works.
Need to figure out how to slim it down.


## Running locally

```
npm install
npm run watch
```

And then visit `localhost:8080` in your browser.


## Sources

* Election boundary topojson via
https://github.com/opennorth/represent-canada-data/blob/master/topojson/fed_ed_federal_electoral_districts.topojson
