sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/Device',
    'sap/ui/core/UIComponent',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/ServiceManager',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/ErrorHandler',
    'sap/ui/yesco/mvc/model/MenuModel',
    'sap/ui/yesco/mvc/model/Models',
    'sap/ui/yesco/mvc/model/SessionModel',
    'sap/ui/yesco/mvc/model/AppointeeModel',
  ],
  (
    // prettier 방지용 주석
    Device,
    UIComponent,
    Filter,
    FilterOperator,
    JSONModel,
    AppUtils,
    ServiceManager,
    ServiceNames,
    ErrorHandler,
    MenuModel,
    Models,
    SessionModel,
    AppointeeModel
  ) => {
    'use strict';

    // class Component extends UIComponent 선언으로 실행하면 new 키워드 사용없이 invoke 할 수 없다는 에러가 발생함
    return UIComponent.extend('sap.ui.yesco.Component', {
      metadata: {
        manifest: 'json',
      },

      /**
       * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
       * In this method, the device models are set and the router is initialized.
       * @public
       * @override
       */
      init(...aArgs) {
        this.setDeviceModel() // 디바이스 모델 생성
          .setAppModel() // Busy indicator 값 저장 모델 생성
          .setMetadataModel()
          .setServiceModel() // S4HANA OData 서비스 모델 생성
          .setErrorHandler() // S4HANA ZHR_COMMON_SRV OData 서비스 Error handler 생성
          .setSessionModel() // 세션 정보 모델 생성
          .setAppointeeModel() // 대상자 정보 모델 생성
          .setMenuModel(); // 메뉴 정보 모델 생성

        // call the base component's init function and create the App view
        UIComponent.prototype.init.apply(this, aArgs);

        this.initRouter();
      },

      /**
       * 디바이스 모델 생성
       */
      setDeviceModel() {
        setTimeout(() => {
          this.setModel(Models.createDeviceModel(), 'device');
        });
        return this;
      },

      /**
       * Busy indicator 값 저장 모델 생성
       */
      setAppModel() {
        setTimeout(() => {
          this.setModel(new JSONModel({ isAppBusy: true, delay: 0, isAtHome: true }), 'appModel');
        });
        return this;
      },

      /**
       * Busy indicator 값 저장 모델 반환
       * @returns {object}
       */
      getAppModel() {
        return this.getModel('appModel');
      },

      setMetadataModel() {
        this.setModel(new JSONModel({}), 'metadataModel');
        return this;
      },

      getMetadataModel() {
        return this.getModel('metadataModel');
      },

      /**
       * S4HANA OData 서비스 모델 생성
       */
      setServiceModel() {
        const aServiceNames = ServiceManager.getServiceNames();
        const oMetadataModel = this.getMetadataModel();

        aServiceNames.forEach((sServiceName) => {
          const oServiceModel = ServiceManager.getODataModel(sServiceName);
          this.setModel(oServiceModel, sServiceName);
          oServiceModel.attachMetadataLoaded(() => {
            oMetadataModel.setProperty(`/${sServiceName}`, ServiceManager.getMetadata(oServiceModel));
          });
        });
        return this;
      },

      /**
       * S4HANA ZHR_COMMON_SRV OData 서비스 Error handler 생성
       */
      setErrorHandler() {
        setTimeout(() => {
          this._oErrorHandler = new ErrorHandler(this);
        });
        return this;
      },

      /**
       * 세션 정보 모델 생성
       */
      setSessionModel() {
        this.setModel(new SessionModel(this), 'sessionModel');
        return this;
      },

      /**
       * 세션 정보 모델 반환
       * @returns {object}
       */
      getSessionModel() {
        return this.getModel('sessionModel');
      },

      /**
       * 대상자 정보 모델 생성
       */
      setAppointeeModel() {
        this.setModel(new AppointeeModel(this), 'appointeeModel');
        return this;
      },

      /**
       * 대상자 정보 모델 반환
       * @returns {object}
       */
      getAppointeeModel() {
        return this.getModel('appointeeModel');
      },

      /**
       * 메뉴 모델 생성
       */
      setMenuModel() {
        this.setModel(new MenuModel(this), 'menuModel');
        return this;
      },

      /**
       * 메뉴 모델 반환
       * @public
       * @returns {object}
       */
      getMenuModel() {
        return this.getModel('menuModel');
      },

      /**
       * Convenience method for getting the resource bundle text.
       * @public
       * @param {...string} aArgs keys of resource bundle text.
       * @returns {string} The value belonging to the key, if found; otherwise the key itself.
       */
      getBundleText(...aArgs) {
        const sKey = aArgs.shift();
        const oResourceBundle = this.getModel('i18n').getResourceBundle();
        if (aArgs.length) {
          aArgs = aArgs.map((sArg) => {
            return /(^LABEL_)|(^MSG_)/.test(sArg) ? oResourceBundle.getText(sArg) : sArg;
          });
        }
        return oResourceBundle.getText(sKey, aArgs);
      },

      /**
       * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
       * design mode class should be set, which influences the size appearance of some controls.
       * @public
       * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
       */
      getContentDensityClass() {
        if (!Object.prototype.hasOwnProperty.call(this, '_sContentDensityClass')) {
          // check whether FLP has already set the content density class; do nothing in this case
          if (document.body.classList.contains('sapUiSizeCozy') || document.body.classList.contains('sapUiSizeCompact')) {
            this._sContentDensityClass = '';
          } else if (!Device.support.touch) {
            // apply "compact" mode if touch is not supported
            this._sContentDensityClass = 'sapUiSizeCompact';
          } else {
            // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
            this._sContentDensityClass = 'sapUiSizeCozy';
            this._sContentDensityClass = 'sapUiSizeCompact';
          }
        }
        return this._sContentDensityClass;
      },

      /**
       * Router 초기화 및 Routing event handler 처리
       */
      initRouter() {
        // create the views based on the url/hash
        const oRouter = this.getRouter();
        oRouter.initialize();

        // Router event handler 생성
        oRouter
          // .attachBeforeRouteMatched((oEvent) => {
          //   // Router.navTo 로 들어오는 경우에만 event 발생
          //   AppUtils.debug('beforeRouteMatched', oEvent.getParameters());
          // })
          .attachBypassed((oEvent) => {
            AppUtils.debug(`bypassed.`, oEvent);

            // do something here, i.e. send logging data to the back end for analysis
            // telling what resource the user tried to access...
            const sHash = oEvent.getParameter('hash');
            AppUtils.debug(`Sorry, but the hash '${sHash}' is invalid.`, 'The resource was not found.');
          })
          .attachRouteMatched((oEvent) => {
            AppUtils.debug('routeMatched', oEvent.getParameters());

            const mArguments = oEvent.getParameter('arguments');
            const mConfig = oEvent.getParameter('config');
            const oView = oEvent.getParameter('view');
            const oController = oView.getController();

            oView.setVisible(false);

            // 화면에서 사용될 Model들이 모두 초기화된 후 동작될 수 있도록 Promise 처리하여 변수로 저장
            this._oAllBaseModelReadyPromise = Promise.all([
              this.onSessionModelReady(), // prettier 방지용 주석
              this.onMenuModelReady({ mArguments, mConfig, oController }),
            ]).catch((oError) => {
              this.getRouter().getTargets().display('notFound', {
                from: 'home',
                error: oError,
              });
            });
          })
          .attachRoutePatternMatched(async (oEvent) => {
            AppUtils.debug('routePatternMatched', oEvent.getParameters());

            const mArguments = oEvent.getParameter('arguments');
            const oView = oEvent.getParameter('view');
            const oController = oView.getController();

            await this._oAllBaseModelReadyPromise;

            oView.setVisible(true); // 반드시 onObjectMatched 이전에 실행되야함

            if (oController && oController.onObjectMatched && typeof oController.onObjectMatched === 'function') {
              oController.onObjectMatched(mArguments);
            }
          });
        return this;
      },

      async onSessionModelReady() {
        return this.getAppointeeModel().getPromise();
      },

      async onMenuModelReady({ mArguments, mConfig, oController }) {
        await this.getMenuModel().getPromise();

        const sRouteName = mConfig.name;
        const [sRouteNameMain, sRouteNameSub] = sRouteName.split(/-/);

        return Promise.all([
          this._saveBreadcrumbsData({ mArguments, mConfig, sRouteNameMain, sRouteNameSub, oController }), //
          this._checkRouteName(sRouteNameMain, sRouteNameSub),
        ]);
      },

      /**
       * Breadcrumbs 정보 저장
       * @param {object} mArguments
       * @param {object} mConfig
       * @param {string} sRouteNameMain
       * @param {string} sRouteNameSub
       * @param {object} oController
       * @private
       */
      async _saveBreadcrumbsData({ mArguments, mConfig, sRouteNameMain, sRouteNameSub, oController }) {
        const oMenuModel = this.getMenuModel();

        if (sRouteNameMain === 'ehrHome') {
          oMenuModel.setCurrentMenuData({ routeName: sRouteNameMain, viewId: mConfig.target, menuId: '', currentLocationText: '', isSubRoute: false });
          return;
        }

        const sMenid = oMenuModel.getMenid(sRouteNameMain);
        if ((AppUtils.isLOCAL() || AppUtils.isDEV()) && /^X/.test(sMenid)) {
          oMenuModel.setCurrentMenuData({ routeName: '', viewId: '', menuId: '', currentLocationText: '', isSubRoute: true });
          return;
        }

        let sCurrentLocationText;
        if (oController && typeof oController.getCurrentLocationText === 'function') {
          sCurrentLocationText = oController.getCurrentLocationText(mArguments);
        }

        oMenuModel.setCurrentMenuData({
          routeName: sRouteNameMain,
          viewId: mConfig.target,
          menuId: sMenid,
          currentLocationText: sCurrentLocationText || '',
          isSubRoute: !!sRouteNameSub,
        });
      },

      /**
       * 메뉴 권한 체크
       * @private
       * @param {string} sRouteNameMain
       */
      async _checkRouteName(sRouteNameMain) {
        // do something, i.e. send usage statistics to back end
        // in order to improve our app and the user experience (Build-Measure-Learn cycle)
        // AppUtils.debug(`User accessed route ${sRouteName}, timestamp = ${new Date().getTime()}`);

        if (sRouteNameMain === 'ehrHome') {
          return;
        }

        const sMenid = this.getMenuModel().getMenid(sRouteNameMain);
        if ((AppUtils.isLOCAL() || AppUtils.isDEV()) && /^X/.test(sMenid)) {
          return;
        }

        return new Promise((resolve, reject) => {
          const sUrl = '/GetMenuidRoleSet';
          this.getModel(ServiceNames.COMMON).read(sUrl, {
            filters: [
              // prettier 방지용 주석
              new Filter('Menid', FilterOperator.EQ, sMenid),
            ],
            success: (oData, oResponse) => {
              AppUtils.debug(`${sUrl} success.`, oData, oResponse);

              resolve(); // TODO : Code 구분해서 reject
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              reject(oError);
            },
          });
        });
      },

      reduceViewResource() {
        const sCurrentMenuViewId = this.getMenuModel().getCurrentMenuViewId();
        const oView = this.byId(sCurrentMenuViewId);

        if (oView) {
          oView.setVisible(false);
        }
      },

      /**
       * The component is destroyed by UI5 automatically.
       * In this method, the ErrorHandler are destroyed.
       * @public
       * @override
       */
      destroy(...aArgs) {
        this._oErrorHandler.destroy();

        // call the base component's destroy function
        UIComponent.prototype.destroy.apply(this, aArgs);
      },
    });
  }
);
