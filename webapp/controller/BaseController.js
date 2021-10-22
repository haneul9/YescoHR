sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/mvc/Controller',
    'sap/ui/core/routing/History',
    'sap/ui/core/UIComponent',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    Controller,
    History,
    UIComponent,
    AppUtils
  ) => {
    'use strict';

    class BaseController extends Controller {
      onInit() {
        this.debug('BaseController.onInit');

        const delegateEvents = {};
        if (typeof this.onBeforeShow === 'function') {
          delegateEvents.onBeforeShow = this.onBeforeShow;
        }
        if (typeof this.onAfterShow === 'function') {
          delegateEvents.onAfterShow = this.onAfterShow;
        }
        if (delegateEvents.onBeforeShow || delegateEvents.onAfterShow) {
          this.getView().addEventDelegate(delegateEvents, this);
        }
      }

      /**
       * Convenience method for accessing the router in every controller of the application.
       * @public
       * @returns {sap.ui.core.routing.Router} the router for this component
       */
      getRouter() {
        // return this.getOwnerComponent().getRouter();
        return UIComponent.getRouterFor(this);
      }

      /**
       * Service URL for Model
       * @public
       * @param {string} sServiceName a service name. e.g. ZHR_COMMON_SRV
       * @param {object} oUIComponent component object. e.g. this.getOwnerComponent()
       * @returns {string} a service URL. e.g. /sap/opu/odata/sap/ZHR_COMMON_SRV
       */
      getServiceUrl(...args) {
        return AppUtils.getServiceUrl(...args);
      }

      /**
       * Convenience method for setting the view model in every controller of the application.
       * @public
       * @param {sap.ui.model.Model} oModel the model instance
       * @param {string} sName the model name
       * @returns {sap.ui.mvc.View} the view instance
       */
      setViewModel(oModel, sName) {
        return this.getView().setModel(oModel, sName);
      }

      /**
       * Convenience method for getting the view model by name in every controller of the application.
       * @public
       * @param {string} sName the model name
       * @returns {sap.ui.model.Model} the model instance
       */
      getViewModel(sName) {
        return this.getView().getModel(sName);
      }

      /**
       * Convenience method for getting the component model by name in every controller of the application.
       * @public
       * @param {string} sName the model name
       * @returns {sap.ui.model.Model} the model instance
       */
      getModel(sName) {
        return this.getOwnerComponent().getModel(sName);
      }

      /**
       * Convenience method for getting the resource bundle.
       * @public
       * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
       */
      getResourceBundle() {
        return this.getOwnerComponent().getModel('i18n').getResourceBundle();
      }

      /**
       * Convenience method for getting the resource bundle text.
       * @public
       * @returns {string} The value belonging to the key, if found; otherwise the key itself.
       */
      getText(...aArgs) {
        const sKey = aArgs.shift();
        return this.getResourceBundle().getText(sKey, aArgs);
      }

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
          this.getRouter().navTo('ehrHome', {}, true);
        }
      }

      onDisplayNotFound() {
        // display the "notFound" target without changing the hash
        this.getRouter().getTargets().display('notFound', {
          fromTarget: 'home',
        });
      }

      /**
       * Convenience method for logging.
       * @protected
       */
      debug(...args) {
        AppUtils.debug(...args);
        return this;
      }
    }

    return BaseController;
  }
);
