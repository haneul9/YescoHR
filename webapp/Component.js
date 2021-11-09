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
    'sap/ui/yesco/controller/ErrorHandler',
    'sap/ui/yesco/model/MenuModel',
    'sap/ui/yesco/model/Models',
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
    Models
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
        // 디바이스 모델 생성
        this.setDeviceModel();

        // Busy indicator 값 저장 모델 생성
        this.setAppModel();

        // S4HANA OData 서비스 모델 생성
        this.setServiceModel();

        // Error handler 생성
        this.setErrorHandler();

        // 세션 모델 생성
        this.setSessionModel();

        // 메뉴 모델 생성
        this.setMenuModel();

        // call the base component's init function and create the App view
        UIComponent.prototype.init.apply(this, aArgs);

        // create the views based on the url/hash
        const oRouter = this.getRouter();
        oRouter.initialize();

        // Router event handler 생성
        this.attachRoutingEvents(oRouter);
      },

      setErrorHandler() {
        this._oErrorHandler = new ErrorHandler(this);
      },

      setDeviceModel() {
        setTimeout(() => {
          this.setModel(Models.createDeviceModel(), 'device');
        });
      },

      setAppModel() {
        setTimeout(() => {
          this.setModel(new JSONModel({ isAppBusy: true, delay: 0, isAtHome: true }), 'appModel');
        });
      },

      setServiceModel() {
        const aServiceNames = ServiceManager.getServiceNames();
        aServiceNames.forEach((sServiceName) => {
          const oServiceModel = ServiceManager.getODataModel(sServiceName);
          this.setModel(oServiceModel, sServiceName);
        });
      },

      setSessionModel() {
        setTimeout(() => {
          const sUrl = '/EmpLoginInfoSet';
          this.getModel(ServiceNames.COMMON).read(sUrl, {
            success: (oData, oResponse) => {
              AppUtils.debug(`${sUrl} success.`, oData, oResponse);

              const mSessionData = (oData.results || [])[0] || {};
              delete mSessionData.__metadata;

              let sTextCode;
              if (mSessionData.Werks === '1000') {
                sTextCode = 'LABEL_01002';
              } else if (mSessionData.Werks === '2000') {
                sTextCode = 'LABEL_01003';
              } else if (mSessionData.Werks === '3000') {
                sTextCode = 'LABEL_01004';
              } else {
                sTextCode = 'LABEL_01001';
              }
              mSessionData.CompanyName = this.getModel('i18n').getResourceBundle().getText(sTextCode);

              this.setModel(new JSONModel(mSessionData), 'sessionModel');
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              this.setModel(new JSONModel({ CompanyName: this.getModel('i18n').getResourceBundle().getText('LABEL_01001') }), 'sessionModel');
            },
          });
        });
      },

      setMenuModel() {
        this.setModel(new MenuModel(this), 'menuModel');
      },

      getMenuModel() {
        return this.getModel('menuModel');
      },

      getMenuTree() {
        return this.getModel('menuModel').getProperty('/tree');
      },

      attachRoutingEvents(oRouter) {
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

            const oView = oEvent.getParameter('view');
            oView.setVisible(false);

            // do something, i.e. send usage statistics to back end
            // in order to improve our app and the user experience (Build-Measure-Learn cycle)
            const sRouteName = oEvent.getParameter('name');
            AppUtils.debug(`User accessed route ${sRouteName}, timestamp = ${new Date().getTime()}`);

            this.checkRouteName(sRouteName.split(/-/)[0])
              .then(() => {
                oView.setVisible(true);
              })
              .catch(() => {
                this.getRouter().getTargets().display('notFound', {
                  from: 'home',
                });
              });
          })
          .attachRoutePatternMatched((oEvent) => {
            AppUtils.debug('routePatternMatched', oEvent.getParameters());
          });
      },

      checkRouteName(sRouteName) {
        const oMenuModel = this.getMenuModel();

        return oMenuModel.getPromise().then(() => {
          return new Promise((resolve, reject) => {
            if (sRouteName === 'ehrHome') {
              resolve();
              return;
            }

            const sMenid = oMenuModel.getMenid(sRouteName);
            if ((AppUtils.isLOCAL() || AppUtils.isDEV()) && /^X/.test(sMenid)) {
              resolve();
              return;
            }

            // 메뉴 권한 체크
            const sUrl = '/GetMenuidRoleSet';
            this.getModel(ServiceNames.COMMON).read(sUrl, {
              filters: [
                // prettier 방지용 주석
                new Filter('Menid', FilterOperator.EQ, sMenid),
              ],
              success: (oData, oResponse) => {
                AppUtils.debug(`${sUrl} success.`, oData, oResponse);

                resolve();
              },
              error: (oError) => {
                AppUtils.debug(`${sUrl} error.`, oError);

                reject();
              },
            });
          });
        });
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
          }
        }
        return this._sContentDensityClass;
      },
    });
  }
);
