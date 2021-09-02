sap.ui.define(
  [
    'sap/m/MessageBox', // prettier 방지용 주석
    'sap/ui/base/Object',
  ],
  (
    MessageBox, // prettier 방지용 주석
    BaseObject
  ) => {
    'use strict';

    return BaseObject.extend('sap.ui.yesco.controller.ErrorHandler', {
      /**
       * Handles application errors by automatically attaching to the model events and displaying errors when needed.
       * @class
       * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
       * @public
       * @alias sap.ui.yesco.controller.ErrorHandler
       */
      constructor: function (oComponent) {
        this._oResourceBundle = oComponent.getModel('i18n').getResourceBundle();
        this._oComponent = oComponent;
        this._oModel = oComponent.getModel();
        this._bMessageOpen = false;
        this._sErrorText = this._oResourceBundle.getText('errorText');

        this._oModel.attachMetadataFailed((oEvent) => {
          const oParams = oEvent.getParameters();
          this._showServiceError(oParams.response);
        }, this);

        this._oModel.attachRequestFailed((oEvent) => {
          const oParams = oEvent.getParameters();
          // An entity that was not found in the service is also throwing a 404 error in oData.
          // We already cover this case with a notFound target so we skip it here.
          // A request that cannot be sent to the server is a technical error that we have to handle though
          if (oParams.response.statusCode !== '404' || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf('Cannot POST') === 0)) {
            this._showServiceError(oParams.response);
          }
        }, this);
      },

      /**
       * Shows a {@link sap.m.MessageBox} when a service call has failed.
       * Only the first error message will be display.
       * @param {string} sDetails a technical error to be displayed on request
       * @private
       */
      _showServiceError(sDetails) {
        if (this._bMessageOpen) {
          return;
        }
        this._bMessageOpen = true;

        MessageBox.error(this._sErrorText, {
          id: 'serviceErrorMessageBox',
          details: sDetails,
          styleClass: this._oComponent.getContentDensityClass(),
          actions: [MessageBox.Action.CLOSE],
          onClose: () => {
            this._bMessageOpen = false;
          },
        });
      },
    });
  }
);
