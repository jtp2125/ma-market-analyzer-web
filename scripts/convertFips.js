import fs from 'fs';
import csv from 'csvtojson';

const stateMap = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
  IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  AS: "American Samoa", GU: "Guam", MP: "Northern Mariana Islands", PR: "Puerto Rico",
  UM: "U.S. Minor Outlying Islands", VI: "U.S. Virgin Islands"
};

csv()
  .fromFile('src/data/FIPS_Mapping.csv')
  .then((rows) => {
    const output = rows
      .filter(r => r.STATEFP && r.COUNTYFP) // drop empty
      .map(r => ({
        fips: r.STATEFP.padStart(2, '0') + r.COUNTYFP.padStart(3, '0'),
        state: r.STATE,
        state_name: stateMap[r.STATE] || r.STATE,
        county_name: r.COUNTYNAME
      }))
      .filter((v, i, arr) => arr.findIndex(t => t.fips === v.fips) === i) // dedupe
      .sort((a, b) => a.state_name.localeCompare(b.state_name) || a.county_name.localeCompare(b.county_name));

    fs.writeFileSync('src/data/fipsMapping.json', JSON.stringify(output, null, 2));
    console.log(`✅ Wrote ${output.length} entries to src/data/fipsMapping.json`);
  });
