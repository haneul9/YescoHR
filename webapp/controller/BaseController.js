sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/UIComponent',
    'sap/ui/core/mvc/Controller',
    'sap/ui/core/routing/History',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    UIComponent,
    Controller,
    History,
    AppUtils
  ) => {
    'use strict';

    class BaseController extends Controller {
      onInit() {
        this.debug('BaseController.onInit');

        // 각 업무 controller에서는 onInit overriding 대신 onBeforeShow, onAfterShow를 사용할 것
        this.getView().addEventDelegate(
          {
            onBeforeShow: this.onBeforeShow,
            onAfterShow: this.onAfterShow,
          },
          this
        );
      }

      onBeforeShow() {
        this.debug('BaseController.onBeforeShow');
      }

      onAfterShow() {
        this.debug('BaseController.onAfterShow');

        if (!!this.byId('InfoMegBox')) {
          if (!!this.getViewModel().getProperty('/InfoMessage')) {
            this.byId('InfoMegBox').setVisible(true);
          } else {
            this.byId('InfoMegBox').setVisible(false);
          }
        }
        AppUtils.setAppBusy(false).setMenuBusy(false);
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
          window.history.go(-1);
        } else {
          this.getRouter().navTo('ehrHome', {}, true /* no history */);
        }
      }

      navToNotFound() {
        // display the "notFound" target without changing the hash
        this.getRouter().getTargets().display('notFound', {
          from: 'home',
        });
      }

      /**
       * Convenience method for logging.
       * @protected
       */
      debug(...aArgs) {
        AppUtils.debug(...aArgs);
        return this;
      }
    }

    return BaseController;
  }
);
