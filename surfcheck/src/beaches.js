// Beach configuration. Adding a beach is a one-line change here.
// facing: shoreline-normal bearing (direction the beach looks toward, °true)
// bestDir: swell from-direction that lights the beach up
// dirWidth: tolerance (°) around bestDir before exposure falls off
// expoBase: how much open-ocean swell reaches the lineup (0–1)
export const BEACHES = [
  { id: 'bondi',    name: 'Bondi',    lat: -33.8908, lon: 151.2743, facing: 135, bestDir: 150, dirWidth: 75, expoBase: 0.7,  notes: 'South end more protected; handles S swell well',        webcam: 'https://www.swellnet.com/surfcams/nsw/bondi-beach' },
  { id: 'tamarama', name: 'Tamarama', lat: -33.9005, lon: 151.2703, facing: 120, bestDir: 130, dirWidth: 70, expoBase: 0.75, notes: 'Small bay, focuses swell, punchy shorebreak',            webcam: 'https://www.swellnet.com/surfcams/nsw/tamarama' },
  { id: 'bronte',   name: 'Bronte',   lat: -33.9036, lon: 151.2699, facing: 100, bestDir: 110, dirWidth: 70, expoBase: 0.55, notes: 'Beach break, best on mid tide',                          webcam: 'https://www.swellnet.com/surfcams/nsw/bronte' },
  { id: 'coogee',   name: 'Coogee',   lat: -33.9205, lon: 151.2585, facing: 110, bestDir: 120, dirWidth: 55, expoBase: 0.25, notes: 'Sheltered by Wedding Cake Island; needs bigger swell',   webcam: 'https://www.swellnet.com/surfcams/nsw/coogee' },
  { id: 'maroubra', name: 'Maroubra', lat: -33.95,   lon: 151.257,  facing: 115, bestDir: 140, dirWidth: 90, expoBase: 1.0,  notes: 'Most swell-exposed; picks up everything',                webcam: 'https://www.swellnet.com/surfcams/nsw/maroubra' },
];

export const SKILL_NAMES = ['Beginner', 'Intermediate', 'Experienced'];

// center: ideal effective break height (m); spread: gaussian width; windMult: wind-penalty sensitivity
export const SKILLS = {
  Beginner:     { center: 0.85, spread: 0.5, windMult: 1.3 },
  Intermediate: { center: 1.5,  spread: 0.8, windMult: 1.0 },
  Experienced:  { center: 2.2,  spread: 1.0, windMult: 0.85 },
};

export const TIMEZONE = 'Australia/Sydney';
