var CACHE_NAME = 'em-service-worker';
var version = 'v1::';
var urlsToCache = [
  // '/',
  // '/sw.js',
  // '/bundle.js',
  // '/stylesheets/global.css',
  // '/manifest.json',
  '/images/abundance.png',
  '/images/abundance100.png',
  '/images/adaptability.png',
  '/images/adaptability100.png',
  '/images/advanced.png',
  '/images/advanced100.png',
  '/images/advancedback.png',
  '/images/advancedback100.png',
  '/images/artificialintelligence.png',
  '/images/artificialintelligence100.png',
  '/images/blueproductionzoneicon.png',
  '/images/bureaucracy.png',
  '/images/bureaucracy100.png',
  '/images/colonize.png',
  '/images/colonize100.png',
  '/images/colonizeicon.png',
  '/images/colonizeicon100.png',
  '/images/datanetwork.png',
  '/images/datanetwork100.png',
  '/images/dissension.png',
  '/images/dissension100.png',
  '/images/diversemarkets.png',
  '/images/diversemarkets100.png',
  '/images/embackground.png',
  '/images/EMbutton.png',
  '/images/EMbutton200.png',
  '/images/fertile.png',
  '/images/fertile100.png',
  '/images/fertileback.png',
  '/images/fertileback100.png',
  '/images/fertilegrounds.png',
  '/images/fertilegrounds100.png',
  '/images/geneticengineering.png',
  '/images/geneticengineering100.png',
  '/images/greenproductionzoneicon.png',
  '/images/handsizeicon.png',
  '/images/handsizeicon100.png',
  '/images/hyperefficiency.png',
  '/images/hyperefficiency100.png',
  '/images/imperialism.png',
  '/images/imperialism100.png',
  '/images/improvedcolonizerc.png',
  '/images/improvedcolonizerc100.png',
  '/images/improvedcolonizesc.png',
  '/images/improvedcolonizesc100.png',
  '/images/improvedcolonizetc.png',
  '/images/improvedcolonizetc100.png',
  '/images/improvedcolonizewc.png',
  '/images/improvedcolonizewc100.png',
  '/images/improvedproductionrp.png',
  '/images/improvedproductionrp100.png',
  '/images/improvedproductionsp.png',
  '/images/improvedproductionsp100.png',
  '/images/improvedproductiontp.png',
  '/images/improvedproductiontp100.png',
  '/images/improvedproductionwp.png',
  '/images/improvedproductionwp100.png',
  '/images/improvedresearchcr.png',
  '/images/improvedresearchcr100.png',
  '/images/improvedresearchpr.png',
  '/images/improvedresearchpr100.png',
  '/images/improvedresearchsr.png',
  '/images/improvedresearchsr100.png',
  '/images/improvedresearchwr.png',
  '/images/improvedresearchwr100.png',
  '/images/improvedsurveycs.png',
  '/images/improvedsurveycs100.png',
  '/images/improvedsurveyps.png',
  '/images/improvedsurveyps100.png',
  '/images/improvedsurveyrs.png',
  '/images/improvedsurveyrs100.png',
  '/images/improvedsurveyts.png',
  '/images/improvedsurveyts100.png',
  '/images/improvedtradect.png',
  '/images/improvedtradect100.png',
  '/images/improvedtradept.png',
  '/images/improvedtradept100.png',
  '/images/improvedtradest.png',
  '/images/improvedtradest100.png',
  '/images/improvedtradewt.png',
  '/images/improvedtradewt100.png',
  '/images/improvedwarfarecw.png',
  '/images/improvedwarfarecw100.png',
  '/images/improvedwarfarepw.png',
  '/images/improvedwarfarepw100.png',
  '/images/improvedwarfarerw.png',
  '/images/improvedwarfarerw100.png',
  '/images/improvedwarfaretw.png',
  '/images/improvedwarfaretw100.png',
  '/images/influenceicon.png',
  '/images/influenceicon100.png',
  '/images/logistics.png',
  '/images/logistics100.png',
  '/images/metallic.png',
  '/images/metallic100.png',
  '/images/metallicback.png',
  '/images/metallicback100.png',
  '/images/mobilization.png',
  '/images/mobilization100.png',
  '/images/politics.png',
  '/images/politics100.png',
  '/images/produceicon.png',
  '/images/produceicon100.png',
  '/images/producetrade.png',
  '/images/producetrade100.png',
  '/images/producetradeempty.png',
  '/images/productivity.png',
  '/images/productivity100.png',
  '/images/purpleproductionzoneicon.png',
  '/images/redproductionzoneicon.png',
  '/images/research.png',
  '/images/research100.png',
  '/images/researchempty.png',
  '/images/researchicon.png',
  '/images/researchicon100.png',
  '/images/scorchedearthpolicy.png',
  '/images/scorchedearthpolicy100.png',
  '/images/specialization.png',
  '/images/specialization100.png',
  '/images/streamlining.png',
  '/images/streamlining100.png',
  '/images/survey.png',
  '/images/survey100.png',
  '/images/surveyicon.png',
  '/images/surveyicon100.png',
  '/images/surveyteam.png',
  '/images/surveyteam100.png',
  '/images/terraforming.png',
  '/images/terraforming100.png',
  '/images/tradeicon.png',
  '/images/tradeicon100.png',
  '/images/warfare.png',
  '/images/warfare100.png',
  '/images/warfareicon.png',
  '/images/warfareicon100.png',
  '/images/warpath.PNG',
  '/images/warpath100.png',
  '/images/weaponemporium.png',
  '/images/weaponemporium100.png',
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(version+CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request)//.then(function(cache) {
        // console.log(event.request);
        // return cache.match(event.request).then(function (response) {
          // return response || fetch(event.request).then(function(response) {
            // cache.put(event.request, response.clone());
            // return response;
          // });
        // });
         .then(function(response) {
           // Cache hit - return response
           if (response) {
             console.log('hit');
             return response;
           }
           return fetch(event.request);
      })
    );
  });

  self.addEventListener("activate", function(event) {
    /* Just like with the install event, event.waitUntil blocks activate on a promise.
       Activation will fail unless the promise is fulfilled.
    */
    console.log('WORKER: activate event in progress.');
  
    event.waitUntil(
      caches
        /* This method returns a promise which will resolve to an array of available
           cache keys.
        */
        .keys()
        .then(function (keys) {
          // We return a promise that settles when all outdated caches are deleted.
          return Promise.all(
            keys
              .filter(function (key) {
                // Filter by keys that don't start with the latest version prefix.
                return !key.startsWith(version);
              })
              .map(function (key) {
                /* Return a promise that's fulfilled
                   when each outdated cache is deleted.
                */
                return caches.delete(key);
              })
          );
        })
        .then(function() {
          console.log('WORKER: activate completed.');
        })
    );
  });