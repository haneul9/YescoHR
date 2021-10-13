sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/CustomData',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/JSONModelHelper',
    'sap/ui/yesco/control/HomeMenuItem',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/extension/lodash',
    'sap/ui/yesco/extension/moment',
  ],
  (
    // prettier 방지용 주석
    CustomData,
    JSONModel,
    AppUtils,
    JSONModelHelper,
    HomeMenuItem,
    BaseController,
    lodashjs,
    momentjs
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.controller.App', {
      onInit() {
        // Moment, Lodash test
        // const day = moment();
        // this.debug(day); // BaseController에 선언됨

        // this.debug('lodash');
        // this.debug(_.join(['1', '2', '3'], '~'));
        // this.debug('lodash');

        // this.debug(AppUtils.getDevice());

        const iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

        const oAppViewModel = new JSONModel({
          busy: false,
          delay: 0,
        });
        this.setModel(oAppViewModel, 'appView');

        const fnSetAppNotBusy = function fnSetAppNotBusy() {
          oAppViewModel.setProperty('/busy', false);
          oAppViewModel.setProperty('/delay', iOriginalBusyDelay);
        };

        // since then() has no "reject"-path attach to the MetadataFailed-Event to disable the busy indicator in case of an error
        // const oCommonModel = this.getOwnerComponent().getModel();
        // oCommonModel.attachMetadataLoaded(fnSetAppNotBusy).attachMetadataFailed(fnSetAppNotBusy);

        // const oBenefitModel = this.getOwnerComponent().getModel('benefit');

        // apply content density mode to root view
        this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

        const oCommonModel = this.getOwnerComponent().getModel();
        const sUrl = '/GetMenuLvSet';
        oCommonModel.create(
          sUrl,
          {
            Pernr: '50007',
            Werks: '1000',
            Rolid: '',
            Langu: '',
            Device: '',
            GetMenuLv1Nav: [],
            GetMenuLv2Nav: [],
            GetMenuLv3Nav: [],
            GetMenuLv4Nav: [],
          },
          {
            success: (oData, oResponse) => {
              this.debug(`${sUrl} success.`, oData, oResponse);

              const GetMenuLv1Nav = oData.GetMenuLv1Nav.results;
              this.buildHomeMenu(GetMenuLv1Nav).then(() => this.setProperty('/busy', false));
            },
            error: (...args) => {
              this.debug(...[`${sUrl} error.`, ...args]);
            },
          }
        );

        // const oHomeMenuModel = new JSONModelHelper(sap.ui.require.toUrl('sap/ui/yesco/localService/topMenuData.json'));
        // const oHomeMenuModel = new JSONModelHelper({
        //   busy: true,
        //   delay: 0,
        // });
        // this.byId('homeMenu').setModel(oHomeMenuModel);

        // oHomeMenuModel
        //   .setUrl('localService/homeMenuData.json')
        //   .setMerge(true)
        //   .setController(this)
        //   .attachRequestCompleted(function (...args) {
        //     this.debug('oHomeMenuModel.attachRequestCompleted', this.getData(), args);

        //     this.getController()
        //       .buildHomeMenu(this.getResult().items)
        //       .then(() => this.setProperty('/busy', false));
        //   })
        //   .attachRequestFailed(function (...args) {
        //     this.debug('oHomeMenuModel.attachRequestFailed', args);
        //   })
        //   .load();
      },

      buildHomeMenu(menus = []) {
        return new Promise((resolve) => {
          const homeMenu = this.byId('homeMenu');

          if (!menus.length) {
            homeMenu.insertContent(new Label({ text: '조회된 메뉴가 없습니다.' }), 2);
            resolve();
            return;
          }

          // Home menu 생성
          menus.forEach((menu, i) => {
            const homeMenuItem = new HomeMenuItem({
              text: menu.Mnnm1,
              customData: new CustomData({ key: 'menuProperties', value: menu }),
            });
            homeMenu.insertContent(homeMenuItem, i + 2); // Home logo, ToolbarSpacer 이후부터 menu 추가
          });

          resolve();
        });
      },

      onHomePress() {
        // var iconTabHeader = this.byId('iconTabHeader');
        // iconTabHeader.setSelectedKey('invalidKey');

        // var label = this.byId('labelId');
        // label.setText('Home Screen');
        this.getRouter().navTo('appHome');

        // TODO : master 전환 후 callback 호출 필요(ex: localStorage, sessionStorage, global temporary variables/functions 등 제거 callback)
      },

      onSelectTab(event) {
        // var label = this.byId('labelId');
        const tab = event.getParameter('item');

        // label.setText(tab.getText());
      },

      navigateTo(event) {
        // var label = this.byId('labelId');
        // this.getRouter().navTo(label);
      },

      navigateToHome(event) {
        this.getRouter().navTo('appHome');
      },

      navigateToCarousel(event) {
        this.getRouter().navTo('carousel');
      },

      navigateToPage1(event) {
        this.getRouter().navTo('page1');
      },

      navigateToPage2(event) {
        this.getRouter().navTo('page2');
      },

      navigateToUserForm(event) {
        this.getRouter().navTo('userform');
      },

      navigateToAppConfig(event) {
        this.getRouter().navTo('appconfig');
      },

      navigateToRouting(event) {
        this.getRouter().navTo('page1');
      },

      onUserNamePress() {},
    });
  }
);
