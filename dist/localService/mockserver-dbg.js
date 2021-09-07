sap.ui.define(
  [
    'sap/ui/core/util/MockServer', // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/base/Log',
    'sap/base/util/UriParameters',
  ],
  (
    MockServer, // prettier 방지용 주석
    JSONModel,
    Log,
    UriParameters
  ) => {
    'use strict';

    let oMockServer;
    const _sAppPath = 'sap/ui/yesco/';
    const _sJsonFilesPath = _sAppPath + 'localService/mockdata';
    const oMockServerInterface = {
      /**
       * Initializes the mock server asynchronously.
       * You can configure the delay with the URL parameter "serverDelay".
       * The local mock data in this folder is returned instead of the real data for testing.
       * @protected
       * @param {object} [oOptions] init parameters for the mockserver
       * @returns {Promise} a promise that is resolved when the mock server has been started
       */
      init(oOptions = {}) {
        return new Promise((fnResolve, fnReject) => {
          const sManifestUrl = sap.ui.require.toUrl(_sAppPath + 'manifest.json');
          const oManifestModel = new JSONModel(sManifestUrl);

          oManifestModel.attachRequestCompleted(() => {
            const oUriParameters = new UriParameters(window.location.href);
            // parse manifest for local metadata URI
            const sJsonFilesUrl = sap.ui.require.toUrl(_sJsonFilesPath);
            const oMainDataSource = oManifestModel.getProperty('/sap.app/dataSources/mainService');
            const sMetadataUrl = sap.ui.require.toUrl(_sAppPath + oMainDataSource.settings.localUri);
            // ensure there is a trailing slash
            let sMockServerUrl = /.*\/$/.test(oMainDataSource.uri) ? oMainDataSource.uri : oMainDataSource.uri + '/';
            // ensure the URL to be relative to the application
            sMockServerUrl = sMockServerUrl && new URI(sMockServerUrl).absoluteTo(sap.ui.require.toUrl(_sAppPath)).toString();

            // create a mock server instance or stop the existing one to reinitialize
            if (!oMockServer) {
              oMockServer = new MockServer({ rootUri: sMockServerUrl });
            } else {
              oMockServer.stop();
            }

            // configure mock server with the given options or a default delay of 0.5s
            MockServer.config({
              autoRespond: true,
              autoRespondAfter: oOptions.delay || oUriParameters.get('serverDelay') || 500,
            });

            // simulate all requests using mock data
            oMockServer.simulate(sMetadataUrl, {
              sMockdataBaseUrl: sJsonFilesUrl,
              bGenerateMissingMockData: true,
            });

            const aRequests = oMockServer.getRequests();

            // compose an error response for each request
            const fnResponse = (iErrCode, sMessage, aRequest) => {
              aRequest.response = (oXhr) => {
                oXhr.respond(iErrCode, { 'Content-Type': 'text/plain;charset=utf-8' }, sMessage);
              };
            };

            // simulate metadata errors
            if (oOptions.metadataError || oUriParameters.get('metadataError')) {
              aRequests.forEach((aEntry) => {
                if (aEntry.path.toString().indexOf('$metadata') > -1) {
                  fnResponse(500, 'metadata Error', aEntry);
                }
              });
            }

            // simulate request errors
            const sErrorParam = oOptions.errorType || oUriParameters.get('errorType');
            const iErrorCode = sErrorParam === 'badRequest' ? 400 : 500;
            if (sErrorParam) {
              aRequests.forEach((aEntry) => {
                fnResponse(iErrorCode, sErrorParam, aEntry);
              });
            }

            // custom mock behaviour may be added here

            // set requests and start the server
            oMockServer.setRequests(aRequests);
            oMockServer.start();

            Log.info('Running the app with mock data');
            fnResolve();
          });

          oManifestModel.attachRequestFailed(function () {
            var sError = 'Failed to load application manifest';

            Log.error(sError);
            fnReject(new Error(sError));
          });
        });
      },

      /**
       * @public returns the mockserver of the app, should be used in integration tests
       * @returns {sap.ui.core.util.MockServer} the mockserver instance
       */
      getMockServer() {
        return oMockServer;
      },
    };

    return oMockServerInterface;
  }
);
