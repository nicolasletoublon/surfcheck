// Beach configuration. Adding a beach is a one-line change here.
// region: which REGIONS entry it belongs to (the app shows one region at a time)
// facing: shoreline-normal bearing (direction the beach looks toward, °true)
// bestDir: swell from-direction that lights the beach up
// dirWidth: tolerance (°) around bestDir before exposure falls off
// expoBase: how much open-ocean swell reaches the lineup (0–1)
// cams: surfcam links, free/no-login ones first
export const REGIONS = [
  { id: 'sydney', name: 'Sydney',    sub: 'Eastern Suburbs & Northern Beaches' },
  { id: 'byron',  name: 'Byron Bay', sub: 'Cape Byron & Tallow' },
];

const RANDWICK_CAMS = 'https://www.randwick.nsw.gov.au/facilities-and-recreation/explore-randwick-city/beach-cams';
export const BEACHES = [
  { id: 'bondi',    name: 'Bondi',    region: 'sydney', lat: -33.8908, lon: 151.2743, facing: 135, bestDir: 150, dirWidth: 75, expoBase: 0.7,  notes: 'South end more protected; handles S swell well',
    cams: [
      { label: 'North Bondi SLSC (free)', url: 'https://northbondisurfclub.com/webcam/' },
      { label: 'Bondi SLSC (free)',       url: 'https://bondisurfclub.com/bondi-surf-cam/' },
    ] },
  { id: 'tamarama', name: 'Tamarama', region: 'sydney', lat: -33.9005, lon: 151.2703, facing: 120, bestDir: 130, dirWidth: 70, expoBase: 0.75, notes: 'Small bay, focuses swell, punchy shorebreak',
    cams: [
      { label: 'Swellnet (paid)', url: 'https://www.swellnet.com/surfcams/nsw/tamarama' },
    ] },
  { id: 'bronte',   name: 'Bronte',   region: 'sydney', lat: -33.9036, lon: 151.2699, facing: 100, bestDir: 110, dirWidth: 70, expoBase: 0.55, notes: 'Beach break, best on mid tide',
    cams: [
      { label: 'Swellnet (paid)', url: 'https://www.swellnet.com/surfcams/nsw/bronte' },
    ] },
  { id: 'maroubra', name: 'Maroubra', region: 'sydney', lat: -33.95,   lon: 151.257,  facing: 115, bestDir: 140, dirWidth: 90, expoBase: 1.0,  notes: 'Most swell-exposed; picks up everything',
    cams: [
      { label: 'Randwick beach cams (free)', url: RANDWICK_CAMS },
    ] },
  { id: 'manly',    name: 'Manly',    region: 'sydney', lat: -33.7930, lon: 151.2887, facing: 110, bestDir: 125, dirWidth: 80, expoBase: 0.65, notes: 'Long stretch Queenscliff to South Steyne; NE swell direct, S swell wraps in smaller',
    cams: [
      { label: 'Elysium Manly hotel (free)', url: 'https://www.elysiumhotels.com/manly/live-surf-cam' },
      { label: 'Surfline (free, ads)',       url: 'https://www.surfline.com/surf-report/manly-north-steyne/5d7ac1f48b90df000129e6ca' },
    ] },
  { id: 'deewhy',   name: 'Dee Why',  region: 'sydney', lat: -33.7515, lon: 151.2960, facing: 100, bestDir: 115, dirWidth: 80, expoBase: 0.85, notes: 'Point handles size at the south end; open beach break up north',
    cams: [
      { label: 'Surfline (free, ads)', url: 'https://www.surfline.com/surf-report/dee-why/5842041f4e65fad6a7708bfa' },
    ] },

  // Byron Bay. The bay beaches (Pass/Wategos/Main) face north and only get swell
  // wrapping around Cape Byron — smaller but cleaner; S–SW wind is offshore there.
  // Tallow side faces due east and cops everything.
  { id: 'thepass',  name: 'The Pass',   region: 'byron', lat: -28.6365, lon: 153.6270, facing: 355, bestDir: 100, dirWidth: 55, expoBase: 0.65, notes: 'World-class right point; swell wraps around the cape — smaller but perfect. Crowded.',
    cams: [
      { label: 'Surfline (free, ads)', url: 'https://www.surfline.com/surf-report/the-pass-byron-bay/5842041f4e65fad6a7708bef' },
    ] },
  { id: 'wategos',  name: 'Wategos',    region: 'byron', lat: -28.6355, lon: 153.6335, facing: 15,  bestDir: 80,  dirWidth: 55, expoBase: 0.6, notes: 'Mellow longboard rights tucked under Cape Byron',
    cams: [
      { label: 'Surfline (free, ads)', url: 'https://www.surfline.com/surf-report/wategos/584204204e65fad6a77092f2' },
    ] },
  { id: 'mainbyron', name: 'Main / Wreck', region: 'byron', lat: -28.6415, lon: 153.6115, facing: 0, bestDir: 60, dirWidth: 60, expoBase: 0.55, notes: 'The Wreck bombie throws punchy peaks right off town; needs E–NE swell',
    cams: [
      { label: 'Surfline (free, ads)', url: 'https://www.surfline.com/surf-report/main-beach-byron-bay/5fe0f932f167970e1d4c9516' },
    ] },
  { id: 'tallows',  name: 'Tallows',    region: 'byron', lat: -28.6580, lon: 153.6170, facing: 105, bestDir: 110, dirWidth: 85, expoBase: 1.0,  notes: 'The S-swell magnet south of the cape; best on NW wind — watch the sweep',
    cams: [
      { label: 'Surfline (free, ads)', url: 'https://www.surfline.com/surf-report/tallows/5842041f4e65fad6a7708c09' },
    ] },
  { id: 'suffolk',  name: 'Suffolk Park', region: 'byron', lat: -28.6900, lon: 153.6135, facing: 105, bestDir: 120, dirWidth: 85, expoBase: 0.9, notes: 'South Tallow banks, quieter than town',
    cams: [
      { label: 'Surfline (free, ads)', url: 'https://www.surfline.com/surf-report/suffolk-park/584204204e65fad6a77092f4' },
    ] },
  { id: 'brokenhead', name: 'Broken Head', region: 'byron', lat: -28.7075, lon: 153.6115, facing: 45, bestDir: 95, dirWidth: 65, expoBase: 0.55, notes: 'Sand-dependent right point; best on E swell and S wind — unforgettable when it lines up',
    cams: [
      { label: 'Surfline (free, ads)', url: 'https://www.surfline.com/surf-report/broken-head/5842041f4e65fad6a7708bf3' },
    ] },
];

export const SKILL_NAMES = ['Beginner', 'Intermediate', 'Experienced'];

// center: ideal effective break height (m); spread: gaussian width; windMult: wind-penalty sensitivity
export const SKILLS = {
  Beginner:     { center: 0.85, spread: 0.5, windMult: 1.3 },
  Intermediate: { center: 1.5,  spread: 0.8, windMult: 1.0 },
  Experienced:  { center: 2.2,  spread: 1.0, windMult: 0.85 },
};

export const TIMEZONE = 'Australia/Sydney';
