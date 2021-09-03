sap.ui.define(
  [
    'sap/base/Log', // prettier 방지용 주석
    'sap/ui/core/mvc/Controller',
    'sap/ui/core/routing/History',
    'sap/ui/core/UIComponent',
  ],
  (
    Log, // prettier 방지용 주석
    Controller,
    History,
    UIComponent
  ) => {
    'use strict';

    return Controller.extend('sap.ui.yesco.controller.BaseController', {
      /**
       * Convenience method for accessing the router in every controller of the application.
       * @public
       * @returns {sap.ui.core.routing.Router} the router for this component
       */
      getRouter() {
        // return this.getOwnerComponent().getRouter();
        return UIComponent.getRouterFor(this);
      },

      /**
       * Convenience method for getting the view model by name in every controller of the application.
       * @public
       * @param {string} sName the model name
       * @returns {sap.ui.model.Model} the model instance
       */
      getModel(sName) {
        return this.getView().getModel(sName);
      },

      /**
       * Convenience method for setting the view model in every controller of the application.
       * @public
       * @param {sap.ui.model.Model} oModel the model instance
       * @param {string} sName the model name
       * @returns {sap.ui.mvc.View} the view instance
       */
      setModel(oModel, sName) {
        return this.getView().setModel(oModel, sName);
      },

      /**
       * Convenience method for getting the resource bundle.
       * @public
       * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
       */
      getResourceBundle() {
        return this.getOwnerComponent().getModel('i18n').getResourceBundle();
      },

      /**
       * Event handler for navigating back.
       * It there is a history entry we go one step back in the browser history
       * If not, it will replace the current entry of the browser history with the master route.
       * @public
       */
      onNavBack() {
        const sPreviousHash = History.getInstance().getPreviousHash();

        if (sPreviousHash) {
          history.go(-1);
        } else {
          this.getRouter().navTo('appHome', {}, true);
        }
      },

      onDisplayNotFound() {
        // display the "notFound" target without changing the hash
        this.getRouter().getTargets().display('notFound', {
          fromTarget: 'home',
        });
      },

      debug(...args) {
        setTimeout(() => console.log(...args), 0);
      },
    });
  }
);
