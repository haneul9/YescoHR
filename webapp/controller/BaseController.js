sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/UIComponent',
    'sap/ui/core/mvc/Controller',
    'sap/ui/core/routing/History',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/AppUtils',
  ],
  (
    // prettier 방지용 주석
    UIComponent,
    Controller,
    History,
    Filter,
    FilterOperator,
    AppUtils
  ) => {
    'use strict';

    class BaseController extends Controller {
      onInit() {
        this.debug('BaseController.onInit');

        this.getRouter()
          // .attachBeforeRouteMatched((oEvent) => {
          //   // Router.navTo 로 들어오는 경우에만 event 발생
          //   this.debug('beforeRouteMatched', oEvent.getParameters());
          // })
          .attachBypassed((oEvent) => {
            this.debug('bypassed', oEvent);

            // do something here, i.e. send logging data to the back end for analysis
            // telling what resource the user tried to access...
            var sHash = oEvent.getParameter('hash');
            this.debug(`Sorry, but the hash '${sHash}' is invalid.`, 'The resource was not found.');
          })
          .attachRouteMatched((oEvent) => {
            this.debug('routeMatched', oEvent);

            const oView = oEvent.getParameter('view');
            oView.setVisible(false);

            // 메뉴 권한 체크
            const sUrl = '/GetMenuidRoleSet';
            this.getModel('common').read(sUrl, {
              filters: [
                // prettier 방지용 주석
                new Filter('Menid', FilterOperator.EQ, '7000'), // TODO : Menid 찾기
              ],
              success: (oData, oResponse) => {
                this.debug(`${sUrl} success.`, oData, oResponse);

                oView.setVisible(true);
              },
              error: (oError) => {
                this.debug(`${sUrl} error.`, oError);

                this.getRouter().getTargets().display('notFound', { from: 'home' });
              },
            });

            // do something, i.e. send usage statistics to back end
            // in order to improve our app and the user experience (Build-Measure-Learn cycle)
            var sRouteName = oEvent.getParameter('name');
            this.debug(`User accessed route ${sRouteName}, timestamp = ${new Date().getTime()}`);
          })
          .attachRoutePatternMatched((oEvent) => {
            this.debug('routePatternMatched', oEvent);
          });

        // Routing 체크를 강제하기 위해 각 업무 controller에서는 onInit overriding을 사용하지 않도록 함
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

        AppUtils.setAppBusy(false, this).setMenuBusy(false, this);
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
      debug(...args) {
        AppUtils.debug(...args);
        return this;
      }
    }

    return BaseController;
  }
);
