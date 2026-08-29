// Beach configuration. Adding a beach is a one-line change here.
// region: which REGIONS entry it belongs to (the app shows one region at a time)
// facing: shoreline-normal bearing (direction the beach looks toward, °true)
// bestDir: swell from-direction that lights the beach up
// dirWidth: tolerance (°) around bestDir before exposure falls off
// expoBase: how much open-ocean swell reaches the lineup (0–1)
// cams: surfcam links, free/no-login ones first
// tz drives all times for the region (API requests, NOW line, day boundaries).
// sharks: whether our NSW SharkSmart/Dorsal pipeline covers the area.
export const REGIONS = [
  { id: 'sydney', name: 'Sydney',    sub: 'Eastern Suburbs & Northern Beaches', tz: 'Australia/Sydney', sharks: true },
  { id: 'byron',  name: 'Byron Bay', sub: 'Cape Byron & Tallow',                tz: 'Australia/Sydney', sharks: true },
  { id: 'canggu', name: 'Canggu',    sub: 'Bali · Pererenan to Berawa',         tz: 'Asia/Makassar',    sharks: false },
];
export const regionOf = beach => REGIONS.find(r => r.id === beach.region);

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

  // Canggu, Bali. The whole strip faces SW into relentless Indian Ocean
  // groundswell; E–NE is offshore (glassy mornings, SE trades turn it side-shore
  // by afternoon in the dry season).
  { id: 'batubolong', name: 'Batu Bolong', region: 'canggu', lat: -8.6598, lon: 115.1300, facing: 225, bestDir: 225, dirWidth: 70, expoBase: 0.7, notes: "Old Man's — long, slow, forgiving peaks over reef; logger heaven, crowd factory",
    cams: [
      { label: 'Balicams (free)',      url: 'https://balicams.com/camera/batunolong' },
      { label: 'Surfline (free, ads)', url: 'https://www.surfline.com/surf-report/old-mans-batu-bolong/605112930a374f33cf5f8f05' },
    ] },
  { id: 'berawa',     name: 'Berawa',      region: 'canggu', lat: -8.6683, lon: 115.1477, facing: 220, bestDir: 220, dirWidth: 70, expoBase: 0.9, notes: 'Punchy beachbreak peaks; the intermediate pick of the strip',
    cams: [
      { label: 'Surfline (free, ads)', url: 'https://www.surfline.com/surf-report/berawa-beach/6051139a7c51e500d72c538e' },
    ] },
  { id: 'echobeach',  name: 'Echo Beach',  region: 'canggu', lat: -8.6555, lon: 115.1225, facing: 230, bestDir: 225, dirWidth: 70, expoBase: 1.0, notes: 'The main act — powerful peaks and a long left over reef; handles size',
    cams: [
      { label: 'Surfline (free, ads)', url: 'https://www.surfline.com/surf-report/canggu/5842041f4e65fad6a7708d40' },
    ] },
  { id: 'pererenan',  name: 'Pererenan',   region: 'canggu', lat: -8.6510, lon: 115.1160, facing: 230, bestDir: 225, dirWidth: 70, expoBase: 1.0, notes: 'River-mouth peaks north of Echo; heavier, with more room to breathe',
    cams: [
      { label: 'Surfline (free, ads)', url: 'https://www.surfline.com/surf-report/pererenan/6269dc2c491aa9ad66235f52' },
    ] },
];

export const SKILL_NAMES = ['Beginner', 'Intermediate', 'Experienced'];

// center: ideal effective break height (m); spread: gaussian width; windMult: wind-penalty sensitivity
export const SKILLS = {
  Beginner:     { center: 0.85, spread: 0.5, windMult: 1.3 },
  Intermediate: { center: 1.5,  spread: 0.8, windMult: 1.0 },
  Experienced:  { center: 2.2,  spread: 1.0, windMult: 0.85 },
};

